import path from "path";
import {existsSync, readFileSync} from "node:fs";
import Logger from "../lib/Logger";
import os from "node:os";

const isWin32: boolean = os.platform() === 'win32';
const appHomePath: string = path.resolve(isWin32 ? path.resolve(os.homedir(), 'AppData', 'Local', 'lmo-Transform') : path.resolve(os.homedir(), '.lmo-Transform'));
const configFileDir: string = path.resolve(appHomePath, 'config', 'Conf.t.json');

export const getLocalConfigAsMain = (): IDefaultSettingConfig | null => {
    if (existsSync(configFileDir)) {
        try {
            return JSON.parse(readFileSync(configFileDir, 'utf8'));
        } catch (error) {
            Logger.error('Failed to parse config file:', error);
        }
    }
    return null;
};
