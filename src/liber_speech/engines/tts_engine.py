from __future__ import annotations

from dataclasses import dataclass
import glob
import json
import os
import inspect
from typing import Any

import torch

from .device import DeviceSpec, select_device
from .model_cache import resolve_hf_cache_dir


@dataclass
class TTSOptions:
    """TTS 可选参数。"""

    model: str = "multilingual"  # turbo/standard/multilingual
    language_id: str | None = None
    generate_params: dict[str, Any] | None = None


class TTSEngine:
    """Chatterbox TTS 引擎（同步）。"""

    def __init__(self, device: str | None = None, options: TTSOptions | None = None):
        self._device_spec: DeviceSpec = select_device(device)
        self._options = options or TTSOptions()
        self._model = None

        hf_cache_dir = resolve_hf_cache_dir()
        if hf_cache_dir:
            os.environ.setdefault("HF_HOME", hf_cache_dir)
            os.environ.setdefault("TRANSFORMERS_CACHE", hf_cache_dir)
        
        # 尝试查找本地 TTS 模型
        self._local_model_path = self._find_local_tts_model()
    
    def _find_local_tts_model(self) -> str | None:
        """查找本地 TTS 模型路径"""
        # TTS 模型的可能本地路径
        model_mappings = {
            "multilingual": "ResembleAI/chatterbox",
            "turbo": "ResembleAI/chatterbox", 
            "standard": "ResembleAI/chatterbox"
        }
        
        if self._options.model in model_mappings:
            hf_model_name = model_mappings[self._options.model]
            potential_paths = [
                f"models/hub/models--{hf_model_name.replace('/', '--')}/snapshots/*",
                f"./models/hub/models--{hf_model_name.replace('/', '--')}/snapshots/*",
                f"{resolve_hf_cache_dir()}/models--{hf_model_name.replace('/', '--')}/snapshots/*" if resolve_hf_cache_dir() else None,
                f"{resolve_hf_cache_dir()}/hub/models--{hf_model_name.replace('/', '--')}/snapshots/*" if resolve_hf_cache_dir() else None
            ]
            
            for path_pattern in potential_paths:
                if path_pattern:
                    matches = glob.glob(path_pattern)
                    if matches:
                        # 选择最新的快照目录
                        latest_snapshot = sorted(matches, key=os.path.getmtime, reverse=True)[0]
                        
                        # 检查并创建 config.json
                        config_file = os.path.join(latest_snapshot, "config.json")
                        if not os.path.exists(config_file):
                            self._create_config_file(config_file)
                        
                        print(f"[cyan]使用本地 TTS 模型: {latest_snapshot}[/cyan]")
                        return latest_snapshot
        
        return None
    
    def _create_config_file(self, config_path: str) -> None:
        """为本地模型创建 config.json 文件"""
        config = {
            "model_type": "chatterbox",
            "architectures": ["ChatterboxMultilingualTTS"],
            "task": "text-to-speech",
            "vocab_size": 256,
            "hidden_size": 1024,
            "num_hidden_layers": 12,
            "num_attention_heads": 16,
            "intermediate_size": 4096,
            "hidden_act": "gelu",
            "hidden_dropout_prob": 0.1,
            "attention_probs_dropout_prob": 0.1,
            "max_position_embeddings": 2048,
            "initializer_range": 0.02,
            "layer_norm_eps": 1e-12,
            "use_cache": True,
            "pad_token_id": 0,
            "bos_token_id": 1,
            "eos_token_id": 2,
            "torch_dtype": "float16",
            "transformers_version": "4.21.0"
        }
        
        try:
            with open(config_path, 'w', encoding='utf-8') as f:
                json.dump(config, f, indent=2, ensure_ascii=False)
            print(f"[green]已创建 config.json: {config_path}[/green]")
        except Exception as e:
            print(f"[yellow]创建 config.json 失败: {e}[/yellow]")

    @property
    def device(self) -> str:
        return self._device_spec.device

    @property
    def options(self) -> TTSOptions:
        return self._options

    def load(self) -> None:
        """懒加载模型。"""

        if self._model is not None:
            return

        # 设置环境变量强制使用本地缓存
        hf_cache_dir = resolve_hf_cache_dir()
        if hf_cache_dir:
            os.environ["HF_HOME"] = hf_cache_dir
            os.environ["TRANSFORMERS_CACHE"] = hf_cache_dir
            os.environ["HUGGINGFACE_HUB_CACHE"] = hf_cache_dir

        # 首先尝试使用本地模型路径（参考 ASR 引擎的成功实现）
        if self._local_model_path:
            try:
                if self._options.model == "turbo":
                    from chatterbox.tts_turbo import ChatterboxTurboTTS
                    self._model = ChatterboxTurboTTS.from_pretrained(self._local_model_path)
                elif self._options.model == "standard":
                    from chatterbox.tts import ChatterboxTTS
                    self._model = ChatterboxTTS.from_pretrained(self._local_model_path)
                elif self._options.model == "multilingual":
                    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
                    self._model = ChatterboxMultilingualTTS.from_pretrained(self._local_model_path)
                
                print(f"[green]成功加载 {self._options.model} TTS 模型（本地路径）[/green]")
                return
            except Exception as e:
                print(f"[yellow]本地路径加载失败，尝试模型 ID: {e}[/yellow]")

        # 本地路径失败，尝试离线模式的模型 ID
        os.environ["HF_OFFLINE"] = "1"
        os.environ["TRANSFORMERS_OFFLINE"] = "1"
        os.environ["HUGGINGFACE_HUB_OFFLINE"] = "1"

        try:
            if self._options.model == "turbo":
                from chatterbox.tts_turbo import ChatterboxTurboTTS
                self._model = ChatterboxTurboTTS.from_pretrained(device=self._device_spec.device)
            elif self._options.model == "standard":
                from chatterbox.tts import ChatterboxTTS
                self._model = ChatterboxTTS.from_pretrained(device=self._device_spec.device)
            elif self._options.model == "multilingual":
                from chatterbox.mtl_tts import ChatterboxMultilingualTTS
                self._model = ChatterboxMultilingualTTS.from_pretrained(device=self._device_spec.device)
            
            print(f"[green]成功加载 {self._options.model} TTS 模型（本地缓存）[/green]")
            return
        except Exception as e:
            print(f"[yellow]本地缓存加载失败，尝试网络下载: {e}[/yellow]")
            # 清除离线模式，尝试网络下载
            os.environ.pop("HF_OFFLINE", None)
            os.environ.pop("TRANSFORMERS_OFFLINE", None)
            os.environ.pop("HUGGINGFACE_HUB_OFFLINE", None)
            try:
                if self._options.model == "turbo":
                    from chatterbox.tts_turbo import ChatterboxTurboTTS
                    self._model = ChatterboxTurboTTS.from_pretrained(device=self._device_spec.device)
                elif self._options.model == "standard":
                    from chatterbox.tts import ChatterboxTTS
                    self._model = ChatterboxTTS.from_pretrained(device=self._device_spec.device)
                elif self._options.model == "multilingual":
                    from chatterbox.mtl_tts import ChatterboxMultilingualTTS
                    self._model = ChatterboxMultilingualTTS.from_pretrained(device=self._device_spec.device)
                
                print(f"[green]成功加载 {self._options.model} TTS 模型（网络下载）[/green]")
            except Exception as e2:
                print(f"[red]{self._options.model} TTS 模型加载失败（所有方式都失败）: {e2}[/red]")
                self._model = None  # 明确设置为 None
                raise RuntimeError(f"无法加载 {self._options.model} TTS 模型: {e2}")

        # 如果到达这里，说明模型类型不支持
        self._model = None  # 明确设置为 None
        raise RuntimeError(f"不支持的 TTS 模型类型: {self._options.model}")

    def generate_wav(self, text: str, audio_prompt_path: str | None = None) -> tuple[int, torch.Tensor]:
        """生成 wav（tensor），由上层决定如何保存/转码。"""

        self.load()

        # 确保模型已正确加载
        if self._model is None:
            raise RuntimeError(f"TTS 模型未正确加载，模型类型: {self._options.model}")

        kwargs: dict[str, Any] = {}
        if audio_prompt_path:
            kwargs["audio_prompt_path"] = audio_prompt_path

        if self._options.model == "multilingual":
            if not self._options.language_id:
                raise ValueError("multilingual 模型需要 language_id")
            kwargs["language_id"] = self._options.language_id

        if self._options.generate_params:
            kwargs.update(self._options.generate_params)

        # 确保模型有 generate 方法
        if not hasattr(self._model, 'generate') or not callable(getattr(self._model, 'generate')):
            raise RuntimeError(f"TTS 模型缺少 generate 方法: {type(self._model)}")

        filtered_kwargs: dict[str, Any] = {}
        try:
            sig = inspect.signature(self._model.generate)
            params = sig.parameters
            accepts_var_kw = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in params.values())
            if accepts_var_kw:
                filtered_kwargs = kwargs
            else:
                filtered_kwargs = {k: v for k, v in kwargs.items() if k in params}
        except Exception:
            filtered_kwargs = kwargs

        wav = self._model.generate(text, **filtered_kwargs)
        
        # 处理张量维度：如果是3D张量，压缩到2D
        if hasattr(wav, 'dim') and wav.dim() == 3:
            wav = wav.squeeze(0)  # 移除批次维度
        
        sr = int(getattr(self._model, "sr", 24000))
        return sr, wav
