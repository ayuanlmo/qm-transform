import type {FC} from "react";
import VideoTransform from "../views/VideoTransform";
import AudioTransform from "../views/AudioTransform";
// import VideoConcat from "../views/VideoConcat";
// import VideoCompress from "../views/VideoCompress";

export interface IRouterItem {
    name: string;
    path: string;
    icon: string;
    template: FC;
}

export default [
    {
        name: 'menu.videoTransform',
        path: '/',
        icon: '/react-app-static/ico/video-transform.svg',
        template: VideoTransform
    },
    {
        name: 'menu.audioTransform',
        path: '/audio-transform',
        icon: '/react-app-static/ico/audio-transform.svg',
        template: AudioTransform
    }
    // ,
    // {
    //     name: 'menu.videoConcat',
    //     path: '/video-concat',
    //     icon: '/react-app-static/ico/vide-concat.svg',
    //     template: VideoConcat
    // },
    // {
    //     name: 'menu.videoCompress',
    //     path: '/video-compress',
    //     icon: '/react-app-static/ico/video-compress.svg',
    //     template: VideoCompress
    // }
];
