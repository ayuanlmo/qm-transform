import React, {useMemo, useState} from "react";
import BaseTaskListFooter from "./BaseTaskListFooter";
import TaskFormats from "./TaskFormats";
import {Select} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {codecOptions, getAvailableResolutions} from "../VT/const";
import type {IVTBatchState} from "../../store/VTTStore";
import {
    updateCurrentVTTaskItem,
    vtBatchMarkRunning,
    vtBatchReset,
    vtBatchStart,
    vtBatchStop,
    vtBatchTaskFinished
} from "../../store/VTTStore";
import {sendIpcMessage} from "../../bin/IPC";
import {useMainEventListener} from "../../bin/Hooks";
import {IFormatType, videoFormatType} from "../../const/formatType";

const VTTaskListFooter: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const currentVTTask: IMediaInfo[] = useSelector((state: RootState): IMediaInfo[] => state.vtt.currentVTTask);
    const vtBatch: IVTBatchState = useSelector((state: RootState): IVTBatchState => state.vtt.vtBatch);
    const parallelTasks: number = useSelector(
        (state: RootState): number => state.app.currentSettingConfig.output.parallelTasks || 1
    );

    // 批量格式 / 编解码器 / 分辨率的本地状态
    const [batchFormat, setBatchFormat] = useState<string | undefined>(undefined);
    const [batchCodec, setBatchCodec] = useState<string | undefined>(undefined);
    const [batchResolution, setBatchResolution] = useState<string | undefined>(undefined);

    // 是否有任务可供批量执行
    const hasTask: boolean = currentVTTask.length > 0;

    const handleBatchFormatChange = (formatName: string): void => {
        setBatchFormat(formatName);

        // 批量更新所有任务的目标格式
        currentVTTask.forEach((task: IMediaInfo): void => {
            dispatch(updateCurrentVTTaskItem({
                id: task.id,
                changes: {
                    optFormat: formatName
                }
            }));
        });
    };

    const handleBatchCodecChange = (codec: string): void => {
        setBatchCodec(codec);

        // 批量更新所有任务的视频编解码器
        currentVTTask.forEach((task: IMediaInfo): void => {
            dispatch(updateCurrentVTTaskItem({
                id: task.id,
                changes: {
                    videoParams: {
                        ...task.videoParams,
                        codec
                    }
                }
            }));
        });
    };

    const handleBatchResolutionChange = (resolutionValue: string): void => {
        setBatchResolution(resolutionValue);

        // 批量更新所有任务的分辨率
        currentVTTask.forEach((task: IMediaInfo): void => {
            // 获取任务原始分辨率
            let originalWidth: number = 0;
            let originalHeight: number = 0;

            if (task.mediaInfo && task.mediaInfo.streams) {
                const videoStream = task.mediaInfo.streams.find(
                    (stream) => stream.codec_type === 'video'
                );

                if (videoStream) {
                    originalWidth = videoStream.width || 0;
                    originalHeight = videoStream.height || 0;
                }
            }

            // 获取该任务的可用分辨率列表
            const availableResolutions = getAvailableResolutions(originalWidth, originalHeight);
            const selectedResolution = availableResolutions.find(
                (res) => res.value === resolutionValue
            );

            if (selectedResolution) {
                const targetWidth = selectedResolution.value === 'original'
                    ? originalWidth
                    : selectedResolution.width;
                const targetHeight = selectedResolution.value === 'original'
                    ? originalHeight
                    : selectedResolution.height;

                dispatch(updateCurrentVTTaskItem({
                    id: task.id,
                    changes: {
                        videoParams: {
                            ...task.videoParams,
                            width: targetWidth,
                            height: targetHeight
                        }
                    }
                }));
            }
        });
    };

    // 批量开始：创建队列并写入 store，调度逻辑交给 useEffect
    const handleStartAll = (): void => {
        if (!hasTask)
            return;

        const queue: string[] = currentVTTask
            .filter((task: IMediaInfo): boolean => task.status !== 'processing')
            .map((task: IMediaInfo): string => task.id);

        if (queue.length < 1)
            return;

        dispatch(vtBatchStart(queue));
    };

    // 结束（不代表主进程任务结束
    const handleStopAll = (): void => {
        dispatch(vtBatchStop());
    };

    // 监听任务完成事件，批量更新状态
    useMainEventListener<{ id: string }>('main:on:task-end', ({id}): void => {
        dispatch(vtBatchTaskFinished(id));
    });

    // 根据vtBatch 状态与并发配置自动调度任务
    React.useEffect((): void => {
        if (vtBatch.status !== 'running')
            return;

        const maxParallel: number = Math.max(1, parallelTasks);
        const canStart: number = maxParallel - vtBatch.running.length;

        if (canStart <= 0)
            return;

        const toStartIds: string[] = vtBatch.queue.slice(0, canStart);

        if (toStartIds.length < 1) {
            // 无了
            if (vtBatch.running.length === 0 && vtBatch.queue.length === 0)
                dispatch(vtBatchReset());
            return;
        }

        const tasksToStart: IMediaInfo[] = toStartIds
            .map((id: string): IMediaInfo | undefined =>
                currentVTTask.find((task: IMediaInfo): boolean => task.id === id))
            .filter((task: IMediaInfo | undefined): task is IMediaInfo => !!task);

        if (tasksToStart.length < 1)
            return;

        tasksToStart.forEach((task: IMediaInfo): void => {
            sendIpcMessage('main:on:task-create:video-media-transform', task);
            dispatch(updateCurrentVTTaskItem({
                id: task.id,
                changes: {
                    status: 'processing',
                    progress: task.progress ?? 0
                }
            }));
        });

        dispatch(vtBatchMarkRunning(toStartIds));
    }, [vtBatch, currentVTTask, parallelTasks, dispatch]);

    const codecSelect = useMemo((): React.JSX.Element => {
        // 根据当前批量格式限制可选的编码器
        let allowedCodecValues: string[] | void | null = null;

        if (batchFormat) {
            const currentFormat: IFormatType | void = videoFormatType.find(
                (item: IFormatType): boolean => item.name === batchFormat
            );

            allowedCodecValues = currentFormat?.supportedCodecs;
        }

        const options = allowedCodecValues
            ? codecOptions.filter((item) => allowedCodecValues?.includes(item.value))
            : codecOptions;

        return (
            <Select
                value={batchCodec}
                disabled={!hasTask}
                onChange={(_, data): void => {
                    handleBatchCodecChange(data.value);
                }}
            >
                {
                    options.map((item): React.JSX.Element => {
                        return (
                            <option
                                key={item.value}
                                value={item.value}
                            >
                                {t(item.label)}
                            </option>
                        );
                    })
                }
            </Select>
        );
    }, [batchCodec, batchFormat, hasTask, t]);

    // 计算批量分辨率选项（取所有任务中的最小分辨率作为上限）
    const batchResolutionOptions = useMemo(() => {
        if (!hasTask || currentVTTask.length === 0) {
            return [];
        }

        // 获取所有任务的原始分辨率，取最小值作为上限
        let minWidth: number = Infinity;
        let minHeight: number = Infinity;

        currentVTTask.forEach((task: IMediaInfo): void => {
            if (task.mediaInfo && task.mediaInfo.streams) {
                const videoStream = task.mediaInfo.streams.find(
                    (stream) => stream.codec_type === 'video'
                );

                if (videoStream) {
                    const width: number = videoStream.width || 0;
                    const height: number = videoStream.height || 0;

                    if (width > 0 && height > 0) {
                        minWidth = Math.min(minWidth, width);
                        minHeight = Math.min(minHeight, height);
                    }
                }
            }
        });

        // 如果无法获取有效分辨率，返回空数组
        if (minWidth === Infinity || minHeight === Infinity)
            return [];

        // 返回基于最小分辨率的可用分辨率列表
        return getAvailableResolutions(minWidth, minHeight);
    }, [currentVTTask, hasTask]);

    return (
        <BaseTaskListFooter
            batch={vtBatch}
            surface={
                <div className={'app_flex_box'}>
                    <div className={'task-list-footer-item'}>
                        <span>{t('mediaFile.outPutFormat')}：</span>
                        <TaskFormats
                            type={'video'}
                            value={batchFormat}
                            disabled={!hasTask}
                            onChange={(format): void => {
                                handleBatchFormatChange(format.name);
                            }}
                        />
                    </div>
                    <div className={'task-list-footer-item'}>
                        <span>{t('mediaFile.codec')}：</span>
                        {codecSelect}
                    </div>
                    <div className={'task-list-footer-item'}>
                        <span>{t('mediaFile.resolution')}：</span>
                        <Select
                            value={batchResolution}
                            disabled={!hasTask || batchResolutionOptions.length === 0}
                            onChange={(_, data): void => {
                                handleBatchResolutionChange(data.value);
                            }}
                        >
                            {
                                batchResolutionOptions.map((item): React.JSX.Element => {
                                    return (
                                        <option
                                            key={item.value}
                                            value={item.value}
                                        >
                                            {t(item.label)}
                                        </option>
                                    );
                                })
                            }
                        </Select>
                    </div>
                </div>
            }
            onStartAll={handleStartAll}
            onStopAll={handleStopAll}
        />
    );
};

export default VTTaskListFooter;
