"""Minimal HTTP client for Omniverse Audio2Face Live Link."""
import requests
from pathlib import Path
from config import CONFIG

BASE = f"http://{CONFIG.a2f_host}:{CONFIG.a2f_port}/api"


def send_wav_to_a2f(wav_path: Path):
    """POST the WAV to Audio2Face and trigger playback."""
    try:
        with open(wav_path, "rb") as f:
            r = requests.post(f"{BASE}/audiofile", files={"file": f}, timeout=15)
            r.raise_for_status()
        print("[A2F] ✔ audio sent → avatar")
    except Exception as e:
        print("[A2F] ✖ failed:", e)