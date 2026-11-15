import {ChildProcess} from "node:child_process";
import {existsSync} from "node:fs";
import Logger from "../lib/Logger";
import {IpcMainEvent} from "electron";

import {
    discardFile,
    mergeSegment,
    parseTimemark,
    partPathFor,
    probeDurationSeconds,
    supportsCheckpointResume
} from "./TaskSegments";

/**
 * 暂停时等待 ffmpeg 自行收尾的上限。收到 stdin 的 'q' 后它要把缓冲区写完、补上索引
 * （moov 被放到文件尾的 mp4 还要整文件回写），大文件这一步不是一瞬间的事。
 */
const PAUSE_GRACE_MS: number = 15_000;

/** 强杀后等待系统释放文件句柄的时间，Windows 上删得太快会失败。 */
const FORCE_KILL_SETTLE_MS: number = 2_000;

/** 停止后任务记录还要留多久，用来吃掉迟到的 end/error 回调。 */
const LATE_CALLBACK_WINDOW_MS: number = PAUSE_GRACE_MS + FORCE_KILL_SETTLE_MS + 5_000;

export interface ITaskOptions {
    /** 源媒体总时长（秒），未知时传 0 */
    totalSeconds: number;
    /** 从 startSeconds 起把下一段写入 partPath；缺省即该任务不可暂停 */
    restart?: (startSeconds: number, partPath: string) => void | Promise<void>;
}

interface ITaskProcess {
    pid: number;
    process?: ChildProcess;
    isPaused: boolean;
    inputPath?: string;
    outputPath?: string;
    mediaInfo?: IMediaInfo;
    ctx?: IpcMainEvent;
    /** 当前正在写入的文件；没有子进程在写时为 undefined */
    partPath?: string;
    /** 已经并回 outputPath 的源文件秒数，同时是续转 -ss 的起点 */
    startSeconds: number;
    /** 已写出的分段序号，用于生成分段文件名 */
    partSeq: number;
    /** 最近一次上报的百分比，用于日志与进度单调性保护 */
    lastPercent: number;
    restart?: (startSeconds: number, partPath: string) => void | Promise<void>;
    totalSeconds: number;
    resumable: boolean;
    /** 暂停流程进行中，用于合并重复点击 */
    pausing?: Promise<boolean>;
}

/**
 * @class TaskManager
 * @author ayuanlmo
 * @description 跨平台的 Ffmpeg 任务进程管理器
 *
 * 暂停采用检查点续转而不是挂起进程：向 stdin 写 'q' 让 ffmpeg 正常收尾，记下这一段真实写出的
 * 秒数，恢复时用 -ss 从该秒数接着转，最后用 concat demuxer 拼回产物。挂起进程需要
 * NtSuspendProcess / PowerShell Suspend-Process 这类未公开或旁路手段，既过不了商店审查，
 * 进程被系统回收时同样只会留下没有索引、打不开的文件。
 */
class TaskManager {
    private tasks: Map<string, ITaskProcess> = new Map();

    /**
     * Register task (called when ffmpeg command is created)
     */
    public registerTask(
        taskId: string,
        mediaInfo: IMediaInfo,
        inputPath: string,
        outputPath: string,
        ctx: IpcMainEvent,
        options: ITaskOptions
    ): void {
        const existingTask = this.tasks.get(taskId);

        // Warn if task exists and not paused (allow continue for resume scenario)
        if (existingTask && !existingTask.isPaused)
            Logger.warn(`Task ${taskId} already registered and not paused, but continuing anyway (likely resume)`);

        this.tasks.set(taskId, {
            pid: 0,
            isPaused: false,
            inputPath,
            outputPath,
            mediaInfo,
            ctx,
            partPath: outputPath,
            startSeconds: 0,
            partSeq: 0,
            lastPercent: 0,
            restart: options.restart,
            totalSeconds: options.totalSeconds,
            resumable: Boolean(options.restart) && supportsCheckpointResume(outputPath, options.totalSeconds),
            pausing: undefined
        });
    }

    /**
     * Attach process PID (called after ffmpeg starts)
     */
    public attachPid(taskId: string, pid: number, process?: ChildProcess): void {
        const task = this.tasks.get(taskId);

        if (!task) {
            Logger.warn(`Task ${taskId} not found when attaching PID`);
            return;
        }

        // 停止指令可能抢在子进程出现之前落到（registerTask 与 spawn 之间的那几个 tick）。
        // 不补这一刀的话，"已停止"回执之后 ffmpeg 照样跑完，凭空留下半个产物。
        // isPaused + 不可续转 是取消独有的组合：暂停在不可续转任务上会被直接拒绝。
        if (task.isPaused && !task.resumable && process) {
            Logger.warn(`Task ${taskId} spawned after being cancelled, killing it and discarding output`);
            process.once('close', (): void => discardFile(task.outputPath));
            process.kill('SIGKILL');
            return;
        }

        task.pid = pid;
        if (process) {
            task.process = process;
        }
    }

