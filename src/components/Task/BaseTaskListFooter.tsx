import React from "react";
import {Button, Text} from "@fluentui/react-components";
import {useSelector} from "react-redux";
import {RootState} from "../../store";
import {IVTBatchState} from "../../store/AppStore";
import {useTranslation} from "react-i18next";

export interface ITaskListFooterProps {
    surface: string | React.ReactElement;
    onStartAll?: () => void;
    onStopAll?: () => void;
}

const BaseTaskListFooter: React.FC<ITaskListFooterProps> = (props: ITaskListFooterProps): React.JSX.Element => {
    const {surface, onStartAll, onStopAll} = props;
    const {t} = useTranslation();
    const vtBatch: IVTBatchState = useSelector((state: RootState): IVTBatchState => state.app.vtBatch);
    const isRunning: boolean = vtBatch.status === 'running' || vtBatch.status === 'stopping' && vtBatch.running.length > 0;
    const total: number = vtBatch.queue.length + vtBatch.running.length;
    const runningCount: number = vtBatch.running.length;

    const handleClick = (): void => {
        if (isRunning)
            onStopAll?.();
        else
            onStartAll?.();
    };

    return (
        <div className={'task-list-footer'}>
            <div className={'task-list-footer-content app_flex_box'}>
                {surface}

                <div className={'task-list-footer-actions'}>
                    {total > 0 && isRunning &&
                        <Text size={200} className={'task-list-footer-status'}>
                            {t('mediaFile.options.batchRunning', {
                                current: runningCount,
                                total: runningCount + vtBatch.queue.length
                            })}
                        </Text>
                    }
                    <Button
                        onClick={handleClick}
                        appearance="primary"
                        disabled={!onStartAll && !onStopAll}
                    >
                        {isRunning ? t('mediaFile.options.stopAll') : t('mediaFile.options.startConversionAll')}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default BaseTaskListFooter;
