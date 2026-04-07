from __future__ import annotations

from typing import Annotated

import typer
from rich import print

from ..engines import ASREngine, ASROptions, TTSEngine, TTSOptions


app = typer.Typer(help="模型预暖")


@app.command()
def warmup(
    asr_model: Annotated[str, typer.Option("--asr-model", help="ASR 模型名")] = "openai/whisper-large-v3",
    tts_model: Annotated[str, typer.Option("--tts-model", help="TTS 模型（turbo/standard/multilingual）")] = "multilingual",
    device: Annotated[str, typer.Option("--device", help="推理设备（cpu/cuda:N）")] = "auto",
) -> None:
    """预加载 ASR 与 TTS 模型以减少首次推理延迟。"""

    dev = None if device == "auto" else device
    print("[cyan]开始模型预暖...[/cyan]")
    try:
        # ASR 预暖
        print("[cyan]加载 ASR 模型...[/cyan]")
        asr_opts = ASROptions(model_name=asr_model)
        asr_engine = ASREngine(device=dev, options=asr_opts)
        print(f"[green]ASR 模型已加载: {asr_model} ({asr_engine.device})[/green]")

        # TTS 预暖
        print("[cyan]加载 TTS 模型...[/cyan]")
        tts_opts = TTSOptions(model=tts_model)
        tts_engine = TTSEngine(device=dev, options=tts_opts)
        tts_engine.load()
        print(f"[green]TTS 模型已加载: {tts_model} ({tts_engine.device})[/green]")

        print("[green]模型预暖完成[/green]")
    except Exception as e:
        print(f"[red]预暖失败: {e}[/red]")
        raise typer.Exit(1)
