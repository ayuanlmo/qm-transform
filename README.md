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

### Installing a test build on Windows

```bash
pnpm run make:msix
pnpm run sign:msix
```

`sign:msix` reads the publisher out of the package manifest, creates a matching development certificate if
you don't have one (`dist/msix/devcert.pfx`), signs the package, and prints the `Add-AppxPackage` command
plus the one-time command to put `devcert.cer` into `TrustedPeople`. It needs `signtool` from the Windows
SDK (`QM_SIGNTOOL` overrides where it is looked for).

A package for Store submission stays **unsigned** — Partner Center signs it. Set the identity from your
Store listing before building it:

```bash
QM_MSIX_IDENTITY=<product identity> QM_MSIX_PUBLISHER=<publisher CN> pnpm run make:msix
```
