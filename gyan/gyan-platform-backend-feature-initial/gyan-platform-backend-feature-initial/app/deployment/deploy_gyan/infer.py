import os
import torch
import shutil
import tempfile
import json
from peft import PeftConfig, PeftModel
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer, AutoModelForCausalLM
from app.cfg.config_loader import Config

cfg = Config()


paths = cfg.load("./cfg/paths.json")

#model_path
path = paths["deployment"]["deploy_gyan"]["model_path"] 



def extract_inference_service_name(pod_name):
    if '-predictor' in pod_name:
        return pod_name.split('-predictor')[0]
    return None

def merge_and_save_lora_weights(model_type,model_name, project_name, email,job_name):
    try:
        print("Entered")
        print("Path",path)
        peft_model_id = f"{path}/{email}/{model_type}/{project_name}/{model_name}/{job_name}"
        print(peft_model_id)
    
        config = PeftConfig.from_pretrained(peft_model_id)
    
        if model_name == "Gyan/OPT-350M1":
            model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path, device_map={"": 0})
        else:
            print("Else block")
            model = AutoModelForCausalLM.from_pretrained(config.base_model_name_or_path, device_map={"": 0}, torch_dtype="auto")
            tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)
    
        peft_model = PeftModel.from_pretrained(model, peft_model_id)
    
        merged_peft_model = peft_model.merge_and_unload()
        base_temp_dir = 'assests/temp/deployment'
        project_dir = os.path.join(base_temp_dir, model_name, project_name)
        os.makedirs(project_dir, exist_ok=True)
        save_path = project_dir
    
        merged_peft_model.save_pretrained(save_path)
        tokenizer.save_pretrained(save_path)
    
        merged_peft_model = merged_peft_model.cpu()
    
        del model
        del peft_model
        torch.cuda.empty_cache()
    
        print("GPU memory released")
    
        return base_temp_dir, save_path
    
    except RuntimeError as e:
        if 'CUDA out of memory' in str(e):
            print("CUDA out of memory error")
            return None, {"error": "GPU is out of memory. Please try again later."}
        else:
            return None, {"error": str(e)}

    except Exception as e:
        print("Error")
        return None, {"error": f"An unexpected error occurred: {str(e)}"}
   
 
def get_directory_free_space(directory='.'):
    try:
        # Get disk usage statistics about the given path
        total, used, free = shutil.disk_usage(directory)
        
        # Convert bytes to gigabytes
        total_gb = total / (1024 ** 3)
        used_gb = used / (1024 ** 3)
        free_gb = free / (1024 ** 3)
        
        return {
            'total_space_gb': total_gb,
            'used_space_gb': used_gb,
            'free_space_gb': free_gb
        }

    except Exception as e:
        print(f"Error: {e}")
        return None
