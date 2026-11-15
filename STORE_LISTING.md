# Microsoft Store 一览文案 · 2.2.0

按 Partner Center「商店清单 → 说明 / 版本说明 / 属性」里的字段分组，同一个字段的所有语言放在一起，方便逐栏复制。

## 关于字段名

- **短标题**：Partner Center 的 Windows 应用清单里没有这个必填项——商店里显示的名字来自包里的应用显示名
  （当前是 `QM-Transform`）。如果你填的是别的表单（有些渠道要求 6–10 字的短标题），下面的值可以直接用。
- **产品功能**：同样不是 Partner Center 的独立字段，它对应「说明/详细描述」里的功能要点；有些表单会要求
  单独再列一遍，下面给的是可以直接贴进独立列表框的版本。
- 其余字段（简短描述、说明、此版本的新增功能、关键字、版权和商标信息、开发者）都是清单里真实存在的栏位。

## 字符上限

| 字段 | 常见上限 |
| --- | --- |
| 简短描述 Short description | 150 字符 |
| 说明 Long description | 10,000 字符 |
| 此版本的新增功能 Release notes | 1,500 字符（按 400 控制更保险） |
| 关键字 Keywords | 7 个，每个 ≤ 30 字符 |
| 版权和商标信息 Copyright and trademark | 100 字符 |

「此版本的新增功能」的上限随表单版本变过，提交前把每栏实际字数核一遍，别依赖这里的估算。

## 不随语言变化的公共字段

| 字段 | 值 |
| --- | --- |
| 开发人员 / 作者 Author | `ayuanlmo` |
| 发行人 Publisher | Partner Center 账户的发布者名，与 MSIX 清单的 `PublisherDisplayName` 一致：`ayuanlmo` |
| 版权和商标信息 Copyright and trademark | `© 2026 ayuanlmo. Apache-2.0 open-source project. FFmpeg is a trademark of the FFmpeg project.` |
| 商标 Trademark（若单独成栏） | `QM-Transform` |
| 类别 Category | 实用工具 / Utilities（次级：多媒体） |
| 支持页 Support | `https://github.com/ayuanlmo/QM-Transform` |
| 下载页 | `https://github.com/ayuanlmo/QM-Transform/releases` |

隐私政策 URL：商店清单要求填一个真正托管在公网的页面，仓库里没有，所以这里不给占位链接。能挂页面时正文用这一段
（各语言自己翻译）：

> 本应用不收集、不上传任何用户数据，运行期间不连接我们的服务器。唯一可能发生的网络访问是检查 GitHub 上的新版本；
> 微软商店版连这一步也不做，更新由商店负责。所有转换都在本机完成。

价格：免费。年龄分级：按后台自动评级结果提交。截图与促销图：需要真实界面截图，本文案不含。

## 提交前要注意的两件事

1. **提交商店的 `.msix` 不签名**，由商店代签；`pnpm run sign:msix` 那枚只用于本机测试，别上传。
2. **包版本号必须比上次提交的更高**。包版本取自 `package.json`（本轮已升到 `2.2.0`），商店侧的应用版本填同一个数。

---

# 各语言文案

## English（en-US）

**短标题**

```
QM Media Converter
```

**简短描述**

```
Free open-source video and audio converter. FFmpeg is built in and every file is processed on your own computer — no uploads, no telemetry, no ads.
```

**说明（详细描述）**

```
QM-Transform converts video and audio files on your own computer. Add files, choose a format, and start.

FFmpeg is built into the app and statically linked, so there is nothing to install afterwards and no codec to download. Video: MP4, MKV, MOV, WEBM, AVI and other mainstream containers. Audio: MP3, AAC, WAV, FLAC, OGG. Resolution, bitrate, frame rate, GOP, sample rate and channel count are all adjustable, and several files can convert at the same time, so a whole folder is not a waiting room.

Your files stay yours. The app does not connect to any service of ours: no telemetry, no analytics, no ads, nothing bundled. The only network request the desktop build can make is checking GitHub for a newer version, and the Store build does not even do that — updates arrive through the Store. Every feature works with networking turned off.

The interface follows Microsoft Fluent Design, comes with light, dark and automatic themes, and is available in 10 languages.

QM-Transform is open source under the Apache-2.0 licence. Source code, issue tracker and downloads live on GitHub at ayuanlmo/QM-Transform.

Requires Windows 10 or later, 64-bit.
```

**产品功能**

