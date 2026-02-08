import {BrandVariants, createDarkTheme, createLightTheme, Theme} from "@fluentui/react-components";
import {isInChristmasPeriod} from "./HolidayElements";

const AppTheme: BrandVariants = {
    10: "#030207",
    20: "#15152B",
    30: "#1B234B",
    40: "#1D2F64",
    50: "#1B3C7C",
    60: "#174A94",
    70: "#0E58AA",
    80: "#0166BE",
    90: "#0075D0",
    100: "#0285E2",
    110: "#1B94F0",
    120: "#35A4FC",
    130: "#59B2FF",
    140: "#7BC1FF",
    150: "#99CFFF",
    160: "#B6DDFF"
};

const appTheme = {
    colorBrandBackground: '#0688E5',
    colorNeutralForeground2BrandHover: '#0688E5',
    colorNeutralForeground2BrandSelected: '#0688E5',
    colorNeutralForeground3BrandHover: '#0688E5',
    colorNeutralForeground3BrandSelected: '#0688E5',
    colorCompoundBrandForeground1: '#0688E5',
    colorBrandForegroundOnLight: '#0688E5',
    colorCompoundBrandBackground: '#0688E5',
    colorBrandBackgroundStatic: '#0688E5',
    colorBrandStroke1: '#0688E5',
    colorBrandStroke2Pressed: '#0688E5',
    colorCompoundBrandStroke: '#0688E5',
    colorNeutralStrokeAccessibleSelected: '#0688E5',
    colorBrandBackgroundPressed: '#0466ab',
    colorBrandBackgroundHover: '#0372c0'
};

const appChristmasTheme = {
    colorBrandBackground: '#CF232A',
    colorNeutralForeground2BrandHover: '#CF232A',
    colorNeutralForeground2BrandSelected: '#CF232A',
    colorNeutralForeground3BrandHover: '#CF232A',
    colorNeutralForeground3BrandSelected: '#CF232A',
    colorCompoundBrandForeground1: '#CF232A',
    colorBrandForegroundOnLight: '#FFFFFF',
    colorCompoundBrandBackground: '#CF232A',
    colorBrandBackgroundStatic: '#CF232A',
    colorBrandStroke1: '#CF232A',
    colorBrandStroke2Pressed: '#A81D21',
    colorCompoundBrandStroke: '#CF232A',
    colorNeutralStrokeAccessibleSelected: '#CF232A',
    colorBrandBackgroundPressed: '#A81D21',
    colorBrandBackgroundHover: '#B91F23'
};

let theme = appTheme;

if (isInChristmasPeriod()) {
    document.body.classList.add('christmas');
    theme = appChristmasTheme;
}

export const appLightTheme: Theme = {
    ...createLightTheme(AppTheme),
    ...theme
};

export const appDarkTheme: Theme = {
    ...createDarkTheme(AppTheme),
    ...theme
};

