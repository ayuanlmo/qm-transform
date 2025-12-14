import ffmpeg, {Encoders, FfprobeData, FfprobeStream} from "fluent-ffmpeg";
import ffmpegPath from "ffmpeg-static";
import {path as ffprobePath} from "ffprobe-static";
import {v4} from "uuid";
import {appTempDir} from "../lib/Dir";
import {IpcMainEvent} from "electron";
import fs from "fs";
import path from "path";
import {ChildProcessWithoutNullStreams, spawn} from "node:child_process";
import Logger from "../lib/Logger";

((): void => {
    'use strict';

    ffmpeg.setFfmpegPath(ffmpegPath ?? '');
    ffmpeg.setFfprobePath(ffprobePath);
})();

/**
 * @class Ffmpeg
 * @static
 * @author ayuanlmo
 * @description Ffmpeg相关操作
 * **/
class Ffmpeg {
    /**
     * @method getVideoMediaFirstFrame
     * @param {string} mediaFile - 视频文件
     * @param {IpcMainEvent} ctx
     * @returns {Promise<string>} - 媒体第一帧图片路径
     * @description 获取视频媒体第一帧
     * **/
    public static getVideoMediaFirstFrame(mediaFile: string, ctx: IpcMainEvent): Promise<string | undefined> {
        const optFileName: string = `${v4()}.t.png`;
        const optPath: string = path.resolve(appTempDir, optFileName);

        // 规范像素格式和缩放规则，避免 H265 / HDR 等情况下截图色彩“发飘”
        const args: string[] = [
            '-i', mediaFile,
            '-vf', 'scale=244:160:force_original_aspect_ratio=decrease:flags=lanczos,pad=244:160:(ow-iw)/2:(oh-ih)/2:black',
            '-frames:v', '1',
            '-pix_fmt', 'rgb24',// 统一输出为 SDR / sRGB 友好的 RGB24，避免 YUV / HDR 影响效果
            optPath,
            '-y'
        ];

        return new Promise((resolve, reject): void => {
            const ffmpegProcess: ChildProcessWithoutNullStreams = spawn(ffmpegPath ?? '', args);

            ffmpegProcess.on('exit', (code: number | null): void => {
                if (code !== 0) {
                    Logger.error(`FFMPEG exited with code ${code}`);
                    ctx.reply('main:on:error', {
                        type: 'media-first-frame-error',
                        message: `FFMPEG exited with code ${code}`,
                        mediaFile
                    });
                    reject();
                } else
                    resolve(optPath);
            });
        });
    }

    /**
     * @method getMediaAudioInfo
     * @param {FfprobeData} media - 媒体文件路径
     * @returns {AudioEncodingParams}
     * @author ayuanlmo
     * @description 获取音频媒体信息
     * **/
    public static getMediaAudioInfo(media: FfprobeData): AudioEncodingParams {
        const audioStream: FfprobeStream | undefined = media.streams.find(stream => stream.codec_type === 'audio');
        const defaultAudioParams: AudioEncodingParams = {
            channels: 0,
            sampleRate: 0,
            bitrate: '',
            codec: ''
        };

        return audioStream ? {
            channels: audioStream.channels ?? defaultAudioParams.channels,
            sampleRate: audioStream.sample_rate ?? defaultAudioParams.sampleRate,
            bitrate: audioStream.bit_rate?.toString() ?? defaultAudioParams.bitrate,
            codec: audioStream.codec_name ?? defaultAudioParams.codec
        } : defaultAudioParams;
    }

    /**
     * @method calculateFrameRate
     * @param {string} [rFrameRate] 帧速率
     * @param {string} [avgFrameRate] 平均帧速率
     * @returns {number}
     * @author ayuanlmo
     * @description 计算视频帧速率
     * **/
    private static calculateFrameRate(rFrameRate?: string, avgFrameRate?: string): number {
        const rateString: string | undefined = rFrameRate || avgFrameRate;

        if (!rateString) return 0;

        const [numerator, denominator]: number[] = rateString.split('/').map(Number);

        return denominator ? numerator / denominator : 0;
    }

