下面给你一个**完整可落地版本**，我按你前面的要求收敛成一个可执行的 skill 设计稿，目标是：

- skill 名称合规： `liber-speechapi`
- 面向 openclaw Telegram 机器人语音链路
- 先 ASR，再交给 openclaw，对长回复先归纳到 **100字内**，再做 TTS
- 默认输出 Telegram 适配的 `ogg_opus`
- 支持参考音频 voice clone
- 配置从 `.env` 读取
- 优先复用 `python-env`，没有则回退当前 skill 本地环境

---

# 一、建议目录结构

```latex
liber-speechapi/
├── SKILL.md
├── references/
│   ├── api.md
│   ├── config.md
│   └── workflow.md
├── scripts/
│   ├── liber_speech_client.py
│   └── summarize_for_voice.py
└── tmp/
    └── clone.wav
```

说明：

- `SKILL.md`：主入口，保持精简
- `references/api.md`：Liber\_SpeechAPI 接口说明与调用约束
- `references/config.md`： `.env` 配置映射
- `references/workflow.md`：Telegram/openclaw 典型工作流
- `scripts/liber_speech_client.py`：统一 ASR/TTS 请求封装
- `scripts/summarize_for_voice.py`：将过长文本压缩到 100 字内
- `tmp/clone.wav`：默认参考音频，允许为空文件占位；若不存在或配置为空则禁用克隆

---

# 二、SKILL.md

下面这份可直接作为 `<skill>/SKILL.md` 使用。

```markdown
---
name: liber-speechapi
description: Use Liber SpeechAPI to add speech input/output capability for Telegram or chatbot workflows. Trigger this skill when Codex needs to transcribe user voice/audio to text with ASR, synthesize reply text to Telegram-compatible OGG/Opus voice with TTS, or optionally use reference-audio voice cloning through Liber_SpeechAPI. Supports environment-based configuration, long-reply summarization to within 100 Chinese characters before TTS, and fallback between shared python-env skill and the local Python environment.
---

# Liber SpeechAPI

Use this skill to connect a workflow to Liber_SpeechAPI for:
- speech-to-text from Telegram voice/audio
- text-to-speech reply generation
- Telegram voice-note output in `ogg_opus`
- optional reference-audio voice cloning
- concise spoken reply generation when the original answer is too long

## Follow this workflow

1. Read `references/config.md` to resolve configuration from `.env`.
2. Read `references/workflow.md` if the task is specifically about Telegram/openclaw message handling.
3. Read `references/api.md` when you need exact request fields or response handling.
4. Use `scripts/summarize_for_voice.py` to shorten long replies to within 100 Chinese characters before TTS.
5. Use `scripts/liber_speech_client.py` for deterministic ASR/TTS calls instead of rewriting HTTP request logic.

## Environment selection

Prefer a shared `python-env` skill if it is available in the current environment.

If `python-env` is not available, use the local Python environment for this skill.

When running local Python commands:
- use Python 3.11 if available
- install only the minimal dependencies required by the bundled scripts
- do not hardcode secrets; read them from `.env`

## Configuration rules

Load settings from `.env` in the skill directory or the current working directory.

Required settings:
- `LIBER_API_BASE_URL`
- `LIBER_API_KEY`

Optional settings:
- `LIBER_DEFAULT_LANGUAGE`
- `LIBER_DEFAULT_TTS_MODEL`
- `LIBER_DEFAULT_TTS_FORMAT`
- `LIBER_DEFAULT_ASR_TASK`
- `LIBER_DEFAULT_ASR_TIMESTAMPS`
- `LIBER_DEFAULT_CLONE_AUDIO`
- `LIBER_VOICE_SUMMARY_LIMIT`

Apply these defaults:
- `LIBER_DEFAULT_TTS_FORMAT=ogg_opus`
- `LIBER_DEFAULT_TTS_MODEL=multilingual`
- `LIBER_DEFAULT_ASR_TASK=transcribe`
- `LIBER_DEFAULT_ASR_TIMESTAMPS=chunk`
- `LIBER_DEFAULT_CLONE_AUDIO=tmp/clone.wav`
- `LIBER_VOICE_SUMMARY_LIMIT=100`

Treat `None`, `none`, empty string, and missing clone-audio path as disabled voice cloning.

## ASR workflow

For incoming Telegram voice/audio:
1. download or access the local audio file
2. send it to `POST /asr/transcribe`
3. extract the recognized `text`
4. return the transcript to the calling workflow

Use language from configuration unless the caller explicitly overrides it.

## TTS workflow

For reply generation:
1. inspect the reply text
2. if it is too long for a voice reply, shorten it to within the configured summary limit
3. send the shortened text to `POST /tts/synthesize`
4. request `format=ogg_opus` unless the caller explicitly needs something else
5. include `audio_prompt` only when clone audio is enabled and the file exists
6. return the resulting audio URL or saved output path to the caller

## Telegram-specific guidance

For Telegram voice replies:
- prefer `ogg_opus`
- keep spoken output concise and natural
- if the original answer is verbose, preserve intent and key facts but compress aggressively
- avoid reading markdown, code blocks, tables, or long lists verbatim

## Safety and robustness

- never print or log API keys
- validate input file existence before ASR
- validate text is non-empty before TTS
- use request timeouts
- handle HTTP failures with clear error messages
- if TTS clone audio is configured but missing, continue without cloning instead of failing
- if summarization fails, fall back to truncating conservatively rather than blocking the reply

## Expected outputs

Depending on the task, return one of:
- transcript text from ASR
- concise voice-ready text
- TTS result URL
- saved audio file path
- a structured JSON object containing transcript, summary, and synthesis result
```

