// 清晰度选项
export const qualityOptions = [
    {value: 'original', label: 'mediaFile.quality.original'},
    {value: 'very_high', label: 'mediaFile.quality.veryHigh'},
    {value: 'high', label: 'mediaFile.quality.high'},
    {value: 'medium', label: 'mediaFile.quality.medium'},
    {value: 'low', label: 'mediaFile.quality.low'},
    {value: 'very_low', label: 'mediaFile.quality.veryLow'}
];

export const codecOptions = [
    {value: 'h264', label: 'H.264 (x264)'},
    {value: 'hevc', label: 'H.265 (x265)'},
    {value: 'vp9', label: 'VP9 (libvpx-vp9)'}
];

export const presetOptions = [
    {value: 'ultrafast', label: 'mediaFile.preset.ultraFast'},
    {value: 'superfast', label: 'mediaFile.preset.superFast'},
    {value: 'veryfast', label: 'mediaFile.preset.veryFast'},
    {value: 'fast', label: 'mediaFile.preset.fast'},
    {value: 'medium', label: 'mediaFile.preset.medium'},
    {value: 'slow', label: 'mediaFile.preset.slow'},
    {value: 'slower', label: 'mediaFile.preset.slower'},
    {value: 'veryslow', label: 'mediaFile.preset.verySlow'}
];

export const pixelFormatOptions = [
    {value: 'yuv420p', label: 'mediaFile.pixelFormat.yuv420p'},
    {value: 'yuv444p', label: 'mediaFile.pixelFormat.yuv444p'}
];

export const videoBitrateOptions = [
    {value: '500k', label: 'mediaFile.videoBitrate.veryLow'},
    {value: '1000k', label: 'mediaFile.videoBitrate.low'},
    {value: '2000k', label: 'mediaFile.videoBitrate.medium'},
    {value: '5000k', label: 'mediaFile.videoBitrate.high'},
    {value: '8000k', label: 'mediaFile.videoBitrate.veryHigh'}
];
