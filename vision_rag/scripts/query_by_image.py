#!/usr/bin/env python3
"""
Script to query the vision RAG system with an image and optional text.
"""

import os
import sys
import argparse
import json
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


def query_by_image(image_path, query="Analyze this image and find similar images", limit=5, json_output=False, output_file=None):
    """
    Query the vision RAG system with an image and optional text.
    
    Args:
        image_path: Path to the image file
        query: Text query (optional)
        limit: Maximum number of results to return
        json_output: If True, output results as JSON
        output_file: Path to file for saving results (optional)
    """
    # Initialize pipeline
    pipeline = VisionRAGPipeline()
    
    image_path = Path(image_path)
    
    if not image_path.exists():
        logger.error(f"Image file does not exist: {image_path}")
        return
    
    # Query the system
    logger.info(f"Querying with image: {image_path} and text: {query}")
    result = pipeline.query_with_image(query, image_path, limit=limit)
    
    if json_output:
        # Output as JSON
        if output_file:
            with open(output_file, "w") as f:
                json.dump(result, f, indent=2)
            logger.info(f"Results saved to {output_file}")
        else:
            print(json.dumps(result, indent=2))
    else:
        # Print response
        print("\n" + "="*80)
        print(f"QUERY: {query}")
        print(f"IMAGE: {image_path}")
        print("="*80)
        print("\nRESPONSE:")
        print("-"*80)
        print(result["response"])
        print("-"*80)
        
        # Print query image details
        if result.get("query_image"):
            print("\nQUERY IMAGE:")
            print(f"Filename: {result['query_image'].get('filename', 'Unknown')}")
            description = result['query_image'].get('description', 'No description available')
            print(f"Description: {description[:100]}..." if len(description) > 100 else f"Description: {description}")
            print()
        
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
        
        # Save to file if requested
        if output_file:
            with open(output_file, "w") as f:
                f.write(f"QUERY: {query}\n")
                f.write(f"IMAGE: {image_path}\n\n")
                f.write(f"RESPONSE:\n{result['response']}\n\n")
                
                if result.get("query_image"):
                    f.write("QUERY IMAGE:\n")
                    f.write(f"Filename: {result['query_image'].get('filename', 'Unknown')}\n")
                    f.write(f"Description: {result['query_image'].get('description', 'No description available')}\n\n")
                
                f.write("RETRIEVED IMAGES:\n")
                for i, image in enumerate(result["retrieved_images"], 1):
                    f.write(f"{i}. {image['metadata'].get('filename', 'Unknown')} (Similarity: {image['similarity']:.2f})\n")
                    f.write(f"   Description: {image['description']}\n")
                    if "pdf_source" in image["metadata"]:
                        pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
                        f.write(f"   Source: PDF document '{pdf_name}'\n")
                    f.write("\n")
            
            logger.info(f"Results saved to {output_file}")


def main():
    """Main function for querying by image."""
    parser = argparse.ArgumentParser(description="Query the vision RAG system with an image and optional text")
    
    parser.add_argument("image_path", help="Path to the image file")
    parser.add_argument("--query", "-q", default="Analyze this image and find similar images", help="Text query")
    parser.add_argument("--limit", "-l", type=int, default=5, help="Maximum number of results to return")
    parser.add_argument("--json", "-j", action="store_true", help="Output results as JSON")
    parser.add_argument("--output", "-o", help="Path to file for saving results")
    
    args = parser.parse_args()
    
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Query the system
    query_by_image(args.image_path, query=args.query, limit=args.limit, json_output=args.json, output_file=args.output)


if __name__ == "__main__":
    main()