#for testing purpose i have made this file 
from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForCausalLM , AutoConfig
import numpy as np
from transformers import GPT2ForSequenceClassification, AutoModel
import sys
import csv
from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training, TaskType
import torch
from peft import PeftModel, PeftConfig

from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification, AutoModelForSeq2SeqLM, GenerationConfig

# trl: Transformer Reinforcement Learning library
from trl import PPOTrainer, PPOConfig, AutoModelForSeq2SeqLMWithValueHead, AutoModelForCausalLMWithValueHead
from trl import create_reference_model
from trl.core import LengthSampler

import torch
import evaluate

import numpy as np
import pandas as pd

# tqdm library makes the loops show a smart progress meter.
from tqdm import tqdm
import os



def llama_ppo():
    
    model_name = "meta-llama/Meta-Llama-3-8B"
    dataset_name = "/media/shared/rl/sample/train_data.csv"
    # before used google flan t5 large


    def build_dataset(model_name,
                    dataset_name,
                    input_min_text_length, 
                    input_max_text_length):
        
        # load dataset (only "train" part will be enough for this lab).
        dataset = load_dataset('csv', split='train', data_files=dataset_name, cache_dir='./cache')    
        
        # Filter the dialogues of length between input_min_text_length and input_max_text_length characters.
        # dataset = dataset.filter(lambda x: len(x["dialogue"]) > input_min_text_length and len(x["dialogue"]) <= input_max_text_length, batched=False)

        # Prepare tokenizer. Setting device_map="auto" allows to switch between GPU and CPU automatically.
        tokenizer = AutoTokenizer.from_pretrained(model_name, device_map="auto")
        
        def tokenize(sample):
            system_prompt = "You are a specialized assistant for air purifier-related content.Your task is to provide accurate, detailed, and concise answers to queries specifically about air purifiers.Please adhere to this scope when generating your response to any query and don't answer queries which are not relate to air purifier."
            # Wrap each dialogue with the instruction.
            prompt = f"""
                    {system_prompt}
                    answering: {sample["question"]}
                    """
            sample["input_ids"] = tokenizer.encode(prompt, truncation=True, max_length=512)
            
            # This must be called "query", which is a requirement of our PPO library.
            sample["query"] = tokenizer.decode(sample["input_ids"])
            return sample

        # Tokenize each dialogue.
        dataset = dataset.map(tokenize, batched=False)
        dataset.set_format(type="torch")
        
        # Split the dataset into train and test parts.
        dataset_splits = dataset.train_test_split(test_size=0.1, shuffle=True, seed=42)

        return dataset_splits

    # Build Dataset
    dataset = build_dataset(model_name=model_name,
                            dataset_name=dataset_name,
                            input_min_text_length=200, 
                            input_max_text_length=1000)

    print(dataset)

    def print_number_of_trainable_model_parameters(model):
        trainable_model_params = 0
        all_model_params = 0
        for _, param in model.named_parameters():
            all_model_params += param.numel()
            if param.requires_grad:
                trainable_model_params += param.numel()
        return f"\ntrainable model parameters: {trainable_model_params}\nall model parameters: {all_model_params}\npercentage of trainable model parameters: {100 * trainable_model_params / all_model_params:.2f}%"


    model = AutoModelForCausalLM.from_pretrained(model_name, 
                                                load_in_4bit = True,
                                                torch_dtype=torch.bfloat16,
                                                device_map  = "auto")


    # for seq to seq flan t5 model we used seq2seq
    lora_config = LoraConfig(
        r=8, #RANK
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type= "CAUSAL_LM" 
    )


    peft_model = PeftModel.from_pretrained(model, 
                                        "/media/shared/GYAN_TEST/model/llm/EPC_V1/ID_GYAN_LLAMA3",
                                        lora_config=lora_config,
                                        torch_dtype=torch.bfloat16, 
                                        load_in_4bit = True,
                                        device_map="auto",                                       
                                        is_trainable=True)
    # model changed to causal lm tarined on air purifier
    print(f'PEFT model parameters to be updated:\n{print_number_of_trainable_model_parameters(peft_model)}\n')

    # Prepare PPO Model
    ppo_model = AutoModelForCausalLMWithValueHead.from_pretrained(peft_model,                                                               
                                                                torch_dtype=torch.bfloat16,
                                                                is_trainable=True)
    # changed to causallm value head on 24 jan
    print(f'PPO model parameters to be updated (ValueHead + 769 params):\n{print_number_of_trainable_model_parameters(ppo_model)}\n')
    print(ppo_model.v_head)

    # Create Refernce Model
    ref_model = create_reference_model(ppo_model)

    print(f'Reference model parameters to be updated:\n{print_number_of_trainable_model_parameters(ref_model)}\n')

    # Prepare Reward Model
    reward_tokenizer = AutoTokenizer.from_pretrained("/media/shared/Anjali_RLHF/Anjali_RLHF/rl/tinyllama_ppot/reward3_model/checkpoint-10")
    rewardModel = GPT2ForSequenceClassification.from_pretrained("/media/shared/Anjali_RLHF/Anjali_RLHF/rl/tinyllama_ppot/reward3_model/checkpoint-10")

    device = 0 if torch.cuda.is_available() else "cpu"

    sentiment_pipe = pipeline("sentiment-analysis", 
                            model=rewardModel, 
                            tokenizer=reward_tokenizer,
                            device=device)
    reward_logits_kwargs = {
        "top_k": None, # Return all scores.
        "function_to_apply": "none", # Set to "none" to retrieve raw logits.
        "batch_size": 2
    }

    reward_probabilities_kwargs = {
        "top_k": None, # Return all scores.
        "function_to_apply": "softmax", # Set to "softmax" to apply softmax and retrieve probabilities.
        "batch_size": 2
    }

    toxicity_evaluator = evaluate.load("toxicity", 
                                        "facebook/roberta-hate-speech-dynabench-r4-target",
                                        module_type="measurement",
                                        toxic_label="LABEL_1")

    # Intialize PPO Trainer
    def collator(data):
        return dict((key, [d[key] for d in data]) for key in data[0])

    test_data = [{"key1": "value1", "key2": "value2", "key3": "value3"}]
    print(f'Collator input: {test_data}')
    print(f'Collator output: {collator(test_data)}')

    learning_rate=4e-5
    max_ppo_epochs=1
    mini_batch_size=1
    batch_size=2

    tokenizer = AutoTokenizer.from_pretrained(model_name, device_map="auto")
    tokenizer.pad_token = tokenizer.eos_token



    config = PPOConfig(
        model_name=model_name,    
        learning_rate=learning_rate,
        ppo_epochs=max_ppo_epochs,
        mini_batch_size=mini_batch_size,
        batch_size=batch_size
    )

    print("ppo training started")
    ppo_trainer = PPOTrainer(config=config, 
                            model=ppo_model, 
                            ref_model=ref_model, 
                            tokenizer=tokenizer, 
                            dataset=dataset["train"], 
                            data_collator=collator)

    # Perform RL training
    output_min_length = 256
    output_max_length = 512
    output_length_sampler = LengthSampler(output_min_length, output_max_length)
    not_hate_index = 0
    print("training started..")
    
    generation_kwargs = {
        "min_length": 5,
        "max_length": 1024,
        "top_k": 0.0,
        "top_p": 1.0,
        "do_sample": True
        
    }

    reward_kwargs = {
        "top_k": None, # Return all scores.
        "function_to_apply": "none", # You want the raw logits without softmax.
        "batch_size": 2
    }

    max_ppo_steps = 5

    for step, batch in tqdm(enumerate(ppo_trainer.dataloader)):
        # Break when you reach max_steps.
        if step >= max_ppo_steps:
            break   

        prompt_tensors = batch["input_ids"]

        # Get response from FLAN-T5/PEFT LLM.
        summary_tensors = []

        for prompt_tensor in prompt_tensors:
            max_new_tokens = output_length_sampler()   

            #NEW 
            prompt_tensor = prompt_tensor.unsqueeze(0)  # Add batch dimension if needed
            prompt_tensor = prompt_tensor.to(dtype=torch.long)     
                
            generation_kwargs["max_new_tokens"] = max_new_tokens
            generation_kwargs["attention_mask"] = torch.ones_like(prompt_tensor)
            
            #summary = ppo_trainer.generate(prompt_tensor, **generation_kwargs)
            summary = ppo_trainer.model.generate(prompt_tensor, **generation_kwargs)
            
            summary_tensors.append(summary.squeeze()[-max_new_tokens:])
            
        # This needs to be called "response".
        batch["response"] = [tokenizer.decode(r.squeeze()) for r in summary_tensors]

        # Compute reward outputs.
        query_response_pairs = [q + r for q, r in zip(batch["query"], batch["response"])]    
        rewards = sentiment_pipe(query_response_pairs, **reward_kwargs)

        
        reward_tensors = [torch.tensor(reward[not_hate_index]["score"]) for reward in rewards]    

        # Run PPO step.
        stats = ppo_trainer.step(prompt_tensors, summary_tensors, reward_tensors)
        ppo_trainer.log_stats(stats, batch, reward_tensors)
        
        print(f'objective/kl: {stats["objective/kl"]}')
        print(f'ppo/returns/mean: {stats["ppo/returns/mean"]}')
        print(f'ppo/policy/advantages_mean: {stats["ppo/policy/advantages_mean"]}')
        print('-'.join('' for x in range(100)))

    ppo_trainer.model.save_pretrained("./ppo_trained_model")
    tokenizer.save_pretrained("./ppo_trained_model")
    print("model saved")
