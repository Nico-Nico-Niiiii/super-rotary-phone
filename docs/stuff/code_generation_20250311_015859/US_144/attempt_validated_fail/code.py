# Python code for Image Data Validation System

import os
from datetime import datetime
from typing import List, Dict, Tuple
from PIL import Image, UnidentifiedImageError
import pydicom
from pydicom.errors import InvalidDicomError
import io
import logging
from flask import Flask, request, jsonify

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Constants
SUPPORTED_FORMATS = ["JPEG", "BMP", "PNG", "DICOM"]
MAX_FILE_SIZE_MB = 50
ERROR_CODES = {
    "EMPTY_BATCH": 101,
    "INVALID_FORMAT": 102,
    "CORRUPTED_FILE": 103,
    "MISSING_METADATA": 104,
    "FILE_TOO_LARGE": 105,
    "UNKNOWN_ERROR": 107
}
SUCCESS_CODE = "000"

# Flask setup
app = Flask(__name__)

#### Classes ####

class ValidationResult:
    """
    Stores validation results for input files (success/error).
    """
    def __init__(self, file_name: str, status: str, message: str):
        self.file_name = file_name
        self.status = status
        self.message = message

class ValidationEngine:
    """
    Handles file validation including format, metadata, corruption,
    and size constraints.
    """
    @staticmethod
    def validate_image_format(file_path: str) -> Tuple[bool, str]:
        try:
            with open(file_path, 'rb') as file:
                file_extension = file_path.split('.')[-1].upper()
                if file_extension == "DICOM":
                    dicom_data = pydicom.dcmread(file_path)
                    return True, "DICOM"
                else:
                    image = Image.open(file)
                    image.verify()  # Verify image integrity
                    if file_extension in SUPPORTED_FORMATS:
                        return True, file_extension
                    else:
                        return False, "Invalid format"
        except (UnidentifiedImageError, InvalidDicomError):
            return False, "Corruption detected"
        except Exception as e:
            logger.error(f"Unknown error validating image format: {str(e)}")
            return False, str(e)

    @staticmethod
    def validate_metadata(file_type: str, metadata: Dict) -> bool:
        if file_type == "DICOM":
            required_fields = ["model_name", "expected_type", "expected_modality"]
            return all(field in metadata for field in required_fields)
        return True  # Non-DICOM formats don't require metadata

    @staticmethod
    def validate_file_size(file_path: str) -> bool:
        file_size_mb = os.path.getsize(file_path) / (1024 * 1024)
        return file_size_mb <= MAX_FILE_SIZE_MB

#### Utility Functions ####

def generate_error_message(status: str, code: int, file_name: str) -> str:
    return f"Error {code}: {status} for {file_name}"

def validate_batch(files: List[str], metadata: Dict) -> List[ValidationResult]:
    validation_results = []
    if not files:
        validation_results.append(
            ValidationResult(file_name=None,
                             status="error",
                             message="Error 101: Batch is empty.")
        )
        return validation_results

    for file_path in files:
        try:
            file_name = os.path.basename(file_path)

            # Validate file size
            if not ValidationEngine.validate_file_size(file_path):
                validation_results.append(
                    ValidationResult(file_name=file_name,
                                     status="error",
                                     message=generate_error_message("File too large", ERROR_CODES["FILE_TOO_LARGE"], file_name))
                )
                continue

            # Validate format
            is_valid_format, file_type = ValidationEngine.validate_image_format(file_path)
            if not is_valid_format:
                validation_results.append(
                    ValidationResult(file_name=file_name,
                                     status="error",
                                     message=generate_error_message(file_type, ERROR_CODES["INVALID_FORMAT"], file_name))
                )
                continue

            # Validate metadata
            if not ValidationEngine.validate_metadata(file_type, metadata):
                validation_results.append(
                    ValidationResult(file_name=file_name,
                                     status="error",
                                     message=generate_error_message("Missing metadata", ERROR_CODES["MISSING_METADATA"], file_name))
                )
                continue

            # Success case
            validation_results.append(
                ValidationResult(file_name=file_name,
                                 status="success",
                                 message=f"Validation successful for {file_name}. Image forwarded for quality validation.")
            )
        except Exception as e:
            logger.error(f"Error processing file {file_path}: {str(e)}")
            validation_results.append(
                ValidationResult(file_name=file_name,
                                 status="error",
                                 message=generate_error_message("Unknown error", ERROR_CODES["UNKNOWN_ERROR"], file_name))
            )

    return validation_results

#### Flask APIs ####

@app.route('/api/v1/upload', methods=['POST'])
def upload_images():
    try:
        files = request.files.getlist("files")
        metadata = request.form.to_dict()

        # Save files temporarily to disk for validation
        temp_dir = "uploads/"
        os.makedirs(temp_dir, exist_ok=True)
        file_paths = []
        for file in files:
            temp_file_path = os.path.join(temp_dir, file.filename)
            file.save(temp_file_path)
            file_paths.append(temp_file_path)

        # Validate batch
        results = validate_batch(file_paths, metadata)

        # Delete temporary files post-validation
        for file_path in file_paths:
            os.remove(file_path)

        return jsonify({"results": [result.__dict__ for result in results]})
    except Exception as e:
        logger.error(f"Error handling upload: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

@app.route('/api/v1/logs', methods=['GET'])
def fetch_logs():
    try:
        file_name = request.args.get("file_name")
        # Simulated log retrieval from database
        logs = [{"file_name": file_name, "status": "success", "message": "Sample log entry"}]
        return jsonify({"logs": logs})
    except Exception as e:
        logger.error(f"Error fetching logs: {str(e)}")
        return jsonify({"error": "Internal Server Error"}), 500

#### Main Execution ####

if __name__ == '__main__':
    app.run(debug=True)