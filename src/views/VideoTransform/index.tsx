import * as React from "react";
import DropFiles from "../../components/DropFiles";
import AddMediaFiles from "../../components/AddMediaFiles";
import VtTaskList from "../../components/Task/VtTaskList";
import YExtendTemplate from "../../components/YExtendTemplate";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";
import {generateMediaFileId} from "../../utils";
import {useDispatch, useSelector} from "react-redux";
import {appendCurrentVTTask, clearCurrentVTTask} from "../../store/VTTStore";
import {RootState} from "../../store";
import VTTaskListFooter from "../../components/Task/VTTaskListFooter";

const VideoTransform: React.FC = (): React.JSX.Element => {
    const dispatch = useDispatch();
    const currentVTTask: IMediaInfo[] = useSelector((state: RootState) => state.vtt.currentVTTask);

    useMainEventListener<string[]>('window:on:select-media-file', (data: string[]): void => {
        sendIpcMessage('main:on:get-media-info', generateMediaFileId(data));
    });

    useMainEventListener<IMediaInfo[]>('main:on:media-info', (data: IMediaInfo[]): void => {
        const _data: IMediaInfo[] = data.filter((i: IMediaInfo): boolean => i.isVideo);

        dispatch(appendCurrentVTTask(_data));
    });

    return (
        <div className={'router-view'}>
            <AddMediaFiles
                showClearAll={currentVTTask.length > 0}
                onClearAll={(): void => {
                    dispatch(clearCurrentVTTask());
                }}
            />
            <YExtendTemplate show={currentVTTask.length < 1}>
                <DropFiles/>
            </YExtendTemplate>
            <YExtendTemplate show={currentVTTask.length > 0}>
                <VtTaskList task={currentVTTask}/>
            </YExtendTemplate>
            <YExtendTemplate show={currentVTTask.length > 0}>
                <VTTaskListFooter/>
            </YExtendTemplate>
        </div>
    );
};

export default VideoTransform;
