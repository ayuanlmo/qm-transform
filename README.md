<div align="center" style="padding-top: 20px">
  <img width="150px" src="public/icon.svg" alt="QM-Transform Logo" />
</div>

<div align="center">

# QM-Transform

✨ Modern, open-source cross-platform media format conversion tool

[English](README.md) | [简体中文](README.zh-CN.md)

[![GitHub Stars](https://img.shields.io/github/stars/ayuanlmo/QM-Transform?logo=github&style=for-the-badge)](https://github.com/ayuanlmo/QM-Transform/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/ayuanlmo/QM-Transform?logo=github&style=for-the-badge)](https://github.com/ayuanlmo/QM-Transform/network/members)
[![License](https://img.shields.io/github/license/ayuanlmo/QM-Transform?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey?style=for-the-badge)](https://github.com/ayuanlmo/QM-Transform/releases)

---

</div>

## 📖 Introduction

**QM-Transform** is a modern media format conversion tool built with **`Electron` + `React` + `FFmpeg`**.  
It offers a clean, friendly, and modern user interface, supporting mainstream video and audio format conversions.

> * `QM-Transform` was previously named lmo-Transform

---

## 🔒 Privacy & Security

**QM-Transform adheres to minimalist and transparent principles. Your files belong to you:**

- 🚫 **No network connection**: The app **does not connect to any remote services** while running
- 🚫 **No telemetry/data collection**: Does not collect user behavior, file information, or device data
- 🚫 **No ads, no promotions, no bundled software**
- ✅ **Only network behavior**:
    - Check for updates (via `GitHub`) — the Microsoft Store build skips it entirely, the Store updates the app
- 🔓 **Fully offline capable**: All features work without internet after installation
- 📦 **FFmpeg built-in and statically linked**: No need to download codecs online

---

## ✨ Core Features

### 🎬 Highlights

- ✅ **Video format conversion**: MP4, AVI, MKV, MOV, WEBM and more mainstream formats
- ✅ **Audio format conversion**: MP3, AAC, WAV, FLAC, OGG for high-quality audio conversion

### 🚀 Technical Advantages

| Feature                                 | Description                                                                                     |
|-----------------------------------------|-------------------------------------------------------------------------------------------------|
| 🎨 **Fluent UI**                        | Based on Microsoft Fluent Design, beautiful and consistent                                      |
| 🌓 **Smart themes**                     | Auto / Light / Dark mode, adapts to system preferences                                          |
| ⚡ **GPU hardware acceleration**        | Windows (Intel/NVIDIA/AMD) + macOS (Apple Silicon)                                              |
| 🌍 **10 languages**                     | Chinese (Simplified/Traditional/HK), English, 日本語, 한국어, Deutsch, Français, Русский, Suomi |
| 📦 **Built-in FFmpeg**                  | No manual installation required, ready out of the box                                           |
| 🎯 **Parallel task processing**         | Convert multiple files simultaneously, fully utilizes CPU/GPU                                   |
| ⚙️ **Advanced parameter configuration** | Custom resolution, bitrate, frame rate, sample rate, etc.                                       |
| 📱 **Cross-platform**                   | Windows 10+ & macOS 10.15+ (Apple Silicon)                                                      |

---

## 🆚 v2.0 vs v1.x: Major Upgrade

| Feature       | v1.x            | v2.0                              |
|---------------|-----------------|-----------------------------------|
| **UI**        | Legacy UI       | **Fluent UI redesign** ✨         |
| **Platform**  | Single platform | **Windows + macOS** 🌐            |
| **FFmpeg**    | Manual install  | **Built-in integration** 📦       |
| **Theme**     | Fixed dark      | **Auto/Dark/Light modes** 🌓      |
| **Encoding**  | CPU only        | **CPU + GPU acceleration** ⚡     |
| **Languages** | Chinese only    | **10 international languages** 🌍 |

---

## 🎯 Feature Details

### 📹 Video Conversion

- Supports H.264, H.265, VP9 and other codecs
- Customizable: resolution, frame rate, bitrate, GOP
- Batch processing + GPU acceleration for significant speed improvement

### 🔊 Audio Conversion

- Full format support: MP3, AAC, WAV, FLAC, OGG
- Adjust quality, sample rate (8k–192k Hz), channel count

### ⚙️ Other

- 📝 **Output naming rules**: e.g. `{filename}_{format}_{date}`
- 📁 **Custom output directory**: Flexible file location management
- 🔄 **Real-time task monitoring**: Progress, status, and error messages at a glance
- 🎮 **Concurrency control**: Dynamically adjust task count based on device performance

---

## 📥 Download & Install (Recommended)

Visit [GitHub Releases](https://github.com/ayuanlmo/QM-Transform/releases) for the latest version:

- **Windows**: `.exe`
- **macOS**: `.dmg` (Apple Silicon only)

Windows builds are also published as `.msix` for the Microsoft Store.

### System Requirements

- **Windows**: Windows 10 x64 or higher
- **macOS**: macOS 10.15 (macOS Big Sur) or higher
- **RAM**: ≥ 4 GB (8 GB recommended for best performance)
- **Storage**: ≥ 1 GB available space

---

## 📦 Windows Package Formats

The app is identical in both formats; only delivery and updates differ.

|              | `.exe` (NSIS)                                                        | `.msix` (Microsoft Store)                                              |
|--------------|----------------------------------------------------------------------|------------------------------------------------------------------------|
| Distribution | [GitHub Releases](https://github.com/ayuanlmo/QM-Transform/releases) | Microsoft Store                                                        |
| Updates      | In-app "Check for Updates"                                           | Handled by the Store; the in-app check is not started                  |
| Install      | Directory you pick during setup                                      | `WindowsApps`, inside an app container                                 |
| Signing      | Not signed (no certificate)                                          | Re-signed by the Store on submission                                   |
| Config       | `%LOCALAPPDATA%\QM-Transform`                                        | Same path, redirected by the OS into the package's `LocalCache` folder |

The path is the same in both formats; inside an MSIX package the operating system points it at the package's own
storage, so settings do not migrate between the `.exe` and the Store build.

---

## 🖥️ Platform Differences

| Feature               | Windows                               | macOS                      |
|-----------------------|---------------------------------------|----------------------------|
| **Media player path** | Manual configuration                  | Auto-detect system default |
| **GPU encoding**      | Intel / NVIDIA / AMD                  | Apple Silicon              |
| **Installation**      | NSIS installer, or MSIX via the Store | DMG drag-and-drop          |
| **Updates**           | In-app check (exe) / Store (MSIX)     | In-app check               |

---

## 📄 License

This project is released under the [Apache-2.0](LICENSE) license.

---

# 🙏 Acknowledgments

Thanks to the following open-source projects:

- [Microsoft Fluent UI](https://github.com/microsoft/fluentui) - UI component library
- [FFmpeg](https://ffmpeg.org/) - Media processing engine
- [Electron](https://www.electronjs.org/) - Desktop app framework
- [React](https://react.dev/) - Frontend framework

For full open-source acknowledgments, see the "License and Open Source" page in the app.

---

# 😨 Having Issues?

- 🐛 [Report a Bug](https://github.com/ayuanlmo/QM-Transform/issues)
- 💡 [Suggest a Feature](https://github.com/ayuanlmo/QM-Transform/issues)

> PS: App translations use machine translation. If you find incorrect translations, please help improve them.

---

# 🥰 Like This Project?

If this project helps you, please consider:

- ⭐ Star this project
- 🍴 Fork this project
- 📢 Share it with others who might need it

---

## 🛠️ Developer Guide

### Tech Stack

- **Frontend**: React 18 + TypeScript + Redux Toolkit
- **UI**: Microsoft Fluent UI
- **Desktop**: Electron
- **Build**: CRACO + Electron Builder (`.exe`/`.dmg`) + Electron Forge (`.msix`)
- **Media engine**: FFmpeg (statically linked)
- **i18n**: i18next

> We recommend using `pnpm` as the package manager
>
> Due to the use of `Node.js API`, the React app cannot run in a browser

### Local Development

```bash
git clone https://github.com/ayuanlmo/QM-Transform.git
cd QM-Transform
pnpm install
pnpm start          # Start development
pnpm build          # Build for production
```

### Packaging

```bash
pnpm build                  # NSIS .exe + latest.yml, .dmg, AppImage/deb -> dist/
pnpm run make:msix          # .msix via Electron Forge + @electron-forge/maker-msix -> dist/msix/
pnpm run sign:msix          # self-sign the .msix so you can install it on this machine
pnpm run make:msix-assets   # regenerate the wide logo / splash screen tiles
```

The two Windows channels are deliberately split: `electron-builder` keeps producing the installer and the
update metadata, while Forge is only used to produce the `.msix`.

Requirements and gotchas for the MSIX channel:

- `.npmrc` must keep `node-linker=hoisted`, and `pnpm.onlyBuiltDependencies` in `package.json` must keep
  `electron` and `ffmpeg-static` — pnpm skips dependency post-install scripts otherwise, so those binaries
  are simply never downloaded and the failure looks unrelated
- Build tooling (`react-scripts` and friends) belongs in `devDependencies`: packaging ships the production
  dependency closure, so a build tool in `dependencies` ends up inside the app package
- Packaging needs a staging directory on the same volume as `dist/` (`QM_PACKAGER_TMPDIR` overrides it)
- Don't run `pnpm start` while packaging, and exclude `dist/` and `out/` from your IDE's indexer — both hold
  open handles on the packaged `app.asar`

### Release artifacts

Publishing a Release runs `.github/workflows/release.yml`: Windows (NSIS), macOS (arm64 dmg) and Linux
(AppImage + deb) build in parallel, and CI attaches every file to that Release verbatim. The MSIX is not part of
it — that channel is packaged locally and handed to Partner Center.

The version comes from the Release itself: its name when the name is a plain `x.y.z`, otherwise its tag (a
leading `v` is ignored). CI writes that version into `package.json` before building, so the installer names, the
running app version and the update metadata always agree:

- `QM-Transform.Setup.<version>.exe`
- `QM-Transform-<version>-arm64.dmg`

A pre-release is rejected before anything is built: `electron-updater` reads `/releases/latest`, which never
lists pre-releases, so there would be nothing to deliver. The repo's `version` no longer has to match the tag —
the Release decides.

Publishing first and building second leaves the Release without binaries for a few minutes. That gap is safe:
with no `latest.yml` in the assets the app reports "no updates" instead of offering a partial build. Shipping
installers without their `latest*.yml` is exactly what broke in-app updates here earlier, which is why CI, not a
person, uploads them.

The dmg is built on a macOS runner and is never notarized — notarization costs an Apple Developer subscription,
which this project does not have — so at best it carries an ad-hoc signature. After downloading, open it via
right-click → Open the first time.

### Testing the update flow locally

```bash
pnpm run serve:updates        # serve dist/ as if it were the release
pnpm run start:update-test    # dev app, update source = http://127.0.0.1:8099
```

`serve:updates` refuses to start when `dist/` has no `latest.yml`, and warns when that file names an installer
that is not in the directory. For an update to be offered, the served version must be newer than the local one;
`QM_UPDATE_FAKE_VERSION=9.9.9 pnpm run serve:updates` rewrites the version line only, so the installer checksum
keeps validating.

### Installing a test build on Windows

```bash
pnpm run make:msix
pnpm run sign:msix
```

`sign:msix` reads the package identity out of the manifest, refuses to sign a package whose `Name`/`Publisher`
differ from `forge.config.js` (an artifact built before the identity was fixed would otherwise get signed and
uploaded anyway), creates a matching development certificate if you don't have one (`dist/msix/devcert.pfx`),
signs the package, and prints the `Add-AppxPackage` command plus the one-time command to put `devcert.cer` into
`TrustedPeople`. It needs `signtool` from the Windows SDK (`QM_SIGNTOOL` overrides where it is looked for).

A package for Store submission stays **unsigned** — Partner Center signs it. The identity in `forge.config.js`
is already the one reserved in the Store dashboard:

| Manifest field | Value |
| --- | --- |
| `Package/Identity/Name` | `ayuanlmo.QM-Transform` |
| `Package/Identity/Publisher` | `CN=56A54446-5F53-4BB5-A40B-063D78E4B992` |
| `Package/Properties/PublisherDisplayName` | `ayuanlmo` |

`Package Family Name` (`ayuanlmo.QM-Transform_k7w7p975xr2dt`) is not configured anywhere — Windows derives it
from the name plus a hash of the publisher. Override the two identity fields only when the reserved values change:

```bash
QM_MSIX_IDENTITY=<product identity> QM_MSIX_PUBLISHER=<publisher CN> pnpm run make:msix
```

### Electron locales in the package

Chromium ships ~55 `locales/*.pak` files (42 MB) holding its own UI strings — context menus, role-based menu
items, and similar. They are unrelated to the app's own i18n, so both packaging channels keep only the languages
the app actually offers, listed once in `package.json` (`build.win.electronLanguages`), which `forge.config.js`
reads for the MSIX channel:

```bash
pnpm run make:msix   # [forge] locales: removed 46, kept 9
```

`en-US` is always kept: it is the fallback Chromium uses when a pak is missing. Users on a system language that
was dropped see English native menus — the app's own interface still follows its language setting. The Store
listing is unaffected either way: the manifest declares a single `<Resource Language="en-US" />`, and the
languages Partner Center asks about come from the listing settings, not from this directory.
