#!/usr/bin/env python3
"""
Script to index a single image into the vector database.
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


def index_single_image(image_path, verbose=False):
    """
    Index a single image into the vector database.
    
    Args:
        image_path: Path to the image file
        verbose: If True, print detailed information about the image
    """
    # Initialize pipeline
    pipeline = VisionRAGPipeline()
    
    image_path = Path(image_path)
    
    if not image_path.exists():
        logger.error(f"Image file does not exist: {image_path}")
        return
    
    if not image_path.is_file():
        logger.error(f"Path is not a file: {image_path}")
        return
    
    # Check if it's an image file
    image_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    if image_path.suffix.lower() not in image_extensions:
        logger.warning(f"File may not be an image: {image_path}")
        proceed = input("Continue anyway? (y/n): ")
        if proceed.lower() != 'y':
            return
    
    # Index the image
    start_time = time.time()
    logger.info(f"Indexing image: {image_path}")
    
    try:
        # First process the image to get description
        image_processor = pipeline.image_processor
        image_data = image_processor.process_single_image(image_path)
        
        if not image_data:
            logger.error(f"Failed to process image: {image_path}")
            return
        
        # Add to vector store
        doc_id = pipeline.vector_store.add_image(image_data)
        
        elapsed_time = time.time() - start_time
        logger.info(f"Successfully indexed image in {elapsed_time:.2f} seconds")
        
        if verbose:
            print("\nIMAGE DETAILS:")
            print("-" * 80)
            print(f"File: {image_path.name}")
            print(f"ID: {doc_id}")
            print(f"Format: {image_data.get('metadata', {}).get('format')}")
            print(f"Size: {image_data.get('metadata', {}).get('width')}x{image_data.get('metadata', {}).get('height')}")
            print("\nDescription:")
            print(image_data.get('description', 'No description generated'))
            print("-" * 80)
        
        return doc_id
    
    except Exception as e:
        logger.error(f"Error indexing image {image_path}: {e}")
        return None


def main():
    """Main function for indexing a single image."""
    parser = argparse.ArgumentParser(description="Index a single image into the vector database")
    
    parser.add_argument("image_path", help="Path to the image file to index")
    parser.add_argument("--verbose", "-v", action="store_true", help="Print detailed information about the image")
    
    args = parser.parse_args()
    
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Index the image
    doc_id = index_single_image(args.image_path, verbose=args.verbose)
    
    if doc_id:
        print(f"\nImage successfully indexed with ID: {doc_id}")


if __name__ == "__main__":
    main()