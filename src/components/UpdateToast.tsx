import * as React from "react";
import Toast, {ToastProgressBar} from "./FluentTemplates/Toast";
import {Button, ProgressBar, Spinner, Toaster, useId, useToastController} from "@fluentui/react-components";
import {useMainEventListener} from "../bin/Hooks";
import {useTranslation} from "react-i18next";
import {getUUID} from "../utils";
import {sendIpcMessage} from "../bin/IPC";
import {useSelector} from "react-redux";
import {RootState} from "../store";

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

/** 下载/重启都是不可逆的动作，用最新状态判断，别用弹提示那一刻的快照 **/
const hasTaskInProgressSelector = (state: RootState): boolean => {
    const running = (list: IMediaInfo[]): boolean => list.some(
        (t: IMediaInfo): boolean => t.status === 'processing' || t.status === 'paused'
    );

    return running(state.att.currentATTask) || running(state.vtt.currentVTTask) || running(state.videoConcat.currentVcTask);
};

/**
 * 更新提示。
 *
 * 监听器只在挂载时注册一次（见 useMainEventListener），所以回调里读到的 state 永远停在首帧，
 * 判重一律走 ref；用 state 判重会让每条 download-progress 都以为自己面前没有提示，
 * 一次下载能叠出上百个进度条。
 * **/
const UpdateToast: React.FC = (): React.JSX.Element => {
    const id = useId('update-toaster');
    const {t} = useTranslation();
    const {dispatchToast, dismissToast} = useToastController(id);
    const checkingId = React.useRef<string | null>(null);
    const downloadingId = React.useRef<string | null>(null);
    const availableId = React.useRef<string | null>(null);
    const downloadedId = React.useRef<string | null>(null);
    const noticeId = React.useRef<string | null>(null);
    const checkingTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
    const hasTaskInProgress = useSelector(hasTaskInProgressSelector);
    const taskRunning = React.useRef<boolean>(hasTaskInProgress);

    React.useEffect((): void => {
        taskRunning.current = hasTaskInProgress;
    }, [hasTaskInProgress]);

    const present = (ref: React.MutableRefObject<string | null>, node: React.JSX.Element, options: object): void => {
        if (ref.current === null)
            ref.current = getUUID();

        dispatchToast(node, {toastId: ref.current, ...options});
    };

    const retire = (ref: React.MutableRefObject<string | null>): void => {
        if (ref.current === null)
            return;

        dismissToast(ref.current);
        ref.current = null;
    };

    const stopChecking = (): void => {
        if (checkingTimer.current !== null) {
            clearTimeout(checkingTimer.current);
            checkingTimer.current = null;
        }
        retire(checkingId);
        retire(noticeId);
    };

    // 检查更新中
    useMainEventListener('main:on:update-checking', (): void => {
        stopChecking();

        present(checkingId,
            <Toast
                title={t('update.checking')}
                loading
                titleMedia={<Spinner size={'tiny'}/>}
                surface={<div>{t('update.checking')}</div>}
            />, {timeout: -1});

        // 兜底：检查卡住时不要把转圈的提示永久留在这儿
        checkingTimer.current = setTimeout(stopChecking, 30000);
    });

    // 更新可用：autoDownload 已经关掉，下载由这里的按钮发起
    useMainEventListener<IUpdateAvailableMessage>('main:on:update-available', (data): void => {
        stopChecking();

        const versionText: string = data.version ? ` (v${data.version})` : '';
        const handleDownload = (): void => {
            retire(availableId);
            sendIpcMessage('main:on:download-update');
        };

        present(availableId,
            <Toast
                title={t('update.available')}
                footer={
                    <div style={{display: 'flex', gap: '.5rem'}}>
                        <Button size="small" onClick={handleDownload}>
                            {t('update.downloadNow')}
                        </Button>
                        <Button size="small" onClick={(): void => retire(availableId)}>
                            {t('update.later')}
                        </Button>
                    </div>
                }
                surface={
                    <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '.5rem'}}>
                        {t('update.available')}{versionText}
                    </div>
                }
            />, {timeout: -1, intent: "info"});
    });

    // 更新不可用
    useMainEventListener('main:on:update-not-available', (): void => {
        stopChecking();

        present(noticeId,
            <Toast
                title={t('update.noAvailable')}
                surface={
                    <>
                        <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '.5rem'}}>
                            {t('update.noAvailable')}
                        </div>
                        <ToastProgressBar intervalDelay={500} onEnd={(): void => retire(noticeId)}/>
                    </>
                }
            />, {timeout: 3000, intent: "info"});
    });

    // 下载进度：始终复用同一条提示，只换进度
    useMainEventListener<IUpdateDownloadProgressMessage>('main:on:update-download-progress', (data): void => {
        stopChecking();
        retire(availableId);

        present(downloadingId,
            <Toast
                title={t('update.downloading')}
                loading
                titleMedia={<Spinner size={'tiny'}/>}
                surface={
                    <>
                        <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '.5rem'}}>
                            {t('update.downloadProgress', {percent: Math.round(data.percent)})}
                        </div>
                        <ProgressBar value={data.percent} max={100}/>
                    </>
                }
            />, {timeout: -1});
    });

    // 更新下载完成
    useMainEventListener<IUpdateDownloadedMessage>('main:on:update-downloaded', (data): void => {
        stopChecking();
        retire(availableId);
        retire(downloadingId);

        const versionText: string = data.version ? ` (v${data.version})` : '';

        const handleRestartNow = (): void => {
            // 安装包要覆盖 app.asar.unpacked 里的 ffmpeg，转换没跑完就重启会撞文件、也可能装不上。
            // 这里只提示，不把「下载完成」那条收掉：任务跑完用户还能直接点同一个按钮。
            if (taskRunning.current) {
                present(noticeId,
                    <Toast
                        title={t('update.downloaded')}
                        surface={<div>{t('update.tasksRunning')}</div>}
                    />, {timeout: 6000, intent: "warning"});

                return;
            }

            retire(downloadedId);
            sendIpcMessage('main:on:quit-and-install');
        };

        present(downloadedId,
            <Toast
                title={t('update.downloaded')}
                footer={
                    <div style={{display: 'flex', gap: '.5rem'}}>
                        <Button size="small" onClick={handleRestartNow}>
                            {t('update.restartNow')}
                        </Button>
                        <Button size="small" onClick={(): void => retire(downloadedId)}>
                            {t('update.restartLater')}
                        </Button>
                    </div>
                }
                surface={
                    <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '.5rem'}}>
                        {t('update.downloaded')}{versionText}
                    </div>
                }
            />, {timeout: -1, intent: "success"});
    });

    // 更新错误
    useMainEventListener<IUpdateErrorMessage>('main:on:update-error', (data): void => {
        stopChecking();
        retire(availableId);
        retire(downloadingId);

        const errorType: string = data.type || 'unknown';
        const errorMessage: string = t(`update.error.${errorType}`, {message: data.message, defaultValue: data.message});

        present(noticeId,
            <Toast
                title={t('systemMessage', {defaultValue: 'System Message'})}
                surface={
                    <>
                        <div style={{maxHeight: '120px', overflowY: 'auto', marginBottom: '.5rem'}}>
                            {errorMessage}
                        </div>
                        <ToastProgressBar intervalDelay={500} onEnd={(): void => retire(noticeId)}/>
                    </>
                }
            />, {timeout: 5000, intent: "error"});
    });

    React.useEffect((): () => void => () => stopChecking(), []);

    return (
        <Toaster toasterId={id}/>
    );
};

export default UpdateToast;
