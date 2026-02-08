import * as React from "react";
import {selectMediaFiles} from "../utils";
import {useMainEventListener} from "../bin/Hooks";
import {useTranslation} from "react-i18next";

const DropFiles: React.FC = (): React.JSX.Element => {
    const {t} = useTranslation();

    useMainEventListener<Array<string>>('window:on:select-media-file', (data) => {
        data.forEach(i => {
            console.log(i);
        });
    });

    return (
        <div className={'main-app-drop-file'}>
            <div
                className={'main-app-drop-file-content app_position_relative app_cursor_pointer'}
                onClick={(): void => {
                    selectMediaFiles();
                }}
            >
                <div className={''}>
                    <div className={'main-app-drop-file-content-icon'}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 60 60" fill="none">
                            <path
                                d="M0 30C0 37.9565 3.16071 45.5871 8.7868 51.2132C14.4129 56.8393 22.0435 60 30 60C37.9565 60 45.5871 56.8393 51.2132 51.2132C56.8393 45.5871 60 37.9565 60 30C60 22.0435 56.8393 14.4129 51.2132 8.7868C45.5871 3.16071 37.9565 0 30 0C22.0435 0 14.4129 3.16071 8.7868 8.7868C3.16071 14.4129 0 22.0435 0 30ZM33.1394 18.8363V26.8606H41.1637C41.9963 26.8606 42.7948 27.1914 43.3836 27.7801C43.9723 28.3689 44.3031 29.1674 44.3031 30C44.3031 30.8326 43.9723 31.6311 43.3836 32.2199C42.7948 32.8086 41.9963 33.1394 41.1637 33.1394H33.1394V41.1637C33.1394 41.9963 32.8086 42.7948 32.2199 43.3836C31.6311 43.9723 30.8326 44.3031 30 44.3031C29.1674 44.3031 28.3689 43.9723 27.7801 43.3836C27.1914 42.7948 26.8606 41.9963 26.8606 41.1637V33.1394H18.8363C18.0037 33.1394 17.2052 32.8086 16.6165 32.2199C16.0277 31.6311 15.6969 30.8326 15.6969 30C15.6969 29.1674 16.0277 28.3689 16.6165 27.7801C17.2052 27.1914 18.0037 26.8606 18.8363 26.8606H26.8606V18.8363C26.8606 18.0037 27.1914 17.2052 27.7801 16.6165C28.3689 16.0277 29.1674 15.6969 30 15.6969C30.8326 15.6969 31.6311 16.0277 32.2199 16.6165C32.8086 17.2052 33.1394 18.0037 33.1394 18.8363Z"/>
                        </svg>
                    </div>
                    <div className={'main-app-drop-file-content-message'}>
                        {t('mediaFile.options.clickImportAndDrop')}
                    </div>
                    <div className={'main-app-drop-file-content-desc'}>
                        {t('mediaFile.options.clickImportAndDropDesc')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DropFiles;
