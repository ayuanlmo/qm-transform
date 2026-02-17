import AppConfig, {getLocalConfig} from "./AppConfig";
import type Path from 'node:path';
import Global from "../utils/Global";

const _Path = Global.requireNodeModule<typeof Path>('path');

export const windowsMediaPlayerDefaultPath: string = 'C:\\Program Files (x86)\\Windows Media Player\\wmplayer.exe';
export const appleQuickTimePlayerDefaultPath: string = '/Applications/QuickTime Player.app';

let playerType: string = '';
let playerPath: string = '';

if (AppConfig.platform === 'win32') {
    playerType = 'wmp';
    playerPath = windowsMediaPlayerDefaultPath;
} else if (AppConfig.platform === 'darwin') {
    playerType = 'qtp';
    playerPath = appleQuickTimePlayerDefaultPath;
}

export const DefaultSettingConfig: IDefaultSettingConfig = {
    theme: {
        lang: 'zh-Cn',
        appearance: 'auto',
        navigationAppearance: 'default',
        zoomFactor: '100'
    },
    output: {
        outputPath: _Path.resolve(AppConfig.tmpdir, AppConfig.appName),
        parallelTasks: 2,
        codecType: 'CPU',
        codecMethod: 'amf',
        fileNameSpase: 'origin',
        customNameRule: ''
    },
    player: {
        playerType,
        playerPath
    },
    other: {
        logLevel: 'info'
    }
};

export default getLocalConfig();
