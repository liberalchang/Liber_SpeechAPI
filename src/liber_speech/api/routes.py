from __future__ import annotations

import asyncio
import uuid
import logging
import tempfile
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Annotated

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.responses import FileResponse

from ..engines import ASREngine, ASROptions, TTSEngine, TTSOptions
from .config import load_config
from .deps import get_auth_credentials, get_current_config
from .models import (
    ASRRequest,
    ASRResponse,
    ErrorResponse,
    HealthResponse,
    TaskStatusResponse,
    TaskSubmitResponse,
    TTSRequest,
    TTSResponse,
)

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_temp_dir():
    """获取系统临时目录"""
    return tempfile.gettempdir()

router = APIRouter()

# 全局引擎实例（懒加载）
_asr_engine: ASREngine | None = None
_tts_engine: TTSEngine | None = None


def get_asr_engine() -> ASREngine:
    global _asr_engine
    if _asr_engine is None:
        _asr_engine = ASREngine()
    return _asr_engine


def get_tts_engine() -> TTSEngine:
    global _tts_engine
    if _tts_engine is None:
        _tts_engine = TTSEngine()
    return _tts_engine


@router.get("/health", response_model=HealthResponse)
async def health():
    """健康检查。"""
    logger.info("收到健康检查请求")
    cfg = load_config()
    asr_ready = _asr_engine is not None
    tts_ready = _tts_engine is not None
    logger.info(f"ASR 就绪状态: {asr_ready}, TTS 就绪状态: {tts_ready}")
    return HealthResponse(
        status="ok",
        version="0.1.0",
        asr_ready=asr_ready,
        tts_ready=tts_ready,
    )


@router.post("/warmup")
async def warmup(
    _: Annotated[str | None, Depends(get_auth_credentials)],
):
    """预热模型。"""
    logger.info("收到模型预热请求")
    logger.info("正在初始化 ASR 引擎...")
    get_asr_engine()
    logger.info("ASR 引擎初始化完成")
    logger.info("正在初始化 TTS 引擎...")
    get_tts_engine()
    logger.info("TTS 引擎初始化完成")
    return {"status": "warmed up"}


# ASR 同步接口
@router.post("/asr/transcribe", response_model=ASRResponse)
async def transcribe(
    _: Annotated[str | None, Depends(get_auth_credentials)],
    file: UploadFile | None = File(None),
    url: str | None = Form(None),
    language: str | None = Form(None),
    task: str = Form("transcribe"),
    timestamps: str = Form("chunk"),
):
    """ASR 转录（同步）。"""
    logger.info("收到 ASR 转录请求")
    logger.info(f"参数: file={file.filename if file else None}, url={url}, language={language}, task={task}, timestamps={timestamps}")
    
    if not file and not url:
        logger.error("请求错误：必须提供 file 或 url")
        raise HTTPException(status_code=400, detail="必须提供 file 或 url")
    
    if file and file.filename:
        logger.info(f"处理上传文件: {file.filename}")
        # 保存临时文件
        temp_dir = get_temp_dir()
        tmp_path = Path(temp_dir) / f"{uuid.uuid4().hex}_{file.filename}"
        tmp_path.write_bytes(await file.read())
        input_path = str(tmp_path)
        logger.info(f"文件已保存到: {input_path}")
    else:
        input_path = url  # type: ignore
        logger.info(f"处理 URL: {input_path}")

    try:
        logger.info("开始 ASR 转录...")
        engine = get_asr_engine()
        opts = ASROptions(language=language, task=task, timestamps=timestamps)
        # 简化：直接使用全局引擎，暂不按请求重建
        # TODO: 支持按请求参数动态重建引擎
        result = engine.transcribe(input_path)
        logger.info(f"ASR 转录完成，识别文本: {result.text[:100]}...")
        return ASRResponse(text=result.text, chunks=[c.model_dump() for c in result.chunks], meta=result.meta)
    except Exception as e:
        logger.error(f"ASR 转录失败: {str(e)}")
        raise
    finally:
        if file and file.filename:
            Path(input_path).unlink(missing_ok=True)
            logger.info(f"临时文件已删除: {input_path}")


