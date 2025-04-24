# Python Code Implementation

import os
import zipfile
import logging
import tempfile
from typing import Dict, List, Union
from fastapi import FastAPI, File, UploadFile, HTTPException, Form, status
from fastapi.responses import JSONResponse
from botocore.exceptions import BotoCoreError, ClientError
from PIL import Image
import boto3

# Initialize FastAPI
app = FastAPI()

# Logger configuration
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# AWS Configuration - Replace these with your actual credentials
AWS_ACCESS_KEY = "YOUR_AWS_ACCESS_KEY"
AWS_SECRET_KEY = "YOUR_AWS_SECRET_KEY"
S3_BUCKET_NAME = "your-s3-bucket-name"
REGION_NAME = "your-region-name"

# AWS S3 Client
s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=REGION_NAME
)

# Validation Configuration
MAX_FILE_SIZE_MB = 5120  # 5GB
VALID_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png"}
DATASET_STRUCTURE = {
    "classification": "Root folder must contain sub-folders with images for each class.",
    "segmentation": "Root folder must have images and masks folders, each non-empty."
}

class ValidationError(Exception):
    pass


def extract_and_validate_zip(file_path: str, dataset_type: str) -> Dict[str, Union[str, List[Dict[str, str]]]]:
    """
    Extracts a ZIP file, validates its structure, and returns validation results.
    """
    validation_results = {"status": "success", "details": []}
    
    try:
        # Extract ZIP file
        with tempfile.TemporaryDirectory() as temp_dir:
            with zipfile.ZipFile(file_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)

            logger.info("Dataset extracted to temporary directory")
            # Validate extracted folder structure
            validate_folder_structure(temp_dir, dataset_type, validation_results)
    except (zipfile.BadZipFile, FileNotFoundError) as e:
        raise ValidationError(f"Invalid ZIP file: {e}")

    return validation_results


def validate_folder_structure(base_path: str, dataset_type: str, result_container: dict):
    """
    Validates the folder structure and content of the dataset.
    """
    if dataset_type == "classification":
         class Num