import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from "electron";
import {mkdirSync} from "node:fs";
import Media from "./Media";
import {getLocalConfigAsMain} from "./Conf";
import taskManager from "./TaskManager";
import {IResumeSegment, toSeconds} from "./TaskSegments";
import {AUDIO_CODEC_ALIAS} from "./TransformVideo";
import Logger from "../lib/Logger";

class TransformAudio {
    public static transformAudioMedia(media: IMediaInfo, ctx: IpcMainEvent, resume?: IResumeSegment): void {
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

        let outputPath: string = Media.buildOutputPath(outputDir, outputBaseName, outputExt);

        // 续转时沿用注册时的产物路径（自定义命名规则里的 {random} 每次都会推出新名字），
        // 本段写到分段文件上，收尾时由 TaskManager 并回产物
        if (resume) {
            outputPath = resume.outputPath;
            outputExt = path.extname(outputPath).replace('.', '').toLowerCase();
        }

        const partPath: string = resume ? resume.partPath : outputPath;
        const totalSeconds: number = toSeconds(media.mediaInfo?.format?.duration);

        // 注册任务到 TaskManager（resume 时任务记录已存在，重建会把检查点清零）
        if (!resume) {
            taskManager.registerTask(media.id, media, media.fullPath, outputPath, ctx, {
                totalSeconds,
                restart: (startSeconds: number, nextPart: string): void =>
                    TransformAudio.transformAudioMedia(media, ctx, {startSeconds, partPath: nextPart, outputPath})
            });
        }

        // 初始化Ffmpeg
        const ffmpegCommand: FfmpegCommand = ffmpeg(media.fullPath)
            .on('start', (): void => {
                // 获取进程 PID
                const ffmpegProc = (ffmpegCommand as any).ffmpegProc;

                if (ffmpegProc && ffmpegProc.pid)
                    taskManager.attachPid(media.id, ffmpegProc.pid, ffmpegProc);
            })
            .on('end', async (): Promise<void> => {
                // 检查任务是否处于暂停状态，如果是暂停导致的结束，不发送完成事件
                if (taskManager.isPaused(media.id)) {
                    Logger.info(`Task ${media.id} ended due to pause, not marking as complete`);
                    return;
                }

                // 续转过就得先把最后一段并回产物，否则"完成"指向的只是尾巴那一截
                try {
                    await taskManager.finalize(media.id);
                } catch (e) {
                    Logger.error(`Task ${media.id} failed to stitch resumed segments: ${(e as Error).message}`);
                    taskManager.cleanup(media.id);
                    ctx.reply('main:on:task-end', {
                        id: media.id,
                        progress: 100,
                        path: null,
                        baseName: media.baseName,
                        error: true,
                        errorMessage: 'The resumed segments could not be merged into the output file.'
                    });
                    return;
                }

                // 清理任务
                taskManager.cleanup(media.id);
                // 补发一次 100% 进度，避免 Windows 下进度未满时前端卡住
                ctx.reply('main:on:media-transform-progress', {
                    id: media.id,
                    progress: 100,
                    optPath: outputPath
                });
                ctx.reply('main:on:task-end', {
                    id: media.id,
                    progress: 100,
                    path: outputPath,
                    baseName: media.baseName
                });
            })
            .on('progress', (progress): void => {
                // 如果任务已暂停，不处理进度更新
                if (taskManager.isPaused(media.id)) {
                    Logger.info(`Task ${media.id} progress event ignored (task is paused)`);
                    return;
                }

                const progressPercent: number = taskManager.progressOf(media.id, progress.timemark, Math.round(progress.percent || 0));

                ctx.reply('main:on:media-transform-progress', {
                    id: media.id,
                    progress: progressPercent,
                    optPath: outputPath
                });
            })
            .on('error', (err): void => {
                // 检查任务是否处于暂停状态，如果是暂停导致的错误，不发送完成事件
                if (taskManager.isPaused(media.id)) {
                    Logger.info(`Task ${media.id} error due to pause, not marking as complete`);
                    return;
                }
                // 清理任务
                taskManager.cleanup(media.id);
                console.error('Ffmpeg error:', err);
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

        // 续转分段从已完成的秒数接着往后转。-ss 必须落在 -i 之前才是输入端精确 seek
        if (resume && resume.startSeconds > 0)
            ffmpegCommand.inputOption(['-ss', resume.startSeconds.toFixed(3)]);

        // 设置输出路径（续转时指向本分段，收尾后由 TaskManager 并回 outputPath）
        ffmpegCommand.output(partPath);

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
        const sampleRate: number | undefined = media.audioParams?.sampleRate;
        let channels: number | undefined = media.audioParams?.channels;

        // 按容器限制可用的音频编码器，并设置合理默认值
        // 注意：前端传的是"格式名"（mp3 / opus / vorbis），ffmpeg 的编码器名是 libmp3lame / libopus / libvorbis，
        // 直接把格式名塞给 audioCodec 会得到 "Audio codec mp3 is not available"，所以这里一律归一成编码器名。
        switch (container) {
            case 'mp3':
                codec = 'libmp3lame';
                if (!bitrate)
                    bitrate = '192k';
                break;
            case 'm4a':
            case 'aac':
                if (!['aac', 'libfdk_aac'].includes(codec ?? '')) {
                    codec = 'aac';
                }
                if (!bitrate)
                    bitrate = '192k';
                break;
            case 'ogg':
                codec = ['opus', 'libopus'].includes(codec ?? '') ? 'libopus' : 'libvorbis';
                if (!bitrate)
                    bitrate = '160k';
                break;
            case 'flac':
                codec = 'flac';
                break;
            case 'opus':
                codec = 'libopus';
                if (!bitrate)
                    bitrate = '128k';
                break;
            case 'wav':
                codec = 'pcm_s16le';
                break;
            default:
                if (!codec)
                    codec = 'aac';
                if (!bitrate)
                    bitrate = '192k';
        }

        if (!channels)
            channels = 2;

        // 实际写入 FFmpeg 参数
        if (codec)
            ffmpegCommand.audioCodec(AUDIO_CODEC_ALIAS[codec] ?? codec);
        if (bitrate)
            ffmpegCommand.audioBitrate(bitrate);
        if (sampleRate)
            ffmpegCommand.audioFrequency(sampleRate);
        if (channels)
            ffmpegCommand.audioChannels(channels);
    }
}

export default TransformAudio;

