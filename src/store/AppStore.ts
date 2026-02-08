import {createSlice} from '@reduxjs/toolkit';
import DefaultSettingConfig from '../conf/DefaultSettingConfig';
import {saveConfig} from '../conf/AppConfig';

export interface IAppStore {
    currentSettingConfig: IDefaultSettingConfig;
    readonly appVersion: string;
}

const initialState: IAppStore = {
    currentSettingConfig: {...DefaultSettingConfig},
    appVersion: ''
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
        setAppVersion: (state, {payload}) => {
            state.appVersion = payload;
        }
    }
});

export const {
    setCurrentSettingConfig,
    setAppVersion
} = AppStore.actions;

export default AppStore.reducer;
