#!/usr/bin/env python3
"""
RAG Inference script using LangChain and LangGraph with Azure OpenAI
This script sets up Azure OpenAI and runs RAG inference on the specified ZIP file
"""

import os
import sys
import logging
import argparse
from typing import Optional
import importlib.util
import shutil

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Azure OpenAI setup
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



def check_and_install_dependencies():
    """Check and install dependencies if needed"""
    required_packages = [
        "langchain", "langchain_core", "langchain_community", 
        "langchain_openai", "langgraph", "chromadb", "sentence_transformers", 
        "faiss_cpu", "numpy", "docx2txt"
    ]
    
    for package in required_packages:
        try:
            # Try to import the package
            importlib.import_module(package.replace("-", "_"))
            logger.info(f"Package {package} is already installed")
        except ImportError:
            # If import fails, install the package
            logger.info(f"Installing {package}...")
            
            # For faiss_cpu package, we need to use faiss-cpu
            if package == "faiss_cpu":
                os.system(f"pip install faiss-cpu")
            else:
                os.system(f"pip install {package}")

def run_inference(zip_path: str, rag_type: str = "standard", verbose: bool = True) -> None:
    """
    Run RAG inference on the specified ZIP file
    
    Args:
        zip_path: Path to the ZIP file
        rag_type: Type of RAG to use
        verbose: Whether to enable verbose logging
    """
    try:
        # Make sure Azure OpenAI is set up
        setup_azure_openai()
        
        # We need to use the fixed version of the RAG inference
        if not os.path.exists("rag_inference.py"):
            logger.error("Missing rag_inference.py file")
            print("The rag_inference.py file is missing. Please make sure it exists in the current directory.")
            return
        
        # Import from the fixed file
        import rag_inference
        LangGraphRAG = rag_inference.LangGraphRAG
        
        # Initialize RAG system
        logger.info(f"Initializing {rag_type} RAG system...")
        rag = LangGraphRAG(
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
            llm_model_name="gpt-4o",  # Will use Azure OpenAI since we set up the environment
            vector_store_type="chroma",
            chunking_method="recursive",
            max_tokens=500,
            token_overlap=50,
            rag_type=rag_type,
            verbose=verbose
        )
        
        # Process documents
        logger.info(f"Processing documents from {zip_path}...")
        rag.process_documents(zip_path)
        logger.info("Document processing complete.")
        
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
                logger.error(f"Error generating response: {e}", exc_info=True)
                print(f"Error generating response: {e}")
    
    except Exception as e:
        logger.error(f"Error in run_inference: {e}", exc_info=True)
        print(f"Error: {e}")

def main():
    """Main function"""
    parser = argparse.ArgumentParser(description="Run RAG inference with Azure OpenAI")
    parser.add_argument("--zip-path", type=str, required=True, help="Path to the ZIP file")
    parser.add_argument("--rag-type", type=str, default="standard", 
                       choices=["standard", "iterative", "self-reflective", "adaptive", "raptor"], 
                       help="RAG workflow type")
    parser.add_argument("--verbose", action="store_true", help="Enable verbose output")
    
    args = parser.parse_args()
    
    # Check and install dependencies if needed
    check_and_install_dependencies()
    
    # Make sure the rag_inference.py file is available
    if os.path.exists("rag_inference.py"):
        logger.info("Using existing rag_inference.py")
    else:
        # If not, try to copy it from the source
        try:
            if os.path.exists("rag_inference.py"):
                shutil.copy("rag_inference.py", "rag_inference.py")
                logger.info("Copied rag_inference.py")
            else:
                logger.error("Could not find rag_inference.py")
                print("Error: rag_inference.py not found. Please ensure it exists in the current directory.")
                return
        except Exception as e:
            logger.error(f"Error copying rag_inference.py: {e}")
            print(f"Error: Could not prepare rag_inference.py - {e}")
            return
    
    run_inference(
        zip_path=args.zip_path,
        rag_type=args.rag_type,
        verbose=args.verbose
    )

if __name__ == "__main__":
    main()