from __future__ import annotations

import os
import platform
import shutil
import subprocess
from typing import Annotated

import typer
from rich import print

from ..engines.model_cache import resolve_hf_cache_dir


def _check_python() -> None:
    print("[cyan]Python 环境:[/cyan]")
    print(f"  版本: {platform.python_version()}")
    print(f"  可执行文件: {os.path.abspath(os.path.executable)}")
    print(f"  平台: {platform.system()} {platform.release()}")


def _check_torch() -> None:
    print("\n[cyan]PyTorch:[/cyan]")
    try:
        import torch
        print(f"  版本: {torch.__version__}")
        print(f"  CUDA 可用: {torch.cuda.is_available()}")
        if torch.cuda.is_available():
            print(f"  CUDA 版本: {torch.version.cuda}")
            print(f"  GPU 数量: {torch.cuda.device_count()}")
            for i in range(torch.cuda.device_count()):
                print(f"    GPU {i}: {torch.cuda.get_device_name(i)}")
    except Exception as e:
        print(f"  [red]导入失败: {e}[/red]")


def _check_transformers() -> None:
    print("\n[cyan]Transformers:[/cyan]")
    try:
        import transformers
        print(f"  版本: {transformers.__version__}")
    except Exception as e:
        print(f"  [red]导入失败: {e}[/red]")


def _check_chatterbox() -> None:
    print("\n[cyan]Chatterbox TTS:[/cyan]")
    try:
        import chatterbox
        print(f"  版本: {getattr(chatterbox, '__version__', '未知')}")
    except Exception as e:
        print(f"  [red]导入失败: {e}[/red]")


def _check_ffmpeg() -> None:
    print("\n[cyan]FFmpeg:[/cyan]")
    exe = "ffmpeg.exe" if platform.system() == "Windows" else "ffmpeg"
    path = shutil.which(exe)
    if path:
        print(f"  路径: {path}")
        try:
            ver = subprocess.run([exe, "-version"], capture_output=True, text=True, check=True)
            first = ver.stdout.splitlines()[0]
            print(f"  版本: {first}")
        except Exception as e:
            print(f"  [yellow]获取版本失败: {e}[/yellow]")
    else:
        print("  [red]未找到 FFmpeg[/red]")


def _check_hf_cache() -> None:
    print("\n[cyan]HuggingFace 缓存:[/cyan]")
    cache_dir = resolve_hf_cache_dir()
    if cache_dir:
        print(f"  自定义缓存目录: {cache_dir}")
    else:
        print("  使用默认缓存目录")
    # 检查环境变量
    hf_home = os.getenv("HF_HOME")
    transformers_cache = os.getenv("TRANSFORMERS_CACHE")
    if hf_home:
        print(f"  HF_HOME: {hf_home}")
    if transformers_cache:
        print(f"  TRANSFORMERS_CACHE: {transformers_cache}")


def _check_cuda_torch_windows() -> None:
    """Windows 上常见 CUDA/Torch 兼容性提示。"""
    if platform.system() != "Windows":
        return
    try:
        import torch
        if torch.cuda.is_available():
            return
    except Exception:
        return
    print("\n[yellow]Windows CUDA 提示:[/yellow]")
    print("如果 CUDA 不可用，可能需要手动安装与 CUDA 版本匹配的 PyTorch wheel。")
    print("参考: https://pytorch.org/get-started/locally/")


app = typer.Typer(help="诊断环境")


@app.command()
def doctor(
    verbose: Annotated[bool, typer.Option("--verbose", "-v", help="输出更详细信息")] = False,
) -> None:
    """检查 Python、PyTorch、CUDA、FFmpeg、HuggingFace 缓存等环境。"""

    print("[bold green]Liber Speech 环境诊断[/bold green]")
    _check_python()
    _check_torch()
    _check_transformers()
    _check_chatterbox()
    _check_ffmpeg()
    _check_hf_cache()
    _check_cuda_torch_windows()
    print("\n[green]诊断完成[/green]")
