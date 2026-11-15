import {api} from '@electron-forge/core';
import {createRequire} from 'node:module';
import {rmSync} from 'node:fs';
import {join, resolve} from 'node:path';
import {platform} from "node:os";

// 不走 `electron-forge make`：CLI 的自检用 `pnpm config get node-linker`，而 pnpm 10 只读全局配置，
// 看不见本项目 .npmrc 里的 hoisted，布局正确也会被判不合格。

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

    // maker 落盘用 rename，目标已存在就失败；版本号不变时上一轮的产物名一模一样
    const artifactBaseName = `${appName}-win32-x64-${require('../package.json').version}`;
    const previousArtifact = join(OUT_DIR, 'make', 'msix', 'x64', `${artifactBaseName}.msix`);

    try {
        rmSync(previousArtifact, {force: true});
    } catch (e) {
        if (e.code !== 'EPERM' && e.code !== 'EBUSY') throw e;

        // 编辑器握着旧包的句柄且没开 FILE_SHARE_DELETE，这种文件删不掉也改名；换个文件名继续出产物
        process.env.QM_MSIX_OUTPUT_BASE_NAME = `${artifactBaseName}-${Date.now()}`;
        console.error(`[make:msix] ${previousArtifact} 被其他进程独占，删不掉`);
        console.error(`[make:msix] 本轮改写到 ${process.env.QM_MSIX_OUTPUT_BASE_NAME}.msix`);
        console.error('[make:msix] 要清掉旧包：先关掉编辑器（或把 dist 标为 excluded），再手动删');
    }

    const results = await api.make({
        dir: process.cwd(),
        platform: 'win32',
        arch: 'x64',
        outDir: OUT_DIR
    });

    for (const result of results)
        for (const artifact of result.artifacts)
            console.log(`[make:msix] ${artifact}`);

// Forge 留下的句柄会让 node 不退出，产物此时已经落盘
    process.exit(0);
})();
