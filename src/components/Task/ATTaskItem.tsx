import * as React from "react";
import {useRef} from "react";
import {Text} from "@fluentui/react-components";
import {sendIpcMessage} from "../../bin/IPC";
import {useTranslation} from "react-i18next";
import TaskFormats from "./TaskFormats";
import ATOptions, {IATOptionsRef} from "../AT/ATOptions";
import {useDispatch, useSelector} from "react-redux";
import {removeCurrentATTaskItem, updateCurrentATTaskItem} from "../../store/ATTStore";
import {useMainEventListener} from "../../bin/Hooks";
import {RootState} from "../../store";
import BaseTaskItem from "./BaseTaskItem";
import {audioFormatType, IFormatType} from "../../const/formatType";

export interface ATTaskItemProps {
    data: IMediaInfo;
}

const ATTaskItem: React.FC<ATTaskItemProps> = (props: ATTaskItemProps): React.JSX.Element => {
    const {data} = props;
    const {t} = useTranslation();
    const aTOptionsRef = useRef<IATOptionsRef>(null);
    const dispatch = useDispatch();

    // 确保始终拿到 Redux 中该任务的最新数据
    const latestData: IMediaInfo = useSelector((state: RootState): IMediaInfo =>
        state.att.currentATTask.find((item: IMediaInfo): boolean => item.id === data.id) || data
    );

    const isProcessing: boolean = latestData.status === 'processing' || latestData.status === 'paused';

    const handleTaskUpdate = (changes: Partial<IMediaInfo>): void => {
        dispatch(updateCurrentATTaskItem({
            id: data.id,
            changes
        }));
    };
    const play = (): void => {
        sendIpcMessage('main:on:player', latestData.fullPath);
    };

    useMainEventListener<{ id: string; progress: number }>(
        'main:on:media-transform-progress',
        (event): void => {
            if (event.id !== data.id)
                return;

            if (event.progress >= 100) {
                dispatch(removeCurrentATTaskItem(data.id));
                return;
            }

            // 如果任务当前是暂停状态，只更新进度，不更新状态
            const currentStatus = latestData.status;

            handleTaskUpdate({
                progress: event.progress,
                status: currentStatus === 'paused' ? 'paused' : event.progress >= 100 ? 'complete' : 'processing'
            });
        }
    );

    useMainEventListener<{ id: string }>('main:on:task-paused', (event): void => {
        if (event.id !== data.id) return;
        handleTaskUpdate({status: 'paused'});
    });

    useMainEventListener<{ id: string }>('main:on:task-resumed', (event): void => {
        if (event.id !== data.id) return;
        handleTaskUpdate({status: 'processing'});
    });

    const infoBlock: React.JSX.Element = <div style={{
        marginTop: '3rem'
    }}>
        <Text
            size={400}
            className={'task-item-media-info-text task-item-media-info-sub-item'}
            truncate
        >
            {t('mediaFile.format')}：{latestData.format}
        </Text>
        <Text
            size={400}
            className={'task-item-media-info-text task-item-media-info-sub-item'}
            truncate
        >
            {t('mediaFile.bitRate')}：{latestData.audioParams.bitrate || t('notAvailable')}
        </Text>
        <Text
            size={400}
            className={'task-item-media-info-text task-item-media-info-sub-item'}
            truncate
        >
            {t('mediaFile.samplingRate')}：{latestData.audioParams.sampleRate ? `${latestData.audioParams.sampleRate} Hz` : t('notAvailable')}
        </Text>
        <svg className={'task-item-media-info-sub-item'} xmlns="http://www.w3.org/2000/svg"
             width="14" height="10" viewBox="0 0 14 10"
             fill="none">
            <path
                d="M13.8174 4.63921L8.21739 0.15467C7.97391 -0.0515159 7.6087 -0.0515159 7.36522 0.15467C7.12174 0.360855 7.12174 0.670134 7.36522 0.876319L11.8696 4.48457H0.608696C0.243478 4.48457 0 4.69075 0 5.00003C0 5.30931 0.243478 5.5155 0.608696 5.5155H11.8696L7.36522 9.12374C7.12174 9.32993 7.12174 9.63921 7.36522 9.84539C7.48696 9.94848 7.66957 10 7.7913 10C7.91304 10 8.09565 9.94848 8.21739 9.84539L13.8174 5.36086C13.9391 5.25776 14 5.10312 14 5.00003C14 4.89694 13.9391 4.7423 13.8174 4.63921Z"
                fill="#999999"/>
        </svg>
        <Text
            size={400}
            className={'task-item-media-info-text task-item-media-info-sub-item'}
            truncate
        >
            <div style={{display: 'inline-block'}}>
                <TaskFormats
                    type={latestData.isAudio ? 'audio' : 'video'}
                    value={latestData.optFormat}
                    disabled={isProcessing}
                    onChange={(format: IFormatType) => {
                        const newFormat: IFormatType | undefined = audioFormatType.find(
                            (item: IFormatType): boolean => item.name === format.name
                        );
                        const supportedCodecs: string[] | undefined = newFormat?.supportedCodecs;
                        const currentCodec: string | undefined = latestData.audioParams?.codec;

                        // 如果当前编码器不支持新格式，切换到第一个支持的编码器
                        let nextCodec: string | undefined = currentCodec;

                        if (supportedCodecs && supportedCodecs.length > 0) {
                            if (!currentCodec || !supportedCodecs.includes(currentCodec)) {
                                nextCodec = supportedCodecs[0];
                            }
                        }

                        handleTaskUpdate({
                            optFormat: format.name,
                            audioParams: {
                                ...latestData.audioParams,
                                codec: nextCodec
                            }
                        });
                    }}
                />
            </div>
        </Text>
    </div>;

    return (
        <>
            <ATOptions
                ref={aTOptionsRef}
                mediaInfo={latestData}
                onUpdate={handleTaskUpdate}
            />
            <BaseTaskItem
                data={latestData}
                isProcessing={isProcessing}
                onPlay={play}
                onRemove={() => dispatch(removeCurrentATTaskItem(data.id))}
                onStart={(): void => {
                    // 更新任务状态为处理中
                    handleTaskUpdate({
                        status: 'processing',
                        progress: latestData.progress ?? 0
                    });
                    sendIpcMessage('main:on:task-create:audio-media-transform', latestData);
                }}
                onPause={(): void => {
                    sendIpcMessage('main:on:task-pause', data.id);
                }}
                onResume={(): void => {
                    sendIpcMessage('main:on:task-resume', data.id);
                }}
                onOpenSettings={(): void => aTOptionsRef.current?.open()}
                infoBlock={infoBlock}
                startLabel={t('mediaFile.options.startProcessing')}
                inProgressLabel={t('mediaFile.options.inProgress')}
                pauseLabel={t('mediaFile.options.pause')}
                resumeLabel={t('mediaFile.options.resume')}
            />
        </>
    );
};

export default ATTaskItem;

