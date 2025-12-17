import AppConfig from "../conf/AppConfig";
import type FS from 'node:fs';
import type Path from 'node:path';
import {v4 as uuidV4} from "uuid";
import Global from "./Global";
import {sendIpcMessage} from "../bin/IPC";
import type Electron from "electron";

const {webUtils} = Global.requireNodeModule<typeof Electron>('electron');
const {readdirSync, existsSync, statSync, unlinkSync} = Global.requireNodeModule<typeof FS>('fs');
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
    return uuidV4();
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
