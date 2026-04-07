from __future__ import annotations

import os
from pathlib import Path
from typing import Annotated

import typer
from rich import print

from liber_speech.settings import load_cli_config
from ..engines import ASREngine, ASROptions
from ..engines.io_types import ASRResult
from ..engines.io_utils import save_asr_json, save_asr_txt, save_asr_srt, save_asr_vtt
from ..config.params_manager import create_asr_manager


app = typer.Typer(help="ASR 子命令")


@app.command()
def transcribe(
    file: Annotated[Path, typer.Argument(help="音频文件或 URL")],
    out: Annotated[Path, typer.Option("--out", "-o", help="输出文件路径（默认 output.json）")] = Path("output.json"),
    model: Annotated[str, typer.Option("--model", help="Whisper 模型名")] = None,
    device: Annotated[str, typer.Option("--device", help="推理设备（cpu/cuda:N）")] = None,
    language: Annotated[str | None, typer.Option("--language", help="指定语言代码（不指定则自动检测）")] = None,
    timestamps: Annotated[str, typer.Option("--timestamps", help="时间戳级别（chunk/word）")] = None,
    flash: Annotated[bool, typer.Option("--flash", help="启用 Flash Attention 2")] = None,
) -> None:
    """转录音频（同步模式）。"""

    # 使用参数管理器获取参数
    asr_manager = create_asr_manager()
    user_params = {
        "model": model,
        "device": device,
        "language": language,
        "timestamp": timestamps,
        "flash": flash
    }
    params = asr_manager.get_all_params(user_params)
    
    # 从环境配置获取备用值
    cfg = load_cli_config()
    dev = params.get("device") if params.get("device") else cfg.asr.device
    model_name = params.get("model") if params.get("model") else cfg.asr.model
    language_param = params.get("language")
    
    opts = ASROptions(
        model_name=model_name, 
        language=language_param, 
        timestamps=params.get("timestamps", "chunk")
    )
    
    # 处理输出路径：如果是相对路径，放到结果目录
    results_dir = Path(os.getenv("LIBER_RESULTS_DIR", "results"))
    if not out.is_absolute():
        out = results_dir / out
    
    # 确保结果目录存在
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        engine = ASREngine(device=dev, options=opts)
        print(f"[cyan]正在转录: {file}[/cyan]")
        result: ASRResult = engine.transcribe(str(file))
        print("[green]转录完成[/green]")
        # 根据扩展名选择格式
        fmt = out.suffix.lower()
        if fmt == ".json":
            save_asr_json(result, out)
        elif fmt == ".txt":
            save_asr_txt(result, out)
        elif fmt == ".srt":
            save_asr_srt(result, out)
        elif fmt == ".vtt":
            save_asr_vtt(result, out)
        else:
            # 默认保存为 JSON
            save_asr_json(result, out)
        print(f"[cyan]结果已保存到: {out}[/cyan]")
    except Exception as e:
        print(f"[red]转录失败: {e}[/red]")
        raise typer.Exit(1)


@app.command()
def translate(
    file: Annotated[Path, typer.Argument(help="音频文件或 URL")],
    out: Annotated[Path, typer.Option("--out", "-o", help="输出文件路径（默认 output.json）")] = Path("output.json"),
    model: Annotated[str, typer.Option("--model", help="Whisper 模型名")] = None,
    device: Annotated[str, typer.Option("--device", help="推理设备（cpu/cuda:N）")] = None,
    language: Annotated[str | None, typer.Option("--language", help="指定语言代码（不指定则自动检测）")] = None,
    timestamps: Annotated[str, typer.Option("--timestamps", help="时间戳级别（chunk/word）")] = None,
    flash: Annotated[bool, typer.Option("--flash", help="启用 Flash Attention 2")] = None,
) -> None:
    """翻译音频（同步模式，任务=translate）。"""

    # 使用参数管理器获取参数
    asr_manager = create_asr_manager()
    user_params = {
        "model": model,
        "device": device,
        "language": language,
        "timestamp": timestamps,
        "flash": flash
    }
    params = asr_manager.get_all_params(user_params)
    
    # 从环境配置获取备用值
    cfg = load_cli_config()
    dev = params.get("device") if params.get("device") else cfg.asr.device
    model_name = params.get("model") if params.get("model") else cfg.asr.model
    opts = ASROptions(
        model_name=model_name, 
        task="translate",
        language=params.get("language"), 
        timestamps=params.get("timestamps", "chunk")
    )
    
    # 处理输出路径：如果是相对路径，放到结果目录
    results_dir = Path(os.getenv("LIBER_RESULTS_DIR", "results"))
    if not out.is_absolute():
        out = results_dir / out
    
    # 确保结果目录存在
    out.parent.mkdir(parents=True, exist_ok=True)
    try:
        engine = ASREngine(device=dev, options=opts)
        print(f"[cyan]正在翻译: {file}[/cyan]")
        result: ASRResult = engine.transcribe(str(file))
        print("[green]翻译完成[/green]")
        fmt = out.suffix.lower()
        if fmt == ".json":
            save_asr_json(result, out)
        elif fmt == ".txt":
            save_asr_txt(result, out)
        elif fmt == ".srt":
            save_asr_srt(result, out)
        elif fmt == ".vtt":
            save_asr_vtt(result, out)
        else:
            save_asr_json(result, out)
        print(f"[cyan]结果已保存到: {out}[/cyan]")
    except Exception as e:
        print(f"[red]翻译失败: {e}[/red]")
        raise typer.Exit(1)
