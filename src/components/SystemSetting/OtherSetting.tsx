import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import {Button, Card, Divider, Label, Select, Switch} from "@fluentui/react-components";
import {DeleteLines20Filled, DesktopOff20Filled, Whiteboard20Filled} from "@fluentui/react-icons";
import {useTranslation} from "react-i18next";
import {appTempFileInfo, deleteAppleTempFiles} from "../../utils";
import YExtendTemplate from "../YExtendTemplate";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";
import {LogLevels} from "./Config";
import {useSelector, useDispatch} from "react-redux";
import {RootState} from "../../store";
import {setCurrentSettingConfig} from "../../store/AppStore";
import type {LogLevel} from "electron-log";

const platform = process.platform;
const isWin32 = platform === 'win32';
const openInSystemLabel: string = isWin32 ? 'mediaFile.options.showInExplorer' : 'mediaFile.options.showInFinder';

const OtherSetting: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const [tempFileSize, setTempFileSize] = useState(0);
    const tmpFileSizeStr: string = tempFileSize > 1024 ? (tempFileSize / 1024).toFixed(2) + 'M' : tempFileSize + 'KB';
    const [pasOpen, setPasOpen] = useState(false);
    const currentSettingConfig = useSelector((state: RootState) => state.app.currentSettingConfig);
    const logLevel: LogLevel = (currentSettingConfig.other?.logLevel ?? 'info') as LogLevel;

    const init = (): void => {
        const {size} = appTempFileInfo();

        setTempFileSize(size);
    };

    useEffect(() => {
        init();

        sendIpcMessage('window:on:pas-is-open');
    }, []);

    useMainEventListener<boolean>('main:on:pas-is-open', (data): void => {
        setPasOpen(data);
    });
    useMainEventListener('main:on:pas-on', (): void => {
        setPasOpen(true);
    });
    useMainEventListener('main:on:pas-off', (): void => {
        setPasOpen(false);
    });

    return (
        <Fragment>
            <div className={'animated zoomIn'}>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <DeleteLines20Filled/>
                            {t('otherSetting.tmpFile')}
                        </Label>
                        <Divider
                            appearance="brand"
                            alignContent={'end'}
                        >
                            {tmpFileSizeStr}
                        </Divider>
                        <YExtendTemplate show={tempFileSize > 0}>
                            <div>
                                <Button
                                    onClick={(): void => {
                                        deleteAppleTempFiles();
                                        init();
                                    }}
                                >
                                    {t('deleteFile')}
                                </Button>
                            </div>
                        </YExtendTemplate>
                    </div>
                </Card>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <DesktopOff20Filled/>
                            {t('otherSetting.preventLowPowerMode')}
                        </Label>
                        <div>
                            <Switch
                                checked={pasOpen}
                                onChange={(ev, {checked}) => {
                                    setPasOpen(checked);
                                    sendIpcMessage('window:on:open-pas', checked);
                                }}
                            />
                            <Divider
                                appearance="brand"
                                alignContent={'end'}
                            >
                                {t('otherSetting.preventLowPowerModeDesc', {
                                    os: platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux'
                                })}
                            </Divider>
                        </div>
                    </div>
                </Card>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <Whiteboard20Filled/>
                            {t('otherSetting.logLevel', '日志级别')}
                        </Label>
                        <Divider
                            appearance="brand"
                            alignContent={'end'}
                        >
                            {t('otherSetting.logLevelDesc', '控制主进程日志输出级别，修改后立即生效')}
                        </Divider>
                        <div>
                            <Select
                                value={logLevel}
                                onChange={(_ev, data): void => {
                                    const level = (data.value ?? 'info') as LogLevel;

                                    dispatch(setCurrentSettingConfig({
                                        ...currentSettingConfig,
                                        other: {
                                            ...currentSettingConfig.other ?? {},
                                            logLevel: level
                                        }
                                    }));
                                    sendIpcMessage('window:on:set-log-level', level);
                                }}
                            >
                                {
                                    LogLevels.map(({label, value}): React.JSX.Element => {
                                        return (
                                            <option key={value} value={value}>{label}</option>
                                        );
                                    })
                                }
                            </Select>
                            <Button style={{
                                marginTop: '.5rem'
                            }} onClick={(): void => {
                                sendIpcMessage('window:on:open-app-logs-directory');
                            }}>
                                {t(openInSystemLabel)}
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        </Fragment>
    );
};

export default OtherSetting;
