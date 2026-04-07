from __future__ import annotations

import os
from typing import Literal

from pydantic import BaseModel, Field


class DeviceConfig(BaseModel):
    """设备配置。"""

    device: Literal["auto", "cpu", "cuda"] = Field(default="auto", description="推理设备")


class ASRConfig(BaseModel):
    """ASR 配置。"""

    model: str = Field(default="openai/whisper-large-v3", description="Whisper 模型名")
    device: str = Field(default="auto", description="推理设备")
    language: str | None = Field(default=None, description="默认语言代码")
    task: str = Field(default="transcribe", description="默认任务")
    timestamps: str = Field(default="chunk", description="时间戳级别")


class TTSConfig(BaseModel):
    """TTS 配置。"""

    model: str = Field(default="multilingual", description="TTS 模型")
    device: str = Field(default="auto", description="推理设备")
    language: str | None = Field(default=None, description="默认语言代码")
    format: str = Field(default="wav", description="默认输出格式")


class CLIConfig(BaseModel):
    """CLI 配置。"""

    device: str = Field(default="auto", description="默认推理设备")
    asr: ASRConfig = Field(default_factory=ASRConfig)
    tts: TTSConfig = Field(default_factory=TTSConfig)


def load_cli_config() -> CLIConfig:
    """从环境变量加载 CLI 配置。"""

    device = os.getenv("LIBER_DEVICE", "auto")
    asr_model = os.getenv("LIBER_ASR_MODEL", "openai/whisper-large-v3")
    tts_model = os.getenv("LIBER_TTS_MODEL", "multilingual")

    return CLIConfig(
        device=device,
        asr=ASRConfig(model=asr_model, device=device),
        tts=TTSConfig(model=tts_model, device=device),
    )
