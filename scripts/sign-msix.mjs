import {spawnSync} from 'node:child_process';
import {existsSync, readdirSync, statSync} from 'node:fs';
import path from 'node:path';

/**
 * 本机自签：出 devcert.pfx / devcert.cer，把 dist/msix 里那枚 .msix 签成能直接 Add-AppxPackage 的包。
 * 签名仅用于本地测试，避免0x80073CF9 导致无法安装
 *
 * Publisher不写死，而是从包里的 AppxManifest.xml 读出来反推证书。
 */

const OUT_DIR = path.resolve('dist', 'msix');
const MANIFEST = path.join(OUT_DIR, 'AppxManifest.xml');
const PFX = path.join(OUT_DIR, 'devcert.pfx');
const CER = path.join(OUT_DIR, 'devcert.cer');
const PASSWORD = process.env.QM_MSIX_CERT_PASSWORD ?? 'qm-transform-dev';

const findMsix = () => {
    const given = process.argv[2];

    if (given !== undefined) return path.resolve(given);

    const dir = path.join(OUT_DIR, 'make', 'msix', 'x64');
    const candidates = existsSync(dir)
        ? readdirSync(dir).filter((f) => f.endsWith('.msix')).map((f) => path.join(dir, f))
        : [];

    // 未构建？？
    if (candidates.length === 0) {
        console.log(':[sign:msix] 找不到构建目标，请先构建后再试。');
        process.exit(1);
    }
    return candidates.sort((a, b) => statSync(b).mtimeMs - statSync(a).mtimeMs)[0];
};

const findSignTool = () => {
    if (process.env.QM_SIGNTOOL) return process.env.QM_SIGNTOOL;

    const binRoot = 'C:\\Program Files (x86)\\Windows Kits\\10\\bin';

    if (!existsSync(binRoot)) {
        console.error('[sign:msix] 找不到 Windows Kits，装 Windows SDK 或用 QM_SIGNTOOL 指定 signtool.exe');
        process.exit(1);
    }

    const versionParts = (v) => v.split('.').map((p) => Number.parseInt(p, 10) || 0);
    const versions = readdirSync(binRoot)
        .filter((entry) => /^\d+\.\d+\.\d+\.\d+$/.test(entry))
        .filter((entry) => existsSync(path.join(binRoot, entry, 'x64', 'signtool.exe')))
        .sort((a, b) => {
            const [pa, pb] = [versionParts(a), versionParts(b)];

            for (let i = 0; i < 4; i += 1) if ((pa[i] ?? 0) !== (pb[i] ?? 0)) return (pa[i] ?? 0) - (pb[i] ?? 0);
            return 0;
        });

    if (versions.length === 0) {
        console.error(`[sign:msix] ${binRoot} 下没有带 x64\\signtool.exe 的 SDK 版本`);
        process.exit(1);
    }
    return path.join(binRoot, versions[versions.length - 1], 'x64', 'signtool.exe');
};

/**
 * PowerShell 一律走 -File，脚本内容是写死的字符串，参数只通过环境变量传，
 * 这样不经 shell 拼接，也不会有引号被吃掉的问题。
 */
const runPowerShell = (name, body, env) => {
    const scriptPath = path.join(OUT_DIR, `.${name}.ps1`);

    writeFileSync(scriptPath, body, 'utf8');
    const proc = spawnSync('powershell', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', scriptPath], {
        encoding: 'utf8',
        env: {...process.env, ...env}
    });

    rmSync(scriptPath, {force: true});
    if (proc.status !== 0) {
        console.error(`[sign:msix] ${name} 失败：\n${proc.stdout ?? ''}${proc.stderr ?? ''}`);
        process.exit(1);
    }
    return proc.stdout;
};

const msix = findMsix();
const signtool = findSignTool();

mkdirSync(OUT_DIR, {recursive: true});

