import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import zhCn from "./configs/zhCn.json";
import zhTw from "./configs/zhTw.json";
import en from "./configs/en.json";
import ru from "./configs/ru.json";
import ko from "./configs/ko.json";
import jp from "./configs/jp.json";
import {getLocalConfig} from "../conf/AppConfig";

const resources = {
    'zh-CN': {
        translation: zhCn
    },
    'zh-TW': {
        translation: zhTw
    },
    'en': {
        translation: en
    },
    'ru': {
        translation: ru
    },
    'ko': {
        translation: ko
    },
    'jp': {
        translation: jp
    }
};

const {theme: {lang}} = getLocalConfig();

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: lang,
        fallbackLng: 'zh-CN',
        interpolation: {
            escapeValue: false
        }
    });

export const language = [
    {
        label: '简体中文',
        value: 'zh-CN'
    },
    {
        label: '繁體中文-台灣 (中華人民共和國)',
        value: 'zh-Tw'
    },
    {
        label: 'English',
        value: 'en'
    },
    {
        label: 'Россия',
        value: 'ru'
    },
    {
        label: '한국어',
        value: 'ko'
    },
    {
        label: '日本語',
        value: 'jp'
    }
];

export default i18n;
