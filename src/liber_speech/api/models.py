from __future__ import annotations

from typing import Any

from pydantic import BaseModel, Field


class ErrorResponse(BaseModel):
    """统一错误响应。"""

    error: str = Field(description="错误信息")
    code: int = Field(description="错误码")


class HealthResponse(BaseModel):
    """健康检查响应。"""

    status: str = Field(description="服务状态")
    version: str = Field(description="版本号")
    asr_ready: bool = Field(description="ASR 模型是否就绪")
    tts_ready: bool = Field(description="TTS 模型是否就绪")


class ASRRequest(BaseModel):
    """ASR 请求。"""

    url: str | None = Field(default=None, description="音频 URL")
    language: str | None = Field(default=None, description="语言代码（不指定则自动检测）")
    task: str = Field(default="transcribe", description="任务（transcribe/translate）")
    timestamps: str = Field(default="chunk", description="时间戳级别（chunk/word）")


class ASRResponse(BaseModel):
    """ASR 同步响应。"""

    text: str = Field(description="转录文本")
    chunks: list[dict[str, Any]] = Field(description="分段结果")
    meta: dict[str, Any] = Field(description="元信息")


class TTSRequest(BaseModel):
    """TTS 请求。"""

    text: str = Field(description="待合成文本")
    model: str = Field(default="multilingual", description="TTS 模型（turbo/standard/multilingual）")
    language: str | None = Field(default=None, description="多语模型语言代码")
    format: str = Field(default="wav", description="输出格式（wav/mp4/ogg_opus）")
    audio_prompt_url: str | None = Field(default=None, description="音色克隆参考音频 URL")


class TTSResponse(BaseModel):
    """TTS 同步响应。"""

    audio_url: str = Field(description="音频文件 URL")
    meta: dict[str, Any] = Field(description="元信息")


class TaskSubmitResponse(BaseModel):
    """异步任务提交响应。"""

    task_id: str = Field(description="任务 ID")
    status: str = Field(description="任务状态（pending/running/completed/failed）")


class TaskStatusResponse(BaseModel):
    """任务状态查询响应。"""

    task_id: str = Field(description="任务 ID")
    status: str = Field(description="任务状态")
    result_url: str | None = Field(description="结果文件 URL（完成时）")
    error: str | None = Field(description="错误信息（失败时）")
    meta: dict[str, Any] = Field(description="元信息")
