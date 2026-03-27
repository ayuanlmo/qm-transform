import {configureStore} from '@reduxjs/toolkit';
import AppStore from "./AppStore";
import VTTStore from "./VTTStore";
import ATTStore from "./ATTStore";
import VideoConcatStore from "./VideoConcatStore";

const store = configureStore({
    reducer: {
        app: AppStore,
        vtt: VTTStore,
        att: ATTStore,
        videoConcat: VideoConcatStore
    }
});

export default store;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