```
• Video conversion: MP4, MKV, MOV, WEBM, AVI
• Audio conversion: MP3, AAC, WAV, FLAC, OGG
• FFmpeg included — nothing to download
• Several files converting in parallel
• Resolution, bitrate, frame rate, sample rate, channels
• Light, dark and automatic themes
• 10 interface languages
• Works completely offline; no telemetry
```

**此版本的新增功能（2.2.0）**

```
• Pausing a task now finishes the segment being written and stitches the pieces back afterwards, instead of freezing the encoder mid-file.
• Finding an update no longer downloads it; the installer only comes down when you press Download.
• One unreadable file no longer cancels the rest of the batch, and probe failures now say why.
• Encoders are checked against the bundled ffmpeg; hardware encoding falls back to CPU when unavailable.
• The Store build no longer checks for updates inside the app.
• Settings now live in one location, and several silent crashes are fixed.
```

**关键字**

```
video converter, audio converter, ffmpeg, mp4, mp3, format conversion, offline
```

---

## 简体中文（zh-CN，zh-SG 用同一份）

**短标题**

```
QM 媒体转换
```

**简短描述**

```
免费开源的视频与音频格式转换工具。内置 FFmpeg，所有文件都在您自己的电脑上处理——不上传、无遥测、无广告。
```

**说明（详细描述）**

```
QM-Transform 在您自己的电脑上完成视频与音频文件的格式转换。添加文件、选择目标格式、开始即可。

应用内置 FFmpeg 并采用静态链接，无需另外安装，也不需要联网下载编解码器。视频：MP4、MKV、MOV、WEBM、AVI 等主流容器格式；音频：MP3、AAC、WAV、FLAC、OGG。分辨率、码率、帧率、GOP、采样率、声道数都可以自定义，多个文件还能同时转换，一整批文件夹不必排长队。

文件始终属于您。应用不会连接我们的任何服务：没有遥测、没有行为分析、没有广告、不捆绑软件。桌面版唯一可能的网络请求是到 GitHub 检查新版本，而商店版连这一步也不做——更新由商店负责。断网状态下所有功能照常可用。

界面遵循 Microsoft Fluent Design，提供浅色、深色与跟随系统三种主题，共有 10 种界面语言。

QM-Transform 以 Apache-2.0 协议开源，源码、问题反馈与下载都在 GitHub 的 ayuanlmo/QM-Transform。

系统要求：Windows 10 或更高，64 位。
```

**产品功能**

```
• 视频格式转换：MP4、MKV、MOV、WEBM、AVI
• 音频格式转换：MP3、AAC、WAV、FLAC、OGG
• 内置 FFmpeg，开箱即用
• 多任务并行转换
• 自定义分辨率、码率、帧率、采样率、声道
• 浅色 / 深色 / 自动主题
• 10 种界面语言
• 完全离线可用，不收集数据
```

**此版本的新增功能（2.2.0）**

```
• 暂停改为写完当前片段再停，恢复后自动无损拼接，不再出现写到一半打不开的文件。
• 发现新版本不再自动下载，只有点击「下载」才会拉取安装包。
• 一个文件读不出来不会取消整批；探测失败现在会说明原因。
• 编码器按内置 ffmpeg 的实际能力检测，硬件编码不可用时自动回落 CPU。
• 商店版不再在应用内检查更新，更新交由商店负责。
• 配置目录统一到一个位置，并修复多处悄无声息失败的问题。
```

**关键字**

```
视频转换, 音频转换, 格式转换, 媒体转换, ffmpeg, mp4转换, 离线转换
```

---

## 繁體中文（zh-TW，zh-HK 用同一份）

**短标题**

```
QM 媒體轉換
```

**简短描述**

```
免費開源的影片與音訊格式轉換工具。內建 FFmpeg，所有檔案都在您自己的電腦上處理——不上傳、無遙測、無廣告。
```

**說明（詳細描述）**

