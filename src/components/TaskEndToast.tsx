import {useMainEventListener} from "../bin/Hooks";
import Toast, {ToastProgressBar} from "./FluentTemplates/Toast";
import {Link, Toaster, useId, useToastController} from "@fluentui/react-components";
import * as React from "react";
import {useTranslation} from "react-i18next";
import {getShowInSystemFileManagerI18nKey, getUUID} from "../utils";
import {sendIpcMessage} from "../bin/IPC";

export interface ITaskEndMessage {
    id: string;
    progress: number;
    path: string | null;
    baseName: string;
    error?: boolean;
    errorMessage?: string;
}

const TaskEndToast = () => {
    const id: string = useId('toaster');
    const {t} = useTranslation();
    const {dispatchToast, dismissToast} = useToastController(id);

    const mkToast = (data: ITaskEndMessage): void => {
        const {baseName, path, error, errorMessage} = data;
        const tid: string = getUUID();

        const openInSystemLabel: string = t(getShowInSystemFileManagerI18nKey());

        dispatchToast(
            <Toast
                title={error
                    ? t('errMessage.conversionFailedMessage', {name: baseName, message: errorMessage ?? ''})
                    : t('mediaFile.options.conversionSuccessMessage', {name: baseName})}
                footer={
                    error || !path ? undefined : 
                        <Link
                            onClick={(): void => {
                                sendIpcMessage('window:on:open-directory', path);
                            }}
                        >
                            {openInSystemLabel}
                        </Link>
                    
                }
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {error ? errorMessage ?? baseName : baseName}
                        </div>
                        <ToastProgressBar
                            intervalDelay={500}
                            onEnd={(): void => {
                                dismissToast(tid);
                            }}
                        />
                    </>
                }
            />, {
                toastId: tid,
                timeout: -1,
                intent: error ? "error" : "success"
            });
    };

    useMainEventListener('main:on:task-end', mkToast);

    return (
        <Toaster toasterId={id}/>
    );
};

export default TaskEndToast;
