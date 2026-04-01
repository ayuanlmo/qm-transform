import AppConfig from "../conf/AppConfig";
import type FS from 'node:fs';
import type Path from 'node:path';
import Global from "./Global";
import {sendIpcMessage} from "../bin/IPC";
import type Electron from "electron";

const {webUtils} = Global.requireNodeModule<typeof Electron>('electron');
const {readdirSync, existsSync, statSync, unlinkSync} = Global.requireNodeModule<typeof FS>('fs');
const uuid = Global.requireNodeModule<any>('uuid');
const {resolve} = Global.requireNodeModule<typeof Path>('path');
const {tmpdir} = AppConfig;

export const appTempFileInfo = () => {
    let size: number = 0;

    if (existsSync(tmpdir)) {
        const files: string[] = readdirSync(tmpdir);

        files.forEach(fileName => {
            const file = statSync(resolve(tmpdir, fileName));

            if (file.isFile())
                size += file.size;
        });

        return {size: Math.ceil(size / 1024), total: files.length};
    }

    return {size, total: 0};
};

export const deleteAppleTempFiles = (fileDir: string = '') => {
    const dir = fileDir === '' ? tmpdir : fileDir;

    if (existsSync(dir))
        readdirSync(dir).forEach(file => {
            const filePath: string = resolve(dir, file);

            if (statSync(filePath).isDirectory())
                deleteAppleTempFiles(filePath);
            else
                unlinkSync(filePath);
        });
};

export const selectMediaFiles = () => {
    sendIpcMessage('window:on:select-media-file');
};

export const getUUID = (): string => {
    return uuid.v4() as string;
};

export const generateMediaFileId = (files: string[]): { id: string; path: string }[] => {
    const media: { id: string; path: string; }[] = [];

    files.forEach((i: string) => {
        media.push({
            id: getUUID(),
            path: i
        });
    });

    return media;
};

export const openExternalUrl = (url: string): void => {
    sendIpcMessage('window:on:open-external-url', {
        url
    });
};

export const getLocalPathForFile = (file: File): string | null => {
    try {
        const p: string = webUtils.getPathForFile?.(file);

        return p.length > 0 ? p : null;
    } catch {
        return null;
    }
};

export const formatDuration = (seconds: number): string => {
    const totalSeconds: number = Math.floor(seconds);
    const hours: number = Math.floor(totalSeconds / 3600);
    const minutes: number = Math.floor(totalSeconds % 3600 / 60);
    const secs: number = totalSeconds % 60;
    const pad = (num: number): string => num.toString().padStart(2, '0');

    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}`;
};

export const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0KB';

    const k = 1024;

    if (bytes < k * k)
        return `${Math.floor(bytes / k)}KB`;

    if (bytes < k * k * k)
        return `${(bytes / (k * k)).toFixed(1)}M`;

    return `${(bytes / (k * k * k)).toFixed(1)}G`;
};

export {getShowInSystemFileManagerI18nKey} from './platformI18n';
