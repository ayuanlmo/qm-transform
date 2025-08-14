import * as React from "react";
import {
    Button,
    Dialog as MsDialog,
    DialogActions,
    DialogBody,
    DialogContent,
    DialogSurface,
    DialogTitle,
    DialogTrigger
} from "@fluentui/react-components";

import {Dismiss24Regular} from "@fluentui/react-icons";
import {useTranslation} from "react-i18next";

export interface IDialogProps {
    open?: boolean;
    title: string;
    trigger?: React.ReactElement;
    surface: string | React.ReactElement;
    titleClose?: boolean;
    footer?: React.ReactElement;
    footerCloseTrigger?: boolean;
    onClose?: () => void;
    footerCloseTriggerLabel?: string;
    disableButtonEnhancement?: boolean;
}

export const Dialog: React.FC<IDialogProps> = (props: IDialogProps) => {
    const {t} = useTranslation();
    const {
        open,
        title,
        trigger = null,
        surface,
        titleClose = false,
        footer,
        footerCloseTrigger = true,
        onClose,
        footerCloseTriggerLabel = t('close'),
        disableButtonEnhancement = true
    } = props;

    return (
        <MsDialog open={open}>
            <DialogTrigger disableButtonEnhancement={disableButtonEnhancement}>
                {
                    trigger
                }
            </DialogTrigger>
            <DialogSurface>
                <DialogBody>
                    <DialogTitle action={
                        titleClose ? <DialogTrigger>
                            <Button
                                icon={<Dismiss24Regular/>}
                                appearance="subtle"
                                aria-label="close"
                            />
                        </DialogTrigger> : undefined
                    }>
                        {title}
                    </DialogTitle>
                    <DialogContent>
                        {
                            surface
                        }
                    </DialogContent>
                    <DialogActions>
                        {
                            footer
                        }
                        {
                            footerCloseTrigger ? <DialogTrigger disableButtonEnhancement>
                                <Button onClick={onClose} appearance="secondary">
                                    {footerCloseTriggerLabel}
                                </Button>
                            </DialogTrigger> : undefined
                        }
                    </DialogActions>
                </DialogBody>
            </DialogSurface>
        </MsDialog>
    );
};

export default Dialog;
