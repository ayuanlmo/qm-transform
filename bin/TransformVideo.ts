import ffmpeg, {FfmpegCommand} from 'fluent-ffmpeg';
import path from 'path';
import {IpcMainEvent} from "electron";
import {mkdirSync} from "node:fs";
import * as os from "node:os";
import Media from "./Media";
import {getLocalConfigAsMain} from "./Conf";
import taskManager from "./TaskManager";
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

class TransformVideo {
    public static transformVideoMedia(media: IMediaInfo, ctx: IpcMainEvent): void {
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

        const outputPath: string = path.resolve(outputDir, `${outputBaseName}.${outputExt}`);

        // 注册任务到 TaskManager
        taskManager.registerTask(media.id, media, media.fullPath, outputPath, ctx, undefined);

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
            .on('end', (): void => {
                // 检查任务是否处于暂停状态，如果是暂停导致的结束，不发送完成事件
                if (taskManager.isPaused(media.id)) {
                    Logger.info(`Task ${media.id} ended due to pause, not marking as complete`);
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
            .on('progress', (progress) => {
                // 如果任务已暂停，不处理进度更新
                if (taskManager.isPaused(media.id)) {
                    return;
                }

                const progressPercent = Math.round(progress.percent || 0);

                // 更新 TaskManager 中的进度
                taskManager.updateProgress(media.id, progressPercent);
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

        // 设置输出路径
        ffmpegCommand.output(outputPath);

        // 在“保持原画质 + 无额外参数 + 容器不变时，尝试直接流拷贝，可极大提升编码之速度
        const sourceExt: string = extName.replace('.', '').toLowerCase();
        const sameContainer: boolean = outputExt === sourceExt;

        const hasVideoParams: boolean = !!media.videoParams && Object.keys(media.videoParams).length > 0;
        const hasAudioParams: boolean = !!media.audioParams && Object.keys(media.audioParams).length > 0;
        const keepOriginalQuality: boolean = !media.quality || media.quality === ('original' as MediaQuality);

        const canCopyVideo: boolean = sameContainer && keepOriginalQuality && !hasVideoParams && !media.libs;
        const canCopyAudio: boolean = !media.noAudio && !hasAudioParams;

        if (canCopyVideo && (canCopyAudio || media.noAudio)) {
            // 单纯的容器内重封装：视频/音频按需 copy 或禁用音频，速度快
            ffmpegCommand.videoCodec('copy');
            if (media.noAudio)
                ffmpegCommand.noAudio();
            else
                ffmpegCommand.audioCodec('copy');
        } else {
            // 需要重新编码时，按原有逻辑配置视频/音频编码参数
            if (appConf)
                videoEncodingMeta = this.configureVideoEncoding(ffmpegCommand, media, appConf);
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
    private static configureVideoEncoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        appConf: IDefaultSettingConfig
    ): VideoEncodingMeta {
        // 从配置中获取 GPU 加速设置，确保不被 media.videoParams 覆盖
        const gpuAccelerationFromConfig: boolean = appConf?.output?.codecType === 'GPU';
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

        // 根据配置文件中的 codecType / codecMethod 以及当前平台，推断 GPU 编码器后缀
        let hardwareEncoderSuffix: string | null = null;

        // 目前仅对 H.264 / H.265 尝试 GPU 加速，VP9 等保持 CPU 编码
        if (videoParams.gpuAcceleration && (selectedCodec === 'h264' || selectedCodec === 'hevc')) {
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
        const resultMeta: VideoEncodingMeta = {
            useHardwareAcceleration,
            hardwareEncoderSuffix,
            selectedCodec
        };

        // 如果配置开启 GPU 加速并且推断出了可用的硬件编码器，优先使用硬件编码
        if (useHardwareAcceleration) {
            const baseCodec = selectedCodec === 'hevc' ? 'hevc' : 'h264';
            const encoderName = `${baseCodec}_${hardwareEncoderSuffix}`;

            ffmpegCommand.videoCodec(encoderName); // 例如 h264_nvenc / hevc_videotoolbox

            // 配置硬件编码器参数
            if (hardwareEncoderSuffix)
                this.configureHardwareEncoder(ffmpegCommand, media, hardwareEncoderSuffix);
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
        // 应用清晰度设置
        // VideoToolbox 使用 q:v，不应用 CRF 和 bitrate
        // NVENC/QSV/AMF 使用 CRF/quality，已在上面设置，这里只应用像素格式
        this.applyQualitySettings(
            ffmpegCommand,
            media,
            videoParams,
            useHardwareAcceleration && hardwareEncoderSuffix === 'videotoolbox',
            hardwareEncoderSuffix === 'nvenc',
            hardwareEncoderSuffix === 'nvenc',
            useHardwareAcceleration && hardwareEncoderSuffix === 'nvenc'
        );

        // 应用分辨率设置
        this.applyResolutionSettings(ffmpegCommand, media, videoParams);

        // 应用其他视频参数
        // VideoToolbox 不支持 bitrate 和 preset 参数，使用 q:v 控制质量
        if (useHardwareAcceleration && hardwareEncoderSuffix === 'videotoolbox') {
            // VideoToolbox 只使用 q:v，不使用 bitrate 和 preset
            if (videoParams.fps)
                ffmpegCommand.fps(videoParams.fps);
        } else {
            // NVENC 走 CQ/VBR，不再设置显式 bitrate，避免探测到的超高码率导致失败
            const shouldApplyBitrate: boolean = !(useHardwareAcceleration && hardwareEncoderSuffix === 'nvenc');

            if (shouldApplyBitrate && videoParams.bitrate)
                ffmpegCommand.videoBitrate(videoParams.bitrate);
            if (videoParams.fps)
                ffmpegCommand.fps(videoParams.fps);
            // 对 CPU 编码路径设置一个偏向速度的默认 preset（未指定时使用 faster）
            const effectivePreset: string | undefined = useHardwareAcceleration
                ? videoParams.preset
                : videoParams.preset || 'faster';

            if (effectivePreset)
                ffmpegCommand.addOutputOptions(`-preset ${effectivePreset}`);
        }
        // VideoToolbox 不支持 tune、profile、level 参数，跳过这些
        if (!(useHardwareAcceleration && hardwareEncoderSuffix === 'videotoolbox')) {
            if (videoParams.tune)
                ffmpegCommand.addOutputOptions(`-tune ${videoParams.tune}`);
            if (videoParams.profile)
                ffmpegCommand.addOutputOptions(`-profile:v ${videoParams.profile}`);
            // NVENC 自动选择 level，源文件携带的 level（如 5.1 / 51）可能不被硬件接受
            const shouldApplyLevel: boolean = !!videoParams.level && !(useHardwareAcceleration && hardwareEncoderSuffix === 'nvenc');

            if (shouldApplyLevel)
                ffmpegCommand.addOutputOptions(`-level ${videoParams.level}`);
        }
        // 像素格式对所有编码器都适用，但 VideoToolbox 会自动选择兼容格式
        if (videoParams.pixFmt &&
            !(useHardwareAcceleration && hardwareEncoderSuffix === 'videotoolbox') &&
            !(useHardwareAcceleration && hardwareEncoderSuffix === 'nvenc'))
            ffmpegCommand.addOutputOptions(`-pix_fmt ${videoParams.pixFmt}`);

        return resultMeta;
    }

    /**
     * 配置硬件编码器参数
     */
    private static configureHardwareEncoder(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        hardwareEncoderSuffix: string
    ): void {
        const quality = (media.quality || 'medium') as MediaQuality;

        if (hardwareEncoderSuffix === 'videotoolbox') {
            // VideoToolbox 使用 -q:v 而不是 -crf
            const qValue: string = quality === 'original' ? '15' : qualityToQValueMap[quality] || '30';

            // VideoToolbox 硬件编码器配置
            ffmpegCommand.addInputOptions(['-hwaccel', 'videotoolbox']);
            ffmpegCommand.addOutputOptions(['-q:v', qValue]);
            // 转换颜色空间：VideoToolbox 不支持 smpte170m，转换为 bt709
            ffmpegCommand.addOutputOptions(['-colorspace', 'bt709']);
            ffmpegCommand.addOutputOptions(['-color_primaries', 'bt709']);
            ffmpegCommand.addOutputOptions(['-color_trc', 'bt709']);
        } else if (hardwareEncoderSuffix === 'nvenc') {
            // NVIDIA NVENC 硬件编码器配置
            this.setupHardwareDecoding(ffmpegCommand, media, 'cuda', {
                h265: 'hevc_cuvid',
                h264: 'h264_cuvid'
            }, true);

            const crfValue: string = quality === 'original' ? '18' : qualityToCrfMap[quality] || '23';

            ffmpegCommand.addOutputOptions(['-preset', 'p4']);
            ffmpegCommand.addOutputOptions(['-rc', 'vbr']);
            ffmpegCommand.addOutputOptions(['-cq', crfValue]);
            ffmpegCommand.addOutputOptions(['-b:v', '0']);
        } else if (hardwareEncoderSuffix === 'qsv') {
            // Intel QSV 硬件编码器配置
            this.setupHardwareDecoding(ffmpegCommand, media, 'qsv', {
                h265: 'hevc_qsv',
                h264: 'h264_qsv'
            });

            const crfValue: string = quality === 'original' ? '18' : qualityToCrfMap[quality] || '23';

            ffmpegCommand.addOutputOptions(['-preset', 'medium']);
            ffmpegCommand.addOutputOptions(['-crf', crfValue]);
        } else if (hardwareEncoderSuffix === 'amf') {
            // AMD AMF 硬件编码器配置
            if (media.isH265 || media.isH264) {
                try {
                    ffmpegCommand.addInputOptions(['-hwaccel', 'd3d11va']);
                } catch (error) {
                    // 忽略错误，回退到软件解码
                }
            }

            const qualityValue: string = quality === 'original' ? '18' : qualityToCrfMap[quality] || '23';

            ffmpegCommand.addOutputOptions(['-quality', qualityValue]);
            ffmpegCommand.addOutputOptions(['-quality_preset', 'balanced']);
        }
    }

    /**
     * 设置硬件解码
     */
    private static setupHardwareDecoding(
        ffmpegCommand: FfmpegCommand,
        media: IMediaInfo,
        hwaccel: string,
        decoders: { h265: string; h264: string }
        , allowDecoderFallback: boolean = false
    ): void {
        if (media.isH265 || media.isH264) {
            const inputOptions: string[] = ['-hwaccel', hwaccel];

            // 在允许回退时，不强制指定具体解码器，避免 cuvid 缺失导致失败
            if (!allowDecoderFallback) {
                if (media.isH265)
                    inputOptions.push('-c:v', decoders.h265);
                else if (media.isH264)
                    inputOptions.push('-c:v', decoders.h264);
            } else if (hwaccel === 'cuda')
                inputOptions.push('-hwaccel_output_format', 'cuda');

            ffmpegCommand.addInputOptions(inputOptions);
        }
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
        // 获取原始视频分辨率
        const originalWidth: number = videoParams.originWidth || 0;
        const originalHeight: number = videoParams.originHeight || 0;

        // 目标分辨率
        const targetWidth: number = videoParams.width || 0;
        const targetHeight: number = videoParams.height || 0;

        // 如果目标分辨率有效且与原始分辨率不同，应用缩放
        if (targetWidth > 0 && targetHeight > 0 &&
            (targetWidth !== originalWidth || targetHeight !== originalHeight)) {
            // 使用 lanczos 算法进行高质量缩放
            ffmpegCommand.addOutputOptions(`-vf scale=${targetWidth}:${targetHeight}:flags=lanczos`);
        }
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
