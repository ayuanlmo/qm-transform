import i18n from "i18next";
import {initReactI18next} from "react-i18next";
import zhCn from "./configs/zhCn.json";
import zhSg from "./configs/zhSg.json";
import zhTw from "./configs/zhTw.json";
import zhHk from "./configs/zhHk.json";
import en from "./configs/en.json";
import fi from "./configs/fi.json";
import fr from "./configs/fr.json";
import de from "./configs/de.json";
import ru from "./configs/ru.json";
import ko from "./configs/ko.json";
import jp from "./configs/jp.json";
import {getLocalConfig} from "../conf/AppConfig";

const resources = {
    'zh-CN': {translation: zhCn},
    'zh-Cn': {translation: zhCn},
    'zh-SG': {translation: zhSg},
    'zh-TW': {translation: zhTw},
    'zh-Tw': {translation: zhTw},
    'zh-HK': {
        translation: zhHk
    },
    'en': {
        translation: en
    },
    'fi': {
        translation: fi
    },
    'fr': {
        translation: fr
    },
    'de': {
        translation: de
    },
    'ru': {
        translation: ru
    },
    'ko': {
        translation: ko
    },
    'jp': {
        translation: jp
    },
    'ja': {
        translation: jp
    }
};

const {theme: {lang}} = getLocalConfig();

i18n
    .use(initReactI18next)
    .init({
        resources,
        lng: lang,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        }
    });

export const language = [
    {label: '简体中文', value: 'zh-CN'},
    {label: '简体中文（新加坡）', value: 'zh-SG'},
    {label: '繁體中文-台灣 (中華人民共和國)', value: 'zh-TW'},
    {label: '繁體中文（香港特別行政區）', value: 'zh-HK'},
    {label: 'English', value: 'en'},
    {label: 'Suomi', value: 'fi'},
    {label: 'Français', value: 'fr'},
    {label: 'Deutsch', value: 'de'},
    {label: 'Русский', value: 'ru'},
    {label: '한국어', value: 'ko'},
    {label: '日本語', value: 'jp'}
];

export default i18n;
