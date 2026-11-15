import path from "path";
import {existsSync, readFileSync} from "node:fs";
import Logger from "../lib/Logger";
import {appConfigDir} from "../lib/Dir";

const configFileDir: string = path.resolve(appConfigDir, 'Conf.t.json');

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
