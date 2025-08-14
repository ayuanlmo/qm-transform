import {readFileSync, watchFile} from "node:fs";
import {resolve} from "node:path";
import {appConfigDir} from "../lib/Dir";
import Logger from "../lib/Logger";

const configFile:string = resolve(appConfigDir, 'Conf.t.json');
let appConf: IDefaultSettingConfig = JSON.parse(readFileSync(configFile, 'utf-8'));

watchFile(configFile, () => {
    try {
        appConf = JSON.parse(readFileSync(configFile, 'utf-8'));
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
    getOwnPropertyDescriptor(target, prop) {
        return Reflect.getOwnPropertyDescriptor(appConf, prop);
    }
});
