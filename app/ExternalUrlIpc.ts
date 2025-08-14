import {ipcMain, shell} from "electron";
import Logger from "../lib/Logger";

/**
 * @class ExternalUrlIpc
 * @constructor
 * @author ayuanlmo
 * @description 应用程序外部链接Ipc
 * **/
class ExternalUrlIpc {
    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        ipcMain.on('window:on:open-external-url', async (_event, {url}) => {
            try {
                await shell.openExternal(url);
            } catch (e) {
                Logger.error(e);
            }
        });
    }
}

export default ExternalUrlIpc;
