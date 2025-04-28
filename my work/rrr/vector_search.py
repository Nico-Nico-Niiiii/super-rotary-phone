from typing import List, Tuple
import numpy as np
import faiss
from annoy import AnnoyIndex
from sklearn.metrics.pairwise import cosine_similarity

class FaissSearch:
    def __init__(self, metric: str = "cosine"):
        """
        Initialize FAISS search algorithm.
        
        Args:
            metric (str): Distance metric to use ("cosine" or "l2")
        """
        self.metric = metric
        
    def build_index(self, embeddings: List[List[float]]):
        """
        Build a FAISS index optimized for fast similarity search.
        
        Args:
            embeddings (List[List[float]]): List of embeddings to index
        
        Returns:
            faiss.Index: Built FAISS index
        """
        embeddings = np.array(embeddings).astype("float32")
        dimension = embeddings.shape[1]
        
        if self.metric == "cosine":
            # Normalize vectors for cosine similarity
            faiss.normalize_L2(embeddings)
            index = faiss.IndexFlatIP(dimension)  # Inner product for cosine
        else:
            index = faiss.IndexFlatL2(dimension)  # L2 distance
            
        index.add(embeddings)
        return index
    
    def search(self, index, query_embedding: List[float], top_k: int = 5) -> Tuple[List[int], List[float]]:
        """
        Search the FAISS index.
        
        Args:
            index (faiss.Index): Built FAISS index
            query_embedding (List[float]): Query vector
            top_k (int): Number of results to return
        
        Returns:
            Tuple[List[int], List[float]]: Indices and distances of results
        """
        query_embedding = np.array(query_embedding).astype("float32").reshape(1, -1)
        if self.metric == "cosine":
            faiss.normalize_L2(query_embedding)
        distances, indices = index.search(query_embedding, top_k)
        return indices[0].tolist(), distances[0].tolist()

class HNSWSearch:
    def __init__(self, M: int = 32, ef_construction: int = 200, ef_search: int = 128):
        """
        Initialize HNSW search algorithm.
        
        Args:
            M (int): Number of connections per layer
            ef_construction (int): Size of dynamic candidate list for construction
            ef_search (int): Size of dynamic candidate list for search
        """
        self.M = M
        self.ef_construction = ef_construction
        self.ef_search = ef_search
    
    def build_index(self, embeddings: List[List[float]]):
        """
        Build HNSW index for approximate nearest neighbor search.
        
        Args:
            embeddings (List[List[float]]): List of embeddings to index
        
        Returns:
            faiss.Index: Built HNSW index
        """
        embeddings = np.array(embeddings).astype("float32")
        dimension = embeddings.shape[1]
        
        index = faiss.IndexHNSWFlat(dimension, self.M)
        index.hnsw.efConstruction = self.ef_construction
        index.hnsw.efSearch = self.ef_search
        
        index.add(embeddings)
        return index
    
    def search(self, index, query_embedding: List[float], top_k: int = 5) -> Tuple[List[int], List[float]]:
        """
        Search the HNSW index.
        
        Args:
            index (faiss.Index): Built HNSW index
            query_embedding (List[float]): Query vector
            top_k (int): Number of results to return
        
        Returns:
            Tuple[List[int], List[float]]: Indices and distances of results
        """
        query_embedding = np.array(query_embedding).astype("float32").reshape(1, -1)
        distances, indices = index.search(query_embedding, top_k)
        return indices[0].tolist(), distances[0].tolist()

class BruteForceSearch:
    def __init__(self, metric: str = "cosine"):
        """
        Initialize brute force search algorithm.
        
        Args:
            metric (str): Distance metric to use ("cosine" or "l2")
        """
        self.metric = metric
    
    def build_index(self, embeddings: List[List[float]]):
        """
        Store embeddings for brute force search.
        
        Args:
            embeddings (List[List[float]]): List of embeddings to store
        
        Returns:
            np.ndarray: Stored embeddings
        """
        return np.array(embeddings).astype("float32")
    
    def search(self, embeddings: np.ndarray, query_embedding: List[float], top_k: int = 5) -> Tuple[List[int], List[float]]:
        """
        Perform brute force search through all embeddings.
        
        Args:
            embeddings (np.ndarray): Stored embeddings
            query_embedding (List[float]): Query vector
            top_k (int): Number of results to return
        
        Returns:
            Tuple[List[int], List[float]]: Indices and distances of results
        """
        query_embedding = np.array(query_embedding).reshape(1, -1)
        
        if self.metric == "cosine":
            similarities = cosine_similarity(query_embedding, embeddings)[0]
            indices = np.argsort(similarities)[-top_k:][::-1]
            distances = similarities[indices]
        else:
            distances = np.linalg.norm(embeddings - query_embedding, axis=1)
            indices = np.argsort(distances)[:top_k]
            distances = distances[indices]
            
        return indices.tolist(), distances.tolist()

class AnnoySearch:
    def __init__(self, metric: str = "cosine", n_trees: int = 100):
        """
        Initialize Annoy search algorithm.
        
        Args:
            metric (str): Distance metric ("cosine" or "euclidean")
            n_trees (int): Number of trees for index building
        """
        self.metric = "angular" if metric == "cosine" else "euclidean"
        self.n_trees = n_trees
    
    def build_index(self, embeddings: List[List[float]]):
        """
        Build Annoy index for approximate nearest neighbor search.
        
        Args:
            embeddings (List[List[float]]): List of embeddings to index
        
        Returns:
            AnnoyIndex: Built Annoy index
        """
        embeddings = np.array(embeddings).astype("float32")
        dimension = embeddings.shape[1]
        
        index = AnnoyIndex(dimension, self.metric)
        
        for i, embedding in enumerate(embeddings):
            index.add_item(i, embedding)
        
        index.build(self.n_trees)
        return index
    
    def search(self, index: AnnoyIndex, query_embedding: List[float], top_k: int = 5) -> Tuple[List[int], List[float]]:
        """
        Search the Annoy index.
        
        Args:
            index (AnnoyIndex): Built Annoy index
            query_embedding (List[float]): Query vector
            top_k (int): Number of results to return
        
        Returns:
            Tuple[List[int], List[float]]: Indices and distances of results
        """
        indices, distances = index.get_nns_by_vector(
            query_embedding, top_k, include_distances=True
        )
        return indices, distances

class SearchFactory:
    @staticmethod
    def create_search_algorithm(method: str, **kwargs) -> object:
        """
        Create a search algorithm based on the selected method.
        
        Args:
            method (str): Search method ("faiss", "hnsw", "brute_force", or "annoy")
            **kwargs: Additional arguments for specific search algorithms
        
        Returns:
            object: Search algorithm instance
        """
        if method == "faiss":
            return FaissSearch(**kwargs)
        elif method == "hnsw":
            return HNSWSearch(**kwargs)
        elif method == "brute_force":
            return BruteForceSearch(**kwargs)
        elif method == "annoy":
            return AnnoySearch(**kwargs)
        else:
            raise ValueError(f"Unknown search method: {method}")
