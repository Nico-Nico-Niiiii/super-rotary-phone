from sqlalchemy.orm import Session
from typing import List, Dict, Any, Optional
import os
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import json
import asyncio
from concurrent.futures import ThreadPoolExecutor
from app.playground.guard import LlamaGuard
from fastapi import Depends
from app.database.connection import get_db
from app.playground.guard import LlamaGuard
from typing import List, Dict, Any
import json
from app.core.security import get_current_user

class PlaygroundManager:
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
        "top_p": 0.8,
        "repetition_penalty": 1.3
        }
        
        # Load configuration
        with open('cfg/paths.json', 'r') as f:
            self.paths = json.load(f)
 

   

    def get_model_path(self, email: str, model_type: str, project_name: str, model_name: str, job_name: str) -> str:
        """Generate full model path"""
        return os.path.join(
            self.paths["model_base_path"],
            email,
            model_type,
            project_name,
            model_name,
            job_name
        )
    
    async def unload_model(
        self,
        email: str,
        model_type: str,
        project_name: str,
        model_name: str,
        job_name: str
    ) -> bool:
        """Unload a model and free up GPU memory"""
        model_key = f"{email}_{model_type}_{project_name}_{model_name}_{job_name}"
        
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
        email: str,
        model_type: str,
        project_name: str,
        model_name: str,
        job_name: str,
        parameters: Optional[Dict] = None 
    ) -> bool:
        """Load a model asynchronously"""
        model_key = f"{email}_{model_type}_{project_name}_{model_name}_{job_name}"
        model_path = self.get_model_path(email, model_type, project_name, model_name, job_name)
        
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
            if 'top_p' in parameters:
                generation_kwargs['top_p'] = parameters['top_p']
        else:
            generation_kwargs = self.default_generation_kwargs
        
        try:
            # Run model loading in a separate thread
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

    def _load_model_sync(self, model_key: str, model_path: str,generation_kwargs: Dict):
        """Synchronous model loading function"""
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

    def get_model_status(self, model_key: str) -> str:
        """Get current model status"""
        return self.model_status.get(model_key, "not_loaded")

    async def infer(
        self,
        email: str,
        model_type: str,
        project_name: str,
        model_name: str,
        message: str,
        job_name: str,
        db: Session = Depends(get_db),
        current_user: dict = Depends(get_current_user)
    ) -> str:
        
        # if not self.guard.is_allowed(message, db, current_user):
        #     return "Error: You are not allowed to send this kind of message."
        
        """Generate inference from loaded model"""
        model_key = f"{email}_{model_type}_{project_name}_{model_name}_{job_name}"
        
        if model_key not in self.loaded_models:
            await self.load_model(email, model_type, project_name, model_name,job_name)
        
        if self.model_status[model_key] != "ready":
            raise Exception("Model not ready for inference")
            
        model_info = self.loaded_models[model_key]
        
        instruction = f"""### Instruction
            Answer the following question.
            
            ### Text
            {message}
            ### Response
            """
            
        try:
            output = model_info["pipeline"](
                instruction,
                return_full_text=False,
                **model_info["generation_kwargs"]
            )
            return output[0]['generated_text']
        except Exception as e:
            print(f"Inference error: {str(e)}")
            raise