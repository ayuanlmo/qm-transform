import type OS from 'node:os';
import type FS from 'node:fs';
import type Path from 'node:path';
import Global from "../utils/Global";
import {DefaultSettingConfig} from "./DefaultSettingConfig";
import {getDetectedLanguage} from "../utils/languageDetect";

const _OS = Global.requireNodeModule<typeof OS>('os');
const _Path = Global.requireNodeModule<typeof Path>('path');
const {existsSync, writeFileSync, readFileSync} = Global.requireNodeModule<typeof FS>('fs');

// 与主进程 lib/Dir.ts 用的是同一条规则、同一个输入（%LOCALAPPDATA%），两边算出来的目录必然一致。
// 之所以各算一份而不是让主进程把值传过来：dev 下渲染进程和主进程的代码版本经常不同步，
// 跨进程传值一旦缺位就得在模块加载时崩掉。
const isWin32 = _OS.platform() === 'win32';
const appHomeDir: string = isWin32
    ? _Path.resolve(process.env.LOCALAPPDATA ?? _Path.resolve(_OS.homedir(), 'AppData', 'Local'), 'QM-Transform')
    : _Path.resolve(_OS.homedir(), '.QM-Transform');

const AppConfig = {
    appName: 'QM-Transform',
    platform: _OS.platform(),
    tmpdir: _Path.resolve(_OS.tmpdir(), 'QM-Transform'),
    arch: _OS.arch(),
    homedir: _OS.homedir(),
    appHomedir: appHomeDir,
    appRepository: 'https://github.com/ayuanlmo/qm-transform',
    authorGitHubHome: 'https://github.com/ayuanlmo/'
} as const;

const configFileDir: string = _Path.resolve(AppConfig.appHomedir, 'config', 'Conf.t.json');

export const getLocalConfig = (): IDefaultSettingConfig => {
    if (existsSync(configFileDir))
        return JSON.parse(readFileSync(configFileDir, 'utf8'));

    const initialConfig: IDefaultSettingConfig = {
        ...DefaultSettingConfig,
        theme: {
            ...DefaultSettingConfig.theme,
            lang: typeof navigator !== 'undefined' ? getDetectedLanguage() : DefaultSettingConfig.theme.lang
        }
    };

    writeFileSync(configFileDir, JSON.stringify(initialConfig, null, 4));

    return initialConfig;
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
