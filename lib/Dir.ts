import {mkdirSync} from "fs";
import {resolve} from "path";
import {homedir, platform, tmpdir} from "os";

export const isWin32 = platform() === 'win32';
export const appHomeDir: string = isWin32 ? resolve(homedir(), 'AppData', 'Local', 'lmo-Transform') : resolve(homedir(), '.lmo-Transform');
export const appConfigDir: string = isWin32 ? resolve(homedir(), 'AppData', 'Local', 'lmo-Transform', 'config') : resolve(appHomeDir, 'config');
export const appTempDir: string = resolve(tmpdir(), 'lmo-Transform');

(() => {
    'use strict';
    mkdirSync(appHomeDir, {recursive: true});
    mkdirSync(appConfigDir, {recursive: true});
    mkdirSync(appTempDir, {recursive: true});
})();
