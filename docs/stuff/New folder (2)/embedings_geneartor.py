from sentence_transformers import SentenceTransformer
from langchain_core.documents import Document
from typing import List, Dict, Any
import numpy as np


class BaseEmbeddingGenerator:
    def __init__(self, model_name: str, trust_remote_code: bool = False):
        """
        Initialize base embedding generator
        
        Args:
            model_name (str): Embedding model name
            trust_remote_code (bool): Whether to trust the remote code (default False)
        """
        self.model = SentenceTransformer(model_name, trust_remote_code=trust_remote_code)
        
    def _preprocess_text(self, text: str) -> str:
        """
        Basic text preprocessing
        
        Args:
            text (str): Input text
            
        Returns:
            str: Preprocessed text
        """
        return text.strip()
        
    def generate_embeddings(self, chunks: List[Document]) -> List[List[float]]:
        """
        Generate embeddings for document chunks
        
        Args:
            chunks (List[Document]): Document chunks
            
        Returns:
            List[List[float]]: List of embeddings
        """
        preprocessed_texts = [self._preprocess_text(chunk.page_content) for chunk in chunks]
        return [embedding.tolist() for embedding in self.model.encode(preprocessed_texts)]


class E5EmbeddingGenerator(BaseEmbeddingGenerator):
    def __init__(self, trust_remote_code: bool = False):
        """Initialize E5 embedding generator"""
        super().__init__("intfloat/e5-large-v2", trust_remote_code=trust_remote_code)
        
    def _preprocess_text(self, text: str) -> str:
        """
        E5-specific text preprocessing - adds passage prefix
        """
        text = super()._preprocess_text(text)
        return f"passage: {text}"


class BGEEmbeddingGenerator(BaseEmbeddingGenerator):
    def __init__(self, trust_remote_code: bool = False):
        """Initialize BGE embedding generator"""
        super().__init__("BAAI/bge-large-en-v1.5", trust_remote_code=trust_remote_code)
        
    def _preprocess_text(self, text: str) -> str:
        """
        BGE-specific text preprocessing - adds instruction prefix
        """
        text = super()._preprocess_text(text)
        return f"Represent this document for retrieval: {text}"


class GTEEmbeddingGenerator(BaseEmbeddingGenerator):
    def __init__(self, trust_remote_code: bool = False):
        """Initialize GTE embedding generator"""
        super().__init__("Alibaba-NLP/gte-large-en-v1.5", trust_remote_code=trust_remote_code)


class MinilmEmbeddingGenerator(BaseEmbeddingGenerator):
    def __init__(self, trust_remote_code: bool = False):
        """Initialize MiniLM embedding generator"""
        super().__init__("sentence-transformers/all-MiniLM-L6-v2", trust_remote_code=trust_remote_code)
        

class EmbeddingGeneratorFactory:
    _generators = {
        "e5": E5EmbeddingGenerator,
        "bge": BGEEmbeddingGenerator,
        "gte": GTEEmbeddingGenerator,
        "minilm": MinilmEmbeddingGenerator
    }
    
    _model_map = {
        "intfloat/e5-large-v2": "e5",
        "BAAI/bge-large-en-v1.5": "bge",
        "Alibaba-NLP/gte-large-en-v1.5": "gte",
        "sentence-transformers/all-MiniLM-L6-v2": "minilm"
    }
    
    @classmethod
    def get_supported_models(cls) -> List[str]:
        """
        Get list of supported model names
        
        Returns:
            List[str]: List of supported model names
        """
        return list(cls._model_map.keys())
    
    @classmethod
    def create_generator(cls, model_name: str, trust_remote_code: bool = False) -> BaseEmbeddingGenerator:
        """
        Create embedding generator based on model name
        
        Args:
            model_name (str): Full name/path of the model
            
        Returns:
            BaseEmbeddingGenerator: Embedding generator instance
            
        Raises:
            ValueError: If unknown model name is specified
        """
        if model_name not in cls._model_map:
            raise ValueError(
                f"Unsupported model: {model_name}. "
                f"Supported models are: {', '.join(cls.get_supported_models())}"
            )
            
        generator_type = cls._generators[cls._model_map[model_name]]
        return generator_type(trust_remote_code=trust_remote_code)


class EnhancedEmbeddingGenerator:
    def __init__(self, model_name: str, batch_size: int = 32, trust_remote_code: bool = False):
        """
        Initialize enhanced embedding generator with batching and caching
        
        Args:
            model_name (str): Model name/path
            batch_size (int): Batch size for processing
            trust_remote_code (bool): Whether to trust remote code (default False)
        """
        self.generator = EmbeddingGeneratorFactory.create_generator(model_name, trust_remote_code)
        self.batch_size = batch_size
        self.embedding_cache: Dict[str, List[float]] = {}
        
    def generate_embeddings(self, chunks: List[Document]) -> List[List[float]]:
        """
        Generate embeddings with batching and caching
        
        Args:
            chunks (List[Document]): Document chunks
            
        Returns:
            List[List[float]]: Generated embeddings
        """
        embeddings = []
        batch = []
        uncached_indices = []
        
        
        for i, chunk in enumerate(chunks):
            content = chunk.page_content
            if content in self.embedding_cache:
                embeddings.append(self.embedding_cache[content])
            else:
                batch.append(chunk)
                uncached_indices.append(i)
                
                
                if len(batch) >= self.batch_size:
                    batch_embeddings = self.generator.generate_embeddings(batch)
                    
                
                    for j, embedding in enumerate(batch_embeddings):
                        content = batch[j].page_content
                        self.embedding_cache[content] = embedding
                        embeddings.append(embedding)
                        
                    batch = []
                    uncached_indices = []
        
        
        if batch:
            batch_embeddings = self.generator.generate_embeddings(batch)
            
            
            for j, embedding in enumerate(batch_embeddings):
                content = batch[j].page_content
                self.embedding_cache[content] = embedding
                embeddings.append(embedding)
        
        return embeddings

    def compute_similarity(self, embedding1: List[float], embedding2: List[float]) -> float:
        """
        Compute cosine similarity between two embeddings
        
        Args:
            embedding1 (List[float]): First embedding
            embedding2 (List[float]): Second embedding
            
        Returns:
            float: Cosine similarity score
        """
        vec1 = np.array(embedding1)
        vec2 = np.array(embedding2)
        
        similarity = np.dot(vec1, vec2) / (np.linalg.norm(vec1) * np.linalg.norm(vec2))
        return float(similarity)
    
    def clear_cache(self):
        """Clear the embedding cache"""
        self.embedding_cache.clear()