```
QM-Transform 在您自己的電腦上完成影片與音訊檔案的格式轉換。加入檔案、選擇目標格式、開始即可。

應用程式內建 FFmpeg 並採用靜態連結，無需另外安裝，也不需要連線下載編解碼器。影片：MP4、MKV、MOV、WEBM、AVI 等主流容器格式；音訊：MP3、AAC、WAV、FLAC、OGG。解析度、位元率、影格速率、GOP、取樣率、聲道數皆可自訂，多個檔案還能同時轉換，整批檔案不必排隊。

檔案始終屬於您。應用程式不會連線到我們的任何服務：沒有遙測、沒有行為分析、沒有廣告、不捆綁軟體。桌面版唯一可能的網路請求是在 GitHub 檢查新版本，而商店版連這一步都不做——更新由商店負責。離線狀態下所有功能照常可用。

介面依循 Microsoft Fluent Design，提供淺色、深色與跟隨系統三種主題，共有 10 種介面語言。

QM-Transform 以 Apache-2.0 授權開源，原始碼、問題回報與下載都在 GitHub 的 ayuanlmo/QM-Transform。

系統需求：Windows 10 或以上，64 位元。
```

**產品功能**

```
• 影片格式轉換：MP4、MKV、MOV、WEBM、AVI
• 音訊格式轉換：MP3、AAC、WAV、FLAC、OGG
• 內建 FFmpeg，開箱即用
• 多工平行轉換
• 自訂解析度、位元率、影格速率、取樣率、聲道
• 淺色 / 深色 / 自動主題
• 10 種介面語言
• 完全離線可用，不收集資料
```

**此版本的新增功能（2.2.0）**

```
• 暫停改為寫完目前片段再停，恢復後自動無損串接，不再出現寫到一半打不開的檔案。
• 發現新版本不再自動下載，只有點擊「下載」才會取得安裝程式。
• 單一檔案讀取失敗不會取消整批；探測失敗現在會說明原因。
• 編解碼器依照內建 ffmpeg 的實際能力偵測，硬體編碼不可用時自動改用 CPU。
• 商店版不再在應用程式內檢查更新，更新交由商店負責。
• 設定目錄統一至同一位置，並修復多個靜默失敗的問題。
```

**關鍵字**

```
影片轉換, 音訊轉換, 格式轉換, 媒體轉換, ffmpeg, mp4轉換, 離線轉換
```

---

## 日本語（ja-JP）

**短标题**

```
QM メディア変換
```

**简短描述**

```
無料・オープンソースの動画・音声変換アプリ。FFmpeg を内蔵し、ファイルはすべてお使いのパソコン内で処理します。アップロード・統計取得・広告はありません。
```

**说明（详细描述）**

```
QM-Transform は動画・音声ファイルをお使いのパソコン内で変換するアプリです。ファイルを追加し、形式を選ぶだけ。

FFmpeg はアプリに組み込まれており（静的リンク）、別途インストールやコーデックのダウンロードは不要です。動画：MP4、MKV、MOV、WEBM、AVI など主要なコンテナ形式。音声：MP3、AAC、WAV、FLAC、OGG。解像度・ビットレート・フレームレート・GOP・サンプルレート・チャンネル数はいずれも変更でき、複数のファイルを同時に変換できます。

ファイルはあなたのものです。当社のサーバーに接続することは一切ありません。テレメトリ、動作分析、広告、同梱ソフトはありません。デスクトップ版が通信する唯一の可能性は GitHub での新版確認で、Store 版はそれすら行いません（更新は Store が担当）。オフラインでも全機能が使えます。

インターフェースは Microsoft Fluent Design に基づき、ライト／ダーク／自動のテーマと 10 の言語に対応します。

QM-Transform は Apache-2.0 で公開されているオープンソースソフトです。ソースコード、Issue、ダウンロードは GitHub の ayuanlmo/QM-Transform にあります。

動作環境：Windows 10 以降、64 ビット。
```

**产品功能**

```
• 動画変換：MP4、MKV、MOV、WEBM、AVI
• 音声変換：MP3、AAC、WAV、FLAC、OGG
• FFmpeg 内蔵ですぐ使える
• 複数ファイルを同時に変換
• 解像度・ビットレート・フレームレート・サンプルレートを変更可能
• ライト／ダーク／自動テーマ
• 10 の言語に対応
• オフラインで全機能、データ収集なし
```

**此版本的新增功能（2.2.0）**

```
• 一時停止は書きかけの区間を最後まで行ってから止まり、再開後に自動的に無損結合します。途中で壊れた出力が出なくなりました。
• 新しいバージョンを見つけても自動ではダウンロードしません。ダウンロードを押したときだけ取得します。
• 1 つのファイルが読み取れなくても、バッチ全体が取り消されなくなりました。エラー理由も表示します。
• 内蔵 ffmpeg の実在するエンコーダーだけを認識し、ハードウェア符号化が使えないときは CPU に自動で切り替えます。
• Store 版はアプリ内で更新確認を行いません（Store が更新します）。
• 設定の保存場所を 1 つに統一し、原因の分からない不具合を複数修正しました。
```

