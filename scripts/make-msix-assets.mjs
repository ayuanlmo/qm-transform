import {platform} from 'node:os';
import {spawnSync} from 'node:child_process';
import {copyFileSync, existsSync, mkdirSync, mkdtempSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';

/**
 * 重做 MSIX 的横向图（Wide310x150Logo / SplashScreen 共 4 张）。
 *
 * 零依赖：解码/绘制/编码都走 Windows 自带的 System.Drawing。
 * SplashScreen 和 Wide310x150Logo 内容相同，是规范建议的做法（启动画面用宽磁贴的放大版）。
 */

void (() => {
    if (platform() !== 'win32')
        process.exit(1);

    const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
    const SRC = process.env.QM_MSIX_ASSET_SRC ?? join(ROOT, 'public', 'icon.png');
    const OUT_DIR = join(ROOT, 'resources', 'msix', 'assets');
    const SMALL = {width: 310, height: 150};
    const BIG = {width: SMALL.width * 2, height: SMALL.height * 2};
    const BASENAMES = ['Wide310x150Logo', 'SplashScreen'];
    const FIELD_TOP = process.env.QM_MSIX_ASSET_FIELD_TOP ?? '0,96,225';
    const FIELD_BOTTOM = process.env.QM_MSIX_ASSET_FIELD_BOTTOM ?? '0,58,160';
    const TILE_RATIO = Number(process.env.QM_MSIX_ASSET_TILE_RATIO ?? '0.78');

    if (!existsSync(SRC)) {
        console.error(`[make:msix-assets] 找不到源图：${SRC}`);
        console.error('[make:msix-assets] 可以用 QM_MSIX_ASSET_SRC 指定别的源图');
        process.exit(1);
    }
    mkdirSync(OUT_DIR, {recursive: true});

    const backup = join(mkdtempSync(join(os.tmpdir(), 'qm-msix-assets-')), 'before');

    mkdirSync(backup, {recursive: true});
    for (const base of BASENAMES) {
        for (const suffix of ['', '.scale-200']) {
            const from = join(OUT_DIR, `${base}${suffix}.png`);

            if (existsSync(from)) copyFileSync(from, join(backup, `${base}${suffix}.png`));
        }
    }

    const PS = `
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$src = New-Object System.Drawing.Bitmap $env:QM_ASSET_SRC

function Rect([int]$x, [int]$y, [int]$w, [int]$h) {
    New-Object System.Drawing.Rectangle $x, $y, $w, $h
}

function Begin-Draw([int]$w, [int]$h) {
    $bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    return $g, $bmp
}

function Color([string]$text) {
    $p = $text -split ','
    [System.Drawing.Color]::FromArgb([int]$p[0], [int]$p[1], [int]$p[2])
}

function Render-Wide([int]$w, [int]$h) {
    $g, $bmp = Begin-Draw $w $h

    $top = Color $env:QM_FIELD_TOP
    $bottom = Color $env:QM_FIELD_BOTTOM
    $brush = New-Object System.Drawing.Drawing2D.LinearGradientBrush (
        (Rect 0 0 $w $h), $top, $bottom, [System.Drawing.Drawing2D.LinearGradientMode]::Vertical)
    $g.FillRectangle($brush, 0, 0, $w, $h)
    $brush.Dispose()

    $tile = [int]($h * [double]$env:QM_TILE_RATIO)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.DrawImage($src,
        (Rect ([int](($w - $tile) / 2)) ([int](($h - $tile) / 2)) $tile $tile),
        (Rect 0 0 $src.Width $src.Height),
        ([System.Drawing.GraphicsUnit]::Pixel))
    $g.Dispose()
    return $bmp
}

function Save([System.Drawing.Bitmap]$bmp, [int]$w, [int]$h, [string]$name) {
    $target = $bmp
    if ($bmp.Width -ne $w -or $bmp.Height -ne $h) {
        $g, $scaled = Begin-Draw $w $h
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.DrawImage($bmp, (Rect 0 0 $w $h), (Rect 0 0 $bmp.Width $bmp.Height), ([System.Drawing.GraphicsUnit]::Pixel))
        $g.Dispose()
        $target = $scaled
    }
    $target.Save((Join-Path $env:QM_ASSET_OUT $name), [System.Drawing.Imaging.ImageFormat]::Png)
    if ($target -ne $bmp) { $target.Dispose() }
    Write-Output ("WROTE " + $name + " " + $w + "x" + $h)
}

foreach ($base in $env:QM_ASSET_BASENAMES -split ';') {
    $big = Render-Wide ([int]$env:QM_BIG_W) ([int]$env:QM_BIG_H)
    Save $big ([int]$env:QM_BIG_W) ([int]$env:QM_BIG_H) ($base + '.scale-200.png')
    Save $big ([int]$env:QM_SMALL_W) ([int]$env:QM_SMALL_H) ($base + '.png')
    $big.Dispose()
}
$src.Dispose()
`;

    const workDir = mkdtempSync(join(os.tmpdir(), 'qm-msix-assets-'));
    const scriptFile = join(workDir, 'render.ps1');

    writeFileSync(scriptFile, PS, 'utf8');

    const run = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptFile], {
        encoding: 'utf8',
        env: {
            ...process.env,
            QM_ASSET_SRC: SRC,
            QM_ASSET_OUT: OUT_DIR,
            QM_ASSET_BASENAMES: BASENAMES.join(';'),
            QM_FIELD_TOP: FIELD_TOP,
            QM_FIELD_BOTTOM: FIELD_BOTTOM,
            QM_TILE_RATIO: String(TILE_RATIO),
            QM_SMALL_W: String(SMALL.width),
            QM_SMALL_H: String(SMALL.height),
            QM_BIG_W: String(BIG.width),
            QM_BIG_H: String(BIG.height)
        }
    });

    rmSync(workDir, {recursive: true, force: true});

    for (const line of (run.stdout ?? '').split(/\r?\n/)) if (line.trim()) console.log(`[make:msix-assets] ${line.trim()}`);
    if (run.status !== 0) {
        console.error(`[make:msix-assets] 渲染失败（exit ${run.status ?? '被信号终止'}）`);
        console.error(run.stderr ?? '');
        console.error(`[make:msix-assets] 原图备份在 ${backup}`);
        process.exit(1);
    }

    console.log(`[make:msix-assets] 覆盖前的图备份在 ${backup}`);
    console.log('[make:msix-assets] 要进包得重跑：pnpm run make:msix && pnpm run sign:msix');

})();