    /**
     * @method progressOf
     * @param {string} taskId
     * @param {string} [timemark] - ffmpeg 进度里的 time= 值
     * @param {number} percent - fluent-ffmpeg 自己算出的百分比
     * @returns {number}
     * @description 续转分段的 time= 从本段起点算起，直接用 percent 会让进度条从 30% 掉回 0%。
     * 已完成秒数 + 本段秒数才是源文件上的全局进度；取不到 time= 时退回检查点值，保证不回退。
     * **/
    public progressOf(taskId: string, timemark: string | undefined, percent: number): number {
        const task = this.tasks.get(taskId);

        if (!task || task.startSeconds <= 0 || task.totalSeconds <= 0) return percent;

        const segmentSeconds: number = parseTimemark(timemark) ?? 0;
        const global: number = Math.round(((task.startSeconds + segmentSeconds) / task.totalSeconds) * 100);

        task.lastPercent = Math.max(task.lastPercent, Math.min(global, 99));

        return task.lastPercent;
    }

    /**
     * Pause task: 让 ffmpeg 收尾退出，把已完成的分段并回产物并记下续转点
     */
    public pauseTask(taskId: string): Promise<boolean> {
        const task = this.tasks.get(taskId);

        if (!task) {
            Logger.warn(`Task ${taskId} not found when pausing`);
            return Promise.resolve(false);
        }

        if (task.isPaused) {
            Logger.warn(`Task ${taskId} is already paused`);
            return Promise.resolve(false);
        }

        // 连点暂停时共用同一次收尾流程
        if (task.pausing) return task.pausing;

        if (!task.resumable) {
            Logger.warn(`Task ${taskId} cannot be checkpointed (stream copy, unknown duration or un-stitchable container), pause refused`);
            // 拒绝得有声音：否则按下暂停什么都没发生，用户只会以为程序卡住
            task.ctx?.reply('main:on:error', {
                type: 'task-pause-unsupported',
                message: 'This task is a remux or its duration is unknown, so it cannot be paused.',
                mediaFile: task.inputPath
            });
            return Promise.resolve(false);
        }

        if (!task.process || task.process.exitCode !== null) {
            Logger.warn(`Task ${taskId} has no running process to pause`);
            return Promise.resolve(false);
        }

        task.pausing = this.pauseSegment(taskId, task).finally((): void => {
            task.pausing = undefined;
        });

        return task.pausing;
    }

    private async pauseSegment(taskId: string, task: ITaskProcess): Promise<boolean> {
        const proc: ChildProcess = task.process as ChildProcess;
        const partPath: string = task.partPath ?? (task.outputPath as string);

        // 先置位再收尾：'q' 之后 ffmpeg 以退出码 0 正常结束，
        // 转码回调里的 isPaused 判断依赖它跳过"任务完成"上报。
        task.isPaused = true;

        const graceful: boolean = await this.stopGracefully(taskId, proc);

        if (!graceful)
            Logger.error(`Task ${taskId} did not exit within ${PAUSE_GRACE_MS / 1000}s and was killed; its index is gone`);

        // 只有自然收尾的分段才有完整索引，探测不到时长就说明这一段不可用
        const written: number = graceful ? await probeDurationSeconds(partPath) : 0;

        task.partPath = undefined;
        task.process = undefined;
        task.pid = 0;

        if (written <= 0) {
            // 还没写出一帧就暂停（或被打断）：此刻产物只是个打不开的半截文件，删掉后从 0 重来
            discardFile(partPath);
            task.startSeconds = 0;
            Logger.info(`Task ${taskId} paused with nothing preserved, resume will restart from 0`);
            return true;
        }

        if (partPath === task.outputPath) {
            // 第一段本来就写在产物路径上，它自身已是完整可播放的片段，无需合并
            task.startSeconds = written;
            Logger.info(`Task ${taskId} paused at ${written.toFixed(2)}s (${Math.round((written / task.totalSeconds) * 100)}%)`);
            return true;
        }

        try {
            await mergeSegment(task.outputPath as string, partPath, task.outputPath as string);
            task.startSeconds += written;
            Logger.info(`Task ${taskId} paused at ${task.startSeconds.toFixed(2)}s (${Math.round((task.startSeconds / task.totalSeconds) * 100)}%)`);
        } catch (e) {
            // 合并失败不该吞掉已有成果：丢掉本段，恢复时从上一个检查点重转
            discardFile(partPath);
            task.ctx?.reply('main:on:error', {
                type: 'task-segment-merge-failed',
                message: `The last ${written.toFixed(1)}s could not be merged and will be re-encoded.`,
                mediaFile: task.inputPath
            });
            Logger.error(`Task ${taskId} failed to merge the paused segment: ${(e as Error).message}`);
        }

        return true;
    }

