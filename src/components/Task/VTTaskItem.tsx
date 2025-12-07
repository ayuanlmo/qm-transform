import * as React from "react";
import {useRef} from "react";
import {Button, Checkbox, Tag, Text} from "@fluentui/react-components";
import YExtendTemplate from "../YExtendTemplate";
import {sendIpcMessage} from "../../bin/IPC";
import {useTranslation} from "react-i18next";
import TaskFormats from "./TaskFormats";
import VTOptions, {IVTOptionsRef} from "../VT/VTOptions";
import {useDispatch, useSelector} from "react-redux";
import {removeCurrentVTTaskItem, updateCurrentVTTaskItem} from "../../store/AppStore";
import {useMainEventListener} from "../../bin/Hooks";
import {RootState} from "../../store";
import Dialog from "../FluentTemplates/Dialog";
import BaseTaskItem from "./BaseTaskItem";

export interface VTTaskItemProps {
    data: IMediaInfo;
}

const VTTaskItem: React.FC<VTTaskItemProps> = (props: VTTaskItemProps): React.JSX.Element => {
    const {data} = props;
    const {t} = useTranslation();
    const vTOptionsRef = useRef<IVTOptionsRef>(null);
    const dispatch = useDispatch();
    const [noAudioDialogOpen, setNoAudioDialogOpen] = React.useState(false);

    // 确保始终拿到 Redux 中该任务的最新数据
    const latestData: IMediaInfo = useSelector((state: RootState): IMediaInfo =>
        state.app.currentVTTask.find((item: IMediaInfo): boolean => item.id === data.id) || data
    );

    const isProcessing: boolean = latestData.status === 'processing';

    const handleTaskUpdate = (changes: Partial<IMediaInfo>): void => {
        dispatch(updateCurrentVTTaskItem({
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
                dispatch(removeCurrentVTTaskItem(data.id));
                return;
            }

            handleTaskUpdate({
                progress: event.progress,
                status: event.progress >= 100 ? 'complete' : 'processing'
            });
        }
    );

    const headerTags: React.JSX.Element = <React.Fragment>
        <YExtendTemplate show={latestData.isH264}>
            <Tag selected size={"extra-small"}>h264</Tag>
        </YExtendTemplate>
        <YExtendTemplate show={latestData.isH265}>
            <Tag selected size={"extra-small"}>h265</Tag>
        </YExtendTemplate>
    </React.Fragment>;
    const infoBlock: React.JSX.Element = <div>
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
            {t('mediaFile.resolution')}：
            {latestData.videoParams.width}
            *
            {latestData.videoParams.height}
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
                    type={latestData.isVideo ? 'video' : 'audio'}
                    value={latestData.optFormat}
                    disabled={isProcessing}
                    onChange={(format) => {
                        handleTaskUpdate({
                            optFormat: format.name
                        });
                    }}
                />
            </div>
        </Text>
        <Text
            size={400}
            className={'task-item-media-info-text task-item-media-info-sub-item'}
            truncate
        >
            {t('mediaFile.resolution')}：
            {latestData.videoParams.width}
            *
            {latestData.videoParams.height}
        </Text>
    </div>;
    const optionsBlock: React.JSX.Element = <Checkbox
        label={t('mediaFile.noAudio')}
        checked={!!latestData.noAudio}
        disabled={isProcessing}
        onChange={(_, {checked}): void => {
            // 只在从 false -> true 时弹出确认框
            if (checked && !latestData.noAudio)
                return void setNoAudioDialogOpen(true);

            handleTaskUpdate({
                noAudio: !!checked
            });
        }}
    />;
    const extraDialogs: React.JSX.Element = <Dialog
        open={noAudioDialogOpen}
        title={t('mediaFile.noAudioConfirmTitle')}
        surface={
            <Text>
                {t('mediaFile.noAudioConfirmMessage')}
            </Text>
        }
        footer={
            <Button
                appearance="primary"
                onClick={(): void => {
                    handleTaskUpdate({
                        noAudio: true
                    });
                    setNoAudioDialogOpen(false);
                }}
            >
                {t('confirm')}
            </Button>
        }
        footerCloseTriggerLabel={t('cancel')}
        onClose={(): void => setNoAudioDialogOpen(false)}
    />;

    return (
        <>
            <VTOptions
                ref={vTOptionsRef}
                mediaInfo={latestData}
                onUpdate={handleTaskUpdate}
            />
            <BaseTaskItem
                data={latestData}
                isProcessing={isProcessing}
                onPlay={play}
                onRemove={() => dispatch(removeCurrentVTTaskItem(data.id))}
                onStart={(): void => sendIpcMessage('main:on:task-create:video-media-transform', latestData)}
                onOpenSettings={(): void => vTOptionsRef.current?.open()}
                headerTags={headerTags}
                infoBlock={infoBlock}
                optionsBlock={optionsBlock}
                extraDialogs={extraDialogs}
                startLabel={t('mediaFile.options.startProcessing')}
                inProgressLabel={t('mediaFile.options.inProgress')}
            />
        </>
    );
};

export default VTTaskItem;
