/**
 * @class TaskIpc
 * @constructor
 * @author ayuanlmo
 * @description Task-related IPC handlers
 */
import {ipcMain, IpcMainEvent} from "electron";
import TransformVideo from "../bin/TransformVideo";
import TransformAudio from "../bin/TransformAudio";
import ConcatVideo, {IConcatPayload} from "../bin/ConcatVideo";
import taskManager from "../bin/TaskManager";
import Logger from "../lib/Logger";

const guard = (
    ctx: IpcMainEvent,
    taskId: string,
    baseName: string,
    mediaFile: string,
    run: () => void | Promise<void>
): void => {
    const reportError = (e: unknown): void => {
        const message: string = (e as Error)?.message ?? String(e);

        Logger.error(`[TaskIpc] failed to start task ${taskId}: ${message}`);
        ctx.reply('main:on:error', {type: 'task-create-failed', message, mediaFile});
        ctx.reply('main:on:task-end', {id: taskId, error: true, baseName, errorMessage: message});
    };

    try {
        const started: void | Promise<void> = run();

        if (started && typeof (started as Promise<void>).catch === 'function')
            (started as Promise<void>).catch(reportError);
    } catch (e) {
        reportError(e);
    }
};

class TaskIpc {
    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        ipcMain.on('main:on:task-create:video-media-transform', (ctx: IpcMainEvent, mediaInfo: IMediaInfo): void => {
            guard(ctx, mediaInfo?.id ?? '', mediaInfo?.baseName ?? '', mediaInfo?.fullPath ?? '',
                (): Promise<void> => TransformVideo.transformVideoMedia(mediaInfo, ctx));
        });
        ipcMain.on('main:on:task-create:audio-media-transform', (ctx: IpcMainEvent, mediaInfo: IMediaInfo): void => {
            guard(ctx, mediaInfo?.id ?? '', mediaInfo?.baseName ?? '', mediaInfo?.fullPath ?? '', (): void => {
                TransformAudio.transformAudioMedia(mediaInfo, ctx);
            });
        });
        ipcMain.on('main:on:task-create:video-concat', (ctx: IpcMainEvent, payload: IConcatPayload): void => {
            const mediaFile: string = payload?.items?.[0]?.fullPath ?? '';

            guard(ctx, payload?.concatTaskId ?? '', '', mediaFile, (): void => {
                ConcatVideo.concat(payload, ctx);
            });
        });
        ipcMain.on('main:on:task-pause', async (ctx: IpcMainEvent, taskId: string): Promise<void> => {
            const success: boolean = await taskManager.pauseTask(taskId);

            ctx.reply('main:on:task-paused', {id: taskId, success});
        });
        ipcMain.on('main:on:task-resume', async (ctx: IpcMainEvent, taskId: string): Promise<void> => {
            const success: boolean = await taskManager.resumeTask(taskId);

            ctx.reply('main:on:task-resumed', {id: taskId, success});
        });
        ipcMain.on('main:on:task-cancel', async (ctx: IpcMainEvent, taskId: string): Promise<void> => {
            const success: boolean = await taskManager.cancelTask(taskId);

            ctx.reply('main:on:task-cancelled', {id: taskId, success});
        });
    }
}

export default TaskIpc;
