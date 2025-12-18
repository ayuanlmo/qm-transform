import React from "react";
import {Button, Text} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";

export interface IBatchState {
    status: 'idle' | 'running' | 'stopping';
    queue: string[];
    running: string[];
}

export interface ITaskListFooterProps {
    surface: string | React.ReactElement;
    onStartAll?: () => void;
    onStopAll?: () => void;
    batch?: IBatchState;
}

const BaseTaskListFooter: React.FC<ITaskListFooterProps> = (props: ITaskListFooterProps): React.JSX.Element => {
    const {surface, onStartAll, onStopAll, batch} = props;
    const {t} = useTranslation();
    const isRunning: boolean = batch ? batch.status === 'running' || batch.status === 'stopping' && batch.running.length > 0 : false;
    const total: number = batch ? batch.queue.length + batch.running.length : 0;
    const runningCount: number = batch ? batch.running.length : 0;

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
                    {total > 0 && isRunning && batch &&
                        <Text size={200} className={'task-list-footer-status'}>
                            {t('mediaFile.options.batchRunning', {
                                current: runningCount,
                                total: runningCount + batch.queue.length
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
