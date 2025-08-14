import {BrowserWindow, Menu} from "electron";
import {platform} from "node:os";
import AppConf from "../app/AppConf";

const MenuI18n = {
    'zh-CN': {
        'aboutApp': '关于',
        'setting': '设置'
    },
    'en': {
        'aboutApp': 'aboutApp',
        'setting': 'Settings'
    },
    'ja': {
        'aboutApp': 'カスタムアプリについて',
        'setting': '設定'
    },
    'ru': {
        'aboutApp': 'О кастомном приложении',
        'setting': 'Настройки'
    },
    'ko': {
        'aboutApp': '커스텀 앱에 대해',
        'setting': '설정'
    },
    'zh-Tw': {
        'aboutApp': '關於自訂',
        'setting': '設定'
    }
};

class AppMenu {
    constructor(window: BrowserWindow) {
        const {theme: {lang}} = AppConf;

        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-expect-error
        const i18n: any = MenuI18n[lang ?? 'zh-CN'];

        const template = [
            {
                label: 'Custom',
                submenu: [
                    {
                        label: i18n.aboutApp,
                        click(): void {
                            window.webContents.send('window:open-about');
                        }
                    },
                    {
                        label: i18n.setting,
                        click(): void {
                            window.webContents.send('window:open-setting');
                        }
                    }
                ]
            }
        ];
        const menu: Menu = Menu.buildFromTemplate(template);

        platform() === 'darwin' && Menu.setApplicationMenu(menu);
    }
}

export default AppMenu;

