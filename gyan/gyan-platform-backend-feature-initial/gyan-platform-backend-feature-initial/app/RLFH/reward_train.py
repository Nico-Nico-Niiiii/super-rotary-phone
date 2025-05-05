import random
import pandas as pd
from operator import itemgetter
import torch
import warnings
warnings.filterwarnings('ignore')
from datasets import Dataset, load_dataset
from transformers import AutoModelForSequenceClassification,AutoTokenizer,TrainingArguments
from trl import RewardTrainer


def train_reward_model():
    df = pd.read_csv("qa_rewards.csv")
    df.head()


    df['tup'] = list(zip(df['answer'], df['reward']))

    # Group answers for each question along with their feedback scores
    df_g = df.groupby('question')['tup'].apply(list).reset_index()

    # Sort each group by feedback score in descending order
    df_g["sorted_tup"] = df_g["tup"].apply(lambda x: sorted(x, key=lambda y: y[1], reverse=True))

    # Extract the answer with the highest score ("chosen") and the lowest score ("rejected")
    df_g["chosen"] = df_g["sorted_tup"].apply(lambda x: x[0][0] if x else None)  # Highest score
    df_g["chosen_score"] = df_g["sorted_tup"].apply(lambda x: x[0][1] if x else None)

    df_g["rejected"] = df_g["sorted_tup"].apply(lambda x: x[-1][0] if x else None)  # Lowest score
    df_g["rejected_score"] = df_g["sorted_tup"].apply(lambda x: x[-1][1] if x else None)

    # Drop rows with NaN values, if any
    df_g = df_g.dropna()

    # Optional: Apply additional filtering if needed
    # For example, retain only rows where chosen score > rejected score:
    #df_g = df_g[df_g['chosen_score'] > df_g['rejected_score']]

    #df_g = df_g[(df_g['chosen_score']>=4.0) & (df_g['rejected_score']<5.0)]

    rows = []
    for record in df_g.itertuples(index=True, name='Pandas'):
        if record is None or len(record) == 0:
            continue
        rows.append({
            "instruction": record.question,
            "chosen_response": record.chosen,
            "rejected_response": record.rejected
        })
    prepared_dataset = Dataset.from_list(rows)
    prepared_dataset.to_pandas()

    #Select a base model whch we need to train for reward modeling.
    model_name = "gpt2"
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=1)
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
        model.config.pad_token_id = model.config.eos_token_id
    
    def formatting_func(examples):
        kwargs = {"padding": "max_length", "truncation": True, "max_length": 512, "return_tensors": "pt"}
        prompt_plus_chosen_response = examples["instruction"] + "\n" + examples["chosen_response"]
        prompt_plus_rejected_response = examples["instruction"] + "\n" + examples["rejected_response"]
        tokens_chosen = tokenizer.encode_plus(prompt_plus_chosen_response, **kwargs)
        tokens_rejected = tokenizer.encode_plus(prompt_plus_rejected_response, **kwargs)
        return {
            "input_ids_chosen": tokens_chosen["input_ids"][0], "attention_mask_chosen": tokens_chosen["attention_mask"][0],
            "input_ids_rejected": tokens_rejected["input_ids"][0], "attention_mask_rejected": tokens_rejected["attention_mask"][0]
        }
    formatted_dataset = prepared_dataset.map(formatting_func)
    formatted_dataset = formatted_dataset.train_test_split()
    
    # Configuring the training arguments
    training_args = TrainingArguments(
    output_dir="./reward1_model",
    per_device_train_batch_size=2,
    evaluation_strategy="steps",
    save_strategy="steps",  # Save model at specified intervals
    save_steps=20,          # Save every 50 steps
    logging_steps=20,       # Log every 10 steps
    gradient_accumulation_steps=4,
    num_train_epochs=10,
    learning_rate=1e-4,  
    #load_best_model_at_end=True,  # Automatically reload the best model
    metric_for_best_model="accuracy",  # Choose the metric to monitor
    greater_is_better=True,       # Specify if higher values are better for the metric
    report_to=None,               # Disable reporting to external loggers
)
    # Loading the RewardTrainer from TRL
    trainer = RewardTrainer(
        model=model,
        args=training_args,
        tokenizer=tokenizer,
        train_dataset=formatted_dataset["train"],
        eval_dataset=formatted_dataset["test"],
    )
    trainer.train()
    model.save_pretrained("./reward1_model")
    tokenizer.save_pretrained("./reward1_model")
    