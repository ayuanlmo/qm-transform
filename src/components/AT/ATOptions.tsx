import Dialog from "../FluentTemplates/Dialog";
import React, {
    ForwardedRef,
    forwardRef,
    ForwardRefExoticComponent,
    Fragment,
    useImperativeHandle,
    useState
} from "react";
import {Button, Divider, Label, Select, Text} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";
import TaskFormats from "../Task/TaskFormats";
import {IFormatType, audioFormatType} from "../../const/formatType";

export interface IATOptionsProps {
    mediaInfo: IMediaInfo;
    onUpdate?: (changes: Partial<IMediaInfo>) => void;
}

export interface IATOptionsRef {
    open: () => void;
}

const ATOptions: ForwardRefExoticComponent<IATOptionsProps & React.RefAttributes<IATOptionsRef>> = forwardRef<IATOptionsRef, IATOptionsProps>((props: IATOptionsProps, ref: ForwardedRef<IATOptionsRef>) => {
    const {mediaInfo, onUpdate} = props;
    const {t} = useTranslation();
    const [visible, setVisible] = useState(false);
    const [monoDialogOpen, setMonoDialogOpen] = useState(false);

    // 当前封装格式信息，用于限制可用的音频编码器
    const currentFormat = React.useMemo(
        (): IFormatType | undefined => audioFormatType.find((item): boolean => item.name === mediaInfo.optFormat),
        [mediaInfo.optFormat]
    );

    // 根据格式过滤可用的编码器
    const filteredCodecOptions = React.useMemo(() => {
        const allCodecs = [
            {value: 'aac', label: 'AAC'},
            {value: 'mp3', label: 'MP3'},
            {value: 'flac', label: 'FLAC'},
            {value: 'opus', label: 'OPUS'}
        ];

        if (!currentFormat || !currentFormat.supportedCodecs)
            return allCodecs;

        return allCodecs.filter((opt): boolean => currentFormat.supportedCodecs?.includes(opt.value) ?? false);
    }, [currentFormat]);

    // 当前编码器值，如果不在支持列表中则使用第一个支持的
    const currentCodecValue: string | undefined = React.useMemo(() => {
        const allowedValues: string[] = filteredCodecOptions.map((opt): string => opt.value);

        if (mediaInfo.audioParams.codec && allowedValues.includes(mediaInfo.audioParams.codec))
            return mediaInfo.audioParams.codec;
        return allowedValues[0] ?? mediaInfo.audioParams.codec;
    }, [filteredCodecOptions, mediaInfo.audioParams.codec]);

    const open = (): void => {
        setVisible(!visible);
    };

    const changeEvent = (data: Partial<IMediaInfo>): void => {
        onUpdate?.(data);
    };

    useImperativeHandle(ref, (): IATOptionsRef => ({
        open
    }));

    // 当前声道数
    const currentChannels: number = mediaInfo.audioParams?.channels ?? 2;
    const isMono: boolean = currentChannels === 1;

    const handleChannelsChange = (channels: number): void => {
        // 只在从立体声切换到单声道时弹出确认框
        if (channels === 1 && currentChannels !== 1) {
            setMonoDialogOpen(true);
            return;
        }

        changeEvent({
            audioParams: {
                ...mediaInfo.audioParams,
                channels
            }
        });
    };

    return (
        <>
            <Dialog
                title={t('mediaFile.optionsLabel')}
                open={visible}
                onClose={open}
                surface={
                    <Fragment>
                        <Divider appearance="brand" alignContent="start">{t('audio')}</Divider>
                        <div className={'task-options'}>
                            <div className={'task-options-item'}>
                                <Label>{t('mediaFile.format')}</Label>
                                <TaskFormats
                                    type={'audio'}
                                    value={mediaInfo.optFormat}
                                    onChange={(format: IFormatType): void => {
                                        const newFormat: IFormatType | undefined = audioFormatType.find(
                                            (item: IFormatType): boolean => item.name === format.name
                                        );
                                        const supportedCodecs: string[] | undefined = newFormat?.supportedCodecs;
                                        const currentCodec: string | undefined = mediaInfo.audioParams?.codec;

                                        // 如果当前编码器不支持新格式，切换到第一个支持的编码器
                                        let nextCodec: string | undefined = currentCodec;

                                        if (supportedCodecs && supportedCodecs.length > 0) {
                                            if (!currentCodec || !supportedCodecs.includes(currentCodec)) {
                                                nextCodec = supportedCodecs[0];
                                            }
                                        }

                                        changeEvent({
                                            optFormat: format.name,
                                            audioParams: {
                                                ...mediaInfo.audioParams,
                                                codec: nextCodec
                                            }
                                        });
                                    }}
                                />
                            </div>
                            <div className={'task-options-item'}>
                                <Label>{t('mediaFile.audioCode')}</Label>
                                <Select
                                    value={currentCodecValue}
                                    onChange={(_, data): void => {
                                        changeEvent({
                                            audioParams: {
                                                ...mediaInfo.audioParams,
                                                codec: data.value
                                            }
                                        });
                                    }}
                                >
                                    {
                                        filteredCodecOptions.map((opt): React.JSX.Element =>
                                            <option key={opt.value} label={opt.label} value={opt.value}/>
                                        )
                                    }
                                </Select>
                            </div>
                            <div className={'task-options-item'}>
                                <Label>{t('mediaFile.bitRate')}</Label>
                                <Select
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
                                    <option label="192 kbps" value="192k"/>
                                    <option label="320 kbps" value="320k"/>
                                </Select>
                            </div>
                            <div className={'task-options-item'}>
                                <Label>{t('mediaFile.samplingRate')}</Label>
                                <Select
                                    value={mediaInfo.audioParams.sampleRate?.toString()}
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
                            <div className={'task-options-item'}>
                                <Label>{t('mediaFile.channels')}</Label>
                                <Select
                                    value={isMono ? '1' : '2'}
                                    onChange={(_, data): void => {
                                        handleChannelsChange(Number(data.value));
                                    }}
                                >
                                    <option label={t('mediaFile.channelsStereo')} value="2"/>
                                    <option label={t('mediaFile.channelsMono')} value="1"/>
                                </Select>
                            </div>
                        </div>
                    </Fragment>
                }
            />
            <Dialog
                open={monoDialogOpen}
                title={t('mediaFile.channelsMonoConfirmTitle')}
                surface={
                    <Text>
                        {t('mediaFile.channelsMonoConfirmMessage')}
                    </Text>
                }
                footer={
                    <Button
                        appearance="primary"
                        onClick={(): void => {
                            changeEvent({
                                audioParams: {
                                    ...mediaInfo.audioParams,
                                    channels: 1
                                }
                            });
                            setMonoDialogOpen(false);
                        }}
                    >
                        {t('confirm')}
                    </Button>
                }
                footerCloseTriggerLabel={t('cancel')}
                onClose={(): void => setMonoDialogOpen(false)}
            />
        </>
    );
});

ATOptions.displayName = 'ATOptions';

export default ATOptions;

