import * as React from "react";
import Toast, {ToastProgressBar} from "./FluentTemplates/Toast";
import {Toaster, useId, useToastController} from "@fluentui/react-components";
import {useMainEventListener} from "../bin/Hooks";
import {useTranslation} from "react-i18next";
import {getUUID} from "../utils";

export type TErrorMessage = {
    type: string;
    message: string;
    mediaFile: string;
};

const ErrorMessageToast: React.FC = (): React.JSX.Element => {
    const id = useId('toaster');
    const {t} = useTranslation();
    const {dispatchToast, dismissToast} = useToastController(id);

    const mkToast = (data: TErrorMessage) => {
        const {message, mediaFile, type} = data;
        const tid = getUUID();

        dispatchToast(
            <Toast
                title={t('errMessage.label')}
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {
                                t(`errMessage.${type}`, {
                                    message,
                                    mediaFile
                                })
                            }
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
                intent: "error"
            });
    };

    useMainEventListener<TErrorMessage>('main:on:error', mkToast);

    return (
        <Toaster toasterId={id}/>
    );
};

export default ErrorMessageToast;
