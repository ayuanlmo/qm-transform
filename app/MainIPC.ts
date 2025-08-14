import {app, BrowserWindow, globalShortcut, ipcMain, powerSaveBlocker} from "electron";
import "./MediaIpc";
import PowerManagementIpc from "./PowerManagementIpc";
import WindowStatusIpc from "./WindowStatusIpc";
import AppDirectoryDialogIpc from "./AppDirectoryDialogIpc";
import ExternalUrlIpc from "./ExternalUrlIpc";
import SysIpc from "./SysIpc";

/**
 * @class MainIpcHandles
 * @constructor
 * @author ayuanlmo
 * @description 应用程序主要的IPC
 * **/
class MainIpcHandles {
    /**
     * @private
     * @readonly
     * @type {BrowserWindow}
     * **/
    private readonly window: BrowserWindow;
    /**
     * @private
     * @readonly
     * @type {PowerManagementIpc}
     * **/
    private pmc: PowerManagementIpc;

    constructor(window: BrowserWindow) {
        this.window = window;
        this.pmc = new PowerManagementIpc();
        this.initHandles();
        new WindowStatusIpc(window);
        new AppDirectoryDialogIpc(window);
        new ExternalUrlIpc();
        new SysIpc();
    }

    private initHandles(): void {
        ipcMain.on('window:on:close', async (): Promise<void> => await this.closeApp());
    }

    private async closeApp(instant: boolean = false, exit: boolean = false): Promise<void> {
        if (exit)
            app.exit();
        else if (instant)
            app.quit();
        else {
            if (this.pmc.pasId)
                powerSaveBlocker.stop(this.pmc.pasId);

            globalShortcut.unregisterAll();
            app.quit();
        }
    }
}

export default MainIpcHandles;
