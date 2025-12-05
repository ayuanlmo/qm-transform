import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from "electron";
import Logger from "../lib/Logger";
import {existsSync, mkdirSync, readFileSync} from "node:fs";
import * as os from "node:os";

const isWin32: boolean = os.platform() === 'win32';
const appHomePath: string = path.resolve(isWin32 ? path.resolve(os.homedir(), 'AppData', 'Local', 'lmo-Transform') : path.resolve(os.homedir(), '.lmo-Transform'));
const configFileDir: string = path.resolve(appHomePath, 'config', 'Conf.t.json');
// 根据清晰度等级映射到具体的编码参数
const qualitySettings: Record<string, Partial<VideoEncodingParams>> = {
    very_low: {
        bitrate: '500k',
        crf: 30,
        pixFmt: 'yuv420p'
    },
    low: {
        bitrate: '1000k',
        crf: 28,
        pixFmt: 'yuv420p'
    },
    medium: {
        bitrate: '2000k',
        crf: 23,
        pixFmt: 'yuv420p'
    },
    high: {
        bitrate: '5000k',
        crf: 19,
        pixFmt: 'yuv420p'
    },
    very_high: {
        bitrate: '8000k',
        crf: 16,
        pixFmt: 'yuv444p'
    },
    original: {} // 使用原始设置
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
        const appConf: IDefaultSettingConfig | null = getLocalConfig();
        const extName: string = path.extname(media.fullPath);
        const outputBaseName: string = media.baseName.replace(extName, '');
        const outputDir: string = appConf?.output?.outputPath ?? '';

        console.log('outputDir', media);
        mkdirSync(outputDir, {recursive: true});

        // 根据用户选择的目标格式（optFormat）推断容器后缀
        const originExt: string = extName.replace('.', '').toLowerCase();
        let outputExt: string = originExt;

        if (media.optFormat) {
            const lowerOpt: string = media.optFormat.toLowerCase();

            if (lowerOpt.includes('mp4'))
                outputExt = 'mp4';
            else if (lowerOpt.includes('m3u8'))
                outputExt = 'm3u8';
            else if (lowerOpt.includes('ts'))
                outputExt = 'ts';
            else if (lowerOpt.includes('mkv'))
                outputExt = 'mkv';
            else if (lowerOpt.includes('avi'))
                outputExt = 'avi';
            else if (lowerOpt.includes('mov'))
                outputExt = 'mov';
        }

        const outputPath: string = path.resolve(
            outputDir,
            `${outputBaseName}.${outputExt}`
        );

        // 初始化FFmpeg命令
        const ffmpegCommand = ffmpeg(media.fullPath)
            .on('end', () => {
                ctx.reply('main:on:task-end', {
                    id: media.id,
                    progress: 100,
                    path: outputPath,
                    baseName: media.baseName
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

        // 目标封装格式（容器），优先使用 optFormat，其次使用源文件后缀
        const container: string = (media.optFormat || path.extname(media.fullPath).replace('.', '')).toLowerCase();

        // 不同容器对编解码器支持情况
        const containerCodecSupport: Record<string, string[]> = {
            mp4: ['h264', 'hevc'],
            m3u8: ['h264', 'hevc'],
            ts: ['h264', 'hevc'],
            mkv: ['h264', 'hevc'],
            avi: ['h264'], // 仅保留 H.264
            mov: ['h264', 'hevc']
        };

        const supportedCodecs: string[] = containerCodecSupport[container] || ['h264', 'hevc'];

        // 用户选择的目标视频编解码器（前端传入的是 'h264' | 'hevc'）
        let selectedCodec: string = (videoParams.codec || (media.isH265 ? 'hevc' : 'h264')).toLowerCase();

        // 容器不支持当前编解码器时回退到 H.264
        if (!supportedCodecs.includes(selectedCodec))
            selectedCodec = 'h264';

        // 根据配置文件中的 codecType / codecMethod 以及当前平台，推断 GPU 编码器后缀
        let hardwareEncoderSuffix: string | null = null;

        if (videoParams.gpuAcceleration) {
            const methodRaw: string = (appConf.output.codecMethod || '').toLowerCase();
            const platform: NodeJS.Platform = os.platform();

            if (platform === 'darwin') {
                // Apple 芯片 / macOS 下统一使用 videotoolbox
                hardwareEncoderSuffix = 'videotoolbox';
            } else {
                if (['amd', 'amf'].includes(methodRaw))
                    hardwareEncoderSuffix = 'amf';
                else if (['intel', 'qsv'].includes(methodRaw))
                    hardwareEncoderSuffix = 'qsv';
                else if (['nvidia', 'nvenc'].includes(methodRaw))
                    hardwareEncoderSuffix = 'nvenc';
            }
        }

        const useHardwareAcceleration: boolean = !!hardwareEncoderSuffix;

        // 如果配置开启 GPU 加速并且推断出了可用的硬件编码器，优先使用硬件编码
        if (useHardwareAcceleration) {
            const baseCodec = selectedCodec === 'hevc' ? 'hevc' : 'h264';

            ffmpegCommand.videoCodec(`${baseCodec}_${hardwareEncoderSuffix}`); // 例如 h264_nvenc / hevc_videotoolbox

            // 使用 CRF 模式进行质量控制（可按需再调）
            ffmpegCommand.addOutputOptions(['-crf', '18']);
        } else {
            // CPU 编码：优先使用前端传入的 libs，其次使用 selectedCodec
            if (media.libs && media.libs.trim().length > 0) {
                // libs 形如 "-c:v libx264"，直接拆分为 ffmpeg 参数
                ffmpegCommand.addOutputOptions(media.libs.trim().split(/\s+/));
            } else if (selectedCodec) {
                // 将 'h264' / 'hevc' 映射到实际的 libx264 / libx265 编码器
                if (selectedCodec === 'hevc')
                    ffmpegCommand.videoCodec('libx265');
                else
                    ffmpegCommand.videoCodec('libx264');
            }
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
        const quality = (media.quality || 'medium') as MediaQuality;

        // 使用原始质量，不应用任何调整
        if (quality === ('original' as MediaQuality)) return;

        const settings: Partial<VideoEncodingParams> = qualitySettings[quality] || {};

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
        // 用户选择“无音频”则直接禁用音频轨
        if (media.noAudio) {
            ffmpegCommand.noAudio();
            return;
        }

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
