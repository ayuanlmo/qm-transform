import {FluentProvider} from "@fluentui/react-components";
import * as React from "react";
import {useEffect} from "react";
import {useMainEventListener, useTheme} from "./bin/Hooks";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "./store";
import MainApp from "./App.main";
import "./lib/Theme";
import {appDarkTheme, appLightTheme} from "./lib/Theme";
import {generateMediaFileId, getLocalPathForFile} from "./utils";
import {sendIpcMessage} from "./bin/IPC";
import {setAppVersion} from "./store/AppStore";


const App: React.FC = (): React.JSX.Element => {
    const {theme: {appearance}} = useSelector((state: RootState) => state.app.currentSettingConfig);
    const theme = useTheme(appearance === 'auto', appearance);
    const dispatch = useDispatch();

    useMainEventListener<string>('main:on:get-app-version', (version: string): void => {
        dispatch(setAppVersion(version));
    });

    useEffect((): void => {
        sendIpcMessage('main:on:get-app-version');
    }, []);

    useEffect(() => {
        const handleDragOver = (e: Event): void => e.preventDefault();
        const handleDrop = (e: any): void => {
            e.preventDefault();
            const files: File[] = Array.from(e.dataTransfer?.files ?? []);
            const paths: string[] = files.map((i: File): string => getLocalPathForFile(i) as string);

            sendIpcMessage('main:on:get-media-info', generateMediaFileId(paths));
        };

        document.body.addEventListener('dragover', handleDragOver);
        document.body.addEventListener('drop', handleDrop);
        return (): void => {
            document.body.removeEventListener('dragover', handleDragOver);
            document.body.removeEventListener('drop', handleDrop);
        };
    }, []);

    return (
        <FluentProvider theme={theme === 'dark' ? appDarkTheme : appLightTheme}>
            <MainApp/>
        </FluentProvider>
    );
};

export default App;
