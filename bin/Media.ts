import {FfprobeData, FfprobeStream} from "fluent-ffmpeg";
import path from "path";
import {v4} from "uuid";

export const audioTrackVideoTypes = ['mjpeg', 'png'];
export const commonFormats = [
    'mp4', 'mkv', 'avi', 'wmv', 'flv', 'mov', 'mpg', 'mpeg', 'rm', 'rmvb',
    'vob', 'webm', 'm4v', '3gp', '3g2', 'ts', 'mts', 'm2ts', 'm4s', 'm4p',
    'm4b', 'm4r', 'mp3', 'wav', 'wma', 'aac', 'flac', 'ogg', 'oga', 'ogv',
    'ogx', 'opus'
];
export const mediaFormatsMap: { video: Map<string, string>; audio: Map<string, string>; } = {
    video: new Map<string, string>([
        ['h.264 / avc / mpeg-4 avc / mpeg-4 part 10', 'mp4'],
        ['hevc / h.265', 'mp4'],
        ['on2 vp9', 'webm'],
        ['quicktime / mov', 'mov'],
        ['windows media video v8', 'wmv'],
        ['mpeg program stream', 'mpg'],
        ['raw mpeg', 'mpeg'],
        ['dvd compatible mpeg', 'vob'],
        ['mpeg transport stream', 'ts'],
        ['panasonic p2 mxfs', 'mts'],
        ['blu-ray m2ts', 'm2ts'],
        ['fragmented mp4', 'm4s'],
        ['m4v apple ios video', 'm4v'],
        ['3gpp', '3gp'],
        ['3gpp2', '3g2']
    ]),
    audio: new Map<string, string>([
        ['aac (advanced audio coding)', 'aac'],
        ['mp3 (mpeg audio layer 3)', 'mp3'],
        ['pcm signed 16-bit little-endian', 'wav'],
        ['windows media audio v9', 'wma'],
        ['flac, free lossless audio codec', 'flac'],
        ['ogg vorbis', 'ogg'],
        ['opus', 'opus']
    ])
};

/**
 * @class Media
 * @static
 * @author ayuanlmo
 * @description 媒体信息相关方法
 * **/
class Media {
    /**
     * @method targetIs
     * @param {FfprobeData} target
     * @param {string} type - 媒体类型
     * @return {boolean}
     * @author ayuanlmo
     * @description 判断媒体类型
     * **/
    public static targetIs(target: FfprobeData, type: 'audio' | 'video'): boolean {
        const {streams} = target;

        if (streams.length === 0) return false;

        if (type === 'video')
            return streams.some((i: FfprobeStream) => i.codec_type === 'video' && !audioTrackVideoTypes.includes(i.codec_name ?? ''));

        if (type === 'audio') {
            // 是否存在至少一个音频流
            const hasAudioTrack = streams.some((i: FfprobeStream) => i.codec_type === 'audio');

            // 没有视频轨道，除非它是简单的图像轨道（如 MJPEG 或 PNG）
            const hasNonImageVideoTrack = streams.some((i: FfprobeStream) => i.codec_type === 'video' && !audioTrackVideoTypes.includes(i.codec_name ?? ''));

            return hasAudioTrack && !hasNonImageVideoTrack;
        }

        return false;
    }

    /**
     * @method isH264
     * @param {FfprobeData} target
     * @return {boolean}
     * @author ayuanlmo
     * @description 媒体文件是否h264编码
     * **/
    public static isH264(target: FfprobeData): boolean {
        if (!Media.targetIs(target, 'video')) return false;

        return target.streams.some((stream: FfprobeStream) => stream.codec_type === 'video' && stream.codec_name === 'h264');
    }

    /**
     * @method isH265
     * @param {FfprobeData} target
     * @return {boolean}
     * @author ayuanlmo
     * @description 媒体文件是否h265编码
     * **/
    public static isH265(target: FfprobeData): boolean {
        if (!Media.targetIs(target, 'video')) return false;

        return target.streams.some((stream: FfprobeStream) => stream.codec_type === 'video' && stream.codec_name === 'hevc');
    }

    /**
     * @method mediaFormat
     * @param {FfprobeData} target
     * @return {string} - 媒体文件格式。如：mp3
     * @author ayuanlmo
     * @description 媒体文件格式
     * **/
    public static mediaFormat(target: FfprobeData): string {
        if (Media.targetIs(target, 'video'))
            for (const stream of target.streams) {
                if (stream.codec_type === 'video' && !audioTrackVideoTypes.includes(stream.codec_name ?? '')) {
                    const codecName = (stream.codec_long_name ?? '').toLowerCase();

                    return mediaFormatsMap.video.get(codecName) ?? 'unknown';
                }
            }
         else if (Media.targetIs(target, 'audio'))
            for (const stream of target.streams) {
                if (stream.codec_type === 'audio') {
                    const codecName = (stream.codec_long_name ?? '').toLowerCase();

                    return mediaFormatsMap.audio.get(codecName) ?? 'unknown';
                }
            }

        return 'unknown';
    }

    /**
     * @method getCustomMediaFileName
     * @param {string} originPath - 原始路径
     * @param {string} rule - 规则
     * @return {string}
     * @author ayuanlmo
     * @description 自定义媒体文件名称。例如：myVideo.mp4 -> myVideo-2025520-xxx.mp4
     * **/
    public static getCustomMediaFileName(originPath: string, rule: string): string {
        const date: Date = new Date();
        const ext: string = path.extname(originPath) || '.mov';
        const time: string = `${new Date().getUTCFullYear()}${date.getMonth() + 1}${date.getUTCDate()}`;
        const baseName: string = path.basename(originPath, ext);
        const random: string = v4().split('-')[0];

        let res: string = rule
            .replace(/{name}/g, time)
            .replace(/{time}/g, baseName)
            .replace(/{ext}/g, ext)
            .replace(/{random}/g, random);

        res = res.replace(/\.{2,}/g, '.');

        if (path.extname(res) === '')
            return res + '.mov';

        return res;
    }
}

export default Media;
