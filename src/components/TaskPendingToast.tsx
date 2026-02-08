import * as React from "react";
import Toast from "./FluentTemplates/Toast";
import {Spinner, Toaster, useId, useToastController} from "@fluentui/react-components";
import {useMainEventListener} from "../bin/Hooks";
import {TErrorMessage} from "./ErrorMessageToast";
import {useTranslation} from "react-i18next";

export type TTaskPendingMessage = {
    id: string;
    baseName: string;
};

const TaskPendingToast: React.FC = (): React.JSX.Element => {
    const id = useId('toaster');
    const {t} = useTranslation();
    const {dispatchToast, dismissToast, dismissAllToasts} = useToastController(id);
    const dismiss = (id: string): void => {
        setTimeout(() => {
            dismissToast(id);
        }, 500);
    };

    const mkToast = (data: TTaskPendingMessage): void => {
        const tid = data.id;

        dispatchToast(
            <Toast
                title={t('mediaFile.options.getMediaFileInformation')}
                loading
                titleMedia={
                    <Spinner size={'tiny'}/>
                }
                surface={
                    <>
                        <div style={{
                            maxHeight: '120px',
                            overflowY: 'auto',
                            marginBottom: '.5rem'
                        }}>
                            {
                                data.baseName
                            }
                        </div>
                    </>
                }
            />, {
                toastId: tid,
                timeout: -1
            });
    };

    useMainEventListener<TTaskPendingMessage>('main:on:media-info:pending', mkToast);
    useMainEventListener<TErrorMessage>('main:on:error', dismissAllToasts);
    useMainEventListener<TTaskPendingMessage>('main:on:media-info:complete', ({id}) => dismiss(id));

    return (
        <Toaster toasterId={id}/>
    );
};

export default TaskPendingToast;
