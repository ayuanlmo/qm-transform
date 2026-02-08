import {ipcMain, IpcMainEvent} from "electron";
import {FfprobeData} from "fluent-ffmpeg";
import Ffmpeg from "../bin/Ffmpeg";
import Logger from "../lib/Logger";
import {basename} from "path";
import Media from "../bin/Media";
import Player from "./MediaPlayerIpc";
import {platform} from "node:os";

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
        ipcMain.on('main:on:get-media-info', (event, files: IGetMediaInfo[]): Promise<void> => this.getMediaInfo(files, event));
        ipcMain.on('main:on:player', (event, data: string): void => {
            Player(data, event);
        });
        ipcMain.on('window:on:test-media-name', (event,{path, rule}) => {
            event.reply('window:on:test-media-name', Media.getCustomMediaFileName(path, rule));
        });
    }

    /**
     * @method getMediaInfo
     * @param {IGetMediaInfo[]} files
     * @param {IpcMainEvent} ctx
     * @author ayuanlmo
     * @description 获取媒体文件信息
     * **/
    public async getMediaInfo(files: IGetMediaInfo[], ctx: IpcMainEvent): Promise<void> {
        const medias = [];

        for (const mediaFile of files) {
            ctx.reply('main:on:media-info:pending', {
                id: mediaFile.id,
                baseName: basename(mediaFile.path)
            });
            try {
                const mediaInfo: FfprobeData | undefined = await Ffmpeg.getMediaInfo(mediaFile.path, ctx);

                if (!mediaInfo) return;
                const isVideo: boolean = Media.targetIs(mediaInfo, 'video');
                const isAudio: boolean = Media.targetIs(mediaInfo, 'audio');
                const cover: string | undefined = isVideo ? await Ffmpeg.getVideoMediaFirstFrame(mediaFile.path, ctx) : isAudio ? await Ffmpeg.getAudioVisualizationDiagram(mediaFile.path, ctx) : '';

                medias.push({
                    cover: platform() === 'darwin' ? `file://${cover}` : cover,
                    id: mediaFile.id,
                    baseName: basename(mediaFile.path),
                    fullPath: mediaFile.path,
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

                ctx.reply('main:on:media-info:complete', {
                    id: mediaFile.id,
                    baseName: basename(mediaFile.path)
                });
            } catch (e) {
                Logger.error(e);
            }
        }

        ctx.reply('main:on:media-info', medias);
    }
}

export default new MediaIpcMainHandles();

