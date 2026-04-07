from __future__ import annotations

import typer

# 注册子命令模块
from . import commands_asr, commands_tts, commands_doctor, commands_warmup, commands_serve

app = typer.Typer(help="Liber Speech CLI")

app.add_typer(commands_asr.app, name="asr", help="ASR 子命令")
app.add_typer(commands_tts.app, name="tts", help="TTS 子命令")
app.add_typer(commands_doctor.app, name="doctor", help="诊断环境")
app.add_typer(commands_warmup.app, name="warmup", help="模型预暖")
app.add_typer(commands_serve.app_serve, name="serve", help="启动 API 服务")


@app.command()
def version() -> None:
    """输出版本信息。"""

    from liber_speech import __version__

    typer.echo(__version__)
