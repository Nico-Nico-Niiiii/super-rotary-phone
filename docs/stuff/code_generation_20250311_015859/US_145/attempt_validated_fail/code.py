from fastapi import FastAPI, HTTPException, UploadFile, Form
from fastapi.responses import JSONResponse
import os
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor
from pydantic import BaseModel
import cv2
import numpy as np
import pydicom
from redis import Redis
from fastapi.logger import logger
import uvicorn
from PIL import Image

# Initialization of FastAPI app
app = FastAPI()

# Redis client for in-memory duplicate caching
redis_client = Redis(host='localhost', port=6379, decode_responses=True)

# Configuration constants
MIN_RESOLUTION = (512, 512)
BLANK_THRESHOLD = 90.0


# DATA MODELS
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


# HELPER FUNCTIONS
def validate_resolution(image_path: str) -> Optional[str]:
    try:
        image = cv2.imread(image_path)
        if image is None:
            return "Failed to read the image file. File may be corrupted or unsupported."
        height, width, _ = image.shape
        if width < MIN_RESOLUTION[0] or height < MIN_RESOLUTION[1]:
            return f"Image resolution is below the required minimum of {MIN_RESOLUTION[0]}x{MIN_RESOLUTION[1]} pixels."
        return None
    except Exception as e:
        logger.error(f"Error during resolution validation: {str(e)}")
        return "Error during resolution validation."


def detect_blank_image(image_path: str) -> Optional[str]:
    try:
        image = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if image is None:
            return "Failed to read the image file. File may be corrupted or unsupported."
        pixel_values = np.array(image)
        total_pixels = pixel_values.size
        blank_pixels = np.sum(pixel_values <= 10)
        blank_percentage = (blank_pixels / total_pixels) * 100
        if blank_percentage >= BLANK_THRESHOLD:
            return "Blank image detected. Inferencing cannot proceed with blank images."
        return None
    except Exception as e:
        logger.error(f"Error during blank image detection: {str(e)}")
        return "Error during blank image detection."


def detect_duplicate_dicom(dicom_path: str) -> Optional[str]:
    try:
        dataset = pydicom.dcmread(dicom_path)
        if not hasattr(dataset, 'SOPInstanceUID'):
            return "Invalid DICOM file. SOP Instance UID is missing or corrupted."

        sop_instance_uid = dataset.SOPInstanceUID
        cached_uid = redis_client.get(sop_instance_uid)

        if cached_uid:
            return f"Duplicate DICOM image detected. SOP Instance UID: {sop_instance_uid}."
        redis_client.set(sop_instance_uid, 1)
        return None
    except Exception as e:
        logger.error(f"Error during DICOM validation: {str(e)}")
        return "Error during duplicate DICOM detection."


# API ENDPOINTS
@app.post("/validate")
async def validate_images(request: ValidationRequest):
    if not request.images:
        return JSONResponse(
            status_code=400,
            content={"status": "FAILURE", "error": "No images provided for validation."}
        )

    validated_images = []

    for image_info in request.images:
        image_id = image_info["image_id"]
        file_path = image_info["file_path"]

        file_format = os.path.splitext(file_path)[1].lower()[1:]
        if file_format not in ["jpeg", "jpg", "png", "dicom", "dcm"]:
            validated_images.append({
                "image_id": image_id,
                "validation_status": "INVALID",
                "error_messages": ["Unsupported image format. Please provide images in JPEG, PNG, or DICOM format."]
            })
            continue

        error_messages = []

        # Resolution validation
        resolution_error = validate_resolution(file_path)
        if resolution_error:
            error_messages.append(resolution_error)

        # Blank detection
        blank_error = detect_blank_image(file_path)
        if blank_error:
            error_messages.append(blank_error)

        # DICOM duplicate detection
        if file_format in ["dicom", "dcm"]:
            dicom_duplicate_error = detect_duplicate_dicom(file_path)
            if dicom_duplicate_error:
                error_messages.append(dicom_duplicate_error)

        validation_status = "VALID" if not error_messages else "INVALID"
        validated_images.append({
            "image_id": image_id,
            "validation_status": validation_status,
            "error_messages": error_messages
        })

    summary = {
        "total_images": len(request.images),
        "valid_images": sum(1 for img in validated_images if img["validation_status"] == "VALID"),
        "invalid_images": sum(1 for img in validated_images if img["validation_status"] == "INVALID"),
        "errors": [img["error_messages"] for img in validated_images if img["error_messages"]]
    }

    return {
        "status": "SUCCESS",
        "validated_images": validated_images,
        "summary": summary
    }


@app.post("/metadata/dicom")
async def extract_metadata(request: MetadataExtractionRequest):
    try:
        dataset = pydicom.dcmread(request.file_path)
        if not hasattr(dataset, 'SOPInstanceUID'):
            return JSONResponse(
                status_code=400,
                content={"status": "FAILURE", "error": "Invalid DICOM file. SOP Instance UID is missing or corrupted."}
            )

        return {"status": "SUCCESS", "sop_instance_uid": dataset.SOPInstanceUID}
    except Exception as e:
        logger.error(f"Error during metadata extraction: {str(e)}")
        return JSONResponse(
            status_code=500,
            content={"status": "FAILURE", "error": "Error during metadata extraction."}
        )


@app.post("/preprocess")
async def preprocess_images(request: PreprocessingRequest):
    # Simulate the preprocessing step (integration stub)
    return {"status": "SUCCESS", "message": "Images successfully transferred to preprocessing module."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)