---

# 三、references/api.md

````markdown
# Liber SpeechAPI Reference

## Base URL

Default example:

```text
http://localhost:5555/api/v1
````

Set the actual base URL through `.env`:

- `LIBER_API_BASE_URL`

## Authentication

Use bearer token authentication:

```http
Authorization: Bearer YOUR_API_KEY
```

Read the token from:

- `LIBER_API_KEY`

Do not hardcode tokens in scripts.

---

## Health check

```http
GET /health
```

Use this to verify service availability before ASR/TTS when needed.

---

## ASR

### Endpoint

```http
POST /asr/transcribe
```

### Form fields

- `file`: local audio file upload
- `url`: remote audio URL, optional alternative to file
- `language`: e.g. `zh`, `en`
- `task`: `transcribe` or `translate`
- `timestamps`: `chunk` or `word`

### Expected response fields

- `text`: recognized text
- `chunks`: optional segment information
- `meta`: metadata

### Notes

- Prefer file upload for Telegram voice processing.
- Validate that the input file exists and is readable.
- Fail clearly if no `text` is returned.

---

## TTS

### Endpoint

```http
POST /tts/synthesize
```

### Form fields

- `text`: text to synthesize
- `model`: `multilingual`, `turbo`, or `standard`
- `language`: e.g. `zh`, `en`
- `format`: `wav`, `mp4`, or `ogg_opus`
- `audio_prompt`: optional reference audio file for voice cloning

### Expected response fields

- `audio_url`: generated audio file URL
- `meta.format`
- `meta.sample_rate`

### Notes

- For Telegram voice notes, prefer `format=ogg_opus`.
- Only send `audio_prompt` when clone audio is enabled and the file exists.
- If `audio_prompt` is disabled or missing, send a normal TTS request.

---

## Telegram compatibility

The upstream project explicitly recommends `OGG/Opus` for Telegram voice-note delivery.

Use:

- `format=ogg_opus`

---

## Error handling guidance

Handle these cases explicitly:

- network timeout
- 401/403 authentication failure
- 404 wrong base URL or endpoint
- 422 invalid form fields
- empty ASR text
- empty TTS audio\_url

Return actionable messages so the calling workflow can decide whether to retry, downgrade, or fall back to plain text.

````plain

---

# 四、references/config.md

```md
# Configuration

Load configuration from `.env` in either:
1. the skill directory, or
2. the current working directory

If both exist, prefer the skill-local `.env`.

## Required variables

### `LIBER_API_BASE_URL`

Full API base URL, including `/api/v1`.

Example:

