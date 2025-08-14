import * as React from "react";
import {Fragment} from "react";
import {Card, Label, Radio, RadioGroup, Select} from "@fluentui/react-components";
import {DarkTheme20Filled, LocalLanguage16Filled, Navigation16Filled} from "@fluentui/react-icons";
import {setCurrentSettingConfig} from "../../store/AppStore";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {Dispatch} from "@reduxjs/toolkit";
import {language} from "../../i18n";
import Electron from "electron";
import Global from "../../utils/Global";

const {webFrame} = Global.requireNodeModule<typeof Electron>('electron');
const ThemeSetting: React.FC = (): React.JSX.Element => {
    const {t, i18n} = useTranslation();
    const currentSettingConfig = useSelector((state: RootState) => state.app.currentSettingConfig);
    const dispatch: Dispatch = useDispatch();

    const setConfig = (data: any): void => {
        dispatch(setCurrentSettingConfig({
            ...currentSettingConfig,
            theme: {
                ...currentSettingConfig.theme,
                ...data
            }
        }));
    };

    return (
        <Fragment>
            <div className={'animated zoomIn'}>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <LocalLanguage16Filled/>
                            {t('themeSetting.lang')}
                        </Label>
                        <Select
                            layout="horizontal"
                            defaultValue={currentSettingConfig.theme.lang}
                            onChange={async (ev, {value}): Promise<void> => {
                                setConfig({
                                    lang: value
                                });
                                await i18n.changeLanguage(value);
                            }}
                        >
                            {
                                language.map(({label, value}): React.JSX.Element => {
                                    return (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    );
                                })
                            }
                        </Select>
                    </div>
                </Card>
                <Card>
                    <div className={'system-setting-item'}>
                        <Label>
                            <DarkTheme20Filled/>
                            {t('themeSetting.label')}
                        </Label>
                        <RadioGroup
                            layout="horizontal"
                            defaultValue={currentSettingConfig.theme.appearance}
                            onChange={(ev, {value}): void => {
                                setConfig({
                                    appearance: value
                                });
                            }}
                        >
                            <Radio value={'dark'} label={t('themeSetting.dark')}/>
                            <Radio value={'light'} label={t('themeSetting.light')}/>
                            <Radio value={'auto'} label={t('themeSetting.auto')}/>
                        </RadioGroup>
                    </div>
                    <div className={'system-setting-item'}>
                        <Label>
                            <Navigation16Filled/>
                            {t('themeSetting.navigation')}
                        </Label>
                        <RadioGroup
                            defaultValue={currentSettingConfig.theme.navigationAppearance}
                            layout="horizontal"
                            onChange={(ev, {value}): void => {
                                setConfig({
                                    navigationAppearance: value
                                });
                            }}
                        >
                            <Radio value={'default'} label={t('themeSetting.navigationSetting.default')}></Radio>
                            <Radio value={'collapse'} label={t('themeSetting.navigationSetting.collapse')}></Radio>
                        </RadioGroup>
                    </div>
                    <div className={'system-setting-item'}>
                        <Label>
                            <Navigation16Filled/>
                            {t('themeSetting.zoomFactor')}
                        </Label>
                        <RadioGroup
                            defaultValue={currentSettingConfig.theme.zoomFactor}
                            layout="horizontal"
                            onChange={(ev, {value}): void => {
                                webFrame.setZoomFactor(Number(value) / 100);
                                setConfig({
                                    zoomFactor: value
                                });
                            }}
                        >
                            <Radio value={'75'} label={'75%'}/>
                            <Radio value={'100'} label={'100%'}/>
                            <Radio value={'125'} label={'125%'}/>
                        </RadioGroup>
                    </div>
                </Card>
            </div>
        </Fragment>
    );
};


export default ThemeSetting;