**关键字**

```
動画変換, 音声変換, 形式変換, ファイル変換, ffmpeg, mp4変換, オフライン
```

---

## 한국어（ko-KR）

**短标题**

```
QM 미디어 변환
```

**简短描述**

```
무료 오픈소스 영상·음성 변환 앱. FFmpeg을 내장하며 모든 파일은 사용자의 컴퓨터에서 처리됩니다. 업로드·추적·광고가 없습니다.
```

**说明（详细描述）**

```
QM-Transform은 영상과 음성 파일을 사용자의 컴퓨터 안에서 변환합니다. 파일을 추가하고 대상 형식을 고른 뒤 시작하면 됩니다.

FFmpeg이 앱에 정적으로 포함되므로 별도 설치나 코덱 다운로드가 필요 없습니다. 영상: MP4, MKV, MOV, WEBM, AVI 등 주요 컨테이너. 음성: MP3, AAC, WAV, FLAC, OGG. 해상도, 비트레이트, 프레임 레이트, GOP, 샘플 레이트, 채널 수를 모두 직접 설정할 수 있고, 여러 파일을 동시에 변환할 수 있습니다.

파일은 사용자의 것입니다. 이 앱은 당사 어떤 서비스에도 연결하지 않습니다. 텔레메트리, 사용 분석, 광고, 번들 소프트웨어가 없습니다. 데스크톱 버전이 네트워크를 사용하는 유일한 경우는 GitHub에서 새 버전 확인이며, 스토어 버전은 그것도 하지 않습니다 — 업데이트는 스토어가 담당합니다. 오프라인에서도 모든 기능을 쓸 수 있습니다.

인터페이스는 Microsoft Fluent Design을 따르며 밝기/어두움/자동 테마와 10개 언어를 제공합니다.

QM-Transform은 Apache-2.0 라이선스의 오픈소스이며, 소스 코드·이슈·다운로드는 GitHub ayuanlmo/QM-Transform에 있습니다.

필요 환경: Windows 10 이상, 64비트.
```

**产品功能**

```
• 영상 변환: MP4, MKV, MOV, WEBM, AVI
• 음성 변환: MP3, AAC, WAV, FLAC, OGG
• FFmpeg 기본 포함
• 여러 파일 동시 변환
• 해상도·비트레이트·프레임 레이트·샘플 레이트·채널 설정
• 밝은/어두운/자동 테마
• 10개 언어 지원
• 완전 오프라인 사용, 데이터 수집 없음
```

**此版本的新增功能（2.2.0）**

```
• 일시 정지는 작성 중인 구간을 마친 뒤 멈추고 재개 시 자동으로 무손실 이어 붙입니다. 중간에 깨진 출력 파일이 사라졌습니다.
• 새 버전을 찾아도 자동으로 다운로드하지 않습니다. '다운로드'를 눌러야 설치 파일이 내려옵니다.
• 한 파일이 읽히지 않아도 전체 작업을 취소하지 않으며, 실패 원인을 표시합니다.
• 포함된 ffmpeg의 실제 인코더를 확인해 하드웨어 인코딩을 쓸 수 없으면 CPU로 전환합니다.
• 스토어 버전은 앱 안에서 업데이트를 확인하지 않습니다.
• 설정 저장 위치를 하나로 통일하고 조용히 실패하던 여러 문제를 고쳤습니다.
```

**关键字**

```
영상 변환, 음성 변환, 파일 변환, 코덱, ffmpeg, mp4 변환, 오프라인
```

---

## Deutsch（de-DE）

**短标题**

```
QM Medienkonverter
```

**简短描述**

```
Freier Open-Source-Video- und -Audio-Konverter. FFmpeg ist eingebaut, alle Dateien laufen auf Ihrem Rechner – ohne Upload, ohne Tracking, ohne Werbung.
```

**说明（详细描述）**

