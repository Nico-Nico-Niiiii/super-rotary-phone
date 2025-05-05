from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from evaluate import load
import pandas as pd
import torch
import time
import json
from app.cfg.config_loader import Config

class GyanLlama2Infer:
    def __init__(self,model_type,model_name, project_name, user_email, job_name): 
        #path
        c = Config()
        cfg = c.load("./cfg/repo_details.json")
        model_root = cfg['model_repo']

        # with open('config/path/path_config.json', 'r') as file:
        #     data = json.load(file)
        # path = data["evaluation"]["model_path"]

        # hf_token = "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"
        
        self.model_id = model_root + "/"+ user_email+ "/" + model_type + "/" + project_name + "/" + model_name + "/" + job_name
        print(self.model_id)
        quantization_config = BitsAndBytesConfig(load_in_8bit=True)
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        self.model = AutoModelForCausalLM.from_pretrained(self.model_id,  quantization_config=quantization_config)
        
        # Load evaluation metrics
        self.rouge = load('rouge')
        self.bleu = load('bleu')
        self.bertscore = load('bertscore')
        self.chrf = load("chrf")
    
    def generate_predictions(self, input_sources, strategy, temperature, top_p=None, top_k=None, batch_size=10, max_length=1024):
        self.model.eval()  # Set model to evaluation mode
        predictions = []
        for i in range(0, len(input_sources), batch_size):
            batch_sources = input_sources[i:i + batch_size]
            inputs = self.tokenizer(batch_sources, padding=True, truncation=True, max_length=max_length, return_tensors="pt")
            device = 0
            input_ids = inputs['input_ids'].to(device)
            attention_mask = inputs['attention_mask'].to(device)

            # Ensure parameters are of the correct type
            temperature = float(temperature) if temperature is not None else 1.0
            if top_p:
                top_p = float(top_p) if top_p is not None else 0.95
            elif top_k:
                top_k = int(top_k) if top_k is not None else 50


            # Select decoding strategy based on user input
            if strategy == "greedy":
                # Greedy decoding: takes the most probable next token at each step
                decode_params = {
                    'input_ids': input_ids,
                    'attention_mask': attention_mask,
                    'max_length': max_length,
                    'num_return_sequences': 1,
                    'temperature':temperature,
                    'max_new_tokens': 256
                }
            elif strategy == "topp":
                # Top-k sampling: choose the next token from the top-k most probable tokens
                decode_params = {
                    'input_ids': input_ids,
                    'attention_mask': attention_mask,
                    'max_length': max_length,
                    'num_return_sequences': 1,
                    'do_sample': True,  # Enable sampling
                    'top_p': top_p if top_p else 0.95,  # Default top_p value
                    'temperature':temperature,
                    'max_new_tokens': 256
                }
            elif strategy == "topk":
                # Top-k sampling: choose the next token from the top-k most probable tokens
                decode_params = {
                    'input_ids': input_ids,
                    'attention_mask': attention_mask,
                    'max_length': max_length,
                    'num_return_sequences': 1,
                    'do_sample': True,  # Enable sampling
                    'top_k': int(top_k) if top_k else 50,  # Default top_k 
                    'temperature':temperature,
                    'max_new_tokens': 256
                }
            
            else:
                raise ValueError(f"Unknown decoding strategy: {strategy}")
            
            start_time = time.time()  # Start timing
            with torch.no_grad():
                try:
                    outputs = self.model.generate(**decode_params)
                    #outputs = self.model.generate(input_ids, attention_mask=attention_mask, max_length=max_length, num_return_sequences=1, max_new_tokens=256)
                    predicted_texts = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
                    predictions.extend(predicted_texts)
                except Exception as e:
                    print(f"Error during generation: {e}")
                    print(f"decode_params: {decode_params}")
                    print(f"top_k type: {type(top_k)}, value: {top_k}")
            end_time = time.time()  # End timing
            print(f"Batch {i // batch_size + 1} processed in {end_time - start_time:.2f} seconds")
        
        return predictions

    def evaluate_predictions(self, predictions, references):
        # Ensure that predictions and references have the same length
        if len(predictions) != len(references):
            print(f"Warning: Mismatch in the number of predictions ({len(predictions)}) and references ({len(references)})")
            min_len = min(len(predictions), len(references))
            predictions = predictions[:min_len]
            references = references[:min_len]
        
        # ROUGE Evaluation
        rouge_results = self.rouge.compute(predictions=predictions, references=references)
        
        # BLEU Evaluation
        bleu_results = self.bleu.compute(predictions=predictions, references=references)
        
        # BERTScore Evaluation
        bertscore_results = self.bertscore.compute(predictions=predictions, references=references, lang="en")

        #chrF Evaluation
        chrf_results = self.chrf.compute(predictions=predictions, references=references)
        
        return {"rouge": rouge_results, "bleu": bleu_results, "bertscore": bertscore_results, "chrf": chrf_results}
    
    def evaluate_all_metrics(self, dataset, strategy, temperature, top_k=None, top_p=None):
        # input_sources = dataset['question'].tolist()
        # references = dataset['answer'].tolist()
        print(strategy)
        input_column = None
        output_column = None

        try:
            temperature = float(temperature)
        except (TypeError, ValueError):
            temperature = 1.0
            
        # Convert top_k and top_p to appropriate types
        if top_k is not None:
            try:
                top_k = int(top_k)
            except (TypeError, ValueError):
                top_k = None
        
        if top_p is not None:
            try:
                top_p = float(top_p)
            except (TypeError, ValueError):
                top_p = None
        
        # Possible labels for input and output columns
        possible_input_labels = ['input', 'question', 'source']
        possible_output_labels = ['output', 'answer', 'target', 'reference']

        # Detect the input column
        for label in possible_input_labels:
            if label in dataset.columns:
                input_column = label
                break
        # Detect the output column
        for label in possible_output_labels:
            if label in dataset.columns:
                output_column = label
                break
        
        # If no match is found, default to the first and second columns
        if not input_column:
            input_column = dataset.columns[0]
        if not output_column:
            output_column = dataset.columns[1]

        # Extract input and output data
        input_sources = dataset[input_column].tolist()
        references = dataset[output_column].tolist()
        
        if strategy=="greedy":
            predictions = self.generate_predictions(input_sources, strategy, temperature)
        elif strategy=="topp":
            predictions = self.generate_predictions(input_sources, strategy, temperature, top_p)
        elif strategy=="topk":
            predictions = self.generate_predictions(input_sources, strategy, temperature, top_k)

        evaluation_results = self.evaluate_predictions(predictions, references)
        
        perplexity_scores = [self.perplexity(text) for text in predictions]
        avg_perplexity = sum(perplexity_scores) / len(perplexity_scores)
        
        evaluation_results['perplexity'] = {"score": avg_perplexity}
        
        remarks = {}
        final_scores = {} 
        for metric, score in evaluation_results.items():
            #print(metric, score)
            #remarks[metric] = self.get_remark(metric, score)  #original line 
            final_score, remark = self.get_remark(metric, score)
            remarks[metric] = remark
            final_scores[metric] = final_score  # Store the score
        
        return {"results": evaluation_results, "remarks": remarks, "final_scores": final_scores}  # Return scores as well
    
    def perplexity(self, text):
        inputs = self.tokenizer(text, return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            outputs = self.model(**inputs, labels=inputs["input_ids"])
            loss = outputs.loss
            perplexity = torch.exp(loss).item()
        return perplexity
    
    def get_remark(self, metric, score):
        def calculate_average(score_list):
            """Calculate the average of a list of numbers."""
            return sum(score_list) / len(score_list) if score_list else 0

        # Debug: Print the score to check its structure
        print(f"Score received: {score}")

        # Check and evaluate for 'perplexity'
        if isinstance(score, dict) and 'perplexity' == metric:
            final_score = score.get('score', 0)
            if final_score < 20:
                return final_score, "Good"
            elif final_score < 50:
                return final_score, "Moderate"
            else:
                return final_score, "Bad"

        # Check and evaluate for 'bleu'
        elif isinstance(score, dict) and 'bleu' == metric:
            final_score = score.get('bleu', 0)
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            else:
                return final_score, "Bad"

        # Check and evaluate for 'chrf'
        elif isinstance(score, dict) and 'chrf' == metric:
            final_score = score.get('score', 0) / 100  # Normalize CHRF score
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            else:
                return final_score, "Bad"

        # Check and evaluate for 'rouge'
        elif isinstance(score, dict) and 'rouge' == metric:
            rouge_scores = [
                score.get('rouge1', 0),
                score.get('rouge2', 0),
                score.get('rougeL', 0),
                score.get('rougeLsum', 0)
            ]
            final_score = calculate_average(rouge_scores)
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            else:
                return final_score, "Bad"

        # Check and evaluate for 'bertscore'
        elif isinstance(score, dict) and 'bertscore' == metric:
          
            final_score = calculate_average(score.get('f1', []))
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            else:
                return final_score, "Bad"

        return final_score, "Undefined"



