```python
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
LOG_FILE = os.path.join(LOG_DIR, "extraction.json")

formatter = logging.Formatter('%(message)s')
handler = RotatingFileHandler(LOG_FILE, maxBytes=10 * 1024 * 1024, backupCount=5)  # 10MB max per log file
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
def log_event(level: str, file_name: str, message: str):
    log_entry = {
        "timestamp": time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()),
        "file_name": file_name,
        "status": level.upper(),
        "message": message
    }
    logger.info(json.dumps(log_entry))


def validate_file_path(file_path: str) -> bool:
    """
    Validates the given file path.
    - Ensures the file exists.
    - Rejects network paths, traversal patterns, and null bytes.
    """
    try:
        if not os.path.exists(file_path):
            return False
        if Path(file_path).is_dir():
            return False
        if any(substr in file_path for substr in ['//', '\\\\', '../', '..\\', '\0']):
            return False
    except Exception as e:
        log_event("error", os.path.basename(file_path), f"Error validating file path: {str(e)}")
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
            if hasattr(dicom_data, 'pixel_array'):
                return dicom_data.pixel_array.tobytes()
            else:
                raise InvalidDicomError("DICOM file has no pixel array.")
    except (UnidentifiedImageError, InvalidDicomError) as e:
        log_event("warning", file_metadata.file_name, f"Corrupted file: {str(e)}")
    except Exception as e:
        log_event("error", file_metadata.file_name, f"Unexpected error during image extraction: {str(e)}")
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
        log_event("warning", "BatchProcessor", "Batch size exceeded. Processing first 100 files.")
        file_paths = file_paths[:max_batch_size]

    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {executor.submit(validate_and_extract, file_path): file_path for file_path in file_paths}

        for future in as_completed(futures):
            file_path = futures[future]
            try:
                result = future.result()
                if result is None:
                    skipped_files.append(file_path)
                    log_event("info", Path(file_path).name, "File was skipped.")
                elif "error" in result:
                    errors.append(result)
                else:
                    processed_files.append(file_path)
            except Exception as e:
                log_event("error", Path(file_path).name, f"Error during batch processing: {str(e)}")

    return BatchResult(processed_files, skipped_files, errors)


def validate_and_extract(file_path: str) -> Optional[Dict]:
    """
    Validates the file and extracts its image data if valid.
    Returns None for unsupported or invalid files.
    """
    if not validate_file_path(file_path):
        log_event("error", Path(file_path).name, "Invalid file path.")
        return None
    if not validate_file_format(file_path):
        log_event("warning", Path(file_path).name, "Unsupported file format.")
        return None

    file_metadata = FileMetadata(file_path, Path(file_path).name, Path(file_path).suffix.lower())
    image_data = extract_image_data(file_metadata)
    if image_data is None:
        log_event("error", file_metadata.file_name, "Failed to extract image data.")
        return {"error": f"Failed to process file {file_metadata.file_name}"}
    return {"success": f"Processed file {file_metadata.file_name}"}


def send_to_validation_module(image_data: bytes, metadata: FileMetadata) -> Dict:
    """
    Sends the extracted image data to the validation module via REST API.
    Enforces HTTPS communication and handles errors gracefully.
    """
    url = "https://validation-module.local/validate-image"
    payload = {
        "image_data": base64.b64encode(image_data).decode("utf-8"),
        "metadata": {
            "file_name": metadata.file_name,
            "file_extension": metadata.file_extension,
            "file_size": os.path.getsize(metadata.file_path)
        }
    }
    try:
        response = requests.post(url, json=payload, timeout=10)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        log_event("error", metadata.file_name, f"Validation module communication error: {str(e)}")
        return {"status": "error", "message": str(e)}


def handle_directory_input(directory: str) -> BatchResult:
    """
    Handles a directory input, processing all valid files within.
    """
    if not os.path.exists(directory) or not os.path.isdir(directory):
        log_event("error", directory, "Invalid directory path.")
        return BatchResult([], [], [{"error": "Invalid or non-existent directory"}])

    files = [os.path.join(directory, f) for f in os.listdir(directory) if os.path.isfile(os.path.join(directory, f))]
    if not files:
        log_event("warning", directory, "Empty directory. No files to process.")
        return BatchResult([], [], [{"error": "No files found in directory"}])

    return process_batch(files)


# Example Usage
if __name__ == "__main__":
    directory_path = "/path/to/image/directory"
    result = handle_directory_input(directory_path)
    print(json.dumps(result.__dict__, indent=4))
```