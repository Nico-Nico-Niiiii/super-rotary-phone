"""Local LLM abstraction (Ollama or llama.cpp)"""
from __future__ import annotations
from config import CONFIG

if CONFIG.llm_backend == "ollama":
    from ollama import Client as _OllamaClient
    _client = _OllamaClient(base_url=CONFIG.ollama_host)
else:
    from llama_cpp import Llama
    _llama = Llama(model_path=CONFIG.llm_model, n_gpu_layers=-1, verbose=False)


def generate(prompt: str, system_prompt: str = "You are a helpful assistant.") -> str:
    if CONFIG.llm_backend == "ollama":
        resp = _client.chat(model=CONFIG.llm_model,
                            messages=[{"role":"system","content":system_prompt},
                                     {"role":"user","content":prompt}],
                            options={"temperature": CONFIG.temperature})
        return resp.get("message", {}).get("content", "")
    full_prompt = f"<|system|>{system_prompt}\n<|user|>{prompt}\n<|assistant|>"
    out = _llama(full_prompt, temperature=CONFIG.temperature, max_tokens=1024)
    return out["choices"][0]["text"].strip()