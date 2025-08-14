export interface IFormatType {
    name: string;
    type: string;
    label: string;
    libs?: string;
}

export const videoFormatType: IFormatType[] = [
    {name: "mp4", type: "video", label: "MP4-H.264", libs: '-c:v libx264'},
    {name: "mp4", type: "video", label: "MP4-H.265", libs: '-c:v libx265'},
    {name: 'M3U8', type: 'application/x-mpegurl', label: 'M3U8', libs: ''},
    {name: 'TS', type: 'video/MP2T', label: 'TS-H264', libs: '-c:v libx264'},
    {name: 'TS', type: 'video/MP2T', label: 'TS-H265', libs: '-c:v libx265'},
    {name: "mkv", type: "video/x-matroska", label: "MKV-H264", libs: '-c:v libx264'},
    {name: "mkv", type: "video/x-matroska", label: "MKV-H265", libs: '-c:v libx265'},
    {name: "avi", type: "video/avi", label: "AVI"},
    {name: "mov", type: "video/quicktime", label: "MOV-H264", libs: '-c:v libx264'},
    {name: "mov", type: "video/quicktime", label: "MOV-H265", libs: '-c:v libx265'}
];

export const audioFormatType: IFormatType[] = [
    {name: "mp3", type: "audio/mpeg", label: "MP3"},
    {name: "m4a", type: "audio/m4a", label: "M4A"},
    {name: "wav", type: "audio/wav", label: "WAV"},
    {name: "aac", type: "audio/aac", label: "AAC"},
    {name: "ogg", type: "audio/ogg", label: "OGG"}
];
