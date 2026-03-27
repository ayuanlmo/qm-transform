import React, {useEffect, useMemo} from "react";
import {Button, ProgressBar, Select, Text} from "@fluentui/react-components";
import TaskFormats from "../Task/TaskFormats";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {
    clearCurrentVcTask,
    setVcConcatProgress,
    updateVcOptions,
    vcBatchMarkRunning,
    vcBatchPause,
    vcBatchResume,
    vcBatchStart,
    vcBatchStop
} from "../../store/VideoConcatStore";
import {sendIpcMessage} from "../../bin/IPC";
import {useMainEventListener} from "../../bin/Hooks";
import {getAvailableResolutions} from "../VT/const";
import {codecOptions} from "../VT/const";
import {IFormatType, videoFormatType} from "../../const/formatType";
import {getUUID} from "../../utils";

const CONCAT_CODEC_OPTIONS = codecOptions.filter((opt): boolean => ['h264', 'hevc'].includes(opt.value));

const VMTaskListFooter: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const dispatch = useDispatch();
    const currentVcTask: IMediaInfo[] = useSelector((state: RootState): IMediaInfo[] => state.videoConcat.currentVcTask);
    const vcBatch = useSelector((state: RootState) => state.videoConcat.vcBatch);
    const vcOptions = useSelector((state: RootState) => state.videoConcat.vcOptions);

    const hasTask: boolean = currentVcTask.length >= 2;
    const isRunning: boolean = vcBatch.status === 'running' || vcBatch.status === 'paused';
    const isPaused: boolean = vcBatch.status === 'paused';
    const vcConcatProgress: number = useSelector((state: RootState): number => state.videoConcat.vcConcatProgress);

    const handleFormatChange = (formatName: string): void => {
        dispatch(updateVcOptions({optFormat: formatName}));

        const fmt: IFormatType | undefined = videoFormatType.find((f): boolean => f.name === formatName);

        if (fmt?.supportedCodecs && !fmt.supportedCodecs.includes(vcOptions.codec)) {
            const first = fmt.supportedCodecs.find((c): boolean => ['h264', 'hevc'].includes(c));

            if (first) dispatch(updateVcOptions({codec: first}));
        }
    };

    const codecSelectOptions = useMemo((): typeof CONCAT_CODEC_OPTIONS => {
        const fmt = videoFormatType.find((f): boolean => f.name === vcOptions.optFormat);

        if (fmt?.supportedCodecs) {
            return CONCAT_CODEC_OPTIONS.filter((opt): boolean => fmt.supportedCodecs!.includes(opt.value));
        }
        return CONCAT_CODEC_OPTIONS;
    }, [vcOptions.optFormat]);

    const resolutionOptions = useMemo((): { width: number; height: number; value: string; label: string }[] => {
        if (!hasTask || currentVcTask.length === 0) return [];

        let minWidth: number = Infinity;
        let minHeight: number = Infinity;

        currentVcTask.forEach((task: IMediaInfo): void => {
            const w = task.videoParams?.originWidth || 0;
            const h = task.videoParams?.originHeight || 0;

            if (w > 0 && h > 0) {
                minWidth = Math.min(minWidth, w);
                minHeight = Math.min(minHeight, h);
            }
        });

        if (minWidth === Infinity || minHeight === Infinity) return [];
        return getAvailableResolutions(minWidth, minHeight);
    }, [currentVcTask, hasTask]);

    useEffect((): void => {
        if (resolutionOptions.length > 0 && !resolutionOptions.some((r): boolean => r.value === vcOptions.resolution)) {
            dispatch(updateVcOptions({resolution: resolutionOptions[0].value}));
        }
    }, [resolutionOptions, vcOptions.resolution, dispatch]);

    const handleStartMerge = (): void => {
        if (!hasTask) return;

        const concatTaskId = `concat-${getUUID()}`;

        dispatch(vcBatchStart([concatTaskId]));
        dispatch(vcBatchMarkRunning([concatTaskId]));

        let minW = Infinity;
        let minH = Infinity;

        currentVcTask.forEach((t): void => {
            const w = t.videoParams?.originWidth || 0;
            const h = t.videoParams?.originHeight || 0;

            if (w > 0 && h > 0) {
                minW = Math.min(minW, w);
                minH = Math.min(minH, h);
            }
        });

        if (minW === Infinity) minW = 1920;
        if (minH === Infinity) minH = 1080;

        const targetResolution = resolutionOptions.find((r): boolean => r.value === vcOptions.resolution);
        const width = targetResolution?.width ?? minW;
        const height = targetResolution?.height ?? minH;

        sendIpcMessage('main:on:task-create:video-concat', {
            concatTaskId,
            items: currentVcTask,
            options: {
                optFormat: vcOptions.optFormat,
                codec: vcOptions.codec,
                width,
                height
            }
        });
    };

    const handlePause = (): void => {
        if (vcBatch.running.length > 0) {
            sendIpcMessage('main:on:task-pause', vcBatch.running[0]);
            dispatch(vcBatchPause());
        }
    };

    const handleResume = (): void => {
        if (vcBatch.running.length > 0) {
            sendIpcMessage('main:on:task-resume', vcBatch.running[0]);
            dispatch(vcBatchResume());
        }
    };

    const handleStop = (): void => {
        if (vcBatch.running.length > 0) {
            sendIpcMessage('main:on:task-pause', vcBatch.running[0]);
        }
        dispatch(vcBatchStop());
        dispatch(vcBatchPause());
    };

    useMainEventListener<{ id: string; progress: number }>('main:on:video-concat-progress', ({id, progress}): void => {
        if (id.startsWith('concat-')) {
            dispatch(setVcConcatProgress(progress));
        }
    });

    useMainEventListener<{ id: string }>('main:on:task-end', ({id}): void => {
        if (id.startsWith('concat-')) {
            dispatch(setVcConcatProgress(0));
            dispatch(clearCurrentVcTask());
        }
    });

    return (
        <div className="task-list-footer vc-task-list-footer">
            <div className="task-list-footer-content app_flex_box">
                <div className="app_flex_box">
                    <div className="task-list-footer-item">
                        <span>{t('mediaFile.outPutFormat')}：</span>
                        <TaskFormats
                            type="video"
                            value={vcOptions.optFormat}
                            disabled={!hasTask}
                            onChange={(format): void => handleFormatChange(format.name)}
                        />
                    </div>
                    <div className="task-list-footer-item">
                        <span>{t('mediaFile.codec')}：</span>
                        <Select
                            value={vcOptions.codec}
                            disabled={!hasTask}
                            onChange={(_, data): void => {
                                void dispatch(updateVcOptions({codec: data.value}));
                            }}
                        >
                            {codecSelectOptions.map((item): React.JSX.Element =>
                                <option key={item.value} value={item.value}>
                                    {t(item.label)}
                                </option>
                            )}
                        </Select>
                    </div>
                    <div className="task-list-footer-item">
                        <span>{t('mediaFile.resolution')}：</span>
                        <Select
                            value={vcOptions.resolution}
                            disabled={!hasTask || resolutionOptions.length === 0}
                            onChange={(_, data): void => {
                                void dispatch(updateVcOptions({resolution: data.value}));
                            }}
                        >
                            {resolutionOptions.map((item): React.JSX.Element =>
                                <option key={item.value} value={item.value}>
                                    {t(item.label)}
                                </option>
                            )}
                        </Select>
                    </div>
                </div>

                <div className="task-list-footer-actions">
                    {!hasTask &&
                        <Text size={200} className="task-list-footer-status" style={{marginRight: 8}}>
                            {t('videoConcat.onlyOneVideo')}
                        </Text>
                    }
                    {isRunning &&
                        <Text size={200} className="task-list-footer-status" style={{marginRight: 8}}>
                            {t('mediaFile.options.batchRunning', {
                                current: 1,
                                total: 1
                            })}
                        </Text>
                    }
                    {isRunning ?
                        <>
                            <Button
                                appearance="primary"
                                onClick={isPaused ? handleResume : handlePause}
                            >
                                {isPaused ? t('videoConcat.resumeMerge') : t('videoConcat.pauseMerge')}
                            </Button>
                            <Button
                                appearance="secondary"
                                onClick={handleStop}
                                style={{marginLeft: 8}}
                            >
                                {t('mediaFile.options.stopAll')}
                            </Button>
                        </>
                        :
                        <Button
                            appearance="primary"
                            disabled={!hasTask}
                            onClick={handleStartMerge}
                        >
                            {t('videoConcat.startMerge')}
                        </Button>
                    }
                </div>
            </div>
            {isRunning &&
                <div className="vc-concat-progress-bar">
                    <ProgressBar
                        max={100}
                        thickness="large"
                        value={Math.min(100, Math.max(0, vcConcatProgress))}
                    />
                </div>
            }
        </div>
    );
};

export default VMTaskListFooter;
