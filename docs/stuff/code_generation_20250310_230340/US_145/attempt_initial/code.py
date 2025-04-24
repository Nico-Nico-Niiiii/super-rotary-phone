```python
from fastapi import FastAPI, HTTPException, File, UploadFile
from fastapi.responses import JSONResponse
from concurrent.futures import ThreadPoolExecutor
from typing import List, Dict, Optional
from PIL import Image
import numpy as np
import pydicom
from pydicom.errors import InvalidDicomError
import redis
import cv2
import os
import logging
from pydantic import BaseModel

# Initialize FastAPI app
app = FastAPI()

# Logger setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis setup for in-memory metadata storage
redis_client = redis.Redis(host="localhost", port=6379, db=0)

# Configuration variables
MIN_RESOLUTION = (512, 512)
BLANK_THRESHOLD = 10
BLANK_PERCENTAGE = 90

# Data models
class ImageValidationRequest(BaseModel):
    operation_type: str
    images: List[Dict[str, str]]

class ImageValidationSummary(BaseModel):
    image_id: str
    validation_status: str
    error_messages: List[str]

class ValidationResponse(BaseModel):
    status: str
    validated_images: List[ImageValidationSummary]
    summary: Dict[str, int]

class MetadataExtractionRequest(BaseModel):
    file_path: str

class PreprocessRequest(BaseModel):
    validated_images: List[Dict[str, str]]

# Validation service
class ValidationService:
    @staticmethod
    def validate_resolution(image: Image.Image) -> Optional[str]:
        if image.width < MIN_RESOLUTION[0] or image.height < MIN_RESOLUTION[1]:
            return f"Image resolution is below the required minimum of {MIN_RESOLUTION[0]}x{MIN_RESOLUTION[1]} pixels."
        return None

    @staticmethod
    def detect_blank_image(image: Image.Image) -> Optional[str]:
        grayscale = image.convert("L")
        histogram = np.array(grayscale.getdata())
        low_intensity = np.sum(histogram < BLANK_THRESHOLD)
        total_pixels = histogram.size
        blank_percentage = (low_intensity / total_pixels) * 100
        if blank_percentage >= BLANK_PERCENTAGE:
            return "Blank image detected. Inferencing cannot proceed with blank images."
        return None

    @staticmethod
    def detect_duplicate_dicom(file_path: str, metadata_service) -> Optional[str]:
        try:
            sop_instance_uid = metadata_service.extract_sop_instance_uid(file_path)
        except Exception as e:
            return f"Error reading DICOM metadata: {e}"
        if redis_client.get(sop_instance_uid):
            return f"Duplicate DICOM image detected. SOP Instance UID: {sop_instance_uid}."
        redis_client.set(sop_instance_uid, True)
        return None

# Metadata service
class MetadataService:
    @staticmethod
    def extract_sop_instance_uid(file_path: str) -> str:
        try:
            dicom_data = pydicom.dcmread(file_path)
            return dicom_data.SOPInstanceUID
        except InvalidDicomError:
            raise ValueError("Invalid DICOM file. SOP Instance UID is missing or corrupted.")

# API Endpoints
@app.post("/validate", response_model=ValidationResponse)
def validate_images(request: ImageValidationRequest):
    if not request.images:
        raise HTTPException(status_code=400, detail="No images provided for validation.")
    
    validated_images = []
    total_valid, total_invalid = 0, 0
    errors = []

    def validate_single_image(image_data: Dict[str, str]) -> ImageValidationSummary:
        image_id = image_data["image_id"]
        file_path = image_data["file_path"]
        errors = []
        try:
            if file_path.lower().endswith(('.jpg', '.jpeg', '.png')):
                image = Image.open(file_path)
                errors.append(ValidationService.validate_resolution(image))
                errors.append(ValidationService.detect_blank_image(image))
            elif file_path.lower().endswith('.dcm'):
                errors.append(ValidationService.detect_duplicate_dicom(file_path, MetadataService))
            else:
                raise ValueError("Unsupported image format.")
        except Exception as e:
            errors.append(str(e))
        
        errors = [err for err in errors if err is not None]
        validation_status = "VALID" if not errors else "INVALID"
        return ImageValidationSummary(
            image_id=image_id,
            validation_status=validation_status,
            error_messages=errors,
        )
    
    with ThreadPoolExecutor() as executor:
        results = list(executor.map(validate_single_image, request.images))

    for result in results:
        validated_images.append(result)
        if result.validation_status == "VALID":
            total_valid += 1
        else:
            total_invalid += 1
            errors.extend(result.error_messages)
    
    return ValidationResponse(
        status="SUCCESS",
        validated_images=validated_images,
        summary={
            "total_images": len(validated_images),
            "valid_images": total_valid,
            "invalid_images": total_invalid,
            "errors": errors,
        },
    )

@app.post("/metadata/dicom")
def extract_dicom_metadata(request: MetadataExtractionRequest):
    try:
        sop_instance_uid = MetadataService.extract_sop_instance_uid(request.file_path)
        return {"status": "SUCCESS", "sop_instance_uid": sop_instance_uid}
    except Exception as e:
        return {"status": "FAILURE", "message": str(e)}

@app.post("/preprocess")
def preprocess_validated_images(request: PreprocessRequest):
    # Simulate sending data to preprocessing step
    try:
        if not request.validated_images:
            return {"status": "FAILURE", "message": "No images provided for preprocessing."}
        # Here we would typically send validated images to the preprocess API
        return {"status": "SUCCESS", "message": "Preprocessing initiated for validated images."}
    except Exception as e:
        return {"status": "FAILURE", "message": f"An error occurred: {e}"}
```