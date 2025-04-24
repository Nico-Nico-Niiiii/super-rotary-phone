```python
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.responses import JSONResponse
from typing import List, Dict, Optional
from pydantic import BaseModel
from PIL import Image
import numpy as np
import pydicom
from pydicom.errors import InvalidDicomError
import redis
from concurrent.futures import ThreadPoolExecutor
import logging
import os

# Initialize FastAPI app
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("ImageQualityValidation")

# Redis for Duplicate Detection
redis_client = redis.Redis(host="localhost", port=6379, db=0)

# Validation Configuration
MIN_RESOLUTION_WIDTH = 512
MIN_RESOLUTION_HEIGHT = 512
BLANK_THRESHOLD = 10
BLANK_MAX_PERCENTAGE = 90

# Models
class ValidationRequest(BaseModel):
    operation_type: str
    images: List[Dict[str, str]]

class ValidationResult(BaseModel):
    image_id: str
    validation_status: str
    error_messages: List[str]

class ValidationResponse(BaseModel):
    status: str
    validated_images: List[ValidationResult]
    summary: Dict[str, int]

# Utility Functions
class Validator:
    @staticmethod
    def validate_image_resolution(image: Image.Image) -> Optional[str]:
        if image.width < MIN_RESOLUTION_WIDTH or image.height < MIN_RESOLUTION_HEIGHT:
            return "Image resolution is below the required minimum of 512x512 pixels."
        return None

    @staticmethod
    def detect_blank_image(image: Image.Image) -> Optional[str]:
        grayscale = image.convert("L")  # Convert to grayscale
        pixel_data = np.array(grayscale)
        total_pixels = pixel_data.size
        blank_pixels = np.sum(pixel_data < BLANK_THRESHOLD)
        blank_percentage = (blank_pixels / total_pixels) * 100
        if blank_percentage > BLANK_MAX_PERCENTAGE:
            return "Blank image detected. Inferencing cannot proceed with blank images."
        return None

    @staticmethod
    def detect_duplicate_dicom(file: str) -> Optional[str]:
        try:
            dicom_data = pydicom.dcmread(file)
            sop_instance_uid = dicom_data.SOPInstanceUID
            if redis_client.get(sop_instance_uid):
                return f"Duplicate DICOM image detected. SOP Instance UID: {sop_instance_uid}."
            redis_client.set(sop_instance_uid, 1)
        except (InvalidDicomError, AttributeError):
            return "Invalid DICOM file. SOP Instance UID is missing or corrupted."
        return None

    @staticmethod
    def validate_image_format(file: str) -> Optional[str]:
        if not (file.lower().endswith(".jpg") or file.lower().endswith(".png") or file.lower().endswith(".dcm")):
            return "Unsupported image format. Please provide images in JPEG, PNG, or DICOM format."
        return None

# Endpoints
@app.post("/validate", response_model=ValidationResponse)
def validate_images(request: ValidationRequest):
    if not request.images:
        raise HTTPException(status_code=422, detail="No images provided for validation.")
    results = []
    valid_count = 0
    invalid_count = 0
    all_errors = []

    def process_image(image_entry: Dict[str, str]) -> ValidationResult:
        image_id = image_entry["image_id"]
        file_path = image_entry["file_path"]
        error_messages = []

        # Validate format
        format_error = Validator.validate_image_format(file_path)
        if format_error:
            error_messages.append(format_error)

        # Perform Resolution and Blank Image Validation
        try:
            if file_path.endswith((".jpg", ".png")):
                with Image.open(file_path) as img:
                    resolution_error = Validator.validate_image_resolution(img)
                    if resolution_error:
                        error_messages.append(resolution_error)
                    blank_error = Validator.detect_blank_image(img)
                    if blank_error:
                        error_messages.append(blank_error)
            elif file_path.endswith(".dcm"):
                duplicate_error = Validator.detect_duplicate_dicom(file_path)
                if duplicate_error:
                    error_messages.append(duplicate_error)
        except Exception as e:
            error_messages.append(str(e))

        validation_status = "INVALID" if error_messages else "VALID"
        return ValidationResult(
            image_id=image_id, validation_status=validation_status, error_messages=error_messages
        )

    with ThreadPoolExecutor() as executor:
        results = list(executor.map(process_image, request.images))

    for result in results:
        if result.validation_status == "VALID":
            valid_count += 1
        else:
            invalid_count += 1
            all_errors.extend(result.error_messages)

    summary = {
        "total_images": len(request.images),
        "valid_images": valid_count,
        "invalid_images": invalid_count,
        "errors": len(all_errors),
    }

    return ValidationResponse(
        status="SUCCESS",
        validated_images=results,
        summary=summary,
    )


@app.post("/metadata/dicom")
def extract_metadata(file: UploadFile = File(...)):
    try:
        if not file.filename.lower().endswith(".dcm"):
            raise HTTPException(status_code=400, detail="Only DICOM (.dcm) files are supported.")
        dicom_data = pydicom.dcmread(file.file)
        sop_instance_uid = dicom_data.SOPInstanceUID
        return {"status": "SUCCESS", "sop_instance_uid": sop_instance_uid}
    except (InvalidDicomError, AttributeError):
        raise HTTPException(
            status_code=400, detail="Invalid DICOM file. SOP Instance UID is missing or corrupted."
        )


@app.post("/preprocess")
def preprocess(validated_images: List[ValidationResult]):
    if not validated_images:
        raise HTTPException(status_code=422, detail="No validated images provided for preprocessing.")
    # Simulation of preprocessing API logic
    # TODO: Integrate with actual preprocessing API module
    return {"status": "SUCCESS", "message": "Preprocessing initiated for validated images."}
```