import {platform} from "node:os";

/**
 * @module PackageEnv
 * @description 运行环境判定：同一个二进制可能既作为普通安装包发布，也作为 MSIX 上架，
 * 有些行为（自更新）只在其中一条通道上成立，必须按运行时环境而不是构建脚本来决定。
 * **/

// MSIX（含 sparse packaging / attached launch）的安装位置，electron.exe 的绝对路径会落在这里
const WINDOWS_APPS_PATTERN: RegExp = /[\\/]windowsapps[\\/]/i;

// 部分 Windows 版本/打包形态会把 %LOCALAPPDATA% 直接指到包的 LocalCache；不是普遍行为，只当补充信号
const PACKAGE_LOCAL_CACHE_PATTERN: RegExp = /[\\/]packages[\\/][^\\/]+[\\/]localcache[\\/]/i;

/**
 * @method isStorePackaged
 * @returns {boolean}
 * @description Windows 应用是否运行在 MSIX 容器内。
 *
 * Win32 侧唯一的权威接口是 kernel32 的 GetCurrentPackageFullName，Node 里要拿到它得上原生
 * 插件；这里用两条只在打包运行时才出现的路径特征互为补充：路径判定漏掉的附加启动/稀疏打包
 * 场景，环境变量重定向能兜住，反之亦然。误判的代价只是少一次自更新检查，不会写坏文件。
 * **/
export const isStorePackaged = (): boolean => {
    if (platform() !== 'win32') return false;

    if (WINDOWS_APPS_PATTERN.test(process.execPath)) return true;

    const localAppData: string | undefined = process.env.LOCALAPPDATA;

    return !!localAppData && PACKAGE_LOCAL_CACHE_PATTERN.test(localAppData);
};
