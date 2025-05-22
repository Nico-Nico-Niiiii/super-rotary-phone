"""Microphone record / speaker playback helpers (cross‑platform)."""
import sounddevice as sd
from scipy.io.wavfile import write, read
from tempfile import NamedTemporaryFile
import numpy as np

SAMPLE_RATE = 16000
CHANNELS = 1


def record(seconds: int = 6):
    """Capture *seconds* of audio from default mic → temporary WAV path."""
    print(f"[Mic] ▶️  recording {seconds}s – speak now…")
    audio = sd.rec(int(seconds * SAMPLE_RATE), samplerate=SAMPLE_RATE,
                   channels=CHANNELS, dtype="int16")
    sd.wait()
    tmp = NamedTemporaryFile(delete=False, suffix=".wav")
    write(tmp.name, SAMPLE_RATE, audio)
    print("[Mic] ⏹️  saved", tmp.name)
    return tmp.name


def play(wav_path: str):
    """Blocking playback of *wav_path* through system default output."""
    sr, data = read(wav_path)
    print("[Speaker] 🔊 playing response…")
    sd.play(data, sr)
    sd.wait()