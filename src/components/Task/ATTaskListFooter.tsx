import React, {useMemo, useState} from "react";
import BaseTaskListFooter from "./BaseTaskListFooter";
import TaskFormats from "./TaskFormats";
import {Select} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {
    atBatchMarkRunning,
    atBatchReset,
    atBatchStart,
    atBatchStop,
    atBatchTaskFinished,
    IATBatchState,
    updateCurrentATTaskItem
} from "../../store/ATTStore";
import {sendIpcMessage} from "../../bin/IPC";
import {useMainEventListener} from "../../bin/Hooks";
import {audioFormatType, IFormatType} from "../../const/formatType";

const ATTaskListFooter: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const currentATTask: IMediaInfo[] = useSelector((state: RootState): IMediaInfo[] => state.att.currentATTask);
    const atBatch: IATBatchState = useSelector((state: RootState): IATBatchState => state.att.atBatch);
    const parallelTasks: number = useSelector(
        (state: RootState): number => state.app.currentSettingConfig.output.parallelTasks || 1
    );

    // 是否有任务可供批量执行
    const hasTask: boolean = currentATTask.length > 0;

    // 从任务列表中获取统一的格式和编码器
    const unifiedFormat = React.useMemo((): string | undefined => {
        if (currentATTask.length === 0) return undefined;

        const firstFormat: string = currentATTask[0].optFormat;
        const allSame: boolean = currentATTask.every((task: IMediaInfo): boolean => task.optFormat === firstFormat);

        return allSame ? firstFormat : undefined;
    }, [currentATTask]);

    const unifiedCodec = React.useMemo((): string | undefined => {
        if (currentATTask.length === 0) return undefined;

        const firstCodec: string | undefined = currentATTask[0].audioParams?.codec;
        const allSame: boolean = currentATTask.every((task): boolean => task.audioParams?.codec === firstCodec);

        return allSame ? firstCodec : undefined;
    }, [currentATTask]);

    // 批量格式 / 编解码器的本地状态，初始化为统一值
    const [batchFormat, setBatchFormat] = useState<string | undefined>(unifiedFormat);
    const [batchCodec, setBatchCodec] = useState<string | undefined>(unifiedCodec);

    // 当统一格式或编码器变化时，更新本地状态
    React.useEffect((): void => {
        setBatchFormat(unifiedFormat);
    }, [unifiedFormat]);

    React.useEffect((): void => {
        setBatchCodec(unifiedCodec);
    }, [unifiedCodec]);

    const handleBatchFormatChange = (formatName: string): void => {
        setBatchFormat(formatName);

        // 获取新格式支持的编码器
        const newFormat: IFormatType | undefined = audioFormatType.find(
            (item: IFormatType): boolean => item.name === formatName
        );
        const supportedCodecs: string[] | undefined = newFormat?.supportedCodecs;
        const defaultCodec: string | undefined = supportedCodecs && supportedCodecs.length > 0 ? supportedCodecs[0] : undefined;

        // 批量更新所有任务的目标格式和编码器
        currentATTask.forEach((task: IMediaInfo): void => {
            const currentCodec: string | undefined = task.audioParams?.codec;
            let nextCodec: string | undefined = currentCodec;

            // 如果当前编码器不支持新格式，切换到第一个支持的编码器
            if (supportedCodecs && supportedCodecs.length > 0) {
                if (!currentCodec || !supportedCodecs.includes(currentCodec)) {
                    nextCodec = defaultCodec;
                }
            }

            dispatch(updateCurrentATTaskItem({
                id: task.id,
                changes: {
                    optFormat: formatName,
                    audioParams: {
                        ...task.audioParams,
                        codec: nextCodec
                    }
                }
            }));
        });

        // 更新批量编码器选择
        if (defaultCodec) {
            setBatchCodec(defaultCodec);
        }
    };

    const handleBatchCodecChange = (codec: string): void => {
        setBatchCodec(codec);

        // 批量更新所有任务的音频编解码器
        currentATTask.forEach((task: IMediaInfo): void => {
            dispatch(updateCurrentATTaskItem({
                id: task.id,
                changes: {
                    audioParams: {
                        ...task.audioParams,
                        codec
                    }
                }
            }));
        });
    };

    // 批量开始：创建队列并写入 store，调度逻辑交给 useEffect
    const handleStartAll = (): void => {
        if (!hasTask)
            return;

        const queue: string[] = currentATTask
            .filter((task: IMediaInfo): boolean => task.status !== 'processing')
            .map((task: IMediaInfo): string => task.id);

        if (queue.length < 1)
            return;

        dispatch(atBatchStart(queue));
    };

    // 结束（不代表主进程任务结束
    const handleStopAll = (): void => {
        dispatch(atBatchStop());
    };

    // 监听任务完成事件，批量更新状态
    useMainEventListener<{ id: string }>('main:on:task-end', ({id}): void => {
        dispatch(atBatchTaskFinished(id));
    });

    // 根据atBatch 状态与并发配置自动调度任务
    React.useEffect((): void => {
        if (atBatch.status !== 'running')
            return;

        const maxParallel: number = Math.max(1, parallelTasks);
        const canStart: number = maxParallel - atBatch.running.length;

        if (canStart <= 0)
            return;

        const toStartIds: string[] = atBatch.queue.slice(0, canStart);

        if (toStartIds.length < 1) {
            // 无了
            if (atBatch.running.length === 0 && atBatch.queue.length === 0)
                dispatch(atBatchReset());
            return;
        }

        const tasksToStart: IMediaInfo[] = toStartIds
            .map((id: string): IMediaInfo | undefined =>
                currentATTask.find((task: IMediaInfo): boolean => task.id === id))
            .filter((task: IMediaInfo | undefined): task is IMediaInfo => !!task);

        if (tasksToStart.length < 1)
            return;

        tasksToStart.forEach((task: IMediaInfo): void => {
            sendIpcMessage('main:on:task-create:audio-media-transform', task);
            dispatch(updateCurrentATTaskItem({
                id: task.id,
                changes: {
                    status: 'processing',
                    progress: task.progress ?? 0
                }
            }));
        });

        dispatch(atBatchMarkRunning(toStartIds));
    }, [atBatch, currentATTask, parallelTasks, dispatch]);

    const codecSelect = useMemo((): React.JSX.Element => {
        // 根据当前批量格式限制可选的编码器
        let allowedCodecValues: string[] | undefined | null = null;

        if (batchFormat) {
            const currentFormat: IFormatType | undefined = audioFormatType.find(
                (item: IFormatType): boolean => item.name === batchFormat
            );

            allowedCodecValues = currentFormat?.supportedCodecs;
        }

        const allCodecs = [
            {value: 'aac', label: 'AAC'},
            {value: 'mp3', label: 'MP3'},
            {value: 'flac', label: 'FLAC'},
            {value: 'opus', label: 'OPUS'}
        ];

        const options = allowedCodecValues
            ? allCodecs.filter((item): boolean => allowedCodecValues?.includes(item.value) ?? false)
            : allCodecs;

        // 如果当前编码器不在支持列表中，使用第一个支持的
        const currentCodecValue = batchCodec && options.some((opt): boolean => opt.value === batchCodec)
            ? batchCodec
            : options[0]?.value;

        return (
            <Select
                value={currentCodecValue}
                disabled={!hasTask}
                onChange={(_, data): void => {
                    handleBatchCodecChange(data.value);
                }}
            >
                {
                    options.map((opt): React.JSX.Element =>
                        <option key={opt.value} value={opt.value} label={opt.label}/>
                    )
                }
            </Select>
        );
    }, [batchCodec, batchFormat, hasTask]);

    return (
        <BaseTaskListFooter
            batch={atBatch}
            surface={
                <div className={'app_flex_box'}>
                    <div className={'task-list-footer-item'}>
                        <span>{t('mediaFile.outPutFormat')}：</span>
                        <TaskFormats
                            type={'audio'}
                            value={batchFormat}
                            disabled={!hasTask}
                            onChange={(format): void => {
                                handleBatchFormatChange(format.name);
                            }}
                        />
                    </div>
                    <div className={'task-list-footer-item'}>
                        <span>{t('mediaFile.audioCode')}：</span>
                        {codecSelect}
                    </div>
                </div>
            }
            onStartAll={handleStartAll}
            onStopAll={handleStopAll}
        />
    );
};

export default ATTaskListFooter;