```env
LIBER_API_BASE_URL=http://127.0.0.1:5555/api/v1
````

### `LIBER_API_KEY`

Bearer token used for API authentication.

Example:

```plain
LIBER_API_KEY=replace_with_real_key
```

---

## Optional variables

### `LIBER_DEFAULT_LANGUAGE`

Default ASR/TTS language.

Example:

```plain
LIBER_DEFAULT_LANGUAGE=zh
```

### `LIBER_DEFAULT_TTS_MODEL`

Default TTS model.

Allowed:

- `multilingual`
- `turbo`
- `standard`

Default:

```plain
LIBER_DEFAULT_TTS_MODEL=multilingual
```

### `LIBER_DEFAULT_TTS_FORMAT`

Default TTS output format.

Recommended default:

```plain
LIBER_DEFAULT_TTS_FORMAT=ogg_opus
```

### `LIBER_DEFAULT_ASR_TASK`

Default ASR task.

Allowed:

- `transcribe`
- `translate`

Default:

```plain
LIBER_DEFAULT_ASR_TASK=transcribe
```

### `LIBER_DEFAULT_ASR_TIMESTAMPS`

Default timestamps mode.

Allowed:

- `chunk`
- `word`

Default:

```plain
LIBER_DEFAULT_ASR_TIMESTAMPS=chunk
```

### `LIBER_DEFAULT_CLONE_AUDIO`

Default reference audio path for voice cloning.

Recommended default:

```plain
LIBER_DEFAULT_CLONE_AUDIO=tmp/clone.wav
```

Disable cloning by setting any of:

- empty string
- `None`
- `none`

Examples:

```plain
LIBER_DEFAULT_CLONE_AUDIO=
```

or

```plain
LIBER_DEFAULT_CLONE_AUDIO=None
```

### `LIBER_VOICE_SUMMARY_LIMIT`

Maximum Chinese character target for spoken reply text.

Default:

```plain
LIBER_VOICE_SUMMARY_LIMIT=100
```

---

## Suggested `.env.example`

```plain
LIBER_API_BASE_URL=http://127.0.0.1:5555/api/v1
LIBER_API_KEY=your_api_key_here
LIBER_DEFAULT_LANGUAGE=zh
LIBER_DEFAULT_TTS_MODEL=multilingual
LIBER_DEFAULT_TTS_FORMAT=ogg_opus
LIBER_DEFAULT_ASR_TASK=transcribe
LIBER_DEFAULT_ASR_TIMESTAMPS=chunk
LIBER_DEFAULT_CLONE_AUDIO=tmp/clone.wav
LIBER_VOICE_SUMMARY_LIMIT=100
```

````plain

---

# 五、references/workflow.md

```md
# Telegram / openclaw Workflow

## Goal

Convert Telegram voice input into text for openclaw, then convert the final concise reply back into Telegram-compatible voice.

## Recommended pipeline

### 1. Receive Telegram voice message

Input is usually one of:
- Telegram voice file path
- downloaded local OGG file
- downloaded local audio file in another format

### 2. Run ASR

Call Liber SpeechAPI ASR with:
- `file=<local audio file>`
- `language=<configured language>`
- `task=transcribe`
- `timestamps=chunk`

Extract:
- `text`

### 3. Send transcript to openclaw

Use the ASR transcript as the user message for the chatbot workflow.

### 4. Produce final textual reply

Let openclaw generate the full answer first.

### 5. Compress for voice

If the final answer is too long for a natural voice reply:
- summarize it to within 100 Chinese characters
- keep the direct answer, essential facts, and next action
- remove markdown, long examples, code, and repeated explanation

### 6. Run TTS

Call Liber SpeechAPI TTS with:
- `text=<voice-ready text>`
- `model=<configured model>`
- `language=<configured language>`
- `format=ogg_opus`

If clone audio is enabled:
- include `audio_prompt=<configured file>`

### 7. Return audio to Telegram

Use the returned `audio_url` or downloaded file to send a Telegram voice message.

---

## Compression guidance

Good spoken reply:
- short
- direct
- natural
- no markdown formatting
- no code syntax
- no excessive detail

Example:

Original:
- “这个问题通常是因为 API 地址配置错误、鉴权失败，或者 OGG/Opus 文件没有正确生成。建议先检查 health 接口，再核对 API key，最后确认 TTS format 是否为 ogg_opus。”

Compressed:
- “可能是地址、鉴权或音频格式有误。先检查 health、API key，并确认 TTS 输出为 ogg_opus。”

---

## Failure strategy

### ASR failure
- return plain error text
- optionally ask the user to resend clearer audio

### Summarization failure
- conservatively trim text to the configured limit

### TTS failure
- return plain text reply instead of blocking the whole chatbot response

### Clone-audio missing
- continue without cloning
````

---

# 六、scripts/liber\_speech\_client.py

下面是可直接运行的 Python 3.11 脚本，尽量做到了：

- 安全读取 `.env`
- 输入校验
- 超时
- 清晰错误
- 不输出密钥
- clone 音频缺失时自动降级