```
QM-Transform konvertiert Video- und Audiodateien auf Ihrem eigenen Computer. Dateien hinzufügen, Zielformat wählen, starten.

FFmpeg ist statisch in die App eingebaut; es muss nichts nachinstalliert und kein Codec heruntergeladen werden. Video: MP4, MKV, MOV, WEBM, AVI und weitere gängige Container. Audio: MP3, AAC, WAV, FLAC, OGG. Auflösung, Bitrate, Bildrate, GOP, Samplerate und Kanalanzahl sind frei einstellbar, und mehrere Dateien laufen parallel – ein ganzer Ordner ist kein Wartezimmer.

Ihre Dateien bleiben bei Ihnen. Die App verbindet sich mit keinem unserer Dienste: keine Telemetrie, keine Analyse, keine Werbung, keine Bündelung. Der Desktop-Bau kann höchstens auf GitHub nach einer neueren Version sehen; im Store übernimmt das der Store. Alle Funktionen gehen auch offline.

Die Oberfläche folgt Microsoft Fluent Design, hat helle, dunkle und automatische Themen und ist in 10 Sprachen verfügbar.

QM-Transform ist Open Source unter Apache-2.0. Quellcode, Issues und Downloads finden sich auf GitHub unter ayuanlmo/QM-Transform.

Voraussetzung: Windows 10 oder neuer, 64 Bit.
```

**产品功能**

```
• Videokonvertierung: MP4, MKV, MOV, WEBM, AVI
• Audiokonvertierung: MP3, AAC, WAV, FLAC, OGG
• FFmpeg bereits enthalten
• Mehrere Dateien parallel umwandeln
• Auflösung, Bitrate, Bildrate, Samplerate, Kanäle
• Helles, dunkles und automatisches Theme
• 10 Sprachen
• Vollständig offline nutzbar, ohne Datenerfassung
```

**此版本的新增功能（2.2.0）**

```
• Pause schreibt jetzt das laufende Segment zu Ende und fügt die Teile danach verlustfrei zusammen – halbe, unbrauchbare Dateien entfallen.
• Ein gefundenes Update wird nicht mehr automatisch geladen; der Installer kommt erst nach einem Klick auf Herunterladen.
• Eine unlesbare Datei bricht nicht mehr die gesamte Charge ab; Fehler melden jetzt den Grund.
• Encoder werden gegen das mitgelieferte ffmpeg geprüft; fehlt die Hardware, wird auf CPU zurückgefallen.
• Die Store-Fassung prüft nicht mehr in der App auf Updates.
• Einstellungen liegen an einem Ort; mehrere lautlose Abstürze sind behoben.
```

**关键字**

```
video konverter, audio konverter, ffmpeg, mp4, mp3, format umwandeln, offline
```

---

## Français（fr-FR）

**短标题**

```
QM Convertisseur média
```

**简短描述**

```
Convertisseur vidéo et audio libre et gratuit. FFmpeg est intégré, tout reste sur votre ordinateur : aucun téléversement, aucune mesure, aucune publicité.
```

**说明（详细描述）**

```
QM-Transform convertit vos fichiers vidéo et audio sur votre propre ordinateur. Ajoutez les fichiers, choisissez le format de destination, lancez.

FFmpeg est intégré à l'application et lié statiquement : rien à installer après coup, aucun codec à télécharger. Vidéo : MP4, MKV, MOV, WEBM, AVI et autres conteneurs courants. Audio : MP3, AAC, WAV, FLAC, OGG. Résolution, débit binaire, images par seconde, GOP, fréquence d'échantillonnage et nombre de canaux sont réglables, et plusieurs fichiers se convertissent en parallèle.

Vos fichiers vous appartiennent. L'application ne se connecte à aucun de nos services : pas de télémétrie, pas d'analyse d'usage, pas de publicité, aucun logiciel groupé. La version de bureau peut tout au plus vérifier les nouveautés sur GitHub ; la version Store délègue cela au Store. Tout fonctionne hors ligne.

L'interface suit Microsoft Fluent Design, propose les thèmes clair, sombre et automatique, et est disponible en 10 langues.

QM-Transform est un logiciel libre sous licence Apache-2.0. Code source, suivi des anomalies et téléchargements sont sur GitHub, ayuanlmo/QM-Transform.

Configuration requise : Windows 10 ou plus récent, 64 bits.
```

**产品功能**

```
• Conversion vidéo : MP4, MKV, MOV, WEBM, AVI
• Conversion audio : MP3, AAC, WAV, FLAC, OGG
• FFmpeg intégré
• Conversion parallèle de plusieurs fichiers
• Résolution, débit, images/s, fréquence, canaux
• Thèmes clair, sombre et automatique
• 10 langues
• Fonctionne hors ligne, sans collecte de données
```

