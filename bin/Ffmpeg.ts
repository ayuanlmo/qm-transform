import ffmpeg, {FfprobeData, FfprobeStream} from "fluent-ffmpeg";
import rawFfmpegPath from "ffmpeg-static";
import {path as rawFfprobePath} from "ffprobe-static";
import {v4} from "uuid";
import {appTempDir} from "../lib/Dir";
import {app, IpcMainEvent} from "electron";
import path from "path";
import {existsSync} from "node:fs";
import {ChildProcess, spawn} from "node:child_process";
import Logger from "../lib/Logger";
import {
    classifyProbeStderr,
    distillStderr,
    MediaErrorCode,
    MediaProbeError,
    validateMediaFile
} from "./MediaError";

export {MediaErrorCode, MediaProbeError} from "./MediaError";

// 此函数用于获取并修正 构建后，可执行文件被放到了 app.asar.unpacked中，导致无法直接获取ffmpeg等可执行文件的真实路径
const getBinaryFilePath = (p: string | null | undefined): string => {
    if (!p) return '';

    let resolved: string = p;

    if (app && app.isPackaged)
        resolved = resolved.replace('app.asar', 'app.asar.unpacked');

    // 路径不可用时必须显式记录：静默返回空串会让 fluent-ffmpeg 回退去调用系统 PATH 中的同名程序，
    // 表现是"开发环境正常、发布后行为诡异"，且打包缺失 asarUnpack 时完全没有线索。
    if (!existsSync(resolved)) {
        Logger.error(`[Ffmpeg] bundled binary not found: ${resolved} (packaged: ${Boolean(app?.isPackaged)})`);
        return '';
    }

    return resolved;
};

const ffmpegPath: string = getBinaryFilePath(rawFfmpegPath as string);
const ffprobePath: string = getBinaryFilePath(rawFfprobePath);

// TaskSegments 需要绕开 fluent-ffmpeg 直接驱动二进制（concat demuxer 拼接、按时长探测续转点）
export {ffmpegPath, ffprobePath};

/** ffprobe 单次探测的最长等待时间，超时即判定为文件挂起并强制回收子进程。 */
const PROBE_TIMEOUT_MS: number = 20_000;

/** 封面/波形图子进程的最长运行时间。 */
const RENDER_TIMEOUT_MS: number = 30_000;

/** 编码器可用性探测结果，进程内缓存，避免每个任务都多起一个 ffmpeg。 */
const encoderAvailability: Map<string, boolean> = new Map();

/**
 * @method report
 * @description 统一的用户错误上报：短消息进 IPC，完整输出仅写入日志。
 * **/
const report = (ctx: IpcMainEvent | undefined, error: MediaProbeError): void => {
    Logger.error(`[Ffmpeg] ${error.code} ${error.mediaFile} :: ${error.message}${error.detail ? `\n${error.detail}` : ''}`);

    if (!ctx) return;

    ctx.reply('main:on:error', {
        type: error.code,
        message: error.message,
        mediaFile: error.mediaFile
    });
};

