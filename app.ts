import {app, BrowserWindow, Display, globalShortcut, nativeTheme, screen, session, Size} from "electron";
import {join} from "path";
import Logger from "./lib/Logger";
import {platform} from "os";
import MainIpcHandles from "./app/MainIPC";
import AppMenu from "./lib/Menu";
import AppUpdate from "./bin/AppUpdate";
import Extensions from "./DevTools";

const __DEV_MODEL: boolean = !app.isPackaged;

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

            if (__DEV_MODEL)
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

            const setupCommonListeners = (): void => {
                nativeTheme.on('updated', (): void => {
                    this.mainWindow?.webContents.send('os:theme-change', {
                        darkMode: nativeTheme.shouldUseDarkColors
                    });
                });

                this.mainWindow?.webContents.once('did-finish-load', (): void => {
                    Logger.info('launched...');
                });
            };

            if (__DEV_MODEL) {
                const tryLoad = async (): Promise<void> => {
                    await this.mainWindow?.loadURL(`http://localhost:${process.env.PORT || 8088}`);
                };

                try {
                    await tryLoad();
                } catch (e) {
                    console.log(e);
                    setTimeout(tryLoad, 3000);
                }

                setupCommonListeners();
            } else {
                // 生产环境下 __dirname 指向 app.asar/build，index.html 也在 build 目录
                await this.mainWindow.loadFile(join(__dirname, 'index.html'));
                setupCommonListeners();
                this.appUpdate?.checkForUpdates();
            }
        });
    }
}

((): void => {
    process.title = 'lmo-Transform';
})();

export default MainApp;
