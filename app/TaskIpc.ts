/**
 * @class TaskIpc
 * @constructor
 * @author ayuanlmo
 * @description 任务相关IPC
 *
 * **/
import {ipcMain, IpcMainEvent} from "electron";
import TransformVideo from "../bin/TransformVideo";
import TransformAudio from "../bin/TransformAudio";
import taskManager from "../bin/TaskManager";

class TaskIpc {
    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        ipcMain.on('main:on:task-create:video-media-transform', (ctx: IpcMainEvent, mediaInfo: IMediaInfo): void => {
            TransformVideo.transformVideoMedia(mediaInfo, ctx);
        });
        ipcMain.on('main:on:task-create:audio-media-transform', (ctx: IpcMainEvent, mediaInfo: IMediaInfo): void => {
            TransformAudio.transformAudioMedia(mediaInfo, ctx);
        });
        ipcMain.on('main:on:task-pause', async (ctx: IpcMainEvent, taskId: string): Promise<void> => {
            const success: boolean = await taskManager.pauseTask(taskId);

            if (success)
                ctx.reply('main:on:task-paused', {id: taskId});
        });
        ipcMain.on('main:on:task-resume', async (ctx: IpcMainEvent, taskId: string): Promise<void> => {
            const success: boolean = await taskManager.resumeTask(taskId);

            if (success)
                ctx.reply('main:on:task-resumed', {id: taskId});
        });
    }
}

export default TaskIpc;
