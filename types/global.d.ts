import {FfprobeData} from "fluent-ffmpeg";

declare namespace NodeJS {
    interface ProcessEnv {
        LMO_APP_VERSION?: string;
    }
}

declare global {
    // 主题类型 （自动、暗色、浅色）
    type TThemeType = 'auto' | 'dark' | 'light';

    // 导航栏样式（折叠、默认）
    type TNavigationAppearanceType = 'collapse' | 'default';

    // GPU供应商
    type TGPUVendors = 'AMD' | 'Intel' | 'NVIDIA' | 'Apple' | 'unknown';

    // 设置配置项
    interface IDefaultSettingConfig {
        // 外观
        theme: {
            lang: string; // 语言
            appearance: TThemeType; // 主题
            navigationAppearance: TNavigationAppearanceType; // 导航栏样式
            zoomFactor: '75' | '100' | '125'; // 缩放比例
        };
        // 输出配置
        output: {
            outputPath: string; // 输出路径
            parallelTasks: number; // 并行任务数
            codecType: "CPU" | "GPU"; // 编码器类型
            codecMethod: string; // 编码方法
            fileNameSpase: 'custom' | 'origin'; // 使用自定义名称
            customNameRule: string; // 自定义名称规则
        };
        // 播放器配置
        player: {
            playerType: string; // 播放器类型
            playerPath: string; // 播放器路径
        }
    }

    // 媒体信息
    interface IMediaInfo {
        cover: string; // 封面
        id: string; // id
        baseName: string; // 文件名称
        fullPath: string; // 完整路径
        mediaInfo: FfprobeData; // 媒体信息
        isH264: boolean; // 是否为H264
        isH265: boolean; // 是否为H265
        isAudio: boolean; // 是否为音频
        isVideo: boolean; // 是否为视频
        format: string; // 格式
        optFormat: string; // 格式
        libs?: string; // 库
        noAudio?: boolean; // 是否无音频
        status: 'ready' | 'processing' | 'complete' | 'error'; // 状态
        progress: number; // 进度（0-100）
        quality: MediaQuality;
        videoParams: VideoEncodingParams;
        audioParams: AudioEncodingParams;
    }

    // 视频编码参数
    export interface VideoEncodingParams {
        width: number;
        height: number;
        readonly originWidth: number;
        readonly originHeight: number;
        codec?: string; // 视频编解码器
        bitrate?: string; // 比特率
        fps?: number; // 帧率
        preset?: string; // 编码速度与压缩比权衡
        tune?: string; // 视频内容优化类型
        profile?: string; // 编码配置文件
        level?: string; // 编码级别
        crf?: number; // 质量因子（Constant Rate Factor）
        pixFmt?: string; // 像素格式
        gpuAcceleration?: boolean; // 是否启用GPU加速
        hardwareEncoder?: string; // 硬件编码器
    }

    // 音频编码参数
    export interface AudioEncodingParams {
        codec?: string; // 音频编解码器
        bitrate?: string; // 比特率
        sampleRate?: number; // 采样率
        channels?: number; // 声道数
    }

    // 清晰度
    export enum MediaQuality {
        VERY_LOW = 'very_low',
        LOW = 'low',
        MEDIUM = 'medium',
        HIGH = 'high',
        VERY_HIGH = 'very_high',
        ORIGINAL = 'original'
    }

}

export {};
