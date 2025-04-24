#!/usr/bin/env python3
"""
Interactive main script for vision-based RAG system.
Provides a menu-driven interface for all operations.
"""

import os
import sys
import time
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
            os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-35-turbo"
    
    # Verify all variables are set
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        raise EnvironmentError(f"Missing Azure OpenAI configuration: {', '.join(missing)}")
    
    logger.info("Azure OpenAI configuration verified")
    return True


def clear_screen():
    """Clear the terminal screen based on the operating system."""
    if sys.platform == "win32":
        os.system("cls")
    else:
        os.system("clear")


def print_header():
    """Print the application header."""
    clear_screen()
    print("\n" + "="*80)
    print("                      VISION-BASED RAG SYSTEM")
    print("="*80 + "\n")


def print_menu():
    """Print the main menu options."""
    print("\nMAIN MENU:")
    print("-"*80)
    print("1. Index Images from Directory")
    print("2. Index Images from PDF")
    print("3. Query by Text")
    print("4. Query by Image")
    print("5. Show System Statistics")
    print("6. Manage Database")
    print("0. Exit")
    print("-"*80)
    return input("\nSelect an option (0-6): ")


def print_database_menu():
    """Print the database management menu options."""
    print("\nDATABASE MANAGEMENT:")
    print("-"*80)
    print("1. List Images")
    print("2. Get Image Details")
    print("3. Delete Image")
    print("4. Export Database")
    print("5. Reset Database")
    print("0. Back to Main Menu")
    print("-"*80)
    return input("\nSelect an option (0-5): ")


def validate_path(path, is_dir=False):
    """
    Validate if a path exists and is of the correct type.
    
    Args:
        path: Path to validate
        is_dir: Whether the path should be a directory
        
    Returns:
        True if valid, False otherwise
    """
    path_obj = Path(path)
    
    if not path_obj.exists():
        print(f"\nError: Path does not exist: {path}")
        return False
    
    if is_dir and not path_obj.is_dir():
        print(f"\nError: Path is not a directory: {path}")
        return False
    
    if not is_dir and not path_obj.is_file():
        print(f"\nError: Path is not a file: {path}")
        return False
    
    return True


def index_images(pipeline):
    """
    Index images from a directory interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("INDEX IMAGES FROM DIRECTORY")
    print("-"*80)
    
    directory = input("\nEnter the path to the directory containing images: ")
    
    if not validate_path(directory, is_dir=True):
        input("\nPress Enter to continue...")
        return
    
    print(f"\nIndexing images from directory: {directory}")
    print("This may take some time depending on the number of images...")
    
    start_time = time.time()
    count = pipeline.index_images(directory)
    elapsed_time = time.time() - start_time
    
    print(f"\nSuccessfully indexed {count} images in {elapsed_time:.2f} seconds")
    input("\nPress Enter to continue...")


def index_pdf(pipeline):
    """
    Index images from a PDF interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("INDEX IMAGES FROM PDF")
    print("-"*80)
    
    pdf_path = input("\nEnter the path to the PDF file: ")
    
    if not validate_path(pdf_path, is_dir=False):
        input("\nPress Enter to continue...")
        return
    
    # Check if it's a PDF
    if not pdf_path.lower().endswith('.pdf'):
        print("\nWarning: File does not have a .pdf extension.")
        proceed = input("Proceed anyway? (y/n): ")
        if proceed.lower() != 'y':
            return
    
    save_images = input("\nSave extracted images to images directory? (y/n): ").lower() == 'y'
    
    print(f"\nIndexing PDF: {pdf_path}")
    print("Extracting and processing images...")
    
    start_time = time.time()
    image_ids = pipeline.index_pdf(pdf_path, save_images=save_images)
    elapsed_time = time.time() - start_time
    
    if image_ids:
        print(f"\nSuccessfully indexed {len(image_ids)} images from PDF in {elapsed_time:.2f} seconds")
        
        if save_images:
            print(f"Extracted images saved to: {IMAGE_DIRECTORY}")
    else:
        print(f"\nNo images were extracted and indexed from PDF: {pdf_path}")
    
    input("\nPress Enter to continue...")


