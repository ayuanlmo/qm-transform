import {api} from '@electron-forge/core';
import {createRequire} from 'node:module';
import {rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {platform} from "node:os";

/**
 * 走 Forge 的 Node API 而不是 `electron-forge make` 命令行：
 * CLI 的启动自检用 `pnpm config get node-linker` 判断 pnpm 布局，而 pnpm 10 的
 * `config get` 只读全局配置，看不到本项目的 .npmrc，于是明明已经是 hoisted 布局仍被判为不合格。
 * 安装布局由 .npmrc 保证，这里只做真正的工作。
 */

void (async () => {
    if (platform() !== 'win32')
        process.exit(1);
    const require = createRequire(import.meta.url);
    const OUT_DIR = resolve('dist', 'msix');
    const appName = require('../forge.config').packagerConfig.name;
    const packagedDir = join(OUT_DIR, `${appName}-win32-x64`);

    try {
        rmSync(packagedDir, {recursive: true, force: true});
    } catch (e) {
        console.error(`[make:msix] 无法清空 ${packagedDir}：${e.message}`);
        console.error('[make:msix] 请关掉正在运行的 QM-Transform（打包产物），或把 out/dist 从编辑器索引里排除后重试');
        process.exit(1);
    }

// maker 把成品从临时目录挪到 out 时用的是"目标必须不存在"的语义（rename，已存在直接失败），
// 而同名文件正是上一轮的产物：版本号不变时文件名一模一样，所以这里点名删掉它。
    const previousArtifact = join(OUT_DIR, 'make', 'msix', 'x64', `${appName}-win32-x64-${require('../package.json').version}.msix`);

    rmSync(previousArtifact, {force: true});

    const results = await api.make({
        dir: process.cwd(),
        platform: 'win32',
        arch: 'x64',
        outDir: OUT_DIR
    });

    for (const result of results)
        for (const artifact of result.artifacts)
            console.log(`[make:msix] ${artifact}`);

// make 跑完后仍留有未释放的句柄，node 不会自己退出，产物已经落盘，直接收工
    process.exit(0);
})();
