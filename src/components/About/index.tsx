import * as React from "react";
import {
    ForwardedRef,
    forwardRef,
    ForwardRefExoticComponent,
    RefAttributes,
    useImperativeHandle,
    useRef,
    useState
} from "react";
import Dialog from "../FluentTemplates/Dialog";
import {Button, Divider, Link, Tag} from "@fluentui/react-components";
import {useTranslation} from "react-i18next";
import {useMainEventListener} from "../../bin/Hooks";
import AppLicenseNotices, {IAppLicenseNoticesProps} from "./AppLicenseNotices";
import {openExternalUrl} from "../../utils";
import AppConfig from "../../conf/AppConfig";
import {useSelector} from "react-redux";
import {RootState} from "../../store";

export interface IAboutRef {
    open: () => void;
}

const About: ForwardRefExoticComponent<RefAttributes<IAboutRef>> = forwardRef((_props: {}, ref: ForwardedRef<IAboutRef>): React.JSX.Element => {
    const {t} = useTranslation();
    const [visible, setVisible] = useState(false);
    const appLicenseNoticesRef = useRef<IAppLicenseNoticesProps>(null);
    const {appName} = AppConfig;
    const appVersion: string = useSelector((state: RootState): string => state.app.appVersion);

    const open = () => {
        setVisible(!visible);
    };

    useImperativeHandle(ref, (): IAboutRef => ({
        open
    }));

    useMainEventListener('window:open-about', (): void => {
        open();
    });

    return (
        <Dialog
            title={""}
            open={visible}
            onClose={open}
            surface={
                <div className="app-about">
                    <div className="icon">
                        <img src={window.location.protocol === 'file:' ? './icon.svg' : '/icon.svg'} alt="App Icon"/>
                    </div>
                    <h1 className="app-about-name">{appName}</h1>
                    <p className="app-about-version">
                        App Version: {appVersion || '--'}
                        <Tag
                            style={{
                                marginLeft: '.5rem'
                            }}
                            selected
                            size={'extra-small'}
                        >
                            {AppConfig.arch.toUpperCase()}
                        </Tag>
                    </p>
                    <div className="app-about-update">
                        <Button>{t('about.checkForUpdate')}</Button>
                    </div>
                    <div className={'app-about-license'}>
                        <AppLicenseNotices ref={appLicenseNoticesRef}/>
                        <Link onClick={(): void => {
                            appLicenseNoticesRef.current?.open();
                        }}>
                            {t('about.licenseAndOpenSourceNotices')}
                        </Link>
                    </div>
                    <Divider/>
                    <div className="app-about-repository">
                        <p>
                            <Link onClick={(): void => {
                                openExternalUrl(AppConfig.authorGitHubHome);
                            }}>
                                @ayuanlmo
                            </Link>
                        </p>
                        <p>
                            <Link onClick={(): void => {
                                openExternalUrl(AppConfig.appRepository);
                            }}>
                                {t('about.viewOnGithub')}
                            </Link>
                        </p>
                        <p>
                            <Link onClick={(): void => {
                                openExternalUrl('https://www.zcool.com.cn/u/21673964');
                            }}>
                                @listen_风语（{t('about.designer')}）
                            </Link>
                        </p>
                    </div>
                </div>
            }
        />
    );
});

About.displayName = 'About';

export default About;
