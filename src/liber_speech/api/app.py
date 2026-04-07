from __future__ import annotations

import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from . import config, deps, routes
from .models import ErrorResponse


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时执行：例如预热模型
    yield
    # 关闭时执行：清理资源


def create_app() -> FastAPI:
    app = FastAPI(
        title="Liber Speech API",
        description="ASR (Whisper) + TTS (Chatterbox) 服务",
        version="0.1.0",
        lifespan=lifespan,
    )

    # CORS
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # 生产环境建议限制
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 全局异常处理
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=ErrorResponse(error=str(exc), code=500).model_dump(),
        )

    # 路由
    app.include_router(routes.router, prefix="/api/v1")
    return app


app = create_app()
