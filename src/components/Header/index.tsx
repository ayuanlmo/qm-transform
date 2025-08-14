import * as React from "react";
import HeaderController_win32 from "./HeaderController_win32";

const Header: React.FC = (): React.JSX.Element => {
    return (
        <div className={'header-controller'}>
            <div className={'header-controller-drag'}/>
            <HeaderController_win32 />
        </div>
    );
};

export default Header;
