import {FluentProvider} from "@fluentui/react-components";
import * as React from "react";
import {useTheme} from "./bin/Hooks";
import {useSelector} from "react-redux";
import {RootState} from "./store";
import MainApp from "./App.main";
import "./lib/Theme";
import {appDarkTheme, appLightTheme} from "./lib/Theme";

const App:React.FC = ():React.JSX.Element => {
    const {theme: {appearance}} = useSelector((state: RootState) => state.app.currentSettingConfig);
    const theme = useTheme(appearance === 'auto', appearance);

    return(
        <FluentProvider theme={theme === 'dark' ? appDarkTheme : appLightTheme}>
            <MainApp />
        </FluentProvider>
    );
};

export default App;
