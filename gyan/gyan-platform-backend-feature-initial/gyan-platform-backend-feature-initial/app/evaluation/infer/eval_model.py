from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from evaluate import load
import pandas as pd
import torch
import time
import json
import os

class GyanLlama3Infer:
    def __init__(self, model_type, model_name, project_name, email):
        with open('config/paths.json', 'r') as file:
            data = json.load(file)
        path = data["evaluation"]["model_path"]
        
        self.model_id = os.path.join(path, email, model_type, project_name, model_name)
        
        # Different configuration for Llama3
        quantization_config = BitsAndBytesConfig(
            load_in_8bit=True,
            bnb_4bit_compute_dtype=torch.float16
        )
        
        try:
            self.tokenizer = AutoTokenizer.from_pretrained(
                self.model_id, 
                trust_remote_code=True,
                use_fast=False
            )
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id,
                quantization_config=quantization_config,
                device_map="auto",
                torch_dtype=torch.float16
            )
        except Exception as e:
            raise Exception(f"Failed to load model: {str(e)}")
        
        # Load evaluation metrics
        self.rouge = load('rouge')
        self.bleu = load('bleu')
        self.bertscore = load('bertscore')
        self.chrf = load("chrf")
    
    def generate_predictions(self, input_sources, strategy, temperature, top_p=None, top_k=None, batch_size=10, max_length=1024):
        self.model.eval()
        predictions = []
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

        for i in range(0, len(input_sources), batch_size):
            batch_sources = input_sources[i:i + batch_size]
            inputs = self.tokenizer(
                batch_sources, 
                padding=True, 
                truncation=True, 
                max_length=max_length, 
                return_tensors="pt"
            ).to(device)

            decode_params = {
                'input_ids': inputs['input_ids'],
                'attention_mask': inputs['attention_mask'],
                'max_length': max_length,
                'num_return_sequences': 1,
                'temperature': float(temperature),
                'max_new_tokens': 256
            }

            if strategy == "random- top p":
                decode_params.update({
                    'do_sample': True,
                    'top_p': float(top_p) if top_p is not None else 0.95
                })
            elif strategy == "random- top k":
                decode_params.update({
                    'do_sample': True,
                    'top_k': int(top_k) if top_k is not None else 50
                })
            elif strategy != "greedy":
                raise ValueError(f"Unknown decoding strategy: {strategy}")

            start_time = time.time()
            try:
                with torch.no_grad():
                    outputs = self.model.generate(**decode_params)
                    predicted_texts = self.tokenizer.batch_decode(outputs, skip_special_tokens=True)
                    predictions.extend(predicted_texts)
            except Exception as e:
                print(f"Error during generation: {e}")
                raise

            print(f"Batch {i // batch_size + 1} processed in {time.time() - start_time:.2f} seconds")

        return predictions

    def evaluate_predictions(self, predictions, references):
        if len(predictions) != len(references):
            min_len = min(len(predictions), len(references))
            predictions = predictions[:min_len]
            references = references[:min_len]
        
        results = {
            "rouge": self.rouge.compute(predictions=predictions, references=references),
            "bleu": self.bleu.compute(predictions=predictions, references=references),
            "bertscore": self.bertscore.compute(predictions=predictions, references=references, lang="en"),
            "chrf": self.chrf.compute(predictions=predictions, references=references)
        }
        
        return results

    def evaluate_all_metrics(self, dataset, strategy, temperature, top_k=None, top_p=None):
        input_column = next(
            (col for col in ['input', 'question', 'source'] if col in dataset.columns),
            dataset.columns[0]
        )
        output_column = next(
            (col for col in ['output', 'answer', 'target', 'reference'] if col in dataset.columns),
            dataset.columns[1]
        )

        input_sources = dataset[input_column].tolist()
        references = dataset[output_column].tolist()
        
        predictions = self.generate_predictions(
            input_sources, 
            strategy, 
            temperature,
            top_k=top_k if strategy == "random- top k" else None,
            top_p=top_p if strategy == "random- top p" else None
        )

        evaluation_results = self.evaluate_predictions(predictions, references)
        
        perplexity_scores = [self.perplexity(text) for text in predictions]
        evaluation_results['perplexity'] = {"score": sum(perplexity_scores) / len(perplexity_scores)}
        
        remarks = {}
        final_scores = {}
        for metric, score in evaluation_results.items():
            final_score, remark = self.get_remark(metric, score)
            remarks[metric] = remark
            final_scores[metric] = final_score

        return {
            "results": evaluation_results,
            "remarks": remarks,
            "final_scores": final_scores
        }

    def perplexity(self, text):
        inputs = self.tokenizer(text, return_tensors="pt").to(self.model.device)
        with torch.no_grad():
            outputs = self.model(**inputs, labels=inputs["input_ids"])
            return torch.exp(outputs.loss).item()

    def get_remark(self, metric, score):
        def calculate_average(score_list):
            return sum(score_list) / len(score_list) if score_list else 0

        if metric == 'perplexity':
            final_score = score.get('score', 0)
            if final_score < 20:
                return final_score, "Good"
            elif final_score < 50:
                return final_score, "Moderate"
            return final_score, "Bad"
            
        elif metric == 'bleu':
            final_score = score.get('bleu', 0)
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            return final_score, "Bad"
            
        elif metric == 'chrf':
            final_score = score.get('score', 0) / 100
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            return final_score, "Bad"
            
        elif metric == 'rouge':
            rouge_scores = [score.get(key, 0) for key in ['rouge1', 'rouge2', 'rougeL', 'rougeLsum']]
            final_score = calculate_average(rouge_scores)
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            return final_score, "Bad"
            
        elif metric == 'bertscore':
            final_score = calculate_average(score.get('f1', []))
            if final_score > 0.6:
                return final_score, "Good"
            elif final_score > 0.3:
                return final_score, "Moderate"
            return final_score, "Bad"

        return 0, "Undefined"