import {ChildProcess} from "node:child_process";
import * as os from "node:os";
import Logger from "../lib/Logger";
import {IpcMainEvent} from "electron";

interface ITaskProcess {
    pid: number;
    process?: ChildProcess;
    isPaused: boolean;
    // 暂停时保存的信息
    pausedAt?: number; // 暂停时的进度百分比
    inputPath?: string;
    outputPath?: string;
    mediaInfo?: IMediaInfo;
    ctx?: IpcMainEvent;
    ffmpegCommand?: any; // fluent-ffmpeg 命令对象
}

/**
 * @class TaskManager
 * @author ayuanlmo
 * @description 跨平台的 Ffmpeg 任务进程管理器
 */
class TaskManager {
    private tasks: Map<string, ITaskProcess> = new Map();

    /**
     * 注册任务（在创建 ffmpeg 命令时调用）
     */
    public registerTask(taskId: string, mediaInfo: IMediaInfo, inputPath: string, outputPath: string, ctx: IpcMainEvent, ffmpegCommand?: any): void {
        const existingTask = this.tasks.get(taskId);

        // 如果任务已存在且不是暂停状态，则警告（但允许继续，因为可能是重新启动）
        if (existingTask && !existingTask.isPaused)
            Logger.warn(`Task ${taskId} already registered and not paused, but continuing anyway (likely resume)`);

        // 更新或创建任务信息
        this.tasks.set(taskId, {
            pid: 0,
            isPaused: false,
            inputPath,
            outputPath,
            mediaInfo,
            ctx,
            ffmpegCommand,
            pausedAt: undefined // 不再保留进度，因为不使用 -ss 参数
        });
    }

    /**
     * 附加进程 PID（在 ffmpeg 启动后调用）
     */
    public attachPid(taskId: string, pid: number, process?: ChildProcess): void {
        const task = this.tasks.get(taskId);

        if (!task) {
            Logger.warn(`Task ${taskId} not found when attaching PID`);
            return;
        }
        task.pid = pid;
        if (process) {
            task.process = process;
        }
    }

    /**
     * 更新任务进度（用于暂停时保存进度）
     */
    public updateProgress(taskId: string, progress: number): void {
        const task = this.tasks.get(taskId);

        if (task) {
            task.pausedAt = progress;
        }
    }

    /**
     * 暂停任务：停止进程，保存进度
     */
    public async pauseTask(taskId: string): Promise<boolean> {
        const task = this.tasks.get(taskId);

        if (!task) {
            Logger.warn(`Task ${taskId} not found when pausing`);
            return false;
        }

        if (task.isPaused) {
            Logger.warn(`Task ${taskId} is already paused`);
            return false;
        }

        if (!task.process) {
            Logger.warn(`Task ${taskId} has no process to pause`);
            return false;
        }

        try {
            const platform = os.platform();

            // 先设置暂停标志
            task.isPaused = true;

            if (platform === 'win32') {
                // Windows: 使用 PowerShell 暂停进程
                // 注意：Suspend-Process 可能需要管理员权限，但通常不需要
                const {exec} = await import('node:child_process');

                return new Promise<boolean>((resolve) => {
                    // 使用 -NoProfile 和 -NonInteractive 避免 PowerShell 启动延迟
                    exec(`powershell -NoProfile -NonInteractive -Command "Suspend-Process -Id ${task.pid} -ErrorAction Stop"`, (error, stdout, stderr) => {
                        if (error) {
                            Logger.error(`Failed to suspend process on Windows for task ${taskId}:`, error.message);
                            Logger.error(`PowerShell stderr: ${stderr}`);
                            // 如果暂停失败，恢复暂停标志，不杀死进程
                            task.isPaused = false;
                            resolve(false);
                        } else {
                            Logger.info(`Task ${taskId} paused (PID: ${task.pid}, progress: ${task.pausedAt ?? 0}%)`);
                            resolve(true);
                        }
                    });
                });
            }
            // macOS/Linux: 使用 SIGSTOP 暂停进程（必须保持进程，只是暂停执行）
            try {
                task.process.kill('SIGSTOP');
                Logger.info(`Task ${taskId} paused (PID: ${task.pid}, progress: ${task.pausedAt ?? 0}%)`);
                return true;
            } catch (killError) {
                // 如果发送信号失败，恢复暂停标志
                task.isPaused = false;
                Logger.error(`Failed to send SIGSTOP to task ${taskId}:`, killError);
                return false;
            }

        } catch (error) {
            // 如果暂停失败，恢复暂停标志
            task.isPaused = false;
            Logger.error(`Failed to pause task ${taskId}:`, error);
            return false;
        }
    }

    /**
     * 恢复任务：恢复暂停的进程
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

        if (!task.process) {
            Logger.warn(`Task ${taskId} has no process to resume`);
            // 如果进程不存在，可能需要重新启动
            if (task.mediaInfo && task.inputPath && task.outputPath && task.ctx) {
                Logger.info(`Task ${taskId} process not found, restarting from beginning`);
                const TransformVideo = (await import('./TransformVideo')).default;
                const TransformAudio = (await import('./TransformAudio')).default;

                if (task.mediaInfo.isVideo) {
                    TransformVideo.transformVideoMedia(task.mediaInfo, task.ctx);
                } else if (task.mediaInfo.isAudio) {
                    TransformAudio.transformAudioMedia(task.mediaInfo, task.ctx);
                }
                task.isPaused = false;
                task.pausedAt = undefined;
                return true;
            }
            return false;
        }

        try {
            const platform = os.platform();

            if (platform === 'win32') {
                // Windows: 使用 PowerShell 恢复进程
                const {exec} = await import('node:child_process');
                return new Promise<boolean>((resolve) => {
                    exec(`powershell -NoProfile -NonInteractive -Command "Resume-Process -Id ${task.pid} -ErrorAction Stop"`, (error, stdout, stderr) => {
                        if (error) {
                            Logger.error(`Failed to resume task ${taskId} on Windows:`, error.message);
                            Logger.error(`PowerShell stderr: ${stderr}`);
                            resolve(false);
                        } else {
                            task.isPaused = false;
                            Logger.info(`Task ${taskId} resumed (PID: ${task.pid})`);
                            resolve(true);
                        }
                    });
                });
            } else {
                // macOS/Linux: 使用 SIGCONT 恢复进程
                try {
                    task.process.kill('SIGCONT');
                    task.isPaused = false;
                    Logger.info(`Task ${taskId} resumed (PID: ${task.pid})`);
                    return true;
                } catch (killError) {
                    Logger.error(`Failed to send SIGCONT to task ${taskId}:`, killError);
                    return false;
                }
            }
        } catch (error) {
            Logger.error(`Failed to resume task ${taskId}:`, error);
            return false;
        }
    }

    /**
     * 检查任务是否暂停
     */
    public isPaused(taskId: string): boolean {
        const task = this.tasks.get(taskId);

        return task?.isPaused ?? false;
    }

    /**
     * 获取任务的暂停信息
     */
    public getTaskInfo(taskId: string): ITaskProcess | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * 清理任务（在任务结束或出错时调用）
     */
    public cleanup(taskId: string): void {
        this.tasks.delete(taskId);
        Logger.info(`Task ${taskId} cleaned up`);
    }
}

export default new TaskManager();
