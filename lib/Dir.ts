import {mkdirSync} from "fs";
import {join, resolve} from "path";
import {homedir, platform, tmpdir} from "os";

export const isWin32 = platform() === 'win32';

/**
 * Windows 上用 %LOCALAPPDATA% 而不是拼 homedir()：MSIX 包内的已知文件夹由文件系统层重定向到
 * Packages\<PFN>\LocalCache，而重定向认的是这个已知文件夹本身，跟路径怎么拼出来的无关。
 * 环境变量是系统给出的权威值（用户挪过 AppData 时它跟着变），未打包时它仍等于
 * %USERPROFILE%\AppData\Local，所以老 exe 用户的目录一个字节都不用动。
 * 注意别改成 app.getPath：Electron 只暴露 Roaming 那一侧（appData/userData/sessionData），
 * 'localAppData' 会直接抛 "Failed to get 'localAppData' path"。
 * 渲染进程（src/conf/AppConfig.ts）按同一条规则自己算，两边共用 %LOCALAPPDATA% 这个输入，
 * 谁也不依赖谁先启动；不要用跨进程传值，主进程和渲染进程代码版本不一致时会直接崩。
 */
const windowsLocalAppData: string = process.env.LOCALAPPDATA ?? resolve(homedir(), 'AppData', 'Local');

export const appHomeDir: string = isWin32 ? join(windowsLocalAppData, 'QM-Transform') : resolve(homedir(), '.QM-Transform');
export const appConfigDir: string = resolve(appHomeDir, 'config');
export const appTempDir: string = resolve(tmpdir(), 'QM-Transform');

// 本模块由 main.ts 第一个 import，此处的异常会在 app.whenReady() 之前终止进程，
// 且用户只会看到"应用双击没反应"。目录不可写时降级为告警，让应用仍能启动并定位问题。
(() => {
    'use strict';
    [appHomeDir, appConfigDir, appTempDir].forEach((dir: string): void => {
        try {
            mkdirSync(dir, {recursive: true});
        } catch (e) {
            console.error(`[Dir] failed to create ${dir}:`, (e as Error).message);
        }
    });
})();
