/* eslint-disable */
// 设置 webpack 运行时的 publicPath
// 解决 Electron 打包后按 file:// 协议加载时
// 动态 import 的 chunk 路径变成 file:///script/*.js 而不是 file:///.../build/script/*.js 的问题。

// 在webpack运行时注入的全局变量
declare let __webpack_public_path__: string;

((): void => {
    if (typeof window === 'undefined')
    return;

    if (window.location.protocol !== 'file:')
        return;

    // CRA 的所有脚本都输出到 build/script 目录，入口脚本名里本身已经包含了 "script/" 前缀，
    // 所以这里把 publicPath 设为 "./"，最终请求路径会是 "./script/xxx.js"，
    // 在 Electron 的 file:// 环境下解析为 file:///.../build/script/xxx.js（mac / Windows 通用）。
    __webpack_public_path__ = './';
})();


