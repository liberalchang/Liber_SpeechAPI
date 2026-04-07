# Liber Speech API 文档

> 基于 FastAPI 的 ASR/TTS 服务接口文档。

## 基础信息

- **Base URL**：`http://localhost:5555/api/v1`
- **鉴权**：Bearer Token（API Key）
- **OpenAPI 文档**：`/docs`（Swagger UI）与 `/redoc`（ReDoc）

## 鉴权

默认启用 API Key 鉴权。在请求头中添加：

```
Authorization: Bearer YOUR_API_KEY
```

API Key 在安装时生成，或查看 `.env` 文件中的 `LIBER_API_KEYS`。

如需关闭鉴权，设置环境变量 `LIBER_API_AUTH_MODE=none`。

## 端点概览

| 方法 | 端点 | 描述 |
|------|------|------|
| GET | `/health` | 健康检查 |
| POST | `/warmup` | 预热模型 |
| POST | `/asr/transcribe` | ASR 转录（同步） |
| POST | `/tts/synthesize` | TTS 合成（同步） |
| POST | `/tasks/asr/transcribe` | 提交 ASR 异步任务（框架） |
| GET | `/tasks/{task_id}` | 查询任务状态（框架） |
| GET | `/results/{filename}` | 下载结果文件 |

## 详细接口

### 1. 健康检查

检查服务状态与模型就绪情况。

**请求**

```http
GET /api/v1/health
```

**响应**

```json
{
  "status": "ok",
  "version": "0.1.0",
  "asr_ready": true,
  "tts_ready": true
}
```

### 2. 预热模型

显式加载 ASR 与 TTS 模型，减少首次推理延迟。

**请求**

```http
POST /api/v1/warmup
Authorization: Bearer YOUR_KEY
```

**响应**

```json
{
  "status": "warmed up"
}
```

### 3. ASR 转录（同步）

转录音频文件或 URL，返回文本与时间戳。

**请求**

- **方式一：文件上传**

```http
POST /api/v1/asr/transcribe
Authorization: Bearer YOUR_KEY
Content-Type: multipart/form-data

file: <audio_file>
language: <string> (可选)
task: transcribe|translate (默认: transcribe)
timestamps: chunk|word (默认: chunk)
```

- **方式二：URL**

```http
POST /api/v1/asr/transcribe
Authorization: Bearer YOUR_KEY
Content-Type: multipart/form-data

url: <audio_url>
language: <string> (可选)
task: transcribe|translate (默认: transcribe)
timestamps: chunk|word (默认: chunk)
```

**参数说明**

| 参数 | 类型 | 必选 | 说明 |
|------|------|------|------|
| file | File | 条件必选 | 音频文件（与 url 二选一） |
| url | string | 条件必选 | 音频 URL（与 file 二选一） |
| language | string | 否 | 语言代码（如 `zh`），不指定则自动检测 |
| task | string | 否 | `transcribe`（转录）或 `translate`（翻译） |
| timestamps | string | 否 | `chunk`（分段）或 `word`（词级）时间戳 |

**响应**

```json
{
  "text": "转录文本内容",
  "chunks": [
    {
      "start": 0.0,
      "end": 2.5,
      "text": "第一段文本",
      "speaker": null
    },
    {
      "start": 2.6,
      "end": 5.1,
      "text": "第二段文本",
      "speaker": null
    }
  ],
  "meta": {
    "model": "openai/whisper-large-v3",
    "device": "cuda:0",
    "dtype": "fp16",
    "task": "transcribe",
    "timestamps": "chunk"
  }
}
```

### 4. TTS 合成（同步）

将文本合成为语音，支持多种格式与音色克隆。

**请求**

```http
POST /api/v1/tts/synthesize
Authorization: Bearer YOUR_KEY
Content-Type: multipart/form-data

text: <string>
model: multilingual|turbo|standard (默认: multilingual)
language: <string> (可选)
format: wav|mp4|ogg_opus (默认: wav)
audio_prompt: <file> (可选)
```

**参数说明**

| 参数 | 类型 | 必选 | 说明 |
|------|------|------|------|
| text | string | 是 | 待合成文本 |
| model | string | 否 | TTS 模型：`multilingual`（多语）、`turbo`（速度）、`standard`（质量） |
| language | string | 否 | 多语模型语言代码（如 `zh`） |
| format | string | 否 | 输出格式：`wav`、`mp4`、`ogg_opus` |
| audio_prompt | File | 否 | 音色克隆参考音频 |

**响应**

```json
{
  "audio_url": "/api/v1/results/abc123.ogg",
  "meta": {
    "format": "ogg_opus",
    "sample_rate": 24000
  }
}
```