const readManifest = runPowerShell('manifest', `
Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($env:QM_MSIX)
$entry = $zip.Entries | Where-Object { $_.FullName -eq 'AppxManifest.xml' }
$reader = New-Object System.IO.StreamReader($entry.Open())
$xml = $reader.ReadToEnd()
$reader.Close()
$zip.Dispose()
Set-Content -Path $env:QM_MANIFEST -Value $xml -Encoding UTF8
[xml]$doc = $xml
Write-Output ("PUBLISHER=" + $doc.Package.Identity.Publisher)
`, {QM_MSIX: msix, QM_MANIFEST: MANIFEST});

const publisher = /^PUBLISHER=(.+)$/m.exec(readManifest)?.[1]?.trim();

if (!publisher) {
    console.error('[sign:msix] 从包里读不到 <Identity Publisher>');
    process.exit(1);
}
console.log(`[sign:msix] 包：${msix}`);
console.log(`[sign:msix] 清单已导出：${MANIFEST}`);
console.log(`[sign:msix] 发布者：${publisher}`);

const certReport = runPowerShell('cert', `
$ErrorActionPreference = 'Stop'
$secure = ConvertTo-SecureString -String $env:QM_PASSWORD -Force -AsPlainText
$cert = Get-ChildItem Cert:\\CurrentUser\\My |
    Where-Object { $_.Subject -eq $env:QM_PUBLISHER } |
    Sort-Object NotAfter -Descending |
    Select-Object -First 1
if ($null -eq $cert) {
    $cert = New-SelfSignedCertificate -Subject $env:QM_PUBLISHER -FriendlyName 'QM-Transform local MSIX test cert' -Type DocumentSigningCert -KeyUsage DigitalSignature -KeyExportPolicy Exportable -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(3) -CertStoreLocation Cert:\\CurrentUser\\My
    Write-Output ("CREATED=" + $cert.Thumbprint)
} else {
    Write-Output ("REUSED=" + $cert.Thumbprint)
}
Remove-Item -Force -ErrorAction SilentlyContinue $env:QM_PFX, $env:QM_CER
Export-Certificate -Cert $cert -FilePath $env:QM_CER | Out-Null
Export-PfxCertificate -Cert $cert -FilePath $env:QM_PFX -Password $secure | Out-Null
`, {QM_PUBLISHER: publisher, QM_PASSWORD: PASSWORD, QM_PFX: PFX, QM_CER: CER});

console.log(`[sign:msix] 证书：${PFX} / ${CER}（口令来自 QM_MSIX_CERT_PASSWORD，默认 qm-transform-dev）`);
console.log(certReport.trim());

const sign = spawnSync(signtool, ['sign', '/fd', 'SHA256', '/f', PFX, '/p', PASSWORD, msix], {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe']
});

console.log(sign.stdout ?? '');
if (sign.status !== 0) {
    console.error(`[sign:msix] signtool 失败：\n${sign.stderr ?? ''}`);
    process.exit(1);
}

const report = runPowerShell('verify', `
$ErrorActionPreference = 'Stop'
$sig = Get-AuthenticodeSignature $env:QM_MSIX
Write-Output ("STATUS=" + $sig.Status)
Write-Output ("SIGNER=" + $sig.SignerCertificate.Subject)
$store = @(Get-ChildItem Cert:\\CurrentUser\\TrustedPeople -ErrorAction SilentlyContinue)
$store += @(Get-ChildItem Cert:\\LocalMachine\\TrustedPeople -ErrorAction SilentlyContinue)
$trusted = @($store | Where-Object { $_.Subject -eq $env:QM_PUBLISHER })
Write-Output ("TRUSTED=" + $trusted.Count)
`, {QM_MSIX: msix, QM_PUBLISHER: publisher});

console.log(report.trim());

if (/^TRUSTED=0$/m.test(report)) {
    console.log('');
    console.log(`[sign:msix] 这台机器还不信任这张证书，Add-AppxPackage 会报 0x80073CF9。用管理员 PowerShell 执行：`);
    console.log(`  Import-Certificate -FilePath '${CER}' -CertStoreLocation Cert:\\LocalMachine\\TrustedPeople`);
}
console.log('');
console.log(`[sign:msix] 安装：Add-AppxPackage -Path '${msix}'；卸载：Get-AppxPackage -Name '*QMTransform*' | Remove-AppxPackage`);
console.log(`[sign:msix] 本机签名完成。`);
