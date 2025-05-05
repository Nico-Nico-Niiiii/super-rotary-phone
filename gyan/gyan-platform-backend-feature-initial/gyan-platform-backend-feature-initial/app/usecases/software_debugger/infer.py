from nemollm.api import NemoLLM
import torch
import pandas as pd
import time
from transformers import BertTokenizer, BertForSequenceClassification
import tqdm as tqdm
import json
from torch.utils.data import DataLoader, TensorDataset
import os

class AnomalyDetector:
    def __init__(self):
        """
        Initialize the AnomalyDetector with API connection and default model.
        """
        self.api_key = "bWFyYXQ0YzFrZWg4cDQ5aHFrMTFraG9kYTphNzQyYjZkZS0zZTk5LTQzMmMtOGQzOC04NDg2YmM3OTRiOTU"
        self.org_id = "heur2syrs2e8/capgemini_genai"
        self.conn = NemoLLM(api_key=self.api_key, org_id=self.org_id)
        # with open('config/path/path_config.json', 'r') as file:
        #         self.data = json.load(file)      
        
        # self.model_path = self.data["use_case"]["software_debugger"]["model_path"]["path_1"]
        # self.model_path_2= "/media/shared/GYAN_TEST/model/usecases/software_debugger/dummy_model_2.pt"
        # self.model_path_3= "/media/shared/GYAN_TEST/model/usecases/software_debugger/results_oil_filter"
        # self.dataset_path= self.data["use_case"]["software_debugger"]["dataset_path"]["path_1"]
        # self.logs_path= self.data["use_case"]["software_debugger"]["logs_path"]["path_1"]

        

    def detect_anomalies_sys(self, new_logs, tokenizer, model, threshold=0.00001):
        """
        Detect anomalies in system logs.
        """
        new_input_text = [message + " " + template + " " + str(cluster_id) for message, template, cluster_id in new_logs]
        new_encodings = tokenizer(new_input_text, truncation=True, padding="max_length", max_length=128, return_tensors='pt')
        new_dataset = TensorDataset(torch.tensor(new_encodings.input_ids), torch.tensor(new_encodings.attention_mask))
        new_loader = DataLoader(new_dataset, batch_size=16)
        
        anomalies_sys = []
        normal_logs_sys = []

        with torch.no_grad():
            c = 0
            for batch in new_loader:
                inputs = {"input_ids": batch[0], "attention_mask": batch[1]}
                outputs = model(**inputs)
                predicted_labels = torch.argmax(outputs.logits, dim=1)
                
                for i, predicted_label in enumerate(predicted_labels):
                    if predicted_label == 1 and outputs.logits[i][1] > threshold:
                        anomalies_sys.append(new_logs[i][0])
                    else: 
                        normal_logs_sys.append(new_logs[i][0])
                        c += 1

        self._save_logs(anomalies_sys, normal_logs_sys)
        return self._generate_predictions(len(new_logs), c, anomalies_sys, normal_logs_sys)

    def detect_anomalies_bt(self, new_logs, tokenizer, model, threshold=0.1):
        """
        Detect anomalies in Bluetooth logs.
        """
        new_input_text = [log + " " + template + " " + str(cluster_id) for log, template, cluster_id in new_logs]
        new_encodings = tokenizer(new_input_text, truncation=True, padding=True, max_length=128)
        new_dataset = TensorDataset(torch.tensor(new_encodings.input_ids), torch.tensor(new_encodings.attention_mask))
        new_loader = DataLoader(new_dataset, batch_size=16)
        
        anomalies_bt = []
        normal_logs_bt = []
        
        with torch.no_grad():
            c = 0
            for batch in new_loader:
                inputs = {"input_ids": batch[0], "attention_mask": batch[1]}
                outputs = model(**inputs)
                predicted_labels = torch.argmax(outputs.logits, dim=1)
                
                for i, predicted_label in enumerate(predicted_labels):
                    if predicted_label == 1 and outputs.logits[i][1] > threshold:
                        anomalies_bt.append(new_logs[i][0])
                    else:
                        normal_logs_bt.append(new_logs[i][0])
                        c += 1

        self._save_logs(anomalies_bt, normal_logs_bt)
        return self._generate_predictions(len(new_logs), c, anomalies_bt, normal_logs_bt)

    def run_inference_bt(self, log_file, selected_option, update_1):
        """
        Run inference for Bluetooth logs.
        """
        if selected_option == "4":
            model = BertForSequenceClassification.from_pretrained("bert-base-uncased", num_labels=2)
            model.load_state_dict(torch.load(self.model_path))
            model.eval()
            
            tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
            
            if update_1 == 1:
                new_logs = pd.read_csv(f"{self.dataset_path}/pre_predict_file.csv")
            else:
                new_logs = pd.read_csv(log_file)
            
            new_logs = new_logs[["log", "TemplateMined", "Cluster_ID"]].values.tolist()
            return self.detect_anomalies_bt(new_logs, tokenizer, model)

    def run_inference_sys(self, log_file, selected_option, update_2):
        """
        Run inference for system logs.
        """
        if selected_option == "7":
            model = BertForSequenceClassification.from_pretrained('bert-base-uncased', num_labels=2)
            model.load_state_dict(torch.load(self.model_path))
            model.eval()
            
            tokenizer = BertTokenizer.from_pretrained("bert-base-uncased")
            
            if update_2 == 1:
                new_logs = pd.read_csv(f"{self.dataset_path}/extracted_templates.csv")
            else:
                new_logs = pd.read_csv(log_file)
                
            new_logs = new_logs[["Message", "TemplateMined", "Cluster_ID"]].values.tolist()
            return self.detect_anomalies_sys(new_logs, tokenizer, model)

    def process_log(self, log):
        """
        Process a log using the GPT model via NemoLLM connection.
        """
        response = self.conn.generate(
            prompt=log,
            model="gpt-43b-002",
            customization_id="4e20bf52-e5a7-4a90-baee-fad4f22e40b4",
            stop=[],
            tokens_to_generate=200,
            temperature=1.0,
            top_k=59,
            top_p=0.4,
            random_seed=764607052,
            beam_search_diversity_rate=0.0,
            beam_width=1,
            repetition_penalty=1.0,
            length_penalty=1.0
        )
        time.sleep(0.2)
        return response['text']

    def generate_data(self):
        """
        Generate anomaly data and save responses.
        """
        anomaly = pd.read_csv(f'{self.dataset_path}/anomalies_logs.csv')
        anomaly_response = []

        for log in anomaly['Message']:
            response = self.conn.generate(
                prompt=log,
                model="gpt20b",
                customization_id="0d687cdf-58be-42ca-81b4-c4f2bb32e31c",
                stop=[],
                tokens_to_generate=100,
                temperature=1.0,
                top_k=42,
                top_p=0.6,
                random_seed=0,
                beam_search_diversity_rate=0.0,
                beam_width=1,
                repetition_penalty=1.0,
                length_penalty=1.0,
            )
            generated_text = response['text']
            anomaly_response.append(generated_text)
            anomaly_response.append("\n\n")

        with open('anomaly_response.txt', 'w') as file:
            file.writelines(anomaly_response)
        
        with open('logs.txt', 'w') as log_file:
            log_file.writelines([log + '\n\n' for log in anomaly['Message']])

        return "".join(anomaly_response), "".join(anomaly['Message'])

    def _save_logs(self, anomalies, normal_logs):
        """
        Save anomalies and normal logs to CSV.
        """
         # Construct the full file paths
        anomalies_file = os.path.join(self.logs_path, 'anomalies_logs.csv')
        normal_logs_file = os.path.join(self.logs_path, 'normal_logs.csv')

        # Save the anomalies and normal logs to the specified path
        pd.DataFrame({'Message': anomalies, 'AnomalyLabel': 1}).to_csv(anomalies_file, index=False)
        pd.DataFrame({'Message': normal_logs, 'AnomalyLabel': 0}).to_csv(normal_logs_file, index=False)

    def _generate_predictions(self, total_logs, normal_count, anomalies, normal_logs):
        """
        Generate predictions and statistics.
        """
        predictions = [
            total_logs,
            normal_count,
            total_logs - normal_count,
            ((total_logs - normal_count) / total_logs) * 100,
            (normal_count / total_logs) * 100,
            anomalies,
            normal_logs
        ]
        return predictions

    def display_error(self, message):
        error_message=message
        return error_message

 