def query_by_text(pipeline):
    """
    Query the system with text interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("QUERY BY TEXT")
    print("-"*80)
    
    query = input("\nEnter your text query: ")
    
    if not query.strip():
        print("\nError: Query cannot be empty.")
        input("\nPress Enter to continue...")
        return
    
    limit = input("\nMaximum number of results to return (default: 5): ")
    limit = int(limit) if limit.strip() and limit.isdigit() else 5
    
    print(f"\nProcessing query: {query}")
    print("Searching for relevant images...")
    
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
    if not result["retrieved_images"]:
        print("No images found.")
    else:
        for i, image in enumerate(result["retrieved_images"], 1):
            print(f"{i}. {image['metadata'].get('filename', 'Unknown')} (Similarity: {image['similarity']:.2f})")
            print(f"   Description: {image['description'][:100]}..." if len(image['description']) > 100 else f"   Description: {image['description']}")
            
            # If the image is from a PDF, show source
            if "pdf_source" in image["metadata"]:
                pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
                print(f"   Source: PDF document '{pdf_name}'")
            
            print()
    
    input("\nPress Enter to continue...")


def query_by_image(pipeline):
    """
    Query the system with an image interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("QUERY BY IMAGE")
    print("-"*80)
    
    image_path = input("\nEnter the path to the image file: ")
    
    if not validate_path(image_path, is_dir=False):
        input("\nPress Enter to continue...")
        return
    
    query = input("\nEnter your text query (or press Enter for default): ")
    if not query.strip():
        query = "Analyze this image and find similar images"
    
    limit = input("\nMaximum number of results to return (default: 5): ")
    limit = int(limit) if limit.strip() and limit.isdigit() else 5
    
    print(f"\nProcessing query: {query}")
    print(f"Analyzing image: {image_path}")
    print("Searching for similar images...")
    
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
    if not result["retrieved_images"]:
        print("No similar images found.")
    else:
        for i, image in enumerate(result["retrieved_images"], 1):
            print(f"{i}. {image['metadata'].get('filename', 'Unknown')} (Similarity: {image['similarity']:.2f})")
            print(f"   Description: {image['description'][:100]}..." if len(image['description']) > 100 else f"   Description: {image['description']}")
            
            # If the image is from a PDF, show source
            if "pdf_source" in image["metadata"]:
                pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
                print(f"   Source: PDF document '{pdf_name}'")
            
            print()
    
    input("\nPress Enter to continue...")


def show_stats(pipeline):
    """
    Show system statistics interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("SYSTEM STATISTICS")
    print("-"*80)
    
    # Get image count
    image_count = pipeline.get_image_count()
    
    print(f"\nTotal images indexed: {image_count}")
    print(f"Database location: {CHROMA_PERSIST_DIRECTORY}")
    
    # Get database size if it exists
    if os.path.exists(CHROMA_PERSIST_DIRECTORY):
        db_size = 0
        for path, dirs, files in os.walk(CHROMA_PERSIST_DIRECTORY):
            for file in files:
                db_size += os.path.getsize(os.path.join(path, file))
        
        print(f"Database size: {db_size / (1024 * 1024):.2f} MB")
    
    print(f"Images directory: {IMAGE_DIRECTORY}")
    
    input("\nPress Enter to continue...")


def list_images(pipeline):
    """
    List images in the database interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("LIST IMAGES")
    print("-"*80)
    
    limit = input("\nMaximum number of images to list (default: 10): ")
    limit = int(limit) if limit.strip() and limit.isdigit() else 10
    
    offset = input("Number of images to skip (default: 0): ")
    offset = int(offset) if offset.strip() and offset.isdigit() else 0
    
    # Get images
    images = pipeline.get_all_images(limit=limit, offset=offset)
    total_count = pipeline.get_image_count()
    
    if not images:
        print("\nNo images found in the database.")
        input("\nPress Enter to continue...")
        return
    
    print(f"\nShowing {len(images)} of {total_count} images (offset: {offset})")
    print("-"*80 + "\n")
    
    for i, image in enumerate(images, 1):
        print(f"{i + offset}. ID: {image['id']}")
        print(f"   Filename: {image['metadata'].get('filename', 'Unknown')}")
        print(f"   Format: {image['metadata'].get('format', 'Unknown')}")
        print(f"   Size: {image['metadata'].get('width', 'Unknown')}x{image['metadata'].get('height', 'Unknown')}")
        
        # If the image is from a PDF, show source
        if "pdf_source" in image["metadata"]:
            pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
            print(f"   Source: PDF document '{pdf_name}'")
        
        print(f"   Description: {image['description'][:100]}..." if len(image['description']) > 100 else f"   Description: {image['description']}")
        print()
    
    input("\nPress Enter to continue...")


