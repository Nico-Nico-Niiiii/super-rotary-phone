import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file if present
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Azure OpenAI settings
AZURE_OPENAI_API_KEY = os.environ.get("AZURE_OPENAI_API_KEY", "0bf3daeba1814d03b5d62e1da4077478")
AZURE_OPENAI_ENDPOINT = os.environ.get("AZURE_OPENAI_ENDPOINT", "https://openaisk123.openai.azure.com/")
AZURE_OPENAI_API_VERSION = os.environ.get("AZURE_OPENAI_API_VERSION", "2024-08-01-preview")
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = os.environ.get("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME", "gpt-4o")

# Vector database settings
CHROMA_PERSIST_DIRECTORY = os.path.join(BASE_DIR, "data", "chroma_db")
COLLECTION_NAME = "vision_rag_collection"

# Image processing settings
IMAGE_DIRECTORY = os.path.join(BASE_DIR, "data", "images")
MAX_IMAGE_SIZE = (1024, 1024)  # Max width and height for resizing images
IMAGE_FORMATS = [".jpg", ".jpeg", ".png", ".webp"]

# PDF processing settings
PDF_TEMP_DIRECTORY = os.path.join(BASE_DIR, "data", "pdf_temp")
PDF_MIN_IMAGE_SIZE = (100, 100)  # Minimum size for extracted images
PDF_MAX_IMAGES_PER_PDF = 5000  # Maximum number of images to extract from a PDF

# Embedding settings
EMBEDDING_DIMENSION = 1536  # Dimension for OpenAI embeddings

# Logging settings
LOG_LEVEL = os.environ.get("LOG_LEVEL", "INFO")