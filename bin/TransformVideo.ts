import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from "electron";
import {mkdirSync, existsSync, statSync, unlinkSync} from "node:fs";
import * as os from "node:os";
import Media from "./Media";
import Ffmpeg from "./Ffmpeg";
import {getLocalConfigAsMain} from "./Conf";
import taskManager from "./TaskManager";
import {IResumeSegment, toSeconds} from "./TaskSegments";
import Logger from "../lib/Logger";

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

// 质量等级到 CRF/CQ 值的映射（用于 NVENC/QSV/AMF）
const qualityToCrfMap: Record<string, string> = {
    'very_high': '16',
    'high': '19',
    'medium': '23',
    'low': '28',
    'very_low': '30'
};

// 质量等级到 q:v 值的映射（用于 VideoToolbox）
const qualityToQValueMap: Record<string, string> = {
    'very_high': '10',
    'high': '20',
    'medium': '30',
    'low': '50',
    'very_low': '60'
};

/**
 * 获取容器格式
 */
const getContainer = (media: IMediaInfo): string => {
    return (media.optFormat || path.extname(media.fullPath).replace('.', '')).toLowerCase();
};

type VideoEncodingMeta = {
    useHardwareAcceleration: boolean;
    hardwareEncoderSuffix: string | null;
    selectedCodec: string;
};

/**
 * 将音频码率规范到合理范围（主要避免探测值过高导致编码器拒绝）
 */
// 前端下拉框给的是格式名，ffmpeg 的编码器另有其名，直接透传会得到 "Audio codec mp3 is not available"
export const AUDIO_CODEC_ALIAS: Record<string, string> = {
    mp3: 'libmp3lame',
    opus: 'libopus',
    vorbis: 'libvorbis'
};

const normalizeAudioBitrate = (codec?: string, bitrate?: string): string | undefined => {
    if (!bitrate) return bitrate;

    const match: RegExpMatchArray | null = bitrate.match(/^(\d+(?:\.\d+)?)([kKmM]?)$/);

    if (!match) return bitrate;

    const value: number = parseFloat(match[1]);
    const unit: string = match[2].toLowerCase();

    // 当前仅针对 AAC/MP3 做上限限制，避免传入数百 Mbps 直接报错
    const isAacOrMp3: boolean = !!codec && ['aac', 'mp3'].includes(codec.toLowerCase());

    if (!isAacOrMp3) return bitrate;

    // 将 Mbps 级别的值视为 k 误传，先换算到 k
    const valueInKbps: number = unit === 'm' ? value * 1000 : value;

    // 合理区间 64k - 512k；超出时压回 320k，过低则提升到 64k
    if (valueInKbps > 512) return '320k';
    if (valueInKbps < 32) return '64k';

    // 保持原有单位（默认为 k）
    return `${valueInKbps}${unit === 'm' ? 'k' : 'k'}`;
};

/** h264_amf/hevc_amf 的 -quality 是 0..2 的枚举（speed/balanced/quality），不能当 CRF 传。 */
const qualityToAmfMap: Record<string, string> = {
    'very_low': 'speed',
    'low': 'speed',
    'medium': 'balanced',
    'high': 'quality',
    'very_high': 'quality'
};

/**
 * @method inferHardwareEncoderSuffix
 * @param codecMethod {string} 配置中的 codecMethod
 * @param platform {NodeJS.Platform}
 * @returns {string | null}
 * @description 由配置推断硬件编码器后缀。推断与可用性探测分离，
 * 保证 configureVideoEncoding 和预检看到的是同一个后缀。
 * **/
const inferHardwareEncoderSuffix = (codecMethod: string, platform: NodeJS.Platform): string | null => {
    if (platform === 'darwin') return 'videotoolbox';

    const methodRaw: string = (codecMethod || '').toLowerCase();

    if (['amd', 'amf'].includes(methodRaw)) return 'amf';
    if (['intel', 'qsv'].includes(methodRaw)) return 'qsv';
    if (['nvidia', 'nvenc'].includes(methodRaw)) return 'nvenc';

    return null;
};

