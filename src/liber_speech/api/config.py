from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field


class AuthConfig(BaseModel):
    """鉴权配置。"""

    mode: Literal["none", "api_key"] = Field(default="api_key", description="鉴权模式")
    api_keys: list[str] = Field(default_factory=list, description="允许的 API Keys")


class ResultsConfig(BaseModel):
    """结果文件管理配置。"""

    dir: Path = Field(default=Path("results"), description="异步任务结果目录")
    ttl_hours: int = Field(default=24, description="结果保留时长（小时）")


class APIConfig(BaseModel):
    """API 服务配置。"""

    host: str = Field(default="0.0.0.0", description="监听地址")
    api_port: int = Field(default=5555, description="API 服务端口")
    auth: AuthConfig = Field(default_factory=AuthConfig)
    results: ResultsConfig = Field(default_factory=ResultsConfig)


def load_config() -> APIConfig:
    """从环境变量加载配置。"""

    auth_mode = os.getenv("LIBER_API_AUTH_MODE", "api_key")
    api_keys_str = os.getenv("LIBER_API_KEYS", "")
    api_keys = [k.strip() for k in api_keys_str.split(",") if k.strip()] if api_keys_str else []

    results_dir = os.getenv("LIBER_RESULTS_DIR", "results")
    ttl_hours = int(os.getenv("LIBER_RESULTS_TTL_HOURS", "24"))

    host = os.getenv("LIBER_API_HOST", "0.0.0.0")
    port = int(os.getenv("LIBER_API_PORT", "5555"))

    return APIConfig(
        host=host,
        port=port,
        auth=AuthConfig(mode=auth_mode, api_keys=api_keys),
        results=ResultsConfig(dir=Path(results_dir), ttl_hours=ttl_hours),
    )
