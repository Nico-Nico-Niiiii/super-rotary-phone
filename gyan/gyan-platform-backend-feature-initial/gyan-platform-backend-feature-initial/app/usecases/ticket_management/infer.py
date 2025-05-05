from peft import PeftModel, PeftConfig
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from pygame import mixer
import json
from collections import Counter
import os
import io
import time
import torch
import pandas as pd
from collections import defaultdict

class Ticket_Management:
    def __init__(self):
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
            self.data = json.load(file)     
        
        self.duplicate_model = self.data["use_case"]["ticket_management"]["model_path"]["duplicate_model"]
        self.label_model = self.data["use_case"]["ticket_management"]["model_path"]["label_model"]
        self.blank_model = self.data["use_case"]["ticket_management"]["model_path"]["blank_model"]
        self.response_model = self.data["use_case"]["ticket_management"]["model_path"]["response_model"]

        self.output_path = self
    
    def load_model(self, model_path):
        # Load peft config for pre-trained checkpoint etc.
        peft_model_id = model_path
                
        config = PeftConfig.from_pretrained(peft_model_id)

        # load base LLM model and tokenizer
        model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path, load_in_8bit=True,  device_map={"":0})
        self.tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)

        # Load the Lora model
        self.model = PeftModel.from_pretrained(model, peft_model_id, device_map={"":0})
        self.model.eval()

        print("Peft model loaded")
        mixer.init()
        
    def unload_model(self):
        self.model = None
        torch.cuda.empty_cache()

    def infer_model(self, prompt):
        input_ids = self.tokenizer(prompt, return_tensors="pt", truncation=True).input_ids.cuda()
        outputs = self.model.generate(input_ids=input_ids, max_new_tokens=500, do_sample=True, top_p=0.9)
        out = self.tokenizer.batch_decode(outputs.detach().cpu().numpy(), skip_special_tokens=True)[0]

        return out


    def infer_label(self, file_data):
        self.load_model(self.label_model)

        # Read Excel file into a DataFrame
        df = pd.read_excel(io.BytesIO(file_data))

        failure_list = []
        # start_time = time.time()

        for i in range(len(df)):
                ip_data = str(df.iloc[i, 0])
                
                text_value = self.infer_model(ip_data)
                failure_list.append({"Input" : ip_data, "Output" : text_value})

        # end_time = time.time()

        # Dictionary to collect inputs cluster-wise
        clustered_data = defaultdict(list)

        # Collect inputs cluster-wise
        for item in failure_list:
            cluster_output = item['Output']
            clustered_data[cluster_output].append(item['Input'])

        # Calculate counts
        cluster_counts = {cluster: len(inputs) for cluster, inputs in clustered_data.items()}
        
        # print("cluster_count",cluster_counts)
        issues = cluster_counts

        # Sort the dictionary by the counts in descending order
        sorted_issues = sorted(issues.items(), key=lambda x: x[1], reverse=True)

        # Get the top 5 issues
        top_issues = sorted_issues[:5]

        self.unload_model()
        
        return top_issues
    
    def infer_duplicates(self, file_data):
        self.load_model(self.duplicate_model)

        # Read Excel file into a DataFrame
        df = pd.read_excel(io.BytesIO(file_data))
        failure_list = []
        # df = pd.read_excel(excel_file)
        # print("dffffff",len(df))

        for i in range(len(df)):
                ip_data = str(df.iloc[i, 0])
                text_value = self.infer_model(ip_data)
                failure_list.append({"Input":ip_data,"Output":text_value})

        # Dictionary to collect inputs cluster-wise
        clustered_data = defaultdict(list)

        # Collect inputs cluster-wise
        for item in failure_list:
            cluster_output = item['Output']
            clustered_data[cluster_output].append(item['Input'])

        # Calculate counts
        cluster_counts = {cluster: len(inputs) for cluster, inputs in clustered_data.items()}

        self.unload_model()

        return cluster_counts
    
    def infer_blanks(self, file_data) : 
        self.load_model(self.blank_model)
        failure_list = []
        
        # Read Excel file into a DataFrame
        df = pd.read_excel(io.BytesIO(file_data))
        # print("Number of rows in DataFrame:", len(df))
        
        total_records= len(df)
        
        # new_path = f"{self.output_path}/output_filled.xlsx"
        
        for index, row in df.iterrows():
            # Check if the 'Category' column is null for the current row
            if pd.isnull(row['Category']):
                # Display the short description for the current row
                print(row['Short Description'])
                ip_data = str(row['Short Description'])
                
                # Perform inference to fill the null value in the 'Category' column
                text_value = self.infer_model(ip_data)
                print("Inferred category:", text_value)
                
                # Update the DataFrame with the inferred category
                df.at[index, 'Category'] = str(text_value)
                
                failure_list.append({"Input": ip_data, "Output": text_value})
        
        category_counts = Counter(item['Output'] for item in failure_list)

        # Print the counts of duplicate categories
        for category, count in category_counts.items():
            if count > 1:
                print(f"{category}: {count}")
            else:
                print(f"{category}: 1")

        category_counts_dict = dict(category_counts)
        total_issues = len(failure_list)

        df_json = df.to_dict(orient="records")

        self.unload_model()

        return failure_list, total_issues, category_counts_dict, total_records, df_json

    def infer_response_file(self, file_data):
        self.load_model(self.response_model)

        # Read Excel file into a DataFrame
        failure_list = []
        df = pd.read_excel(io.BytesIO(file_data))
       
        for i in range(len(df)):
                ip_data = str(df.iloc[i, 0])
                text_value = self.infer_model(ip_data)
                
                failure_list.append({"Input":ip_data, "Output":text_value})

        self.unload_model()
        return failure_list
    
    def infer_response_chat(self, query) :
       self.load_model(self.response_model)
       chat_output = self.infer_model(query)

       self.unload_model()

       return chat_output