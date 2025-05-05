import torch
import pandas as pd
from peft import PeftModel, PeftConfig
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import time


peft_model_id = "/media/shared/rl/sample/molekule_model_air"
config = PeftConfig.from_pretrained(peft_model_id)

model = AutoModelForSeq2SeqLM.from_pretrained(peft_model_id, load_in_4bit=True, device_map={"": 0})
tokenizer = AutoTokenizer.from_pretrained(peft_model_id)

model = PeftModel.from_pretrained(model, peft_model_id, device_map={"": 0})
model.eval()

def process_question(question):
    try:
        # Tokenize the input question
        input_ids = tokenizer(question, return_tensors="pt", truncation=True).input_ids.cuda()
        
        answers = []
        start_time = time.time()

        
        for _ in range(5):
            outputs = model.generate(
                input_ids=input_ids,
                max_new_tokens=512,  # Limit the length of generated answers
                do_sample=True,     # Enable sampling for diverse outputs
                top_p=0.9,          # Nucleus sampling (top-p sampling)
                top_k=20,           # Top-k sampling
                temperature=0.5     # Temperature for randomness
            )
            # Decode the output
            response = tokenizer.batch_decode(outputs.detach().cpu().numpy(), skip_special_tokens=True)[0]
            answers.append(response)

        end_time = time.time()
        processing_time = end_time - start_time

        return answers, processing_time  # Return all generated answers and the time taken

    except Exception as e:
        print(f"Error during processing: {e}")
        return None, 0