    /**
     * @method stopGracefully
     * @description 请 ffmpeg 自己结束并等它退出，超时才升级为强杀——被强杀的 mp4 没有 moov，
     * 只能当废段处理，所以这里宁可多等。
     * **/
    private stopGracefully(taskId: string, proc: ChildProcess): Promise<boolean> {
        return new Promise<boolean>((resolve): void => {
            let settled = false;

            const finish = (graceful: boolean): void => {
                if (settled) return;
                settled = true;
                clearTimeout(graceTimer);
                resolve(graceful);
            };

            const onExit = (): void => finish(true);

            const onKilled = (): void => {
                // 句柄还没释放就删文件，Windows 会直接失败
                setTimeout((): void => finish(false), FORCE_KILL_SETTLE_MS);
            };

            const graceTimer = setTimeout((): void => {
                Logger.warn(`Task ${taskId} is still running after the pause grace period, killing it`);
                proc.removeListener('close', onExit);
                proc.once('close', onKilled);

                try {
                    proc.kill('SIGKILL');
                } catch (e) {
                    Logger.error(`Task ${taskId} could not be killed: ${(e as Error).message}`);
                    finish(false);
                }
            }, PAUSE_GRACE_MS);

            proc.once('close', onExit);

            // ffmpeg 可能已经自己退出，此时写 stdin 只会抛 EPIPE
            proc.stdin?.once('error', (e: Error): void => {
                Logger.warn(`Task ${taskId} stdin closed before pause: ${e.message}`);
            });

            try {
                proc.stdin?.write('q\n');
            } catch (e) {
                Logger.warn(`Task ${taskId} graceful quit failed: ${(e as Error).message}`);
            }
        });
    }

    /**
     * Resume task: 从检查点起开一个新的续转分段
     */
    public async resumeTask(taskId: string): Promise<boolean> {
        const task = this.tasks.get(taskId);

        if (!task) {
            Logger.warn(`Task ${taskId} not found when resuming`);
            return false;
        }

        if (!task.isPaused) {
            Logger.warn(`Task ${taskId} is not paused`);
            return false;
        }

        if (task.pausing) {
            Logger.warn(`Task ${taskId} is still finishing its pause`);
            return false;
        }

        if (!task.restart || !task.outputPath) {
            Logger.warn(`Task ${taskId} has no checkpoint restart hook`);
            return false;
        }

        const outputPath: string = task.outputPath;
        const startSeconds: number = task.startSeconds;

        // 已有成品片段时必须写到新分段，直接写 outputPath 会把它截断
        task.partPath = startSeconds > 0 ? partPathFor(outputPath, ++task.partSeq) : outputPath;
        task.isPaused = false;

        try {
            await task.restart(startSeconds, task.partPath);
            Logger.info(`Task ${taskId} resumed from ${startSeconds.toFixed(2)}s into ${task.partPath}`);
            return true;
        } catch (e) {
            task.isPaused = true;
            task.partPath = undefined;
            Logger.error(`Task ${taskId} failed to resume: ${(e as Error).message}`);
            return false;
        }
    }