/**
 * @method resolveVideoBitrate
 * @param raw {string | undefined}
 * @returns {{value: string | null, fromSource: boolean}}
 * @description ffprobe 的 bit_rate 是 bps 且不带单位，而 fluent-ffmpeg 的 videoBitrate 会在纯数字后补 'k'，
 * 于是 48Mbps 的源会被写成 `-b:v 48000000k`（48Gbps）。这里统一换算成 kbps，并标记来源以便硬件编码忽略。
 * **/
const resolveVideoBitrate = (raw?: string): { value: string | null; fromSource: boolean } => {
    const text: string = (raw || '').trim();

    if (!text) return {value: null, fromSource: false};

    // 用户在界面选的值形如 2000k，原样使用
    if (!/^\d+$/.test(text)) return {value: text, fromSource: false};

    const bps: number = Number(text);

    if (!Number.isFinite(bps) || bps <= 0) return {value: null, fromSource: true};

    return {value: `${Math.max(1, Math.round(bps / 1000))}k`, fromSource: true};
};

/**
 * @method isEmptyOutput
 * @param outputPath {string}
 * @returns {boolean}
 * @description ffmpeg 以 0 退出但一个字节都没写出（编码器初始化失败、所有流被禁用）时的产物判定。
 * **/
export const isEmptyOutput = (outputPath: string): boolean => {
    try {
        return !existsSync(outputPath) || statSync(outputPath).size === 0;
    } catch {
        return true;
    }
};

/**
 * @method hasResolutionChange
 * @param videoParams {VideoEncodingParams}
 * @returns {boolean}
 * @description 目标分辨率与源分辨率是否不同（即是否需要在输出上加 scale 滤镜）。
 * **/
const hasResolutionChange = (videoParams: VideoEncodingParams): boolean => {
    const targetWidth: number = videoParams.width || 0;
    const targetHeight: number = videoParams.height || 0;
    const originalWidth: number = videoParams.originWidth || 0;
    const originalHeight: number = videoParams.originHeight || 0;

    return targetWidth > 0 && targetHeight > 0 &&
        (targetWidth !== originalWidth || targetHeight !== originalHeight);
};

/** 失败残留的空文件会被前端当成可打开的输出，这里只删除长度为 0 的产物。 */
export const discardEmptyOutput = (outputPath: string): void => {
    try {
        if (existsSync(outputPath) && statSync(outputPath).size === 0)
            unlinkSync(outputPath);
    } catch (e) {
        Logger.warn(`[TransformVideo] cannot remove incomplete output ${outputPath}: ${(e as Error).message}`);
    }
};

/**
 * @method resolveHardwareEncoder
 * @param codec {string} 'h264' | 'hevc' | 其它
 * @param codecType {string | undefined}
 * @param codecMethod {string | undefined}
 * @param platform {NodeJS.Platform}
 * @returns {{encoder: string, suffix: string} | null}
 * @description 硬件编码选择的唯一入口：转换与串联共用，避免两处对 codecMethod 的解读走偏。
 * **/
const resolveHardwareEncoder = (
    codec: string,
    codecType: string | undefined,
    codecMethod: string | undefined,
    platform: NodeJS.Platform
): { encoder: string; suffix: string } | null => {
    if (codecType !== 'GPU' || platform === 'linux') return null;
    if (codec !== 'h264' && codec !== 'hevc') return null;

    const suffix: string | null = inferHardwareEncoderSuffix(codecMethod || '', platform);

    if (!suffix) return null;

    return {encoder: `${codec === 'hevc' ? 'hevc' : 'h264'}_${suffix}`, suffix};
};

/**
 * @method resolveConcatEncoder
 * @param codec {string}
 * @param appConf {IDefaultSettingConfig | null}
 * @param outputPath {string} 预检失败时用于清理半成品
 * @param ctx {IpcMainEvent}
 * @returns {Promise<string>} 实际可用的视频编码器名
 * @description 串联的 filter_complex 必然走软件滤镜，硬件解码在这里无法参与，因此只校验编码器本身能否打开。
 * **/
