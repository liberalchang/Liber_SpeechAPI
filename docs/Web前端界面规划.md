# Web 前端界面规划（Liber Speech API）

## 目标

本前端为 **独立 Web 应用**（与 FastAPI 后端完全分离），提供三大功能：

- 文字转语音（TTS）
- 语音转文字（ASR）
- 文档（展示项目 Markdown 使用文档 + 快捷打开后端 Swagger/ReDoc）

同时支持：

- 可配置后端地址（默认本地 http://localhost:5555）
- 可选 Token（后端未启用鉴权时可留空）
- 后续可打包为桌面应用（Electron/Tauri）

## 后端接口约定

- Base URL（默认）：http://localhost:5555/api/v1
- 健康检查：GET /health
- 预热（可选）：POST /warmup
- ASR 同步：POST /asr/transcribe（multipart/form-data）
  - ile（上传文件）或 url
  - language（可选）
  - 	ask：	ranscribe|translate
  - 	imestamps：chunk|word
- TTS 同步：POST /tts/synthesize（multipart/form-data）
  - 	ext
  - model：multilingual|turbo|standard
  - language（可选）
  - ormat：wav|mp4|ogg_opus
  - udio_prompt（可选，音色参考音频上传）
- 结果下载：GET /results/{filename}

鉴权：如用户配置 Token，则在请求头添加：

- Authorization: Bearer <TOKEN>

## 页面与功能设计

### 1）设置（后端配置）

- 后端地址（例如 http://localhost:5555）
- API 前缀（默认 /api/v1，高级设置可改）
- Token（可选）
- 连接测试按钮：调用 {base}{prefix}/health，展示：
  - status / ersion
  - sr_ready / 	ts_ready

配置持久化：localStorage。

### 2）TTS（文字转语音）

输入：

- 文本输入框（textarea）
- 参考音频（可选，udio_prompt 文件上传）

常规参数：

- model
- language
- ormat

高级参数：

- 折叠区域（为后续扩展预留），当前提供：
  - 请求预览
  - 播放器行为（例如自动播放开关）

输出：

- 合成音频播放器（HTML <audio>）
- 下载按钮
- meta 信息展示

### 3）ASR（语音转文字）

输入：

- 上传音频文件（主）
- URL 转录（备选）

常规参数：

- language
- 	ask
- 	imestamps

输出：

- 识别文本
- chunks 表格（start/end/text）
- 导出：TXT / JSON（前端生成下载）

### 4）文档

- 展示本仓库 docs/ 下的 **Markdown 文档**（仅 .md）
- 左侧导航列表，右侧 Markdown 渲染
- 快捷入口：
  - Swagger：{base}/docs
  - ReDoc：{base}/redoc

说明：前端不在运行时读取磁盘路径；文档会被拷贝/同步到 web/src/docs 并随前端一起打包。

## 前端工程结构建议（web/）

- web/
  - src/
    - pages/（TTS/ASR/Docs/Settings）
    - components/（表单、结果展示、布局）
    - lib/（apiClient、storage、类型定义）
    - docs/（从项目根目录 docs/*.md 同步而来，仅 md）

## 文档同步策略

- 只同步：../docs/*.md → web/src/docs/*.md
- 前端通过 Vite import.meta.glob 在构建期打包 Markdown 内容

## 非功能性要求

- 错误展示：统一提示后端返回的 error/code 或网络错误
- Loading 状态：请求中禁用按钮、显示进度提示
- 兼容桌面打包：避免依赖后端同源托管；所有配置可在 UI 内完成
