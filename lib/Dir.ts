import {mkdirSync} from "fs";
import {resolve} from "path";
import {homedir, platform, tmpdir} from "os";

export const isWin32 = platform() === 'win32';
export const appHomeDir: string = isWin32 ? resolve(homedir(), 'AppData', 'Local', 'QM-Transform') : resolve(homedir(), '.QM-Transform');
export const appConfigDir: string = isWin32 ? resolve(homedir(), 'AppData', 'Local', 'QM-Transform', 'config') : resolve(appHomeDir, 'config');
export const appTempDir: string = resolve(tmpdir(), 'QM-Transform');

(() => {
    'use strict';
    mkdirSync(appHomeDir, {recursive: true});
    mkdirSync(appConfigDir, {recursive: true});
    mkdirSync(appTempDir, {recursive: true});
})();
