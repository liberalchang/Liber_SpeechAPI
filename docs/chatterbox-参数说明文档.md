# Chatterbox TTS 完整参数说明文档

## 项目概述
Chatterbox 是 Resemble AI 开发的一系列最先进的开源文本转语音（TTS）模型家族，包含三个不同定位的模型，支持零样本声音克隆、多语言合成、副语言标记等高级特性。其中最新的 Chatterbox-Turbo 模型采用 350M 参数架构，计算资源需求更低，延迟更小，适合生产环境的语音代理场景。

## 模型列表对比

| 模型 | 大小 | 支持语言 | 核心特性 | 最佳适用场景 |
|------|------|----------|----------|--------------|
| **Chatterbox-Turbo** | **350M** | 英语 | 副语言标记支持（[laugh], [cough], [chuckle]等）、低计算资源和显存需求 | 零样本语音代理、生产环境部署 |
| Chatterbox-Multilingual | 500M | 23+ 种语言 | 零样本克隆、多语言支持 | 全球化应用、本地化场景 |
| Chatterbox | 500M | 英语 | CFG 调整、夸张度调优 | 通用零样本 TTS、创意内容生成 |

## 安装方式

### 标准安装
```bash
pip install chatterbox-tts
```

### 源码安装
```bash
# conda create -yn chatterbox python=3.11
# conda activate chatterbox

git clone https://github.com/resemble-ai/chatterbox.git
cd chatterbox
pip install -e .
```

## 核心 API 参数说明

### 1. ChatterboxTurboTTS（Turbo 模型）

#### from_pretrained 方法
```python
ChatterboxTurboTTS.from_pretrained(device: str) -> ChatterboxTurboTTS
```

| 参数名 | 类型 | 描述 |
|--------|------|------|
| `device` | string | 运行设备，可选值：`"cuda"`（NVIDIA GPU）、`"mps"`（苹果硅芯片）、`"cpu"`（CPU） |

#### from_local 方法
```python
ChatterboxTurboTTS.from_local(ckpt_dir: str, device: str) -> ChatterboxTurboTTS
```

| 参数名 | 类型 | 描述 |
|--------|------|------|
| `ckpt_dir` | string | 本地模型检查点目录路径 |
| `device` | string | 运行设备，同 from_pretrained |

#### generate 方法
```python
model.generate(
    text: str,
    repetition_penalty: float = 1.2,
    min_p: float = 0.00,
    top_p: float = 0.95,
    audio_prompt_path: str = None,
    exaggeration: float = 0.0,
    cfg_weight: float = 0.0,
    temperature: float = 0.8,
    top_k: int = 1000,
    norm_loudness: bool = True
) -> torch.Tensor
```

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `text` | string | 必填 | 要合成的文本内容，支持副语言标记如 `[laugh]`、`[cough]`、`[chuckle]` 等 |
| `repetition_penalty` | float | `1.2` | 重复惩罚系数，值越高越不容易出现重复发音 |
| `min_p` | float | `0.00` | 最小概率阈值（Turbo 模型暂不支持，会被忽略） |
| `top_p` | float | `0.95` | 核采样概率阈值，控制生成多样性 |
| `audio_prompt_path` | string | `None` | 参考音频路径，用于零样本声音克隆，需要 10 秒左右的清晰单语音频 |
| `exaggeration` | float | `0.0` | 夸张度系数（Turbo 模型暂不支持，会被忽略） |
| `cfg_weight` | float | `0.0` | 无分类器引导权重（Turbo 模型暂不支持，会被忽略） |
| `temperature` | float | `0.8` | 采样温度，值越高生成越有多样性，越低越稳定 |
| `top_k` | int | `1000` | 最高 K 个候选 token 采样 |
| `norm_loudness` | bool | `True` | 是否自动标准化音频响度 |

**返回值**：形状为 `(1, audio_length)` 的 PyTorch 张量，采样率为 24000 Hz。

---

### 2. ChatterboxTTS（基础英语模型）

#### from_pretrained 方法
```python
ChatterboxTTS.from_pretrained(device: str) -> ChatterboxTTS
```

| 参数名 | 类型 | 描述 |
|--------|------|------|
| `device` | string | 运行设备，可选值：`"cuda"`、`"mps"`、`"cpu"` |

