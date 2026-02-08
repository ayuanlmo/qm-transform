import * as React from "react";
import {useState} from "react";
import {useTranslation} from "react-i18next";
import Dialog from "../FluentTemplates/Dialog";
import {Tab, TabList} from "@fluentui/react-components";
import ThemeSetting from "./ThemeSetting";
import OutputSetting from "./OutputSetting";
import YExtendTemplate from "../YExtendTemplate";
import PlayerSetting from "./PlayerSetting";
import OtherSetting from "./OtherSetting";
import {useMainEventListener} from "../../bin/Hooks";

const SystemSetting: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const [openSettingWindow, setOpenSettingWindow] = useState(false);
    const [tabSelected, setTabSelected] = useState(1);

    const openSettingWindowHandler = (): void => {
        setOpenSettingWindow(!openSettingWindow);
    };

    useMainEventListener('window:open-setting', (): void => {
        openSettingWindowHandler();
    });

    return (
        <div className={'system-setting app_position_absolute app_cursor_pointer'}>
            <Dialog
                title={t('systemSetting')}
                open={openSettingWindow}
                onClose={(): void => openSettingWindowHandler()}
                surface={
                    <div>
                        <div className={'system-setting-tab animated slideInDown'}>
                            <TabList
                                defaultSelectedValue={tabSelected}
                                onTabSelect={(event: any, {value}: any) => {
                                    setTabSelected(value);
                                }}
                            >
                                <Tab value={1}>{t('themeSetting.label')}</Tab>
                                <Tab value={2}>{t('outputSetting.label')}</Tab>
                                <Tab value={3}>{t('playerSetting.label')}</Tab>
                                <Tab value={4}>{t('otherSetting.label')}</Tab>
                            </TabList>
                        </div>
                        <div style={{
                            maxHeight: '400px'
                        }}>
                            <YExtendTemplate show={tabSelected === 1}>
                                <ThemeSetting/>
                            </YExtendTemplate>
                            <YExtendTemplate show={tabSelected === 2}>
                                <OutputSetting/>
                            </YExtendTemplate>
                            <YExtendTemplate show={tabSelected === 3}>
                                <PlayerSetting/>
                            </YExtendTemplate>
                            <YExtendTemplate show={tabSelected === 4}>
                                <OtherSetting/>
                            </YExtendTemplate>
                        </div>
                    </div>
                }/>
            <div
                className={'system-setting-content'}
                onClick={
                    (): void => openSettingWindowHandler()
                }
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path
                        d="M7.936 15.584C7.84 15.584 7.752 15.56 7.672 15.512L1.712 12.072C1.544 11.976 1.448 11.8 1.448 11.608V4.72002C1.448 4.52802 1.552 4.35202 1.712 4.25602L7.672 0.816019C7.84 0.720019 8.04 0.720019 8.208 0.816019L14.176 4.25602C14.344 4.35202 14.44 4.52802 14.44 4.72002V11.608C14.44 11.8 14.336 11.976 14.176 12.072L8.208 15.512C8.12 15.56 8.032 15.584 7.936 15.584ZM2.512 11.296L7.944 14.432L13.376 11.296V5.02402L7.936 1.89602L2.512 5.02402V11.296ZM7.96 10.432C6.704 10.432 5.688 9.41602 5.688 8.16002C5.688 6.90402 6.704 5.88802 7.96 5.88802C9.216 5.88802 10.232 6.90402 10.232 8.16002C10.232 9.41602 9.208 10.432 7.96 10.432ZM7.96 6.96002C7.296 6.96002 6.752 7.50402 6.752 8.16802C6.752 8.83202 7.296 9.37602 7.96 9.37602C8.624 9.37602 9.16 8.83202 9.16 8.16802C9.16 7.50402 8.624 6.96002 7.96 6.96002Z"
                        fill="#626262"/>
                </svg>
                <span>
                    {t('systemSetting')}
                </span>
            </div>
        </div>
    );
};

export default SystemSetting;
