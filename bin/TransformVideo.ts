import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from "electron";
import {homedir} from "node:os";
import Logger from "../lib/Logger";
import {existsSync, readFileSync,mkdirSync} from "node:fs";

const configFileDir: string = path.resolve(homedir(), 'config', 'Conf.t.json');
// 根据清晰度等级映射到具体的编码参数
const qualitySettings: Record<MediaQuality, Partial<VideoEncodingParams>> = {
    [MediaQuality.VERY_LOW]: {
        bitrate: '500k',
        crf: 30,
        pixFmt: 'yuv420p'
    },
    [MediaQuality.LOW]: {
        bitrate: '1000k',
        crf: 28,
        pixFmt: 'yuv420p'
    },
    [MediaQuality.MEDIUM]: {
        bitrate: '2000k',
        crf: 23,
        pixFmt: 'yuv420p'
    },
    [MediaQuality.HIGH]: {
        bitrate: '5000k',
        crf: 19,
        pixFmt: 'yuv420p'
    },
    [MediaQuality.VERY_HIGH]: {
        bitrate: '8000k',
        crf: 16,
        pixFmt: 'yuv444p'
    },
    [MediaQuality.ORIGINAL]: {} // 使用原始设置
};

export const getLocalConfig = (): IDefaultSettingConfig | null => {
    if (existsSync(configFileDir)) {
        try {
            return JSON.parse(readFileSync(configFileDir, 'utf8'));
        } catch (error) {
            Logger.error('Failed to parse config file:', error);
        }
    }
    return null;
};

class TransformVideo {
    public static transformVideoMedia(media: IMediaInfo, ctx: IpcMainEvent): void {
        const appConf = getLocalConfig();
        const extName: string = path.extname(media.fullPath);
        const outputBaseName = media.baseName.replace(extName, '');
        const outputDir = appConf?.output?.outputPath ?? '';

        mkdirSync(outputDir, { recursive: true });

        const outputPath: string = path.resolve(
            outputDir,
            `${outputBaseName}.${media.optFormat}`
        );

        // 初始化FFmpeg命令
        const ffmpegCommand = ffmpeg(media.fullPath)
            .on('end', () => {
                ctx.reply('main:on:media-transform-progress', {
                    id: media.id,
                    progress: 100
                });
            })
            .on('progress', (progress) => {
                ctx.reply('main:on:media-transform-progress', {
                    id: media.id,
                    progress: Math.round(progress.percent || 0),
                    optPath: outputPath
                });
            })
            .on('error', (err) => {
                console.error('FFmpeg error:', err);
                ctx.reply('main:on:media-transform-progress', {
                    id: media.id,
                    mediaFile: media.fullPath,
                    error: true,
                    errorMessage: err.message
                });
            });

        // 设置输出路径
        ffmpegCommand.output(outputPath);
        // 处理视频编码参数
        if (appConf)
            this.configureVideoEncoding(ffmpegCommand, media, appConf);
        // 处理音频编码参数
        this.configureAudioEncoding(ffmpegCommand, media);
        // 开始转码
        ffmpegCommand.run();
    }

    /**
     * @author ayuanlmo
     * @method configureVideoEncoding
     * @param ffmpegCommand {FfmpegCommand}
     * @param media {IMediaInfo}
     * @param appConf {IDefaultSettingConfig}
     * @description 配置视频编码参数
     * **/
    private static configureVideoEncoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        appConf: IDefaultSettingConfig
    ): void {
        const defaultVideoParams: VideoEncodingParams = {
            ...media.videoParams,
            gpuAcceleration: appConf?.output?.codecType === 'GPU',
            hardwareEncoder: appConf?.output?.codecMethod
        };

        const videoParams = {
            ...defaultVideoParams,
            ...media.videoParams
        };

        // 如果用户没有明确禁用GPU加速且支持硬件编码
        if (videoParams.gpuAcceleration && videoParams.hardwareEncoder) {
            const baseCodec = media.isH264 ? 'h264' :
                media.isH265 ? 'hevc' :
                    undefined;

            if (baseCodec && ['amf', 'qsv', 'nvenc'].includes(videoParams.hardwareEncoder))
                ffmpegCommand.videoCodec(`${baseCodec}_${videoParams.hardwareEncoder}`);// 使用特定的GPU编码器
            else if (media.videoParams.codec && media.videoParams.codec.includes('264'))
                ffmpegCommand.outputOptions('-c:v libx264');// 回退到软件编码
            else if (media.videoParams.codec && media.videoParams.codec.includes('265'))
                ffmpegCommand.outputOptions('-c:v libx265');// 回退到软件编码

            // 使用CRF模式进行质量控制
            ffmpegCommand.addOutputOptions(['-crf', '18']);
        }
        // 应用清晰度设置
        this.applyQualitySettings(ffmpegCommand, media, videoParams);
        // 应用其他视频参数
        if (videoParams.bitrate)
            ffmpegCommand.videoBitrate(videoParams.bitrate);
        if (videoParams.fps)
            ffmpegCommand.fps(videoParams.fps);
        if (videoParams.preset)
            ffmpegCommand.addOutputOptions(`-preset ${videoParams.preset}`);
        if (videoParams.tune)
            ffmpegCommand.addOutputOptions(`-tune ${videoParams.tune}`);
        if (videoParams.profile)
            ffmpegCommand.addOutputOptions(`-profile:v ${videoParams.profile}`);
        if (videoParams.level)
            ffmpegCommand.addOutputOptions(`-level ${videoParams.level}`);
        if (videoParams.pixFmt)
            ffmpegCommand.addOutputOptions(`-pix_fmt ${videoParams.pixFmt}`);
    }

    private static applyQualitySettings(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        videoParams: VideoEncodingParams
    ): void {
        const quality: MediaQuality = media.quality || MediaQuality.MEDIUM;

        // 使用原始质量，不应用任何调整
        if (quality === MediaQuality.ORIGINAL) return;

        const settings: Partial<VideoEncodingParams> = qualitySettings[quality];

        if (settings.bitrate && !videoParams.bitrate)
            ffmpegCommand.videoBitrate(settings.bitrate);
        if (settings.crf !== undefined && !videoParams.crf)
            ffmpegCommand.addOutputOptions(`-crf ${settings.crf}`);
        if (settings.pixFmt && !videoParams.pixFmt)
            ffmpegCommand.addOutputOptions(`-pix_fmt ${settings.pixFmt}`);
    }

    private static configureAudioEncoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo
    ): void {
        // 默认音频设置
        if (!media.audioParams)
            return void ffmpegCommand.audioCodec('aac')
                .audioBitrate('192k')
                .audioChannels(2);


        const {codec, bitrate, sampleRate, channels} = media.audioParams;

        if (codec)
            ffmpegCommand.audioCodec(codec);
        if (bitrate)
            ffmpegCommand.audioBitrate(bitrate);
        if (sampleRate)
            ffmpegCommand.audioFrequency(sampleRate);
        if (channels)
            ffmpegCommand.audioChannels(channels);
    }
}

export default TransformVideo;
