import {ipcMain, IpcMainEvent} from "electron";
import {FfprobeData} from "fluent-ffmpeg";
import Ffmpeg from "../bin/Ffmpeg";
import Logger from "../lib/Logger";
import {basename} from "path";
import Media from "../bin/Media";
import Player from "./MediaPlayerIpc";
import {pathToFileURL} from "node:url";

interface IGetMediaInfo {
    id: string;
    path: string;
}

/**
 * @class MediaIpcMainHandles
 * @constructor
 * @author ayuanlmo
 * @description 媒体文件IPC
 * **/
export class MediaIpcMainHandles {
    constructor() {
        ipcMain.on('main:on:get-media-info', (event, files: IGetMediaInfo[]): void => {
            void this.getMediaInfo(Array.isArray(files) ? files : [], event).catch((e: unknown): void => Logger.error(e));
        });
        ipcMain.on('main:on:player', (event, data: string): void => {
            Player(data, event);
        });
        ipcMain.on('window:on:test-media-name', (event, {path, rule}) => {
            event.reply('window:on:test-media-name', Media.getCustomMediaFileName(path, rule));
        });
    }

    /**
     * @method getMediaInfo
     * @param {IGetMediaInfo[]} files
     * @param {IpcMainEvent} ctx
     * @author ayuanlmo
     * @description Get media files info
     * **/
    public async getMediaInfo(files: IGetMediaInfo[], ctx: IpcMainEvent): Promise<void> {
        const medias = [];

        for (const mediaFile of files) {
            const {id, path: fullPath} = mediaFile ?? ({} as IGetMediaInfo);
            const baseName: string = fullPath ? basename(fullPath) : '';

            ctx.reply('main:on:media-info:pending', {id, baseName});

            try {
                const mediaInfo: FfprobeData = await Ffmpeg.getMediaInfo(fullPath, ctx);
                const isVideo: boolean = Media.targetIs(mediaInfo, 'video');
                const isAudio: boolean = Media.targetIs(mediaInfo, 'audio');
                const cover: string = isVideo
                    ? await Ffmpeg.getVideoMediaFirstFrame(fullPath, ctx).catch((): string => '')
                    : isAudio
                        ? await Ffmpeg.getAudioVisualizationDiagram(fullPath, ctx).catch((): string => '')
                        : '';

                medias.push({
                    cover: cover ? pathToFileURL(cover).href : '',
                    id,
                    baseName,
                    fullPath,
                    isH264: Media.isH264(mediaInfo),
                    isH265: Media.isH265(mediaInfo),
                    format: Media.mediaFormat(mediaInfo),
                    isAudio,
                    mediaInfo,
                    isVideo,
                    quality: 'original',
                    videoParams: Ffmpeg.getMediaVideoInfo(mediaInfo),
                    audioParams: Ffmpeg.getMediaAudioInfo(mediaInfo)
                });
            } catch (e) {
                Logger.error(`[MediaIpc] skipped ${fullPath}: ${(e as Error)?.message ?? e}`);
            } finally {
                ctx.reply('main:on:media-info:complete', {id, baseName});
            }
        }

        ctx.reply('main:on:media-info', medias);
    }
}

export default new MediaIpcMainHandles();

