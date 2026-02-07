import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface IVTBatchState {
    status: 'idle' | 'running' | 'paused' | 'stopping';
    queue: string[];
    running: string[];
}

export interface IVTTStore {
    currentVTTask: IMediaInfo[];
    vtBatch: IVTBatchState;
}

const initialState: IVTTStore = {
    currentVTTask: [],
    vtBatch: {
        status: 'idle',
        queue: [],
        running: []
    }
};

const VTTStore = createSlice({
    name: 'vtt',
    initialState,
    reducers: {
        // 添加任务
        appendCurrentVTTask: (state, {payload}: PayloadAction<IMediaInfo[]>): void => {
            const existedIds: Set<string> = new Set(state.currentVTTask.map(item => item.id));

            // 统一设置默认状态，方便批量处理调度
            const normalized: IMediaInfo[] = payload.map((item: IMediaInfo): IMediaInfo => ({
                ...item,
                status: item.status ?? 'ready',
                progress: item.progress ?? 0,
                noAudio: item.noAudio ?? false
            }));

            state.currentVTTask = [
                ...state.currentVTTask,
                ...normalized.filter(({id}: IMediaInfo): boolean => !existedIds.has(id))
            ];
        },
        // 移除任务
        removeCurrentVTTaskItem: (state, {payload}: PayloadAction<string>): void => {
            state.currentVTTask = state.currentVTTask.filter(({id}: IMediaInfo): boolean => id !== payload);
        },
        // 更新任务
        updateCurrentVTTaskItem: (state, {payload}: PayloadAction<{
            id: string;
            changes: Partial<IMediaInfo>
        }>): void => {
            const {id, changes} = payload;
            const targetIndex: number = state.currentVTTask.findIndex((item): boolean => item.id === id);

            if (targetIndex === -1) return;

            const target = state.currentVTTask[targetIndex];
            const next: IMediaInfo = {
                ...target,
                ...changes
            };

            if (changes.videoParams) {
                next.videoParams = {
                    ...target.videoParams,
                    ...changes.videoParams
                };
            }

            if (changes.audioParams) {
                next.audioParams = {
                    ...target.audioParams,
                    ...changes.audioParams
                };
            }

            state.currentVTTask[targetIndex] = next;
        },
        // 清除所有任务
        clearCurrentVTTask: (state) => {
            return {
                ...state,
                currentVTTask: [],
                vtBatch: {
                    status: 'idle',
                    queue: [],
                    running: []
                }
            };
        },
        // 批量运行任务
        vtBatchStart: (state, {payload}: PayloadAction<string[]>): void => {
            state.vtBatch.status = payload.length > 0 ? 'running' : 'idle';
            state.vtBatch.queue = [...payload];
            state.vtBatch.running = [];
        },
        // 标记任务运行状态
        vtBatchMarkRunning: (state, {payload}: PayloadAction<string[]>): void => {
            const toStartIds: string[] = payload;

            state.vtBatch.running.push(...toStartIds);
            state.vtBatch.queue = state.vtBatch.queue.filter((id: string): boolean => !toStartIds.includes(id));
        },
        // 标记完成状态
        vtBatchTaskFinished: (state, {payload}: PayloadAction<string>): void => {
            const id: string = payload;

            state.vtBatch.running = state.vtBatch.running.filter((rid: string): boolean => rid !== id);
            state.vtBatch.queue = state.vtBatch.queue.filter((qid: string): boolean => qid !== id);

            if (state.vtBatch.running.length === 0 && state.vtBatch.queue.length === 0)
                state.vtBatch.status = 'idle';
        },
        // 批量停止所有任务
        vtBatchStop: (state): void => {
            if (state.vtBatch.status !== 'idle')
                state.vtBatch.status = 'stopping';
        },
        // 批量重置任务
        vtBatchReset: (state): void => {
            state.vtBatch = {
                status: 'idle',
                queue: [],
                running: []
            };
        }
    }
});

export const {
    appendCurrentVTTask,
    updateCurrentVTTaskItem,
    removeCurrentVTTaskItem,
    clearCurrentVTTask,
    vtBatchStart,
    vtBatchMarkRunning,
    vtBatchTaskFinished,
    vtBatchStop,
    vtBatchReset
} = VTTStore.actions;

export default VTTStore.reducer;