```python
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
from typing import Any

import requests


DEFAULT_TIMEOUT = 120


class ConfigError(RuntimeError):
    """Raised when configuration is invalid."""


class ApiError(RuntimeError):
    """Raised when API request fails."""


def load_dotenv(dotenv_path: Path) -> None:
    if not dotenv_path.exists():
        return

    for raw_line in dotenv_path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")
        os.environ.setdefault(key, value)


def load_env() -> dict[str, Any]:
    script_dir = Path(__file__).resolve().parent
    skill_dir = script_dir.parent

    candidates = [
        skill_dir / ".env",
        Path.cwd() / ".env",
    ]
    for candidate in candidates:
        load_dotenv(candidate)

    base_url = os.getenv("LIBER_API_BASE_URL", "").strip().rstrip("/")
    api_key = os.getenv("LIBER_API_KEY", "").strip()
    language = os.getenv("LIBER_DEFAULT_LANGUAGE", "zh").strip() or "zh"
    tts_model = os.getenv("LIBER_DEFAULT_TTS_MODEL", "multilingual").strip() or "multilingual"
    tts_format = os.getenv("LIBER_DEFAULT_TTS_FORMAT", "ogg_opus").strip() or "ogg_opus"
    asr_task = os.getenv("LIBER_DEFAULT_ASR_TASK", "transcribe").strip() or "transcribe"
    asr_timestamps = os.getenv("LIBER_DEFAULT_ASR_TIMESTAMPS", "chunk").strip() or "chunk"
    clone_audio = os.getenv("LIBER_DEFAULT_CLONE_AUDIO", "tmp/clone.wav").strip()
    summary_limit = int(os.getenv("LIBER_VOICE_SUMMARY_LIMIT", "100").strip() or "100")

    if not base_url:
        raise ConfigError("Missing LIBER_API_BASE_URL in .env")
    if not api_key:
        raise ConfigError("Missing LIBER_API_KEY in .env")

    return {
        "base_url": base_url,
        "api_key": api_key,
        "language": language,
        "tts_model": tts_model,
        "tts_format": tts_format,
        "asr_task": asr_task,
        "asr_timestamps": asr_timestamps,
        "clone_audio": clone_audio,
        "summary_limit": summary_limit,
        "skill_dir": skill_dir,
    }


def build_headers(api_key: str) -> dict[str, str]:
    return {
        "Authorization": f"Bearer {api_key}",
    }


def resolve_clone_audio(config: dict[str, Any], override: str | None = None) -> Path | None:
    raw_value = override if override is not None else config["clone_audio"]
    if raw_value is None:
        return None

    value = str(raw_value).strip()
    if not value or value.lower() == "none":
        return None

    path = Path(value)
    if not path.is_absolute():
        path = config["skill_dir"] / value

    return path if path.exists() and path.is_file() else None


def check_health(config: dict[str, Any]) -> dict[str, Any]:
    url = f'{config["base_url"]}/health'
    response = requests.get(
        url,
        headers=build_headers(config["api_key"]),
        timeout=DEFAULT_TIMEOUT,
    )
    _raise_for_status(response, "health check failed")
    return response.json()


def transcribe_file(
    audio_path: str,
    language: str | None = None,
    task: str | None = None,
    timestamps: str | None = None,
) -> dict[str, Any]:
    config = load_env()
    file_path = Path(audio_path)
    if not file_path.exists() or not file_path.is_file():
        raise FileNotFoundError(f"Audio file not found: {file_path}")

    url = f'{config["base_url"]}/asr/transcribe'
    data = {
        "language": language or config["language"],
        "task": task or config["asr_task"],
        "timestamps": timestamps or config["asr_timestamps"],
    }

    with file_path.open("rb") as fh:
        files = {"file": (file_path.name, fh)}
        response = requests.post(
            url,
            headers=build_headers(config["api_key"]),
            data=data,
            files=files,
            timeout=DEFAULT_TIMEOUT,
        )

    _raise_for_status(response, "ASR transcription failed")
    payload = response.json()

    text = payload.get("text", "")
    if not isinstance(text, str) or not text.strip():
        raise ApiError("ASR succeeded but returned empty text")

    return payload


def synthesize_text(
    text: str,
    language: str | None = None,
    model: str | None = None,
    fmt: str | None = None,
    clone_audio: str | None = None,
) -> dict[str, Any]:
    config = load_env()
    cleaned_text = (text or "").strip()
    if not cleaned_text:
        raise ValueError("TTS text must not be empty")

    url = f'{config["base_url"]}/tts/synthesize'
    data = {
        "text": cleaned_text,
        "language": language or config["language"],
        "model": model or config["tts_model"],
        "format": fmt or config["tts_format"],
    }

    clone_path = resolve_clone_audio(config, clone_audio)

    if clone_path is not None:
        with clone_path.open("rb") as clone_fh:
            files = {"audio_prompt": (clone_path.name, clone_fh)}
            response = requests.post(
                url,
                headers=build_headers(config["api_key"]),
                data=data,
                files=files,
                timeout=DEFAULT_TIMEOUT,
            )
    else:
        response = requests.post(
            url,
            headers=build_headers(config["api_key"]),
            data=data,
            timeout=DEFAULT_TIMEOUT,
        )

    _raise_for_status(response, "TTS synthesis failed")
    payload = response.json()

    audio_url = payload.get("audio_url", "")
    if not isinstance(audio_url, str) or not audio_url.strip():
        raise ApiError("TTS succeeded but returned empty audio_url")

    return payload


def _raise_for_status(response: requests.Response, message: str) -> None:
    try:
        response.raise_for_status()
    except requests.HTTPError as exc:
        detail = response.text[:1000]
        raise ApiError(f"{message}: HTTP {response.status_code}: {detail}") from exc


def main() -> None:
    parser = argparse.ArgumentParser(description="Liber SpeechAPI client")
    subparsers = parser.add_subparsers(dest="command", required=True)

    health_parser = subparsers.add_parser("health", help="Run health check")
    health_parser.set_defaults(command="health")

    asr_parser = subparsers.add_parser("asr", help="Transcribe audio file")
    asr_parser.add_argument("audio_path", help="Path to local audio file")
    asr_parser.add_argument("--language", default=None)
    asr_parser.add_argument("--task", default=None)
    asr_parser.add_argument("--timestamps", default=None)

    tts_parser = subparsers.add_parser("tts", help="Synthesize text")
    tts_parser.add_argument("text", help="Text to synthesize")
    tts_parser.add_argument("--language", default=None)
    tts_parser.add_argument("--model", default=None)
    tts_parser.add_argument("--format", default=None, dest="fmt")
    tts_parser.add_argument("--clone-audio", default=None)

    args = parser.parse_args()

    if args.command == "health":
        result = check_health(load_env())
    elif args.command == "asr":
        result = transcribe_file(
            audio_path=args.audio_path,
            language=args.language,
            task=args.task,
            timestamps=args.timestamps,
        )
    elif args.command == "tts":
        result = synthesize_text(
            text=args.text,
            language=args.language,
            model=args.model,
            fmt=args.fmt,
            clone_audio=args.clone_audio,
        )
    else:
        raise RuntimeError(f"Unsupported command: {args.command}")

    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
```

