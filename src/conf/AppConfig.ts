import type OS from 'node:os';
import type FS from 'node:fs';
import type Path from 'node:path';
import Global from "../utils/Global";
import {DefaultSettingConfig} from "./DefaultSettingConfig";

const _OS = Global.requireNodeModule<typeof OS>('os');
const _Path = Global.requireNodeModule<typeof Path>('path');
const {existsSync, writeFileSync, readFileSync} = Global.requireNodeModule<typeof FS>('fs');
const isWin32 = _OS.platform() === 'win32';

const AppConfig = {
    appName: 'QM-Transform',
    platform: _OS.platform(),
    tmpdir: _Path.resolve(_OS.tmpdir(), 'QM-Transform'),
    arch: _OS.arch(),
    homedir: _OS.homedir(),
    appHomedir: isWin32 ? _Path.resolve(_OS.homedir(), 'AppData', 'Local', 'QM-Transform') : _Path.resolve(_OS.homedir(), '.QM-Transform'),
    appRepository: 'https://github.com/ayuanlmo/qm-transform',
    authorGitHubHome: 'https://github.com/ayuanlmo/'
} as const;

const configFileDir: string = _Path.resolve(AppConfig.appHomedir, 'config', 'Conf.t.json');

export const getLocalConfig = (): IDefaultSettingConfig => {
    if (existsSync(configFileDir))
        return JSON.parse(readFileSync(configFileDir, 'utf8'));

    writeFileSync(configFileDir, JSON.stringify(DefaultSettingConfig, null, 4));

    return DefaultSettingConfig;
};

const loadConfig = (): void => {
    const localConf = getLocalConfig();
    const conf = mergeConfig(DefaultSettingConfig, localConf);

    if (JSON.stringify(localConf) !== JSON.stringify(conf))
        saveConfig(conf);
};

export const mergeConfig = (target: any, source: any) => {
    const output = {...target};

    for (const key in source) {
        if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = mergeConfig(output[key] || {}, source[key]);
        } else {
            output[key] = source[key];
        }
    }
    return output;
};

export const saveConfig = (config: IDefaultSettingConfig): void => {
    writeFileSync(configFileDir, JSON.stringify(config, null, 4));
};

export default AppConfig;

setTimeout((): void => {
    loadConfig();
}, 0);
