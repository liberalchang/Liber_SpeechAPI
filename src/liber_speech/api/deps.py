from __future__ import annotations

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from .config import load_config

security = HTTPBearer(auto_error=False)


def get_current_config():
    """获取当前 API 配置。"""
    return load_config()


def get_auth_credentials(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(security)],
    cfg: Annotated[dict, Depends(get_current_config)],
):
    """鉴权依赖。"""
    if cfg.auth.mode == "none":
        return None
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API Key 缺失",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if credentials.credentials not in cfg.auth.api_keys:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="API Key 无效",
        )
    return credentials.credentials
