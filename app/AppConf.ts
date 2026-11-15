import {existsSync, readFileSync, watchFile} from "node:fs";
import {resolve} from "node:path";
import {appConfigDir} from "../lib/Dir";
import Logger from "../lib/Logger";

const configFile: string = resolve(appConfigDir, 'Conf.t.json');
const readAppConf = (): IDefaultSettingConfig => {
    try {
        if (!existsSync(configFile)) return {} as IDefaultSettingConfig;

        return JSON.parse(readFileSync(configFile, 'utf-8')) as IDefaultSettingConfig;
    } catch (err) {
        Logger.error('[AppConf] ignoring unreadable config file:', err);
        return {} as IDefaultSettingConfig;
    }
};

let appConf: IDefaultSettingConfig = readAppConf();

watchFile(configFile, () => {
    try {
        if (existsSync(configFile)) {
            appConf = readAppConf();
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
