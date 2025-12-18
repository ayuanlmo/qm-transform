import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from "electron";
import {mkdirSync} from "node:fs";
import Media from "./Media";
import {getLocalConfigAsMain} from "./Conf";

class TransformAudio {
    public static transformAudioMedia(media: IMediaInfo, ctx: IpcMainEvent): void {
        const appConf: IDefaultSettingConfig | null = getLocalConfigAsMain();
        const extName: string = path.extname(media.fullPath);
        const outputBaseName: string = Media.getOutputMediaFileName(media.fullPath);
        // 更健壮的输出目录推断：优先使用配置中的绝对路径，否则回落到源文件所在目录
        const confOutputPath: string | undefined = appConf?.output?.outputPath?.trim();
        const outputDir: string = confOutputPath && path.isAbsolute(confOutputPath)
            ? confOutputPath
            : path.dirname(media.fullPath);

        mkdirSync(outputDir, {recursive: true});

        // 根据用户选择的目标格式（optFormat）推断容器后缀
        let outputExt: string = extName.replace('.', '').toLowerCase();

        if (media.optFormat) {
            const lowerOpt: string = media.optFormat.toLowerCase();
            const knownContainers: string[] = [
                'mp3', 'aac', 'm4a', 'wav', 'flac', 'ogg', 'opus'
            ];

            if (knownContainers.includes(lowerOpt)) {
                outputExt = lowerOpt;
            } else if (lowerOpt.includes('mp3'))
                outputExt = 'mp3';
            else if (lowerOpt.includes('m4a'))
                outputExt = 'm4a';
            else if (lowerOpt.includes('wav'))
                outputExt = 'wav';
            else if (lowerOpt.includes('aac'))
                outputExt = 'aac';
            else if (lowerOpt.includes('ogg'))
                outputExt = 'ogg';
            else if (lowerOpt.includes('flac'))
                outputExt = 'flac';
            else if (lowerOpt.includes('opus'))
                outputExt = 'opus';
        }

        const outputPath: string = path.resolve(outputDir, `${outputBaseName}.${outputExt}`);

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
                // 确保任务在出错时也能结束，避免前端批量调度卡死
                ctx.reply('main:on:task-end', {
                    id: media.id,
                    progress: 100,
                    path: null,
                    baseName: media.baseName,
                    error: true,
                    errorMessage: err.message
                });
            });

        // 设置输出路径
        ffmpegCommand.output(outputPath);

        // 配置音频编码参数
        this.configureAudioEncoding(ffmpegCommand, media);

        // 开始转码
        ffmpegCommand.run();
    }

    /**
     * @author ayuanlmo
     * @method configureAudioEncoding
     * @param ffmpegCommand {FfmpegCommand}
     * @param media {IMediaInfo}
     * @description 配置音频编码参数
     * **/
    private static configureAudioEncoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo
    ): void {
        // 推断目标容器
        const container: string = (media.optFormat || path.extname(media.fullPath).replace('.', '')).toLowerCase();

        // 拆出用户传入的参数，后续按容器补默认值 / 做兼容处理
        let codec: string | undefined = media.audioParams?.codec;
        let bitrate: string | undefined = media.audioParams?.bitrate;
        let sampleRate: number | undefined = media.audioParams?.sampleRate;
        let channels: number | undefined = media.audioParams?.channels;

        // 按容器限制可用的音频编码器，并设置合理默认值
        switch (container) {
            case 'mp3':
                // MP3 使用 libmp3lame
                if (!codec || codec !== 'mp3') {
                    codec = 'libmp3lame';
                }
                if (!bitrate)
                    bitrate = '192k';
                break;
            case 'm4a':
            case 'aac':
                // M4A/AAC 使用 aac
                if (!codec || !['aac', 'libfdk_aac'].includes(codec)) {
                    codec = 'aac';
                }
                if (!bitrate)
                    bitrate = '192k';
                break;
            case 'ogg':
                // OGG 使用 libvorbis 或 libopus
                if (!codec || !['vorbis', 'libvorbis', 'opus', 'libopus'].includes(codec)) {
                    codec = 'libvorbis';
                }
                if (!bitrate)
                    bitrate = '160k';
                break;
            case 'flac':
                // FLAC 是无损格式，不需要 bitrate
                if (!codec || codec !== 'flac') {
                    codec = 'flac';
                }
                break;
            case 'opus':
                // Opus 编码
                if (!codec || codec !== 'opus') {
                    codec = 'libopus';
                }
                if (!bitrate)
                    bitrate = '128k';
                break;
            case 'wav':
                // WAV 通常使用 PCM，不需要 codec 设置
                if (!codec) {
                    codec = 'pcm_s16le';
                }
                break;
            default:
                // 其它容器保持 AAC 默认
                if (!codec)
                    codec = 'aac';
                if (!bitrate)
                    bitrate = '192k';
        }

        if (!channels)
            channels = 2;

        // 实际写入 FFmpeg 参数
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

export default TransformAudio;

