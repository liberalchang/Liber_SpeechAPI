from __future__ import annotations

from pydantic import BaseModel


class ASRChunk(BaseModel):
    """ASR 分段结果。"""

    start: float
    end: float
    text: str
    speaker: str | None = None


class ASRResult(BaseModel):
    """ASR 输出结果（同步模式直返用）。"""

    text: str
    chunks: list[ASRChunk]
    meta: dict


class TTSResult(BaseModel):
    """TTS 输出结果。

    同步模式下通常直接返回二进制；此结构用于内部统一记录。
    """

    sample_rate: int
    duration_sec: float | None = None
    meta: dict
