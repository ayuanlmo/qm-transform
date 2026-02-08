import {configureStore} from '@reduxjs/toolkit';
import AppStore from "./AppStore";
import VTTStore from "./VTTStore";
import ATTStore from "./ATTStore";

const store = configureStore({
    reducer: {
        app: AppStore,
        vtt: VTTStore,
        att: ATTStore
    }
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
