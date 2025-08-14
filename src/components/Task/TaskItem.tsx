import * as React from "react";
import {useRef} from "react";
import {LauncherSettings24Regular} from "@fluentui/react-icons";
import {Button, Card, Checkbox, ListItem, ProgressBar, Tag, Text} from "@fluentui/react-components";
import YExtendTemplate from "../YExtendTemplate";
import {sendIpcMessage} from "../../bin/IPC";
import {useTranslation} from "react-i18next";
import TaskFormats from "./TaskFormats";
import VTOptions, {IVTOptionsRef} from "../VT/VTOptions";

export interface TaskItemProps {
    data: IMediaInfo;
}

const TaskItem: React.FC<TaskItemProps> = (props: TaskItemProps): React.JSX.Element => {
    const {data} = props;
    const {t} = useTranslation();
    const vTOptionsRef = useRef<IVTOptionsRef>(null);

    const play = () => {
        sendIpcMessage('main:on:player', data.fullPath);
    };

    return (
        <ListItem className={"task-item"}>
            <Card>
                <div className={'task-item-content app_flex_box'}>
                    <div className={'task-item-content-cover app_cursor_pointer'}>
                        <img onClick={play} src={data.cover} alt="cover"/>
                    </div>
                    <VTOptions ref={vTOptionsRef} mediaInfo={data}/>
                    <div className={'task-item-media-info app_position_relative'}>
                        <div className={'task-item-media-info-remove app_position_absolute'}>
                            <svg className={'app_cursor_pointer'} xmlns="http://www.w3.org/2000/svg" width="10"
                                 height="10" viewBox="0 0 10 10"
                                 fill="none">
                                <path
                                    d="M1.05678 0.181473L4.99966 4.12366L8.94254 0.181473C9.04923 0.0748006 9.19117 0.0107198 9.34174 0.0012524C9.49231 -0.00821505 9.64116 0.0375814 9.76036 0.13005L9.8186 0.181473C9.93475 0.297655 10 0.455212 10 0.619494C10 0.783776 9.93475 0.941332 9.8186 1.05751L5.87572 5.00033L9.8186 8.94314C9.92972 9.05463 9.99423 9.20424 9.99903 9.36157C10.0038 9.5189 9.94858 9.67217 9.84447 9.79023C9.74036 9.9083 9.59522 9.98231 9.43852 9.99724C9.28182 10.0122 9.12531 9.96689 9.00078 9.8706L8.94254 9.81918L4.99966 5.87637L1.05678 9.81918L0.998542 9.8706C0.874015 9.96689 0.717508 10.0122 0.560807 9.99724C0.404106 9.98231 0.258962 9.9083 0.154855 9.79023C0.050748 9.67217 -0.0045155 9.5189 0.000288928 9.36157C0.00509336 9.20424 0.0696055 9.05463 0.180722 8.94314L4.12298 5.00033L0.180722 1.05751C0.0678645 0.940667 0.00541633 0.784167 0.00682796 0.621723C0.00823959 0.45928 0.073398 0.303889 0.18827 0.18902C0.303141 0.0741501 0.458534 0.00899287 0.620981 0.00758127C0.783428 0.00616966 0.93993 0.0686167 1.05678 0.181473Z"
                                    fill="#7A7B9E"/>
                            </svg>
                        </div>
                        <div className={'task-item-media-info-name'}>
                            <YExtendTemplate show={data.isH264}>
                                <Tag selected size={"extra-small"}>h264</Tag>
                            </YExtendTemplate>
                            <YExtendTemplate show={data.isH265}>
                                <Tag selected size={"extra-small"}>h265</Tag>
                            </YExtendTemplate>
                            <Text
                                size={400}
                                className={'task-item-media-info-text app_position_absolute'}
                                truncate
                            >
                                {data.baseName}
                            </Text>
                        </div>
                        <div className={'task-item-media-info-sub'}>
                            <div>
                                <Text
                                    size={400}
                                    className={'task-item-media-info-text task-item-media-info-sub-item'}
                                    truncate
                                >
                                    {t('mediaFile.format')}：{data.format}
                                </Text>
                                <Text
                                    size={400}
                                    className={'task-item-media-info-text task-item-media-info-sub-item'}
                                    truncate
                                >
                                    {t('mediaFile.resolution')}：2560 * 1440
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
                                            type={data.isVideo ? 'video' : 'audio'}
                                            isH264={data.isH264}
                                            isH265={data.isH265}
                                        />
                                    </div>
                                </Text>
                                <Text
                                    size={400}
                                    className={'task-item-media-info-text task-item-media-info-sub-item'}
                                    truncate
                                >
                                    分辨率：2560 * 1440
                                </Text>
                            </div>
                        </div>
                        <div className={'task-item-media-info-options'}>
                            <Checkbox label={t('mediaFile.noAudio')}/>
                        </div>
                        <div className={'task-item-media-info-progress-bar app_position_absolute'}>
                            <ProgressBar value={0}/>
                        </div>
                    </div>
                    <div className={'task-item-option app_position_absolute app_flex_box'}>
                        <div className={'task-item-option-setting'}>
                            <LauncherSettings24Regular
                                className={'app_cursor_pointer'}
                                onClick={(): void => {
                                    vTOptionsRef.current?.open();
                                }}
                            />
                        </div>
                        <div>
                            <Button appearance="primary">
                                {t('mediaFile.options.startProcessing')}
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </ListItem>
    );
};

export default TaskItem;
