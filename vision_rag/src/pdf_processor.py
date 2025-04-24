"""
GPU-accelerated PDF processor for the vision-based RAG system.
Extracts images from PDF files, organizes them in structured folders, and processes them.
"""

import os
import tempfile
from pathlib import Path
import uuid
import shutil
import time
from typing import Dict, List, Optional, Union, Tuple
import torch
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed

import fitz  # PyMuPDF
from PIL import Image
import io

from utils.logger import logger
from config.settings import IMAGE_DIRECTORY
from src.image_processor import ImageProcessor


class PDFProcessor:
    """
    Process PDF files for the vision-based RAG system with GPU acceleration.
    Extract images, process them, and generate embeddings.
    Organizes extracted images in a structured folder hierarchy.
    """
    
    def __init__(self, image_processor: Optional[ImageProcessor] = None):
        """
        Initialize the PDFProcessor with an ImageProcessor.
        
        Args:
            image_processor: ImageProcessor instance for processing extracted images
        """
        self.image_processor = image_processor or ImageProcessor()
        self.temp_dir = tempfile.mkdtemp()
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        
        # Create the base extracted images directory
        self.extracted_images_dir = os.path.join(IMAGE_DIRECTORY, "extracted_pdf_images")
        os.makedirs(self.extracted_images_dir, exist_ok=True)
        
        # Create a lock for thread-safe directory creation
        self.dir_lock = threading.Lock()
        
        logger.info(f"PDFProcessor initialized on device: {self.device}")
    
    def __del__(self):
        """Clean up temporary directory when object is destroyed."""
        try:
            shutil.rmtree(self.temp_dir)
        except Exception as e:
            logger.error(f"Error cleaning up temporary directory: {e}")
    
    def _sanitize_filename(self, filename: str) -> str:
        """
        Create a safe directory/file name from potentially problematic strings.
        
        Args:
            filename: Original filename that may contain invalid characters
            
        Returns:
            Sanitized filename safe for filesystem use
        """
        # Replace illegal characters with underscores
        illegal_chars = ['/', '\\', ':', '*', '?', '"', '<', '>', '|']
        for char in illegal_chars:
            filename = filename.replace(char, '_')
        
        # Limit length
        if len(filename) > 100:
            # Keep extension if present
            parts = filename.rsplit('.', 1)
            if len(parts) > 1:
                filename = f"{parts[0][:96]}_...{parts[1]}"
            else:
                filename = f"{filename[:96]}_..."
        
        return filename
    
    def _create_pdf_directory_structure(self, pdf_path: Union[str, Path]) -> Path:
        """
        Create a structured directory for extracted images from a PDF.
        
        Args:
            pdf_path: Path to the PDF file
            
        Returns:
            Path to the created directory structure
        """
        pdf_path = Path(pdf_path)
        pdf_name = self._sanitize_filename(pdf_path.stem)
        
        # Create a timestamped subfolder to prevent collisions
        timestamp = time.strftime("%Y%m%d_%H%M%S")
        
        # Acquire lock for thread-safe directory creation
        with self.dir_lock:
            # Create a directory structure: extracted_pdf_images/pdf_name/timestamp/
            pdf_extract_dir = Path(self.extracted_images_dir) / pdf_name / timestamp
            os.makedirs(pdf_extract_dir, exist_ok=True)
            
            # Create subdirectories for each page as needed (will be done when saving)
            
            return pdf_extract_dir
    
    def extract_images_from_pdf(self, pdf_path: Union[str, Path], parallel: bool = True) -> List[Tuple[str, bytes, int]]:
        """
        Extract images from a PDF file with GPU acceleration when possible.
        
        Args:
            pdf_path: Path to the PDF file
            parallel: If True, extract images in parallel
            
        Returns:
            List of tuples (filename, image_bytes, page_number)
        """
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            logger.error(f"PDF file does not exist: {pdf_path}")
            return []
        
        try:
            logger.info(f"Extracting images from PDF: {pdf_path}")
            
            # Open the PDF file
            pdf_document = fitz.open(pdf_path)
            extracted_images = []
            
            if parallel and len(pdf_document) > 1:
                # Parallel extraction for multi-page PDFs
                with ThreadPoolExecutor(max_workers=min(os.cpu_count(), 8)) as executor:
                    futures = []
                    
                    for page_num in range(len(pdf_document)):
                        future = executor.submit(
                            self._extract_images_from_page, 
                            pdf_document, 
                            page_num, 
                            pdf_path.stem
                        )
                        futures.append(future)
                    
                    for future in as_completed(futures):
                        result = future.result()
                        if result:
                            extracted_images.extend(result)
            else:
                # Sequential extraction for single-page PDFs or when parallel=False
                for page_num in range(len(pdf_document)):
                    page_images = self._extract_images_from_page(pdf_document, page_num, pdf_path.stem)
                    extracted_images.extend(page_images)
            
            pdf_document.close()
            
            logger.info(f"Extracted {len(extracted_images)} images from PDF: {pdf_path}")
            return extracted_images
        
        except Exception as e:
            logger.error(f"Error extracting images from PDF {pdf_path}: {e}")
            return []
    
    def _extract_images_from_page(self, pdf_document, page_num: int, pdf_stem: str) -> List[Tuple[str, bytes, int]]:
        """
        Extract images from a single PDF page.
        
        Args:
            pdf_document: Open PDF document
            page_num: Page number to extract images from
            pdf_stem: Base name of the PDF file
            
        Returns:
            List of tuples with (filename, image_bytes, page_number)
        """
        try:
            page = pdf_document[page_num]
            image_list = page.get_images(full=True)
            extracted_images = []
            
            for img_index, img_info in enumerate(image_list):
                try:
                    xref = img_info[0]
                    base_image = pdf_document.extract_image(xref)
                    
                    if base_image:
                        image_bytes = base_image["image"]
                        image_ext = base_image["ext"].lower()
                        
                        # Ensure valid extension
                        if image_ext not in ['jpeg', 'jpg', 'png', 'webp']:
                            image_ext = 'jpeg'  # Default to jpeg for unknown formats
                        
                        # Generate a filename for the image
                        filename = f"{pdf_stem}_page{page_num + 1}_img{img_index + 1}.{image_ext}"
                        
                        # Add to list of extracted images
                        extracted_images.append((filename, image_bytes, page_num + 1))
                except Exception as img_error:
                    logger.warning(f"Error extracting image {img_index} from page {page_num + 1}: {img_error}")
            
            return extracted_images
        
        except Exception as e:
            logger.error(f"Error processing page {page_num + 1}: {e}")
            return []
    
    def save_extracted_images(self, 
                             images: List[Tuple[str, bytes, int]],
                             pdf_extract_dir: Union[str, Path]) -> List[Path]:
        """
        Save extracted images to organized folder structure using GPU acceleration.
        Creates subdirectories for each page.
        
        Args:
            images: List of tuples (filename, image_bytes, page_number)
            pdf_extract_dir: Base directory for extracted images from this PDF
            
        Returns:
            List of paths to saved images
        """
        pdf_extract_dir = Path(pdf_extract_dir)
        saved_paths = []
        
        # Group images by page number
        images_by_page = {}
        for filename, image_bytes, page_num in images:
            if page_num not in images_by_page:
                images_by_page[page_num] = []
            images_by_page[page_num].append((filename, image_bytes))
        
        # Process each page
        for page_num, page_images in images_by_page.items():
            # Create page directory
            page_dir = pdf_extract_dir / f"page_{page_num}"
            os.makedirs(page_dir, exist_ok=True)
            
            # Save all images for this page
            for filename, image_bytes in page_images:
                try:
                    # Create output path
                    output_path = page_dir / filename
                    
                    # Verify the image data is valid before saving
                    try:
                        # Try to open the image from bytes to validate it
                        img = Image.open(io.BytesIO(image_bytes))
                        img.verify()  # Verify that it's a valid image
                        
                        # Determine the correct format
                        format_name = img.format
                        if not format_name:
                            # Try to get format from filename extension
                            ext = Path(filename).suffix.lower()
                            if ext in ['.jpg', '.jpeg']:
                                format_name = 'JPEG'
                            elif ext == '.png':
                                format_name = 'PNG'
                            else:
                                format_name = 'JPEG'  # Default
                        
                        # Reset after verify
                        img = Image.open(io.BytesIO(image_bytes))
                        
                        # Convert to RGB if needed
                        if img.mode != "RGB":
                            img = img.convert("RGB")
                        
                        # Save with explicit format
                        img.save(output_path, format=format_name)
                        
                    except Exception as img_error:
                        logger.warning(f"Image validation failed, attempting direct save: {img_error}")
                        # Save the raw bytes as a fallback
                        with open(output_path, "wb") as f:
                            f.write(image_bytes)
                    
                    saved_paths.append(output_path)
                
                except Exception as e:
                    logger.error(f"Error saving extracted image {filename}: {e}")
        
        logger.info(f"Saved {len(saved_paths)} extracted images to {pdf_extract_dir}")
        return saved_paths
    
    def process_pdf(self, pdf_path: Union[str, Path], save_images: bool = True) -> List[Dict]:
        """
        Process a PDF file with enhanced error handling: extract images, organize them in folders, 
        process them, and generate embeddings.
        
        Args:
            pdf_path: Path to the PDF file
            save_images: If True, save extracted images to structured folders
            
        Returns:
            List of dictionaries with processed image data
        """
        pdf_path = Path(pdf_path)
        
        if not pdf_path.exists():
            logger.error(f"PDF file does not exist: {pdf_path}")
            return []
        
        try:
            # Create directory structure for extracted images
            pdf_extract_dir = self._create_pdf_directory_structure(pdf_path)
            
            # Extract images from PDF with page numbers
            extracted_images = self.extract_images_from_pdf(pdf_path)
            
            if not extracted_images:
                logger.warning(f"No images found in PDF: {pdf_path}")
                return []
            
            # Save extracted images to structured folders
            image_paths = self.save_extracted_images(extracted_images, pdf_extract_dir)
            
            if not image_paths:
                logger.warning(f"Failed to save any images from PDF: {pdf_path}")
                return []
                
            # Process each image with error handling
            results = []
            processing_errors = 0
            
            for image_path in image_paths:
                try:
                    # Process the image
                    result = self._process_single_extracted_image(image_path, pdf_path, pdf_extract_dir)
                    if result:
                        results.append(result)
                except Exception as e:
                    processing_errors += 1
                    logger.error(f"Error processing extracted image {image_path}: {e}")
                    # Continue processing other images despite errors
                    continue
            
            if processing_errors > 0:
                logger.warning(f"Encountered errors processing {processing_errors} of {len(image_paths)} images from PDF: {pdf_path}")
            
            logger.info(f"Processed {len(results)} images from PDF: {pdf_path}")
            return results
        
        except Exception as e:
            logger.error(f"Error processing PDF {pdf_path}: {e}")
            # Return any results we have so far instead of an empty list
            return []
    
    def _process_single_extracted_image(self, 
                                      image_path: Path, 
                                      pdf_path: Path,
                                      pdf_extract_dir: Path) -> Optional[Dict]:
        """
        Process a single extracted image from a PDF.
        
        Args:
            image_path: Path to the extracted image
            pdf_path: Path to the source PDF
            pdf_extract_dir: Directory where extracted images are stored
            
        Returns:
            Dictionary with processed image data or None if processing fails
        """
        try:
            # Process the image
            image_data = self.image_processor.process_single_image(image_path)
            
            if image_data:
                # Add PDF metadata and storage location
                image_data["metadata"]["pdf_source"] = str(pdf_path)
                image_data["metadata"]["pdf_filename"] = pdf_path.name
                image_data["metadata"]["extraction_path"] = str(image_path)
                
                # Extract page number from path (for better organization in results)
                # Format: pdf_extract_dir/page_X/filename.ext
                page_dir = image_path.parent
                if page_dir.name.startswith("page_"):
                    try:
                        page_num = int(page_dir.name.split("_")[1])
                        image_data["metadata"]["page_number"] = page_num
                    except:
                        pass
                
                return image_data
            
            return None
        
        except Exception as e:
            logger.error(f"Error processing extracted image {image_path}: {e}")
            return None