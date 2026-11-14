import {existsSync, readdirSync, readFileSync} from 'node:fs';
import {createServer} from 'node:http';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * 本地更新源：把 dist/ 当成 GitHub Release 的下载目录喂给 electron-updater，
 * 于是 latest.yml → 下载安装包 → 重启安装 这条链路能在开发环境里跑完，
 * 不必为了验证更新先真的发布一个版本。
 *
 * 用法（两个终端）：
 *   pnpm run serve:updates
 *   QM_DEV_UPDATE_URL=http://127.0.0.1:8099 pnpm start
 *
 * 元数据里的版本号必须高于本机 package.json 的版本，否则永远只会得到「暂无更新」。
 * 用 QM_UPDATE_FAKE_VERSION 覆盖它，省掉手改 package.json 那一步。
 */

void (() => {
    const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const DIST = resolve(process.env.QM_UPDATE_SERVE_DIR ?? join(ROOT, 'dist'));
    const PORT = Number(process.env.QM_UPDATE_PORT ?? '8099');
    const FAKE_VERSION = process.env.QM_UPDATE_FAKE_VERSION;

    if (!existsSync(DIST)) {
        console.error(`[serve:updates] 找不到目录：${DIST}`);
        console.error('[serve:updates] 先跑 pnpm build，或用 QM_UPDATE_SERVE_DIR 指定别的目录');
        process.exit(1);
    }

    const META_RE = /^latest(-\w+)?\.yml$/i;
    const names = readdirSync(DIST);
    const metaFiles = names.filter((n) => META_RE.test(n));

    if (metaFiles.length === 0) {
        console.error(`[serve:updates] ${DIST} 里没有 latest*.yml 更新元数据，electron-updater 上来就会 404。`);
        console.error('[serve:updates] 这正是更新检查失败的第一个原因：发布时只传了安装包，没传 latest.yml。');
        process.exit(1);
    }

    const appVersion = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')).version;

    // 版本号比大小，相等或更小都只会得到「暂无更新」
    const isNewer = (a, b) => {
        const parts = (v) => String(v).split(/[.-]/).map((i) => Number(i) || 0);
        const pa = parts(a);
        const pb = parts(b);

        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            const x = pa[i] ?? 0;
            const y = pb[i] ?? 0;

            if (x !== y)
                return x > y;
        }

        return false;
    };

    for (const meta of metaFiles) {
        const text = readFileSync(join(DIST, meta), 'utf8');
        const served = FAKE_VERSION ?? /^version: (.*)$/m.exec(text)?.[1] ?? '?';
        // 元数据引用的安装包必须真在目录里，否则检查通过后下载这一步 404：
        // 手改过资产名的人只会看到「更新失败」，看不到是自己把名字改岔了。
        // url 和 path 指的是同一个文件，去重后只报一次
        const refs = [...new Set(
            [...text.matchAll(/^\s*(?:-\s*)?(?:url|path):\s*(.+)$/gm)]
                .map((m) => m[1].trim())
                .filter((r) => !r.endsWith('.yml'))
        )];

        console.log(`[serve:updates] ${meta} → version ${served}，本机应用版本 ${appVersion}`);

        if (!isNewer(served, appVersion))
            console.warn(`[serve:updates] ${served} 不比 ${appVersion} 新，检查只会返回「暂无更新」；用 QM_UPDATE_FAKE_VERSION 抬高它`);

        for (const ref of refs) {
            if (names.includes(ref))
                continue;

            console.error(`[serve:updates] ${meta} 引用了 ${ref}，但 ${DIST} 里没有这个文件。`);
            console.error('[serve:updates] 安装包名由 build.nsis.artifactName 决定，别手改；改名后 latest.yml 里的 url 就对不上了。');
        }
    }

    // 只认文件名：请求路径里带了目录一律取 basename，拼不出目录外的路径
    const targetOf = (url) => {
        const raw = decodeURIComponent(new URL(url, `http://127.0.0.1:${PORT}`).pathname);
        const name = raw.split('/').filter(Boolean).pop() ?? '';

        return name.includes('\\') || name.includes('/') ? null : join(DIST, name);
    };

    const bodyOf = (file, name) => {
        const buf = readFileSync(file);

        if (!FAKE_VERSION || !META_RE.test(name))
            return buf;

        // 只换版本号，sha512 描述的还是同一个安装包，校验照样过
        return Buffer.from(
            buf.toString('utf8').replace(/^version: .*$/m, `version: ${FAKE_VERSION}`),
            'utf8'
        );
    };

    const server = createServer((req, res) => {
        const file = targetOf(req.url ?? '/');
        const name = file === null ? '' : file.slice(DIST.length + 1);

        if (file === null || !existsSync(file)) {
            res.writeHead(404, {'Content-Type': 'text/plain'});
            res.end(`not found: ${name}\n`);
            console.log(`404 ${req.method} ${req.url} —— dist 里没有这个文件名`);

            return;
        }

        const body = bodyOf(file, name);
        const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '');
        const head = {
            'Content-Type': name.endsWith('.yml') ? 'text/yaml' : 'application/octet-stream',
            'Accept-Ranges': 'bytes'
        };

        if (range && (range[1] !== '' || range[2] !== '')) {
            const from = range[1] === '' ? 0 : Number(range[1]);
            const to = range[2] === '' ? body.length - 1 : Math.min(Number(range[2]), body.length - 1);

            res.writeHead(206, {...head, 'Content-Range': `bytes ${from}-${to}/${body.length}`, 'Content-Length': String(to - from + 1)});
            res.end(body.subarray(from, to + 1));
            console.log(`206 ${req.url} ${from}-${to}/${body.length}`);

            return;
        }

        res.writeHead(200, {...head, 'Content-Length': String(body.length)});
        res.end(req.method === 'HEAD' ? undefined : body);
        console.log(`200 ${req.method} ${req.url} ${body.length} bytes`);
    });

    server.listen(PORT, '127.0.0.1', () => {
        console.log(`[serve:updates] 根目录 ${DIST}`);
        console.log(`[serve:updates] 监听 http://127.0.0.1:${PORT}/`);
        console.log(`[serve:updates] 另开终端：QM_DEV_UPDATE_URL=http://127.0.0.1:${PORT} pnpm run start:update-test`);
    });
})();
