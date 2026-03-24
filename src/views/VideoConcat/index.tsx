import * as React from "react";
import DropFiles from "../../components/DropFiles";
import AddMediaFiles from "../../components/AddMediaFiles";
import VMTaskList from "../../components/Task/VMTaskList";
import VMTaskListFooter from "../../components/Task/VMTaskListFooter";
import YExtendTemplate from "../../components/YExtendTemplate";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";
import {generateMediaFileId} from "../../utils";
import {useDispatch, useSelector} from "react-redux";
import {appendCurrentVcTask, clearCurrentVcTask} from "../../store/VideoConcatStore";
import {RootState} from "../../store";

const VideoConcat: React.FC = (): React.JSX.Element => {
    const dispatch = useDispatch();
    const currentVcTask: IMediaInfo[] = useSelector((state: RootState) => state.videoConcat.currentVcTask);

    useMainEventListener<string[]>('window:on:select-media-file', (data: string[]): void => {
        sendIpcMessage('main:on:get-media-info', generateMediaFileId(data));
    });

    useMainEventListener<IMediaInfo[]>('main:on:media-info', (data: IMediaInfo[]): void => {
        const filtered: IMediaInfo[] = data.filter((i: IMediaInfo): boolean => i.isVideo);

        dispatch(appendCurrentVcTask(filtered));
    });

    return (
        <div className="router-view">
            <AddMediaFiles
                showClearAll={currentVcTask.length > 0}
                onClearAll={(): void => {
                    void dispatch(clearCurrentVcTask());
                }}
            />
            <YExtendTemplate show={currentVcTask.length < 1}>
                <DropFiles/>
            </YExtendTemplate>
            <YExtendTemplate show={currentVcTask.length > 0}>
                <VMTaskList/>
            </YExtendTemplate>
            <YExtendTemplate show={currentVcTask.length > 0}>
                <VMTaskListFooter/>
            </YExtendTemplate>
        </div>
    );
};

export default VideoConcat;
