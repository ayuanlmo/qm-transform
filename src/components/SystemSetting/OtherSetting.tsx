import * as React from "react";
import {Fragment, useEffect, useState} from "react";
import {Button, Card, Divider, Label, Switch} from "@fluentui/react-components";
import {DeleteLines20Filled, DesktopOff20Filled} from "@fluentui/react-icons";
import {useTranslation} from "react-i18next";
import {appTempFileInfo, deleteAppleTempFiles} from "../../utils";
import YExtendTemplate from "../YExtendTemplate";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";

const platform = process.platform;

const OtherSetting: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const [tempFileSize, setTempFileSize] = useState(0);
    const tmpFileSizeStr: string = tempFileSize > 1024 ? (tempFileSize / 1024).toFixed(2) + 'M' : tempFileSize + 'KB';
    const [pasOpen, setPasOpen] = useState(false);

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
            </div>
        </Fragment>
    );
};

export default OtherSetting;
