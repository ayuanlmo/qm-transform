import {ChildProcess, spawn} from "node:child_process";
import path from "node:path";
import {existsSync, renameSync, unlinkSync, writeFileSync} from "node:fs";
import {v4} from "uuid";
import {appTempDir} from "../lib/Dir";
import {ffmpegPath, ffprobePath} from "./Ffmpeg";
import Logger from "../lib/Logger";

/** 单次分段合并/时长探测的最长等待时间。 */
const SEGMENT_TIMEOUT_MS: number = 30_000;

/**
 * @interface IResumeSegment
 * @description 续转分段的上下文，由 TaskManager 在恢复时交给转码模块。
 * **/
export interface IResumeSegment {
    /** 已并回产物的源文件秒数，同时是本段 -ss 的起点 */
    startSeconds: number;
    /** 本段的落盘路径，绝不能是产物本身（会把已完成的片段截断） */
    partPath: string;
    /** 最终产物路径：不能再重新推断，自定义命名规则里的 {random} 每次都得到新名字 */
    outputPath: string;
}

/**
 * 允许断点续转的容器。只有"同源、同编码器、同容器"的分段才敢用 -c copy 直接拼：
 * m3u8 的产物本身是播放列表，avi/flv/wmv 的时间戳按流独立编号，接缝对不齐；
 * 未知总时长则无法把分段进度折算回全局百分比。
 */
const CHECKPOINT_CONTAINERS: string[] = [
    "mp4", "m4v", "mov", "3gp", "3g2", "mkv", "webm", "ts",
    "m4a", "aac", "mp3", "wav", "flac", "ogg", "opus"
];

/**
 * @method supportsCheckpointResume
 * @param {string} outputPath - 产物路径
 * @param {number} totalSeconds - 源媒体总时长
 * @returns {boolean}
 * @description 该任务能否用"停下来再 -ss 续转"的方式暂停。不满足时宁可拒绝暂停，
 * 也不能让用户按下暂停后丢掉整段已完成的编码。
 * **/
export const supportsCheckpointResume = (outputPath: string, totalSeconds: number): boolean => {
    if (!(totalSeconds > 0)) return false;

    const ext: string = path.extname(outputPath).replace(".", "").toLowerCase();

    return CHECKPOINT_CONTAINERS.includes(ext);
};

/**
 * @method partPathFor
 * @param {string} outputPath - 最终产物路径
 * @param {number} seq - 分段序号
 * @returns {string}
 * @description 续转分段的落盘路径。必须与产物同容器后缀，否则 ffmpeg 选错封装、
 * concat demuxer 也无法用 -c copy 直接拼接。
 * **/
export const partPathFor = (outputPath: string, seq: number): string => {
    const ext: string = path.extname(outputPath);
    const base: string = outputPath.slice(0, outputPath.length - ext.length);

    return `${base}.qmpart${String(seq).padStart(2, "0")}${ext}`;
};

/**
 * @method toSeconds
 * @param {unknown} value - ffprobe 的 format.duration
 * @returns {number}
 * @description 统一成秒。@types/fluent-ffmpeg 把它声明成了 number，实际 JSON 里是字符串，
 * 两头都要接住，否则续转点会算成 NaN 而让分段永远拼不回产物。
 * **/
export const toSeconds = (value: unknown): number => {
    const seconds: number = typeof value === "number" ? value : Number.parseFloat(String(value ?? ""));

    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
};

/**
 * @method parseTimemark
 * @param {string} [timemark] - ffmpeg 进度里的 time= 值
 * @returns {number | undefined}
 * @description 解析 HH:MM:SS.ms 为秒。-ss 续转时 time= 从本段起点算起，
 * 只有加上已完成秒数才是源文件上的真实进度。
 * **/
export const parseTimemark = (timemark?: string): number | undefined => {
    if (!timemark) return undefined;

    const matched: RegExpMatchArray | null = /^(\d+):(\d{1,2}):(\d{1,2})(?:[.,](\d{1,3}))?$/.exec(timemark.trim());

    if (!matched) return undefined;

    const [, h, m, s, ms] = matched;

    return Number(h) * 3600 + Number(m) * 60 + Number(s) + (ms ? Number(`0.${ms}`) : 0);
};

/**
 * @method discardFile
 * @description 删除中途产物。分段作废/合并失败时调用，失败只记日志：
 * 残留文件不该再把已经确定的任务结论翻成失败。
 * **/
