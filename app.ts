import {app, BrowserWindow, Display, globalShortcut, nativeTheme, screen, session, Size} from "electron";
import {join} from "path";
import Logger from "./lib/Logger";
import {platform} from "os";
import MainIpcHandles from "./app/MainIPC";
import AppMenu from "./lib/Menu";
import AppUpdate from "./bin/AppUpdate";
import Extensions from "./DevTools";

const __DEV_MODEL = process.env.NODE_ENV?.trim() === 'development';

class MainApp {
    private mainWindow: BrowserWindow | undefined;
    private appUpdate: AppUpdate | undefined;

    constructor() {
        if (!app.requestSingleInstanceLock())
            app.exit();

        app.on('ready', this.appReady);
    }

    private appReady(): void {
        app.whenReady().then(async () => {
            const primaryDisplay: Display = screen.getPrimaryDisplay();
            const {width, height}: Size = primaryDisplay.workAreaSize;
            const winWidth: number = Math.min(1500, Math.floor(width * 0.8));
            const winHeight: number = Math.min(800, Math.floor(height * 0.8));

            console.log(Extensions);

            Extensions.map(async (i: string): Promise<void> => {
                await session.defaultSession.loadExtension(i);
            });

            this.mainWindow = new BrowserWindow({
                width: winWidth,
                height: winHeight,
                icon: 'public/favicon.ico',
                minWidth: winWidth,
                minHeight: winHeight,
                frame: true,
                titleBarStyle: 'hidden',
                webPreferences: {
                    nodeIntegration: true,
                    webSecurity: false,
                    contextIsolation: false
                }
            });

            new MainIpcHandles(this.mainWindow);
            this.appUpdate = new AppUpdate(this.mainWindow);

            Logger.info('launching...');

            if (platform() === 'darwin')
                new AppMenu(this.mainWindow);

            globalShortcut.register('Alt+F12', (): void => {
                this.mainWindow?.webContents.openDevTools();
            });

            if (__DEV_MODEL) {
                const tryLoad = async () => {
                    await this.mainWindow?.loadURL(`http://localhost:${process.env.PORT || 8088}`);

                    nativeTheme.on('updated', () => {
                        this.mainWindow?.webContents.send('os:theme-change', {darkMode: nativeTheme.shouldUseDarkColors});
                    });

                    this.appUpdate?.checkForUpdates();
                };

                try {
                    await tryLoad();
                } catch (e) {
                    console.log(e);

                    setTimeout(() => {
                        tryLoad();
                    }, 3000);
                }

                this.mainWindow?.webContents.on('did-finish-load', (): void => {
                    Logger.info('launched...');
                });
            } else
                await this.mainWindow.loadFile(join(__dirname, '/index.html'));
        });
    }
}

((): void => {
    process.title = 'lmo-Transform';
})();

export default MainApp;
