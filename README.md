# Liber Speech API

> ASR (Whisper) + TTS (Chatterbox) 服务，提供本地 CLI 与远程 API 双模式。

## 特性

- **ASR（语音转文字）**：基于 [insanely-fast-whisper](https://github.com/Vaibhavs10/insanely-fast-whisper)（Whisper），支持多语言、时间戳、说话人分离（diarization）
- **TTS（文字转语音）**：基于 [chatterbox-tts](https://github.com/resemble-ai/chatterbox)，支持 Turbo/Standard/Multilingual 模型、音色克隆
- **多输出格式**：
  - ASR：JSON、TXT、SRT、VTT
  - TTS：WAV、MP4、OGG/Opus（按 Telegram Voice Note 最佳实践）
- **部署灵活**：本地 CLI 命令 + 远程 FastAPI 服务
- **交互式安装**：跨平台 `setup.ps1`/`setup.sh`，自动生成配置
- **API 鉴权**：支持 API Key（Bearer Token）
- **设备自适应**：自动检测 CUDA，支持 CPU/GPU 切换

## 快速开始

### 1. 环境要求

- Python 3.10+
- [uv](https://docs.astral.sh/uv/)（Python 包管理器）
- FFmpeg（用于音频转码，TTS 多格式输出需要）
- 可选：CUDA（GPU 加速）

### 2. 交互式安装

#### Windows

```powershell
# PowerShell
.\setup.ps1
```

#### Linux / macOS

```bash
# Bash
./setup.sh
```

安装脚本将：
- 交互式选择组件（ASR/TTS/API）、设备、模型、鉴权方式
- 生成 `.env` 配置文件
- 自动安装依赖（`uv sync [--extra api]`）
- 验证 CLI 入口

### 3. 验证安装

```bash
# 查看 CLI 帮助
uv run liber-speech --help

# 诊断环境
uv run liber-speech doctor

# 预热模型（可选）
uv run liber-speech warmup
```

### Windows 用户注意

如果在Windows上遇到编码或模块加载问题，请使用修复版启动器：

```bash
# 使用修复版启动器（推荐）
python -S scripts/run_cli.py [命令]

# 或使用批处理文件
.\run_cli.bat [命令]

# 示例
python -S scripts/run_cli.py tts synthesize "测试文字" --out output.wav
.\run_cli.bat tts synthesize "测试文字" --out output.wav
```

修复版启动器解决了以下问题：
- Windows GBK编码问题
- Python site模块加载冲突
- 缺失依赖（setuptools）
- 张量维度不匹配

## 使用指南

### CLI 模式

#### ASR 转录

```bash
# 使用默认配置转录（输出 JSON）
uv run liber-speech asr transcribe audio.wav

# 指定模型与语言，输出 SRT 字幕
uv run liber-speech asr transcribe audio.wav \
  --model openai/whisper-large-v3 \
  --language zh \
  --out subs.srt

# 翻译音频
uv run liber-speech asr translate audio.wav --out translated.json
```

#### TTS 合成

```bash
# 使用默认配置合成（输出 WAV）
uv run liber-speech tts synthesize "你好世界"

# 多语模型 + OGG/Opus 输出（适合 Telegram）
uv run liber-speech tts synthesize "你好世界" \
  --language zh \
  --format ogg_opus \
  --out hello.ogg

# 音色克隆（需提供参考音频）
uv run liber-speech tts synthesize "你好世界" \
  --audio-prompt reference.wav \
  --out cloned.wav
```

#### 启动 API 服务

```bash
# 启动服务（默认 5555）
uv run liber-speech serve

# 指定端口
uv run liber-speech serve --host 0.0.0.0 --port 8080
```

访问 API 文档：`http://localhost:5555/docs`

### API 模式

#### 鉴权

默认启用 API Key 鉴权，在请求头中添加：

```
Authorization: Bearer YOUR_API_KEY
```

API Key 在安装时生成，或查看 `.env` 文件中的 `LIBER_API_KEYS`。

#### ASR 转录（同步）

```bash
curl -X POST "http://localhost:5555/api/v1/asr/transcribe" \
  -H "Authorization: Bearer YOUR_KEY" \
  -F file="@audio.wav" \
  -F language="zh"
```

#### TTS 合成（同步）

```bash
curl -X POST "http://localhost:5555/api/v1/tts/synthesize" \
  -H "Authorization: Bearer YOUR_KEY" \
  -F text="你好世界" \
  -F language="zh" \
  -F format="ogg_opus"
```

返回 JSON 包含 `audio_url`，可直接下载音频文件。

#### 健康检查

```bash
curl http://localhost:5555/api/v1/health
```

## 配置说明

### 快速配置

1. 复制环境模板：
```bash
cp .env_template .env
```

2. 编辑 `.env` 文件，根据需要修改配置

### 主要配置项

安装脚本生成的 `.env` 文件包含主要配置项：

```env
# Liber Speech 环境配置
LIBER_DEVICE=auto                # 推理设备 (auto/cpu/cuda)
LIBER_ASR_MODEL=openai/whisper-large-v3
LIBER_TTS_MODEL=multilingual

# API 配置
LIBER_API_AUTH_MODE=api_key
LIBER_API_KEYS=your_key_here
LIBER_API_HOST=0.0.0.0
LIBER_API_PORT=5555

# 异步任务结果管理
LIBER_RESULTS_DIR=results
LIBER_RESULTS_TTL_HOURS=24

# HuggingFace 缓存（可选）
LIBER_HF_CACHE_DIR=/path/to/cache
```

## 开发指南

### 项目结构

```
Liber_SpeechAPI/
├── docs/                           # 文档目录
│   ├── API.md                      # API接口文档
│   ├── 实现记录.md                  # 开发实现记录
│   ├── 开发计划.md                  # 项目开发计划
│   ├── Windows使用指南.md           # Windows使用指南
│   └── CLI测试使用文档.md           # CLI测试使用文档
├── scripts/                        # 脚本目录
│   ├── download_models.py          # 模型下载脚本
│   ├── start_api_fixed.py          # API启动脚本（修复编码问题）
│   ├── run_cli_fixed.py            # CLI脚本（修复编码问题）
│   └── README.md                   # 脚本说明文档
├── src/liber_speech/               # 源代码目录
│   ├── engines/                    # 核心引擎（ASR/TTS）
│   ├── cli/                        # CLI 命令
│   ├── api/                        # FastAPI 服务
│   └── settings.py                 # 配置加载
├── start_api.bat                   # API启动批处理
├── test_cli.bat                    # CLI测试批处理
└── ...                             # 其他项目文件
```

### 添加新功能

1. **引擎层**：在 `engines/` 添加模型封装
2. **CLI**：在 `cli/commands_*.py` 添加子命令
3. **API**：在 `api/routes.py` 添加端点
4. **配置**：在 `settings.py` 添加配置模型

### 常见问题

#### Windows 环境编码错误

如果遇到 `UnicodeDecodeError: 'gbk' codec can't decode`，请使用修复脚本：

```bash
# 使用修复的CLI脚本
.venv\Scripts\python.exe -S scripts\run_cli_fixed.py --help

# 使用修复的API启动脚本
.venv\Scripts\python.exe -S scripts\start_api_fixed.py

# 或使用批处理文件
start_api.bat          # 启动API
test_cli.bat           # CLI测试工具
```

详细解决方案请参考：`docs/Windows使用指南.md` 和 `docs/CLI测试使用文档.md`

#### CUDA 不可用

运行 `uv run liber-speech doctor` 查看 CUDA 状态，并按提示安装匹配的 PyTorch 版本。

#### FFmpeg 未找到

- Windows：下载 FFmpeg 并添加到 PATH
- Linux/macOS：`sudo apt install ffmpeg` 或 `brew install ffmpeg`

#### 国内网络问题

```
# 1. 同步安装所有依赖（走阿里云）
uv sync

# 2. 配置 HF 国内镜像（解决网络不可达） + 运行
export HF_ENDPOINT=https://mirrors.aliyun.com/huggingface/
uv run liber-speech asr translate input/ttsmaker-file-2026-4-3-16-43-36.mp3 --out translated.json
```

## 许可证

本项目采用 MIT 许可证，详见 [LICENSE](LICENSE) 文件。

## 致谢

- [insanely-fast-whisper](https://github.com/Vaibhavs10/insanely-fast-whisper)
- [chatterbox-tts](https://github.com/resemble-ai/chatterbox)
- [FastAPI](https://fastapi.tiangolo.com/)
- [uv](https://docs.astral.sh/uv/)
