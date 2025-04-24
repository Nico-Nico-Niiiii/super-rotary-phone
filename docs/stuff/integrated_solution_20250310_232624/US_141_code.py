```python
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
        # Classification: Ensure each folder contains valid images
        subfolders = [f.path for f in os.scandir(base_path) if f.is_dir()]
        if not subfolders:
            result_container["status"] = "error"
            result_container["details"].append({
                "type": "folder_structure",
                "severity": "error",
                "message": DATASET_STRUCTURE[dataset_type]
            })
            return

        for folder in subfolders:
            images = [
                f for f in os.listdir(folder)
                if os.path.isfile(os.path.join(folder, f)) and f.lower().endswith(tuple(VALID_IMAGE_EXTENSIONS))
            ]
            if not images:
                result_container["status"] = "error"
                result_container["details"].append({
                    "type": "folder_structure",
                    "severity": "error",
                    "message": f"Folder '{folder}' does not contain images."
                })

    elif dataset_type == "segmentation":
        # Segmentation: Ensure 'images' and 'masks' folders exist and are non-empty
        required_folders = {"images", "masks"}
        existing_folders = {folder.name for folder in os.scandir(base_path) if folder.is_dir()}

        if not required_folders.issubset(existing_folders):
            result_container["status"] = "error"
            result_container["details"].append({
                "type": "folder_structure",
                "severity": "error",
                "message": DATASET_STRUCTURE[dataset_type]
            })
            return

        for folder in required_folders:
            files = [
                f for f in os.listdir(os.path.join(base_path, folder))
                if os.path.isfile(os.path.join(base_path, folder, f))
            ]
            if not files:
                result_container["status"] = "error"
                result_container["details"].append({
                    "type": "folder_structure",
                    "severity": "error",
                    "message": f"Folder '{folder}' is empty."
                })


def upload_to_s3(file_path: str, s3_key: str):
    """
    Uploads a file to an S3 bucket with retries and error handling.
    """
    try:
        s3_client.upload_file(file_path, S3_BUCKET_NAME, s3_key)
        logger.info(f"File uploaded successfully to S3: {s3_key}")
    except (BotoCoreError, ClientError) as e:
        logger.error(f"Failed to upload file to S3: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to upload file to cloud storage.")


@app.post("/api/upload-dataset")
async def upload_dataset(file: UploadFile = File(...), datasetType: str = Form(...)):
    """
    Endpoint to upload a dataset ZIP file.
    """
    if datasetType not in {"classification", "segmentation"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid dataset type.")

    # Check file size
    file_size = await file.read()
    if len(file_size) > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File size exceeds maximum limit of 5GB.")
    
    # Save file locally for processing
    with tempfile.NamedTemporaryFile(delete=True, suffix=".zip") as temp_file:
        temp_file.write(file_size)
        temp_file.flush()

        # Validate the dataset
        try:
            validation_results = extract_and_validate_zip(temp_file.name, datasetType)
        except ValidationError as e:
            logger.error(f"Validation error: {e}")
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))

        if validation_results["status"] == "error":
            return JSONResponse(content=validation_results, status_code=status.HTTP_400_BAD_REQUEST)

        # Upload to S3
        s3_key = f"{datasetType}/{file.filename}"
        upload_to_s3(temp_file.name, s3_key)

        # Return success
        return JSONResponse(content={
            "status": "success",
            "message": "Dataset uploaded successfully.",
            "validation_results": validation_results
        })
```