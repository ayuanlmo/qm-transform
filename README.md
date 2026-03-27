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
    - Check for updates (via `GitHub`)
- 🔓 **Fully offline capable**: All features work without internet after installation
- 📦 **FFmpeg built-in and statically linked**: No need to download codecs online

---

## ✨ Core Features

### 🎬 Highlights

- ✅ **Video format conversion**: MP4, AVI, MKV, MOV, WEBM and more mainstream formats
- ✅ **Audio format conversion**: MP3, AAC, WAV, FLAC, OGG for high-quality audio conversion

### 🚀 Technical Advantages

| Feature                                 | Description                                                                               |
|-----------------------------------------|-------------------------------------------------------------------------------------------|
| 🎨 **Fluent UI**                        | Based on Microsoft Fluent Design, beautiful and consistent                                |
| 🌓 **Smart themes**                     | Auto / Light / Dark mode, adapts to system preferences                                    |
| ⚡ **GPU hardware acceleration**         | Windows (Intel/NVIDIA/AMD) + macOS (Apple Silicon)                                        |
| 🌍 **10 languages**                     | Chinese (Simplified/Traditional/HK), English, 日本語, 한국어, Deutsch, Français, Русский, Suomi |
| 📦 **Built-in FFmpeg**                  | No manual installation required, ready out of the box                                     |
| 🎯 **Parallel task processing**         | Convert multiple files simultaneously, fully utilizes CPU/GPU                             |
| ⚙️ **Advanced parameter configuration** | Custom resolution, bitrate, frame rate, sample rate, etc.                                 |
| 📱 **Cross-platform**                   | Windows 10+ & macOS 10.15+ (Apple Silicon)                                                |

---

## 🆚 v2.0 vs v1.x: Major Upgrade

| Feature       | v1.x            | v2.0                              |
|---------------|-----------------|-----------------------------------|
| **UI**        | Legacy UI       | **Fluent UI redesign** ✨          |
| **Platform**  | Single platform | **Windows + macOS** 🌐            |
| **FFmpeg**    | Manual install  | **Built-in integration** 📦       |
| **Theme**     | Fixed dark      | **Auto/Dark/Light modes** 🌓      |
| **Encoding**  | CPU only        | **CPU + GPU acceleration** ⚡      |
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

### System Requirements
- **Windows**: Windows 10 x64 or higher
- **macOS**: macOS 10.15 (macOS Big Sur) or higher
- **RAM**: ≥ 4 GB (8 GB recommended for best performance)
- **Storage**: ≥ 1 GB available space

---

## 🖥️ Platform Differences

| Feature               | Windows              | macOS                      |
|-----------------------|----------------------|----------------------------|
| **Media player path** | Manual configuration | Auto-detect system default |
| **GPU encoding**      | Intel / NVIDIA / AMD | Apple Silicon              |
| **Installation**      | NSIS installer       | DMG drag-and-drop          |

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
- **Build**: CRACO + Electron Builder
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