    /**
     * @method getMediaVideoInfo
     * @param {FfprobeData} media - 媒体文件信息(FfprobeData)
     * @returns {VideoEncodingParams}
     * @author ayuanlmo
     * @description 获取视频媒体信息(编码信息)
     * **/
    public static getMediaVideoInfo(media: FfprobeData): VideoEncodingParams {
        const videoStream = media.streams.find(stream => stream.codec_type === 'video'); // 明确过滤 video 流

        // 默认值集中管理
        const defaultVideoParams: VideoEncodingParams = {
            width: 0,
            height: 0,
            codec: '',
            bitrate: '',
            fps: 0,
            preset: '',
            tune: '',
            profile: '',
            level: '',
            pixFmt: '',
            gpuAcceleration: false,
            hardwareEncoder: ''
        };

        if (!videoStream) {
            return defaultVideoParams;
        }

        const frameRate = Ffmpeg.calculateFrameRate(
            videoStream.r_frame_rate,
            videoStream.avg_frame_rate
        );

        return {
            width: videoStream.width ?? defaultVideoParams.width,
            height: videoStream.height ?? defaultVideoParams.height,
            codec: videoStream.codec_name ?? defaultVideoParams.codec,
            bitrate: videoStream.bit_rate?.toString() ?? defaultVideoParams.bitrate,
            fps: frameRate,
            preset: defaultVideoParams.preset, // 无原始数据，使用默认值
            tune: defaultVideoParams.tune,
            profile: '',
            level: videoStream.level ?? defaultVideoParams.level,
            pixFmt: videoStream.pix_fmt ?? defaultVideoParams.pixFmt,
            gpuAcceleration: defaultVideoParams.gpuAcceleration,
            hardwareEncoder: defaultVideoParams.hardwareEncoder
        };
    }

    /**
     * @method getMediaInfo
     * @param {string} mediaFile - 媒体文件路径
     * @param {IpcMainEvent}  ctx
     * @author ayuanlmo
     * @description 获取媒体文件信息
     * **/
    public static getMediaInfo(mediaFile: string, ctx: IpcMainEvent): Promise<FfprobeData | undefined> {
        return new Promise((resolve, reject) => {
            ffmpeg.ffprobe(mediaFile, (e, data: FfprobeData) => {
                if (e) {
                    Logger.error(e);
                    reject();
                    ctx.reply('main:on:error', {
                        type: 'media-info-error',
                        message: e,
                        mediaFile
                    });
                } else
                    resolve(data);
            });
        });
    }

    /**
     * @method getAudioVisualizationDiagram
     * @param {string} mediaFile - 媒体文件路径
     * @param {IpcMainEvent}  ctx
     * @author ayuanlmo
     * @description 获取音频文件可视化图
     * **/
    public static getAudioVisualizationDiagram(mediaFile: string, ctx: IpcMainEvent): Promise<string | undefined> {
        const optFileName: string = `${v4()}.t.png`;
        const optPath = path.resolve(appTempDir, optFileName);
        const args: Array<string> = [
            '-i',
            mediaFile,
            '-filter_complex',
            'showwavespic=s=244x160:colors=#0688E5',
            '-frames:v', '1',
            optPath,
            '-y'
        ];

        return new Promise((resolve, reject): void => {
            const ffmpegProcess: ChildProcessWithoutNullStreams = spawn(ffmpegPath ?? '', args);

            ffmpegProcess.on('exit', (code: number | null): void => {
                if (code !== 0) {
                    Logger.error(`FFMPEG exited with code ${code}`);
                    ctx.reply('main:on:error', {
                        type: 'media-audio-av-error',
                        message: `FFMPEG exited with code ${code}`,
                        mediaFile
                    });
                    reject();
                } else
                    resolve(optPath);
            });
        });
    }

    /**
     * @method getAvailableCodecs
     * @returns Promise<Encoders|void>
     * @author ayuanlmo
     * @description 获取可用编解码器
     * **/
    public static getAvailableCodecs(): Promise<Encoders | void> {
        return new Promise((resolve, reject) => {
            ffmpeg.getAvailableEncoders((e, encoders) => {
                if (e) {
                    Logger.error(e.message);
                    reject();
                }
                resolve(encoders);
            });
        });
    }
}

export default Ffmpeg;

