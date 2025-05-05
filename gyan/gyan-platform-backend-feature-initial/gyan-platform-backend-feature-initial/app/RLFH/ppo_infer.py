from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, AutoModel
from trl import AutoModelForCausalLMWithValueHead
import torch 

# Paths to fine-tuned model and tokenizer
model_path = "./ppo_trained_model" 

# Load the tokenizer and the fine-tuned model
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForSeq2SeqLM.from_pretrained(model_path)

# Set the model to evaluation mode
model.eval()

    # Function for inference
def generate_response(query, max_length=512, temperature=0.7, top_k=20):
    instruction = f"""### Instruction
    "You are a specialized assistant trained exclusively on air purifier-related content. 
    For any questions about air purifiers, provide clear, detailed, and well-structured responses, covering technical specifications, usage, maintenance, troubleshooting, and related considerations. 
    If a question falls outside the scope of air purifiers, politely decline to answer and redirect the user to air purifier-related topics only. 
    Always ensure your responses stay focused, accurate, and informative within this domain."

    ### Text
    {query}
    ### Response
    """
    inputs = tokenizer(instruction, return_tensors="pt")
    input_ids = inputs["input_ids"]
    attention_mask = inputs["attention_mask"]
    
    with torch.no_grad():
        outputs = model.generate(
            input_ids,
            min_length = 100,
            repetition_penalty = 1.2,
            top_ = 0.7,
            attention_mask=attention_mask,
            max_length=max_length,
            temperature=temperature,
            do_sample=True,
            top_k=top_k,
            pad_token_id=tokenizer.pad_token_id,
            eos_token_id=tokenizer.eos_token_id,
        )
    
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    return response
