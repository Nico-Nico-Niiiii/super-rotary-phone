from transformers import AutoModelForSeq2SeqLM, AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
from peft import PeftConfig, PeftModel, prepare_model_for_int8_training
import torch
import sys

def merge_models(model_type, model_name, project_name):
    path = 'asset/deployment_on_edge/'
    peft_model_id = f"model/{project_name}/{model_type}/{model_name}/"

    print(peft_model_id)

    config = PeftConfig.from_pretrained(peft_model_id)

    #quantization_config = BitsAndBytesConfig(load_in_8bit=True)
    if(model_name == "ID_GYAN_T5"):
        model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path, device_map={"":0}, torch_dtype=torch.float16)
    else:
        model = AutoModelForCausalLM.from_pretrained(config.base_model_name_or_path,  device_map={"":0}, torch_dtype="auto")
    tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)

    # Load the Lora model
    #model = prepare_model_for_int8_training(model)
    peft_model = PeftModel.from_pretrained(model, peft_model_id)

    merged_peft_model = peft_model.merge_and_unload()

    merged_peft_model.save_pretrained(f"{path}/merged_peft_model/{project_name}/{model_type}/{model_name}")
    tokenizer.save_pretrained(f"{path}/merged_peft_model/{project_name}/{model_type}/{model_name}")

merge_models(sys.argv[1], sys.argv[2], sys.argv[3])