from __future__ import annotations

import os
from pathlib import Path
from typing import Literal

from pydantic import BaseModel, Field

_DOTENV_LOADED = False


def _try_load_dotenv() -> None:
    """尝试自动加载 .env。

    说明：
    - uv / python 默认不会自动读取磁盘上的 .env 文件；必须显式加载。
    - 这里使用 python-dotenv（已在依赖中）读取 .env。
    - 默认不覆盖系统环境变量（override=False），避免部署时被 .env 意外覆盖。
    """

    global _DOTENV_LOADED
    if _DOTENV_LOADED:
        return

    try:
        from dotenv import find_dotenv, load_dotenv
    except Exception:
        # 依赖缺失时直接跳过，不影响服务启动
        _DOTENV_LOADED = True
        return

    # 优先从当前工作目录向上查找 .env
    dotenv_path = find_dotenv(usecwd=True)

    # 如果找不到，再从源码目录向上尝试（适配某些以其它目录作为 CWD 启动的场景）
    if not dotenv_path:
        here = Path(__file__).resolve()
        for parent in [here.parent, *here.parents]:
            candidate = parent / ".env"
            if candidate.is_file():
                dotenv_path = str(candidate)
                break

    if dotenv_path:
        load_dotenv(dotenv_path=dotenv_path, override=False)

    _DOTENV_LOADED = True


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

    # 自动加载 .env（若存在）
    _try_load_dotenv()

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
