import AppConfig from "../conf/AppConfig";

/**
 * i18n key for “reveal in system file UI” — Explorer (Windows), Finder (macOS), generic file manager (Linux / others).
 */

export const getShowInSystemFileManagerI18nKey = (): string => {
    const {platform} = AppConfig;

    if (platform === 'win32') return 'mediaFile.options.showInExplorer';
    if (platform === 'darwin') return 'mediaFile.options.showInFinder';

    return 'mediaFile.options.showInFileManager';
};
