from __future__ import annotations

import os
from pathlib import Path


def resolve_hf_cache_dir(hf_cache_dir: str | None = None) -> str | None:
    """解析 HuggingFace 缓存目录。

    优先级：
    1) 显式参数
    2) 环境变量 LIBER_HF_CACHE_DIR
    3) 环境变量 HF_HOME / TRANSFORMERS_CACHE（由生态自行处理）

    返回：
    - 目录路径字符串，或 None（表示使用默认策略）
    """

    if hf_cache_dir:
        return str(Path(hf_cache_dir).expanduser().resolve())

    env_val = os.getenv("LIBER_HF_CACHE_DIR")
    if env_val:
        return str(Path(env_val).expanduser().resolve())

    return None
