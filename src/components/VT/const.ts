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

// 标准分辨率列表（从高到低）
export interface IResolutionOption {
    width: number;
    height: number;
    value: string;
    label: string;
}

export const standardResolutions: IResolutionOption[] = [
    {width: 7680, height: 4320, value: '7680x4320', label: 'mediaFile.resolutions.8k'},
    {width: 5120, height: 2880, value: '5120x2880', label: 'mediaFile.resolutions.5k'},
    {width: 3840, height: 2160, value: '3840x2160', label: 'mediaFile.resolutions.4k'},
    {width: 2560, height: 1440, value: '2560x1440', label: 'mediaFile.resolutions.1440p'},
    {width: 1920, height: 1080, value: '1920x1080', label: 'mediaFile.resolutions.1080p'},
    {width: 1280, height: 720, value: '1280x720', label: 'mediaFile.resolutions.720p'},
    {width: 854, height: 480, value: '854x480', label: 'mediaFile.resolutions.480p'},
    {width: 640, height: 360, value: '640x360', label: 'mediaFile.resolutions.360p'},
    {width: 426, height: 240, value: '426x240', label: 'mediaFile.resolutions.240p'}
];

/**
 * 获取可用的分辨率选项
 * @param inputWidth 输入视频宽度
 * @param inputHeight 输入视频高度
 * @returns 可用的分辨率选项列表，包含"原始"选项
 */
export function getAvailableResolutions(inputWidth: number, inputHeight: number): IResolutionOption[] {
    // 处理无效输入
    if (!inputWidth || !inputHeight || inputWidth <= 0 || inputHeight <= 0)
        return [{width: 0, height: 0, value: 'original', label: 'mediaFile.resolutions.original'}];

    // 过滤出所有满足条件的分辨率：target_w <= input_w && target_h <= input_h
    const availableResolutions = standardResolutions.filter(
        (res) => res.width <= inputWidth && res.height <= inputHeight
    );

    // 计算原始宽高比
    const originalAspectRatio: number = inputWidth / inputHeight;

    // 按宽高比相似度排序（优先保留接近原始宽高比的选项）
    availableResolutions.sort((a: IResolutionOption, b: IResolutionOption): number => {
        const aspectRatioA: number = a.width / a.height;
        const aspectRatioB: number = b.width / b.height;
        const diffA: number = Math.abs(aspectRatioA - originalAspectRatio);
        const diffB: number = Math.abs(aspectRatioB - originalAspectRatio);

        // 如果宽高比差异相同，优先选择更大的分辨率
        if (Math.abs(diffA - diffB) < 0.01)
            return b.width * b.height - a.width * a.height;

        return diffA - diffB;
    });

    // 添加"原始"选项到列表开头
    const originalOption: IResolutionOption = {
        width: inputWidth,
        height: inputHeight,
        value: 'original',
        label: 'mediaFile.resolutions.original'
    };

    // 如果没有匹配的标准分辨率，只返回原始选项
    if (availableResolutions.length === 0)
        return [originalOption];

    // 检查原始分辨率是否已经是标准分辨率
    const isOriginalStandard: boolean = standardResolutions.some(
        (res: IResolutionOption): boolean => res.width === inputWidth && res.height === inputHeight
    );

    // 如果原始分辨率不是标准分辨率，添加到列表开头
    if (!isOriginalStandard)
        return [originalOption, ...availableResolutions];

    // 如果原始分辨率是标准分辨率，确保在可选列表中
    const hasOriginal: boolean = availableResolutions.some(
        (res: IResolutionOption): boolean => res.width === inputWidth && res.height === inputHeight
    );

    if (!hasOriginal)
        return [originalOption, ...availableResolutions];

    // 原始分辨率优先
    const originalIndex: number = availableResolutions.findIndex(
        (res: IResolutionOption): boolean => res.width === inputWidth && res.height === inputHeight
    );

    if (originalIndex > 0) {
        const [original] = availableResolutions.splice(originalIndex, 1);

        availableResolutions.unshift(original);
    }

    return availableResolutions;
}
