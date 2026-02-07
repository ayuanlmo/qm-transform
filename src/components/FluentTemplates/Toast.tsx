import * as React from "react";
import {
    Link,
    ProgressBar,
    Toast as MSToast,
    ToastBody,
    ToastFooter,
    ToastTitle,
    ToastTrigger
} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";

export interface IToastProps {
    triggerEvent?: () => void;
    triggerDisplayValue?: string;
    surface: string | React.JSX.Element;
    title: string | React.JSX.Element;
    footer?: React.JSX.Element;
    pauseOnHover?: boolean;
    loading?: boolean;
    titleMedia?: React.JSX.Element;
}

/**
 * Toast
 * @description const {dispatchToast} = useToastController(toastId);
 * @description const mkToast = () => dispatchToast(<Toast content="xxx" />,{id,intent});
 * **/

const Toast: React.FC<IToastProps> = (
    {
        surface,
        title,
        triggerDisplayValue = useTranslation().t('close'),
        triggerEvent,
        footer,
        loading = false,
        titleMedia
    }: IToastProps): React.JSX.Element => {

    return (
        <MSToast>
            <ToastTitle
                media={titleMedia}
                action={
                    loading ? <></> : <ToastTrigger>
                        <Link onClick={triggerEvent}>
                            {
                                triggerDisplayValue
                            }
                        </Link>
                    </ToastTrigger>

                }
            >
                {title}
            </ToastTitle>
            <ToastBody>
                {surface}
            </ToastBody>
            {
                footer &&
                <ToastFooter>
                    {
                        footer
                    }
                </ToastFooter>
            }
        </MSToast>
    );
};

export interface IToastProgressBarProps {
    onEnd: () => void;
    intervalDelay?: number;
    intervalIncrement?: number;
}

export const ToastProgressBar: React.FC<IToastProgressBarProps> = (
    {
        onEnd,
        intervalDelay = 100,
        intervalIncrement = 5
    }
): React.JSX.Element => {
    const [value, setValue] = React.useState(100);

    React.useEffect(() => {
        if (value > 0) {
            const timeout = setTimeout((): void => {
                setValue((v) => Math.max(v - intervalIncrement, 0));
            }, intervalDelay);

            return () => clearTimeout(timeout);
        }

        if (value === 0)
            onEnd();
    }, [value, onEnd]);

    return <ProgressBar value={value} max={100}/>;
};

export default Toast;
