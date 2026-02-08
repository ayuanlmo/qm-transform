import Dialog from "../FluentTemplates/Dialog";
import React, {
    ForwardedRef,
    forwardRef,
    ForwardRefExoticComponent,
    Fragment,
    useImperativeHandle,
    useState
} from "react";
import {Divider, InfoLabel, Label, Select} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";
import {
    codecOptions,
    getAvailableResolutions, IResolutionOption,
    pixelFormatOptions,
    presetOptions,
    qualityOptions,
    videoBitrateOptions
} from "./const";
import TaskFormats from "../Task/TaskFormats";
import {IFormatType, videoFormatType} from "../../const/formatType";

export interface IVTOptionsProps {
    mediaInfo: IMediaInfo;
    onUpdate?: (changes: Partial<IMediaInfo>) => void;
}

export interface IVTOptionsRef {
    open: () => void;
}

const VTOptions: ForwardRefExoticComponent<IVTOptionsProps & React.RefAttributes<IVTOptionsRef>> = forwardRef<IVTOptionsRef, IVTOptionsProps>((props: IVTOptionsProps, ref: ForwardedRef<IVTOptionsRef>) => {
    const {mediaInfo, onUpdate} = props;
    const {t} = useTranslation();
    const [visible, setVisible] = useState(false);

    // 当前封装格式信息，用于限制可用的视频编码器
    const currentFormat = React.useMemo(
        (): IFormatType | undefined => videoFormatType.find((item): boolean => item.name === mediaInfo.optFormat),
        [mediaInfo.optFormat]
    );

    const filteredCodecOptions = React.useMemo(
        () => {
            if (!currentFormat || !currentFormat.supportedCodecs)
                return codecOptions;
            return codecOptions.filter((opt): boolean | undefined => currentFormat.supportedCodecs?.includes(opt.value));
        },
        [currentFormat]
    );

    const currentCodecValue: string | undefined = React.useMemo(() => {
        const allowedValues: string[] = filteredCodecOptions.map((opt): string => opt.value);

        if (mediaInfo.videoParams.codec && allowedValues.includes(mediaInfo.videoParams.codec))
            return mediaInfo.videoParams.codec;
        return allowedValues[0] ?? mediaInfo.videoParams.codec;
    }, [filteredCodecOptions, mediaInfo.videoParams.codec]);

    // 从原始媒体信息获取原始分辨率
    const originalResolution = React.useMemo(() => {
        if (!mediaInfo.mediaInfo || !mediaInfo.mediaInfo.streams)
            return {width: 0, height: 0};

        const videoStream = mediaInfo.mediaInfo.streams.find(
            (stream): boolean => stream.codec_type === 'video'
        );

        if (!videoStream)
            return {width: 0, height: 0};
        return {
            width: videoStream.width || 0,
            height: videoStream.height || 0
        };
    }, [mediaInfo.mediaInfo]);

    // 计算可用的分辨率选项（基于原始分辨率）
    const availableResolutions: IResolutionOption[] = React.useMemo(() => {
        return getAvailableResolutions(originalResolution.width, originalResolution.height);
    }, [originalResolution.width, originalResolution.height]);

    // 获取当前分辨率选项的值
    const currentResolutionValue: string = React.useMemo(() => {
        const currentWidth: number = mediaInfo.videoParams.width || 0;
        const currentHeight: number = mediaInfo.videoParams.height || 0;

        // 如果宽高为0或未设置，或与原始分辨率相同，使用"原始"
        if (!currentWidth || !currentHeight ||
            currentWidth === originalResolution.width && currentHeight === originalResolution.height) {
            return 'original';
        }

        // 查找匹配的分辨率选项
        const matched: IResolutionOption | undefined = availableResolutions.find(
            (res: IResolutionOption) => res.width === currentWidth && res.height === currentHeight
        );

        return matched ? matched.value : 'original';
    }, [mediaInfo.videoParams.width, mediaInfo.videoParams.height, originalResolution, availableResolutions]);

    const open = (): void => {
        setVisible(!visible);
    };

    const changeEvent = (data: Partial<IMediaInfo>): void => {
        onUpdate?.(data);
    };

    useImperativeHandle(ref, (): IVTOptionsRef => ({
        open
    }));

    return (
        <Dialog
            title={t('mediaFile.optionsLabel')}
            open={visible}
            onClose={open}
            surface={
                <Fragment>
                    <Divider appearance="brand" alignContent="start">{t('video')}</Divider>
                    <div className={'task-options'}>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.format')}</Label>
                            <TaskFormats
                                type={'video'}
                                value={mediaInfo.optFormat}
                                onChange={(format: IFormatType): void => {
                                    const nextFormat: IFormatType | void = videoFormatType.find(
                                        (item: IFormatType): boolean => item.name === format.name
                                    );
                                    const supported: string[] | void = nextFormat?.supportedCodecs;

                                    let nextCodec: string | undefined = mediaInfo.videoParams.codec;

                                    if (supported && supported.length > 0) {
                                        if (!nextCodec || !supported.includes(nextCodec))
                                            nextCodec = supported[0];
                                    }

                                    changeEvent({
                                        optFormat: format.name,
                                        videoParams: {
                                            ...mediaInfo.videoParams,
                                            codec: nextCodec
                                        }
                                    });
                                }}
                            />
                        </div>
                        <div className={'task-options-item'}>
                            <Label>
                                {t('mediaFile.quality.label')}
                            </Label>
                            <Select
                                value={mediaInfo.quality}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        quality: data.value as MediaQuality
                                    });
                                }}
                            >
                                {
                                    qualityOptions.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} label={t(i.label)} key={i.label}/>
                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.codec')}</Label>
                            <Select
                                value={currentCodecValue}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        videoParams: {
                                            ...mediaInfo.videoParams,
                                            codec: data.value
                                        }
                                    });
                                }}
                            >
                                {
                                    filteredCodecOptions.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} label={t(i.label)} key={i.label}/>
                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <InfoLabel
                                info={t('mediaFile.preset.desc')}
                            >
                                {t('mediaFile.preset.label')}
                            </InfoLabel>
                            <Select
                                value={mediaInfo.videoParams.preset}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        videoParams: {
                                            ...mediaInfo.videoParams,
                                            preset: data.value
                                        }
                                    });
                                }}
                            >
                                {
                                    presetOptions.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} label={t(i.label)} key={i.label}/>
                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.pixelFormat.label')}</Label>
                            <Select
                                value={mediaInfo.videoParams.pixFmt}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        videoParams: {
                                            ...mediaInfo.videoParams,
                                            pixFmt: data.value
                                        }
                                    });
                                }}
                            >
                                {
                                    pixelFormatOptions.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} label={t(i.label)} key={i.label}/>
                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.videoBitrate.label')}</Label>
                            <Select
                                value={mediaInfo.videoParams.bitrate}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        videoParams: {
                                            ...mediaInfo.videoParams,
                                            bitrate: data.value
                                        }
                                    });
                                }}
                            >
                                {
                                    videoBitrateOptions.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} label={t(i.label)} key={i.label}/>
                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.resolution')}</Label>
                            <Select
                                value={currentResolutionValue}
                                onChange={(_, data): void => {
                                    const selectedResolution = availableResolutions.find(
                                        (res) => res.value === data.value
                                    );

                                    if (selectedResolution) {
                                        // 如果选择"原始"，使用原始分辨率 否则使用选择的分辨率
                                        const targetWidth: number = selectedResolution.value === 'original'
                                            ? originalResolution.width
                                            : selectedResolution.width;
                                        const targetHeight: number = selectedResolution.value === 'original'
                                            ? originalResolution.height
                                            : selectedResolution.height;

                                        changeEvent({
                                            videoParams: {
                                                ...mediaInfo.videoParams,
                                                width: targetWidth,
                                                height: targetHeight
                                            }
                                        });
                                    }
                                }}
                            >
                                {
                                    availableResolutions.map((i: IResolutionOption): React.JSX.Element => {
                                        return (
                                            <option
                                                value={i.value}
                                                label={t(i.label)}
                                                key={i.value}
                                            />
                                        );
                                    })
                                }
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>FPS</Label>
                            <Select
                                value={Number(mediaInfo.videoParams.fps).toFixed().toString()}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        videoParams: {
                                            ...mediaInfo.videoParams,
                                            fps: Number(data.value)
                                        }
                                    });
                                }}
                            >
                                <option label="24 fps" value="24"/>
                                <option label="25 fps" value="25"/>
                                <option label="30 fps" value="30"/>
                                <option label="60 fps" value="60"/>
                            </Select>
                        </div>
                    </div>
                    <Divider appearance="brand" alignContent="start">{t('audio')}</Divider>
                    <div className={'task-options'}>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.audioCode')}</Label>
                            <Select
                                disabled={mediaInfo.noAudio}
                                value={mediaInfo.audioParams.codec}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        audioParams: {
                                            ...mediaInfo.audioParams,
                                            codec: data.value
                                        }
                                    });
                                }}
                            >
                                <option label="AAC" value="aac"/>
                                <option label="MP3" value="mp3"/>
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.bitRate')}</Label>
                            <Select
                                disabled={mediaInfo.noAudio}
                                value={mediaInfo.audioParams.bitrate}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        audioParams: {
                                            ...mediaInfo.audioParams,
                                            bitrate: data.value
                                        }
                                    });
                                }}
                            >
                                <option label="96 kbps" value="96k"/>
                                <option label="128 kbps" value="128k"/>
                                <option label="192 kbps (Recommended)" value="192k"/>
                                <option label="320 kbps" value="320k"/>
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.samplingRate')}</Label>
                            <Select
                                disabled={mediaInfo.noAudio}
                                value={mediaInfo.audioParams.sampleRate}
                                onChange={(_, data): void => {
                                    changeEvent({
                                        audioParams: {
                                            ...mediaInfo.audioParams,
                                            sampleRate: Number(data.value)
                                        }
                                    });
                                }}
                            >
                                <option label="44.1 kHz" value="44100"/>
                                <option label="48 kHz" value="48000"/>
                            </Select>
                        </div>
                    </div>
                </Fragment>
            }
        />
    );
});

VTOptions.displayName = 'VTOptions';

export default VTOptions;
