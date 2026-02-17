import {app, BrowserWindow, globalShortcut, ipcMain, IpcMainEvent, powerSaveBlocker} from "electron";
import "./MediaIpc";
import PowerManagementIpc from "./PowerManagementIpc";
import WindowStatusIpc from "./WindowStatusIpc";
import AppDirectoryDialogIpc from "./AppDirectoryDialogIpc";
import ExternalUrlIpc from "./ExternalUrlIpc";
import SysIpc from "./SysIpc";
import TaskIpc from "./TaskIpc";
import AppUpdate from "../bin/AppUpdate";
import packageJSON from "../package.json";
import Logger from "../lib/Logger";
import {getLocalConfigAsMain} from "../bin/Conf";
import {LogLevel} from "electron-log";

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
    /**
     * @private
     * @readonly
     * @type {AppUpdate | undefined}
     * **/
    private readonly appUpdate: AppUpdate | undefined;

    constructor(window: BrowserWindow, appUpdate?: AppUpdate) {
        this.window = window;
        this.appUpdate = appUpdate;
        this.pmc = new PowerManagementIpc();
        this.applyLogLevelFromConfig();
        this.initHandles();
        new WindowStatusIpc(window);
        new AppDirectoryDialogIpc(window);
        new ExternalUrlIpc();
        new SysIpc();
        new TaskIpc();
    }

    private applyLogLevelFromConfig(): void {
        const conf = getLocalConfigAsMain();
        const level: LogLevel = (conf?.other?.logLevel ?? 'info') as LogLevel;

        Logger.transports.file.level = level;
        Logger.transports.console.level = level;
    }

    private initHandles(): void {
        ipcMain.on('window:on:close', async (): Promise<void> => await this.closeApp());
        ipcMain.on('main:on:get-app-version', (event: IpcMainEvent): void => {
            event.reply('main:on:get-app-version', packageJSON.version);
        });
        ipcMain.on('main:on:check-for-updates', (): void => {
            this.appUpdate?.checkForUpdates();
        });
        ipcMain.on('window:on:set-log-level', (_event: IpcMainEvent, level: LogLevel): void => {
            Logger.transports.file.level = level;
            Logger.transports.console.level = level;
        });
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
