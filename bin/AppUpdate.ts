import {autoUpdater} from "electron-updater";
import {BrowserWindow, ipcMain} from "electron";
import Logger from "../lib/Logger";

class AppUpdate {
    private window: BrowserWindow;
    private isSilent: boolean = false;

    constructor(window: BrowserWindow) {
        this.window = window;
        autoUpdater.setFeedURL({
            provider: 'github',
            owner: 'ayuanlmo',
            repo: 'qm-transform',
            private: false
        });
        
        // 检查更新开始
        autoUpdater.on('checking-for-update', (): void => {
            if (!this.isSilent) {
                this.window?.webContents.send('main:on:update-checking');
            }
        });
        
        // 更新可用
        autoUpdater.on('update-available', (info): void => {
            Logger.info('Update available:', info.version);
            // 更新可用时始终通知，即使静默模式
            this.window?.webContents.send('main:on:update-available', {
                version: info.version
            });
        });
        
        // 更新不可用
        autoUpdater.on('update-not-available', (): void => {
            if (!this.isSilent) {
                this.window?.webContents.send('main:on:update-not-available');
            }
            // 检查完成，重置静默状态
            this.isSilent = false;
        });
        
        // 下载进度
        autoUpdater.on('download-progress', (progress): void => {
            // 下载进度始终通知
            this.window?.webContents.send('main:on:update-download-progress', {
                percent: progress.percent,
                transferred: progress.transferred,
                total: progress.total
            });
        });
        
        // 更新下载完成
        autoUpdater.on('update-downloaded', (info): void => {
            Logger.info('Update downloaded:', info.version);
            // 下载完成始终通知
            this.window?.webContents.send('main:on:update-downloaded', {
                version: info.version
            });
        });
        
        // 错误处理
        autoUpdater.on('error', (err) => {
            Logger.error('Update error:', err.message);
            if (!this.isSilent) {
                const errorType = this.getErrorType(err);
                this.window?.webContents.send('main:on:update-error', {
                    message: err.message,
                    type: errorType
                });
            }
            // 检查完成（即使失败），重置静默状态
            this.isSilent = false;
        });
        
        ipcMain.on('main:on:quit-and-install', () => {
            autoUpdater.quitAndInstall();
        });
    }

    private getErrorType(err: Error): string {
        const message = err.message.toLowerCase();
        if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
            return 'network';
        } else if (message.includes('no published versions')) {
            return 'noReleases';
        } else if (message.includes('server') || message.includes('404') || message.includes('500')) {
            return 'server';
        }
        return 'unknown';
    }

    public checkForUpdates(silent: boolean = false): void {
        this.isSilent = silent;
        autoUpdater.checkForUpdates();
    }
}

export default AppUpdate;
