from typing import Dict, List, Optional, Union, Any
import json

from openai import AzureOpenAI

from utils.logger import logger
from config.settings import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,
)
from src.vector_store import VectorStore
from src.image_processor import ImageProcessor


class Retriever:
    """
    Retriever for finding relevant images based on text queries or image similarity.
    """
    
    def __init__(self, vector_store: Optional[VectorStore] = None, 
                 image_processor: Optional[ImageProcessor] = None):
        """
        Initialize the Retriever with vector store and image processor.
        
        Args:
            vector_store: Vector store instance for retrieving images
            image_processor: Image processor for handling image queries
        """
        self.vector_store = vector_store or VectorStore()
        self.image_processor = image_processor or ImageProcessor()
        
        # Initialize OpenAI client for embeddings
        self.openai_client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )
        
        logger.info("Retriever initialized")
    
    def get_text_embedding(self, text: str) -> List[float]:
        """
        Get embedding for text query using Azure OpenAI.
        
        Args:
            text: Text to get embedding for
            
        Returns:
            Embedding vector for the text
        """
        try:
            response = self.openai_client.embeddings.create(
                model="text-embedding-ada-002",  # Use appropriate embedding model
                input=text
            )
            
            return response.data[0].embedding
        
        except Exception as e:
            logger.error(f"Error getting embedding for text: {e}")
            raise
    
    def retrieve_by_text(self, query: str, limit: int = 5) -> List[Dict]:
        """
        Retrieve relevant images based on text query.
        
        Args:
            query: Text query to search for
            limit: Maximum number of results to return
            
        Returns:
            List of dictionaries containing search results
        """
        try:
            # Get embedding for query
            embedding = self.get_text_embedding(query)
            
            # Search vector store
            results = self.vector_store.search_similar(embedding, limit=limit)
            
            logger.info(f"Retrieved {len(results)} results for query: {query}")
            return results
        
        except Exception as e:
            logger.error(f"Error retrieving by text: {e}")
            return []
    
    def retrieve_by_image(self, image_path: str, limit: int = 5) -> List[Dict]:
        """
        Retrieve relevant images based on image similarity.
        
        Args:
            image_path: Path to the image to search for
            limit: Maximum number of results to return
            
        Returns:
            List of dictionaries containing search results
        """
        try:
            # Process the query image
            image_data = self.image_processor.process_single_image(image_path)
            if not image_data:
                logger.error(f"Error processing query image: {image_path}")
                return []
            
            # Get embedding for the image
            embedding = image_data.get("embedding")
            if not embedding:
                logger.error(f"No embedding found for query image: {image_path}")
                return []
            
            # Search vector store
            results = self.vector_store.search_similar(embedding, limit=limit)
            
            logger.info(f"Retrieved {len(results)} results for image query: {image_path}")
            return results
        
        except Exception as e:
            logger.error(f"Error retrieving by image: {e}")
            return []
    
    def retrieve_by_image_file(self, file_data: bytes, filename: str, limit: int = 5) -> List[Dict]:
        """
        Retrieve relevant images based on uploaded image file.
        
        Args:
            file_data: Binary image data
            filename: Name of the file
            limit: Maximum number of results to return
            
        Returns:
            List of dictionaries containing search results
        """
        try:
            # Process the uploaded image
            image_data = self.image_processor.process_image_file(file_data, filename)
            if not image_data:
                logger.error(f"Error processing uploaded image: {filename}")
                return []
            
            # Get embedding for the image
            embedding = image_data.get("embedding")
            if not embedding:
                logger.error(f"No embedding found for uploaded image: {filename}")
                return []
            
            # Search vector store
            results = self.vector_store.search_similar(embedding, limit=limit)
            
            logger.info(f"Retrieved {len(results)} results for uploaded image: {filename}")
            return results
        
        except Exception as e:
            logger.error(f"Error retrieving by uploaded image: {e}")
            return []
    
    def format_context(self, retrieval_results: List[Dict]) -> str:
        """
        Format retrieval results into a context string for generation.
        
        Args:
            retrieval_results: List of dictionaries containing retrieval results
            
        Returns:
            Formatted context string
        """
        if not retrieval_results:
            return "No relevant images found."
        
        context_parts = ["Here are the most relevant images from the database:"]
        
        for i, result in enumerate(retrieval_results, 1):
            # Extract metadata
            filename = result.get("metadata", {}).get("filename", "Unknown filename")
            description = result.get("description", "No description available")
            similarity = result.get("similarity", 0.0)
            
            # Check if it's from a PDF
            pdf_source = result.get("metadata", {}).get("pdf_source", "")
            pdf_filename = result.get("metadata", {}).get("pdf_filename", "")
            page_num = result.get("metadata", {}).get("page_num", "")
            page_text = result.get("metadata", {}).get("page_text", "")
            
            # Format the result
            context_parts.append(f"\n{i}. Image: {filename} (Similarity: {similarity:.2f})")
            
            if pdf_source:
                context_parts.append(f"   Source: PDF document '{pdf_filename}'")
                if page_num:
                    context_parts.append(f"   Page: {page_num}")
            
            context_parts.append(f"   Description: {description}")
            
            # Include page text if available (truncated)
            if page_text:
                truncated_text = page_text[:500] + "..." if len(page_text) > 500 else page_text
                context_parts.append(f"   Page text: {truncated_text}\n")
            else:
                context_parts.append("")  # Empty line for spacing
        
        return "\n".join(context_parts)
    
    def get_by_id(self, doc_id: str) -> Optional[Dict]:
        """
        Get an image by its ID.
        
        Args:
            doc_id: ID of the document to retrieve
            
        Returns:
            Dictionary containing image data or None if not found
        """
        return self.vector_store.get_by_id(doc_id)
    
    def get_all(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """
        Get all images in the vector store.
        
        Args:
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of dictionaries containing image data
        """
        return self.vector_store.get_all(limit=limit, offset=offset)