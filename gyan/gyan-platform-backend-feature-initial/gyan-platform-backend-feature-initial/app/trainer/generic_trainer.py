import transformers
import torch
import pandas as pd
from transformers import AutoTokenizer, AutoModelForCausalLM, TrainingArguments
from datasets import Dataset
from trl import SFTTrainer
from sklearn.model_selection import train_test_split
from peft import LoraConfig, prepare_model_for_kbit_training, get_peft_model
from transformers import BitsAndBytesConfig
import os
import multiprocessing
from multiprocessing import Process
from app.logger.gyan_log import GyanLogger

class GenericLLMTrainer:
    def __init__(self, 
                 dataset_path, 
                 model_save_dir, 
                 log_path, 
                 model_type, 
                 model_id,  # Replace model_name with model_id for direct HF model references
                 project_name,
                 epochs, 
                 learning_rate, 
                 batch_size, 
                 token_length, 
                 select_quantization, 
                 lora_enabled,
                 task_id=None, 
                 job_name=None):
        
        self.task_id = task_id
        self.log_path = log_path
        self.model_type = model_type
        self.model_id = model_id
        self.project_name = project_name
        self.job_name = job_name
        self.epochs = epochs
        
        # Start training in a separate process
        self.p = Process(target=self._train_wrapper, 
                        args=(dataset_path, model_save_dir, log_path, model_type, 
                              model_id, project_name, epochs, learning_rate,
                              batch_size, token_length, select_quantization, 
                              lora_enabled, task_id, job_name))
        self.p.start()

    def _train_wrapper(self, *args):
        try:
            self.train(*args)
            self.training_success = True
            self.error_check = False
            self.training_completed = True
        except Exception as e:
            self.training_success = False
            self.error_check = True
            self.error_message = str(e)
            self.training_completed = True
            print(f"Training failed: {str(e)}")

    def generate_prompt_templates(self, sample):
        # This can be customized based on model requirements
        full_prompt = f"""
### Instruction
please provide inst that would result in provided text

### id
{str(sample["question"])}

### Response
{str(sample["answer"])}
"""
        return {"id": full_prompt}
    
    def get_quantization_config(self, select_quantization):
        if select_quantization in ["int4", "bf16"]:
            return BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
        elif select_quantization in ["int8", "fp16"]:
            return BitsAndBytesConfig(
                load_in_8bit=True,
                bnb_4bit_compute_dtype=torch.bfloat16,
                bnb_4bit_quant_type="nf4",
                bnb_4bit_use_double_quant=True,
            )
        return None

    def train(self, dataset_path, model_save_dir, log_path, model_type, 
              model_id, project_name, epochs, learning_rate, batch_size, 
              token_length, select_quantization, lora_enabled, task_id, job_name):
        try:
            # Initialize logger
            logger = GyanLogger(
                log_path=log_path,
                model_type=model_type,
                model_name=model_id,
                project_name=project_name,
                epochs=epochs,
                task_id=task_id,
                job_name=job_name
            )

            # Load and prepare dataset
            df = pd.read_csv(dataset_path)
            train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
            train_dataset = train_df.apply(self.generate_prompt_templates, axis=1)
            test_dataset = test_df.apply(self.generate_prompt_templates, axis=1)

            # Load model with quantization
            quantization_config = self.get_quantization_config(select_quantization)
            model_kwargs = {
                "device_map": {"": 0},
                "trust_remote_code": True
            }
            if quantization_config:
                model_kwargs["quantization_config"] = quantization_config

            base_model = AutoModelForCausalLM.from_pretrained(
                model_id,
                **model_kwargs
            )

            # Initialize tokenizer
            tokenizer = AutoTokenizer.from_pretrained(
                model_id,
                add_eos_token=True,
                use_fast=True
            )
            tokenizer.pad_token = tokenizer.eos_token
            tokenizer.padding_side = "right"

            # Prepare model for training
            base_model.gradient_checkpointing_enable()
            model = prepare_model_for_kbit_training(base_model)

            # Configure LoRA if enabled
            peft_config = None
            if lora_enabled:
                peft_config = LoraConfig(
                    r=32,
                    lora_alpha=16,
                    lora_dropout=0.1,
                    bias="none",
                    task_type="CAUSAL_LM"
                )
                model = get_peft_model(model, peft_config)

            # Setup training arguments
            training_arguments = TrainingArguments(
                output_dir=model_save_dir,
                num_train_epochs=epochs,
                per_device_train_batch_size=batch_size,
                warmup_steps=0,
                logging_steps=1,
                save_strategy="steps",
                evaluation_strategy="steps",
                do_eval=True,
                eval_steps=50,
                save_steps=2,
                learning_rate=learning_rate,
                bf16=False,
                optim="paged_adamw_8bit",
                lr_scheduler_type='constant',
            )

            # Initialize trainer
            trainer = SFTTrainer(
                model=model,
                peft_config=peft_config,
                max_seq_length=token_length,
                tokenizer=tokenizer,
                packing=True,
                dataset_text_field="id",
                args=training_arguments,
                train_dataset=train_dataset,
                eval_dataset=test_dataset,
                callbacks=[logger],
            )

            # Start training
            trainer.train()

            # Save model and tokenizer
            os.makedirs(model_save_dir, exist_ok=True)
            tokenizer.save_pretrained(model_save_dir)
            model.save_pretrained(model_save_dir)
            print(f"Model saved at {model_save_dir}")

        except Exception as e:
            print(f"Training failed: {str(e)}")
            self.error_message = str(e)
            raise e
        finally:
            if 'logger' in locals():
                logger.close()

        print("Training completed successfully")