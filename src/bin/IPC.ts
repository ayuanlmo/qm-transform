import Global from "../utils/Global";
import Electron from "electron";

const {ipcRenderer} = Global.requireNodeModule<typeof Electron>('electron');

export const sendIpcMessage = (channel: string, ...args: any[]): void => {
    ipcRenderer.send(channel, ...args);
};

export const onIpcMessage = (channel: string, listener: (event: any, ...args: any[]) => void): void => {
    ipcRenderer.on(channel, listener);
};

export default ipcRenderer;
