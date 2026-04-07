# Insanely Fast Whisper 完整参数说明文档

## 项目概述
Insanely Fast Whisper 是一个高性能的语音转文字 CLI 工具，基于 Hugging Face Transformers、Optimum 和 Flash Attention 2 优化。它可以在不到 98 秒的时间内转录 150 分钟（2.5小时）的音频，使用 OpenAI 的 Whisper Large v3 模型。

## 安装方式

### 标准安装
```bash
pipx install insanely-fast-whisper
```

### Python 3.11 兼容安装
```bash
pipx install insanely-fast-whisper --force --pip-args="--ignore-requires-python"
```

### 临时运行（无需安装）
```bash
pipx run insanely-fast-whisper --file-name <filename or URL>
```

## 核心命令参数

### 必选参数

| 参数名 | 类型 | 描述 |
|--------|------|------|
| `--file-name` | string | **必填**，要转录的音频文件路径或 URL。支持本地文件路径和 HTTP/HTTPS 链接。 |

### 可选参数

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `--device-id` | string | `"0"` | GPU 设备 ID。使用 CUDA 时传入设备编号，苹果硅 Mac 使用 `"mps"`。 |
| `--transcript-path` | string | `"output.json"` | 转录结果保存路径，默认为当前目录下的 `output.json`。 |
| `--model-name` | string | `"openai/whisper-large-v3"` | 预训练模型名称或检查点路径。可使用任何 Hugging Face 上的 Whisper 系列模型。 |
| `--task` | string | `"transcribe"` | 任务类型，可选值：<br>- `transcribe`：转录（默认）<br>- `translate`：翻译为英文 |
| `--language` | string | `"None"` | 输入音频的语言。默认自动检测，可传入语言代码（如 `"zh"` 表示中文，`"en"` 表示英文）。 |
| `--batch-size` | integer | `24` | 并行计算的批次大小。遇到显存不足（OOM）错误时减小此值。 |
| `--flash` | boolean | `False` | 是否使用 Flash Attention 2 加速。使用前需正确安装 flash-attn 库。 |
| `--timestamp` | string | `"chunk"` | 时间戳粒度，可选值：<br>- `chunk`：句子/段落级时间戳（默认）<br>- `word`：单词级时间戳 |
| `--hf-token` | string | `"no_token"` | Hugging Face 访问令牌，用于使用 Pyannote.audio 进行说话人分割。需要在 [hf.co/settings/token](https://hf.co/settings/token) 获取。 |
| `--diarization_model` | string | `"pyannote/speaker-diarization-3.1"` | 说话人分割预训练模型名称或检查点路径。 |
| `--num-speakers` | integer | `None` | 音频中确切的说话人数量。当知道对话参与者的确切人数时使用。必须≥1，不能与 `--min-speakers` 或 `--max-speakers` 同时使用。 |
| `--min-speakers` | integer | `None` | 说话人最小数量。必须≥1，不能与 `--num-speakers` 同时使用。如果同时指定 `--max-speakers`，则必须≤`--max-speakers`。 |
| `--max-speakers` | integer | `None` | 说话人最大数量。必须≥1，不能与 `--num-speakers` 同时使用。如果同时指定 `--min-speakers`，则必须≥`--min-speakers`。 |

## 常用使用示例

### 基础转录
```bash
insanely-fast-whisper --file-name audio.mp3
```

### 苹果硅 Mac 使用
```bash
insanely-fast-whisper --file-name audio.mp3 --device-id mps --batch-size 4
```

### 使用 Flash Attention 2 加速
```bash
insanely-fast-whisper --file-name audio.mp3 --flash True
```

### 使用 distil-whisper 模型
```bash
insanely-fast-whisper --model-name distil-whisper/large-v2 --file-name audio.mp3
```

### 翻译音频为英文
```bash
insanely-fast-whisper --file-name audio.mp3 --task translate
```

### 指定语言（中文）
```bash
insanely-fast-whisper --file-name audio.mp3 --language zh
```

### 单词级时间戳
```bash
insanely-fast-whisper --file-name audio.mp3 --timestamp word
```

### 带说话人分割的转录
```bash
insanely-fast-whisper --file-name audio.mp3 --hf-token YOUR_HF_TOKEN
```

### 指定说话人数量
```bash
insanely-fast-whisper --file-name audio.mp3 --hf-token YOUR_HF_TOKEN --num-speakers 2
```

### 指定说话人数量范围
```bash
insanely-fast-whisper --file-name audio.mp3 --hf-token YOUR_HF_TOKEN --min-speakers 2 --max-speakers 4
```

### 自定义输出路径
```bash
insanely-fast-whisper --file-name audio.mp3 --transcript-path ./results/transcription.json
```

## 输出格式说明

### 默认 JSON 输出结构
```json
{
  "speakers": [
    // 只有提供 --hf-token 时才会有此字段
    {
      "speaker": "SPEAKER_00",
      "text": "说话人00的文本内容",
      "timestamp": [0.0, 3.5]
    }
  ],
  "chunks": [
    {
      "timestamp": [0.0, 3.5],
      "text": "对应的文本内容",
      "speaker": "SPEAKER_00"  // 有说话人分割时才有此字段
    }
  ],
  "text": "完整的转录文本"
}
```

### 字段说明
- `speakers`：按说话人分组的转录结果，只有提供 `--hf-token` 启用说话人分割时才存在
- `chunks`：按时间顺序分割的转录片段，包含每个片段的时间戳和文本
- `text`：完整的连续转录文本

## 输出格式转换工具
项目提供了 `convert_output.py` 工具，可以将 JSON 输出转换为其他常用格式。

### 转换工具参数

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `input_file` | string | 必填 | 输入的 JSON 文件路径 |
| `-f, --output_format` | string | `"all"` | 输出格式，可选值：`txt`、`vtt`、`srt` |
| `-o, --output_dir` | string | `"."` | 输出文件保存目录 |
| `--verbose` | boolean | `False` | 转换时打印每个条目 |

### 转换示例

#### 转换为 SRT 格式
```bash
python convert_output.py output.json -f srt -o ./output
```

#### 转换为 VTT 格式
```bash
python convert_output.py output.json -f vtt -o ./output
```

#### 转换为 TXT 格式
```bash
python convert_output.py output.json -f txt -o ./output
```

## 性能优化建议

### NVIDIA GPU 优化
- 使用 `--flash True` 启用 Flash Attention 2，可获得最高 30 倍性能提升
- 尽可能调大 `--batch-size` 参数，根据显存大小调整
- 推荐使用 16GB 以上显存的 GPU

### 苹果硅 Mac 优化
- 必须添加 `--device-id mps` 参数
- 建议将 `--batch-size` 设置为 4 或更低，避免显存不足
- M1/M2/M3 Ultra 芯片可适当提高批次大小

### 内存不足解决方案
- 减小 `--batch-size` 参数
- 尝试使用更小的模型，如 `distil-whisper/large-v2`
- 关闭 Flash Attention（如果显存非常有限）

## 常见问题解答

### 1. 如何正确安装 flash-attn？
```bash
pipx runpip insanely-fast-whisper install flash-attn --no-build-isolation
```

### 2. Windows 下出现 `AssertionError: Torch not compiled with CUDA enabled` 错误？
手动安装支持 CUDA 的 PyTorch：
```bash
python -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
```

### 3. 如何避免 Mac 上的内存不足错误？
MPS 后端不如 CUDA 优化，建议使用：
```bash
insanely-fast-whisper --file-name audio.mp3 --device-id mps --batch-size 4
```

### 4. 如何在 Python 代码中直接使用而不通过 CLI？
```python
import torch
from transformers import pipeline
from transformers.utils import is_flash_attn_2_available

pipe = pipeline(
    "automatic-speech-recognition",
    model="openai/whisper-large-v3",
    torch_dtype=torch.float16,
    device="cuda:0",  # 或 "mps" 用于 Mac 设备
    model_kwargs={"attn_implementation": "flash_attention_2"} if is_flash_attn_2_available() else {"attn_implementation": "sdpa"},
)

outputs = pipe(
    "audio.mp3",
    chunk_length_s=30,
    batch_size=24,
    return_timestamps=True,
)

print(outputs)
```

## 支持的模型列表
- `openai/whisper-large-v3`（默认）
- `openai/whisper-large-v2`
- `openai/whisper-medium`
- `openai/whisper-small`
- `openai/whisper-base`
- `openai/whisper-tiny`
- `distil-whisper/distil-large-v2`
- `distil-whisper/distil-medium.en`
- `distil-whisper/distil-small.en`
- 以及 Hugging Face Hub 上所有其他 Whisper 系列模型

## 性能基准（NVIDIA A100 80GB）

| 优化配置 | 转录 150 分钟音频所需时间 |
|----------|--------------------------|
| large-v3 (Transformers) fp32 | ~31 分钟 |
| large-v3 (Transformers) fp16 + 批次 24 + BetterTransformer | ~5 分钟 |
| large-v3 (Transformers) fp16 + 批次 24 + Flash Attention 2 | ~1 分 38 秒 |
| distil-large-v2 (Transformers) fp16 + 批次 24 + Flash Attention 2 | ~1 分 18 秒 |

## 许可证
本项目采用 Apache-2.0 许可证开源。