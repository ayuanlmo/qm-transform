import {Route, Routes} from "react-router-dom";
import * as React from "react";
import Router from "./Config";

const RouterView: React.FC = (): React.JSX.Element => {
    return (
        <Routes>
            {
                Router.map((Ri) => {
                    return (
                        <Route
                            key={Ri.path}
                            path={Ri.path}
                            element={<Ri.template/>}
                        />
                    );
                })
            }
        </Routes>
    );
};

export default RouterView;
