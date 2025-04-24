
from typing import List, Dict, Any
import numpy as np

# class PromptOptimizer:
#     """Class for optimizing prompts in RAPTOR RAG"""
    
#     def __init__(self, embedding_generator, tokenizer):
#         self.embedding_generator = embedding_generator
#         self.tokenizer = tokenizer
#         self.prompt_templates = [
#             "Context: {context}\n\nQuestion: {query}\n\nAnswer:",
#             "Based on the following context:\n{context}\n\nPlease answer: {query}",
#             "Given this information:\n{context}\n\nRespond to: {query}",
#         ]
        
#     def optimize(self, query: str, context: str, attempt: int = 0) -> str:
#         """
#         Optimize the prompt based on query, context, and previous attempts.
        
#         Args:
#             query: User query
#             context: Retrieved context
#             attempt: Current attempt number
            
#         Returns:
#             Optimized prompt string
#         """
#         # Use different templates for different attempts
#         template_idx = attempt % len(self.prompt_templates)
#         base_template = self.prompt_templates[template_idx]
        
#         # Analyze query complexity
#         query_tokens = self.tokenizer(query, return_tensors="pt")
#         query_length = len(query_tokens["input_ids"][0])
        
#         # Analyze context
#         context_chunks = self._split_context(context)
#         context_embeddings = self.embedding_generator.generate_embeddings(context_chunks)
#         query_embedding = self.embedding_generator.generate_embeddings([query])[0]
        
#         # Find most relevant context parts
#         relevance_scores = []
#         for emb in context_embeddings:
#             similarity = np.dot(query_embedding, emb) / (
#                 np.linalg.norm(query_embedding) * np.linalg.norm(emb)
#             )
#             relevance_scores.append(similarity)
            
#         # Sort and select most relevant chunks
#         sorted_chunks = [x for _, x in sorted(
#             zip(relevance_scores, context_chunks),
#             reverse=True
#         )]
        
#         # Combine chunks while respecting token limits
#         optimized_context = self._combine_chunks(
#             sorted_chunks,
#             max_tokens=1024 - query_length
#         )
        
#         # Format prompt with optimized context
#         optimized_prompt = base_template.format(
#             context=optimized_context,
#             query=query
#         )
        
#         return optimized_prompt
    
#     def _split_context(self, context: str) -> List[str]:
#         """Split context into manageable chunks"""
#         # Simple sentence-based splitting for demonstration
#         sentences = context.split('. ')
#         return [s + '.' for s in sentences if s]
    
#     def _combine_chunks(self, chunks: List[str], max_tokens: int) -> str:
#         """Combine chunks while respecting token limit"""
#         combined = []
#         current_tokens = 0
        
#         for chunk in chunks:
#             chunk_tokens = len(self.tokenizer(chunk)["input_ids"])
#             if current_tokens + chunk_tokens > max_tokens:
#                 break
#             combined.append(chunk)
#             current_tokens += chunk_tokens
            
#         return ' '.join(combined)
    

class PromptOptimizer:
    """Class for optimizing prompts in RAPTOR RAG"""
    
    def __init__(self, embedding_generator, tokenizer):
        self.embedding_generator = embedding_generator
        self.tokenizer = tokenizer
        self.prompt_templates = [
            "Context: {context}\n\nQuestion: {query}\n\nAnswer:",
            "Based on the following context:\n{context}\n\nPlease answer: {query}",
            "Given this information:\n{context}\n\nRespond to: {query}",
        ]
        
    def optimize(self, query: str, documents: List[Dict], attempt: int = 0) -> str:
        """
        Optimize the prompt based on query, documents, and previous attempts.
        
        Args:
            query: User query
            documents: List of document dictionaries with 'page_content' field
            attempt: Current attempt number
            
        Returns:
            Optimized prompt string
        """

        template_idx = attempt % len(self.prompt_templates)
        base_template = self.prompt_templates[template_idx]
        
        
        context_chunks = [doc['page_content'] for doc in documents]
        
    
        query_tokens = self.tokenizer(query, return_tensors="pt")
        query_length = len(query_tokens["input_ids"][0])
        

        context_embeddings = self.embedding_generator.generate_embeddings(context_chunks)
        query_embedding = self.embedding_generator.generate_embeddings([query])[0]
        
        
        relevance_scores = []
        for emb in context_embeddings:
            similarity = np.dot(query_embedding, emb) / (
                np.linalg.norm(query_embedding) * np.linalg.norm(emb)
            )
            relevance_scores.append(similarity)
        
        
        sorted_chunks = [x for _, x in sorted(
            zip(relevance_scores, context_chunks),
            reverse=True
        )]
        
        optimized_context = self._combine_chunks(
            sorted_chunks,
            max_tokens=1024 - query_length
        )
        
        
        optimized_prompt = base_template.format(
            context=optimized_context,
            query=query
        )
        
        return optimized_prompt

    def _combine_chunks(self, chunks: List[str], max_tokens: int) -> str:
        """Combine chunks while respecting token limit"""
        combined = []
        current_tokens = 0
        
        for chunk in chunks:
            chunk_tokens = len(self.tokenizer(chunk)["input_ids"])
            if current_tokens + chunk_tokens > max_tokens:
                break
            combined.append(chunk)
            current_tokens += chunk_tokens
        
        return ' '.join(combined)





