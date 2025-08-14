import {Route, Routes} from "react-router-dom";
import *as React from "react";
import {Suspense} from "react";
import Router from "./Config";

const RouterView: React.FC = (): React.JSX.Element => {
    return (
        <Routes>
            {
                Router.map((Ri) => {
                    return (
                        <Route key={Ri.path} path={Ri.path} element={
                            <Suspense>
                                <Ri.template/>
                            </Suspense>
                        }/>
                    );
                })
            }
        </Routes>
    );
};

export default RouterView;
