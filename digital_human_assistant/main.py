"""Entry‑point orchestrator tying ASR → RAG → LLM → Riva TTS → A2F."""
from config import CONFIG
from llm_module import generate
from rag_pipeline import retrieve, build_vector_store
from tts_module import tts
from audio2face_client import send_wav_to_a2f
from utils.audio_utils import record, play

# Optional ASR (Whisper) import
if CONFIG.enable_asr:
    import whispercpp
    WHISPER = whispercpp.Whisper(CONFIG.whisper_model)


def transcribe(wav_path: str) -> str:
    if not CONFIG.enable_asr:
        return ""
    result = WHISPER.transcribe(wav_path)
    return result["text"].strip()


def chat_loop():
    print("=== 🎭  Digital Human Assistant (Riva Edition) ===")
    build_vector_store()
    while True:
        try:
            # 1) Get user utterance (mic or keyboard fallback)
            wav_in = record(seconds=6)
            user_text = transcribe(wav_in) if CONFIG.enable_asr else input("You: ")
            if not user_text:
                continue
            print("You:", user_text)

            # 2) Retrieve context
            context_chunks = retrieve(user_text)
            context = "
".join(context_chunks)

            # 3) LLM answer
            prompt = f"Context:
{context}

User: {user_text}"
            answer = generate(prompt)
            print("Assistant:", answer)

            # 4) TTS → WAV
            wav_out = tts(answer)

            # 5) Local playback + send to Audio2Face
            play(wav_out)
            send_wav_to_a2f(wav_out)

        except KeyboardInterrupt:
            print("👋  Exiting. Bye!")
            break


if __name__ == "__main__":
    chat_loop()