#### generate 方法
```python
model.generate(
    text: str,
    audio_prompt_path: str = None,
    cfg_weight: float = 0.5,
    exaggeration: float = 0.5,
    temperature: float = 0.8,
    top_p: float = 0.95,
    top_k: int = 1000,
    repetition_penalty: float = 1.2,
    language_id: str = "en"
) -> torch.Tensor
```

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `text` | string | 必填 | 要合成的英文文本 |
| `audio_prompt_path` | string | `None` | 参考音频路径，用于零样本声音克隆 |
| `cfg_weight` | float | `0.5` | 无分类器引导权重，范围 0-1，值越高与参考音色相似度越高 |
| `exaggeration` | float | `0.5` | 夸张度系数，范围 0-1，值越高语音表现越夸张 |
| `temperature` | float | `0.8` | 采样温度 |
| `top_p` | float | `0.95` | 核采样概率阈值 |
| `top_k` | int | `1000` | 最高 K 个候选 token 采样 |
| `repetition_penalty` | float | `1.2` | 重复惩罚系数 |
| `language_id` | string | `"en"` | 语言 ID，基础模型固定为 `"en"` |

---

### 3. ChatterboxMultilingualTTS（多语言模型）

#### from_pretrained 方法
```python
ChatterboxMultilingualTTS.from_pretrained(device: str) -> ChatterboxMultilingualTTS
```

| 参数名 | 类型 | 描述 |
|--------|------|------|
| `device` | string | 运行设备，可选值：`"cuda"`、`"mps"`、`"cpu"` |

#### generate 方法
```python
model.generate(
    text: str,
    language_id: str,
    audio_prompt_path: str = None,
    cfg_weight: float = 0.5,
    exaggeration: float = 0.5,
    temperature: float = 0.8,
    top_p: float = 0.95,
    top_k: int = 1000,
    repetition_penalty: float = 1.2
) -> torch.Tensor
```

| 参数名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `text` | string | 必填 | 要合成的文本，需与指定语言对应 |
| `language_id` | string | 必填 | 语言 ID，见下文支持的语言列表 |
| `audio_prompt_path` | string | `None` | 参考音频路径，用于零样本声音克隆 |
| `cfg_weight` | float | `0.5` | 无分类器引导权重，范围 0-1 |
| `exaggeration` | float | `0.5` | 夸张度系数，范围 0-1 |
| `temperature` | float | `0.8` | 采样温度 |
| `top_p` | float | `0.95` | 核采样概率阈值 |
| `top_k` | int | `1000` | 最高 K 个候选 token 采样 |
| `repetition_penalty` | float | `1.2` | 重复惩罚系数 |

## 支持的语言列表（多语言模型）

| 语言 | 代码 |
|------|------|
| 阿拉伯语 | `ar` |
| 丹麦语 | `da` |
| 德语 | `de` |
| 希腊语 | `el` |
| 英语 | `en` |
| 西班牙语 | `es` |
| 芬兰语 | `fi` |
| 法语 | `fr` |
| 希伯来语 | `he` |
| 印地语 | `hi` |
| 意大利语 | `it` |
| 日语 | `ja` |
| 韩语 | `ko` |
| 马来语 | `ms` |
| 荷兰语 | `nl` |
| 挪威语 | `no` |
| 波兰语 | `pl` |
| 葡萄牙语 | `pt` |
| 俄语 | `ru` |
| 瑞典语 | `sv` |
| 斯瓦希里语 | `sw` |
| 土耳其语 | `tr` |
| 中文 | `zh` |

## 常用使用示例

### 1. Chatterbox-Turbo 基础使用
```python
import torchaudio as ta
import torch
from chatterbox.tts_turbo import ChatterboxTurboTTS

# 加载 Turbo 模型
model = ChatterboxTurboTTS.from_pretrained(device="cuda")

# 使用副语言标记
text = "Hi there, Sarah here from MochaFone calling you back [chuckle], have you got one minute to chat about the billing issue?"

# 生成音频（需要参考音频用于声音克隆）
wav = model.generate(text, audio_prompt_path="your_10s_ref_clip.wav")

# 保存音频
ta.save("test-turbo.wav", wav, model.sr)
```

