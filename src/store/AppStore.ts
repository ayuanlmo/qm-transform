import {createSlice} from '@reduxjs/toolkit';
import DefaultSettingConfig from '../conf/DefaultSettingConfig';
import {saveConfig} from '../conf/AppConfig';

export interface IAppStore {
    currentSettingConfig: IDefaultSettingConfig;
}

const initialState: IAppStore = {
    currentSettingConfig: {...DefaultSettingConfig}
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
        }
    }
});

export const {
    setCurrentSettingConfig
} = AppStore.actions;

export default AppStore.reducer;
