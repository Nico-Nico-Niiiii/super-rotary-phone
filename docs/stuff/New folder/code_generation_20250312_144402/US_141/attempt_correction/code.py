```python
import os
import shutil
import tempfile
import zipfile
from pathlib import Path
from typing import List, Dict, Union
from fastapi import FastAPI, UploadFile, HTTPException
from fastapi.responses import JSONResponse
import boto3
from botocore.exceptions import BotoCoreError, ClientError
import logging
import uuid

# Initialize FastAPI app
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AWS S3 Configuration
AWS_BUCKET_NAME = "your-s3-bucket-name"
AWS_REGION = "your-region"
s3_client = boto3.client("s3", region_name=AWS_REGION)

# Supported image formats
SUPPORTED_IMAGE_FORMATS = {".jpg", ".jpeg", ".png"}

# In-memory storage for upload statuses
upload_statuses: Dict[str, str] = {}

# Helper function to create a unique temporary directory
def create_temp_dir() -> str:
    return tempfile.mkdtemp()

# Helper function to clean up temporary directories
def cleanup_temp_dir(temp_dir: str) -> None:
    if os.path.exists(temp_dir):
        shutil.rmtree(temp_dir)

# Helper function to validate dataset type
def validate_dataset_type(dataset_type: str) -> None:
    if dataset_type not in {"classification", "segmentation"}:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid dataset type '{dataset_type}'. Supported types are 'classification' and 'segmentation'."
        )

# Helper function to validate folder structure for classification datasets
def validate_classification_structure(temp_dir: str) -> None:
    for subdir in Path(temp_dir).iterdir():
        if not subdir.is_dir():
            raise HTTPException(
                status_code=400,
                detail=f"Invalid folder structure: {subdir.name} is not a directory."
            )
        if not any(file.suffix in SUPPORTED_IMAGE_FORMATS for file in subdir.iterdir()):
            raise HTTPException(
                status_code=400,
                detail=f"Invalid folder structure: No valid image files found in {subdir.name}."
            )

# Helper function to validate folder structure for segmentation datasets
def validate_segmentation_structure(temp_dir: str) -> None:
    images_dir = Path(temp_dir) / "images"
    masks_dir = Path(temp_dir) / "masks"
    if not images_dir.is_dir() or not masks_dir.is_dir():
        raise HTTPException(
            status_code=400,
            detail="Invalid folder structure: 'images' and 'masks' directories are required for segmentation datasets."
        )
    if not any(file.suffix in SUPPORTED_IMAGE_FORMATS for file in images_dir.iterdir()):
        raise HTTPException(
            status_code=400,
            detail="Invalid folder structure: No valid image files found in 'images' directory."
        )
    if not any(file.suffix in SUPPORTED_IMAGE_FORMATS for file in masks_dir.iterdir()):
        raise HTTPException(
            status_code=400,
            detail="Invalid folder structure: No valid mask files found in 'masks' directory."
        )

# Helper function to validate zip file contents
def validate_zip_file(zip_path: str, dataset_type: str) -> None:
    temp_dir = create_temp_dir()
    try:
        with zipfile.ZipFile(zip_path, "r") as zip_ref:
            zip_ref.extractall(temp_dir)
        if dataset_type == "classification":
            validate_classification_structure(temp_dir)
        elif dataset_type == "segmentation":
            validate_segmentation_structure(temp_dir)
    finally:
        cleanup_temp_dir(temp_dir)

# Helper function to upload file to S3
def upload_to_s3(file_path: str, s3_key: str) -> None:
    try:
        s3_client.upload_file(file_path, AWS_BUCKET_NAME, s3_key)
    except ClientError as e:
        logger.error(f"ClientError during S3 upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to S3 due to client error.")
    except BotoCoreError as e:
        logger.error(f"BotoCoreError during S3 upload: {e}")
        raise HTTPException(status_code=500, detail="Failed to upload file to S3 due to AWS SDK error.")

# Helper function for post-upload validation
def post_upload_validation(s3_key: str) -> None:
    # Placeholder for additional validation logic
    logger.info(f"Post-upload validation for S3 key: {s3_key}")

@app.post("/api/upload-dataset/")
async def upload_dataset(dataset_type: str, file: UploadFile) -> JSONResponse:
    validate_dataset_type(dataset_type)
    dataset_id = str(uuid.uuid4())
    upload_statuses[dataset_id] = "IN_PROGRESS"
    temp_dir = create_temp_dir()
    try:
        zip_path = os.path.join(temp_dir, file.filename)
        with open(zip_path, "wb") as f:
            shutil.copyfileobj(file.file, f)
        validate_zip_file(zip_path, dataset_type)
        s3_key = f"datasets/{dataset_id}/{file.filename}"
        upload_to_s3(zip_path, s3_key)
        post_upload_validation(s3_key)
        upload_statuses[dataset_id] = "COMPLETED"
        return JSONResponse(content={"dataset_id": dataset_id, "status": "COMPLETED"})
    except HTTPException as e:
        upload_statuses[dataset_id] = "FAILED"
        raise e
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        upload_statuses[dataset_id] = "FAILED"
        raise HTTPException(status_code=500, detail="An unexpected error occurred.")
    finally:
        cleanup_temp_dir(temp_dir)

@app.get("/api/upload-status/{dataset_id}")
async def get_upload_status(dataset_id: str) -> JSONResponse:
    status = upload_statuses.get(dataset_id)
    if not status:
        raise HTTPException(status_code=404, detail="Dataset ID not found.")
    return JSONResponse(content={"dataset_id": dataset_id, "status": status})
```