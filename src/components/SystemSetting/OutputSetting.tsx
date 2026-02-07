import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import {
    Card,
    Divider,
    Input,
    InteractionTag,
    InteractionTagPrimary,
    Label, Link,
    Select,
    Text
} from "@fluentui/react-components";
import {
    ArrowExport16Filled,
    ArrowRoutingRectangleMultiple20Filled,
    BracesVariable20Filled,
    Rename16Filled,
    SerialPort16Filled,
    TextListRomanNumeralUppercase20Filled
} from "@fluentui/react-icons";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {Dispatch} from "@reduxjs/toolkit";
import {setCurrentSettingConfig} from "../../store/AppStore";
import {sendIpcMessage} from "../../bin/IPC";
import {useMainEventListener} from "../../bin/Hooks";
import {pathParse} from "../../utils/Global";
import YExtendTemplate from "../YExtendTemplate";
import AppConfig from "../../conf/AppConfig";

export const gpuCodes = new Map<TGPUVendors, string>([
    ['AMD', 'amf'],
    ['Intel', 'qsv'],
    ['NVIDIA', 'nvenc'],
    ['Apple', 'videotoolbox'],
    ['unknown', '']
]);

const selectOutputEventName = 'window:on:select-output-path';
const getGPUNameEventName = 'window:on:get-gpu-name';
const fileRules = ['name', 'ext', 'time', 'random'];
const getCustomMediaFileNameEventName = 'window:on:test-media-name';
const isWin32 = AppConfig.platform === 'win32';
const openInSystemLabel: string = isWin32 ? 'mediaFile.options.showInExplorer' : 'mediaFile.options.showInFinder';

