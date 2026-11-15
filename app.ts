import {app, BrowserWindow, Display, globalShortcut, nativeTheme, screen, session, Size} from "electron";
import {join} from "path";
import {existsSync} from "fs";
import Logger from "./lib/Logger";
import {platform} from "os";
import MainIpcHandles from "./app/MainIPC";
// import AppMenu from "./lib/Menu";
import AppUpdate from "./bin/AppUpdate";
import {isStorePackaged} from "./bin/PackageEnv";
import taskManager from "./bin/TaskManager";
import Extensions from "./DevTools";

const __DEV_MODEL: boolean = !app.isPackaged;

// 开发期资源在 <项目根>/public，打包后 CRA 把 public 内容平铺进 build/，
// 而 WindowsApps 等安装位的 CWD 不是安装目录，所以必须用绝对路径解析。
const resolveIcon = (): string => {
    const candidates: string[] = [join(__dirname, 'favicon.ico'), join(app.getAppPath(), 'public', 'favicon.ico')];

    return candidates.find((p: string): boolean => existsSync(p)) ?? '';
};

class MainApp {
    private mainWindow: BrowserWindow | undefined;
    private appUpdate: AppUpdate | undefined;

    constructor() {
        if (!app.requestSingleInstanceLock())
            app.exit();

        app.on('ready', this.appReady);

        // 退出不等于 ffmpeg 结束。孤儿进程会继续占用输出文件，Windows 上还会让目录无法删除。
        app.on('before-quit', (): void => {
            taskManager.killAll();
        });
    }

    private appReady(): void {
        app.whenReady().then(async () => {
            const primaryDisplay: Display = screen.getPrimaryDisplay();
            const {width, height}: Size = primaryDisplay.workAreaSize;
            const horizontalMargin: number = width >= 1400 ? 120 : 64;
            const verticalMargin: number = height >= 900 ? 100 : 64;
            const preferredWinWidth: number = width >= 1400 ? Math.floor(width * 0.8) : width - horizontalMargin;
            const preferredWinHeight: number = height >= 900 ? Math.floor(height * 0.8) : height - verticalMargin;
            const winWidth: number = Math.min(1500, preferredWinWidth, width - 40);
            const winHeight: number = Math.min(800, preferredWinHeight, height - 40);
            // Prefer a content width of 1200px on large screens; scale down based on workspace ratio for small screens or high-DPI displays. Compatible with Windows/macOS.
            const preferredMinWidth: number = Math.max(960, Math.min(1200, Math.floor(width * 0.9)));
            const preferredMinHeight: number = Math.max(600, Math.min(700, Math.floor(height * 0.9)));
            const minWinWidth: number = Math.min(winWidth, preferredMinWidth);
            const minWinHeight: number = Math.min(winHeight, preferredMinHeight);

            if (__DEV_MODEL)
                Extensions.map(async (i: string): Promise<void> => {
                    await session.defaultSession.loadExtension(i);
                });

            this.mainWindow = new BrowserWindow({
                width: winWidth,
                height: winHeight,
                icon: resolveIcon() || undefined,
                minWidth: minWinWidth,
                minHeight: minWinHeight,
                frame: true,
                titleBarStyle: platform() === 'linux' ? 'default' : 'hidden',
                autoHideMenuBar: platform() === 'linux',
                webPreferences: {
                    nodeIntegration: true,
                    webSecurity: false,
                    contextIsolation: false
                }
            });

            // MSIX 通道由商店负责更新，electron-updater 只在官网安装包上拉起：
            // 商店容器里它下载的安装包无法自行执行，留下的只是一个必然失败的检查。
            this.appUpdate = isStorePackaged() ? undefined : new AppUpdate(this.mainWindow);
            new MainIpcHandles(this.mainWindow, this.appUpdate);

            Logger.info('launching...');

            // if (platform() === 'darwin')
            //     new AppMenu(this.mainWindow);

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
                this.appUpdate?.checkForUpdates(true); // 启动时静默检查
            }
        });
    }
}

((): void => {
    process.title = 'QM-Transform';
})();

export default MainApp;
