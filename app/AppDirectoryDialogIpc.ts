import {BrowserWindow, dialog, ipcMain, IpcMainEvent, OpenDialogReturnValue} from "electron";
import {platform} from "node:os";
import Logger from "electron-log/main";

/**
 * @class AppDirectoryDialogIpc
 * @constructor
 * @author ayuanlmo
 * @description 应用程序目录对话框操作的Ipc
 * **/
class AppDirectoryDialogIpc {
    /**
     * @private
     * @readonly
     * @type {BrowserWindow}
     * **/
    private readonly window: BrowserWindow;
    /**
     * @private
     * @readonly
     * @type {NodeJS.Platform}
     * **/
    private readonly sysPlatform: NodeJS.Platform = platform();

    constructor(window: BrowserWindow) {
        this.window = window;
        this.initHandles();
    }

    private initHandles(): void {
        const selectOutputPath = 'window:on:select-output-path';
        const selectMediaPlayerPath = 'window:on:select-media-player-path';
        const selectMediaFile = 'window:on:select-media-file';

        ipcMain.on(selectOutputPath, (event: IpcMainEvent): void => this.showDirectoryDialog(this.window, event, selectOutputPath));
        ipcMain.on(selectMediaPlayerPath, (event: IpcMainEvent): void => this.showDirectoryDialog(this.window, event, selectMediaPlayerPath));
        ipcMain.on(selectMediaFile, (event: IpcMainEvent): void => this.showDirectoryDialog(this.window, event, selectMediaFile));
    }

    private showDirectoryDialog(window: BrowserWindow, event: IpcMainEvent, evtName: string): void {
        const f = [];
        const selectMediaPlayerFile = evtName.includes('select-media-player');
        const selectMediaFiles = evtName.includes('select-media-file');
        const mediaFileExtensions = ['mp4', 'mkv', 'avi', 'wmv', 'flv', 'mov', 'mpg', 'mpeg', 'rm', 'rmvb', 'vob', 'webm', 'mkv', 'm4v', '3gp', '3g2', 'ts', 'mts', 'm2ts', 'm4s', 'm4p', 'm4b', 'm4r', 'mp3', 'wav', 'wma', 'aac', 'flac', 'ogg', 'oga', 'ogv', 'ogx', 'opus', 'wav'];

        if (selectMediaPlayerFile) {
            switch (this.sysPlatform) {
                case 'win32':
                    f.push({name: 'Executable Files', extensions: ['exe']});
                    break;
                case 'darwin':
                    f.push({name: 'Applications', extensions: ['app']});
                    break;
            }
        } else if (selectMediaFiles)
            f.push({name: 'Executable Files', extensions: [...mediaFileExtensions]});
        else
            f.push({name: 'All Files', extensions: ['*']});

        dialog.showOpenDialog(window, {
            properties: selectMediaPlayerFile ? ['openFile'] : selectMediaFiles ? ['openFile', 'multiSelections'] : ['openDirectory'],
            filters: f
        }).then((e: OpenDialogReturnValue) => {
            if (!e.canceled && e.filePaths.length > 0)
                event.sender.send(evtName, selectMediaFiles ? e.filePaths : e.filePaths[0]);
        }).catch((e) => {
            Logger.error('OpenDialogError:', e);
        });
    }
}

export default AppDirectoryDialogIpc;
