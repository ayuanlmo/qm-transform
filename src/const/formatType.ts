export interface IFormatType {
    name: string; // 容器/后缀名，例如 mp4、mkv
    type: string; // MIME type
    label: string; // 展示用文案
    libs?: string; // 兼容旧逻辑，当前不再使用
    supportedCodecs?: string[]; // 当前封装格式支持的目标视频编解码器，如 ['h264','hevc']
}

export const videoFormatType: IFormatType[] = [
    {name: "mp4", type: "video/mp4", label: "MP4", supportedCodecs: ['h264', 'hevc']},
    {name: "mkv", type: "video/x-matroska", label: "MKV", supportedCodecs: ['h264', 'hevc', 'vp9']},
    {name: "mov", type: "video/quicktime", label: "MOV", supportedCodecs: ['h264', 'hevc']},
    {name: "webm", type: "video/webm", label: "WebM", supportedCodecs: ['vp9']},
    {name: "ts", type: "video/MP2T", label: "TS", supportedCodecs: ['h264', 'hevc']},
    {name: "m3u8", type: "application/x-mpegurl", label: "M3U8", supportedCodecs: ['h264', 'hevc']},
    {name: "avi", type: "video/avi", label: "AVI", supportedCodecs: ['h264']},
    {name: "flv", type: "video/x-flv", label: "FLV", supportedCodecs: ['h264']},
    {name: "wmv", type: "video/x-ms-wmv", label: "WMV", supportedCodecs: ['h264']},
    {name: "mpg", type: "video/mpeg", label: "MPG", supportedCodecs: ['h264']},
    {name: "3gp", type: "video/3gpp", label: "3GP", supportedCodecs: ['h264']}
];

export const audioFormatType: IFormatType[] = [
    {name: "mp3", type: "audio/mpeg", label: "MP3", supportedCodecs: ['mp3']},
    {name: "aac", type: "audio/aac", label: "AAC", supportedCodecs: ['aac']},
    {name: "m4a", type: "audio/m4a", label: "M4A", supportedCodecs: ['aac']},
    {name: "wav", type: "audio/wav", label: "WAV", supportedCodecs: ['aac', 'mp3', 'flac']},
    {name: "flac", type: "audio/flac", label: "FLAC", supportedCodecs: ['flac']},
    {name: "ogg", type: "audio/ogg", label: "OGG", supportedCodecs: ['opus']},
    {name: "opus", type: "audio/opus", label: "OPUS", supportedCodecs: ['opus']}
];
