import * as React from "react";
import Toast, {ToastProgressBar} from "./FluentTemplates/Toast";
import {Button, ProgressBar, Spinner, Toaster, useId, useToastController} from "@fluentui/react-components";
import {useMainEventListener} from "../bin/Hooks";
import {useTranslation} from "react-i18next";
import {getUUID} from "../utils";
import {sendIpcMessage} from "../bin/IPC";

export interface IUpdateAvailableMessage {
    version?: string;
}

export interface IUpdateDownloadProgressMessage {
    percent: number;
    transferred: number;
    total: number;
}

export interface IUpdateDownloadedMessage {
    version?: string;
}

export interface IUpdateErrorMessage {
    message: string;
    type?: string;
}

const UpdateToast: React.FC = (): React.JSX.Element => {
    const id = useId('update-toaster');
    const {t} = useTranslation();
    const {dispatchToast, dismissToast} = useToastController(id);
    const [, setCheckingToastId] = React.useState<string | null>(null);
    const [downloadingToastId, setDownloadingToastId] = React.useState<string | null>(null);

    // 检查更新中
    useMainEventListener('main:on:update-checking', (): void => {
        // 先关闭之前的checking状态（如有）
        setCheckingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        const tid = getUUID();

        setCheckingToastId(tid);

        dispatchToast(
            <Toast
                title={t('update.checking')}
                loading
                titleMedia={<Spinner size={'tiny'}/>}
                surface={<div>{t('update.checking')}</div>}
            />, {
                toastId: tid,
                timeout: -1
            });

        // 添加超时保护，30秒后自动关闭loading（防止卡住）
        setTimeout(() => {
            setCheckingToastId((currentId) => {
                if (currentId === tid) {
                    dismissToast(tid);
                    return null;
                }
                return currentId;
            });
        }, 30000);
    });

    // 更新可用
    useMainEventListener<IUpdateAvailableMessage>('main:on:update-available', (data): void => {
        setCheckingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        const tid = getUUID();
        const versionText = data.version ? ` (v${data.version})` : '';

        dispatchToast(
            <Toast
                title={t('update.available')}
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {t('update.available')}{versionText}
                        </div>
                        <ToastProgressBar
                            intervalDelay={500}
                            onEnd={() => {
                                dismissToast(tid);
                            }}
                        />
                    </>
                }
            />, {
                toastId: tid,
                timeout: 5000,
                intent: "info"
            });
    });

    // 更新不可用
    useMainEventListener('main:on:update-not-available', (): void => {
        setCheckingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        const tid = getUUID();

        dispatchToast(
            <Toast
                title={t('update.noAvailable')}
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {t('update.noAvailable')}
                        </div>
                        <ToastProgressBar
                            intervalDelay={500}
                            onEnd={() => {
                                dismissToast(tid);
                            }}
                        />
                    </>
                }
            />, {
                toastId: tid,
                timeout: 3000,
                intent: "info"
            });
    });

    // 下载进度
    useMainEventListener<IUpdateDownloadProgressMessage>('main:on:update-download-progress', (data): void => {
        setCheckingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        // 如果还没有下载Toast，创建一个新的
        if (!downloadingToastId) {
            const tid = getUUID();

            setDownloadingToastId(tid);

            dispatchToast(
                <Toast
                    title={t('update.downloading')}
                    loading
                    titleMedia={<Spinner size={'tiny'}/>}
                    surface={
                        <>
                            <div style={{
                                maxHeight: '120px',
                                overflowY: 'auto',
                                marginBottom: '.5rem'
                            }}>
                                {t('update.downloadProgress', {percent: Math.round(data.percent)})}
                            </div>
                            <ProgressBar value={data.percent} max={100}/>
                        </>
                    }
                />, {
                    toastId: tid,
                    timeout: -1
                });
        } else {
            // 更新现有Toast的进度（通过重新创建来更新）
            dismissToast(downloadingToastId);
            const tid = getUUID();

            setDownloadingToastId(tid);

            dispatchToast(
                <Toast
                    title={t('update.downloading')}
                    loading
                    titleMedia={<Spinner size={'tiny'}/>}
                    surface={
                        <>
                            <div style={{
                                maxHeight: '120px',
                                overflowY: 'auto',
                                marginBottom: '.5rem'
                            }}>
                                {t('update.downloadProgress', {percent: Math.round(data.percent)})}
                            </div>
                            <ProgressBar value={data.percent} max={100}/>
                        </>
                    }
                />, {
                    toastId: tid,
                    timeout: -1
                });
        }
    });

    // 更新下载完成
    useMainEventListener<IUpdateDownloadedMessage>('main:on:update-downloaded', (data): void => {
        setCheckingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        setDownloadingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        const tid = getUUID();
        const versionText = data.version ? ` (v${data.version})` : '';

        const handleRestartNow = (): void => {
            sendIpcMessage('main:on:quit-and-install');
            dismissToast(tid);
        };

        const handleRestartLater = (): void => {
            dismissToast(tid);
        };

        dispatchToast(
            <Toast
                title={t('update.downloaded')}
                footer={
                    <div style={{display: 'flex', gap: '.5rem'}}>
                        <Button size="small" onClick={handleRestartNow}>
                            {t('update.restartNow')}
                        </Button>
                        <Button size="small" onClick={handleRestartLater}>
                            {t('update.restartLater')}
                        </Button>
                    </div>
                }
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {t('update.downloaded')}{versionText}
                        </div>
                        <ToastProgressBar
                            intervalDelay={500}
                            onEnd={() => {
                                dismissToast(tid);
                            }}
                        />
                    </>
                }
            />, {
                toastId: tid,
                timeout: -1,
                intent: "success"
            });
    });

    // 更新错误
    useMainEventListener<IUpdateErrorMessage>('main:on:update-error', (data): void => {
        // 确保关闭所有loading状态（使用函数式更新确保获取最新值）
        setCheckingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        setDownloadingToastId((currentId) => {
            if (currentId) {
                dismissToast(currentId);
            }
            return null;
        });

        const tid = getUUID();
        const errorType = data.type || 'unknown';
        const errorKey = `update.error.${errorType}`;
        const errorMessage = t(errorKey, {message: data.message, defaultValue: data.message});

        dispatchToast(
            <Toast
                title={t('systemMessage', {defaultValue: 'System Message'})}
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {errorMessage}
                        </div>
                        <ToastProgressBar
                            intervalDelay={500}
                            onEnd={() => {
                                dismissToast(tid);
                            }}
                        />
                    </>
                }
            />, {
                toastId: tid,
                timeout: 5000,
                intent: "error"
            });
    });

    return (
        <Toaster toasterId={id}/>
    );
};

export default UpdateToast;

