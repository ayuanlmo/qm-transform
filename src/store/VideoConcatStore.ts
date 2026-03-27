import {createSlice, PayloadAction} from '@reduxjs/toolkit';

export interface IVcBatchState {
    status: 'idle' | 'running' | 'paused' | 'stopping';
    queue: string[];
    running: string[];
}

export interface IVcOptions {
    optFormat: string;
    codec: string;
    resolution: string;
}

export interface IVideoConcatStore {
    currentVcTask: IMediaInfo[];
    vcBatch: IVcBatchState;
    vcOptions: IVcOptions;
    vcConcatProgress: number;
}

const initialState: IVideoConcatStore = {
    currentVcTask: [],
    vcBatch: {
        status: 'idle',
        queue: [],
        running: []
    },
    vcOptions: {
        optFormat: 'mp4',
        codec: 'h264',
        resolution: 'original'
    },
    vcConcatProgress: 0
};

const VideoConcatStore = createSlice({
    name: 'videoConcat',
    initialState,
    reducers: {
        appendCurrentVcTask: (state, {payload}: PayloadAction<IMediaInfo[]>): void => {
            const existedIds: Set<string> = new Set(state.currentVcTask.map(item => item.id));
            const normalized: IMediaInfo[] = payload.map((item: IMediaInfo): IMediaInfo => ({
                ...item,
                status: item.status ?? 'ready',
                progress: item.progress ?? 0
            }));

            state.currentVcTask = [
                ...state.currentVcTask,
                ...normalized.filter(({id}: IMediaInfo): boolean => !existedIds.has(id))
            ];
        },
        removeCurrentVcTaskItem: (state, {payload}: PayloadAction<string>): void => {
            state.currentVcTask = state.currentVcTask.filter(({id}: IMediaInfo): boolean => id !== payload);
        },
        clearCurrentVcTask: (state) => {
            return {
                ...state,
                currentVcTask: [],
                vcBatch: {
                    status: 'idle',
                    queue: [],
                    running: []
                }
            };
        },
        reorderVcTask: (state, {payload}: PayloadAction<IMediaInfo[]>): void => {
            state.currentVcTask = payload;
        },
        updateVcOptions: (state, {payload}: PayloadAction<Partial<IVcOptions>>): void => {
            state.vcOptions = {...state.vcOptions, ...payload};
        },
        updateVcTaskProgress: (state, {payload}: PayloadAction<{
            id: string;
            progress: number;
            status?: string
        }>): void => {
            const item = state.currentVcTask.find(i => i.id === payload.id);

            if (item) {
                item.progress = payload.progress;
                if (payload.status) item.status = payload.status as any;
            }
        },
        vcBatchStart: (state, {payload}: PayloadAction<string[]>): void => {
            state.vcBatch.status = payload.length > 0 ? 'running' : 'idle';
            state.vcBatch.queue = [...payload];
            state.vcBatch.running = [];
        },
        vcBatchMarkRunning: (state, {payload}: PayloadAction<string[]>): void => {
            state.vcBatch.running.push(...payload);
            state.vcBatch.queue = state.vcBatch.queue.filter((id: string): boolean => !payload.includes(id));
        },
        vcBatchTaskFinished: (state, {payload}: PayloadAction<string>): void => {
            const id: string = payload;

            state.vcBatch.running = state.vcBatch.running.filter((rid: string): boolean => rid !== id);
            state.vcBatch.queue = state.vcBatch.queue.filter((qid: string): boolean => qid !== id);
            if (state.vcBatch.running.length === 0 && state.vcBatch.queue.length === 0)
                state.vcBatch.status = 'idle';
        },
        vcBatchStop: (state): void => {
            if (state.vcBatch.status !== 'idle')
                state.vcBatch.status = 'stopping';
        },
        vcBatchReset: (state): void => {
            state.vcBatch = {
                status: 'idle',
                queue: [],
                running: []
            };
        },
        vcBatchPause: (state): void => {
            state.vcBatch.status = 'paused';
        },
        vcBatchResume: (state): void => {
            state.vcBatch.status = 'running';
        },
        setVcConcatProgress: (state, {payload}: PayloadAction<number>): void => {
            state.vcConcatProgress = payload;
        }
    }
});

export const {
    appendCurrentVcTask,
    removeCurrentVcTaskItem,
    clearCurrentVcTask,
    reorderVcTask,
    updateVcOptions,
    updateVcTaskProgress,
    vcBatchStart,
    vcBatchMarkRunning,
    vcBatchTaskFinished,
    vcBatchStop,
    vcBatchReset,
    vcBatchPause,
    vcBatchResume,
    setVcConcatProgress
} = VideoConcatStore.actions;

export default VideoConcatStore.reducer;
