import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface IATBatchState {
    status: 'idle' | 'running' | 'paused' | 'stopping';
    queue: string[];
    running: string[];
}

export interface IATTStore {
    currentATTask: IMediaInfo[];
    atBatch: IATBatchState;
}

const initialState: IATTStore = {
    currentATTask: [],
    atBatch: {
        status: 'idle',
        queue: [],
        running: []
    }
};

const ATTStore = createSlice({
    name: 'att',
    initialState,
    reducers: {
        // 添加任务
        appendCurrentATTask: (state, {payload}: PayloadAction<IMediaInfo[]>): void => {
            const existedIds: Set<string> = new Set(state.currentATTask.map(item => item.id));

            // 统一设置默认状态，方便批量处理调度
            const normalized: IMediaInfo[] = payload.map((item: IMediaInfo): IMediaInfo => ({
                ...item,
                status: item.status ?? 'ready',
                progress: item.progress ?? 0
            }));

            state.currentATTask = [
                ...state.currentATTask,
                ...normalized.filter(({id}: IMediaInfo): boolean => !existedIds.has(id))
            ];
        },
        // 移除任务
        removeCurrentATTaskItem: (state, {payload}: PayloadAction<string>): void => {
            state.currentATTask = state.currentATTask.filter(({id}: IMediaInfo): boolean => id !== payload);
        },
        // 更新任务
        updateCurrentATTaskItem: (state, {payload}: PayloadAction<{
            id: string;
            changes: Partial<IMediaInfo>
        }>): void => {
            const {id, changes} = payload;
            const targetIndex: number = state.currentATTask.findIndex((item): boolean => item.id === id);

            if (targetIndex === -1) return;

            const target = state.currentATTask[targetIndex];
            const next: IMediaInfo = {
                ...target,
                ...changes
            };

            if (changes.audioParams) {
                next.audioParams = {
                    ...target.audioParams,
                    ...changes.audioParams
                };
            }

            state.currentATTask[targetIndex] = next;
        },
        // 清除所有任务
        clearCurrentATTask: (state) => {
            return {
                ...state,
                currentATTask: [],
                atBatch: {
                    status: 'idle',
                    queue: [],
                    running: []
                }
            };
        },
        // 批量运行任务
        atBatchStart: (state, {payload}: PayloadAction<string[]>): void => {
            state.atBatch.status = payload.length > 0 ? 'running' : 'idle';
            state.atBatch.queue = [...payload];
            state.atBatch.running = [];
        },
        // 标记任务运行状态
        atBatchMarkRunning: (state, {payload}: PayloadAction<string[]>): void => {
            const toStartIds: string[] = payload;

            state.atBatch.running.push(...toStartIds);
            state.atBatch.queue = state.atBatch.queue.filter((id: string): boolean => !toStartIds.includes(id));
        },
        // 标记完成状态
        atBatchTaskFinished: (state, {payload}: PayloadAction<string>): void => {
            const id: string = payload;

            state.atBatch.running = state.atBatch.running.filter((rid: string): boolean => rid !== id);
            state.atBatch.queue = state.atBatch.queue.filter((qid: string): boolean => qid !== id);

            if (state.atBatch.running.length === 0 && state.atBatch.queue.length === 0)
                state.atBatch.status = 'idle';
        },
        // 批量停止所有任务
        atBatchStop: (state): void => {
            if (state.atBatch.status !== 'idle')
                state.atBatch.status = 'stopping';
        },
        // 批量重置任务
        atBatchReset: (state): void => {
            state.atBatch = {
                status: 'idle',
                queue: [],
                running: []
            };
        }
    }
});

export const {
    appendCurrentATTask,
    updateCurrentATTaskItem,
    removeCurrentATTaskItem,
    clearCurrentATTask,
    atBatchStart,
    atBatchMarkRunning,
    atBatchTaskFinished,
    atBatchStop,
    atBatchReset
} = ATTStore.actions;

export default ATTStore.reducer;

