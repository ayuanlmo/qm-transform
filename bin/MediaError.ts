import {accessSync, constants, existsSync, statSync} from "node:fs";

/** 用户可见的媒体错误码，与 i18n `errMessage.<code>` 一一对应。 */
export type MediaErrorCode =
    | 'media-file-not-found'
    | 'media-file-empty'
    | 'media-file-unreadable'
    | 'media-binary-missing'
    | 'media-probe-timeout'
    | 'media-probe-invalid'
    | 'media-info-error'
    | 'media-first-frame-error'
    | 'media-audio-av-error';

/**
 * @class MediaProbeError
 * @description 携带错误码的媒体处理异常。`message` 是可直接展示的短句，`detail` 是仅进日志的完整输出。
 * **/
export class MediaProbeError extends Error {
    public readonly code: MediaErrorCode;
    public readonly mediaFile: string;
    public readonly detail: string;

    constructor(code: MediaErrorCode, mediaFile: string, message: string, detail: string = '') {
        super(message);
        this.name = 'MediaProbeError';
        this.code = code;
        this.mediaFile = mediaFile;
        this.detail = detail;
    }
}

const VERSION_BANNER = /^\s*((ffprobe|ffmpeg)\s+version|built with|configuration:|libav|libsw|libpost|copyright|\[info\]|\[warning\])/i;

/** 剥掉 `[mov,mp4,... @ 0000...]` 之类的上下文标签与绝对路径前缀，它们对用户没有信息量。 */
const stripNoise = (line: string): string => line
    .replace(/^\[[^\]]*\]\s*/, '')
    .replace(/^(?:[A-Za-z]:)?[\\/][^\r\n"'|]*?:\s+/, '');

/**
 * @method distillStderr
 * @param {string} raw - ffprobe/ffmpeg 的原始输出
 * @returns {string} - 只保留最后两行有效信息
 * @description ffprobe 失败时会输出 60+ 行版本横幅，直接展示给用户毫无价值，这里只留下诊断行。
 * **/
export const distillStderr = (raw: string): string => {
    const lines: string[] = (raw ?? '')
        .split(/\r?\n/)
        .map((l: string): string => stripNoise(l.trim()))
        .filter((l: string): boolean => l.length > 0 && !VERSION_BANNER.test(l));

    return lines.slice(-2).join(' | ') || 'Unknown error';
};

/**
 * @method classifyProbeStderr
 * @description 把 ffprobe 的 stderr 归一化为错误码，用于选择对应的用户文案。
 * **/
export const classifyProbeStderr = (stderr: string): MediaErrorCode => {
    const text: string = (stderr ?? '').toLowerCase();

    if (text.includes('no such file or directory')) return 'media-file-not-found';
    if (text.includes('permission denied') || text.includes('unable to open')) return 'media-file-unreadable';
    if (
        text.includes('moov atom not found') ||
        text.includes('invalid data found') ||
        text.includes('invalid argument') ||
        text.includes('output does not contain any stream')
    ) return 'media-probe-invalid';

    return 'media-info-error';
};

/**
 * @method validateMediaFile
 * @param {string} mediaFile
 * @returns {MediaErrorCode | null}
 * @description 在启动 ffprobe 之前判定文件层面的显然问题，避免把"文件不存在"报成解码错误。
 * **/
export const validateMediaFile = (mediaFile: string): MediaErrorCode | null => {
    if (!mediaFile || typeof mediaFile !== 'string') return 'media-file-not-found';

    if (!existsSync(mediaFile)) return 'media-file-not-found';

    try {
        const stat = statSync(mediaFile);

        if (!stat.isFile()) return 'media-file-not-found';
        if (stat.size === 0) return 'media-file-empty';
    } catch {
        return 'media-file-not-found';
    }

    try {
        accessSync(mediaFile, constants.R_OK);
    } catch {
        return 'media-file-unreadable';
    }

    return null;
};
