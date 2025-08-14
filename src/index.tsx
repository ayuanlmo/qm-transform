import {createRoot, Root} from "react-dom/client";
import * as React from "react";
import {StrictMode} from "react";
import {Provider} from "react-redux";
import Store from "./store";
import "./i18n";
import "./style/Global.css";
import "./style/animate.min.css";
import "./style/App-Light.scss";
import "./style/App-Dark.scss";
import "./style/index.scss";
import App from "./App";
import "./conf/AppConfig";

const RootComponent: React.FC = (): React.JSX.Element => {

    return (
        <Provider store={Store}>
            <App/>
        </Provider>
    );
};

((): void => {
    'use strict';
    const _Root_App: Root = createRoot(document.getElementById('__lmo_app__') as HTMLElement);

    _Root_App.render(
        <StrictMode>
            <RootComponent/>
        </StrictMode> as React.JSX.Element
    );
})();
