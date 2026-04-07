from __future__ import annotations

from pathlib import Path
from typing import Annotated

import typer
from rich import print

from liber_speech.settings import load_cli_config
from ..engines import TTSEngine, TTSOptions
from ..engines.io_utils import save_wav, save_mp4, save_ogg_opus
from ..config.params_manager import create_tts_manager


app = typer.Typer(help="TTS 子命令")


@app.command()
def synthesize(
    text: Annotated[str, typer.Argument(help="待合成文本")],
    out: Annotated[Path, typer.Option("--output", "--out", "-o", help="输出文件路径（默认 output.wav）")] = None,
    model: Annotated[str, typer.Option("--model", help="TTS 模型（turbo/standard/multilingual）")] = None,
    device: Annotated[str, typer.Option("--device", help="推理设备（cpu/cuda:N）")] = None,
    language: Annotated[str | None, typer.Option("--language", help="多语模型语言代码（如 zh）")] = None,
    audio_prompt: Annotated[Path | None, typer.Option("--audio-prompt", help="参考音频路径（音色克隆）")] = None,
    format: Annotated[str, typer.Option("--format", help="输出格式（wav/mp4/ogg_opus）")] = None,
) -> None:
    """合成语音（同步模式）。"""

    import os
    
    # 使用参数管理器获取参数
    tts_manager = create_tts_manager()
    user_params = {
        "model": model,
        "device": device,
        "language": language,
        "format": format,
        "audio_prompt_path": str(audio_prompt) if audio_prompt else None
    }
    params = tts_manager.get_all_params(user_params)
    
    # 处理输出路径：与ASR保持一致的逻辑
    if out is None:
        results_dir = os.getenv("LIBER_RESULTS_DIR", "results")
        default_filename = f"tts_output.{params.get('format', 'wav')}"
        out = Path(results_dir) / default_filename
    else:
        out = Path(out)
        # 如果是相对路径，放到结果目录（与ASR逻辑一致）
        if not out.is_absolute():
            results_dir = Path(os.getenv("LIBER_RESULTS_DIR", "results"))
            out = results_dir / out
    
    # 从环境配置获取备用值
    cfg = load_cli_config()
    dev = params.get("device") if params.get("device") else cfg.tts.device
    model_name = params.get("model") if params.get("model") else cfg.tts.model
    
    opts = TTSOptions(
        model=model_name, 
        language_id=params.get("language")
    )
    try:
        engine = TTSEngine(device=dev, options=opts)
        print(f"[cyan]正在合成: {text[:60]}{'...' if len(text) > 60 else ''}[/cyan]")
        sr, wav = engine.generate_wav(text, audio_prompt_path=str(audio_prompt) if audio_prompt else None)
        print("[green]合成完成[/green]")
        # 根据格式保存
        fmt = params.get("format", "wav").lower()
        if fmt == "wav":
            save_wav(out, sr, wav)
        elif fmt == "mp4":
            save_mp4(out, sr, wav)
        elif fmt in {"ogg_opus", "ogg-opus", "ogg"}:
            save_ogg_opus(out, sr, wav)
        else:
            print(f"[red]不支持的格式: {fmt}[/red]")
            raise typer.Exit(1)
        print(f"[cyan]音频已保存到: {out}[/cyan]")
    except Exception as e:
        print(f"[red]合成失败: {e}[/red]")
        raise typer.Exit(1)