### 2. 基础英语模型使用
```python
import torchaudio as ta
from chatterbox.tts import ChatterboxTTS

# 加载模型
model = ChatterboxTTS.from_pretrained(device="cuda")

text = "Ezreal and Jinx teamed up with Ahri, Yasuo, and Teemo to take down the enemy's Nexus in an epic late-game pentakill."
wav = model.generate(text)
ta.save("test-english.wav", wav, model.sr)

# 带参考音频的零样本克隆
wav = model.generate(text, audio_prompt_path="reference_voice.wav", cfg_weight=0.7, exaggeration=0.6)
ta.save("test-cloned.wav", wav, model.sr)
```

### 3. 多语言模型使用
```python
import torchaudio as ta
from chatterbox.mtl_tts import ChatterboxMultilingualTTS

# 加载多语言模型
multilingual_model = ChatterboxMultilingualTTS.from_pretrained(device="cuda")

# 法语合成
french_text = "Bonjour, comment ça va? Ceci est le modèle de synthèse vocale multilingue Chatterbox, il prend en charge 23 langues."
wav_french = multilingual_model.generate(french_text, language_id="fr")
ta.save("test-french.wav", wav_french, model.sr)

# 中文合成
chinese_text = "你好，今天天气真不错，希望你有一个愉快的周末。"
wav_chinese = multilingual_model.generate(chinese_text, language_id="zh")
ta.save("test-chinese.wav", wav_chinese, model.sr)
```

## 最佳实践与调优建议

### 通用使用建议
- 确保参考音频的语言与要合成的语言一致，否则生成的语音可能带有参考音频的口音，可将 `cfg_weight` 设置为 0 缓解
- 默认设置（`exaggeration=0.5`, `cfg_weight=0.5`）适用于大多数场景
- 如果参考说话人语速较快，可将 `cfg_weight` 降低到 0.3 左右以优化语速

### 富有表现力/戏剧化语音
- 尝试较低的 `cfg_weight` 值（如 0.3 左右）
- 提高 `exaggeration` 到 0.7 或更高
- 更高的 `exaggeration` 会加快语速，降低 `cfg_weight` 可以补偿，获得更慢、更从容的语速

### 性能优化
- NVIDIA GPU 优先使用 `"cuda"` 设备，苹果硅 Mac 使用 `"mps"` 设备
- 对于生产环境低延迟需求，优先选择 Chatterbox-Turbo 模型
- 生成的音频采样率固定为 24000 Hz

## 内置 PerTh 水印说明
所有 Chatterbox 生成的音频都内置了 Resemble AI 的 PerTh（感知阈值）水印，具有以下特性：
- 水印是不可感知的神经水印
- 能够在 MP3 压缩、音频编辑和常见操作后仍然保持 100% 的检测准确率
- 用于负责任的 AI 使用，防止滥用和深度伪造

### 水印检测方法
```python
import perth
import librosa

AUDIO_PATH = "generated_audio.wav"

# 加载水印音频
watermarked_audio, sr = librosa.load(AUDIO_PATH, sr=None)

# 初始化水印检测器
watermarker = perth.PerthImplicitWatermarker()

# 提取水印
watermark = watermarker.get_watermark(watermarked_audio, sample_rate=sr)
print(f"提取的水印值: {watermark}")
# 输出：0.0（无水印）或 1.0（有水印）
```

## 常见问题

### 1. 参考音频有什么要求？
- 建议使用 10 秒左右的清晰音频
- 只包含一个说话人
- 无背景噪音
- 语音质量高

### 2. 如何降低显存占用？
- 优先使用 Chatterbox-Turbo 模型（350M 参数）
- 减小批次大小
- 如果仍然显存不足，使用 CPU 推理

### 3. 为什么生成的语音有口音？
- 参考音频的语言与要合成的语言不匹配，设置 `cfg_weight=0` 可以缓解
- 确保 `language_id` 参数与文本语言一致

### 4. Turbo 模型不支持哪些参数？
Turbo 模型目前不支持 `exaggeration`、`cfg_weight` 和 `min_p` 参数，传入这些参数会被忽略并产生警告。

## 许可证
本项目采用 Apache-2.0 许可证开源。