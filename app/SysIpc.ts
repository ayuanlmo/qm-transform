import {ipcMain, IpcMainEvent} from "electron";
import SysInfo from "../bin/SysInfo";
import appPath from "app-path";
import {platform} from "node:os";

/**
 * @class SysIpc
 * @constructor
 * @author ayuanlmo
 * @description 系统信息相关IPC
 *
 * **/
class SysIpc {
    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        ipcMain.on('window:on:get-gpu-name', async (event: IpcMainEvent): Promise<void> => {
            const name: TGPUVendors = await SysInfo.gpuInfo();

            event.reply('window:on:get-gpu-name', name);
        });

        ipcMain.handle('window:get-local-app-path', async (_event, appName: string): Promise<string> => {
            if (platform() !== 'darwin') {
                console.warn(`[SysIpc] "window:get-local-app-path" is macOS-only. Called on  $ {platform()}`);
                return '';
            }
            try {
                return await appPath(appName);
            } catch (err) {
                console.error(`Failed to get app path for " $ {appName}":`, err);
                return '';
            }
        });
    }
}

export default SysIpc;
