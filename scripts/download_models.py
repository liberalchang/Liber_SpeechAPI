from __future__ import annotations

import os
from pathlib import Path

from dotenv import load_dotenv


def _resolve_hf_cache_dir() -> str | None:
    val = os.getenv("LIBER_HF_CACHE_DIR")
    if not val:
        return None
    return str(Path(val).expanduser().resolve())


def _apply_hf_cache_env(hf_cache_dir: str | None) -> None:
    if not hf_cache_dir:
        return
    os.environ.setdefault("HF_HOME", hf_cache_dir)
    os.environ.setdefault("TRANSFORMERS_CACHE", hf_cache_dir)


def download_whisper_large_v3() -> None:
    from transformers import pipeline

    pipeline(
        task="automatic-speech-recognition",
        model="openai/whisper-large-v3",
        device=-1,
    )


def download_chatterbox_multilingual() -> None:
    from liber_speech.engines.tts_engine import TTSEngine, TTSOptions

    engine = TTSEngine(device="cpu", options=TTSOptions(model="multilingual"))
    engine.load()


def main() -> None:
    load_dotenv(override=False)

    hf_cache_dir = _resolve_hf_cache_dir()
    _apply_hf_cache_env(hf_cache_dir)

    if hf_cache_dir:
        print(f"Using cache dir: {hf_cache_dir}")
    else:
        print("Using default HuggingFace cache dir")

    print("Downloading: openai/whisper-large-v3")
    download_whisper_large_v3()
    print("OK: openai/whisper-large-v3")

    print("Downloading: Chatterbox multilingual")
    download_chatterbox_multilingual()
    print("OK: Chatterbox multilingual")


if __name__ == "__main__":
    main()
