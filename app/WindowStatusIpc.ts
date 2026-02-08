import {BrowserWindow, ipcMain} from "electron";

/**
 * @class WindowStatusIpc
 * @constructor
 * @author ayuanlmo
 * @description 窗口状态相关IPC
 *
 * **/
class WindowStatusIpc {
    /**
     * @private
     * @readonly
     * @type {BrowserWindow}
     * **/
    private readonly window: BrowserWindow;

    constructor(window: BrowserWindow) {
        this.window = window;
        this.initHandles();
    }

    private initHandles(): void {
        this.window.on('maximize', (): void => this.onMaxSize());
        this.window.on('unmaximize', (): void => this.onUnMaximize());
        ipcMain.on('window:on:mini-size', (): void => this.window.minimize());
        ipcMain.on('window:on:max-size', (): void => this.window.maximize());
        ipcMain.on('window:on:un-max-size', (): void => this.window.unmaximize());
    }

    private onMaxSize(): void {
        this.window.webContents.send('window:on:max-size');
    }

    private onUnMaximize(): void {
        this.window.webContents.send('window:on:un-max-size');
    }
}

export default WindowStatusIpc;
