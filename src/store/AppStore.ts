import {createSlice} from '@reduxjs/toolkit';
import DefaultSettingConfig from '../conf/DefaultSettingConfig';
import {saveConfig} from '../conf/AppConfig';

export interface IAppStore {
    currentSettingConfig: IDefaultSettingConfig;
    currentVTTask: IMediaInfo[];
}

const AppStore = createSlice({
    name: 'app',
    initialState: {
        currentSettingConfig: {...DefaultSettingConfig},
        currentVTTask: []
    },
    reducers: {
        setCurrentSettingConfig: (state, {payload}) => {
            saveConfig(payload);
            return {
                ...state,
                currentSettingConfig: payload
            };
        },
        setCurrentVTTask: (state, {payload}) => {
            return {
                ...state,
                currentVTTask: payload
            };
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
    clearCurrentVTTask
} = AppStore.actions;

export default AppStore.reducer;
