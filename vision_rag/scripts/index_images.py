#!/usr/bin/env python3
"""
Script to index images from a directory into the vector database.
"""

import os
import sys
import argparse
import time
from pathlib import Path
from tqdm import tqdm

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


def index_directory(directory, batch_mode=False):
    """
    Index all images in a directory.
    
    Args:
        directory: Path to directory containing images
        batch_mode: If True, index images one by one with progress bar
    """
    # Initialize pipeline
    pipeline = VisionRAGPipeline()
    
    directory_path = Path(directory)
    
    if not directory_path.exists():
        logger.error(f"Directory does not exist: {directory}")
        return
    
    if not directory_path.is_dir():
        logger.error(f"Path is not a directory: {directory}")
        return
    
    # Get list of image files
    image_extensions = [".jpg", ".jpeg", ".png", ".webp"]
    image_files = [
        f for f in directory_path.iterdir()
        if f.is_file() and f.suffix.lower() in image_extensions
    ]
    
    if not image_files:
        logger.warning(f"No image files found in directory: {directory}")
        return
    
    logger.info(f"Found {len(image_files)} image files in {directory}")
    
    if batch_mode:
        # Index images one by one with progress bar
        successful = 0
        start_time = time.time()
        
        for image_file in tqdm(image_files, desc="Indexing images"):
            try:
                doc_id = pipeline.index_single_image(image_file)
                if doc_id:
                    successful += 1
            except Exception as e:
                logger.error(f"Error indexing image {image_file}: {e}")
        
        elapsed_time = time.time() - start_time
        logger.info(f"Successfully indexed {successful} out of {len(image_files)} images in {elapsed_time:.2f} seconds")
    else:
        # Index all images at once
        start_time = time.time()
        count = pipeline.index_images(directory)
        elapsed_time = time.time() - start_time
        
        logger.info(f"Successfully indexed {count} images in {elapsed_time:.2f} seconds")


def main():
    """Main function for indexing images."""
    parser = argparse.ArgumentParser(description="Index images from a directory into the vector database")
    
    parser.add_argument("directory", help="Directory containing images to index")
    parser.add_argument("--batch", "-b", action="store_true", help="Index images one by one with progress bar")
    
    args = parser.parse_args()
    
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Index directory
    index_directory(args.directory, batch_mode=args.batch)


if __name__ == "__main__":
    main()