使用 `audio_url` 下载音频文件：

```bash
curl -L "http://localhost:5555/api/v1/results/abc123.ogg" --output output.ogg
```

### 5. 异步任务（框架）

当前提供异步任务框架，实际任务执行需配合队列系统。

#### 提交 ASR 任务

```http
POST /api/v1/tasks/asr/transcribe
Authorization: Bearer YOUR_KEY
Content-Type: multipart/form-data

file: <audio_file>
url: <audio_url>
language: <string> (可选)
task: transcribe|translate (默认: transcribe)
timestamps: chunk|word (默认: chunk)
```

**响应**

```json
{
  "task_id": "abc123def456",
  "status": "pending"
}
```

#### 查询任务状态

```http
GET /api/v1/tasks/{task_id}
Authorization: Bearer YOUR_KEY
```

**响应**

```json
{
  "task_id": "abc123def456",
  "status": "completed",
  "result_url": "/api/v1/results/abc123.json",
  "error": null,
  "meta": {}
}
```

状态值：`pending`、`running`、`completed`、`failed`。

### 6. 下载结果文件

```http
GET /api/v1/results/{filename}
```

直接返回文件内容，支持音频（WAV/MP4/OGG）与文本（JSON/TXT/SRT/VTT）。

## 错误处理

统一错误响应格式：

```json
{
  "error": "错误描述",
  "code": 400
}
```

常见错误码：

- `400`：请求参数错误
- `401`：未提供 API Key
- `403`：API Key 无效
- `404`：文件或任务不存在
- `500`：服务器内部错误

## 部署建议

### 生产环境

- 使用 HTTPS（反向代理）
- 限制 CORS 来源
- 配置合理的 TTL 与结果清理
- 启用日志与监控

### Docker 部署（示例）

```dockerfile
FROM python:3.10-slim

# 安装系统依赖
RUN apt-get update && apt-get install -y ffmpeg && rm -rf /var/lib/apt/lists/*

# 安装 uv
COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv

# 复制项目
WORKDIR /app
COPY . .

# 安装依赖
RUN uv sync --frozen --extra api

# 暴露端口
EXPOSE 5555

# 启动服务
CMD ["uv", "run", "liber-speech", "serve", "--port", "5555"]
```

### 环境变量

参考 `.env` 文件，主要配置：

```env
LIBER_API_AUTH_MODE=api_key
LIBER_API_KEYS=your_key_here
LIBER_API_HOST=0.0.0.0
LIBER_API_PORT=5555
LIBER_RESULTS_DIR=results
LIBER_RESULTS_TTL_HOURS=24
```

## SDK 示例

### Python

```python
import requests

base_url = "http://localhost:5555/api/v1"
headers = {"Authorization": "Bearer YOUR_KEY"}

# ASR 转录
with open("audio.wav", "rb") as f:
    resp = requests.post(f"{base_url}/asr/transcribe", headers=headers, files={"file": f})
    data = resp.json()
    print(data["text"])

# TTS 合成
data = {"text": "你好世界", "format": "ogg_opus"}
resp = requests.post(f"{base_url}/tts/synthesize", headers=headers, data=data)
result = resp.json()
audio_url = f"{base_url}{result['audio_url']}"
audio = requests.get(audio_url)
with open("output.ogg", "wb") as f:
    f.write(audio.content)
```

### JavaScript (Node.js)

```js
const FormData = require('form-data');
const fetch = require('node-fetch');
const fs = require('fs');

const baseUrl = 'http://localhost:5555/api/v1';
const headers = { Authorization: 'Bearer YOUR_KEY' };

// ASR 转录
const form = new FormData();
form.append('file', fs.createReadStream('audio.wav'));

fetch(`${baseUrl}/asr/transcribe`, { method: 'POST', headers, body: form })
  .then(res => res.json())
  .then(data => console.log(data.text));

// TTS 合成
const ttsForm = new FormData();
ttsForm.append('text', '你好世界');
ttsForm.append('format', 'ogg_opus');

fetch(`${baseUrl}/tts/synthesize`, { method: 'POST', headers, body: ttsForm })
  .then(res => res.json())
  .then(data => {
    const audioUrl = `${baseUrl}${data.audio_url}`;
    return fetch(audioUrl);
  })
  .then(res => res.buffer())
  .then(buf => fs.writeFileSync('output.ogg', buf));
```

## 更新日志

### v0.1.0

- 初始版本
- 支持 ASR/TTS 同步接口
- API Key 鉴权
- 多格式输出
- 健康检查与预热
- 异步任务框架
