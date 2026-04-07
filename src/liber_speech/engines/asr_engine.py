from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import os

import torch
from transformers import pipeline

from .device import DeviceSpec, select_device
from .io_types import ASRChunk, ASRResult
from .model_cache import resolve_hf_cache_dir


@dataclass
class ASROptions:
    """ASR 可选参数。"""

    model_name: str = "openai/whisper-large-v3"
    task: str = "transcribe"  # transcribe/translate
    language: str | None = None
    batch_size: int = 24
    chunk_length_s: int = 30
    timestamps: str = "chunk"  # chunk/word


class ASREngine:
    """Whisper ASR 引擎（同步）。"""

    def __init__(self, device: str | None = None, options: ASROptions | None = None):
        self._device_spec: DeviceSpec = select_device(device)
        self._options = options or ASROptions()

        hf_cache_dir = resolve_hf_cache_dir()
        if hf_cache_dir:
            os.environ.setdefault("HF_HOME", hf_cache_dir)
            os.environ.setdefault("TRANSFORMERS_CACHE", hf_cache_dir)
        
        # 尝试本地模型路径
        local_model_path = None
        potential_paths = [
            f"models/hub/models--{self._options.model_name.replace('/', '--')}/snapshots/*/model",
            f"./models/hub/models--{self._options.model_name.replace('/', '--')}/snapshots/*/model",
            hf_cache_dir + f"/models--{self._options.model_name.replace('/', '--')}/snapshots/*/model" if hf_cache_dir else None,
            hf_cache_dir + f"/hub/models--{self._options.model_name.replace('/', '--')}/snapshots/*/model" if hf_cache_dir else None
        ]
        
        # 查找最新的快照目录
        import glob
        for path_pattern in potential_paths:
            if path_pattern:
                matches = glob.glob(path_pattern)
                if matches:
                    # 选择最新的匹配目录
                    local_model_path = sorted(matches, key=os.path.getmtime, reverse=True)[0]
                    print(f"[cyan]使用本地模型: {local_model_path}[/cyan]")
                    break
        
        # 如果没找到 model 子目录，尝试直接使用模型根目录
        if not local_model_path:
            root_paths = [
                f"models/hub/models--{self._options.model_name.replace('/', '--')}",
                f"./models/hub/models--{self._options.model_name.replace('/', '--')}",
                hf_cache_dir + f"/models--{self._options.model_name.replace('/', '--')}" if hf_cache_dir else None,
                hf_cache_dir + f"/hub/models--{self._options.model_name.replace('/', '--')}" if hf_cache_dir else None
            ]
            for path in root_paths:
                if path and os.path.exists(path):
                    # 查找快照目录
                    snapshots = glob.glob(f"{path}/snapshots/*")
                    if snapshots:
                        latest_snapshot = sorted(snapshots, key=os.path.getmtime, reverse=True)[0]
                        local_model_path = latest_snapshot
                        print(f"[cyan]使用本地模型: {local_model_path}[/cyan]")
                        break
        
        model_to_load = local_model_path if local_model_path else self._options.model_name

        # transformers pipeline 的 device 参数在不同版本有差异；这里用 torch.device 统一处理
        # cuda:0 -> 0; cpu -> -1
        device_index = -1
        if self._device_spec.device.startswith("cuda"):
            device_index = int(self._device_spec.device.split(":", 1)[1])

        self._pipe = pipeline(
            task="automatic-speech-recognition",
            model=model_to_load,
            device=device_index,
            dtype=self._device_spec.torch_dtype,
        )

    @property
    def device(self) -> str:
        return self._device_spec.device

    def transcribe(self, file_name_or_url: str) -> ASRResult:
        """转录音频，返回 JSON 可序列化结构。"""

        generate_kwargs: dict[str, Any] = {
            "task": self._options.task,
        }
        if self._options.language:
            generate_kwargs["language"] = self._options.language

        # timestamps: transformers pipeline 接受 return_timestamps=True/'word'
        return_timestamps: Any = True
        if self._options.timestamps == "word":
            return_timestamps = "word"

        outputs = self._pipe(
            file_name_or_url,
            chunk_length_s=self._options.chunk_length_s,
            batch_size=self._options.batch_size,
            return_timestamps=return_timestamps,
            generate_kwargs=generate_kwargs,
            ignore_warning=True,
        )

        # outputs 通常包含 text 与 chunks（chunks 包含 timestamp + text）
        text = outputs.get("text", "")
        chunks: list[ASRChunk] = []
        for c in outputs.get("chunks", []) or []:
            ts = c.get("timestamp") or c.get("timestamps")
            if not ts or len(ts) != 2:
                continue
            chunks.append(
                ASRChunk(
                    start=float(ts[0]),
                    end=float(ts[1]),
                    text=str(c.get("text", "")),
                )
            )

        meta = {
            "model": self._options.model_name,
            "device": self._device_spec.device,
            "dtype": "fp16" if self._device_spec.torch_dtype == torch.float16 else "fp32",
            "task": self._options.task,
            "timestamps": self._options.timestamps,
        }
        return ASRResult(text=text, chunks=chunks, meta=meta)
