import * as React from "react";
import {Card, Divider, Input, Label, Select} from "@fluentui/react-components";
import {FilmstripPlay16Filled, ReceiptPlay20Filled} from "@fluentui/react-icons";
import {useTranslation} from "react-i18next";
import {useDispatch, useSelector} from "react-redux";
import {RootState} from "../../store";
import {setCurrentSettingConfig} from "../../store/AppStore";
import {Dispatch} from "@reduxjs/toolkit";
import {useMainEventListener} from "../../bin/Hooks";
import {sendIpcMessage} from "../../bin/IPC";
import Global, {pathParse} from "../../utils/Global";
import YExtendTemplate from "../YExtendTemplate";
import AppConfig from "../../conf/AppConfig";
import {windowsMediaPlayerDefaultPath} from "../../conf/DefaultSettingConfig";
import {MediaPlayerForMacOS, MediaPlayerForWindows} from "./Config";

const AppPath = Global.requireNodeModule<any>('app-path');
const selectMediaPlayerEventName = 'window:on:select-media-player-path';

const PlayerSetting: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();
    const currentSettingConfig = useSelector((state: RootState) => state.app.currentSettingConfig);
    const dispatch: Dispatch = useDispatch();
    const setConfig = (data: any): void => {
        dispatch(setCurrentSettingConfig({
            ...currentSettingConfig,
            player: {
                ...currentSettingConfig.player,
                ...data
            }
        }));
    };
    const playerTypeChange = async (value: string): Promise<void> => {
        let playerPath: string = '';

        if (AppConfig.platform === 'darwin') {
            try {
                if (value === 'qtp')
                    playerPath = await AppPath.default('QuickTime Player');
                if (value === 'vlc')
                    playerPath = await AppPath.default('VLC');

            } catch (e) {
                playerPath = '';
            }
        } else if (AppConfig.platform === 'win32' && value === 'wmp')
            playerPath = windowsMediaPlayerDefaultPath;

        setConfig({
            ...currentSettingConfig.player,
            playerType: value,
            playerPath
        });
    };

    useMainEventListener<string>(selectMediaPlayerEventName, (data: string): void => {
        setConfig({
            playerPath: pathParse(data)
        });
    });

    return (
        <Card className={'animated zoomIn'}>
            <div className={'system-setting-item'}>
                <Label>
                    <FilmstripPlay16Filled/>
                    {t('playerSetting.mediaPlayer')}
                </Label>
                <div>
                    <Select
                        defaultValue={currentSettingConfig.player.playerType}
                        onChange={(ev, {value}): Promise<void> => playerTypeChange(value)}
                    >
                        <YExtendTemplate show={AppConfig.platform === 'win32'}>
                            <React.Fragment>
                                {
                                    MediaPlayerForWindows.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} key={i.value}>{i.name}</option>
                                        );
                                    })
                                }
                            </React.Fragment>
                        </YExtendTemplate>
                        <YExtendTemplate show={AppConfig.platform === 'darwin'}>
                            <React.Fragment>
                                {
                                    MediaPlayerForMacOS.map((i): React.JSX.Element => {
                                        return (
                                            <option value={i.value} key={i.value}>{i.name}</option>
                                        );
                                    })
                                }
                            </React.Fragment>
                        </YExtendTemplate>
                        <option value={'custom'}>{t('playerSetting.customMediaPlayer')}</option>
                    </Select>
                </div>
            </div>
            <div className={'system-setting-item'}>
                <Label>
                    <ReceiptPlay20Filled/>
                    {t('playerSetting.mediaPlayerPath')}
                </Label>
                <div>
                    <Input
                        value={currentSettingConfig.player.playerPath}
                        onClick={(): void => {
                            sendIpcMessage(selectMediaPlayerEventName);
                        }}
                        readOnly
                    />
                </div>
                <div className={'system-setting-item-content-divider'}>
                    <Divider
                        appearance="brand"
                        alignContent={'end'}
                    >
                        {t('playerSetting.mediaPlayerDesc')}
                    </Divider>
                </div>
            </div>
        </Card>
    )
        ;
};

export default PlayerSetting;
