import {existsSync} from "node:fs";
import {IpcMainEvent} from "electron";
import {exec} from 'child_process';
import {platform} from "node:os";
import AppConf from "./AppConf";

const Player = (mediaPath: string, ctx: IpcMainEvent): void => {
    const {player: {playerPath, playerType}} = AppConf;

    if (!existsSync(playerPath))
        return ctx.reply('main:on:player-not-exists', '');

    if (!existsSync(mediaPath))
        return ctx.reply('main:on:player-file-not-exists', '');

    const protocol: string = 'file:';
    const path: string = platform() === 'win32' ? mediaPath.split('\\').join('\\\\') : mediaPath;
    let cmd: string = '';

    switch (platform()) {
        case 'win32':
            cmd = 'call ';
            break;
        case 'darwin':
            cmd = 'open ';
            break;
        default:
            cmd = '';
            break;
    }

    if (playerType === 'vlc')
        exec(`${cmd}"${playerPath}" ${protocol} "${path}" -f`);
    else
        exec(`${cmd}"${playerPath}" "${path}"`);
};

export default Player;
