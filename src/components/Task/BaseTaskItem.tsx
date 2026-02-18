import * as React from "react";
import {ListItem, Card, ProgressBar, Button, Spinner, Text, Tooltip} from "@fluentui/react-components";
import {LauncherSettings24Regular} from "@fluentui/react-icons";

export interface IBaseTaskItemProps {
    data: IMediaInfo;
    isProcessing: boolean;
    onPlay?: () => void;
    onRemove: () => void;
    onStart: () => void;
    onPause?: () => void;
    onResume?: () => void;
    onOpenSettings?: () => void;
    headerTags?: React.ReactNode;
    infoBlock: React.ReactNode;
    optionsBlock?: React.ReactNode;
    extraDialogs?: React.ReactNode;
    startLabel: string;
    inProgressLabel: string;
    pauseLabel?: string;
    resumeLabel?: string;
}

const BaseTaskItem: React.FC<IBaseTaskItemProps> = (props: IBaseTaskItemProps): React.JSX.Element => {
    const {
        data,
        isProcessing,
        onPlay,
        onRemove,
        onStart,
        onPause,
        onResume,
        onOpenSettings,
        headerTags,
        infoBlock,
        optionsBlock,
        extraDialogs,
        startLabel,
        inProgressLabel,
        pauseLabel,
        resumeLabel
    } = props;

    const isPaused: boolean = data.status === 'paused';
    const canPauseResume: boolean = isProcessing && !!(onPause || onResume);

    return (
        <ListItem className={"task-item"}>
            <Card>
                <div className={'task-item-content app_flex_box'}>
                    <div className={'task-item-content-cover app_cursor_pointer'}>
                        <img onClick={onPlay} src={data.cover} alt="cover"/>
                    </div>
                    <div className={'task-item-media-info app_position_relative'}>
                        <div
                            className={'task-item-media-info-remove app_position_absolute'}
                            onClick={(): void => {
                                if (isProcessing && !isPaused) return;
                                onRemove();
                            }}
                        >
                            <svg className={'app_cursor_pointer'} xmlns="http://www.w3.org/2000/svg" width="10"
                                 height="10" viewBox="0 0 10 10"
                                 fill="none">
                                <path
                                    d="M1.05678 0.181473L4.99966 4.12366L8.94254 0.181473C9.04923 0.0748006 9.19117 0.0107198 9.34174 0.0012524C9.49231 -0.00821505 9.64116 0.0375814 9.76036 0.13005L9.8186 0.181473C9.93475 0.297655 10 0.455212 10 0.619494C10 0.783776 9.93475 0.941332 9.8186 1.05751L5.87572 5.00033L9.8186 8.94314C9.92972 9.05463 9.99423 9.20424 9.99903 9.36157C10.0038 9.5189 9.94858 9.67217 9.84447 9.79023C9.74036 9.9083 9.59522 9.98231 9.43852 9.99724C9.28182 10.0122 9.12531 9.96689 9.00078 9.8706L8.94254 9.81918L4.99966 5.87637L1.05678 9.81918L0.998542 9.8706C0.874015 9.96689 0.717508 10.0122 0.560807 9.99724C0.404106 9.98231 0.258962 9.9083 0.154855 9.79023C0.050748 9.67217 -0.0045155 9.5189 0.000288928 9.36157C0.00509336 9.20424 0.0696055 9.05463 0.180722 8.94314L4.12298 5.00033L0.180722 1.05751C0.0678645 0.940667 0.00541633 0.784167 0.00682796 0.621723C0.00823959 0.45928 0.073398 0.303889 0.18827 0.18902C0.303141 0.0741501 0.458534 0.00899287 0.620981 0.00758127C0.783428 0.00616966 0.93993 0.0686167 1.05678 0.181473Z"
                                    fill="#7A7B9E"/>
                            </svg>
                        </div>
                        <div className={'task-item-media-info-name'}>
                            {headerTags}
                            <Tooltip
                                content={data.baseName}
                                relationship="label"
                                positioning="above-start"
                            >
                                <span className={'task-item-media-info-name-text'}>
                                    <Text
                                        size={400}
                                        className={'task-item-media-info-text'}
                                        truncate
                                        as="span"
                                    >
                                        {data.baseName}
                                    </Text>
                                </span>
                            </Tooltip>
                        </div>
                        <div className={'task-item-media-info-sub'}>
                            {infoBlock}
                        </div>
                        <div className={'task-item-media-info-options'}>
                            {optionsBlock}
                        </div>
                        <div className={'task-item-media-info-progress-bar app_position_absolute'}>
                            <ProgressBar
                                max={100}
                                value={Math.min(100, Math.max(0, data.progress ?? 0))}
                            />
                        </div>
                        <div className={'task-item-option app_position_absolute app_flex_box'}>
                            <div className={'task-item-option-setting'}>
                                {onOpenSettings && <LauncherSettings24Regular
                                    className={`app_cursor_pointer${isProcessing && !isPaused ? ' app_cursor_disabled' : ''}`}
                                    onClick={(): void => {
                                        if (isProcessing && !isPaused) return;
                                        onOpenSettings();
                                    }}
                                />
                                }
                            </div>
                            <div>
                                {canPauseResume ?
                                    <Button
                                        appearance="primary"
                                        icon={isPaused ? undefined : <Spinner size="tiny"/>}
                                        onClick={(): void => {
                                            if (isPaused && onResume) {
                                                onResume();
                                            } else if (!isPaused && onPause) {
                                                onPause();
                                            }
                                        }}
                                    >
                                        {isPaused ? resumeLabel || '继续' : pauseLabel || '暂停'}
                                    </Button>
                                    :
                                    <Button
                                        appearance="primary"
                                        disabled={isProcessing && !isPaused}
                                        icon={isProcessing && !isPaused ? <Spinner size="tiny"/> : undefined}
                                        onClick={(): void => {
                                            if (isProcessing && !isPaused) return;
                                            onStart();
                                        }}
                                    >
                                        {isProcessing && !isPaused ? inProgressLabel : startLabel}
                                    </Button>
                                }
                            </div>
                        </div>
                        {extraDialogs}
                    </div>
                </div>
            </Card>
        </ListItem>
    );
};

export default BaseTaskItem;


