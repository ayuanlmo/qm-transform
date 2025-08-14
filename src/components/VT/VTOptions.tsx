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
import {codecOptions, pixelFormatOptions, presetOptions, qualityOptions, videoBitrateOptions} from "./const";
import TaskFormats from "../Task/TaskFormats";

export interface IVTOptionsProps {
    mediaInfo: IMediaInfo;
}

export interface IVTOptionsRef {
    open: () => void;
}

const VTOptions: ForwardRefExoticComponent<IVTOptionsProps & React.RefAttributes<IVTOptionsRef>> = forwardRef<IVTOptionsRef, IVTOptionsProps>((props: IVTOptionsProps, ref: ForwardedRef<IVTOptionsRef>) => {
    const {mediaInfo} = props;
    const {t} = useTranslation();
    const [visible, setVisible] = useState(false);

    const open = (): void => {
        setVisible(!visible);
    };

    const changeEvent = (data: object) => {
        console.log(data, mediaInfo);
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
                                onChange={(value) => {
                                    changeEvent({format: value});
                                }}
                            />
                        </div>
                        <div className={'task-options-item'}>
                            <Label>
                                {t('mediaFile.quality.label')}
                            </Label>
                            <Select
                                defaultValue={mediaInfo.quality}
                                value={mediaInfo.quality}
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
                                defaultValue={mediaInfo.videoParams.codec}
                                value={mediaInfo.videoParams.codec}
                            >
                                {
                                    codecOptions.map((i): React.JSX.Element => {
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
                                defaultValue={mediaInfo.videoParams.pixFmt}
                                value={mediaInfo.videoParams.pixFmt}
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
                                defaultValue={mediaInfo.videoParams.bitrate}
                                value={mediaInfo.videoParams.bitrate}
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
                            <Label>FPS</Label>
                            <Select
                                defaultValue={Number(mediaInfo.videoParams.fps).toFixed().toString()}
                                value={Number(mediaInfo.videoParams.fps).toFixed().toString()}
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
                                defaultValue={mediaInfo.audioParams.codec}
                                value={mediaInfo.audioParams.codec}
                            >
                                <option label="AAC" value="aac"/>
                                <option label="MP3" value="mp3"/>
                            </Select>
                        </div>
                        <div className={'task-options-item'}>
                            <Label>{t('mediaFile.bitRate')}</Label>
                            <Select
                                defaultValue={mediaInfo.audioParams.bitrate}
                                value={mediaInfo.audioParams.bitrate}
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
                                defaultValue={mediaInfo.audioParams.sampleRate}
                                value={mediaInfo.audioParams.sampleRate}
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