    /**
     * @method cancelTask
     * @param {string} taskId
     * @returns {Promise<boolean>}
     * @description 停止任务：请 ffmpeg 收尾后把这次产出全部丢掉（分段 + 已拼好的前段）。
     * 停止要的是"别再占着机器和文件"，而不是留下半个打不开的文件。
     *
     * 这里复用 isPaused 作为"这次退出不是完成"的闸门：fluent-ffmpeg 在 spawn 时就注册了
     * close 监听，早于 stopGracefully 里的那个，所以 end/error 回调一定先看到闸门并安静返回，
     * 轮不到它去上报成功。任务记录故意保留（标记为不可续转），避免清理后迟到的回调
     * 查不到状态、再补一条自相矛盾的失败事件。
     * **/
    public async cancelTask(taskId: string): Promise<boolean> {
        const task = this.tasks.get(taskId);

        if (!task) {
            Logger.warn(`Task ${taskId} not found when cancelling`);
            return false;
        }

        const proc: ChildProcess | undefined = task.process;

        task.isPaused = true;
        task.resumable = false;
        task.restart = undefined;

        if (proc && proc.exitCode === null)
            await this.stopGracefully(taskId, proc);

        discardFile(task.partPath);
        discardFile(task.outputPath);

        task.partPath = undefined;
        task.process = undefined;
        task.pid = 0;

        task.ctx?.reply('main:on:task-end', {
            id: taskId,
            progress: 100,
            path: null,
            baseName: task.mediaInfo?.baseName ?? '',
            error: true,
            errorMessage: 'The task was stopped.'
        });

        Logger.info(`Task ${taskId} cancelled and its partial output discarded`);

        // 记录留着是为了挡住迟到的 end/error 回调；留够时间后删掉，否则每次停止都在表里留一条。
        // unref 让它绝不成为拖住退出的原因。
        setTimeout((): void => {
            if (this.tasks.get(taskId) === task)
                this.cleanup(taskId);
        }, LATE_CALLBACK_WINDOW_MS).unref();

        return true;
    }

    /**
     * @method finalize
     * @param {string} taskId
     * @returns {Promise<void>}
     * @description 转码结束回调里把最后一个分段并回产物。没有分段时是空操作，
     * 因此从未暂停过的任务走的仍是原来那条一次性写出的路径。
     * 合并失败会抛出：此刻产物只是上一个完整片段，不能被当成转换成功。
     * **/
    public async finalize(taskId: string): Promise<void> {
        const task = this.tasks.get(taskId);

        if (!task) return;

        const partPath: string | undefined = task.partPath;

        task.partPath = undefined;

        if (!partPath || !task.outputPath || partPath === task.outputPath) return;

        if (!existsSync(task.outputPath)) {
            // 暂停时拼好的前段被移走或删掉了，只剩尾巴一段，不值得为它假装成功
            Logger.warn(`Task ${taskId} lost its checkpoint prefix ${task.outputPath}`);
            discardFile(partPath);
            return;
        }

        await mergeSegment(task.outputPath, partPath, task.outputPath);
    }

    /**
     * Check if task is paused
     */
    public isPaused(taskId: string): boolean {
        const task = this.tasks.get(taskId);

        return task?.isPaused ?? false;
    }

    /**
     * Cleanup task (called when task ends or errors)
     */
    public cleanup(taskId: string): void {
        this.tasks.delete(taskId);
        Logger.info(`Task ${taskId} cleaned up`);
    }

    /**
     * Terminate every live ffmpeg child process.
     *
     * Asks ffmpeg to finish writing before dying: an mp4 truncated by SIGKILL has no moov
     * atom and is unplayable. Node cannot deliver Ctrl+C to a Windows child, so 'q' on stdin
     * is the only graceful path there. graceMs === 0 skips the wait and kills synchronously,
     * needed before app.exit() because pending timers die with the process.
     *
     * 退出时不会再有人做拼接，续转分段只能作废；用户保留的是上次暂停时已经拼进产物的那段。
     */
    public killAll(graceMs: number = 2000): void {
        this.tasks.forEach((task: ITaskProcess, taskId: string): void => {
            const proc = task.process;
            const orphan: string | undefined = task.partPath && task.partPath !== task.outputPath
                ? task.partPath
                : undefined;

            if (!proc || proc.exitCode !== null) {
                if (orphan) discardFile(orphan);
                return;
            }

            try {
                proc.stdin?.once('error', (): void => undefined);
                proc.stdin?.write('q');
                Logger.info(`Task ${taskId} asked to finish gracefully`);
            } catch (e) {
                Logger.warn(`Task ${taskId} graceful quit failed:`, (e as Error).message);
            }

            const forceKill = (): void => {
                if (proc.exitCode !== null) return;
                try {
                    proc.kill('SIGKILL');
                    Logger.warn(`Task ${taskId} force killed on shutdown`);
                } catch (e) {
                    Logger.error(`Task ${taskId} could not be killed:`, (e as Error).message);
                }
            };

            if (orphan) {
                if (graceMs <= 0)
                    discardFile(orphan);
                else
                    proc.once('close', (): void => discardFile(orphan));
            }

            if (graceMs <= 0)
                forceKill();
            else
                setTimeout(forceKill, graceMs);
        });

        this.tasks.clear();
    }
}

export default new TaskManager();
