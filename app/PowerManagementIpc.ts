import {ipcMain, IpcMainEvent, powerSaveBlocker} from "electron";

/**
 * @class PowerManagementIpc
 * @constructor
 * @author: ayuanlmo
 * @description 电源管理相关ipc
 * **/
class PowerManagementIpc {
    /**
     * @private
     * @type {number | null} pasId - 电源拦截器ID
     * **/
    pasId: number | null = null;

    constructor() {
        this.initHandles();
    }

    private initHandles(): void {
        ipcMain.on('window:on:open-pas', (event, open) => this.openPas(event, open));
        ipcMain.on('window:on:pas-is-open', (event) => this.pasIsOpen(event));
    }

    private pasIsOpen(event: IpcMainEvent): void {
        const isOpen: boolean = this.pasId !== null && powerSaveBlocker.isStarted(this.pasId);

        event.sender.send('main:on:pas-is-open', isOpen);
    }

    private openPas(event: IpcMainEvent, open: boolean): void {
        if (open) {
            if (this.pasId === null || !powerSaveBlocker.isStarted(this.pasId))
                this.pasId = powerSaveBlocker.start('prevent-app-suspension');

            if (this.pasId !== null && powerSaveBlocker.isStarted(this.pasId))
                event.sender.send('main:on:pas-on');
        } else {
            if (this.pasId !== null) {
                if (powerSaveBlocker.isStarted(this.pasId))
                    powerSaveBlocker.stop(this.pasId);

                this.pasId = null;
            }

            event.sender.send('main:on:pas-off');
        }
    }
}

export default PowerManagementIpc;
