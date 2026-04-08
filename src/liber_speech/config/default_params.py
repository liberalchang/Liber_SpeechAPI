"""
默认参数加载模块
"""

import json
import os
from pathlib import Path
from typing import Dict, Any


def load_default_params() -> Dict[str, Any]:
    """
    加载默认参数配置
    
    Returns:
        Dict[str, Any]: 默认参数字典
    """
    current_dir = Path(__file__).parent
    config_file = current_dir / "default_params.json"
    
    if config_file.exists():
        with open(config_file, 'r', encoding='utf-8') as f:
            return json.load(f)
    else:
        # 如果配置文件不存在，返回基础默认配置
        return get_fallback_defaults()


def get_fallback_defaults() -> Dict[str, Any]:
    """
    获取备用默认配置，优先使用环境变量
    
    Returns:
        Dict[str, Any]: 备用默认配置
    """
    return {
        "asr": {
            "model": os.getenv("LIBER_ASR_MODEL", "openai/whisper-large-v3"),
            "device": os.getenv("LIBER_DEVICE", "auto"),
            "language": "zh",
            "task": "transcribe",
            "timestamp": "chunk",
            "batch_size": 24,
            "flash": False,
            "hf_token": None,
            "diarization_model": "pyannote/speaker-diarization-3.1",
            "num_speakers": None,
            "min_speakers": None,
            "max_speakers": None,
            "transcript_path": "output.json"
        },
        "tts": {
            "model": os.getenv("LIBER_TTS_MODEL", "multilingual"),
            "device": os.getenv("LIBER_DEVICE", "auto"),
            "language": "zh",
            "format": "wav",
            "repetition_penalty": 1.4,
            "temperature": 0.65,
            "top_p": 0.85,
            "top_k": 100,
            "norm_loudness": True,
            "exaggeration": 0.25,
            "cfg_weight": 0.3,
            "audio_prompt_path": None,
            "output_path": "output.wav"
        },
        "api": {
            "host": "127.0.0.1",
            "port": 8000,
            "auth_mode": "api_key",
            "api_keys": [],
            "results_dir": os.getenv("LIBER_RESULTS_DIR", "results"),
            "results_ttl_hours": 24
        },
        "global": {
            "hf_cache_dir": os.path.expanduser("~/.cache/huggingface/hub"),
            "log_level": "INFO",
            "max_workers": 4
        }
    }


def save_default_params(params: Dict[str, Any]) -> None:
    """
    保存默认参数到配置文件
    
    Args:
        params: 要保存的参数字典
    """
    current_dir = Path(__file__).parent
    config_file = current_dir / "default_params.json"
    
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(params, f, ensure_ascii=False, indent=2)


def get_asr_defaults() -> Dict[str, Any]:
    """获取ASR默认参数"""
    return load_default_params().get("asr", {})


def get_tts_defaults() -> Dict[str, Any]:
    """获取TTS默认参数"""
    return load_default_params().get("tts", {})


def get_api_defaults() -> Dict[str, Any]:
    """获取API默认参数"""
    return load_default_params().get("api", {})


def get_global_defaults() -> Dict[str, Any]:
    """获取全局默认参数"""
    return load_default_params().get("global", {})
