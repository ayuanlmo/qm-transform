import {LogLevel} from "electron-log";

export const GlobalPlayer = [
    {
        name: 'VLC media player',
        value: 'vlc'
    },
    {
        name: 'ffplay',
        value: 'ffplay'
    }
];

export const MediaPlayerForWindows = [
    {
        name: 'Windows Media Player',
        value: 'wmp'
    },
    ...GlobalPlayer,
    {
        name: 'PotPlayer',
        value: 'potplayer'
    }
];

export const MediaPlayerForMacOS = [
    {
        name: 'QuickTime Player',
        value: 'qtp'
    },
    ...GlobalPlayer
];

export const LogLevels: {
    label: Capitalize<LogLevel>;
    value: LogLevel;
}[] = [
    {
        label: 'Debug',
        value: 'debug'
    },
    {
        label: 'Info',
        value: 'info'
    },
    {
        label: 'Warn',
        value: 'warn'
    },
    {
        label: 'Error',
        value: 'error'
    },
    {
        label: 'Silly',
        value: 'silly'
    }
];
