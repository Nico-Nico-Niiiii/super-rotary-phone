#!/usr/bin/env python3
"""
Script to index a PDF file into the vector database.
"""

import os
import sys
import argparse
import time
from pathlib import Path

# Add project root to path
script_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.dirname(script_dir)
sys.path.append(project_root)

# Import components
from utils.logger import logger
from config.settings import IMAGE_DIRECTORY
from src.pipeline import VisionRAGPipeline


def setup_azure_openai():
    """Set up Azure OpenAI config in environment variables."""
    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
    ]
    
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        # Set values explicitly
        logger.info("Setting up Azure OpenAI configuration...")
        
        if "AZURE_OPENAI_API_KEY" not in os.environ:
            os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
        
        if "AZURE_OPENAI_ENDPOINT" not in os.environ:
            os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
        
        if "AZURE_OPENAI_API_VERSION" not in os.environ:
            os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
        
        if "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME" not in os.environ:
            os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"
    
    # Verify all variables are set
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        raise EnvironmentError(f"Missing Azure OpenAI configuration: {', '.join(missing)}")
    
    logger.info("Azure OpenAI configuration verified")
    return True


def index_pdf(pdf_path, save_images=False, verbose=False):
    """
    Index a PDF file into the vector database.
    
    Args:
        pdf_path: Path to the PDF file
        save_images: If True, save extracted images to the images directory
        verbose: If True, print detailed information about the extracted images
    """
    # Initialize pipeline
    pipeline = VisionRAGPipeline()
    
    pdf_path = Path(pdf_path)
    
    if not pdf_path.exists():
        logger.error(f"PDF file does not exist: {pdf_path}")
        return
    
    if not pdf_path.is_file():
        logger.error(f"Path is not a file: {pdf_path}")
        return
    
    # Check if it's a PDF file
    if pdf_path.suffix.lower() != ".pdf":
        logger.warning(f"File may not be a PDF: {pdf_path}")
        proceed = input("Continue anyway? (y/n): ")
        if proceed.lower() != 'y':
            return
    
    # Index the PDF
    start_time = time.time()
    logger.info(f"Indexing PDF: {pdf_path}")
    
    try:
        # First extract and process images from PDF
        image_ids = pipeline.index_pdf(pdf_path, save_images=save_images)
        
        elapsed_time = time.time() - start_time
        
        if not image_ids:
            logger.warning(f"No images were extracted and indexed from PDF: {pdf_path}")
            return
        
        logger.info(f"Successfully indexed {len(image_ids)} images from PDF in {elapsed_time:.2f} seconds")
        
        if verbose:
            print("\nPDF INDEXING DETAILS:")
            print("-" * 80)
            print(f"File: {pdf_path.name}")
            print(f"Images extracted and indexed: {len(image_ids)}")
            print(f"Processing time: {elapsed_time:.2f} seconds")
            
            if save_images:
                print(f"Extracted images saved to: {IMAGE_DIRECTORY}")
            
            print("\nImage IDs:")
            for i, img_id in enumerate(image_ids, 1):
                print(f"{i}. {img_id}")
            
            print("-" * 80)
        
        return image_ids
    
    except Exception as e:
        logger.error(f"Error indexing PDF {pdf_path}: {e}")
        return None


def index_multiple_pdfs(pdf_dir, save_images=False, verbose=False):
    """
    Index all PDF files in a directory.
    
    Args:
        pdf_dir: Directory containing PDF files
        save_images: If True, save extracted images to the images directory
        verbose: If True, print detailed information about the indexed PDFs
    """
    pdf_dir = Path(pdf_dir)
    
    if not pdf_dir.exists() or not pdf_dir.is_dir():
        logger.error(f"Directory does not exist or is not a directory: {pdf_dir}")
        return
    
    # Find all PDF files in the directory
    pdf_files = list(pdf_dir.glob("*.pdf"))
    
    if not pdf_files:
        logger.warning(f"No PDF files found in directory: {pdf_dir}")
        return
    
    logger.info(f"Found {len(pdf_files)} PDF files in directory: {pdf_dir}")
    
    # Index each PDF
    total_images = 0
    total_time = 0
    
    for pdf_file in pdf_files:
        try:
            start_time = time.time()
            logger.info(f"Indexing PDF: {pdf_file}")
            
            image_ids = index_pdf(pdf_file, save_images=save_images, verbose=False)
            
            elapsed_time = time.time() - start_time
            total_time += elapsed_time
            
            if image_ids:
                total_images += len(image_ids)
                
                if verbose:
                    print(f"Indexed {len(image_ids)} images from {pdf_file.name} in {elapsed_time:.2f} seconds")
        
        except Exception as e:
            logger.error(f"Error indexing PDF {pdf_file}: {e}")
    
    if verbose:
        print("\nINDEXING SUMMARY:")
        print("-" * 80)
        print(f"PDFs processed: {len(pdf_files)}")
        print(f"Total images indexed: {total_images}")
        print(f"Total processing time: {total_time:.2f} seconds")
        print("-" * 80)
    
    logger.info(f"Indexed {total_images} images from {len(pdf_files)} PDFs in {total_time:.2f} seconds")


def main():
    """Main function for indexing PDFs."""
    parser = argparse.ArgumentParser(description="Index PDF files into the vector database")
    
    parser.add_argument("path", help="Path to a PDF file or directory containing PDFs")
    parser.add_argument("--save-images", "-s", action="store_true", 
                        help="Save extracted images to the images directory")
    parser.add_argument("--verbose", "-v", action="store_true", 
                        help="Print detailed information")
    
    args = parser.parse_args()
    
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Check if path is a file or directory
    path = Path(args.path)
    
    if path.is_file():
        # Index a single PDF
        image_ids = index_pdf(path, save_images=args.save_images, verbose=args.verbose)
        
        if image_ids:
            print(f"\nSuccessfully indexed {len(image_ids)} images from PDF: {path}")
    
    elif path.is_dir():
        # Index all PDFs in the directory
        index_multiple_pdfs(path, save_images=args.save_images, verbose=args.verbose)
    
    else:
        logger.error(f"Path does not exist: {path}")


if __name__ == "__main__":
    main()