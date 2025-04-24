import os
import logging
import shutil
from fastapi import HTTPException, UploadFile, status

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

def check_openai_config():
    """Check if Azure OpenAI config is set in environment variables."""
    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
    ]
    
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        # Check if we can set values explicitly
        logger.info("Looking for OpenAI configuration in current environment...")
        
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

def upload_file(file: UploadFile, destination: str = "uploads"):
    """
    Upload a file to the specified destination directory
    
    Args:
        file: The uploaded file
        destination: The directory to save the file to
    
    Returns:
        str: The path to the saved file
    """
    try:
        # Create destination directory if it doesn't exist
        os.makedirs(destination, exist_ok=True)
        
        # Save the file
        file_path = os.path.join(destination, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        return file_path
    except Exception as e:
        logger.error(f"Error uploading file: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error uploading file: {str(e)}"
        )