((): void => {
    'use strict';

    ffmpeg.setFfmpegPath(ffmpegPath);
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
     * @method runRender
     * @param {string[]} args - ffmpeg 参数
     * @param {string} mediaFile - 源媒体路径（仅用于错误上下文）
     * @param {string} outputPath - 产物路径
     * @param {MediaErrorCode} failCode - 失败时上报的错误码
     * @param {IpcMainEvent} [ctx]
     * @returns {Promise<string>} - 产物路径
     * @description spawn 一个一次性的 ffmpeg 渲染进程。必须同时监听 exit 与 error，
     * 否则二进制缺失时只有 error 事件，Promise 将永不 settle 并挂死调用方。
     * **/
    private static runRender(
        args: string[],
        mediaFile: string,
        outputPath: string,
        failCode: MediaErrorCode,
        ctx?: IpcMainEvent
    ): Promise<string> {
        return new Promise((resolve, reject): void => {
            if (!ffmpegPath) {
                const err = new MediaProbeError('media-binary-missing', mediaFile, 'FFmpeg runtime is unavailable.');
                report(ctx, err);
                reject(err);
                return;
            }

            let stderr = '';
            let settled = false;
            let proc: ChildProcess;

            try {
                proc = spawn(ffmpegPath, args, {windowsHide: true});
            } catch (e) {
                const err = new MediaProbeError(failCode, mediaFile, distillStderr((e as Error).message), (e as Error).message);
                report(ctx, err);
                reject(err);
                return;
            }

            const settle = (fn: () => void): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                fn();
            };

            const fail = (err: MediaProbeError): void => {
                settle((): void => {
                    report(ctx, err);
                    reject(err);
                });
            };

            const timer = setTimeout((): void => {
                proc.kill('SIGKILL');
                fail(new MediaProbeError(failCode, mediaFile, `Timed out after ${RENDER_TIMEOUT_MS / 1000}s.`, stderr));
            }, RENDER_TIMEOUT_MS);

            proc.stderr?.on('data', (chunk: Buffer): void => {
                stderr += chunk.toString();
            });
            proc.on('error', (e: Error): void => {
                fail(new MediaProbeError(failCode, mediaFile, distillStderr(e.message), e.message));
            });
            proc.on('close', (code: number | null): void => {
                if (code === 0) {
                    settle((): void => resolve(outputPath));
                    return;
                }
                fail(new MediaProbeError(failCode, mediaFile, distillStderr(stderr), stderr));
            });
        });
    }

/**
 * @method isEncoderAvailable
     * @param {string} encoder - 编码器名，如 h264_qsv
     * @returns {Promise<boolean>}
     * @description 编码器出现在 `-encoders` 列表里并不代表真的能用：h264_amf 在 ffmpeg 构建里始终存在，
     * 但缺少 amfrt64.dll 时 avcodec_open2 直接失败，任务会以"成功"结束并留下一个空文件。
     * 这里用几帧黑屏实际打开一次编码器，只取退出码，不做任何用户侧上报。
     * **/
    public static async isEncoderAvailable(encoder: string): Promise<boolean> {
        const cached: boolean | undefined = encoderAvailability.get(encoder);

        if (cached !== undefined) return cached;
        if (!ffmpegPath) return false;

        const available: boolean = await new Promise<boolean>((resolve): void => {
            let proc: ChildProcess;

            try {
                proc = spawn(ffmpegPath, [
                    '-hide_banner', '-loglevel', 'error',
                    '-f', 'lavfi', '-i', 'nullsrc=s=256x256:d=0.04',
                    '-c:v', encoder, '-f', 'null', '-y', 'NULL'
                ], {windowsHide: true});
            } catch {
                resolve(false);
                return;
            }

            const timer = setTimeout((): void => {
                proc.kill('SIGKILL');
                resolve(false);
            }, RENDER_TIMEOUT_MS);

            proc.on('error', (): void => {
                clearTimeout(timer);
                resolve(false);
            });
            proc.on('close', (code: number | null): void => {
                clearTimeout(timer);
                resolve(code === 0);
            });
        });

        encoderAvailability.set(encoder, available);

        if (!available)
            Logger.warn(`[Ffmpeg] encoder ${encoder} is listed but cannot be opened on this machine`);

        return available;
    }

    /**
     * @method getVideoMediaFirstFrame
     * @param {string} mediaFile - 视频文件
     * @param {IpcMainEvent} ctx
     * @returns {Promise<string>} - 媒体第一帧图片路径
     * @description 获取视频媒体第一帧
     * **/
    public static getVideoMediaFirstFrame(mediaFile: string, ctx: IpcMainEvent): Promise<string> {
        const optFileName: string = `${v4()}.t.webp`;
        const optPath: string = path.resolve(appTempDir, optFileName);

        // Generate a compact cover image without letterbox bars.
        const args: string[] = [
            '-hide_banner',
            '-i', mediaFile,
            '-vf', 'scale=244:160:force_original_aspect_ratio=increase:flags=lanczos,crop=244:160',
            '-frames:v', '1',
            // Force SDR-friendly pixel format to avoid HDR-looking washed screenshots.
            '-pix_fmt', 'rgb24',
            '-vcodec', 'libwebp',
            '-q:v', '70',
            '-compression_level', '6',
            optPath,
            '-y'
        ];

        return Ffmpeg.runRender(args, mediaFile, optPath, 'media-first-frame-error', ctx);
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
            originWidth: 0,
            originHeight: 0,
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
            originWidth: videoStream.width ?? defaultVideoParams.width,
            originHeight: videoStream.height ?? defaultVideoParams.height,
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
     * @returns {Promise<FfprobeData>}
     * @author ayuanlmo
     * @description 获取媒体文件信息。失败时以携带错误码的 MediaProbeError 拒绝，
     * 用户侧只看到一句话结论，完整 ffprobe 输出仅写入日志。
     * **/
    public static getMediaInfo(mediaFile: string, ctx: IpcMainEvent): Promise<FfprobeData> {
        return new Promise((resolve, reject): void => {
            const fail = (err: MediaProbeError): void => {
                report(ctx, err);
                reject(err);
            };

            const invalid = validateMediaFile(mediaFile);

            if (invalid) {
                fail(new MediaProbeError(invalid, mediaFile, invalid === 'media-file-empty'
                    ? 'The file contains no data.'
                    : invalid === 'media-file-unreadable'
                        ? 'The file cannot be read (it may be locked or lack permissions).'
                        : 'The file does not exist.'));
                return;
            }

            if (!ffprobePath) {
                fail(new MediaProbeError('media-binary-missing', mediaFile, 'FFprobe runtime is unavailable.'));
                return;
            }

            // 直接驱动 ffprobe 而非 fluent-ffmpeg.ffprobe：需要 -v error 抑制版本横幅、
            // 需要可取消的子进程句柄，以及可区分的 error/close 事件。
            const args: string[] = ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', mediaFile];
            let proc: ChildProcess;

            try {
                proc = spawn(ffprobePath, args, {windowsHide: true});
            } catch (e) {
                fail(new MediaProbeError('media-info-error', mediaFile, distillStderr((e as Error).message), (e as Error).message));
                return;
            }

            let stdout = '';
            let stderr = '';
            let settled = false;

            const timer = setTimeout((): void => {
                proc.kill('SIGKILL');
                fail(new MediaProbeError('media-probe-timeout', mediaFile, `Probe timed out after ${PROBE_TIMEOUT_MS / 1000}s.`, stderr));
            }, PROBE_TIMEOUT_MS);

            const settle = (fn: () => void): void => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                fn();
            };

            proc.stdout?.on('data', (chunk: Buffer): void => {
                stdout += chunk.toString();
            });
            proc.stderr?.on('data', (chunk: Buffer): void => {
                stderr += chunk.toString();
            });
            proc.on('error', (e: Error): void => {
                settle((): void => fail(new MediaProbeError('media-info-error', mediaFile, distillStderr(e.message), e.message)));
            });
            proc.on('close', (code: number | null): void => {
                if (code !== 0) {
                    settle((): void => fail(new MediaProbeError(
                        classifyProbeStderr(stderr),
                        mediaFile,
                        distillStderr(stderr),
                        stderr
                    )));
                    return;
                }

                try {
                    const data: FfprobeData = JSON.parse(stdout || '{}') as FfprobeData;

                    if (!Array.isArray(data.streams) || data.streams.length === 0) {
                        settle((): void => fail(new MediaProbeError('media-probe-invalid', mediaFile, 'No playable media stream was found in the file.', stderr)));
                        return;
                    }

                    settle((): void => resolve(data));
                } catch (e) {
                    settle((): void => fail(new MediaProbeError('media-info-error', mediaFile, 'Failed to parse ffprobe output.', `${(e as Error).message}\n${stdout}`)));
                }
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
    public static getAudioVisualizationDiagram(mediaFile: string, ctx: IpcMainEvent): Promise<string> {
        const optFileName: string = `${v4()}.t.png`;
        const optPath = path.resolve(appTempDir, optFileName);
        const args: Array<string> = [
            '-hide_banner',
            '-i',
            mediaFile,
            '-filter_complex',
            'showwavespic=s=244x160:colors=#0688E5',
            '-frames:v', '1',
            optPath,
            '-y'
        ];

        return Ffmpeg.runRender(args, mediaFile, optPath, 'media-audio-av-error', ctx);
    }

}

export default Ffmpeg;

