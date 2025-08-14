import Global from "../utils/Global";
import type Electron from "electron";
import {useEffect, useState} from "react";

export type TMainChannelName = `${string}:${string}`;

const {ipcRenderer} = Global.requireNodeModule<typeof Electron>('electron');

const useMainEventListener = <T>(channel: TMainChannelName, cb: (data: T) => void): void => {
    useEffect(() => {
        const handler = (_: any, data: T): void => {
            cb(data);
        };

        ipcRenderer.addListener(channel, handler);

        return () => {
            ipcRenderer.removeListener(channel, handler);
        };
    }, []);
};

const useTheme = (auto = false, appearance: TThemeType): TThemeType => {
    const [theme, setTheme] = useState<TThemeType>(window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');

    useEffect(() => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        document.body.classList.toggle('light-mode', theme !== 'dark');
    }, [theme]);

    useEffect(() => {
        setTheme(appearance);
    }, [auto, appearance]);

    useMainEventListener<{ darkMode: boolean; }>('os:theme-change', ({darkMode}) => {
        if (appearance === 'auto')
            setTheme(darkMode ? 'dark' : 'light');
    });

    return theme;
};

export {
    useMainEventListener,
    useTheme
};
