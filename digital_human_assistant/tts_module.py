"""NVIDIA Riva TTS wrapper."""
from pathlib import Path
from config import CONFIG
import riva.client
from riva.client.audio import AudioConverter
from riva.client.tts import RivaSpeechSynthesisClient

# Set up gRPC channel → Riva server
RIVA_URL = f"{CONFIG.riva_host}:{CONFIG.riva_port}"
_riva_tts = RivaSpeechSynthesisClient(auth=None, url=RIVA_URL)
_converter = AudioConverter(sample_rate_hz=22050)


def tts(text: str) -> Path:
    """Synthesize *text* to WAV via Riva and return the file path."""
    print(f"[TTS:Riva] → {text}")
    resp = _riva_tts.synthesize(text=text,
                                voice_name=CONFIG.riva_voice,
                                sample_rate_hz=22050)
    # resp.audio is raw 16‑bit PCM.  Convert → WAV and save.
    wav_bytes = _converter.convert(resp.audio, resp.sample_rate_hz, target_type='wav')
    out_path = CONFIG.tts_output_wav
    with open(out_path, "wb") as f:
        f.write(wav_bytes)
    return out_path