export const discardFile = (file: string | undefined): void => {
    if (!file) return;

    try {
        if (existsSync(file)) unlinkSync(file);
    } catch (e) {
        Logger.warn(`[TaskSegments] cannot discard ${file}: ${(e as Error).message}`);
    }
};

/**
 * @method spawnOnce
 * @description 跑一次用完即弃的 ffmpeg/ffprobe。同时监听 error 与 close：
 * 只监听 close 时二进制缺失会导致 Promise 永不 settle。
 * **/
const spawnOnce = (bin: string, args: string[]): Promise<{code: number | null; stdout: string; stderr: string}> => {
    return new Promise((resolve, reject): void => {
        if (!bin) {
            reject(new Error("bundled ffmpeg binary is unavailable"));
            return;
        }

        let proc: ChildProcess;

        try {
            proc = spawn(bin, args, {windowsHide: true});
        } catch (e) {
            reject(e as Error);
            return;
        }

        let stdout = "";
        let stderr = "";
        let settled = false;

        const settle = (fn: () => void): void => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            fn();
        };

        const timer = setTimeout((): void => {
            try {
                proc.kill("SIGKILL");
            } catch {
                // 进程可能已经退出
            }
            settle((): void => reject(new Error(`ffmpeg call timed out after ${SEGMENT_TIMEOUT_MS / 1000}s`)));
        }, SEGMENT_TIMEOUT_MS);

        proc.stdout?.on("data", (chunk: Buffer): void => {
            stdout += chunk.toString();
        });
        proc.stderr?.on("data", (chunk: Buffer): void => {
            stderr += chunk.toString();
        });
        proc.on("error", (e: Error): void => {
            settle((): void => reject(e));
        });
        proc.on("close", (code: number | null): void => {
            settle((): void => resolve({code, stdout, stderr}));
        });
    });
};

/**
 * @method probeDurationSeconds
 * @param {string} file - 媒体文件
 * @returns {Promise<number>} - 秒；不可读时返回 0
 * @description 读取真实写出时长，作为下一次续转的 -ss 起点。
 * 用退出码/解析失败代替异常：刚被 q 收尾的分段本身就可能是我们要丢弃的对象。
 * **/
export const probeDurationSeconds = async (file: string): Promise<number> => {
    if (!existsSync(file)) return 0;

    try {
        const {code, stdout} = await spawnOnce(ffprobePath, [
            "-v", "error",
            "-show_entries", "format=duration",
            "-of", "default=noprint_wrappers=1:nokey=1",
            file
        ]);

        if (code !== 0) return 0;

        const seconds: number = Number.parseFloat(stdout.trim());

        return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
    } catch (e) {
        Logger.warn(`[TaskSegments] probe failed for ${file}: ${(e as Error).message}`);
        return 0;
    }
};

/**
 * @method mergeSegment
 * @param {string} prefixPath - 已完成部分（可能等于 outputPath）
 * @param {string} partPath - 刚收尾的分段
 * @param {string} outputPath - 合并后落回的位置
 * @returns {Promise<void>}
 * @description concat demuxer + -c copy 把分段接回产物。先写同目录临时文件再 rename：
 * 合并失败时产物仍是上一次暂停时的完整片段，不会变成半个文件。
 * 参数顺序与已验证的探测脚本一致（-f concat -safe 0 -i list -c copy），
 * 不要随手加 -movflags：非 mov 系封装会因未知封装选项直接报错。
 * **/
export const mergeSegment = async (prefixPath: string, partPath: string, outputPath: string): Promise<void> => {
    const listPath: string = path.resolve(appTempDir, `${v4()}.concat.txt`);
    const tmpPath: string = `${outputPath.replace(path.extname(outputPath), "")}.qmmerge${path.extname(outputPath)}`;
    const quote = (f: string): string => f.replace(/\\/g, "/").replace(/'/g, "'\\''");

    try {
        writeFileSync(listPath, [prefixPath, partPath].map((f): string => `file '${quote(f)}'`).join("\n"));

        const {code, stderr} = await spawnOnce(ffmpegPath, [
            "-hide_banner", "-y",
            "-f", "concat", "-safe", "0", "-i", listPath,
            "-c", "copy",
            tmpPath
        ]);

        if (code !== 0 || !existsSync(tmpPath))
            throw new Error(stderr.trim().split("\n").pop() ?? "ffmpeg concat failed");

        renameSync(tmpPath, outputPath);
        discardFile(partPath);
    } finally {
        discardFile(listPath);
        discardFile(tmpPath);
    }
};
