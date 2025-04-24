"""
GPU-accelerated vector database for the vision-based RAG system.
"""

import json
import os
from typing import Dict, List, Optional, Union
import uuid
import torch
import numpy as np
from pathlib import Path

import chromadb
from chromadb.config import Settings

from utils.logger import logger
from config.settings import CHROMA_PERSIST_DIRECTORY, COLLECTION_NAME, EMBEDDING_DIMENSION


class VectorStore:
    """
    Vector database for storing and retrieving image embeddings and metadata.
    Uses ChromaDB as the underlying vector database with GPU acceleration when possible.
    """
    
    def __init__(self, collection_name: str = COLLECTION_NAME):
        """
        Initialize the vector store with ChromaDB.
        
        Args:
            collection_name: Name of the collection to use
        """
        # Create persistence directory if it doesn't exist
        os.makedirs(CHROMA_PERSIST_DIRECTORY, exist_ok=True)
        
        # Check for GPU support
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        logger.info(f"VectorStore initialized on {self.device}")
        
        # Initialize ChromaDB client
        self.client = chromadb.PersistentClient(
            path=CHROMA_PERSIST_DIRECTORY,
            settings=Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
        )
        
        # Get or create collection
        try:
            self.collection = self.client.get_collection(collection_name)
            logger.info(f"Using existing collection: {collection_name}")
        except Exception:
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"Created new collection: {collection_name}")
    
    def _optimize_embeddings(self, embeddings: List[List[float]]) -> List[List[float]]:
        """
        Process embeddings with GPU if available for optimized operations.
        
        Args:
            embeddings: List of embedding vectors
            
        Returns:
            Processed list of embedding vectors
        """
        if self.device.type == "cpu" or not embeddings:
            return embeddings
        
        try:
            # Convert to PyTorch tensor and transfer to GPU
            emb_tensor = torch.tensor(embeddings, device=self.device)
            
            # Normalize embeddings (for cosine similarity)
            norm = torch.linalg.norm(emb_tensor, dim=1, keepdim=True)
            normalized = emb_tensor / norm
            
            # Transfer back to CPU and convert to list
            return normalized.cpu().tolist()
        except Exception as e:
            logger.warning(f"GPU embedding optimization failed, falling back to CPU: {e}")
            return embeddings
    
    def add_image(self, image_data: Dict) -> str:
        """
        Add an image embedding and metadata to the vector store.
        
        Args:
            image_data: Dictionary containing image features, embeddings, and metadata
            
        Returns:
            ID of the added document
        """
        try:
            # Generate unique ID for the image
            doc_id = str(uuid.uuid4())
            
            # Extract embedding
            embedding = image_data.get("embedding")
            if not embedding:
                raise ValueError("Image data does not contain embedding")
            
            # Optimize embedding with GPU if available
            if self.device.type == "cuda":
                embedding = self._optimize_embeddings([embedding])[0]
            
            # Prepare metadata (excluding the embedding)
            metadata = {
                "filename": image_data.get("filename"),
                "description": image_data.get("description"),
                "width": image_data.get("metadata", {}).get("width"),
                "height": image_data.get("metadata", {}).get("height"),
                "format": image_data.get("metadata", {}).get("format")
            }
            
            # Add PDF source information if available
            if "pdf_source" in image_data.get("metadata", {}):
                metadata["pdf_source"] = image_data["metadata"]["pdf_source"]
                metadata["pdf_filename"] = image_data["metadata"].get("pdf_filename", "")
                metadata["extraction_path"] = image_data["metadata"].get("extraction_path", "")
                if "page_number" in image_data["metadata"]:
                    metadata["page_number"] = image_data["metadata"]["page_number"]
            
            # Add to collection
            self.collection.add(
                ids=[doc_id],
                embeddings=[embedding],
                metadatas=[metadata],
                documents=[image_data.get("description", "")]
            )
            
            logger.info(f"Added image {image_data.get('filename')} to vector store with ID {doc_id}")
            return doc_id
        
        except Exception as e:
            logger.error(f"Error adding image to vector store: {e}")
            raise
    
    def add_images(self, images_data: List[Dict]) -> List[str]:
        """
        Add multiple images to the vector store with GPU acceleration when possible.
        
        Args:
            images_data: List of dictionaries containing image features and embeddings
            
        Returns:
            List of IDs for the added documents
        """
        ids = []
        doc_ids = []
        embeddings = []
        metadatas = []
        documents = []
        
        # Prepare data for batch adding
        for image_data in images_data:
            try:
                # Generate unique ID for the image
                doc_id = str(uuid.uuid4())
                doc_ids.append(doc_id)
                
                # Extract embedding
                embedding = image_data.get("embedding")
                if not embedding:
                    logger.warning(f"Image {image_data.get('filename')} has no embedding, skipping")
                    continue
                
                embeddings.append(embedding)
                
                # Prepare metadata (excluding the embedding)
                metadata = {
                    "filename": image_data.get("filename"),
                    "description": image_data.get("description"),
                    "width": image_data.get("metadata", {}).get("width"),
                    "height": image_data.get("metadata", {}).get("height"),
                    "format": image_data.get("metadata", {}).get("format")
                }
                
                # Add PDF source information if available
                if "pdf_source" in image_data.get("metadata", {}):
                    metadata["pdf_source"] = image_data["metadata"]["pdf_source"]
                    metadata["pdf_filename"] = image_data["metadata"].get("pdf_filename", "")
                    metadata["extraction_path"] = image_data["metadata"].get("extraction_path", "")
                    if "page_number" in image_data["metadata"]:
                        metadata["page_number"] = image_data["metadata"]["page_number"]
                
                metadatas.append(metadata)
                documents.append(image_data.get("description", ""))
                ids.append(doc_id)
            
            except Exception as e:
                logger.error(f"Error preparing image for vector store: {e}")
        
        if ids:
            # Optimize embeddings with GPU if available
            if self.device.type == "cuda":
                embeddings = self._optimize_embeddings(embeddings)
            
            # Batch add to collection
            self.collection.add(
                ids=doc_ids,
                embeddings=embeddings,
                metadatas=metadatas,
                documents=documents
            )
            
            logger.info(f"Added {len(ids)} images to vector store")
        
        return ids
    
    def search_similar(self, embedding: List[float], limit: int = 5) -> List[Dict]:
        """
        Search for similar images by embedding with GPU acceleration when possible.
        
        Args:
            embedding: Embedding vector to search for
            limit: Maximum number of results to return
            
        Returns:
            List of dictionaries containing search results
        """
        try:
            # Optimize query embedding with GPU if available
            if self.device.type == "cuda":
                embedding = self._optimize_embeddings([embedding])[0]
            
            results = self.collection.query(
                query_embeddings=[embedding],
                n_results=limit,
                include=["metadatas", "documents", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    formatted_results.append({
                        "id": doc_id,
                        "metadata": results["metadatas"][0][i],
                        "description": results["documents"][0][i],
                        "similarity": 1 - results["distances"][0][i]  # Convert distance to similarity
                    })
            
            return formatted_results
        
        except Exception as e:
            logger.error(f"Error searching vector store: {e}")
            return []
    
    def search_by_text(self, query_text: str, limit: int = 5) -> List[Dict]:
        """
        Search for images by text query.
        First converts the text to an embedding, then searches for similar embeddings.
        
        Args:
            query_text: Text query to search for
            limit: Maximum number of results to return
            
        Returns:
            List of dictionaries containing search results
        """
        try:
            # Use collection's built-in query by text
            results = self.collection.query(
                query_texts=[query_text],
                n_results=limit,
                include=["metadatas", "documents", "distances"]
            )
            
            # Format results
            formatted_results = []
            if results["ids"] and results["ids"][0]:
                for i, doc_id in enumerate(results["ids"][0]):
                    formatted_results.append({
                        "id": doc_id,
                        "metadata": results["metadatas"][0][i],
                        "description": results["documents"][0][i],
                        "similarity": 1 - results["distances"][0][i]  # Convert distance to similarity
                    })
            
            return formatted_results
        
        except Exception as e:
            logger.error(f"Error searching vector store by text: {e}")
            return []
    
    def get_by_id(self, doc_id: str) -> Optional[Dict]:
        """
        Get an image by its ID.
        
        Args:
            doc_id: ID of the document to retrieve
            
        Returns:
            Dictionary containing image data or None if not found
        """
        try:
            result = self.collection.get(
                ids=[doc_id],
                include=["metadatas", "documents"]
            )
            
            if result["ids"] and result["ids"][0]:
                return {
                    "id": result["ids"][0],
                    "metadata": result["metadatas"][0],
                    "description": result["documents"][0]
                }
            
            return None
        
        except Exception as e:
            logger.error(f"Error getting image by ID {doc_id}: {e}")
            return None
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """
        Get all images in the vector store.
        
        Args:
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of dictionaries containing image data
        """
        try:
            # Get all IDs in the collection
            all_ids = self.collection.get()["ids"]
            
            # Apply pagination
            paginated_ids = all_ids[offset:offset + limit]
            
            # Get data for paginated IDs
            if not paginated_ids:
                return []
            
            result = self.collection.get(
                ids=paginated_ids,
                include=["metadatas", "documents"]
            )
            
            # Format results
            formatted_results = []
            for i, doc_id in enumerate(result["ids"]):
                formatted_results.append({
                    "id": doc_id,
                    "metadata": result["metadatas"][i],
                    "description": result["documents"][i]
                })
            
            return formatted_results
        
        except Exception as e:
            logger.error(f"Error getting all images: {e}")
            return []
    
    def delete(self, doc_id: str) -> bool:
        """
        Delete an image from the vector store.
        
        Args:
            doc_id: ID of the document to delete
            
        Returns:
            True if deletion was successful, False otherwise
        """
        try:
            self.collection.delete(ids=[doc_id])
            logger.info(f"Deleted image with ID {doc_id} from vector store")
            return True
        
        except Exception as e:
            logger.error(f"Error deleting image with ID {doc_id}: {e}")
            return False
    
    def count(self) -> int:
        """
        Get the number of images in the vector store.
        
        Returns:
            Number of images in the vector store
        """
        try:
            count = self.collection.count()
            return count
        
        except Exception as e:
            logger.error(f"Error counting images in vector store: {e}")
            return 0
    
    def reset(self) -> bool:
        """
        Reset the vector store by deleting and recreating the collection.
        
        Returns:
            True if reset was successful, False otherwise
        """
        try:
            collection_name = self.collection.name
            self.client.delete_collection(collection_name)
            logger.info(f"Deleted collection: {collection_name}")
            
            self.collection = self.client.create_collection(
                name=collection_name,
                metadata={"hnsw:space": "cosine"}
            )
            logger.info(f"Created new collection: {collection_name}")
            
            return True
        
        except Exception as e:
            logger.error(f"Error resetting vector store: {e}")
            return False