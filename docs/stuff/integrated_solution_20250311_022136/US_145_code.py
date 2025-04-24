# Corrected Version of the Image Quality Validation System Code

from fastapi import FastAPI, HTTPException, File, Form
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel
from typing import List, Dict, Optional
from redis import Redis
import cv2
import numpy as np
import pydicom
import os
import uvicorn
from PIL import Image
from fastapi.responses import JSONResponse


# FastAPI app initialization
app = FastAPI()

# Redis client for in-memory duplicate caching
redis_client = Redis(host="localhost", port=6379, decode_responses=True)

# Configuration constants
MIN_RESOLUTION = (512, 512)
BLANK_THRESHOLD = 90.0


# Models
class ImageMetadata(BaseModel):
    image_id: str
    file_name: str
    format: str
    resolution: Optional[Dict[str, int]]
    is_blank: bool
    sop_instance_uid: Optional[str]
    validation_status: str
    error_messages: List[str]


class ValidationRequest(BaseModel):
    operation_type: str
    images: List[Dict[str, str]]


class MetadataExtractionRequest(BaseModel):
    file_path: str


class PreprocessingRequest(BaseModel):
    validated_images: List[Dict[str, str]]


# Helper Functions
def validate_resolution(image_path: str) -> Optional[str]:
    """
    Validate the resolution of an image file.
    Returns an error message if the resolution is below the threshold, else None.
    """
    try:
        image = cv2.imread(image_path)
        if image is None:
            return "Corrupted or unsupported image file. Failed to extract resolution."
        height, width = image.shape[:2]
        if width < MIN_RESOLUTION[0] or height < MIN_RESOLUTION[1]:
            return f"Image resolution is below the required minimum of {MIN_RESOLUTION[0]}x{MIN_RESOLUTION[1]} pixels."
        return None
    except Exception as e:
        return f"Error during resolution validation: {str(e)}"


def detect_blank_image(image_path: str) -> Optional[str]:
    """
    Detect if an image is completely or predominantly blank based on pixel intensity distribution.
    Returns an error message if the image is blank, else None.
    """
    try:
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if image is None:
            return "Corrupted or unsupported image file. Failed to detect blank status."
        pixel_values = np.array(image)
        blank_pixels = np.sum(pixel_values <= 10)
        total_pixels = pixel_values.size
        blank_percentage = (blank_pixels / total_pixels) * 100
        if blank_percentage >= BLANK_THRESHOLD:
            return "Blank image detected. This image cannot be used for further processing."
        return None
    except Exception as e:
        return f"Error during blank image detection: {str(e)}"


def detect_duplicate_dicom(dicom_path: str) -> Optional[str]:
    """
    Detect duplicates based on SOPInstanceUID from the DICOM metadata.
    Returns an error message if a duplicate is found, else None.
    """
    try:
        dataset = pydicom.dcmread(dicom_path)
        if not hasattr(dataset, "SOPInstanceUID"):
            return "Invalid DICOM file. SOP Instance UID is missing or corrupted."
        sop_instance_uid = dataset.SOPInstanceUID
        if redis_client.get(sop_instance_uid):
            return f"Duplicate DICOM image detected. SOP Instance UID: {sop_instance_uid}."
        redis_client.set(sop_instance_uid, 1)
        return None
    except Exception as e:
        return f"Error during duplicate DICOM detection: {str(e)}"


# API Endpoints
@app.post("/validate")
async def validate_images(request: ValidationRequest):
    """
    Validate images for resolution, blank detection, and duplicate DICOM detection.
    """
    if not request.images:
        return JSONResponse(
            status_code=400, content={"status": "FAILURE", "message": "No images provided for validation."}
        )

    validated_images = []

    for image_info in request.images:
        image_id = image_info["image_id"]
        file_path = image_info["file_path"]
        file_format = os.path.splitext(file_path)[1].lower()[1:]
        error_messages = []

        # Format validation
        if file_format not in ["jpeg", "jpg", "png", "dicom", "dcm"]:
            error_messages.append("Unsupported image format. Valid formats are JPEG, PNG, and DICOM.")

        # Individual validations
        if file_format in ["jpeg", "jpg", "png"]:
            resolution_error = validate_resolution(file_path)
            if resolution_error:
                error_messages.append(resolution_error)

            blank_error = detect_blank_image(file_path)
            if blank_error:
                error_messages.append(blank_error)

        elif file_format in ["dicom", "dcm"]:
            duplicate_error = detect_duplicate_dicom(file_path)
            if duplicate_error:
                error_messages.append(duplicate_error)

        validation_status = "VALID" if not error_messages else "INVALID"
        validated_images.append(
            {
                "image_id": image_id,
                "validation_status": validation_status,
                "error_messages": error_messages,
            }
        )

    # Summary
    summary = {
        "total_images": len(request.images),
        "valid_images": sum(1 for val in validated_images if val["validation_status"] == "VALID"),
        "invalid_images": sum(1 for val in validated_images if val["validation_status"] == "INVALID"),
        "errors": sum(len(val["error_messages"]) for val in validated_images if val["error_messages"]),
    }

    return {"status": "SUCCESS", "validated_images": validated_images, "summary": summary}


@app.post("/metadata/dicom")
async def extract_metadata(request: MetadataExtractionRequest):
    """
    Extract metadata from the provided DICOM file.
    """
    try:
        dataset = pydicom.dcmread(request.file_path)
        if not hasattr(dataset, "SOPInstanceUID"):
            return JSONResponse(
                status_code=400, content={"status": "FAILURE", "message": "Invalid DICOM file. SOP Instance UID missing."}
            )
        return {"status": "SUCCESS", "sop_instance_uid": dataset.SOPInstanceUID}
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "FAILURE", "message": f"Error: {str(e)}"})


@app.post("/preprocess")
async def preprocess_images(request: PreprocessingRequest):
    """
    Simulate transferring validated images to preprocessing module.
    """
    return {"status": "SUCCESS", "message": "Images successfully transferred for preprocessing."}


# Run the app
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
