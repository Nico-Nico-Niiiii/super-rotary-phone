import os
import base64
from typing import Dict, List, Optional, Union, Tuple, Any
from pathlib import Path

from utils.logger import logger
from src.image_processor import ImageProcessor
from src.pdf_processor import PDFProcessor
from src.vector_store import VectorStore
from src.retriever import Retriever
from src.generator import Generator


class VisionRAGPipeline:
    """
    End-to-end pipeline for vision-based RAG system.
    """
    
    def __init__(self):
        """Initialize the pipeline with all components."""
        self.image_processor = ImageProcessor()
        self.pdf_processor = PDFProcessor(image_processor=self.image_processor)
        self.vector_store = VectorStore()
        self.retriever = Retriever(vector_store=self.vector_store, image_processor=self.image_processor)
        self.generator = Generator()
        
        logger.info("Vision RAG pipeline initialized")
    
    def index_images(self, directory: Union[str, Path]) -> int:
        """
        Process and index images from a directory.
        
        Args:
            directory: Path to directory containing images
            
        Returns:
            Number of images successfully indexed
        """
        try:
            # Process images
            images_data = self.image_processor.process_directory(directory)
            
            # Add to vector store
            if images_data:
                ids = self.vector_store.add_images(images_data)
                return len(ids)
            
            return 0
        
        except Exception as e:
            logger.error(f"Error indexing images: {e}")
            return 0
    
    def index_single_image(self, image_path: Union[str, Path]) -> Optional[str]:
        """
        Process and index a single image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            ID of the indexed image or None if indexing failed
        """
        try:
            # Process image
            image_data = self.image_processor.process_single_image(image_path)
            
            # Add to vector store
            if image_data:
                doc_id = self.vector_store.add_image(image_data)
                return doc_id
            
            return None
        
        except Exception as e:
            logger.error(f"Error indexing single image: {e}")
            return None
    
    def index_pdf(self, pdf_path: Union[str, Path], save_images: bool = True) -> List[str]:
        """
        Process and index a PDF file.
        
        Args:
            pdf_path: Path to the PDF file
            save_images: If True, save extracted images to IMAGE_DIRECTORY
            
        Returns:
            List of IDs for the indexed images
        """
        try:
            # Process PDF
            pdf_path = Path(pdf_path)
            logger.info(f"Indexing PDF: {pdf_path}")
            
            # Check if PDF exists
            if not pdf_path.exists():
                logger.error(f"PDF file does not exist: {pdf_path}")
                return []
            
            # Extract and process images from PDF
            processed_images = self.pdf_processor.process_pdf(pdf_path, save_images=save_images)
            
            if not processed_images:
                logger.warning(f"No images were extracted and processed from PDF: {pdf_path}")
                return []
            
            # Add to vector store - ensuring processed_images is a list
            if isinstance(processed_images, list):
                ids = self.vector_store.add_images(processed_images)
                logger.info(f"Indexed {len(ids)} images from PDF: {pdf_path}")
                return ids
            else:
                # Handle case where processed_images is not a list
                logger.error(f"Expected list of processed images, got {type(processed_images)}")
                return []
            
        except Exception as e:
            logger.error(f"Error indexing PDF {pdf_path}: {e}")
            return []
    def query_by_text(self, query: str, limit: int = 5) -> Dict:
        """
        Query the system with text and generate a response.
        
        Args:
            query: Text query
            limit: Maximum number of results to retrieve
            
        Returns:
            Dictionary containing the response and retrieval results
        """
        try:
            # Retrieve relevant images
            retrieval_results = self.retriever.retrieve_by_text(query, limit=limit)
            
            # Format context
            context = self.retriever.format_context(retrieval_results)
            
            # Generate response
            response_text = self.generator.generate_response(query, context)
            
            return {
                "response": response_text,
                "retrieved_images": retrieval_results
            }
        
        except Exception as e:
            logger.error(f"Error in text query pipeline: {e}")
            return {
                "response": f"I encountered an error processing your query. Please try again. Error: {str(e)}",
                "retrieved_images": []
            }
    
    def query_with_image(self, query: str, image_path: Union[str, Path], limit: int = 5) -> Dict:
        """
        Query the system with text and an image, then generate a response.
        
        Args:
            query: Text query
            image_path: Path to the image file
            limit: Maximum number of results to retrieve
            
        Returns:
            Dictionary containing the response and retrieval results
        """
        try:
            # Process the query image
            image_data = self.image_processor.process_single_image(image_path)
            if not image_data:
                raise ValueError(f"Failed to process image: {image_path}")
            
            # Retrieve similar images
            retrieval_results = self.retriever.retrieve_by_image(image_path, limit=limit)
            
            # Format context
            context = self.retriever.format_context(retrieval_results)
            
            # Generate response with image
            response_text = self.generator.generate_with_image(query, context, image_data["base64"])
            
            return {
                "response": response_text,
                "retrieved_images": retrieval_results,
                "query_image": {
                    "filename": image_data.get("filename"),
                    "description": image_data.get("description")
                }
            }
        
        except Exception as e:
            logger.error(f"Error in image query pipeline: {e}")
            return {
                "response": f"I encountered an error processing your query with image. Please try again. Error: {str(e)}",
                "retrieved_images": [],
                "query_image": None
            }
    
    def query_with_uploaded_image(self, query: str, file_data: bytes, 
                                 filename: str, limit: int = 5) -> Dict:
        """
        Query the system with text and an uploaded image, then generate a response.
        
        Args:
            query: Text query
            file_data: Binary image data
            filename: Name of the file
            limit: Maximum number of results to retrieve
            
        Returns:
            Dictionary containing the response and retrieval results
        """
        try:
            # Process the uploaded image
            image_data = self.image_processor.process_image_file(file_data, filename)
            if not image_data:
                raise ValueError(f"Failed to process uploaded image: {filename}")
            
            # Retrieve similar images
            retrieval_results = self.retriever.retrieve_by_image_file(file_data, filename, limit=limit)
            
            # Format context
            context = self.retriever.format_context(retrieval_results)
            
            # Generate response with image
            response_text = self.generator.generate_with_image(query, context, image_data["base64"])
            
            return {
                "response": response_text,
                "retrieved_images": retrieval_results,
                "query_image": {
                    "filename": image_data.get("filename"),
                    "description": image_data.get("description")
                }
            }
        
        except Exception as e:
            logger.error(f"Error in uploaded image query pipeline: {e}")
            return {
                "response": f"I encountered an error processing your query with uploaded image. Please try again. Error: {str(e)}",
                "retrieved_images": [],
                "query_image": None
            }
    
    def get_all_images(self, limit: int = 100, offset: int = 0) -> List[Dict]:
        """
        Get all images in the system.
        
        Args:
            limit: Maximum number of results to return
            offset: Number of results to skip
            
        Returns:
            List of dictionaries containing image data
        """
        return self.retriever.get_all(limit=limit, offset=offset)
    
    def get_image_by_id(self, doc_id: str) -> Optional[Dict]:
        """
        Get an image by its ID.
        
        Args:
            doc_id: ID of the image to retrieve
            
        Returns:
            Dictionary containing image data or None if not found
        """
        return self.retriever.get_by_id(doc_id)
    
    def remove_image(self, doc_id: str) -> bool:
        """
        Remove an image from the system.
        
        Args:
            doc_id: ID of the image to remove
            
        Returns:
            True if removal was successful, False otherwise
        """
        return self.vector_store.delete(doc_id)
    
    def get_image_count(self) -> int:
        """
        Get the number of images in the system.
        
        Returns:
            Number of images in the system
        """
        return self.vector_store.count()
    
    def reset_system(self) -> bool:
        """
        Reset the entire system.
        
        Returns:
            True if reset was successful, False otherwise
        """
        return self.vector_store.reset()