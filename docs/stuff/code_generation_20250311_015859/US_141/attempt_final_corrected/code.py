from fastapi import FastAPI, UploadFile, HTTPException, Form, Depends, Security, BackgroundTasks
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import List, Dict, Union
from zipfile import ZipFile, is_zipfile
from pathlib import Path
import tempfile
import shutil
import os
import boto3
from botocore.exceptions import ClientError
from PIL import Image
import logging
import traceback

# Initialize FastAPI app
app = FastAPI()

# Set up logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")

# Constants
MAX_ZIP_FILE_SIZE = 5 * 1024 * 1024 * 1024  # 5GB
ALLOWED_IMAGE_FORMATS = {"JPEG", "PNG"}

# AWS S3 Configuration
AWS_S3_BUCKET = "your-s3-bucket-name"
AWS_REGION = "your-region"
AWS_ACCESS_KEY = "your-access-key"
AWS_SECRET_KEY = "your-secret-key"

# Security (RBAC Implementation)
authentication = HTTPBearer()

# RBAC Configuration
ROLES = {
    "admin": {"can_upload_dataset": True},
    "user": {"can_upload_dataset": False},
}


class ValidationResult(BaseModel):
    status: str
    details: List[Dict]


class S3UploadMetadata(BaseModel):
    uploaded_files: int
    total_size: str


def get_user_role(credentials: HTTPAuthorizationCredentials = Security(authentication)) -> str:
    """
    Mock function to check user role based on token; replace in production with actual RBAC check.
    """
    token = credentials.credentials  # Extract token
    # Mock token role mapping; replace with database lookup or authentication service call
    mock_user_roles = {"admin-token": "admin", "user-token": "user"}
    role = mock_user_roles.get(token, None)
    if not role:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid token or role.")
    return role


@app.post("/api/upload-dataset", response_model=ValidationResult)
async def upload_dataset(
    dataset_type: str = Form(...),
    file: UploadFile = Form(...),
    background_tasks: BackgroundTasks = Depends(),
    role: str = Depends(get_user_role),
):
    """
    Endpoint to process dataset upload, validate and upload to cloud storage.
    """
    if not ROLES[role]["can_upload_dataset"]:
        raise HTTPException(status_code=403, detail="Forbidden: Insufficient permissions.")

    # Validate zip file
    if not file or not is_zipfile(file.file):
        raise HTTPException(status_code=400, detail="Invalid file format. Please upload a valid zip file.")

    file.file.seek(0, os.SEEK_END)
    file_size = file.file.tell()
    file.file.seek(0)
    if file_size > MAX_ZIP_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"File exceeds the maximum size limit of 5GB.")

    with tempfile.TemporaryDirectory() as temp_dir:
        try:
            zip_path = os.path.join(temp_dir, file.filename)
            with open(zip_path, "wb") as temp_file:
                shutil.copyfileobj(file.file, temp_file)

            # Extract files
            extracted_path = Path(temp_dir) / "extracted"
            with ZipFile(zip_path, "r") as zip_ref:
                zip_ref.extractall(extracted_path)

            # Validate Dataset Structure
            validation_result = validate_dataset_structure(extracted_path, dataset_type)
            if validation_result["status"] != "success":
                return validation_result

            # Schedule S3 Upload
            background_tasks.add_task(upload_to_s3, extracted_path, dataset_type)

            # Trigger Post-Upload Validation (Placeholder for cloud-triggered dataset quality checks)
            background_tasks.add_task(post_upload_validation, extracted_path)

            return validation_result

        except Exception as e:
            logging.error(traceback.format_exc())
            raise HTTPException(
                status_code=500, detail=f"Internal Error: Failed to process dataset. {str(e)}"
            )


def validate_dataset_structure(dataset_path: Path, dataset_type: str) -> dict:
    """
    Validates dataset directory structure based on dataset type.

    Args:
        dataset_path (Path): Path of the extracted dataset.
        dataset_type (str): The type of dataset: 'classification' or 'segmentation'.

    Returns:
        dict: Validation result containing status and details.
    """
    validation_details = []
    try:
        if dataset_type == "classification":
            subfolders = [f for f in dataset_path.iterdir() if f.is_dir()]
            if not subfolders:
                validation_details.append(
                    {
                        "type": "folder_structure",
                        "severity": "error",
                        "message": "Root folder must contain subfolders for each class.",
                    }
                )
            for subfolder in subfolders:
                for image_file in subfolder.iterdir():
                    if not validate_image_file(image_file):
                        validation_details.append(
                            {
                                "type": "invalid_file",
                                "severity": "warning",
                                "message": f"Invalid or corrupt image file {image_file.name}",
                            }
                        )

        elif dataset_type == "segmentation":
            images_folder = dataset_path / "images"
            masks_folder = dataset_path / "masks"
            if not images_folder.exists() or not masks_folder.exists():
                validation_details.append(
                    {
                        "type": "folder_structure",
                        "severity": "error",
                        "message": "'images' and 'masks' folders are required under the root folder.",
                    }
                )
            else:
                for image_file in images_folder.iterdir():
                    if not validate_image_file(image_file):
                        validation_details.append(
                            {
                                "type": "invalid_file",
                                "severity": "warning",
                                "message": f"Invalid image file {image_file.name}",
                            }
                        )
                for mask_file in masks_folder.iterdir():
                    if not validate_image_file(mask_file):
                        validation_details.append(
                            {
                                "type": "invalid_file",
                                "severity": "warning",
                                "message": f"Invalid mask file {mask_file.name}",
                            }
                        )
        else:
            validation_details.append(
                {"type": "dataset_type", "severity": "error", "message": "Unsupported dataset type provided."}
            )

        if any(detail["severity"] == "error" for detail in validation_details):
            return {"status": "error", "details": validation_details}
        elif validation_details:
            return {"status": "warning", "details": validation_details}
        return {"status": "success", "details": []}

    except Exception as e:
        logging.error(traceback.format_exc())
        return {"status": "error", "details": [{"type": "validation_failure", "severity": "error", "message": str(e)}]}


def validate_image_file(image_path: Path) -> bool:
    """
    Check if the file is a valid image format.

    Args:
        image_path (Path): File path of the image.

    Returns:
        bool: True if valid image file, False otherwise.
    """
    try:
        with Image.open(image_path) as img:
            return img.format in ALLOWED_IMAGE_FORMATS
    except Exception:
        return False


def upload_to_s3(dataset_path: Path, dataset_type: str):
    """
    Upload validated dataset to AWS S3.

    Args:
        dataset_path (Path): Path of the validated dataset.
        dataset_type (str): Type of dataset being uploaded.
    """
    try:
        s3_client = boto3.client(
            "s3",
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            region_name=AWS_REGION,
        )
        for root, _, files in os.walk(dataset_path):
            for file in files:
                file_path = os.path.join(root, file)
                s3_key = os.path.relpath(file_path, dataset_path)
                s3_client.upload_file(file_path, AWS_S3_BUCKET, s3_key)
        logging.info(f"Dataset of type '{dataset_type}' successfully uploaded to S3 bucket '{AWS_S3_BUCKET}'.")
    except ClientError as e:
        logging.error(f"Failed to upload dataset to S3: {e}")


def post_upload_validation(dataset_path: Path):
    """
    Trigger post-upload dataset quality checks in the cloud (Stub implementation).

    Args:
        dataset_path (Path): Path of the dataset.
    """
    logging.info("Post-upload validation triggered for dataset quality checks (Stub implementation).")