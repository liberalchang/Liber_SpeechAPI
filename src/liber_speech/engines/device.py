from __future__ import annotations

from dataclasses import dataclass

import torch


@dataclass(frozen=True)
class DeviceSpec:
    """设备规格。

    约定：
    - cpu: 使用 CPU
    - cuda:N: 使用 CUDA 第 N 张卡
    """

    device: str
    torch_dtype: object


def select_device(device: str | None = None) -> DeviceSpec:
    """选择推理设备。

    规则：
    - 显式传入时优先使用
    - 未传入时：优先 cuda:0，否则 cpu
    - 如果指定CUDA但不可用，自动回退到CPU并给出警告
    """

    if device:
        normalized = device.strip().lower()
        if normalized in {"auto"}:
            device = None
        else:
            if normalized == "cpu":
                return DeviceSpec(device="cpu", torch_dtype=torch.float32)
            if normalized.startswith("cuda"):
                if not torch.cuda.is_available():
                    print("[yellow]警告: CUDA不可用，自动回退到CPU[/yellow]")
                    return DeviceSpec(device="cpu", torch_dtype=torch.float32)
                if ":" not in normalized:
                    normalized = "cuda:0"
                return DeviceSpec(device=normalized, torch_dtype=torch.float16)
            raise RuntimeError(f"不支持的 device 配置: {device}")

    if torch.cuda.is_available():
        return DeviceSpec(device="cuda:0", torch_dtype=torch.float16)

    return DeviceSpec(device="cpu", torch_dtype=torch.float32)
