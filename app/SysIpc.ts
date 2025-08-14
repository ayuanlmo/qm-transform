import {ipcMain, IpcMainEvent} from "electron";
import SysInfo from "../bin/SysInfo";

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
    }
}

export default SysIpc;