# TTS 同步接口
@router.post("/tts/synthesize", response_model=TTSResponse)
async def synthesize(
    _: Annotated[str | None, Depends(get_auth_credentials)],
    text: str = Form(...),
    model: str = Form("multilingual"),
    language: str | None = Form(None),
    format: str = Form("wav"),
    audio_prompt: UploadFile | None = File(None),
):
    """TTS 合成（同步）。"""
    logger.info("收到 TTS 合成请求")
    logger.info(f"参数: text={text[:50]}..., model={model}, language={language}, format={format}")
    
    engine = get_tts_engine()
    opts = TTSOptions(model=model, language_id=language)
    # 简化：直接使用全局引擎
    # TODO: 支持按请求参数动态重建引擎
    audio_prompt_path = None
    if audio_prompt and audio_prompt.filename:
        logger.info(f"处理音频提示文件: {audio_prompt.filename}")
        temp_dir = get_temp_dir()
        tmp_prompt = Path(temp_dir) / f"{uuid.uuid4().hex}_{audio_prompt.filename}"
        tmp_prompt.write_bytes(await audio_prompt.read())
        audio_prompt_path = str(tmp_prompt)
        logger.info(f"音频提示文件已保存到: {audio_prompt_path}")

    try:
        logger.info("开始 TTS 合成...")
        sr, wav = engine.generate_wav(text, audio_prompt_path=audio_prompt_path)
        logger.info(f"TTS 合成完成，采样率: {sr}, 音频长度: {len(wav)}")
        
        # 保存到结果目录并返回下载 URL
        cfg = load_config()
        out_dir = Path(cfg.results.dir)
        out_dir.mkdir(parents=True, exist_ok=True)
        out_name = f"{uuid.uuid4().hex}.{format}"
        out_path = out_dir / out_name
        logger.info(f"保存音频文件到: {out_path}")
        
        if format == "wav":
            from ..engines.io_utils import save_wav
            save_wav(out_path, sr, wav)
        elif format == "mp4":
            from ..engines.io_utils import save_mp4
            save_mp4(out_path, sr, wav)
        elif format in {"ogg_opus", "ogg"}:
            from ..engines.io_utils import save_ogg_opus
            save_ogg_opus(out_path, sr, wav)
        else:
            logger.error(f"不支持的音频格式: {format}")
            raise HTTPException(status_code=400, detail=f"不支持的格式: {format}")

        # 简化：直接返回静态文件 URL，实际部署需配合静态文件服务
        audio_url = f"/api/v1/results/{out_name}"
        logger.info(f"TTS 合成完成，音频 URL: {audio_url}")
        return TTSResponse(audio_url=audio_url, meta={"format": format, "sample_rate": sr})
    except Exception as e:
        logger.error(f"TTS 合成失败: {str(e)}")
        raise
    finally:
        if audio_prompt_path:
            Path(audio_prompt_path).unlink(missing_ok=True)
            logger.info(f"音频提示临时文件已删除: {audio_prompt_path}")


# 异步任务接口（示例框架，实际需配合任务队列）
@router.post("/tasks/asr/transcribe", response_model=TaskSubmitResponse)
async def submit_asr_task(
    _: Annotated[str | None, Depends(get_auth_credentials)],
    file: UploadFile | None = File(None),
    url: str | None = Form(None),
    language: str | None = Form(None),
    task: str = Form("transcribe"),
    timestamps: str = Form("chunk"),
):
    """提交 ASR 异步任务。"""
    if not file and not url:
        raise HTTPException(status_code=400, detail="必须提供 file 或 url")
    task_id = uuid.uuid4().hex
    # TODO: 提交到任务队列并立即返回 task_id
    return TaskSubmitResponse(task_id=task_id, status="pending")


@router.get("/tasks/{task_id}", response_model=TaskStatusResponse)
async def get_task_status(
    _: Annotated[str | None, Depends(get_auth_credentials)],
    task_id: str,
):
    """查询任务状态。"""
    # TODO: 从任务存储查询状态
    return TaskStatusResponse(task_id=task_id, status="pending", result_url=None, error=None, meta={})


@router.get("/results/{filename}")
async def download_result(filename: str):
    """下载结果文件。"""
    cfg = load_config()
    file_path = Path(cfg.results.dir) / filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(file_path)
