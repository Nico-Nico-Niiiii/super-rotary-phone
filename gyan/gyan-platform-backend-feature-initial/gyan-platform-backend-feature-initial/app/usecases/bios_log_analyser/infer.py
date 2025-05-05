import pandas as pd
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from peft import PeftModel, PeftConfig
import time
import json
import torch
from pygame import mixer
import os


class BiosDataProcessor:
    def __init__(self, input_file):
        self.input_file = input_file
        
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)

        self.logs_path = self.data["use_case"]["bios"]["logs_path"]
        self.model_path = self.data["use_case"]["bios"]["model_path"]
        self.output_file = f'{self.logs_path}/output_files/output.xlsx'
        

    def process_and_convert(self):
        data = ""
        in_data = False  # Variable to track whether currently in data
        
        with open(self.input_file, "r") as infile:
            for line in infile:
                line = line.strip()
                if line:  # If the line is not empty
                    data += line + " "
                    in_data = True
                elif in_data:  # If line is empty but currently in data
                    data += "\n"
                    in_data = False


        # Split by consecutive newline characters and create DataFrame
        df = pd.DataFrame([d.strip() for d in data.split("\n") if d.strip()], columns=["Data"])

        os.makedirs(os.path.dirname(self.output_file), exist_ok=True)

        with pd.ExcelWriter(self.output_file, engine='openpyxl') as writer:
            df.to_excel(writer, index=False, header=False)

    def txt_to_excel(self):
        self.process_and_convert()
        failure_list = self.read_from_excel_infer(self.output_file)
        return failure_list

    def read_from_excel_infer(self,excel_file):
        failure_list = []
        df = pd.read_excel(excel_file)
        
        model, tokenizer, sum_time = self.load_bios_logs_model()
        
        for i in range(len(df)):
            ip_data = str(df.iloc[i, 0])
            text_value = self.inferencing(ip_data, model, tokenizer, sum_time)
            details = text_value.split(". ")
            details1 = "-" if len(details) == 1 else details[1]
            failure_list.append({"Input": ip_data, "Output": details[0], "Details": details1})
        
        del model
        del tokenizer
        
        return failure_list

    def load_bios_logs_model(self):
        torch.cuda.empty_cache()
        peft_model_id = f"{self.model_path}"
        config = PeftConfig.from_pretrained(peft_model_id)

        model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path, load_in_8bit=True, device_map={"": 0})
        tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)

        model = PeftModel.from_pretrained(model, peft_model_id, device_map={"": 0})
        model.eval()

        mixer.init()
        
        return model, tokenizer, 0
    

    def inferencing(self,prompt, model, tokenizer, sum_time):
        input_ids = tokenizer(prompt, return_tensors="pt", truncation=True).input_ids.cuda()
        start_time = time.time()
        outputs = model.generate(input_ids=input_ids, max_new_tokens=500, do_sample=True, top_p=0.9)
        end_time = time.time()
        sum_time += (end_time - start_time)
        output_text = tokenizer.batch_decode(outputs.detach().cpu().numpy(), skip_special_tokens=True)[0]
        return output_text