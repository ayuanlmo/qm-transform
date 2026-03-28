import {ChildProcess} from "node:child_process";
import * as os from "node:os";
import Logger from "../lib/Logger";
import {IpcMainEvent} from "electron";

interface ITaskProcess {
    pid: number;
    process?: ChildProcess;
    isPaused: boolean;
    /** Progress percentage when paused */
    pausedAt?: number;
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
     * Register task (called when ffmpeg command is created)
     */
    public registerTask(taskId: string, mediaInfo: IMediaInfo, inputPath: string, outputPath: string, ctx: IpcMainEvent, ffmpegCommand?: any): void {
        const existingTask = this.tasks.get(taskId);

        // Warn if task exists and not paused (allow continue for resume scenario)
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
            pausedAt: undefined
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
        task.pid = pid;
        if (process) {
            task.process = process;
        }
    }

    /**
     * Update task progress (saved when pausing)
     */
    public updateProgress(taskId: string, progress: number): void {
        const task = this.tasks.get(taskId);

        if (task) {
            task.pausedAt = progress;
        }
    }

    /**
     * Pause task: suspend process, save progress
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

            task.isPaused = true;

            if (platform === 'win32') {
                // Windows: use ntsuspend (NtSuspendProcess) - more reliable than PowerShell Suspend-Process
                // PowerShell's Suspend-Process can fail silently with processes that have files open (e.g. ffmpeg)
                // Load via non-literal module id so tsc emits require(s), not require('ntsuspend'). Static analyzers
                // (e.g. electron-builder) would otherwise require ntsuspend on macOS where it is optional / absent.
                try {
                    const ntsuspendPkg = 'nt' + 'suspend';
                    const ntsuspend = await import(ntsuspendPkg);

                    if (ntsuspend && typeof ntsuspend.suspend === 'function') {
                        const ok = ntsuspend.suspend(task.pid);

                        if (ok) {
                            Logger.info(`Task ${taskId} paused (PID: ${task.pid}, progress: ${task.pausedAt ?? 0}%)`);
                            return true;
                        }
                        Logger.error(`ntsuspend.suspend returned false for task ${taskId} PID ${task.pid}`);
                    }
                } catch (ntErr) {
                    Logger.warn(`ntsuspend not available, falling back to PowerShell:`, (ntErr as Error).message);
                }
                // Fallback: PowerShell Suspend-Process (may not work reliably with ffmpeg)
                const {exec} = await import('node:child_process');

                return new Promise<boolean>((resolve) => {
                    exec(`powershell -NoProfile -NonInteractive -Command "Suspend-Process -Id ${task.pid} -ErrorAction Stop"`, (error, stdout, stderr) => {
                        if (error) {
                            Logger.error(`Failed to suspend process on Windows for task ${taskId}:`, error.message);
                            Logger.error(`PowerShell stderr: ${stderr}`);
                            task.isPaused = false;
                            resolve(false);
                        } else {
                            Logger.info(`Task ${taskId} paused (PID: ${task.pid}, progress: ${task.pausedAt ?? 0}%)`);
                            resolve(true);
                        }
                    });
                });
            }
            // macOS/Linux: use SIGSTOP to suspend process
            try {
                task.process.kill('SIGSTOP');
                Logger.info(`Task ${taskId} paused (PID: ${task.pid}, progress: ${task.pausedAt ?? 0}%)`);
                return true;
            } catch (killError) {
                task.isPaused = false;
                Logger.error(`Failed to send SIGSTOP to task ${taskId}:`, killError);
                return false;
            }

        } catch (error) {
            // Restore pause flag on failure
            task.isPaused = false;
            Logger.error(`Failed to pause task ${taskId}:`, error);
            return false;
        }
    }

    /**
     * Resume task: resume suspended process
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
            // Restart if process no longer exists
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
                // Windows: use ntsuspend (NtResumeProcess) - more reliable than PowerShell Resume-Process
                try {
                    const ntsuspendPkg = 'nt' + 'suspend';
                    const ntsuspend = await import(ntsuspendPkg);

                    if (ntsuspend && typeof ntsuspend.resume === 'function') {
                        const ok = ntsuspend.resume(task.pid);

                        if (ok) {
                            task.isPaused = false;
                            Logger.info(`Task ${taskId} resumed (PID: ${task.pid})`);
                            return true;
                        }
                        Logger.error(`ntsuspend.resume returned false for task ${taskId} PID ${task.pid}`);
                    }
                } catch (ntErr) {
                    Logger.warn(`ntsuspend not available for resume, falling back to PowerShell:`, (ntErr as Error).message);
                }
                // Fallback: PowerShell Resume-Process (may not work reliably)
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
            }
            // macOS/Linux: use SIGCONT to resume process
            try {
                task.process.kill('SIGCONT');
                task.isPaused = false;
                Logger.info(`Task ${taskId} resumed (PID: ${task.pid})`);
                return true;
            } catch (killError) {
                Logger.error(`Failed to send SIGCONT to task ${taskId}:`, killError);
                return false;
            }

        } catch (error) {
            Logger.error(`Failed to resume task ${taskId}:`, error);
            return false;
        }
    }

    /**
     * Check if task is paused
     */
    public isPaused(taskId: string): boolean {
        const task = this.tasks.get(taskId);

        return task?.isPaused ?? false;
    }

    /**
     * Get task info
     */
    public getTaskInfo(taskId: string): ITaskProcess | undefined {
        return this.tasks.get(taskId);
    }

    /**
     * Cleanup task (called when task ends or errors)
     */
    public cleanup(taskId: string): void {
        this.tasks.delete(taskId);
        Logger.info(`Task ${taskId} cleaned up`);
    }
}

export default new TaskManager();
