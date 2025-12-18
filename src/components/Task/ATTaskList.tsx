import * as React from "react";
import {List} from "@fluentui/react-components";
import ATTaskItem from "./ATTaskItem";
import TaskOptions from "./TaskOptions";

export interface ITaskListProps {
    task: IMediaInfo[];
}

const ATTaskList: React.FC<ITaskListProps> = ({task}: ITaskListProps): React.JSX.Element => {
    return (
        <div style={{width: '100%'}}>
            <div className="task-list">
                {
                    task.map((item: IMediaInfo): React.JSX.Element =>
                        <List key={item.id}>
                            <ATTaskItem data={item}/>
                        </List>
                    )
                }
            </div>
            <TaskOptions/>
        </div>
    );
};

export default ATTaskList;

