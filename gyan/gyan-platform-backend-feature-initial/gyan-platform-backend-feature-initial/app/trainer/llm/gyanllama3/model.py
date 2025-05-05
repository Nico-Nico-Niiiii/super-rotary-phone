import transformers
print(transformers.__version__)

import torch
import pandas as pd
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments

from datasets import load_dataset ,Dataset

from trl import SFTTrainer

from sklearn.model_selection import train_test_split
from peft import LoraConfig,prepare_model_for_kbit_training,get_peft_model
from transformers import pipeline
from transformers import BitsAndBytesConfig
from peft import prepare_model_for_kbit_training, get_peft_model
import os

import multiprocessing
from multiprocessing import Process
multiprocessing.set_start_method('forkserver', force=True)
from app.logger.gyan_log import GyanLogger



class GyanLlama3_1Trainer:
    def __init__(self,  dataset_path, model_save_dir, log_path, model_type, model_name, project_name, privacy,epochs, learning_rate, batch_size, token_length, select_quantization, lora_enabled):
        p = Process(target=self.train, args=(dataset_path, model_save_dir, log_path, model_type, model_name, project_name, privacy,epochs, learning_rate, batch_size, token_length, select_quantization, lora_enabled,))
        p.start()

    def generate_prompt_templates(self, sample):
        full_prompt = ""
        full_prompt += "\n### Instruction\n"
        full_prompt += "\nplease provide inst that would result in provided text\n"
        full_prompt += "\n\n### id\n"
        full_prompt += str(sample["question"])
        full_prompt += "\n\n### Response\n"
        full_prompt += str(sample["answer"])
        full_prompt += ""
        return {"id" : full_prompt}
    
    def train(self, dataset_path, model_save_dir, log_path, model_type, model_name, project_name,privacy, epochs, learning_rate, batch_size, token_length, select_quantization, lora_enabled):
        tiny_df = pd.read_csv(dataset_path)
        print(tiny_df)

        train_df,test_df = train_test_split(tiny_df,test_size=0.2,random_state=42)

        train_dataset = train_df.apply(self.generate_prompt_templates, axis=1)
        test_dataset = test_df.apply(self.generate_prompt_templates, axis=1)


        model_id = "meta-llama/Meta-Llama-3.1-8B-Instruct"
        if select_quantization == "int4" or select_quantization == "bf16":
            quantization_config = BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
            
        elif select_quantization == "int8" or select_quantization == "fp16":
            quantization_config = BitsAndBytesConfig(
                load_in_8bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )

        base = AutoModelForCausalLM.from_pretrained(
            model_id,
            quantization_config=quantization_config,
            device_map={"":0},
            trust_remote_code=True,
        )

        tiny_tokenizer = AutoTokenizer.from_pretrained(model_id,add_eos_token=True, use_fast=True)
        tiny_tokenizer.pad_token = tiny_tokenizer.eos_token
        tiny_tokenizer.padding_side = "right" 

        

        base.gradient_checkpointing_enable()
        model = prepare_model_for_kbit_training(base)
        if lora_enabled:
            peft_config = LoraConfig(
            r=32, lora_alpha=16, lora_dropout=0.1, bias="none", task_type="CAUSAL_LM")

            model = get_peft_model(model,peft_config)

        training_arguments = TrainingArguments(
            # output_dir="llama3-1-8b-instruct",
            num_train_epochs=epochs,
            # max_steps=100,
            per_device_train_batch_size=batch_size,
            warmup_steps=0,
            logging_steps=10,
            save_strategy="epoch",
            evaluation_strategy="steps",
            do_eval=True,
            eval_steps=50,
            save_steps=50,
            learning_rate=learning_rate, # 2e-4
            bf16=False,
            optim="paged_adamw_8bit",
            
            lr_scheduler_type='constant',
        )
        logger = GyanLogger(log_path, model_type, model_name, project_name, privacy,epochs)
        max_seq_length = token_length
        trainer = SFTTrainer(
            model=model,
            peft_config=peft_config,
            max_seq_length=max_seq_length,
            tokenizer=tiny_tokenizer,
            packing=True,
            dataset_text_field="id",
            args= training_arguments,
            train_dataset=train_dataset,
            eval_dataset=test_dataset,
            # data_collator=transformers.DataCollatorForLanguageModeling(tiny_tokenizer, mlm=False),
            callbacks=[logger],
            
        )

        trainer.train()

        print("Model Trained Successfully.")
        # merged_model = model.merge_and_unload()
        if os.path.isdir(model_save_dir):
            print("Model Folder Already Available.")
        else:
            os.makedirs(model_save_dir)
        tiny_tokenizer.save_pretrained(model_save_dir)
        model.save_pretrained(model_save_dir)
        print("Model saved at ", model_save_dir)
