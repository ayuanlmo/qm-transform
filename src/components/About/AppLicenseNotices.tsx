import * as React from "react";
import {ForwardedRef, forwardRef, ForwardRefExoticComponent, RefAttributes, useImperativeHandle, useState} from "react";
import Dialog from "../FluentTemplates/Dialog";
import {Card, Divider, Link, Text} from "@fluentui/react-components";
import AppConfig from "../../conf/AppConfig";
import {IAboutRef} from "./index";
import {openExternalUrl} from "../../utils";
import {Trans} from "react-i18next";

const githubBase = 'https://github.com';
const licenseData = [
    {
        name: '@fluentui/react-components',
        url: '/microsoft/fluentui/',
        copyright: 'Copyright (c) Microsoft Corporation',
        license: 'MIT License',
        licenseUrl: '/microsoft/fluentui/blob/master/LICENSE'
    },
    {
        name: '@fluentui/react-icons',
        url: '/microsoft/fluentui-system-icons',
        copyright: 'Copyright (c) Microsoft Corporation',
        license: 'MIT License',
        licenseUrl: '/microsoft/fluentui-system-icons/blob/main/LICENSE'
    },
    {
        name: 'react',
        url: '/facebook/react',
        copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.',
        license: 'MIT License',
        licenseUrl: '/facebook/react/blob/main/LICENSE'
    },
    {
        name: 'ffmpeg-static',
        url: '/eugeneware/ffmpeg-static',
        copyright: ' Copyright (C) 2007 Free Software Foundation, Inc.',
        license: 'GNU GENERAL PUBLIC LICENSE',
        licenseUrl: '/eugeneware/ffmpeg-static/blob/master/LICENSE'
    },
    {
        name: 'ffprobe-static',
        url: '/derhuerst/ffprobe-static',
        copyright: 'Copyright (c) 2015 Josh Johnston',
        license: 'MIT License',
        licenseUrl: '/derhuerst/ffprobe-static/blob/master/LICENSE'
    },
    {
        name: 'fluent-ffmpeg',
        url: '/fluent-ffmpeg/node-fluent-ffmpeg',
        copyright: 'Copyright (c) 2011-2015 The fluent-ffmpeg contributors',
        license: 'MIT License',
        licenseUrl: '/fluent-ffmpeg/node-fluent-ffmpeg/blob/master/LICENSE'
    },
    {
        name: '@reduxjs/toolkit',
        url: '/reduxjs/redux-toolkit',
        copyright: 'Copyright (c) 2018 Mark Erikson',
        license: 'MIT License',
        licenseUrl: '/reduxjs/redux-toolkit/blob/master/LICENSE'
    },
    {
        name: 'electron',
        url: '/electron/electron',
        copyright: 'Copyright (c) Electron contributors\n' +
            'Copyright (c) 2013-2020 GitHub Inc.',
        license: 'MIT License',
        licenseUrl: '/electron/electron/blob/main/LICENSE'
    },
    {
        name: 'electron-builder',
        url: '/electron-userland/electron-builder/',
        copyright: 'Copyright (c) 2015 Loopline Systems',
        license: 'MIT License',
        licenseUrl: '/electron-userland/electron-builder/blob/master/LICENSE'
    },
    {
        name: 'electron-log',
        url: '/megahertz/electron-log/',
        copyright: 'Copyright (c) 2016 Alexey Prokhorov',
        license: 'MIT License',
        licenseUrl: '/megahertz/electron-log/blob/master/LICENSE'
    },
    {
        name: 'i18next',
        url: '/i18next/i18next',
        copyright: 'Copyright (c) 2025 i18next',
        license: 'MIT License',
        licenseUrl: '/i18next/i18next/blob/master/LICENSE'
    },
    {
        name: 'react-i18next',
        url: '/i18next/react-i18next',
        copyright: 'Copyright (c) 2025 i18next',
        license: 'MIT License',
        licenseUrl: '/i18next/react-i18next/blob/master/LICENSE'
    },
    {
        name: 'react-redux',
        url: '/reduxjs/react-redux',
        copyright: 'Copyright (c) 2015-present Dan Abramov',
        license: 'MIT License',
        licenseUrl: '/reduxjs/react-redux/blob/master/LICENSE.md'
    },
    {
        name: 'react-router-dom',
        url: '/remix-run/react-router',
        copyright: 'Copyright (c) React Training LLC 2015-2019 \n Copyright (c) Remix Software Inc. 2020-2021\n Copyright (c) Shopify Inc. 2022-2023',
        license: 'MIT License',
        licenseUrl: '/remix-run/react-router/blob/main/LICENSE.md'
    },
    {
        name: 'uuid',
        url: '/uuidjs/uuid',
        copyright: 'Copyright (c) 2010-2020 Robert Kieffer and other contributors',
        license: 'MIT License',
        licenseUrl: '/uuid/blob/main/LICENSE.md'
    },
    {
        name: 'app-path',
        url: '/sindresorhus/app-path',
        copyright: 'Copyright (c) Sindre Sorhus <sindresorhus@gmail.com> (https://sindresorhus.com)',
        license: 'MIT License',
        licenseUrl: '/sindresorhus/app-path/blob/main/license'
    },
    {
        name: 'systeminformation',
        url: '/sebhildebrandt/systeminformation',
        copyright: 'Copyright (c) 2014-2025 Sebastian Hildebrandt',
        license: 'MIT License',
        licenseUrl: '/sebhildebrandt/systeminformation/blob/master/LICENSE'
    }
];