**此版本的新增功能（2.2.0）**

```
• La mise en pause termine d'abord le segment en cours puis recolle les morceaux sans ré-encodage ; plus de fichier coupé à moitié illisible.
• Une mise à jour détectée n'est plus téléchargée toute seule : il faut appuyer sur Télécharger.
• Un fichier illisible n'annule plus le lot entier, et l'erreur indique désormais la cause.
• Les encodeurs sont vérifiés contre le ffmpeg fourni ; à défaut, le traitement retombe sur le CPU.
• La version Store ne cherche plus les mises à jour dans l'application.
• Les réglages sont regroupés au même endroit ; plusieurs échecs silencieux sont corrigés.
```

**关键字**

```
convertisseur video, convertisseur audio, ffmpeg, mp4, mp3, conversion format, hors ligne
```

---

## Русский（ru-RU）

**短标题**

```
QM Конвертер медиа
```

**简短描述**

```
Бесплатный конвертер видео и аудио с открытым кодом. FFmpeg уже внутри, все файлы обрабатываются на вашем компьютере: без загрузки на сервер, статистики и рекламы.
```

**说明（详细描述）**

```
QM-Transform конвертирует видео- и аудиофайлы на вашем собственном компьютере. Добавьте файлы, выберите формат и запустите.

FFmpeg встроен в приложение и статически скомпонован: ничего доустанавливать и скачивать кодеки не нужно. Видео: MP4, MKV, MOV, WEBM, AVI и другие распространённые контейнеры. Аудио: MP3, AAC, WAV, FLAC, OGG. Разрешение, битрейт, частота кадров, GOP, частота дискретизации и число каналов настраиваются, а несколько файлов обрабатываются параллельно.

Ваши файлы остаются вашими. Приложение не обращается к нашим сервисам: телеметрии, аналитики, рекламы и попутных программ нет. Desktop-сборка может лишь проверить наличие новой версии на GitHub, а сборка из Microsoft Store вообще этого не делает — обновления ставит магазин. Все функции работают без сети.

Интерфейс построен по Microsoft Fluent Design, со светлой, тёмной и автоматической темами и на 10 языках.

QM-Transform — открытое ПО под лицензией Apache-2.0. Исходники, задачи и загрузки находятся на GitHub: ayuanlmo/QM-Transform.

Требования: Windows 10 или новее, 64 бита.
```

**产品功能**

```
• Конвертация видео: MP4, MKV, MOV, WEBM, AVI
• Конвертация аудио: MP3, AAC, WAV, FLAC, OGG
• FFmpeg уже в комплекте
• Параллельная обработка нескольких файлов
• Разрешение, битрейт, частота кадров, дискретизация, каналы
• Светлая, тёмная и автоматическая темы
• 10 языков интерфейса
• Полностью офлайн, без сбора данных
```

**此版本的新增功能（2.2.0）**

```
• Пауза теперь дописывает текущий фрагмент, а части склеиваются без потерь — файл, обрезанный на середине, больше не получается.
• Найденное обновление больше не скачивается само; установка начнётся только после нажатия «Скачать».
• Один нечитаемый файл не отменяет весь пакет, а ошибка теперь объясняет причину.
• Кодировщики проверяются по встроенному ffmpeg; без аппаратного — автоматический переход на CPU.
• Версия из Store больше не проверяет обновления внутри приложения.
• Настройки хранятся в одном месте; устранены несколько «тихих» отказов.
```

**关键字**

```
конвертер видео, конвертер аудио, ffmpeg, mp4, mp3, конвертация, офлайн
```

---

## Suomi（fi-FI）

**短标题**

```
QM-muunnin
```

**简短描述**

```
Ilmainen avoimen lähdekoodin video- ja äänimuunnin. FFmpeg on sisään rakennettu, ja tiedostot käsitellään omalla tietokoneellasi: ei latauksia, ei seurantaa, ei mainoksia.
```

**说明（详细描述）**

