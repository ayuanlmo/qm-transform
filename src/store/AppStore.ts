import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import DefaultSettingConfig from '../conf/DefaultSettingConfig';
import {saveConfig} from '../conf/AppConfig';

export interface IAppStore {
    currentSettingConfig: IDefaultSettingConfig;
    currentVTTask: IMediaInfo[];
}

const initialState: IAppStore = {
    currentSettingConfig: {...DefaultSettingConfig},
    currentVTTask: []
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
        removeCurrentVTTaskItem: (state, {payload}: PayloadAction<string>) => {
            state.currentVTTask = state.currentVTTask.filter(item => item.id !== payload);
        },
        updateCurrentVTTaskItem: (state, {payload}: PayloadAction<{id: string; changes: Partial<IMediaInfo>}>) => {
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
                currentVTTask: []
            };
        }
    }
});

export const {
    setCurrentSettingConfig,
    setCurrentVTTask,
    updateCurrentVTTaskItem,
    removeCurrentVTTaskItem,
    clearCurrentVTTask
} = AppStore.actions;

export default AppStore.reducer;