export interface IAppLicenseNoticesProps {
    open: () => void;
}

const AppLicenseNotices: ForwardRefExoticComponent<RefAttributes<IAppLicenseNoticesProps>> = forwardRef((_props: {}, ref: ForwardedRef<IAppLicenseNoticesProps>): React.JSX.Element => {
    const [visible, setVisible] = useState(false);

    const open = (): void => {
        setVisible(!visible);
    };

    useImperativeHandle(ref, (): IAboutRef => ({
        open
    }));

    return (
        <Dialog
            title={'License and Open Source Notices'}
            open={visible}
            onClose={open}
            surface={
                <div>
                    <Card style={{
                        height: '480px',
                        overflowY: 'auto'
                    }}>
                        <div>
                            <div className={'license-item'}>

                                <Trans
                                    i18nKey="about.appOpenSourceNotice"
                                    values={{name: AppConfig.appName}}
                                    components={{
                                        appName: <Link onClick={(): void => {
                                            openExternalUrl(AppConfig.appRepository);
                                        }}>
                                            {AppConfig.appName}
                                        </Link>,
                                        github: <Link inline onClick={(): void => {
                                            openExternalUrl(AppConfig.appRepository);
                                        }}>
                                            Github.
                                        </Link>
                                    }}
                                />
                                <Divider/>
                            </div>
                            {
                                licenseData.map(({name, url, copyright, license, licenseUrl}) => {
                                    return (
                                        <div
                                            key={name}
                                            className={'license-item'}
                                        >
                                            <Link
                                                size={1000}
                                                onClick={(): void => {
                                                    openExternalUrl(`${githubBase}${url}`);
                                                }}
                                            >
                                                <Text underline weight="bold">
                                                    {name}
                                                </Text>
                                            </Link>
                                            <br/>
                                            <Text>
                                                {
                                                    copyright.split('\n').map((line): React.JSX.Element => {
                                                        return (
                                                            <Text key={line}>
                                                                {line}
                                                                <br/>
                                                            </Text>
                                                        );
                                                    })
                                                }
                                            </Text>
                                            <br/>
                                            <Link
                                                onClick={() => {
                                                    openExternalUrl(`${githubBase}${licenseUrl}`);
                                                }}
                                            >
                                                {license}
                                            </Link>
                                            <br/>
                                            <Divider/>
                                        </div>
                                    );
                                })
                            }
                        </div>
                    </Card>
                </div>
            }/>
    );
});

AppLicenseNotices.displayName = 'AppLicenseNotices';

export default AppLicenseNotices;
