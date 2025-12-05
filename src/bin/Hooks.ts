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
    const [theme, setTheme] = useState<TThemeType>(
        window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    );

    useEffect((): void => {
        document.body.classList.toggle('dark-mode', theme === 'dark');
        document.body.classList.toggle('light-mode', theme !== 'dark');
    }, [theme]);

    useEffect((): void => {
        if (appearance === 'auto') {
            const isDark: boolean = window.matchMedia('(prefers-color-scheme: dark)').matches;

            setTheme(isDark ? 'dark' : 'light');
        } else
            setTheme(appearance);
    }, [auto, appearance]);

    // 仅在 appearance === 'auto' 时跟随系统主题变化
    useEffect(() => {
        const handler = (_: any, {darkMode}: { darkMode: boolean }): void => {
            if (appearance === 'auto')
                setTheme(darkMode ? 'dark' : 'light');
        };

        ipcRenderer.addListener('os:theme-change', handler);

        return () => {
            ipcRenderer.removeListener('os:theme-change', handler);
        };
    }, [appearance]);

    return theme;
};

export {
    useMainEventListener,
    useTheme
};
