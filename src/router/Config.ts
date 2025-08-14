import {FC, lazy, LazyExoticComponent} from "react";

export interface IRouterItem {
    name: string;
    path: string;
    icon: string;
    template: LazyExoticComponent<FC>;
}

export default [
    {
        name: 'menu.videoTransform',
        path: '/',
        icon: '/react-app-static/ico/video-transform.svg',
        template: lazy(() => import("../views/VideoTransform"))
    },
    {
        name: 'menu.audioTransform',
        path: '/audio-transform',
        icon: '/react-app-static/ico/audio-transform.svg',
        template: lazy(() => import("../views/AudioTransform"))
    },
    {
        name: 'menu.videoConcat',
        path: '/video-concat',
        icon: '/react-app-static/ico/vide-concat.svg',
        template: lazy(() => import("../views/VideoConcat"))
    },
    {
        name: 'menu.videoCompress',
        path: '/video-compress',
        icon: '/react-app-static/ico/video-compress.svg',
        template: lazy(() => import("../views/VideoCompress"))
    }
];
