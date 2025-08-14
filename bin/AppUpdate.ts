import {autoUpdater} from "electron-updater";
import {BrowserWindow, ipcMain} from "electron";
import Logger from "../lib/Logger";

class AppUpdate {
    private window: BrowserWindow;

    constructor(window: BrowserWindow) {
        this.window = window;
        autoUpdater.setFeedURL({
            provider: 'github',
            repo: 'https://github.com/ayuanlmo/lmo-transform/',
            private: false
        });
        autoUpdater.on('update-available', (): void => {
            this.window?.webContents.send('main:on:update-available');
        });
        autoUpdater.on('update-not-available', (): void => {
            this.window?.webContents.send('main:on:update-not-available');
        });
        autoUpdater.on('update-downloaded', (): void => {
            this.window?.webContents.send('main:on:update-downloaded');
        });
        autoUpdater.on('error', (err) => {
            Logger.error(err.message);
            this.window?.webContents.send('main:on:update-error', {
                message: err.message
            });
        });
        ipcMain.on('main:on:quit-and-install', () => {
            autoUpdater.quitAndInstall();
        });
    }

    public checkForUpdates(): void {
        autoUpdater.checkForUpdates();
    }
}

export default AppUpdate;
