import "./style/App.scss";
import * as React from "react";
import {HashRouter} from "react-router-dom";
import LeftMenu from "./components/AppMenu/LeftMenu";
import Header from "./components/Header";
import RouterView from "./router/RouterView";
import {useSelector} from "react-redux";
import {RootState} from "./store";
import ErrorMessageToast from "./components/ErrorMessageToast";
import TaskPendingToast from "./components/TaskPendingToast";
import TaskEndToast from "./components/TaskEndToast";

const AppMain = (): React.JSX.Element => {
    const {theme: {navigationAppearance}} = useSelector((state: RootState) => state.app.currentSettingConfig);
    const menuCollapse = navigationAppearance === 'collapse';

    return (
        <HashRouter>
            <div className={'main-app main-menu-drawer'}>
                <ErrorMessageToast/>
                <TaskPendingToast/>
                <TaskEndToast />
                <LeftMenu/>
                <div
                    className={menuCollapse ? 'app-content-max' : 'app-content'}
                >
                    <Header/>
                    <div className={'main-content app_position_relative'}>
                        <RouterView/>
                    </div>
                </div>
            </div>
        </HashRouter>
    );
};

export default AppMain;
