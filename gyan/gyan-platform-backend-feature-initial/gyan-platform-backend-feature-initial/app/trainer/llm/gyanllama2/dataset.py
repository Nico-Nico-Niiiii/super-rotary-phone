from datasets import load_dataset
from datasets import concatenate_datasets
import numpy as np


class Dataset:
    def __init__(self, dataset_path):
        self.DATASET_PATH=dataset_path
        print(self.DATASET_PATH)
        
    def load_data(self, tokenizer):
        self.tokenizer = tokenizer
        self.data = {'train': self.DATASET_PATH, 'test': self.DATASET_PATH}
        print("data loaded, ",self.data["train"])
        print("data loaded", self.data["test"])
        self.dataset = load_dataset('csv', data_files=self.data, cache_dir='./cache')

        self.concat_data(self.dataset)
        self.map_data()
  

    def concat_data(self, dataset):
        self.tokenized_inputs = concatenate_datasets([dataset["train"], dataset["test"]]).map(lambda x: self.tokenizer(x["question"], truncation=False), batched=True, remove_columns=["question", "answer"])
        self.input_lenghts = [len(x) for x in self.tokenized_inputs["input_ids"]]
        # take 85 percentile of max length for better utilization
        self.max_source_length = int(np.percentile(self.input_lenghts, 85))
        print(f"Max source length: {self.max_source_length}")
        # The maximum total sequence length for target text after tokenization.
        # Sequences longer than this will be truncated, sequences shorter will be padded."
        self.tokenized_targets = concatenate_datasets([dataset["train"], dataset["test"]]).map(lambda x: self.tokenizer(x["answer"], truncation=False), batched=True, remove_columns=["question", "answer"])
        self.target_lenghts = [len(x) for x in self.tokenized_targets["input_ids"]]
        # take 90 percentile of max length for better utilization
        self.max_target_length = int(np.percentile(self.target_lenghts, 90))
        print(f"Max target length: {self.max_target_length}")
        

        
    def map_data(self):
            self.tokenized_dataset = self.dataset.map(self.preprocess_function, batched=True, remove_columns=["question", "answer", "id"])
            print(f"Keys of tokenized dataset: {list(self.tokenized_dataset['train'].features)}")
            # save datasets to disk for later easy loading
            # self.tokenized_dataset["train"].save_to_disk("data/train")
            # selftokenized_dataset["test"].save_to_disk("data/eval")
            

    def preprocess_function(self, sample, padding="max_length"):
        # add prefix to the input for t5
        inputs = ["answering: " + item for item in sample["question"]]

        # tokenize inputs
        model_inputs = self.tokenizer(inputs, max_length=500, padding=padding, truncation=False)

        # Tokenize targets with the `text_target` keyword argument
        labels = self.tokenizer(text_target=sample["answer"], max_length=500, padding=padding, truncation=False)

        # If we are padding here, replace all tokenizer.pad_token_id in the labels by -100 when we want to ignore
        # padding in the loss.
        if padding == "max_length":
            labels["input_ids"] = [
                [(l if l != self.tokenizer.pad_token_id else -100) for l in label] for label in labels["input_ids"]
            ]

        model_inputs["labels"] = labels["input_ids"]
        return model_inputs


