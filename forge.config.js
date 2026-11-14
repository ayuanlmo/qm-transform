const fs = require('fs');
const path = require('path');

/**
 * Electron Forge 配置 —— 只负责 MSIX 这一个产物，交 Microsoft Store 分发。
 * exe（NSIS + latest.yml，electron-updater 依赖它）、mac、linux 仍由 electron-builder 产出，
 * 见 package.json 的 build 段；两条通道各走各的，不要用这里去替代 pnpm build。
 *
 * 用法：pnpm run make:msix
 */

const WIN_KIT_BIN = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';

const APP_NAME = 'QM-Transform';

// 商店身份：这两项必须与 Partner Center 里保留的包名、发布者完全一致，
// 名字不对会被直接拒收，所以留成可覆盖的环境变量而不是写死在代码里。
const MSIX_IDENTITY = process.env.QM_MSIX_IDENTITY ?? 'ayuanlmo.QMTransform';
const MSIX_PUBLISHER = process.env.QM_MSIX_PUBLISHER ?? 'ayuanlmo';
const MSIX_PUBLISHER_DISPLAY_NAME = process.env.QM_MSIX_PUBLISHER_DISPLAY_NAME ?? MSIX_PUBLISHER;

const versionParts = (version) => version.split('.').map((part) => Number.parseInt(part, 10) || 0);

const compareVersions = (a, b) => {
    const pa = versionParts(a);
    const pb = versionParts(b);

    for (let i = 0; i < 4; i += 1) {
        if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
    }
    return 0;
};

/**
 * makeappx/makepri 只在装有 Windows SDK 的机器上存在，且每个开发机的 SDK 版本不同。
 * 取本机最新一个确实带 makeappx.exe 的版本；可用 QM_WINDOWS_KIT_VERSION 固定。
 * 找不到就返回 undefined，让下游报它自己的错（非 Windows 机器上不该在这里炸）。
 */
const findWindowsKitVersion = () => {
    if (process.platform !== 'win32') return undefined;
    if (process.env.QM_WINDOWS_KIT_VERSION) return process.env.QM_WINDOWS_KIT_VERSION;
    if (!fs.existsSync(WIN_KIT_BIN)) return undefined;

    const candidates = fs.readdirSync(WIN_KIT_BIN)
        .filter((entry) => /^\d+\.\d+\.\d+\.\d+$/.test(entry))
        .filter((entry) => fs.existsSync(path.join(WIN_KIT_BIN, entry, 'x64', 'makeappx.exe')))
        .sort(compareVersions);

    return candidates.length > 0 ? candidates[candidates.length - 1] : undefined;
};

// 进包的根条目：build/ 是 tsc + CRA 的产物，LICENSE 是 Electron 附带的许可
const INCLUDED_ROOT_ENTRIES = new Set(['build', 'node_modules', 'package.json', 'LICENSE']);

// node_modules 下这些子目录跟运行无关：pnpm 的虚拟store、CRA 的编译缓存、npm 的 shim
const IGNORED_NODE_MODULES_ENTRIES = new Set(['.pnpm', '.cache', '.bin', '.package-lock.json']);

// 打包暂存目录。默认放在 out/ 的同卷兄弟目录：packager 收尾是 rename(staging -> out/xxx)，
// 跨卷时 rename 报 EXDEV，它退化成"逐个复制 + 删除目标"，几百 MB 的 app.asar 一走这条路，
// 杀软还握着上一轮的文件就当场 EBUSY。同卷就是一次 rename，不复制也不删。
const PACKAGER_STAGING_DIR = process.env.QM_PACKAGER_TMPDIR ?? path.resolve(__dirname, '..', 'qm-msix-staging');

module.exports = {
    packagerConfig: {
        name: APP_NAME,
        tmpdir: PACKAGER_STAGING_DIR,
        appVersion: require('./package.json').version,
        icon: path.resolve('public/favicon.ico'),
        asar: {
            // 这两个包在运行时是被直接 spawn 的二进制，留在 asar 里 spawn 不了；
            // bin/Ffmpeg.ts 会把 app.asar 改写成 app.asar.unpacked。
            unpack: '**/node_modules/{ffmpeg-static,ffprobe-static}/**'
        },
        // 运行时真正需要的只有 build/（tsc + CRA 的产物）、生产依赖和 package.json。
        // 逐条列黑名单漏一项就往包里塞几百 MB（实测 node_modules/.cache 一项就 548MB），
        // 所以改成根目录白名单：没点名的根条目一律不进包。
        ignore: (filePath) => {
            const relative = filePath.replace(/^\/+/, '');

            if (relative === '') return false;

            const [top] = relative.split('/');

            if (!INCLUDED_ROOT_ENTRIES.has(top)) return true;

            if (top === 'node_modules') {
                const [, second] = relative.split('/');

                if (second !== undefined && IGNORED_NODE_MODULES_ENTRIES.has(second)) return true;
            }
            return false;
        }
    },
    makers: [
        {
            name: '@electron-forge/maker-msix',
            enabledForPlatforms: ['win32'],
            config: {
                // 商店会重新签名，本地既没有也不该有发布证书，所以出一个未签名包
                sign: false,
                logLevel: 'warn',
                windowsKitVersion: findWindowsKitVersion(),
                // 磁贴/Logo 的输入资源，跟 public/ 里的图标同级：由人准备、构建只读取，
                // 不是构建产物，所以要进版本库（名字和尺寸是 MSIX 清单里写死的那一套）。
                packageAssets: path.resolve('resources/msix/assets'),
                manifestVariables: {
                    packageIdentity: MSIX_IDENTITY,
                    publisher: MSIX_PUBLISHER,
                    publisherDisplayName: MSIX_PUBLISHER_DISPLAY_NAME,
                    packageDisplayName: APP_NAME,
                    appDisplayName: APP_NAME,
                    packageBackgroundColor: 'transparent',
                    // Electron 35 只支持 Windows 10 1809 及以上，再低装了也跑不起来
                    packageMinOSVersion: '10.0.17763.0',
                    packageMaxOSVersionTested: '10.0.26200.0'
                }
            }
        }
    ]
};
