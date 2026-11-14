import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync} from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);

// 本机自签，让 .msix 能直接 Add-AppxPackage；商店提交用的包不签名。
// 证书身份不写死，从包里的 AppxManifest.xml 读出来反推。

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

    if (candidates.length === 0) {
        console.error('[sign:msix] 找不到 .msix，请先 pnpm run make:msix');
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

// 走 -File 且参数只经环境变量传，不经 shell 拼接。
// 落盘必须带 BOM：PS 5.1 读无 BOM 的 .ps1 按本机 ANSI 代码页解码，正文里任何非 ASCII
// （含中文注释）都会串位到语法上，报出来的是不相干的 Null 引用错——所以 PS 正文只写 ASCII。
const runPowerShell = (name, body, env) => {
    const scriptPath = path.join(OUT_DIR, `.${name}.ps1`);

    writeFileSync(scriptPath, `\uFEFF${body}`, 'utf8');
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
Write-Output ("NAME=" + $doc.Package.Identity.Name)
Write-Output ("PUBLISHER=" + $doc.Package.Identity.Publisher)
`, {QM_MSIX: msix, QM_MANIFEST: MANIFEST});

const identity = /^NAME=(.+)$/m.exec(readManifest)?.[1]?.trim();
const publisher = /^PUBLISHER=(.+)$/m.exec(readManifest)?.[1]?.trim();

if (!identity || !publisher) {
    console.error('[sign:msix] 从包里读不到 <Identity Name/Publisher>');
    process.exit(1);
}

// 身份和 forge.config.js 对不上说明手里是旧身份构建的包：本机自签照样验通，Partner Center 按 Name/Publisher 拒收
const manifestVars = require('../forge.config.js').makers
    .find((maker) => maker.name === '@electron-forge/maker-msix')?.config?.manifestVariables ?? {};
const expectPublisher = (manifestVars.publisher ?? '').replace(/^CN=/, '');

if (identity !== manifestVars.packageIdentity || publisher.replace(/^CN=/, '') !== expectPublisher) {
    console.error('[sign:msix] 包身份和 forge.config.js 对不上：');
    console.error(`  包里     Name=${identity}  Publisher=${publisher}`);
    console.error(`  配置里   Name=${manifestVars.packageIdentity}  Publisher=${manifestVars.publisher}`);
    console.error('[sign:msix] 用当前配置重新 pnpm run make:msix，别拿旧包签名。');
    process.exit(1);
}

console.log(`[sign:msix] 包：${msix}`);
console.log(`[sign:msix] 清单已导出：${MANIFEST}`);
console.log(`[sign:msix] 包名：${identity}`);
console.log(`[sign:msix] 发布者：${publisher}`);

// Appx 要的是 Code Signing EKU，本机 -Type 只认 CodeSigningCert（教程常见的 DocumentSigningCert 会被枚举拒掉）。
// New-SelfSignedCertificate 的返回对象不可靠，建完一律回 CurrentUser\My 按主题重取。
const certReport = runPowerShell('cert', `
$ErrorActionPreference = 'Stop'
$secure = ConvertTo-SecureString -String $env:QM_PASSWORD -Force -AsPlainText
$findCert = { Get-ChildItem Cert:\\CurrentUser\\My | Where-Object { $_.Subject -eq $env:QM_PUBLISHER } | Sort-Object NotAfter -Descending | Select-Object -First 1 }
$cert = & $findCert
if ($null -eq $cert) {
    $null = New-SelfSignedCertificate -Subject $env:QM_PUBLISHER -FriendlyName 'QM-Transform local MSIX test cert' -Type CodeSigningCert -KeyUsage DigitalSignature -KeySpec Signature -KeyExportPolicy Exportable -HashAlgorithm SHA256 -NotAfter (Get-Date).AddYears(3) -CertStoreLocation 'Cert:\\CurrentUser\\My'
    $cert = & $findCert
    if ($null -eq $cert) { throw "certificate with subject $env:QM_PUBLISHER is not in CurrentUser\\My after creation" }
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
console.log(`[sign:msix] 安装：Add-AppxPackage -Path '${msix}'；卸载：Get-AppxPackage -Name '${identity}' | Remove-AppxPackage`);
console.log(`[sign:msix] 本机签名完成。`);
