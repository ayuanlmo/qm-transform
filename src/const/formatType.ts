export interface IFormatType {
    name: string; // 容器/后缀名，例如 mp4、mkv
    type: string; // MIME type
    label: string; // 展示用文案
    libs?: string; // 兼容旧逻辑，当前不再使用
    supportedCodecs?: string[]; // 当前封装格式支持的目标视频编解码器，如 ['h264','hevc']
}

// 仅描述“格式/容器”，不再带 H.264/H.265 的维度
export const videoFormatType: IFormatType[] = [
    {name: "mp4", type: "video/mp4", label: "MP4", supportedCodecs: ['h264', 'hevc']},
    {name: "m3u8", type: "application/x-mpegurl", label: "M3U8", supportedCodecs: ['h264', 'hevc']},
    {name: "ts", type: "video/MP2T", label: "TS", supportedCodecs: ['h264', 'hevc']},
    {name: "mkv", type: "video/x-matroska", label: "MKV", supportedCodecs: ['h264', 'hevc']},
    // AVI 对 H.265 支持较差，仅保留 H.264
    {name: "avi", type: "video/avi", label: "AVI", supportedCodecs: ['h264']},
    {name: "mov", type: "video/quicktime", label: "MOV", supportedCodecs: ['h264', 'hevc']}
];

export const audioFormatType: IFormatType[] = [
    {name: "mp3", type: "audio/mpeg", label: "MP3"},
    {name: "m4a", type: "audio/m4a", label: "M4A"},
    {name: "wav", type: "audio/wav", label: "WAV"},
    {name: "aac", type: "audio/aac", label: "AAC"},
    {name: "ogg", type: "audio/ogg", label: "OGG"}
];
