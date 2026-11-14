import {autoUpdater} from "electron-updater";
import {app, BrowserWindow, ipcMain} from "electron";
import Logger from "../lib/Logger";

/**
 * 开发期把 QM_DEV_UPDATE_URL 指向 scripts/serve-updates.mjs 起的本地更新源，
 * 不用为了验证更新流程先发一个版本；没有这个变量时，开发环境照旧完全不碰更新。
 * **/
const DEV_FEED_URL: string | undefined = process.env.QM_DEV_UPDATE_URL;

type TUpdateErrorType = 'network' | 'server' | 'noReleases' | 'unknown';

/**
 * @class AppUpdate
 * @description exe 通道的自更新：更新元数据是 electron-builder 产出的 latest.yml，
 * 所以它必须和安装包一起出现在同一个 Release 里，缺一个都是 404。
 * **/
class AppUpdate {
    private readonly window: BrowserWindow;
    /**
     * 最近一次检查是不是启动时的静默检查。它只决定「检查中 / 暂无更新 / 检查失败」这三类通知，
     * 发现新版本永远要通知——后台检查的唯一产出就是它。
     * **/
    private silent: boolean = false;

    constructor(window: BrowserWindow) {
        this.window = window;

        if (DEV_FEED_URL && !app.isPackaged) {
            // 不打开这个开关，electron-updater 在非打包环境会直接跳过检查
            autoUpdater.forceDevUpdateConfig = true;
            autoUpdater.setFeedURL({provider: 'generic', url: DEV_FEED_URL});
        } else {
            autoUpdater.setFeedURL({
                provider: 'github',
                owner: 'ayuanlmo',
                repo: 'qm-transform',
                private: false
            });
        }

        // 安装包 160MB 上下，而 autoDownload 默认为 true：启动时的静默检查会当场开始拉整包，
        // 跟 README 里「仅有的网络行为是检查新版本」对不上。下载改由用户在提示里确认。
        autoUpdater.autoDownload = false;
        // autoInstallOnAppQuit 默认为 true：用户点了「稍后重启」以后，下次正常退出会被静默安装并弹 UAC，
        // 看着像程序卡死。安装只在用户明确点「立即重启」时发生。
        autoUpdater.autoInstallOnAppQuit = false;
        // 更新器的内部日志并进同一个日志文件，本机排查「为什么没提示更新」时才有据可查
        autoUpdater.logger = Logger;

        // 检查更新开始
        autoUpdater.on('checking-for-update', (): void => {
            if (!this.silent) {
                this.window?.webContents.send('main:on:update-checking');
            }
        });

        // 更新可用
        autoUpdater.on('update-available', (info): void => {
            Logger.info('Update available:', info.version);
            this.window?.webContents.send('main:on:update-available', {
                version: info.version
            });
            this.silent = false;
        });

        // 更新不可用
        autoUpdater.on('update-not-available', (): void => {
            if (!this.silent) {
                this.window?.webContents.send('main:on:update-not-available');
            }
            this.silent = false;
        });

        // 下载进度
        autoUpdater.on('download-progress', (progress): void => {
            this.window?.webContents.send('main:on:update-download-progress', {
                percent: progress.percent,
                transferred: progress.transferred,
                total: progress.total
            });
        });

        // 更新下载完成
        autoUpdater.on('update-downloaded', (info): void => {
            Logger.info('Update downloaded:', info.version);
            this.window?.webContents.send('main:on:update-downloaded', {
                version: info.version
            });
        });

        // 错误处理
        autoUpdater.on('error', (err: Error, detail?: string): void => {
            Logger.error('Update error:', detail ?? err?.message ?? err);
            if (!this.silent) {
                this.window?.webContents.send('main:on:update-error', {
                    message: err?.message ?? String(err),
                    type: this.getErrorType(err)
                });
            }
            this.silent = false;
        });

        ipcMain.on('main:on:download-update', (): void => {
            autoUpdater.downloadUpdate().catch((e: Error): void => {
                Logger.error('Update download failed:', e?.message ?? e);
            });
        });

        ipcMain.on('main:on:quit-and-install', (): void => {
            // 不带参数的 quitAndInstall 会弹出完整安装向导，和提示里「立即重启完成更新」不是一回事。
            // perMachine 安装包过 UAC 这一步省不掉，但装完必须自己把应用拉回来。
            autoUpdater.quitAndInstall(true, true);
        });
    }

    /**
     * @method getErrorType
     * @description 分类只用来挑一句本地化文案，宁缺毋滥：latest.yml 缺失、资产改名导致的 404
     * 这类发布问题一旦被归成「服务器错误」，排查方向就整个跑偏，所以让它们落到 unknown，
     * 界面会带上原始错误文本。
     * **/
    private getErrorType(err: Error): TUpdateErrorType {
        const message: string = String(err?.message ?? err).toLowerCase();

        if (/enetnotfound|enotfound|econnrefused|econnreset|econnaborted|etimedout|ehostunreach|enetunreach|enethostunreach|network|fetch failed|net::err_/.test(message)) {
            return 'network';
        }
        if (/no published versions/.test(message)) {
            return 'noReleases';
        }
        if (/status code: 5|response code: 5|http error code: 5|internal server error|bad gateway|service unavailable/.test(message)) {
            return 'server';
        }

        return 'unknown';
    }

    public checkForUpdates(silent: boolean = false): void {
        // 后发起的检查决定通知方式：启动的静默检查撞上用户手动点「检查更新」时，
        // 用户点了就一定要看到结果。重复的网络请求由 electron-updater 自己合并。
        this.silent = silent;

        autoUpdater.checkForUpdates().catch((): void => {
            this.silent = false;
        });
    }
}

export default AppUpdate;
