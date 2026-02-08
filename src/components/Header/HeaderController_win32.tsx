import * as React from "react";
import {useState} from "react";
import {sendIpcMessage} from "../../bin/IPC";
import {Button, DialogActions, DialogBody, DialogContent, DialogTrigger, Tooltip} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";
import Global from "../../utils/Global";
import type OS from 'node:os';
import {useMainEventListener} from "../../bin/Hooks";
import Fluent from '../FluentTemplates';

const isWin32: boolean = Global.requireNodeModule<typeof OS>('os').platform() === 'win32';

/**
 * @description HeaderController_win32 适用于Windows系统的HeaderController(最小化、最大化、关闭)
 * @author @ayuanlmo
 * @date 2022/4/17
 * @version v2
 * **/
const HeaderController_win32: React.FC = (): React.JSX.Element => {
    const [isMaxWindow, setIsMaxWindow] = useState<boolean>(false);
    const {t} = useTranslation();

    useMainEventListener('window:on:un-max-size', () => {
        setIsMaxWindow(false);
    });
    useMainEventListener('window:on:max-size', () => {
        setIsMaxWindow(true);
    });

    return (
        <>
            {
                isWin32 ? <>
                    <Tooltip content={t('window.hide')} relationship={"label"}>
                        <div className={'header-controller-item'}
                             onClick={(): void => {
                                 sendIpcMessage('window:on:mini-size');
                             }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="1" viewBox="0 0 12 1"
                                 fill="#626262">
                                <rect width="12" height="1" fill="#626262"/>
                            </svg>
                        </div>
                    </Tooltip>
                    <Tooltip content={t(isMaxWindow ? 'window.mini' : 'window.max')} relationship={"label"}>
                        <div className={'header-controller-item'}
                             onClick={(): void => {
                                 sendIpcMessage(isMaxWindow ? 'window:on:un-max-size' : 'window:on:max-size');
                                 setIsMaxWindow(!isMaxWindow);
                             }}>
                            {
                                isMaxWindow ?
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                                         fill="none">
                                        <path
                                            d="M8.01829 12H1.98171C0.884146 12 0 11.1159 0 10.0183V3.98171C0 2.88415 0.884146 2 1.98171 2H8.01829C9.11585 2 10 2.88415 10 3.98171V10.0183C10 11.1159 9.11585 12 8.01829 12ZM1.98171 2.91463C1.40244 2.91463 0.914634 3.40244 0.914634 3.98171V10.0183C0.914634 10.5976 1.40244 11.0854 1.98171 11.0854H8.01829C8.59756 11.0854 9.08537 10.5976 9.08537 10.0183V3.98171C9.08537 3.40244 8.59756 2.91463 8.01829 2.91463H1.98171Z"
                                            fill="#626262"/>
                                        <path
                                            d="M9.89649 10C9.65261 10 9.43921 9.78659 9.43921 9.54268C9.43921 9.29878 9.65261 9.08537 9.89649 9.08537C10.5367 9.08537 11.0549 8.56707 11.0549 7.92683V1.98171C11.0549 1.37195 10.5977 0.914634 9.98795 0.914634H4.07374C3.43354 0.914634 2.91529 1.43293 2.91529 2.07317C2.91529 2.31707 2.70189 2.53049 2.458 2.53049C2.21412 2.53049 2.00072 2.31707 2.00072 2.07317C1.97023 0.914634 2.91529 0 4.07374 0H10.0184C11.1159 0 12 0.884146 12 1.98171V7.92683C11.9695 9.05488 11.0549 10 9.89649 10Z"
                                            fill="#626262"/>
                                    </svg> :
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                                         fill="none">
                                        <rect x="0.5" y="0.5" width="11" height="11" rx="1.5" stroke="#626262"/>
                                    </svg>
                            }
                        </div>
                    </Tooltip>
                    <Fluent.Dialog
                        title={t('systemMessage')}
                        footerCloseTrigger={false}
                        trigger={
                            <div className={'header-controller-item header-controller-close'}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 12 12"
                                     fill="#626262">
                                    <rect x="0.631592" width="16.0774" height="0.893188"
                                          transform="rotate(45 0.631592 0)"/>
                                    <rect x="12" y="0.631592" width="16.0774" height="0.893188"
                                          transform="rotate(135 12 0.631592)"/>
                                </svg>
                            </div>
                        }
                        surface={
                            <DialogBody>
                                <DialogContent>
                                    {t('window.closeMessage')}
                                </DialogContent>
                                <DialogActions>
                                    <Button appearance="primary" onClick={(): void => {
                                        sendIpcMessage('window:on:close');
                                    }}>
                                        {t('confirm')}
                                    </Button>
                                    <DialogTrigger disableButtonEnhancement>
                                        <Button appearance="secondary">
                                            {t('cancel')}
                                        </Button>
                                    </DialogTrigger>
                                </DialogActions>
                            </DialogBody>
                        }
                    >
                    </Fluent.Dialog>
                </> : <></>
            }
        </>
    );
};

export default HeaderController_win32;
