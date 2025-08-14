import * as React from "react";
import {List} from "@fluentui/react-components";
import TaskItem from "./TaskItem";
import TaskOptions from "./TaskOptions";

export interface ITaskListProps {
    task: IMediaInfo[];
}

const TaskList: React.FC<ITaskListProps> = ({task}: ITaskListProps): React.JSX.Element => {
    return (
        <div style={{width: '100%'}}>
            <div className="task-list">
                {
                    task.map((item, index): React.JSX.Element =>
                        <List key={index}>
                            <TaskItem data={item}/>
                        </List>
                    )
                }
            </div>
            <TaskOptions/>
        </div>
    );
};

export default TaskList;
