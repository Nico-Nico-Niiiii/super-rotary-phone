#!/usr/bin/env python3
"""
RAG Inference script using LangChain and LangGraph
This script demonstrates how to use the new RAG inference system with existing documents
"""

import os
import sys
import zipfile
import tempfile
import argparse
import logging
from typing import List, Dict, Any

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import Azure setup
from azure_setup import setup_azure_openai

# Import the RAG inference system
from rag_inference import LangGraphRAG

def create_zip_from_python_files(output_zip: str = "document_corpus.zip") -> str:
    """
    Create a ZIP file from Python files in the current directory
    
    Args:
        output_zip: Path for the output ZIP file
        
    Returns:
        Path to the created ZIP file
    """
    # Get all Python files in the current directory
    py_files = [f for f in os.listdir() if f.endswith(".py")]
    
    # Create ZIP file
    with zipfile.ZipFile(output_zip, "w") as zip_file:
        for file in py_files:
            zip_file.write(file)
    
    print(f"Created ZIP file {output_zip} with {len(py_files)} Python files")
    return output_zip

def main():
    """Main function for CLI interface"""
    parser = argparse.ArgumentParser(description="RAG Inference using LangChain and LangGraph")
    parser.add_argument("--use-python-files", action="store_true", help="Use Python files in the current directory")
    parser.add_argument("--documents", type=str, help="Path to documents (file, directory, or ZIP)")
    parser.add_argument("--rag-type", type=str, default="standard", 
                       choices=["standard", "iterative", "self-reflective", "adaptive", "raptor"], 
                       help="RAG workflow type")
    parser.add_argument("--llm-model", type=str, default="gpt-3.5-turbo", help="LLM model name")
    parser.add_argument("--embedding-model", type=str, default="sentence-transformers/all-MiniLM-L6-v2", help="Embedding model name")
    parser.add_argument("--vector-store", type=str, default="chroma", choices=["chroma", "faiss"], help="Vector store type")
    
    args = parser.parse_args()
    
    # Determine document source
    if args.use_python_files:
        document_path = create_zip_from_python_files()
    elif args.documents:
        document_path = args.documents
    else:
        print("Error: Either --use-python-files or --documents must be specified")
        parser.print_help()
        sys.exit(1)
    
    # Set up Azure OpenAI
    try:
        setup_azure_openai()
        logger.info("Azure OpenAI setup completed successfully")
    except Exception as e:
        logger.error(f"Azure OpenAI setup failed: {e}")
        # Fall back to regular OpenAI
        if "OPENAI_API_KEY" not in os.environ and "gpt" in args.llm_model.lower():
            api_key = input("Enter your OpenAI API key: ")
            os.environ["OPENAI_API_KEY"] = api_key
    
    # Initialize the RAG system
    rag = LangGraphRAG(
        embedding_model_name=args.embedding_model,
        llm_model_name=args.llm_model,
        vector_store_type=args.vector_store,
        rag_type=args.rag_type,
        verbose=True
    )
    
    # Process documents
    print(f"Processing documents from {document_path}...")
    rag.process_documents(document_path)
    print("Document processing complete.")
    
    # Interactive query loop
    print("\nEnter queries, or 'quit' to exit:")
    while True:
        query = input("\nQuery: ").strip()
        if query.lower() in ["quit", "exit", "q"]:
            break
        
        if not query:
            continue
        
        try:
            print("\nGenerating response...")
            response = rag.generate_response(query)
            print(f"\nResponse: {response}")
        except Exception as e:
            print(f"Error generating response: {e}")

if __name__ == "__main__":
    main()