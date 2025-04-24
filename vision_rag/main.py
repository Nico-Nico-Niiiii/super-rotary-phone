#!/usr/bin/env python3
"""
Main script for vision-based RAG system.
Example usage of the pipeline for common operations.
"""

import os
import sys
import argparse
from pathlib import Path

# Add project root to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

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


def index_images(pipeline, directory):
    """
    Index all images in a directory.
    
    Args:
        pipeline: VisionRAGPipeline instance
        directory: Path to directory containing images
    """
    logger.info(f"Indexing images from directory: {directory}")
    count = pipeline.index_images(directory)
    logger.info(f"Successfully indexed {count} images")


def index_pdf(pipeline, pdf_path, save_images=False):
    """
    Index a PDF file.
    
    Args:
        pipeline: VisionRAGPipeline instance
        pdf_path: Path to the PDF file
        save_images: If True, save extracted images to the images directory
    """
    logger.info(f"Indexing PDF file: {pdf_path}")
    image_ids = pipeline.index_pdf(pdf_path, save_images=save_images)
    
    if image_ids:
        logger.info(f"Successfully indexed {len(image_ids)} images from PDF")
        print(f"Successfully indexed {len(image_ids)} images from PDF: {pdf_path}")
    else:
        logger.warning(f"No images were extracted and indexed from PDF: {pdf_path}")
        print(f"No images were extracted and indexed from PDF: {pdf_path}")


def query_by_text(pipeline, query, limit=5):
    """
    Query the system with text.
    
    Args:
        pipeline: VisionRAGPipeline instance
        query: Text query
        limit: Maximum number of results to return
    """
    logger.info(f"Querying with text: {query}")
    result = pipeline.query_by_text(query, limit=limit)
    
    # Print response
    print("\n" + "="*80)
    print(f"QUERY: {query}")
    print("="*80)
    print("\nRESPONSE:")
    print("-"*80)
    print(result["response"])
    print("-"*80)
    
    # Print retrieved images
    print("\nRETRIEVED IMAGES:")
    for i, image in enumerate(result["retrieved_images"], 1):
        print(f"{i}. {image['metadata'].get('filename', 'Unknown')} (Similarity: {image['similarity']:.2f})")
        print(f"   Description: {image['description'][:100]}..." if len(image['description']) > 100 else f"   Description: {image['description']}")
        
        # If the image is from a PDF, show source
        if "pdf_source" in image["metadata"]:
            pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
            print(f"   Source: PDF document '{pdf_name}'")
        
        print()
    
    print("\n")


def query_by_image(pipeline, image_path, query, limit=5):
    """
    Query the system with an image and text.
    
    Args:
        pipeline: VisionRAGPipeline instance
        image_path: Path to image file
        query: Text query
        limit: Maximum number of results to return
    """
    logger.info(f"Querying with image: {image_path} and text: {query}")
    result = pipeline.query_with_image(query, image_path, limit=limit)
    
    # Print response
    print("\n" + "="*80)
    print(f"QUERY: {query}")
    print(f"IMAGE: {image_path}")
    print("="*80)
    print("\nRESPONSE:")
    print("-"*80)
    print(result["response"])
    print("-"*80)
    
    # Print retrieved images
    print("\nRETRIEVED IMAGES:")
    for i, image in enumerate(result["retrieved_images"], 1):
        print(f"{i}. {image['metadata'].get('filename', 'Unknown')} (Similarity: {image['similarity']:.2f})")
        print(f"   Description: {image['description'][:100]}..." if len(image['description']) > 100 else f"   Description: {image['description']}")
        
        # If the image is from a PDF, show source
        if "pdf_source" in image["metadata"]:
            pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
            print(f"   Source: PDF document '{pdf_name}'")
        
        print()
    
    print("\n")


def show_stats(pipeline):
    """
    Show system statistics.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    image_count = pipeline.get_image_count()
    print("\nSYSTEM STATISTICS:")
    print("-"*80)
    print(f"Total images indexed: {image_count}")
    print(f"Storage directory: {IMAGE_DIRECTORY}")
    print("-"*80)
    print("\n")


def main():
    """Main function to demonstrate pipeline usage."""
    parser = argparse.ArgumentParser(description="Vision-based RAG System")
    
    # Command options
    parser.add_argument("--index", "-i", help="Index images from directory", metavar="DIRECTORY")
    parser.add_argument("--index-pdf", "-p", help="Index images from PDF file", metavar="PDF_PATH")
    parser.add_argument("--save-images", "-s", action="store_true", 
                        help="Save extracted images from PDFs to the images directory")
    parser.add_argument("--text-query", "-t", help="Query with text", metavar="QUERY")
    parser.add_argument("--image-query", "-img", help="Path to image for image query", metavar="IMAGE_PATH")
    parser.add_argument("--query", "-q", help="Text query to use with image query", metavar="QUERY")
    parser.add_argument("--limit", "-l", type=int, default=5, help="Maximum number of results to return")
    parser.add_argument("--stats", action="store_true", help="Show system statistics")
    parser.add_argument("--reset", "-r", action="store_true", help="Reset the entire system")
    
    args = parser.parse_args()
    
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Initialize pipeline
    pipeline = VisionRAGPipeline()
    
    # Process commands
    if args.reset:
        logger.info("Resetting the system...")
        pipeline.reset_system()
        logger.info("System reset complete")
    
    if args.index:
        index_images(pipeline, args.index)
    
    if args.index_pdf:
        index_pdf(pipeline, args.index_pdf, save_images=args.save_images)
    
    if args.text_query:
        query_by_text(pipeline, args.text_query, limit=args.limit)
    
    if args.image_query:
        if args.query:
            query_by_image(pipeline, args.image_query, args.query, limit=args.limit)
        else:
            logger.error("Please provide a text query with --query when using --image-query")
    
    if args.stats or (not any([args.index, args.index_pdf, args.text_query, args.image_query, args.reset])):
        show_stats(pipeline)


if __name__ == "__main__":
    main()