export const resolveConcatEncoder = async (
    codec: string,
    appConf: IDefaultSettingConfig | null,
    outputPath: string,
    ctx: IpcMainEvent
): Promise<string> => {
    const fallback: string = codec === 'hevc' ? 'libx265' : 'libx264';
    const hardware: { encoder: string; suffix: string } | null =
        resolveHardwareEncoder(codec, appConf?.output?.codecType, appConf?.output?.codecMethod, os.platform());

    if (!hardware) return fallback;
    if (await Ffmpeg.isEncoderAvailable(hardware.encoder)) return hardware.encoder;

    Logger.warn(`[ConcatVideo] ${hardware.encoder} is not usable on this machine, falling back to ${fallback}`);

    // 预检失败时 ffmpeg 还没起跑，但输出文件已经建好，是个打不开的 0 字节空壳
    if (isEmptyOutput(outputPath)) {
        discardEmptyOutput(outputPath);
        ctx.reply('main:on:error', {
            type: 'media-binary-missing',
            message: `${hardware.encoder} is unavailable on this machine.`,
            mediaFile: outputPath
        });
    }

    return fallback;
};

class TransformVideo {
    public static async transformVideoMedia(media: IMediaInfo, ctx: IpcMainEvent, resume?: IResumeSegment): Promise<void> {
        const appConf: IDefaultSettingConfig | null = getLocalConfigAsMain();
        const extName: string = path.extname(media.fullPath);
        const outputBaseName: string = Media.getOutputMediaFileName(media.fullPath);
        // 更健壮地输出目录推断：优先使用配置中的绝对路径，否则回落到源文件所在目录
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
                'mp4', 'm3u8', 'ts', 'mkv', 'avi', 'mov',
                'webm', 'flv', 'wmv', 'mpg', 'mpeg', '3gp'
            ];

