<div align="center" style="padding-top: 20px">
  <img width="150px" src="public/icon.svg" alt="QM-Transform Logo" />
</div>

<div align="center">

# QM-Transform

✨ 现代化、开源的跨平台开源媒体格式转换工具

[English](README.md) | [简体中文](README.zh-CN.md)

[![GitHub Stars](https://img.shields.io/github/stars/ayuanlmo/QM-Transform?logo=github&style=for-the-badge)](https://github.com/ayuanlmo/QM-Transform/stargazers)
[![GitHub Forks](https://img.shields.io/github/forks/ayuanlmo/QM-Transform?logo=github&style=for-the-badge)](https://github.com/ayuanlmo/QM-Transform/network/members)
[![License](https://img.shields.io/github/license/ayuanlmo/QM-Transform?style=for-the-badge)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS-lightgrey?style=for-the-badge)](https://github.com/ayuanlmo/QM-Transform/releases)

---

</div>

## 📖 简介

**QM-Transform** 是一款基于 **`Electron` + `React` + `FFmpeg`** 构建的现代化媒体格式转换工具。  
它提供简洁、友好、现代化的用户界面，支持主流视频与音频格式互转。

> * `QM-Transform` 之前的名称为 lmo-Transform
---

## 🔒 隐私与安全

**QM-Transform 坚持极简与透明原则。您的文件属于您自己：**

- 🚫 **无网络连接**：应用运行时 **不会连接任何远程服务**
- 🚫 **无遥测/数据收集**：不收集用户行为、文件信息、设备数据
- 🚫 **无广告、无推广、无捆绑软件**
- ✅ **仅有的网络行为**：
    - 检查新版本 (使用`GitHub`)；Microsoft Store 版本不做这件事，更新由商店负责
- 🔓 **完全离线可用**：安装后所有功能均可在无网络环境下使用
- 📦 **FFmpeg 内置且静态链接**：无需联网下载编解码器

---

## ✨ 核心特性

### 🎬 功能亮点

- ✅ **视频格式转换**：MP4、AVI、MKV、MOV、WEBM 等主流格式互转
- ✅ **音频格式转换**：MP3、AAC、WAV、FLAC、OGG 等高质量音频转换

### 🚀 技术优势

| 特性                   | 说明                                                                         |
|------------------------|------------------------------------------------------------------------------|
| 🎨 **Fluent UI 界面**  | 基于 Microsoft Fluent Design，美观且一致                                     |
| 🌓 **智能主题**        | 自动 / 浅色 / 深色模式，适配系统偏好                                         |
| ⚡ **GPU 硬件加速**    | Windows（Intel/NVIDIA/AMD） + macOS（Apple Silicon）                         |
| 🌍 **10 种语言**       | 中文（简/繁/港）、English、日本語、한국어、Deutsch、Français、Русский、Suomi |
| 📦 **内置 FFmpeg套件** | 无需手动安装，开箱即用                                                       |
| 🎯 **并行任务处理**    | 多文件同时转换，充分利用 CPU/GPU 资源                                        |
| ⚙️ **高级参数配置**    | 自定义分辨率、码率、帧率、采样率等                                           |
| 📱 **跨平台支持**      | Windows 10+ & macOS 10.15+（Apple Silicon）                                  |

---

## 🆚 v2.0 vs v1.x：重大升级

| 功能     | v1.x       | v2.0                        |
|----------|------------|-----------------------------|
| 用户界面 | 传统 UI    | **Fluent UI 全新设计** ✨   |
| 平台支持 | 单平台     | **Windows + macOS** 🌐      |
| FFmpeg   | 需手动安装 | **内置集成** 📦             |
| 主题     | 固定深色   | **自动/深色/浅色三模式** 🌓 |
| 编码性能 | 仅 CPU     | **CPU + GPU 硬件加速** ⚡   |
| 语言     | 仅中文     | **10 种国际化语言** 🌍      |

---

## 🎯 主要功能详解

### 📹 视频转换

- 支持 H.264、H.265、VP9 等编码
- 可自定义：分辨率、帧率、码率、GOP
- 批量处理 + GPU 加速，速度提升显著

### 🔊 音频转换

- 格式全覆盖：MP3、AAC、WAV、FLAC、OGG
- 调节质量、采样率（8k–192k Hz）、声道数

### ⚙️ 其他

- 📝 **变量命名规则**：如 `{filename}_{format}_{date}`
- 📁 **自定义输出目录**：灵活管理文件位置
- 🔄 **实时任务监控**：进度、状态、错误提示一目了然
- 🎮 **并发控制**：根据设备性能动态调整任务数

---

## 📥 下载与安装（推荐）

前往 [GitHub Releases](https://github.com/ayuanlmo/QM-Transform/releases) 获取最新版：

- **Windows**：`.exe`
- **macOS**：`.dmg`（仅支持Apple Silicon）

Windows 版同时以 `.msix` 形式发布到 Microsoft Store。

### 系统要求

- **Windows**：Windows 10 x64 或更高
- **macOS**：macOS 10.15 (macOS Big Sur) 或更高
- **内存**：≥ 4 GB（建议 8 GB 以获得最佳性能）
- **存储**：≥ 1GB 可用空间

---

## 📦 Windows 两种包格式

应用本体完全相同，区别只在分发和更新方式。

|          | `.exe`（NSIS）                                                       | `.msix`（Microsoft Store）                |
|----------|----------------------------------------------------------------------|-------------------------------------------|
| 分发渠道 | [GitHub Releases](https://github.com/ayuanlmo/QM-Transform/releases) | Microsoft Store                           |
| 更新方式 | 应用内「检查更新」                                                   | 由商店负责，应用内不再启动更新检查        |
| 安装位置 | 安装时您选择的目录                                                   | `WindowsApps`，运行在应用容器内           |
| 签名     | 不签名（没有证书）                                                   | 提交后由商店代签                          |
| 配置目录 | `%LOCALAPPDATA%\QM-Transform`                                        | 同一路径，由系统重定向到包内 `LocalCache` |

两种格式用的路径写法一致，但在 MSIX 包里由操作系统把它指到包自己的存储位置，所以 `.exe` 和商店版之间的设置不会互相迁移。

---

## 🖥️ 平台差异说明

| 功能               | Windows                            | macOS                  |
|--------------------|------------------------------------|------------------------|
| **媒体播放器路径** | 需手动设置                         | 自动检测系统默认播放器 |
| **GPU 编码支持**   | Intel / NVIDIA / AMD               | Apple Silicon          |
| **安装方式**       | NSIS 安装器，或经商店安装的 MSIX   | DMG 拖拽安装           |
| **更新方式**       | exe 走应用内检查 / MSIX 由商店负责 | 应用内检查             |

---

## 📄 开源协议

本项目基于 [Apache-2.0](LICENSE) 许可证发布。

---

# 🙏 致谢

感谢以下开源项目的支持：

- [Microsoft Fluent UI](https://github.com/microsoft/fluentui) - UI 组件库
- [FFmpeg](https://ffmpeg.org/) - 媒体处理引擎
- [Electron](https://www.electronjs.org/) - 桌面应用框架
- [React](https://react.dev/) - 前端框架

完整的开源声明请查看应用内的「许可证和开源声明」页面。

---

# 😨 遇到问题了？

- 🐛 [报告 Bug](https://github.com/ayuanlmo/QM-Transform/issues)
- 💡 [提出建议](https://github.com/ayuanlmo/QM-Transform/issues)

> PS：程序语言使用机器翻译，如果您遇到了不正确的语言翻译。欢迎帮助`改进翻译`

---

# 🥰 喜欢此项目吗？

如果这个项目对您有帮助，请考虑：

- ⭐ Star 这个项目
- 🍴 Fork 这个项目
- 📢 分享给更多需要的人

---

## 🛠️ 开发者指南

### 技术栈

- **前端**：React 18 + TypeScript + Redux Toolkit
- **UI**：Microsoft Fluent UI
- **桌面层**：Electron
- **构建**：CRACO + Electron Builder（`.exe`/`.dmg`）+ Electron Forge（`.msix`）
- **媒体引擎**：FFmpeg（静态链接）
- **国际化**：i18next

> 推荐使用` pnpm `作为包管理器
>
> 由于使用了`NodeJS API`，所以react-app不能作用到浏览器

### 本地开发

```bash
git clone https://github.com/ayuanlmo/QM-Transform.git
cd QM-Transform
pnpm install
pnpm start          # 启动开发环境
pnpm build          # 构建生产版本
```

### 打包

```bash
pnpm build                  # NSIS .exe + latest.yml、.dmg、AppImage/deb -> dist/
pnpm run make:msix          # 走 Electron Forge + @electron-forge/maker-msix 出 .msix -> dist/msix/
pnpm run sign:msix          # 本机自签，让 .msix 能直接装到这台机器上
pnpm run make:msix-assets   # 重新生成宽磁贴/启动画面
```

Windows 的两条通道是刻意分开的：安装包和更新元数据仍由 `electron-builder` 产出，Forge 只负责出 `.msix`。

MSIX 通道的要求和已知的坑：

- `.npmrc` 要保留 `node-linker=hoisted`；`package.json` 的 `pnpm.onlyBuiltDependencies` 要保留 `electron`
  和 `ffmpeg-static`，否则 pnpm 不跑依赖的安装后脚本，这两个二进制根本不会下载，报错还看着不像这个原因
- 构建工具链（`react-scripts` 那一串）必须留在 `devDependencies`：打包按生产依赖闭包收文件，挂在
  `dependencies` 上就会被一起打进应用包里
- 打包需要跟 `dist/` 同卷的暂存目录，可用 `QM_PACKAGER_TMPDIR` 指定
- 打包时别开着 `pnpm start`，并把 `dist/`、`out/` 从 IDE 索引里排除——它们会占着打好的 `app.asar` 不放

### 本机安装测试包

```bash
pnpm run make:msix
pnpm run sign:msix
```

`sign:msix` 会从包里读出清单的发布者，本机没有对应证书就现签一张（产出 `dist/msix/devcert.pfx`），签名后
打印出 `Add-AppxPackage` 命令，以及把 `devcert.cer` 导入 `TrustedPeople` 的那条一次性命令。
它需要 Windows SDK 里的 `signtool`，路径可以用 `QM_SIGNTOOL` 覆盖。

提交商店的包 **不签名**，由 Partner Center 代签。出这种包之前要把标识换成商店后台给的值：

```bash
QM_MSIX_IDENTITY=<产品标识> QM_MSIX_PUBLISHER=<发布者 CN> pnpm run make:msix
```
