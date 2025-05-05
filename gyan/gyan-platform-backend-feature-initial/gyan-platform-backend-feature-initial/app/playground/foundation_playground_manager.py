

from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import os
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from ..database.crud import DBOperations
from ..database.connection import get_db
from app.playground.guard import LlamaGuard
from fastapi import Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json
from ..core.security import get_current_user



class FoundationModelPlaygroundManager:
    def __init__(self):
        self.loaded_models = {}
        self.model_status = {}
        self.executor = ThreadPoolExecutor(max_workers=1)
        # self.guard = LlamaGuard() 
        self.default_generation_kwargs = {
            "max_new_tokens": 128,
            "do_sample": True,
            "temperature": 0.1,
            "top_k": 40,
            "repetition_penalty": 1.3
        }
        self.db = next(get_db())


    async def unload_model(
        self,
        model_name: str,
        model_id: str,
    ) -> bool:
        """Unload a model and free up GPU memory"""
        model_key = f"foundation_model_{model_name}"
        
        # Check if the model is loaded
        if model_key not in self.loaded_models:
            return False
        
        try:
            # Get pipeline to access model and tokenizer
            pipe = self.loaded_models[model_key]["pipeline"]
            
            # Get the model from the pipeline
            model = pipe.model
            
            # Properly clean up PyTorch resources
            model.cpu()  # Move model to CPU
            del pipe
            del self.loaded_models[model_key]
            
            # Update model status
            self.model_status[model_key] = "unloaded"
            
            # Force CUDA garbage collection
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
                
            return True
        except Exception as e:
            print(f"Error unloading model {model_key}: {str(e)}")
            self.model_status[model_key] = "unload_failed"
            return False

    async def load_model(
        self,
        model_name: str,
        model_id: str,
        parameters: Optional[Dict] = None 
    ) -> bool:
        model_key = f"foundation_model_{model_name}"
        
        if model_key in self.loaded_models:
            return True
            
        self.model_status[model_key] = "loading"

        if parameters:
            generation_kwargs = {
                "max_new_tokens": 128,
                "do_sample": True,
                "temperature": parameters.get('temperature', 0.1),
                "repetition_penalty": 1.3
            }
            
            if 'top_k' in parameters:
                generation_kwargs['top_k'] = parameters['top_k']
            elif 'top_p' in parameters:
                generation_kwargs['top_p'] = parameters['top_p']
        else:
            generation_kwargs = self.default_generation_kwargs

        try:
            # Get model path from model_id using 
            # model_info = DBOperations.get_foundation_model(self.db,model_name)
            model_path = model_id
            
            # torch.cuda.empty_cache()
            
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(
                self.executor,
                self._load_model_sync,
                model_key,
                model_path,
                generation_kwargs
            )
            
            self.model_status[model_key] = "ready"
            return True
        except Exception as e:
            self.model_status[model_key] = "failed"
            print(f"Error loading model: {str(e)}")
            return False

    def _load_model_sync(self, model_key: str, model_path: str, generation_kwargs: Dict):
        tokenizer = AutoTokenizer.from_pretrained(
            model_path,
            trust_remote_code=True
        )
        
        model = AutoModelForCausalLM.from_pretrained(
            model_path,
            torch_dtype="auto",
            device_map={"": 0},
            trust_remote_code=True
        )
        
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer
        )
        
        self.loaded_models[model_key] = {
            "pipeline": pipe,
            "generation_kwargs": generation_kwargs
        }



  


    async def infer(
        self,
        model_name: str,
        model_id: str,
        message: str,
        db: Session,
        current_user: dict
    ) -> str:
        """
        Perform inference on a foundation model with guard check.
        
        Args:
            model_name (str): Name of the model
            model_id (str): ID of the model
            message (str): Input message for inference
            db (Session): Database session
            current_user (dict): Current user information
        
        Returns:
            str: Model generated response
        """
        # if not self.guard.is_allowed(message, db, current_user):
        #     return "Restricted: Query which has asked from your end is against our policies."
        
        model_key = f"foundation_model_{model_name}"
        
        if model_key not in self.loaded_models:
            await self.load_model(model_name, model_id)
        
        if self.model_status[model_key] != "ready":
            raise Exception("Model not ready")
            
        model_info = self.loaded_models[model_key]
        print("model_info infer", model_info)
        
        try:
            output = model_info["pipeline"](
                message,
                return_full_text=False,
                **model_info["generation_kwargs"]
            )
            print("Output infer", output)
            return output[0]['generated_text']
        except Exception as e:
            print(f"Inference error: {str(e)}")
            raise
















          # async def infer(
    #     self,
    #     model_name: str,
    #     model_id: str,
    #     message: str,
    #     db: Session,
    #     current_user: dict
    # ) -> str:
    #     if not self.guard.is_allowed(message, db, current_user):
    #         return "Restricted: Query which has asked from your end is against our policies."
    #     model_key = f"foundation_model_{model_name}"
        
    #     if model_key not in self.loaded_models:
    #         await self.load_model(model_name,model_id)
        
    #     if self.model_status[model_key] != "ready":
    #         raise Exception("Model not ready")
            
    #     model_info = self.loaded_models[model_key]
        
    #     try:
    #         output = model_info["pipeline"](
    #             message,
    #             return_full_text=False,
    #             **model_info["generation_kwargs"]
    #         )
    #         return output[0]['generated_text']
    #     except Exception as e:
    #         print(f"Inference error: {str(e)}")
    #         raise