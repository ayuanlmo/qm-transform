import * as React from "react";
import DropFiles from "../../components/DropFiles";
import AddMediaFiles from "../../components/AddMediaFiles";
import TaskList from "../../components/Task/TaskList";
import YExtendTemplate from "../../components/YExtendTemplate";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";
import {generateMediaFileId} from "../../utils";
import {useDispatch, useSelector} from "react-redux";
import {clearCurrentVTTask, setCurrentVTTask} from "../../store/AppStore";
import {RootState} from "../../store";

const VideoTransform: React.FC = (): React.JSX.Element => {
    const dispatch = useDispatch();
    const currentVTTask = useSelector((state: RootState) => state.app.currentVTTask);

    useMainEventListener<string[]>('window:on:select-media-file', (data) => {
        sendIpcMessage('main:on:get-media-info', generateMediaFileId(data));
    });

    useMainEventListener<IMediaInfo[]>('main:on:media-info', (data) => {
        const _data: IMediaInfo[] = data.filter(i => i.isVideo);

        dispatch(setCurrentVTTask(_data));
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
                <TaskList task={currentVTTask}/>
            </YExtendTemplate>
        </div>
    );
};

export default VideoTransform;
