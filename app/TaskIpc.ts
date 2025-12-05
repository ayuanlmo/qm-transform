/**
 * @class TaskIpc
 * @constructor
 * @author ayuanlmo
 * @description 任务相关IPC
 *
 * **/
import {ipcMain, IpcMainEvent} from "electron";
import TransformVideo from "../bin/TransformVideo";

class TaskIpc {
    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        ipcMain.on('main:on:task-create:video-media-transform', (ctx: IpcMainEvent, mediaInfo: IMediaInfo): void => {
            TransformVideo.transformVideoMedia(mediaInfo, ctx);
        });
    }
}

export default TaskIpc;
