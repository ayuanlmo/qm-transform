import { readFileSync, watchFile, existsSync } from "node:fs";
import { resolve } from "node:path";
import { appConfigDir } from "../lib/Dir";
import Logger from "../lib/Logger";

const configFile: string = resolve(appConfigDir, 'Conf.t.json');
let appConf: IDefaultSettingConfig = existsSync(configFile)
    ? JSON.parse(readFileSync(configFile, 'utf-8'))
    : {} as IDefaultSettingConfig;

watchFile(configFile, () => {
    try {
        if (existsSync(configFile)) {
            appConf = JSON.parse(readFileSync(configFile, 'utf-8'));
        }
    } catch (err) {
        Logger.error(err);
    }
});

export default new Proxy<Record<keyof IDefaultSettingConfig, any>>(appConf, {
    get(_, prop) {
        return Reflect.get(appConf, prop);
    },
    ownKeys() {
        return Reflect.ownKeys(appConf);
    },
    getOwnPropertyDescriptor(_, prop) {
        return Reflect.getOwnPropertyDescriptor(appConf, prop);
    }
});
