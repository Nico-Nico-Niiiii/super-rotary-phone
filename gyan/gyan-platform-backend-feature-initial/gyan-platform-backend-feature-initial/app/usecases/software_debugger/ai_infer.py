from scapy.all import *
import torch
from transformers import AutoTokenizer

from datetime import datetime
import re
import os
import time

# import tensorrt_llm
# from tensorrt_llm.runtime import ModelRunnerCpp

from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftConfig, PeftModel

import csv
import json

class Infer:
    def __init__(self):
        self.max_output_len = 10

        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)

        self.peft_model = self.data["use_case"]["software_debugger"]["model_path"]["wifi_peft"]

    def infer(self, texts):

        config = PeftConfig.from_pretrained(self.peft_model)

        # load base LLM model and tokenizer
        base_model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path).to("cuda")
        tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)

        # Load the Lora model
        model = PeftModel.from_pretrained(base_model, self.peft_model).to("cuda")

        out = []

        # Tokenize all inputs in a single batch
        for text in texts: 
            # print(text)
            # start_time = time.time()
            ## pass line by line log to the tokenizer as passed below to the text variable. 
            input_ids = tokenizer(text, return_tensors="pt", padding=True, truncation=True).input_ids.cuda()
            outputs = model.generate(input_ids=input_ids, max_new_tokens=500, do_sample=True, top_p=0.9, temperature=0.8, top_k=50)
            
            ## Out is the predicted output.
            output = tokenizer.batch_decode(outputs, skip_special_tokens=True)[0]
            # end_time = time.time()
            out.append(output)

            # print("Time for single infer = ", end_time - start_time)
            torch.cuda.synchronize()
        
        return out
    
    def text_cleanup(self, text):
        text = text.lstrip(" #")
        text = text.rstrip(" \n\t\r")
        return text
    
    def ai_infer(self, file):
        station_list = set()
        list_ts = []
        text_list = []  # Initialize outside the loop
        ts_list = []    # Initialize outside the loop
        results = []

        # Try reading the file
        with open(file, 'r') as fp:
            data = fp.readlines()

        for text in data:
            # Clean up the text
            text = self.text_cleanup(text)
            # Ensure the text has a timestamp-like format before splitting
            if ']' in text and '[' in text:
                
                    # Extract the timestamp part (between '[' and ']')
                    timestamp_str = text[text.find('[') + 1:text.find(']')]

                    if len(timestamp_str) == 23 and timestamp_str[10] == ' ':
                        # Convert the extracted timestamp to a datetime object
                        dt_obj = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S.%f')

                        # Convert the datetime object to Unix time (in seconds since epoch)
                        ts = dt_obj.timestamp()
                        ts = int(ts)
            else:
                ts = text.split('.')[0]
                 
            # Check if "CONSOLE" is in the text, remove unwanted parts
            if "CONSOLE" in text:
                #Use regex to remove everything up to and including the CONSOLE log and time information
                 text = re.sub(r'^\[.*?CONSOLE\[\w+\]:\s+\d{6,}\.\d{3}\s+', '', text, flags=re.MULTILINE)

            # Ensure the timestamp (`ts`) is an integer and handle any conversion errors
            try:
                ts = int(ts) 
            except Exception as e:
                continue  # Skip lines where `ts` can't be properly converted

            # Skip lines that are too short or do not contain enough content
            if len(text) < 10:
                continue

            # Add the cleaned-up text and its corresponding timestamp to the respective lists
            text_list.append(text)
            ts_list.append(ts)

        
            
        # Call inference with the cleaned-up text list
        output = self.infer(text_list)

        # Return the list of texts, output from inference, and the corresponding timestamps
        return text_list, output, ts_list