const OutputSetting: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const currentSettingConfig = useSelector((state: RootState) => state.app.currentSettingConfig);
    const dispatch: Dispatch = useDispatch();
    const [optFileRule, _setOptFileRule] = useState(currentSettingConfig.output.customNameRule ?? '');
    const [previewCustomMediaFileName, setPreviewCustomMediaFileName] = useState<string>('');

    const setConfig = (data: any): void => {
        dispatch(setCurrentSettingConfig({
            ...currentSettingConfig,
            output: {
                ...currentSettingConfig.output,
                ...data
            }
        }));
    };

    const setOptFileRule = (value: string): void => {
        _setOptFileRule(optFileRule + value);
    };

    useMainEventListener<string>(selectOutputEventName, (data: string): void => {
        setConfig({
            outputPath: pathParse(data)
        });
    });

    useMainEventListener(getGPUNameEventName, (data: TGPUVendors): void => {
        const code = gpuCodes.get(data);

        // 仅当推断到具体硬件编码器且当前选择 GPU 时再更新，避免将已选值意外清空
        if (currentSettingConfig.output.codecType === 'GPU' && code) {
            setConfig({
                codecMethod: code
            });
        }
    });

    useMainEventListener<string>(getCustomMediaFileNameEventName, (data) => {
        setPreviewCustomMediaFileName(data);
    });

    useEffect(() => {
        sendIpcMessage(getGPUNameEventName);
    }, []);

    useEffect(() => {
        sendIpcMessage(getCustomMediaFileNameEventName, {
            path: currentSettingConfig.output.outputPath,
            rule: optFileRule
        });
        setConfig({
            customNameRule: optFileRule
        });
    }, [optFileRule]);

    return (
        <Fragment>
            <div className={'animated zoomIn'}>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <ArrowExport16Filled/>
                            {t('outputSetting.optPath')}
                        </Label>
                        <div>
                            <Input
                                value={currentSettingConfig.output.outputPath}
                                onClick={(): void => {
                                    sendIpcMessage(selectOutputEventName);
                                }}
                                contentAfter={
                                    <span
                                        className={'app_position_relative'}
                                        style={{
                                            top: '-8px'
                                        }}
                                    >
                                        <Link
                                            inline
                                            onClick={(): void => {
                                                sendIpcMessage('window:on:open-directory', currentSettingConfig.output.outputPath);
                                            }}
                                        >
                                            {t(openInSystemLabel)}
                                        </Link>
                                    </span>
                                }
                                readOnly
                            />
                        </div>
                    </div>
                    <div className={'system-setting-item'}>
                        <Label>
                            <Rename16Filled/>
                            {t('outputSetting.customFileName.label')}
                            <Select
                                value={currentSettingConfig.output.fileNameSpase}
                                onChange={(ev, {value}): void => {
                                    setConfig({
                                        fileNameSpase: `${value}`
                                    });
                                }}
                            >
                                <option value="origin">{t('outputSetting.customFileName.origin')}</option>
                                <option value="custom">{t('outputSetting.customFileName.customFileName')}</option>
                            </Select>
                        </Label>
                        <YExtendTemplate show={currentSettingConfig.output.fileNameSpase === 'custom'}>
                            <div style={{marginTop: '.5rem'}}>
                                <Card>
                                    <Label>
                                        <BracesVariable20Filled/>
                                        {t('outputSetting.customFileName.availableVars')} :
                                    </Label>
                                    <InteractionTag appearance="brand" size={'small'}>
                                        {
                                            fileRules.map((i): React.JSX.Element => {
                                                return (
                                                    <InteractionTagPrimary
                                                        key={i}
                                                        onClick={() => setOptFileRule(`{${i}}`)}
                                                    >
                                                        {`{ ${i} }`}
                                                    </InteractionTagPrimary>
                                                );
                                            })
                                        }
                                    </InteractionTag>
                                    <Input
                                        value={optFileRule}
                                        onChange={(ev, {value}) => {
                                            _setOptFileRule(value);
                                        }}
                                        onBlur={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const {value} = e.target;

                                            _setOptFileRule(value);
                                        }}
                                    />
                                    <Label>
                                        {t('outputSetting.customFileName.preview')}:
                                        <Text>
                                            {previewCustomMediaFileName}
                                        </Text>
                                    </Label>
                                </Card>
                            </div>
                        </YExtendTemplate>
                    </div>
                    <div className={'system-setting-item'}>
                        <Label>
                            <TextListRomanNumeralUppercase20Filled/>
                            {t('outputSetting.parallelTasks')}
                        </Label>
                        <div>
                            <Input
                                defaultValue={`${currentSettingConfig.output.parallelTasks}`}
                                type={'number'}
                                onChange={(ev, {value}): void => {
                                    setConfig({
                                        parallelTasks: `${value}`
                                    });
                                }}
                                min={1}
                                max={5}
                            />
                        </div>
                        <Divider
                            appearance="brand"
                            alignContent={'end'}
                        >
                            {t('outputSetting.parallelTasksDesc')}
                        </Divider>
                    </div>
                </Card>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <SerialPort16Filled/>
                            {t('outputSetting.codec')}
                        </Label>
                        <div>
                            <Select
                                defaultValue={currentSettingConfig.output.codecType}
                                onChange={(ev, {value}): void => {
                                    setConfig({
                                        codecType: value
                                    });
                                }}
                            >
                                <option value={'CPU'}>CPU ({t('outputSetting.softwareDecoding')})</option>
                                <option value={'GPU'}>GPU ({t('outputSetting.hardwareDecoding')})</option>
                            </Select>
                        </div>
                        <div className={'system-setting-item-content-divider'}>
                            <Divider
                                appearance="brand"
                                alignContent={'end'}
                            >
                                {t('outputSetting.hardwareDecodingDesc')}
                            </Divider>
                        </div>
                    </div>
                    <YExtendTemplate show={currentSettingConfig.output.codecType === 'GPU'}>
                        <div
                            className={`system-setting-item animated ${currentSettingConfig.output.codecType === 'GPU' ? 'zoomIn' : 'zoomOut'}`}>
                            <Label>
                                <ArrowRoutingRectangleMultiple20Filled/>
                                {t('outputSetting.gpuDecoderMethod')}
                            </Label>
                            <div className={'system-setting-item-content'}>
                                <Select
                                    defaultValue={currentSettingConfig.output.codecMethod}
                                    onChange={(ev, {value}): void => {
                                        setConfig({
                                            codecMethod: value
                                        });
                                    }}
                                >
                                    <YExtendTemplate show={AppConfig.platform === 'win32'}>
                                        <option value={'nvenc'}>NVIDIA (nvenc)</option>
                                        <option value={'amf'}>AMD (amf)</option>
                                        <option value={'qsv'}>Intel (qsv)</option>
                                    </YExtendTemplate>
                                    <YExtendTemplate show={AppConfig.platform === 'darwin'}>
                                        <option value={'video_toolbox'}>Apple Silicon (video_toolbox)</option>
                                    </YExtendTemplate>
                                </Select>
                                <div className={'system-setting-item-content-divider'}>
                                    <Divider
                                        appearance="brand"
                                        alignContent={'end'}
                                    >{t('outputSetting.gpuDecoderMethodDesc')}</Divider>
                                </div>
                            </div>
                        </div>
                    </YExtendTemplate>
                </Card>
            </div>
        </Fragment>
    );
};

export default OutputSetting;
