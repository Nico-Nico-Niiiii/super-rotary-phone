from fastapi import FastAPI, UploadFile, HTTPException, Form, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from zipfile import ZipFile, is_zipfile
from pathlib import Path
import os
import shutil
import tempfile
import boto3
from boto3.s3.transfer import S3Transfer, TransferConfig
from botocore.exceptions import BotoCoreError, NoCredentialsError
from PIL import Image
import logging
import traceback

# Initialize FastAPI app
app = FastAPI()

# Setup logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change in production to allow specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# AWS S3 Configuration
AWS_S3_BUCKET = "your-s3-bucket-name"
AWS_ACCESS_KEY = "your-access-key"
AWS_SECRET_KEY = "your-secret-key"
AWS_REGION = "your-region"

# Max Zip File Size
MAX_ZIP_SIZE = 5 * 1024 * 1024 * 1024  # 5GB

# Allowed Image Formats
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}


class ValidationResult(BaseModel):
    status: str  # success, error, or warning
    details: List[dict]


@app.post("/api/upload-dataset", response_model=ValidationResult)
async def upload_dataset(
    dataset_type: str = Form(...), file: UploadFile = None, background_tasks: BackgroundTasks = Depends()
):
    """
    Endpoint to handle dataset uploads, validate them and upload valid datasets to the cloud.
    """
    if not file or not is_zipfile(file.file):
        raise HTTPException(
            status_code=400, detail="Invalid file format. Please upload a valid zip file."
        )

    # Check file size
    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    if file_size > MAX_ZIP_SIZE:
        raise HTTPException(400, detail=f"File exceeds the maximum size limit of {MAX_ZIP_SIZE / (1024*1024*1024)} GB.")

    file.file.seek(0)  # Reset file pointer after checking file size

    # Extract and validate zip file in temporary storage
    with tempfile.TemporaryDirectory() as tmp_dir:
        try:
            zip_path = os.path.join(tmp_dir, file.filename)
            with open(zip_path, "wb") as temp_zip:
                temp_zip.write(file.file.read())

            # Unzip file
            with ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(tmp_dir)

            # Validation Process
            validation_result = validate_dataset(Path(tmp_dir), dataset_type)

            if validation_result["status"] != "success":
                return validation_result

            # Upload to Cloud Storage
            background_tasks.add_task(upload_to_s3, Path(tmp_dir), dataset_type)
            return validation_result

        except Exception as e:
            logging.error(traceback.format_exc())
            raise HTTPException(status_code=500, detail="An internal error occurred while processing the file.")


def validate_dataset(extracted_path: Path, dataset_type: str) -> dict:
    """
    Validates the folder structure and content of the dataset.

    Args:
        extracted_path: Path of the extracted dataset.
        dataset_type: Type of dataset - 'classification' or 'segmentation'.

    Returns:
        dict: Validation result.
    """
    try:
        details = []

        # Validation for classification datasets
        if dataset_type == "classification":
            root_dirs = [f for f in extracted_path.iterdir() if f.is_dir()]
            if not root_dirs:
                details.append(
                    {
                        "type": "folder_structure",
                        "severity": "error",
                        "message": "Root folder must contain sub-folders for each class.",
                    }
                )
            for sub_folder in root_dirs:
                images = list(sub_folder.glob("*"))
                for image in images:
                    if not validate_image(image):
                        details.append(
                            {
                                "type": "file_format",
                                "severity": "warning",
                                "message": f"Invalid or corrupt image file: {image.name}",
                            }
                        )

        elif dataset_type == "segmentation":
            images_folder = extracted_path / "images"
            masks_folder = extracted_path / "masks"

            if not images_folder.exists() or not masks_folder.exists():
                details.append(
                    {
                        "type": "folder_structure",
                        "severity": "error",
                        "message": "'images' and 'masks' folders are required under the root folder.",
                    }
                )
            else:
                for image in images_folder.glob("*"):
                    if not validate_image(image):
                        details.append(
                            {
                                "type": "file_format",
                                "severity": "warning",
                                "message": f"Invalid or corrupt image file: {image.name}",
                            }
                        )
                for mask in masks_folder.glob("*"):
                    if not validate_image(mask):
                        details.append(
                            {
                                "type": "file_format",
                                "severity": "warning",
                                "message": f"Invalid or corrupt mask file: {mask.name}",
                            }
                        )
        
        # Summarize validation
        if any(detail["severity"] == "error" for detail in details):
            return {"status": "error", "details": details}
        elif details:
            return {"status": "warning", "details": details}
        else:
            return {"status": "success", "details": []}

    except Exception as e:
        logging.error(traceback.format_exc())
        return {"status": "error", "details": [{"type": "validation", "severity": "error", "message": str(e)}]}


def validate_image(image_path: Path) -> bool:
    """
    Validates if a file is a valid image.

    Args:
        image_path: Path of the image file.

    Returns:
        bool: True if valid, otherwise False.
    """
    try:
        with Image.open(image_path) as img:
            return img.format in ALLOWED_IMAGE_FORMATS
    except Exception:
        return False


def upload_to_s3(dataset_path: Path, dataset_type: str):
    """
    Upload the validated dataset to AWS S3.

    Args:
        dataset_path: Path of the validated dataset.
        dataset_type: Type of the dataset being uploaded.
    """
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=AWS_REGION,
        )
        transfer = S3Transfer(s3_client, config=TransferConfig(multipart_threshold=10 * 1024 * 1024))
        for root, _, files in os.walk(dataset_path):
            for filename in files:
                file_path = os.path.join(root, filename)
                s3_key = os.path.relpath(file_path, dataset_path)
                transfer.upload_file(file_path, AWS_S3_BUCKET, s3_key)
        logging.info(f"Dataset successfully uploaded to {AWS_S3_BUCKET}.")
    except (BotoCoreError, NoCredentialsError) as e:
        logging.error(f"Failed to upload dataset to S3: {str(e)}")