---

# 七、scripts/summarize\_for\_voice.py

这个脚本不依赖 LLM，只做**稳妥压缩**。 如果以后你想接 openclaw 自身总结能力，可以把这个脚本当 fallback。

````python
from __future__ import annotations

import argparse
import re


def strip_markdown(text: str) -> str:
    text = re.sub(r"```.*?```", "", text, flags=re.S)
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"!\[[^\]]*]\([^)]+\)", "", text)
    text = re.sub(r"\[([^\]]+)]\([^)]+\)", r"\1", text)
    text = re.sub(r"^[>#\-*]+\s*", "", text, flags=re.M)
    text = re.sub(r"\|", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[。！？!?；;])", text)
    return [p.strip() for p in parts if p.strip()]


def summarize_text(text: str, limit: int = 100) -> str:
    cleaned = strip_markdown(text)
    if len(cleaned) <= limit:
        return cleaned

    sentences = split_sentences(cleaned)
    if not sentences:
        return cleaned[:limit]

    summary = ""
    for sentence in sentences:
        if len(summary + sentence) <= limit:
            summary += sentence
        else:
            break

    if not summary:
        summary = cleaned[:limit]

    return summary[:limit].rstrip("，,、；; ") + "。"


def main() -> None:
    parser = argparse.ArgumentParser(description="Summarize text for voice reply")
    parser.add_argument("text", help="Input text")
    parser.add_argument("--limit", type=int, default=100, help="Max character limit")
    args = parser.parse_args()

    print(summarize_text(args.text, args.limit))


if __name__ == "__main__":
    main()
````

---

