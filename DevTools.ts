import {homedir, platform} from "node:os";
import {existsSync} from "node:fs";
import {join} from "node:path";

const homeDir:string = homedir();

/**
 * 获取本地浏览器扩展的存储路径(推荐使用 Microsoft Edge 或 Google Chrome)
 */
const getLocalBrowserExtensionsPath = (): string => {
    switch (platform()) {
        case 'win32':
            return join(homeDir, 'AppData', 'Local', 'Microsoft', 'Edge', 'User Data', 'Default', 'Extensions');
        case 'darwin':
            return join(homeDir, 'Library', 'Application Support', 'Microsoft Edge', 'Default', 'Extensions');

        default:
            return '';
    }
};

const REACT_DEVTOOLS_ID: string = 'gpphkfbcpidddadnkolkpfckpihlkkil/6.1.2_0'; // React DevTools
const REDUX_DEVTOOLS_ID: string = 'nnkgneoiohoecpdiaponcejilbhhikei/3.2.10_0';// Redux DevTools
const extensionsPaths: string[] = [];
const browserExtensionsPath: string = getLocalBrowserExtensionsPath();

if (process.env.NODE_ENV === "development") {
    if (existsSync(join(browserExtensionsPath, REACT_DEVTOOLS_ID)))
        extensionsPaths.push(join(browserExtensionsPath, REACT_DEVTOOLS_ID));

    if (existsSync(join(browserExtensionsPath, REDUX_DEVTOOLS_ID)))
        extensionsPaths.push(join(browserExtensionsPath, REDUX_DEVTOOLS_ID));
}

export default extensionsPaths;