def get_image_details(pipeline):
    """
    Get details about a specific image interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("GET IMAGE DETAILS")
    print("-"*80)
    
    image_id = input("\nEnter the ID of the image to get details for: ")
    
    if not image_id.strip():
        print("\nError: Image ID cannot be empty.")
        input("\nPress Enter to continue...")
        return
    
    # Get image
    image = pipeline.get_image_by_id(image_id)
    
    if not image:
        print(f"\nImage with ID {image_id} not found.")
        input("\nPress Enter to continue...")
        return
    
    print("\nIMAGE DETAILS:")
    print("-"*80)
    print(f"ID: {image['id']}")
    print(f"Filename: {image['metadata'].get('filename', 'Unknown')}")
    print(f"Format: {image['metadata'].get('format', 'Unknown')}")
    print(f"Size: {image['metadata'].get('width', 'Unknown')}x{image['metadata'].get('height', 'Unknown')}")
    
    # If the image is from a PDF, show source
    if "pdf_source" in image["metadata"]:
        pdf_name = image["metadata"].get("pdf_filename", image["metadata"]["pdf_source"])
        print(f"Source: PDF document '{pdf_name}'")
    
    print("\nDescription:")
    print(image['description'])
    print("-"*80)
    
    input("\nPress Enter to continue...")


def delete_image(pipeline):
    """
    Delete an image from the database interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("DELETE IMAGE")
    print("-"*80)
    
    image_id = input("\nEnter the ID of the image to delete: ")
    
    if not image_id.strip():
        print("\nError: Image ID cannot be empty.")
        input("\nPress Enter to continue...")
        return
    
    # Get image details first
    image = pipeline.get_image_by_id(image_id)
    
    if not image:
        print(f"\nImage with ID {image_id} not found.")
        input("\nPress Enter to continue...")
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
        input("\nPress Enter to continue...")
        return
    
    # Delete the image
    success = pipeline.remove_image(image_id)
    
    if success:
        print(f"\nImage {filename} (ID: {image_id}) deleted successfully.")
    else:
        print(f"\nFailed to delete image {filename} (ID: {image_id}).")
    
    input("\nPress Enter to continue...")


def export_database(pipeline):
    """
    Export database contents to a JSON file interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("EXPORT DATABASE")
    print("-"*80)
    
    output_file = input("\nEnter the path for saving the export: ")
    
    if not output_file.strip():
        print("\nError: Output file path cannot be empty.")
        input("\nPress Enter to continue...")
        return
    
    # Get all images
    print("\nExporting database contents...")
    images = pipeline.get_all_images(limit=1000000)
    
    if not images:
        print("\nNo images found in the database.")
        input("\nPress Enter to continue...")
        return
    
    # Export to JSON
    import json
    with open(output_file, "w") as f:
        json.dump(images, f, indent=2)
    
    print(f"\nExported {len(images)} images to {output_file}")
    input("\nPress Enter to continue...")


def reset_database(pipeline):
    """
    Reset the entire database interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    print_header()
    print("RESET DATABASE")
    print("-"*80)
    
    print("\nWARNING: You are about to reset the entire database.")
    print("This will delete all indexed images and cannot be undone.")
    
    confirm = input("\nAre you sure you want to reset the database? (y/n): ")
    
    if confirm.lower() != 'y':
        print("Reset cancelled.")
        input("\nPress Enter to continue...")
        return
    
    # Double-check
    confirm = input("Please type 'RESET' to confirm: ")
    
    if confirm != 'RESET':
        print("Reset cancelled.")
        input("\nPress Enter to continue...")
        return
    
    # Reset the database
    print("\nResetting database...")
    success = pipeline.reset_system()
    
    if success:
        print("\nDatabase reset successfully.")
    else:
        print("\nFailed to reset database.")
    
    input("\nPress Enter to continue...")


def manage_database(pipeline):
    """
    Manage the database interactively.
    
    Args:
        pipeline: VisionRAGPipeline instance
    """
    while True:
        print_header()
        print("DATABASE MANAGEMENT")
        option = print_database_menu()
        
        if option == "0":
            return
        elif option == "1":
            list_images(pipeline)
        elif option == "2":
            get_image_details(pipeline)
        elif option == "3":
            delete_image(pipeline)
        elif option == "4":
            export_database(pipeline)
        elif option == "5":
            reset_database(pipeline)
            return  # Return to main menu after reset
        else:
            print("\nInvalid option. Please try again.")
            time.sleep(1)


def main():
    """Main function for interactive menu."""
    # Set up Azure OpenAI configuration
    setup_azure_openai()
    
    # Import here to avoid circular imports
    from config.settings import CHROMA_PERSIST_DIRECTORY
    
    # Initialize pipeline
    pipeline = VisionRAGPipeline()
    
    while True:
        print_header()
        option = print_menu()
        
        if option == "0":
            print("\nExiting the application. Goodbye!")
            break
        elif option == "1":
            index_images(pipeline)
        elif option == "2":
            index_pdf(pipeline)
        elif option == "3":
            query_by_text(pipeline)
        elif option == "4":
            query_by_image(pipeline)
        elif option == "5":
            show_stats(pipeline)
        elif option == "6":
            manage_database(pipeline)
        else:
            print("\nInvalid option. Please try again.")
            time.sleep(1)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\nApplication terminated by user. Goodbye!")
    except Exception as e:
        print(f"\n\nAn error occurred: {e}")
        logger.exception("Application error")