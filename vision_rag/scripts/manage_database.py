#!/usr/bin/env python3
"""
Script to manage the vector database for the vision RAG system.
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
from config.settings import CHROMA_PERSIST_DIRECTORY
from src.pipeline import VisionRAGPipeline
from src.vector_store import VectorStore


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


def get_stats():
    """Get statistics about the vector database."""
    pipeline = VisionRAGPipeline()
    
    # Get image count
    image_count = pipeline.get_image_count()
    
    print("\nVECTOR DATABASE STATISTICS:")
    print("-" * 80)
    print(f"Total images indexed: {image_count}")
    print(f"Database location: {CHROMA_PERSIST_DIRECTORY}")
    
    # Get database size if it exists
    if os.path.exists(CHROMA_PERSIST_DIRECTORY):
        db_size = 0
        for path, dirs, files in os.walk(CHROMA_PERSIST_DIRECTORY):
            for file in files:
                db_size += os.path.getsize(os.path.join(path, file))
        
        print(f"Database size: {db_size / (1024 * 1024):.2f} MB")
    
    print("-" * 80)


def list_images(limit=10, offset=0, output_file=None):
    """
    List images in the database.
    
    Args:
        limit: Maximum number of images to list
        offset: Number of images to skip
        output_file: Path to file for saving results (optional)
    """
    pipeline = VisionRAGPipeline()
    
    # Get images
    images = pipeline.get_all_images(limit=limit, offset=offset)
    total_count = pipeline.get_image_count()
    
    if not images:
        print("\nNo images found in the database.")
        return
    
    # Prepare output
    output = ["\nIMAGES IN DATABASE:", "-" * 80]
    output.append(f"Showing {len(images)} of {total_count} images (offset: {offset})")
    output.append("-" * 80 + "\n")
    
    for i, image in enumerate(images, 1):
        output.append(f"{i + offset}. ID: {image['id']}")
        output.append(f"   Filename: {image['metadata'].get('filename', 'Unknown')}")
        output.append(f"   Format: {image['metadata'].get('format', 'Unknown')}")
        output.append(f"   Size: {image['metadata'].get('width', 'Unknown')}x{image['metadata'].get('height', 'Unknown')}")
        
        # If the image is from a PDF, show source
        if "pdf_source" in image["metadata"]:
            pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
            output.append(f"   Source: PDF document '{pdf_name}'")
        
        output.append(f"   Description: {image['description'][:100]}..." if len(image['description']) > 100 else f"   Description: {image['description']}")
        output.append("")
    
    # Print output
    print("\n".join(output))
    
    # Save to file if requested
    if output_file:
        with open(output_file, "w") as f:
            f.write("\n".join(output))
        logger.info(f"Image list saved to {output_file}")


def get_image_details(image_id, output_file=None):
    """
    Get details about a specific image.
    
    Args:
        image_id: ID of the image to get details for
        output_file: Path to file for saving results (optional)
    """
    pipeline = VisionRAGPipeline()
    
    # Get image
    image = pipeline.get_image_by_id(image_id)
    
    if not image:
        print(f"\nImage with ID {image_id} not found.")
        return
    
    # Prepare output
    output = ["\nIMAGE DETAILS:", "-" * 80]
    output.append(f"ID: {image['id']}")
    output.append(f"Filename: {image['metadata'].get('filename', 'Unknown')}")
    output.append(f"Format: {image['metadata'].get('format', 'Unknown')}")
    output.append(f"Size: {image['metadata'].get('width', 'Unknown')}x{image['metadata'].get('height', 'Unknown')}")
    
    # If the image is from a PDF, show source
    if "pdf_source" in image["metadata"]:
        pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
        output.append(f"Source: PDF document '{pdf_name}'")
    
    output.append("")
    output.append("Description:")
    output.append(image['description'])
    output.append("-" * 80)
    
    # Print output
    print("\n".join(output))
    
    # Save to file if requested
    if output_file:
        with open(output_file, "w") as f:
            f.write("\n".join(output))
        logger.info(f"Image details saved to {output_file}")


def delete_image(image_id):
    """
    Delete an image from the database.
    
    Args:
        image_id: ID of the image to delete
    """
    pipeline = VisionRAGPipeline()
    
    # Get image details first
    image = pipeline.get_image_by_id(image_id)
    
    if not image:
        print(f"\nImage with ID {image_id} not found.")
        return
    
    # Confirm deletion
    filename = image['metadata'].get('filename', 'Unknown')
    print(f"\nYou are about to delete the following image:")
    print(f"ID: {image_id}")
    print(f"Filename: {filename}")
    
    # If the image is from a PDF, show source
    if "pdf_source" in image["metadata"]:
        pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
        print(f"Source: PDF document '{pdf_name}'")
    
    confirm = input("\nAre you sure you want to delete this image? (y/n): ")
    
    if confirm.lower() != 'y':
        print("Deletion cancelled.")
        return
    
    # Delete the image
    success = pipeline.remove_image(image_id)
    
    if success:
        print(f"\nImage {filename} (ID: {image_id}) deleted successfully.")
    else:
        print(f"\nFailed to delete image {filename} (ID: {image_id}).")


def reset_database():
    """Reset the entire database."""
    pipeline = VisionRAGPipeline()
    
    # Confirm reset
    print("\nWARNING: You are about to reset the entire database.")
    print("This will delete all indexed images and cannot be undone.")
    
    confirm = input("\nAre you sure you want to reset the database? (y/n): ")
    
    if confirm.lower() != 'y':
        print("Reset cancelled.")
        return
    
    # Double-check
    confirm = input("Please type 'RESET' to confirm: ")
    
    if confirm != 'RESET':
        print("Reset cancelled.")
        return
    
    # Reset the database
    success = pipeline.reset_system()
    
    if success:
        print("\nDatabase reset successfully.")
    else:
        print("\nFailed to reset database.")


def export_database(output_file):
    """
    Export database contents to a JSON file.
    
    Args:
        output_file: Path to file for saving the export
    """
    pipeline = VisionRAGPipeline()
    
    # Get all images
    images = pipeline.get_all_images(limit=1000000)
    
    if not images:
        print("\nNo images found in the database.")
        return
    
    # Export to JSON
    with open(output_file, "w") as f:
        json.dump(images, f, indent=2)
    
    print(f"\nExported {len(images)} images to {output_file}")


def main():
    """Main function for managing the database."""
    parser = argparse.ArgumentParser(description="Manage the vector database for the vision RAG system")
    
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Stats command
    stats_parser = subparsers.add_parser("stats", help="Get database statistics")
    
    # List command
    list_parser = subparsers.add_parser("list", help="List images in the database")
    list_parser.add_argument("--limit", "-l", type=int, default=10, help="Maximum number of images to list")
    list_parser.add_argument("--offset", "-o", type=int, default=0, help="Number of images to skip")
    list_parser.add_argument("--output", "-f", help="Path to file for saving results")
    
    # Get command
    get_parser = subparsers.add_parser("get", help="Get details about a specific image")
    get_parser.add_argument("image_id", help="ID of the image to get details for")
    get_parser.add_argument("--output", "-o", help="Path to file for saving results")
    
    # Delete command
    delete_parser = subparsers.add_parser("delete", help="Delete an image from the database")
    delete_parser.add_argument("image_id", help="ID of the image to delete")
    
    # Reset command
    reset_parser = subparsers.add_parser("reset", help="Reset the entire database")
    
    # Export command
    export_parser = subparsers.add_parser("export", help="Export database contents to a JSON file")
    export_parser.add_argument("output_file", help="Path to file for saving the export")
    
    args = parser.parse_args()
    
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Execute the appropriate command
    if args.command == "stats":
        get_stats()
    elif args.command == "list":
        list_images(limit=args.limit, offset=args.offset, output_file=args.output)
    elif args.command == "get":
        get_image_details(args.image_id, output_file=args.output)
    elif args.command == "delete":
        delete_image(args.image_id)
    elif args.command == "reset":
        reset_database()
    elif args.command == "export":
        export_database(args.output_file)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()