            if (knownContainers.includes(lowerOpt)) {
                outputExt = lowerOpt;
            } else if (lowerOpt.includes('mp4'))
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
            else if (lowerOpt.includes('webm'))
                outputExt = 'webm';
            else if (lowerOpt.includes('flv'))
                outputExt = 'flv';
            else if (lowerOpt.includes('wmv'))
                outputExt = 'wmv';
            else if (lowerOpt.includes('3gp'))
                outputExt = '3gp';
            else if (lowerOpt.includes('mpg') || lowerOpt.includes('mpeg'))
                outputExt = 'mpg';
        }

        let outputPath: string = Media.buildOutputPath(outputDir, outputBaseName, outputExt);

        // For m3u8/HLS: output m3u8 and ts segments into a dedicated subfolder for easier discovery
        if (outputExt === 'm3u8') {
            const m3u8BaseName = path.basename(outputPath, '.m3u8');
            const m3u8Dir = path.join(outputDir, m3u8BaseName);

            mkdirSync(m3u8Dir, {recursive: true});
            outputPath = path.join(m3u8Dir, `${m3u8BaseName}.m3u8`);
        }

        // 续转时必须沿用注册时的产物路径：自定义命名规则里的 {random} 每次推断都会得到一个新文件名，
        // 那样已拼好的前段就成了孤儿。本段则写到分段文件上，收尾时由 TaskManager 并回产物。
        if (resume) {
            outputPath = resume.outputPath;
            outputExt = path.extname(outputPath).replace('.', '').toLowerCase();
        }

        const partPath: string = resume ? resume.partPath : outputPath;
        const totalSeconds: number = toSeconds(media.mediaInfo?.format?.duration);

        // 在“保持原画质 + 无额外参数 + 容器不变时，尝试直接流拷贝，可极大提升编码之速度
        const sourceExt: string = extName.replace('.', '').toLowerCase();
        const sameContainer: boolean = outputExt === sourceExt;

        const hasVideoParams: boolean = !!media.videoParams && Object.keys(media.videoParams).length > 0;
        const hasAudioParams: boolean = !!media.audioParams && Object.keys(media.audioParams).length > 0;
        const keepOriginalQuality: boolean = !media.quality || media.quality === ('original' as MediaQuality);

        const canCopyVideo: boolean = sameContainer && keepOriginalQuality && !hasVideoParams && !media.libs;
        const canCopyAudio: boolean = !media.noAudio && !hasAudioParams;
        const useStreamCopy: boolean = canCopyVideo && (canCopyAudio || media.noAudio === true);

        // 续转注册（resume 时任务记录已在 TaskManager 里，重建会把检查点清零）
        if (!resume) {
            taskManager.registerTask(media.id, media, media.fullPath, outputPath, ctx, {
                totalSeconds,
                // 流拷贝下的 -ss 只能落到最近的关键帧，接缝会重复几帧画面，这类任务不提供续转钩子
                restart: useStreamCopy
                    ? undefined
                    : (startSeconds: number, nextPart: string): Promise<void> =>
                        TransformVideo.transformVideoMedia(media, ctx, {startSeconds, partPath: nextPart, outputPath})
            });
        }

        let videoEncodingMeta: VideoEncodingMeta = {
            useHardwareAcceleration: false,
            hardwareEncoderSuffix: null,
            selectedCodec: ''
        };

        // 初始化Ffmpeg命令
        const ffmpegCommand: FfmpegCommand = ffmpeg(media.fullPath)
            .on('start', (commandLine: string): void => {
                Logger.info(`Task ${media.id} ffmpeg start: ${commandLine}`);
                if (videoEncodingMeta.useHardwareAcceleration)
                    Logger.info(`Task ${media.id} hardware encoder: ${videoEncodingMeta.selectedCodec}_${videoEncodingMeta.hardwareEncoderSuffix}`);
                else
                    Logger.info(`Task ${media.id} using software encoder: ${videoEncodingMeta.selectedCodec || 'auto'}`);
                // 获取进程 PID
                const ffmpegProc = (ffmpegCommand as any).ffmpegProc;

                if (ffmpegProc && ffmpegProc.pid) {
                    taskManager.attachPid(media.id, ffmpegProc.pid, ffmpegProc);

                    // 监听 stderr 输出，检查是否有硬件编码器相关的错误
                    if (ffmpegProc.stderr) {
                        let stderrBuffer = '';

                        ffmpegProc.stderr.on('data', (data: Buffer): void => {
                            const stderrStr = data.toString();

                            stderrBuffer += stderrStr;

                            // 检查是否有 "not available" 或 "not supported" 的错误
                            if (stderrStr.toLowerCase().includes('not available') ||
                                stderrStr.toLowerCase().includes('not supported')) {
                                Logger.error(`Task ${media.id} Ffmpeg encoder may not be available: ${stderrStr.trim()}`);
                            }
                        });

                        ffmpegProc.stderr.on('end', (): void => {
                            // 检查是否有回退到软件编码的迹象
                            const lowerBuffer = stderrBuffer.toLowerCase();

                            if (lowerBuffer.includes('software') ||
                                lowerBuffer.includes('fallback') ||
                                lowerBuffer.includes('sw encoding') ||
                                lowerBuffer.includes('using software')) {
                                Logger.error(`Task ${media.id} Hardware encoder may have fallen back to software encoding`);
                            }
                        });
                    }
                }
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

                // ffmpeg 有可能以 0 退出却没有写出任何数据，这会被前端显示成"转换成功"然后打不开文件
                if (isEmptyOutput(outputPath)) {
                    Logger.error(`Task ${media.id} ffmpeg exited without writing ${outputPath}`);
                    ctx.reply('main:on:task-end', {
                        id: media.id,
                        progress: 100,
                        path: null,
                        baseName: media.baseName,
                        error: true,
                        errorMessage: 'ffmpeg wrote nothing to the output file.'
                    });
                    return;
                }

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
            .on('progress', (progress) => {
                // 如果任务已暂停，不处理进度更新
                if (taskManager.isPaused(media.id)) {
                    return;
                }

                // 续转分段里 fluent-ffmpeg 的 percent 从本段起点算起，要折回全局进度
                const progressPercent: number = taskManager.progressOf(media.id, progress.timemark, Math.round(progress.percent || 0));

                ctx.reply('main:on:media-transform-progress', {
                    id: media.id,
                    progress: progressPercent,
                    optPath: outputPath
                });
            })
            .on('error', (err) => {
                // 检查任务是否处于暂停状态，如果是暂停导致的错误，不发送完成事件
                if (taskManager.isPaused(media.id)) {
                    return;
                }
                // 清理任务
                taskManager.cleanup(media.id);
                // 硬件编码器在打开阶段失败时，ffmpeg 已经创建了输出文件但没有任何内容
                discardEmptyOutput(partPath);
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

        if (useStreamCopy) {
            // 单纯的容器内重封装：视频/音频按需 copy 或禁用音频，速度快
            ffmpegCommand.videoCodec('copy');
            if (media.noAudio)
                ffmpegCommand.noAudio();
            else
                ffmpegCommand.audioCodec('copy');
        } else {
            // 需要重新编码时，按原有逻辑配置视频/音频编码参数
            if (appConf)
                videoEncodingMeta = await this.configureVideoEncoding(ffmpegCommand, media, appConf);
            this.configureAudioEncoding(ffmpegCommand, media);
        }

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
    private static async configureVideoEncoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        appConf: IDefaultSettingConfig
    ): Promise<VideoEncodingMeta> {
        // 从配置中获取 GPU 加速设置，确保不被 media.videoParams 覆盖
        const gpuAccelerationFromConfig: boolean =
            appConf?.output?.codecType === 'GPU' && os.platform() !== 'linux';
        const hardwareEncoderFromConfig: string | undefined = appConf?.output?.codecMethod;

        // 合并参数：优先使用配置中的 GPU 设置，然后使用 media.videoParams 的其他参数
        const videoParams: VideoEncodingParams = {
            ...media.videoParams,
            gpuAcceleration: gpuAccelerationFromConfig,
            hardwareEncoder: hardwareEncoderFromConfig
        };

        // 目标封装格式（容器），优先使用 optFormat，其次使用源文件后缀
        const container: string = getContainer(media);

        // 不同容器对编解码器支持情况
        const containerCodecSupport: Record<string, string[]> = {
            mp4: ['h264', 'hevc'],
            m3u8: ['h264', 'hevc'],
            ts: ['h264', 'hevc'],
            mkv: ['h264', 'hevc', 'vp9'],
            avi: ['h264'], // 仅保留 H.264
            mov: ['h264', 'hevc'],
            webm: ['vp9'],
            flv: ['h264'],
            wmv: ['h264'],
            mpg: ['h264'],
            mpeg: ['h264'],
            '3gp': ['h264']
        };

        const supportedCodecs: string[] = containerCodecSupport[container] || ['h264', 'hevc', 'vp9'];

        // 用户选择的目标视频编解码器（前端传入的是 'h264' | 'hevc' | 'vp9'）
        let selectedCodec: string = (videoParams.codec || (media.isH265 ? 'hevc' : 'h264')).toLowerCase();

        // 容器不支持当前编解码器时回退到容器支持的第一个编码器
        if (!supportedCodecs.includes(selectedCodec))
            selectedCodec = supportedCodecs[0] || 'h264';

        // GPU 编码器推断 + 可用性预检。编码器出现在构建里不代表本机驱动可用：
        // 没有 AMD 显卡时 h264_amf 依然可执行，但 avcodec_open2 会失败，进程秒退并留下一个空文件。
        const candidateEncoder: { encoder: string; suffix: string } | null =
            resolveHardwareEncoder(selectedCodec, appConf?.output?.codecType, appConf?.output?.codecMethod, os.platform());
        const hardwareEncoder: { encoder: string; suffix: string } | null =
            candidateEncoder && await Ffmpeg.isEncoderAvailable(candidateEncoder.encoder) ? candidateEncoder : null;

        if (candidateEncoder && !hardwareEncoder)
            Logger.warn(`Task ${media.id} ${candidateEncoder.encoder} is not usable on this machine, falling back to the software encoder`);

        const useHardwareAcceleration: boolean = !!hardwareEncoder;
        const hardwareEncoderSuffix: string | null = hardwareEncoder?.suffix ?? null;
        const resultMeta: VideoEncodingMeta = {
            useHardwareAcceleration,
            hardwareEncoderSuffix,
            selectedCodec
        };

        // 需要缩放时放弃硬件解码：滤镜链的输入格式与硬件 surface 的对接在各 API 上不一致
        // （qsv 要 hwdownload，d3d11va 加了 hwdownload 反而报 "Impossible to convert between the formats"），
        // 而硬件解码 + 软件滤镜组合失败后 ffmpeg 会立刻退出并留下 0 字节文件。软件解码不影响硬件编码的收益。
        const needsScale: boolean = hasResolutionChange(videoParams);

        if (hardwareEncoder) {
            ffmpegCommand.videoCodec(hardwareEncoder.encoder); // 例如 h264_nvenc / hevc_videotoolbox

            // 配置硬件编码器参数
            this.configureHardwareEncoder(ffmpegCommand, media, hardwareEncoder.suffix, !needsScale);
        } else {
            // CPU 编码：优先使用前端传入的 libs，其次使用 selectedCodec
            if (media.libs && media.libs.trim().length > 0) {
                // libs 形如 "-c:v libx264"，直接拆分为 ffmpeg 参数
                ffmpegCommand.addOutputOptions(media.libs.trim().split(/\s+/));
            } else if (selectedCodec) {
                // 将 'h264' / 'hevc' / 'vp9' 映射到实际的编码器实现
                if (selectedCodec === 'hevc')
                    ffmpegCommand.videoCodec('libx265');
                else if (selectedCodec === 'vp9')
                    ffmpegCommand.videoCodec('libvpx-vp9');
                else
                    ffmpegCommand.videoCodec('libx264');
            }
        }
        // 硬件编码的质量已由 configureHardwareEncoder 按编码器自己的语法设置好，
        // 这里不再叠加 CRF/码率/像素格式：nvenc 用 -cq、qsv 用 -crf、amf 用 -qp_i/-qp_p、videotoolbox 用 -q:v，
        // 且各家硬件编码器只接受 nv12/p010 等固定像素格式，透传源文件的 yuv444p/10bit 会被拒绝。
        const isVideoToolbox: boolean = useHardwareAcceleration && hardwareEncoderSuffix === 'videotoolbox';

        this.applyQualitySettings(
            ffmpegCommand,
            media,
            videoParams,
            isVideoToolbox,
            useHardwareAcceleration,
            useHardwareAcceleration,
            useHardwareAcceleration
        );

        // 应用分辨率设置
        this.applyResolutionSettings(ffmpegCommand, media, videoParams);

        // 应用其他视频参数
        // VideoToolbox 不支持 bitrate 和 preset 参数，使用 q:v 控制质量
        if (isVideoToolbox) {
            // VideoToolbox 只使用 q:v，不使用 bitrate 和 preset
            if (videoParams.fps)
                ffmpegCommand.fps(videoParams.fps);
        } else {
            // 探测到的源码率只用于 CPU 编码；硬件编码有自己的 rate control，
            // 且 nvenc 分支显式使用 `-b:v 0` + CQ，再叠加源码率会互相冲突
            const bitrateInfo: { value: string | null; fromSource: boolean } = resolveVideoBitrate(videoParams.bitrate);
            const shouldApplyBitrate: boolean = !useHardwareAcceleration || !bitrateInfo.fromSource;

            if (shouldApplyBitrate && bitrateInfo.value)
                ffmpegCommand.videoBitrate(bitrateInfo.value);
            if (videoParams.fps)
                ffmpegCommand.fps(videoParams.fps);
            // preset 名单来自 x264（ultrafast..veryslow）：NVENC 只认 p1..p7，AMF 根本没有该选项，
            // 传给硬件编码器会让 ffmpeg 在打开编码器时报错并留下空文件，因此只用于 CPU 编码。
            if (!useHardwareAcceleration)
                ffmpegCommand.addOutputOptions(`-preset ${videoParams.preset || 'faster'}`);
        }
        // tune/profile/level 同样是 x264 语义（如 profile=main10），硬件编码器会直接拒绝；
        // 硬件路径交给编码器自己协商 profile 与 level。
        if (!useHardwareAcceleration) {
            if (videoParams.tune)
                ffmpegCommand.addOutputOptions(`-tune ${videoParams.tune}`);
            if (videoParams.profile)
                ffmpegCommand.addOutputOptions(`-profile:v ${videoParams.profile}`);
            if (videoParams.level)
                ffmpegCommand.addOutputOptions(`-level ${videoParams.level}`);
        }
        // 像素格式仅对 CPU 编码透传，硬件编码使用编码器默认的 nv12/p010
        if (videoParams.pixFmt && !useHardwareAcceleration)
            ffmpegCommand.addOutputOptions(`-pix_fmt ${videoParams.pixFmt}`);

        return resultMeta;
    }

    /**
     * 配置硬件编码器参数
     * @param allowHardwareDecoding {boolean} 是否允许附加硬件解码（需要缩放滤镜时必须关掉）
     */
    private static configureHardwareEncoder(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        hardwareEncoderSuffix: string,
        allowHardwareDecoding: boolean
    ): void {
        const quality = (media.quality || 'medium') as MediaQuality;

        if (hardwareEncoderSuffix === 'videotoolbox') {
            // VideoToolbox 使用 -q:v 而不是 -crf
            const qValue: string = quality === 'original' ? '15' : qualityToQValueMap[quality] || '30';

            // VideoToolbox 硬件编码器配置
            this.setupHardwareDecoding(ffmpegCommand, media, 'videotoolbox', allowHardwareDecoding);

            ffmpegCommand.addOutputOptions(['-q:v', qValue]);
            // 转换颜色空间：VideoToolbox 不支持 smpte170m，转换为 bt709
            ffmpegCommand.addOutputOptions(['-colorspace', 'bt709']);
            ffmpegCommand.addOutputOptions(['-color_primaries', 'bt709']);
            ffmpegCommand.addOutputOptions(['-color_trc', 'bt709']);
        } else if (hardwareEncoderSuffix === 'nvenc') {
            // NVIDIA NVENC 硬件编码器配置
            this.setupHardwareDecoding(ffmpegCommand, media, 'cuda', allowHardwareDecoding);

            const crfValue: string = quality === 'original' ? '18' : qualityToCrfMap[quality] || '23';

            ffmpegCommand.addOutputOptions(['-preset', 'p4']);
            ffmpegCommand.addOutputOptions(['-rc', 'vbr']);
            ffmpegCommand.addOutputOptions(['-cq', crfValue]);
            ffmpegCommand.addOutputOptions(['-b:v', '0']);
        } else if (hardwareEncoderSuffix === 'qsv') {
            // Intel QSV 硬件编码器配置
            this.setupHardwareDecoding(ffmpegCommand, media, 'qsv', allowHardwareDecoding);

            const crfValue: string = quality === 'original' ? '18' : qualityToCrfMap[quality] || '23';

            ffmpegCommand.addOutputOptions(['-preset', 'medium']);
            ffmpegCommand.addOutputOptions(['-crf', crfValue]);
        } else if (hardwareEncoderSuffix === 'amf') {
            // AMD AMF 硬件编码器配置
            this.setupHardwareDecoding(ffmpegCommand, media, 'd3d11va', allowHardwareDecoding);

            // AMF 没有 -quality_preset，且 -quality 是 speed/balanced/quality 三档枚举，
            // 把 CRF 数字（如 23）直接塞进去会得到 "Value 23.000000 for parameter 'quality' out of range [0 - 2]"，
            // ffmpeg 在解析参数阶段就退出，输出文件根本没被创建。质量数值只能走 -qp_i/-qp_p。
            const qualityMode: string = qualityToAmfMap[quality] || 'balanced';
            const qpValue: string = quality === 'original' ? '18' : qualityToCrfMap[quality] || '23';

            ffmpegCommand.addOutputOptions(['-quality', qualityMode]);
            ffmpegCommand.addOutputOptions(['-rc', 'cqp']);
            ffmpegCommand.addOutputOptions(['-qp_i', qpValue]);
            ffmpegCommand.addOutputOptions(['-qp_p', qpValue]);
        }
    }

    /**
     * @method setupHardwareDecoding
     * @param ffmpegCommand {FfmpegCommand}
     * @param media {IMediaInfo}
     * @param hwaccel {string}
     * @param allowed {boolean}
     * @description 只传 -hwaccel，让 ffmpeg 自己挑选解码器并把帧交回系统内存。
     * 之前额外指定的 `-c:v h264_qsv` 解码器会把帧留在硬件 surface 上，
     * 随后任何滤镜（包括 ffmpeg 为对齐像素格式自动插入的 scale）都会报
     * "Impossible to convert between the formats supported by the filter ..."，
     * 转换在几百毫秒内退出并留下 0 字节文件；`-hwaccel_output_format cuda` 同理。
     * **/
    private static setupHardwareDecoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        hwaccel: string,
        allowed: boolean
    ): void {
        if (!allowed) return;
        if (!(media.isH265 || media.isH264)) return;

        ffmpegCommand.addInputOptions(['-hwaccel', hwaccel]);
    }

    /**
     * 设置质量
     * **/
    private static applyQualitySettings(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        videoParams: VideoEncodingParams,
        isVideoToolbox: boolean = false,
        skipCrf: boolean = false,
        skipBitrate: boolean = false,
        skipPixFmt: boolean = false
    ): void {
        const quality = (media.quality || 'medium') as MediaQuality;

        // 使用原始质量，不应用任何调整
        if (quality === ('original' as MediaQuality)) return;

        const settings: Partial<VideoEncodingParams> = qualitySettings[quality] || {};

        // VideoToolbox 不使用 bitrate 和 CRF，只使用 q:v（已在上面设置）
        if (!isVideoToolbox) {
            if (settings.bitrate && !videoParams.bitrate && !skipBitrate)
                ffmpegCommand.videoBitrate(settings.bitrate);
            if (settings.crf !== undefined && !videoParams.crf && !skipCrf)
                ffmpegCommand.addOutputOptions(`-crf ${settings.crf}`);
        }

        // 像素格式对所有编码器都适用
        if (settings.pixFmt && !videoParams.pixFmt && !skipPixFmt)
            ffmpegCommand.addOutputOptions(`-pix_fmt ${settings.pixFmt}`);
    }

    /**
     * @author ayuanlmo
     * @method applyResolutionSettings
     * @param ffmpegCommand {FfmpegCommand}
     * @param media {IMediaInfo}
     * @param videoParams {VideoEncodingParams}
     * @description 应用视频媒体分辨率设置
     * **/
    private static applyResolutionSettings(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        videoParams: VideoEncodingParams
    ): void {
        if (!hasResolutionChange(videoParams)) return;

        // 使用 lanczos 算法进行高质量缩放
        ffmpegCommand.addOutputOptions(
            `-vf scale=${videoParams.width}:${videoParams.height}:flags=lanczos`);
    }

    /**
     * 设置音频编码
     * **/
    private static configureAudioEncoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo
    ): void {
        // 用户选择“无音频”则直接禁用音频轨
        if (media.noAudio) {
            ffmpegCommand.noAudio();
            return;
        }

        // 推断目标容器
        const container: string = getContainer(media);

        // 拆出用户传入的参数，后续按容器填补默认值 / 做兼容处理
        let codec: string | undefined = media.audioParams?.codec;
        let bitrate: string | undefined = media.audioParams?.bitrate;
        const sampleRate: number | undefined = media.audioParams?.sampleRate;
        let channels: number | undefined = media.audioParams?.channels;

        // 按容器限制可用的音频编码器，并设置合理默认值
        switch (container) {
            case 'webm':
                // WebM 规范推荐 Opus/Vorbis，这里统一使用 libopus
                if (!codec || !['opus', 'libopus', 'vorbis', 'libvorbis'].includes(codec))
                    codec = 'libopus';
                if (!bitrate)
                    bitrate = '160k';
                break;
            case 'flv':
                // FLV 只支持 AAC / MP3
                if (!codec || !['aac', 'mp3'].includes(codec))
                    codec = 'aac';
                if (!bitrate)
                    bitrate = '128k';
                break;
            case 'wmv':
                if (!codec)
                    codec = 'wmav2';// WMV 默认使用 WMA（wmav2），提高兼容性
                if (!bitrate)
                    bitrate = '160k';
                break;
            default:
                if (!codec)
                    codec = 'aac';// 其它容器保持 AAC 默认
                if (!bitrate)
                    bitrate = '192k';
        }

        // 避免探测到异常高的码率导致编码器拒绝
        bitrate = normalizeAudioBitrate(codec, bitrate);
        if (!channels)
            channels = 2;

        // 实际写入 Ffmpeg 参数
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

export default TransformVideo;
