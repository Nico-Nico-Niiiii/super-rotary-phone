"""Centralised config & helper utilities."""
from pathlib import Path
from dataclasses import dataclass, asdict
import os

ROOT = Path(__file__).parent

@dataclass
class AppConfig:
    # === Directories ===
    data_dir: Path = ROOT / "data" / "docs"
    embed_model: str = "intfloat/e5-base-v2"

    # === Vector store ===
    chroma_path: Path = ROOT / "data" / "vector_db"

    # === LLM ===
    llm_backend: str = "ollama"          # "ollama" or "llama_cpp"
    llm_model: str = "llama3:8b-instruct-q4_K_M"
    temperature: float = 0.2
    ollama_host: str = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")

    # === TTS  (Riva) ===
    riva_host: str = os.getenv("RIVA_HOST", "localhost")
    riva_port: int = int(os.getenv("RIVA_PORT", 50051))
    riva_voice: str = "English-US.Female-1"   # list voices with  `riva-speech list-voices`
    tts_output_wav: Path = ROOT / "data" / "last_response.wav"

    # === Audio2Face ===
    a2f_host: str = os.getenv("A2F_HOST", "127.0.0.1")
    a2f_port: int = int(os.getenv("A2F_PORT", 8011))

    # === ASR (optional – can also point to Riva) ===
    enable_asr: bool = True
    whisper_model: str = "base.en"

    def dump(self):
        print("[Config]", asdict(self))

CONFIG = AppConfig()