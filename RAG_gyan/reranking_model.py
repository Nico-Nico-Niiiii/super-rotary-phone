
from transformers import AutoModelForSequenceClassification, AutoTokenizer
import torch
import numpy as np
from typing import List, Dict, Any

class RerankingModel:
    """Class for reranking retrieved documents in RAPTOR RAG"""
    
    def __init__(self, model_name: str = "cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.model = AutoModelForSequenceClassification.from_pretrained(model_name)
        self.tokenizer = AutoTokenizer.from_pretrained(model_name)
        self.model.to(self.device)
        self.model.eval()
        
    def score(self, query: str, response: str, context: str) -> float:
        """
        Score the quality of a response given the query and context.
        
        Args:
            query: Original user query
            response: Generated response
            context: Context used for generation
            
        Returns:
            Quality score between 0 and 1
        """
        with torch.no_grad():
            
            pairs = [
                (query, response),
                (context, response),
                (query, context)
            ]
            
            scores = []
            for text1, text2 in pairs:
                
                inputs = self.tokenizer(
                    text1,
                    text2,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt"
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
        
                outputs = self.model(**inputs)
                logits = outputs.logits
                scores.append(torch.sigmoid(logits).item())
            
            
            final_score = float(np.power(np.prod(scores), 1/len(scores)))
            
            return final_score
    
    def rerank_passages(self, query: str, passages: List[str], 
                       top_k: int = None) -> List[Dict[str, Any]]:
        """
        Rerank passages based on relevance to query.
        
        Args:
            query: User query
            passages: List of passages to rerank
            top_k: Number of top passages to return (None for all)
            
        Returns:
            List of dicts with passages and scores
        """
        with torch.no_grad():
            scores = []
            for passage in passages:
                inputs = self.tokenizer(
                    query,
                    passage,
                    padding=True,
                    truncation=True,
                    max_length=512,
                    return_tensors="pt"
                )
                inputs = {k: v.to(self.device) for k, v in inputs.items()}
                
                outputs = self.model(**inputs)
                score = torch.sigmoid(outputs.logits).item()
                scores.append(score)
            
        
            ranked_passages = [
                {"passage": p, "score": s}
                for p, s in zip(passages, scores)
            ]
            
            
            ranked_passages.sort(key=lambda x: x["score"], reverse=True)
            
            
            if top_k is not None:
                ranked_passages = ranked_passages[:top_k]
                
            return ranked_passages