

from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
import torch
import os
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from typing import Dict, Optional
from sqlalchemy.orm import Session
from ..database.crud import DBOperations
from ..core.security import get_current_user
from transformers.utils.quantization_config import BitsAndBytesConfig

class LlamaGuard:
    """Llama Guard to prevent inappropriate queries."""
    
    def __init__(self, model_id="meta-llama/Llama-Guard-3-1B"):
        """Initialize the guard model."""
        self.model_id = model_id
        self.tokenizer = AutoTokenizer.from_pretrained(model_id)
     
    
        self.model = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float32,  # Use standard float32 for CPU
        device_map="cpu",
        load_in_8bit=True 
        )
      
    
    def is_allowed(self, message: str, db: Session, current_user: dict) -> bool:
        """
        Checks if a given message is valid or restricted.
        
        Args:
            message (str): The input message to check
            db (Session): Database session
            current_user (dict): Current user information
        
        Returns:
            bool: True if the message is allowed, False otherwise
        """
        conversation = [
            {
                "role": "user",
                "content": [{"type": "text", "text": message}],
            }
        ]
        
        input_ids = self.tokenizer.apply_chat_template(
            conversation, return_tensors="pt"
        ).to(self.model.device)

        prompt_len = input_ids.shape[1]
        output = self.model.generate(
            input_ids, 
            max_new_tokens=20, 
            pad_token_id=0
        )
        
        generated_tokens = output[:, prompt_len:]
        response = self.tokenizer.decode(generated_tokens[0])
        
        # Check if the message is unsafe
        is_safe = "unsafe" not in response.lower()
        
        # If not safe, log the restricted prompt
        if not is_safe:
            DBOperations.log_restricted_prompt(
                db=db,
                user_email=current_user["email"],
                prompt=message
            )
        
        return is_safe  