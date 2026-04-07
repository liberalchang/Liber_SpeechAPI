from __future__ import annotations

from typing import Annotated

import typer
from rich import print

from ..api.app import app as fastapi_app


def _run_server(host: str, port: int) -> None:
    import uvicorn

    print(f"[cyan]启动 API 服务: http://{host}:{port}[/cyan]")
    print("[cyan]API 文档: http://{host}:{port}/docs[/cyan]")
    uvicorn.run(fastapi_app, host=host, port=port)


app_serve = typer.Typer(help="启动 API 服务")


@app_serve.command()
def serve(
    host: Annotated[str, typer.Option("--host", help="监听地址")] = "0.0.0.0",
    port: Annotated[int, typer.Option("--port", help="监听端口")] = 5555,
) -> None:
    """启动 FastAPI 服务。"""

    try:
        _run_server(host, port)
    except KeyboardInterrupt:
        print("\n[green]服务已停止[/green]")
    except Exception as e:
        print(f"[red]启动失败: {e}[/red]")
        raise typer.Exit(1)
