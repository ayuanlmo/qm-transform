import AppConfig, {getLocalConfig} from "./AppConfig";
import type Path from 'node:path';
import type FS from 'node:fs';
import Global from "../utils/Global";

const _Path = Global.requireNodeModule<typeof Path>('path');
const _Fs = Global.requireNodeModule<typeof FS>('fs');

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

const DefaultOutputPath: string = _Path.resolve(AppConfig.appHomedir, 'output');

export const DefaultSettingConfig: IDefaultSettingConfig = {
    theme: {
        lang: 'zh-Cn',
        appearance: 'auto',
        navigationAppearance: 'default',
        zoomFactor: '100'
    },
    output: {
        outputPath: DefaultOutputPath,
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

((): void => {
    'use strict';

    if (!_Fs.existsSync(DefaultOutputPath))
        _Fs.mkdirSync(DefaultOutputPath);
})();
export default getLocalConfig();
