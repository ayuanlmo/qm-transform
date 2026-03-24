import * as React from "react";
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent
} from "@dnd-kit/core";
import {arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy} from "@dnd-kit/sortable";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {reorderVcTask, removeCurrentVcTaskItem} from "../../store/VideoConcatStore";
import VMTaskItem from "./VMTaskItem";
import TaskOptions from "./TaskOptions";

const VMTaskList: React.FC = (): React.JSX.Element => {
    const dispatch = useDispatch();
    const currentVcTask: IMediaInfo[] = useSelector((state: RootState): IMediaInfo[] => state.videoConcat.currentVcTask);
    const vcBatch = useSelector((state: RootState) => state.videoConcat.vcBatch);
    const isProcessing: boolean = vcBatch.status === 'running' || vcBatch.status === 'paused';
    const vcConcatProgress: number = useSelector((state: RootState): number => state.videoConcat.vcConcatProgress);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates
        })
    );

    const handleDragEnd = (event: DragEndEvent): void => {
        const {active, over} = event;

        if (over && active.id !== over.id) {
            const oldIndex = currentVcTask.findIndex((item): boolean => item.id === active.id);
            const newIndex = currentVcTask.findIndex((item): boolean => item.id === over.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(currentVcTask, oldIndex, newIndex);

                dispatch(reorderVcTask(newOrder));
            }
        }
    };

    return (
        <div style={{width: '100%'}}>
            <div className="task-list vc-task-list">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <SortableContext
                        items={currentVcTask.map((item): string => item.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {currentVcTask.map((item: IMediaInfo): React.JSX.Element =>
                            <VMTaskItem
                                key={item.id}
                                data={item}
                                isProcessing={isProcessing}
                                concatProgress={vcConcatProgress}
                                onRemove={(): void => {
                                    void dispatch(removeCurrentVcTaskItem(item.id));
                                }}
                            />
                        )}
                    </SortableContext>
                </DndContext>
            </div>
            <TaskOptions />
        </div>
    );
};

export default VMTaskList;