# 八、建议的 `.env.example`

可放在 skill 根目录，供使用者复制成 `.env`：

```plain
LIBER_API_BASE_URL=http://127.0.0.1:5555/api/v1
LIBER_API_KEY=your_api_key_here
LIBER_DEFAULT_LANGUAGE=zh
LIBER_DEFAULT_TTS_MODEL=multilingual
LIBER_DEFAULT_TTS_FORMAT=ogg_opus
LIBER_DEFAULT_ASR_TASK=transcribe
LIBER_DEFAULT_ASR_TIMESTAMPS=chunk
LIBER_DEFAULT_CLONE_AUDIO=tmp/clone.wav
LIBER_VOICE_SUMMARY_LIMIT=100
```

---

# 九、openclaw / Telegram 集成方式建议

你要的核心逻辑可以抽象成下面这个流程：

```python
# 伪代码

# 1. Telegram 收到语音
voice_file = download_telegram_voice(...)

# 2. ASR
transcript = liber_asr(voice_file)

# 3. 把 transcript 交给 openclaw
full_reply = openclaw_chat(transcript)

# 4. 若太长，先压缩到100字内
voice_reply = summarize_for_voice(full_reply, limit=100)

# 5. TTS -> ogg_opus
audio = liber_tts(
    text=voice_reply,
    format="ogg_opus",
    clone_audio=default_or_none,
)

# 6. 发回 Telegram
send_telegram_voice(audio)
```

### 长回复判定建议

实际实现里可用以下规则：

- `len(reply) <= 100`：直接 TTS
- `len(reply) > 100`：先总结后 TTS

如果你想更自然一点，也可以把阈值设成：

- `<= 80` 直接播报
- `> 80` 就先压缩到 100 字内

---

# 十、关键设计决策说明

## 1）为什么 skill 名不用 `liber_speechapi`

因为 Agent Skills 规范要求：

- 只能小写字母、数字、连字符
- 不建议下划线

所以应使用：

- `liber-speechapi`

## 2）为什么默认 `ogg_opus`

因为你前面要求是 Telegram 机器人语音回复，而项目文档也明确推荐：

- `OGG/Opus` 适合 Telegram Voice Note

## 3）为什么 clone 音频缺失时不报错

因为这是**可选增强能力**，不应该阻塞主链路：

- 有参考音频 → clone
- 没有参考音频 / 配置为 None / 文件不存在 → 普通 TTS

## 4）为什么总结脚本做成 deterministic fallback

因为 skill 里最稳定的做法是：

- 优先让上游 openclaw 自己生成简短版
- 如果没有，就用本地脚本做保底压缩

这样技能更稳，不依赖额外模型。

---

# 十一、如果你要真正落地，我建议再补两个小点

## A. 增加 requirements.txt

如果你希望这个 skill 独立可运行，建议加一个最小依赖文件：

```plain
requests>=2.31.0
```

如果你想读 `.env` 用第三方库，也可以加：

```plain
python-dotenv>=1.0.1
```

但我上面代码已经自己实现了简单 dotenv 解析，所以**不是必须**。

## B. 给 `tmp/clone.wav` 放一个占位文件

因为默认配置指向：

- `tmp/clone.wav`

建议：

- 建立 `tmp/` 目录
- 放一个占位说明，或者实际参考音频

但如果 skill 打包时你不想带音频文件，也可以只建 `tmp/` 目录，不放文件；脚本会自动降级。

---

# 十二、最终落地清单

你现在已经有一套可以直接创建的内容：

1. `liber-speechapi/SKILL.md`
2. `liber-speechapi/references/api.md`
3. `liber-speechapi/references/config.md`
4. `liber-speechapi/references/workflow.md`
5. `liber-speechapi/scripts/liber_speech_client.py`
6. `liber-speechapi/scripts/summarize_for_voice.py`
7. `liber-speechapi/.env.example`
8. `liber-speechapi/tmp/` 目录

---

如果你愿意，我下一步可以直接帮你做两件事之一：

### 方案 A：我直接生成“可写入本地”的完整文件版本

我会把每个文件的最终内容整理成可直接落盘的形式。

### 方案 B：我直接在当前工作区创建这个 skill 目录

我会创建：

- <localFile name="liber-speechapi" path="D:\BaiduSyncdisk\Lobehub\liber-speechapi" isDirectory />

并写入上述全部文件。

如果你要我**直接落地创建文件**，回复：
**确认创建文件**
