import os
from pathlib import Path
import logging
import json
from logging.handlers import RotatingFileHandler
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, UnidentifiedImageError
import pydicom
from pydicom.errors import InvalidDicomError
from typing import List, Dict, Optional
import base64
import requests
import time

# Logging Configuration
LOG_DIR = "/var/logs/extraction/"
os.makedirs(LOG_DIR, exist_ok=True)
LOG_FILE = os.path.join(LOG_DIR, "extraction.log")

formatter = logging.Formatter(json.dumps({
    "timestamp": "%(asctime)s",
    "file_name": "%(name)s",
    "status": "%(levelname)s",
    "message": "%(message)s"
}))

handler = RotatingFileHandler(LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5)  # 10MB max per file
handler.setFormatter(formatter)

logger = logging.getLogger("ImageProcessor")
logger.setLevel(logging.INFO)
logger.addHandler(handler)


# Data Structures
class FileMetadata:
    def __init__(self, file_path: str, file_name: str, file_extension: str):
        self.file_path = file_path
        self.file_name = file_name
        self.file_extension = file_extension


class BatchResult:
    def __init__(self, processed_files: List[str], skipped_files: List[str], errors: List[dict]):
        self.processed_files = processed_files
        self.skipped_files = skipped_files
        self.errors = errors


# Utility Functions
def validate_file_path(file_path: str) -> bool:
    """
    Validates the given file path.
    - Ensures the file exists.
    - Is not a network path.
    - Is not a directory.
    """
    try:
        if not os.path.exists(file_path):
            return False
        if Path(file_path).is_dir():
            return False
        if any(protocol in file_path for protocol in ["//", "\\\\"]):  # Exclude network paths
            return False
    except Exception as e:
        logger.error(f"Error validating file path: {file_path} - {str(e)}")
        return False
    return True


def validate_file_format(file_path: str) -> bool:
    """
    Validates the file format to ensure it's one of the supported formats.
    """
    valid_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".dcm"}
    extension = Path(file_path).suffix.lower()
    return extension in valid_extensions


def extract_image_data(file_metadata: FileMetadata) -> Optional[bytes]:
    """
    Extracts image data from the provided file based on its format.
    - Handles corrupted files gracefully.
    - Converts `.dcm` files to a compatible format first.
    """
    try:
        if file_metadata.file_extension in {".jpg", ".jpeg", ".png", ".bmp"}:
            with Image.open(file_metadata.file_path) as img:
                img.verify()  # Verifies integrity
                return img.tobytes()
        elif file_metadata.file_extension == ".dcm":
            dicom_data = pydicom.dcmread(file_metadata.file_path)
            pixel_array = dicom_data.pixel_array
            return pixel_array.tobytes()
    except (UnidentifiedImageError, InvalidDicomError):
        logger.warning(f"Corrupted file: {file_metadata.file_path}")
    except Exception as e:
        logger.error(f"Unexpected error during file extraction: {file_metadata.file_name} - {str(e)}")
    return None


def process_batch(file_paths: List[str]) -> BatchResult:
    """
    Processes a batch of file paths.
    - Validates support and existence.
    - Extracts data from valid image files.
    - Logs errors and warnings.
    """
    processed_files = []
    skipped_files = []
    errors = []
    max_batch_size = 100

    if len(file_paths) > max_batch_size:
        logger.warning("Batch size exceeded. Processing first 100 files.")
        file_paths = file_paths[:max_batch_size]

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {}
        for file_path in file_paths:
            futures[executor.submit(validate_and_extract, file_path)] = file_path

        for future in as_completed(futures):
            file_path = futures[future]
            result = future.result()
            if result is None:
                skipped_files.append(file_path)
            else:
                processed_files.append(file_path)
            if isinstance(result, dict) and "error" in result:
                errors.append(result)

    return BatchResult(processed_files, skipped_files, errors)


def validate_and_extract(file_path: str) -> Optional[Dict]:
    """
    Validates the file and extracts its image data if valid.
    Returns None for unsupported or invalid files.
    """
    if not validate_file_path(file_path):
        logger.error(f"Invalid file path: {file_path}")
        return None
    if not validate_file_format(file_path):
        logger.warning(f"Unsupported format: {file_path}")
        return None
    file_metadata = FileMetadata(file_path, Path(file_path).name, Path(file_path).suffix.lower())
    image_data = extract_image_data(file_metadata)
    if image_data is None:
        logger.error(f"Failed to extract image data: {file_path}")
        return {"error": f"Failed to process file {file_metadata.file_name}"}
    return {"success": f"Processed file {file_metadata.file_name}"}


def send_to_validation_module(image_data: bytes, metadata: FileMetadata) -> Dict:
    """
    Sends the extracted image data to the validation module via REST API.
    """
    url = "https://validation-module.local/validate-image"  # Placeholder URL
    payload = {
        "image_data": base64.b64encode(image_data).decode("utf-8"),
        "metadata": {
            "file_name": metadata.file_name,
            "file_extension": metadata.file_extension,
            "file_size": os.path.getsize(metadata.file_path)
        }
    }
    try:
        response = requests.post(url, json=payload)
        return response.json()
    except requests.RequestException as e:
        logger.error(f"Error communicating with validation module: {str(e)}")
        return {"status": "error", "message": str(e)}


def handle_directory_input(directory: str) -> BatchResult:
    """
    Handles a directory input, processing all valid files within.
    """
    if not os.path.exists(directory) or not os.path.isdir(directory):
        logger.error(f"Invalid directory path: {directory}")
        return BatchResult([], [], [{"error": "Invalid or non-existent directory"}])
    
    files = [os.path.join(directory, f) for f in os.listdir(directory)]
    if not files:
        logger.warning("Empty directory. No files to process.")
        return BatchResult([], [], [{"error": "No files found in directory"}])
    
    return process_batch(files)


# Example Usage
if __name__ == "__main__":
    directory_path = "/path/to/image/directory"
    result = handle_directory_input(directory_path)
    print(json.dumps(result.__dict__, indent=4))