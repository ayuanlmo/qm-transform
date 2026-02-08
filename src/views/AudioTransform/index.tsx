import * as React from "react";
import DropFiles from "../../components/DropFiles";
import AddMediaFiles from "../../components/AddMediaFiles";
import ATTaskList from "../../components/Task/ATTaskList";
import YExtendTemplate from "../../components/YExtendTemplate";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";
import {generateMediaFileId} from "../../utils";
import {useDispatch, useSelector} from "react-redux";
import {appendCurrentATTask, clearCurrentATTask} from "../../store/ATTStore";
import {RootState} from "../../store";
import ATTaskListFooter from "../../components/Task/ATTaskListFooter";

const AudioTransform: React.FC = (): React.JSX.Element => {
    const dispatch = useDispatch();
    const currentATTask: IMediaInfo[] = useSelector((state: RootState) => state.att.currentATTask);

    useMainEventListener<string[]>('window:on:select-media-file', (data: string[]): void => {
        sendIpcMessage('main:on:get-media-info', generateMediaFileId(data));
    });

    useMainEventListener<IMediaInfo[]>('main:on:media-info', (data: IMediaInfo[]): void => {
        const _data: IMediaInfo[] = data.filter((i: IMediaInfo): boolean => i.isAudio);

        dispatch(appendCurrentATTask(_data));
    });

    return (
        <div className={'router-view'}>
            <AddMediaFiles
                showClearAll={currentATTask.length > 0}
                onClearAll={(): void => {
                    dispatch(clearCurrentATTask());
                }}
            />
            <YExtendTemplate show={currentATTask.length < 1}>
                <DropFiles/>
            </YExtendTemplate>
            <YExtendTemplate show={currentATTask.length > 0}>
                <ATTaskList task={currentATTask}/>
            </YExtendTemplate>
            <YExtendTemplate show={currentATTask.length > 0}>
                <ATTaskListFooter/>
            </YExtendTemplate>
        </div>
    );
};

export default AudioTransform;
