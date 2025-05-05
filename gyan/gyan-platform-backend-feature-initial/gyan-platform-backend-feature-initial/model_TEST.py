from transformers import AutoModelForCausalLM, AutoTokenizer

model_name = "meta-llama/Llama-2-7b"
model = AutoModelForCausalLM.from_pretrained(model_name, trust_remote_code=True, use_safetensors=True)
tokenizer = AutoTokenizer.from_pretrained(model_name)
