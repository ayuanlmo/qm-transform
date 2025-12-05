import {useMainEventListener} from "../bin/Hooks";
import Toast, {ToastProgressBar} from "./FluentTemplates/Toast";
import {Link, Toaster, useId, useToastController} from "@fluentui/react-components";
import * as React from "react";
import {useTranslation} from "react-i18next";
import {getUUID} from "../utils";
import {sendIpcMessage} from "../bin/IPC";
import Global from "../utils/Global";
import type OS from "os";

const os = Global.requireNodeModule<typeof OS>('os');

export interface ITaskEndMessage {
    id: string;
    progress: number;
    path: string;
    baseName: string;
}

const TaskEndToast = () => {
    const id: string = useId('toaster');
    const {t} = useTranslation();
    const {dispatchToast, dismissToast} = useToastController(id);

    const mkToast = (data: ITaskEndMessage): void => {
        const {baseName, path} = data;
        const tid: string = getUUID();

        const isWin32: boolean = os.platform() === 'win32';
        const openInSystemLabel: string = isWin32 ? t('mediaFile.options.showInExplorer') : t('mediaFile.options.showInFinder');

        dispatchToast(
            <Toast
                title={t('mediaFile.options.conversionSuccessMessage', {name: baseName})}
                footer={
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
                            {baseName}
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
                intent: "success"
            });
    };

    useMainEventListener('main:on:task-end', mkToast);

    return (
        <Toaster toasterId={id}/>
    );
};

export default TaskEndToast;