```
QM-Transform muuntaa video- ja äänitiedostoja omalla tietokoneellasi. Lisää tiedostot, valitse kohdemuoto ja aloita.

FFmpeg on rakennettu sovellukseen staattisesti, joten erillisiä asennuksia tai koodekkilatauksia ei tarvita. Video: MP4, MKV, MOV, WEBM, AVI ja muut yleiset säiliöt. Ääni: MP3, AAC, WAV, FLAC, OGG. Resoluutiota, bittinopeutta, kuvataajuutta, GOPia, näytteenottotaajuutta ja kanavien määrää voi säätää, ja useita tiedostoja voi muuntaa yhtä aikaa.

Tiedostot kuuluvat sinulle. Sovellus ei yhdistä meidän palveluihimme: ei telemetriaa, ei analytiikkaa, ei mainoksia, ei lisäohjelmia. Työpöytäversio saattaa ainoastaan tarkastaa GitHubista uudemman version; Store-versio jättää päivitykset kaupan hoidettavaksi. Kaikki toiminnot ovat käytettävissä ilman verkkoyhteyttä.

Käyttöliittymä noudattaa Microsoft Fluent Designia, ja siinä on vaalea, tumma ja automaattinen teema sekä 10 kieltä.

QM-Transform on avointa lähdekoodia Apache-2.0-lisensillä. Lähdekoodi, ongelmailmoitukset ja lataukset ovat GitHubissa: ayuanlmo/QM-Transform.

Vaatimukset: Windows 10 tai uudempi, 64-bittinen.
```

**产品功能**

```
• Videon muunnos: MP4, MKV, MOV, WEBM, AVI
• Äänen muunnos: MP3, AAC, WAV, FLAC, OGG
• FFmpeg mukana paketissa
• Useiden tiedostojen samaikainen muunnos
• Resoluutio, bittinopeus, kuvataajuus, näytteenotto, kanavat
• Vaalea, tumma ja automaattinen teema
• 10 kieltä
• Toimii täysin offline, ei tiedonkeruuta
```

**此版本的新增功能（2.2.0）**

```
• Keskeytys viimeistelee kirjoitettavan osuuden, ja osat liitetään tappioitta yhteen — keskeneräinen, avautumaton tiedosto ei enää synny.
• Uuden version löytyessä asennuspakettia ei enää ladata itsestään; lataus alkaa painikkeesta.
• Yksi lukukelvoton tiedosto ei enää peruta koko erää, ja virhe kertoo nyt syyn.
• Koodaimet tarkistetaan paketoidusta ffmpegistä; laitetuki puuttuu, siirrytään CPU:hen.
• Store-versio ei enää tarkista päivityksiä sovelluksen sisällä.
• Asetukset ovat yhdessä paikassa, ja useat hiljaiset viat on korjattu.
```

**关键字**

```
videosmuunnin, äänimuunnin, ffmpeg, mp4, mp3, tiedostomuunnos, offline
```

---

# 与本应用语言清单的对应关系

应用内界面语言 10 种（`src/i18n/configs` 实际有 11 份 JSON）：

| 应用内 | 商店语言代码 | 本节位置 |
| --- | --- | --- |
| `en` | en-US | English |
| `zhCn` | zh-CN | 简体中文 |
| `zhSg` | zh-SG | 与 zh-CN 同一份 |
| `zhTw` | zh-TW | 繁體中文 |
| `zhHk` | zh-HK | 与 zh-TW 同一份 |
| `jp`（应为 `ja`） | ja-JP | 日本語 |
| `ko` | ko-KR | 한국어 |
| `de` | de-DE | Deutsch |
| `fr` | fr-FR | Français |
| `ru` | ru-RU | Русский |
| `fi` | fi-FI | Suomi |

`jp` → `ja` 的文件名与 locale 代码还没改（roadmap 上的 i18n 待办）；商店侧必须填 `ja-JP`，别跟着仓库里的错误代码走。

## 翻译质量说明

简体中文、繁體中文、English 三份是可以直接提交的水准。其余 7 种（ja/ko/de/fr/ru/fi，以及 en 的标点风格）由我按
现有 locale 文件的用词风格写成，属于机器翻译级别：商店文案是过审用的对外文本，**提交前请让母语者过一遍**，
尤其是芬兰语和韩语（敬体、格变化最容易出错）。

需要重点确认的点：

- 芬兰语：`lisäohjelmia`（不捆绑软件）、`ongelmailmoitukset`（问题反馈）两处措辞；关键词 `tiedostomuunnos` 是否符合
  商店搜索习惯。
- 韩语：`음성`（音频）与 `오디오` 的选择，以及正文的 `-ㅂ니다` 体是否全篇一致。
- 日语：关键字里的 `形式変換` 是否比 `ファイル変換` 更常用。
- 俄语与德语：技术名词的格变化（`битрейт`、`Bitrate`）在长句里的搭配。
