import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import DefaultSettingConfig from '../conf/DefaultSettingConfig';
import {saveConfig} from '../conf/AppConfig';

export interface IVTBatchState {
    status: 'idle' | 'running' | 'stopping';
    queue: string[];
    running: string[];
}

export interface IAppStore {
    currentSettingConfig: IDefaultSettingConfig;
    currentVTTask: IMediaInfo[];
    vtBatch: IVTBatchState;
}

const initialState: IAppStore = {
    currentSettingConfig: {...DefaultSettingConfig},
    currentVTTask: [],
    vtBatch: {
        status: 'idle',
        queue: [],
        running: []
    }
};

const AppStore = createSlice({
    name: 'app',
    initialState,
    reducers: {
        setCurrentSettingConfig: (state, {payload}) => {
            saveConfig(payload);
            return {
                ...state,
                currentSettingConfig: payload
            };
        },
        setCurrentVTTask: (state, {payload}: PayloadAction<IMediaInfo[]>) => {
            return {
                ...state,
                currentVTTask: payload
            };
        },
        appendCurrentVTTask: (state, {payload}: PayloadAction<IMediaInfo[]>) => {
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
                ...normalized.filter(item => !existedIds.has(item.id))
            ];
        },
        removeCurrentVTTaskItem: (state, {payload}: PayloadAction<string>) => {
            state.currentVTTask = state.currentVTTask.filter(item => item.id !== payload);
        },
        updateCurrentVTTaskItem: (state, {payload}: PayloadAction<{ id: string; changes: Partial<IMediaInfo> }>) => {
            const {id, changes} = payload;
            const targetIndex = state.currentVTTask.findIndex(item => item.id === id);

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
        vtBatchStart: (state, {payload}: PayloadAction<string[]>) => {
            state.vtBatch.status = payload.length > 0 ? 'running' : 'idle';
            state.vtBatch.queue = [...payload];
            state.vtBatch.running = [];
        },
        vtBatchMarkRunning: (state, {payload}: PayloadAction<string[]>) => {
            const toStartIds: string[] = payload;

            state.vtBatch.running.push(...toStartIds);
            state.vtBatch.queue = state.vtBatch.queue.filter(id => !toStartIds.includes(id));
        },
        vtBatchTaskFinished: (state, {payload}: PayloadAction<string>) => {
            const id: string = payload;

            state.vtBatch.running = state.vtBatch.running.filter(rid => rid !== id);
            state.vtBatch.queue = state.vtBatch.queue.filter(qid => qid !== id);

            if (state.vtBatch.running.length === 0 && state.vtBatch.queue.length === 0)
                state.vtBatch.status = 'idle';
        },
        vtBatchStop: (state) => {
            if (state.vtBatch.status !== 'idle')
                state.vtBatch.status = 'stopping';
        },
        vtBatchReset: (state) => {
            state.vtBatch = {
                status: 'idle',
                queue: [],
                running: []
            };
        }
    }
});

export const {
    setCurrentSettingConfig,
    setCurrentVTTask,
    appendCurrentVTTask,
    updateCurrentVTTaskItem,
    removeCurrentVTTaskItem,
    clearCurrentVTTask,
    vtBatchStart,
    vtBatchMarkRunning,
    vtBatchTaskFinished,
    vtBatchStop,
    vtBatchReset
} = AppStore.actions;

export default AppStore.reducer;
