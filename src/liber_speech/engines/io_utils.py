from __future__ import annotations

import subprocess
from pathlib import Path

import torchaudio


def save_wav(out_path: Path, sr: int, wav) -> None:
    """保存 WAV 文件。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    
    # 处理张量维度：确保是2D格式 [channels, samples]
    if hasattr(wav, 'dim'):
        if wav.dim() == 1:
            # 1D张量：添加通道维度
            wav = wav.unsqueeze(0)
        elif wav.dim() == 3:
            # 3D张量：移除批次维度
            wav = wav.squeeze(0)
        # 如果已经是2D，直接使用
    
    torchaudio.save(str(out_path), wav, sr)


def convert_with_ffmpeg(src: Path, dst: Path, codec: str, extra: list[str] | None = None) -> None:
    """使用 FFmpeg 转码。"""
    cmd = ["ffmpeg", "-y", "-i", str(src)]
    if extra:
        cmd.extend(extra)
    cmd.append(str(dst))
    subprocess.run(cmd, check=True, capture_output=True)


def save_mp4(out_path: Path, sr: int, wav) -> None:
    """保存为 MP4（AAC 音频）。"""
    tmp_wav = out_path.with_suffix(".tmp.wav")
    save_wav(tmp_wav, sr, wav)
    convert_with_ffmpeg(tmp_wav, out_path, "aac", ["-c:a", "aac", "-b:a", "192k"])
    tmp_wav.unlink()


def save_ogg_opus(out_path: Path, sr: int, wav) -> None:
    """保存为 OGG/Opus（按 Telegram Voice Note 最佳实践）。"""
    tmp_wav = out_path.with_suffix(".tmp.wav")
    save_wav(tmp_wav, sr, wav)
    convert_with_ffmpeg(
        tmp_wav,
        out_path,
        "libopus",
        [
            "-c:a",
            "libopus",
            "-b:a",
            "28k",
            "-vbr",
            "on",
            "-compression_level",
            "10",
            "-application",
            "voip",
            "-ar",
            "48000",
            "-ac",
            "1",
            "-af",
            "loudnorm=I=-16:TP=-1.5:LRA=11",
        ],
    )
    tmp_wav.unlink()


def save_asr_json(result, out_path: Path) -> None:
    """保存 ASR 结果为 JSON。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result.model_dump_json(indent=2, ensure_ascii=False), encoding="utf-8")


def save_asr_txt(result, out_path: Path) -> None:
    """保存 ASR 结果为纯文本。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(result.text, encoding="utf-8")


def save_asr_srt(result, out_path: Path) -> None:
    """保存 ASR 结果为 SRT 字幕。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    lines = []
    for i, chunk in enumerate(result.chunks, start=1):
        start = _format_ts(chunk.start)
        end = _format_ts(chunk.end)
        lines.append(f"{i}\n{start} --> {end}\n{chunk.text}\n")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def save_asr_vtt(result, out_path: Path) -> None:
    """保存 ASR 结果为 WebVTT 字幕。"""
    out_path.parent.mkdir(parents=True, exist_ok=True)
    lines = ["WEBVTT\n\n"]
    for chunk in result.chunks:
        start = _format_ts(chunk.start, ms=True)
        end = _format_ts(chunk.end, ms=True)
        lines.append(f"{start} --> {end}\n{chunk.text}\n")
    out_path.write_text("\n".join(lines), encoding="utf-8")


def _format_ts(sec: float, ms: bool = False) -> str:
    """将秒转为 SRT/VTT 时间格式。"""
    whole = int(sec)
    ms_val = int(round((sec - whole) * 1000))
    h = whole // 3600
    m = (whole % 3600) // 60
    s = whole % 60
    if ms:
        return f"{h:02d}:{m:02d}:{s:02d}.{ms_val:03d}"
    return f"{h:02d}:{m:02d}:{s:02d},{ms_val:03d}"
