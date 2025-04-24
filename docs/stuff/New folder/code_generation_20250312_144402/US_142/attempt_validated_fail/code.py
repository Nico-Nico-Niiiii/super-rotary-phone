import os
import json
import logging
import base64
from pathlib import Path
from typing import List, Dict, Union
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, UnidentifiedImageError
import pydicom
from pydicom.errors import InvalidDicomError
import requests
from dataclasses import dataclass

# Logging Configuration
LOG_DIR = "/var/logs/extraction/"
os.makedirs(LOG_DIR, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIR, "extraction.log"),
    level=logging.INFO,
    format="%(message)s",
)

# Constants
SUPPORTED_FORMATS = {".jpg", ".png", ".bmp", ".dcm"}
BATCH_SIZE_LIMIT = 100
VALIDATION_API_URL = "https://validation-module.local/validate-image"

@dataclass
class FileMetadata:
    file_path: str
    file_name: str
    file_extension: str

@dataclass
class BatchResult:
    processed_files: List[str]
    skipped_files: List[str]
    errors: List[Dict[str, Union[str, int]]]

class ImageProcessor:
    def __init__(self):
        self.logger = logging.getLogger("ImageProcessor")

    def validate_file_path(self, file_path: str) -> bool:
        """Validate file path for existence and local storage."""
        path = Path(file_path)
        if not path.exists() or not path.is_file():
            self.log_error(file_path, "File does not exist or is not a valid file.")
            return False
        if path.parts[0] in ["//", "\\\\"]:  # Network paths
            self.log_error(file_path, "Network/cloud storage paths are not supported.")
            return False
        return True

    def validate_file_format(self, file_path: str) -> bool:
        """Validate file format against supported formats."""
        extension = Path(file_path).suffix.lower()
        if extension not in SUPPORTED_FORMATS:
            self.log_error(file_path, "Unsupported file format.")
            return False
        return True

    def extract_image_data(self, file_path: str) -> Union[bytes, None]:
        """Extract image data from supported formats."""
        try:
            extension = Path(file_path).suffix.lower()
            if extension in {".jpg", ".png", ".bmp"}:
                with Image.open(file_path) as img:
                    img.verify()  # Verify image integrity
                    with open(file_path, "rb") as f:
                        return f.read()
            elif extension == ".dcm":
                dicom_data = pydicom.dcmread(file_path)
                return dicom_data.pixel_array.tobytes()
        except (UnidentifiedImageError, InvalidDicomError, IOError) as e:
            self.log_error(file_path, f"Failed to extract image data: {str(e)}")
            return None

    def process_batch(self, file_paths: List[str]) -> BatchResult:
        """Process a batch of files."""
        if len(file_paths) > BATCH_SIZE_LIMIT:
            self.log_warning(
                None,
                f"Batch size limit exceeded. Only the first {BATCH_SIZE_LIMIT} files will be processed.",
            )
            file_paths = file_paths[:BATCH_SIZE_LIMIT]

        processed_files = []
        skipped_files = []
        errors = []

        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = {executor.submit(self.process_file, file_path): file_path for file_path in file_paths}
            for future in futures:
                file_path = futures[future]
                try:
                    result = future.result()
                    if result:
                        processed_files.append(file_path)
                    else:
                        skipped_files.append(file_path)
                except Exception as e:
                    errors.append({"file_path": file_path, "error": str(e)})

        return BatchResult(processed_files, skipped_files, errors)

    def process_file(self, file_path: str) -> bool:
        """Process a single file."""
        if not self.validate_file_path(file_path) or not self.validate_file_format(file_path):
            return False

        image_data = self.extract_image_data(file_path)
        if image_data is None:
            return False

        metadata = FileMetadata(
            file_path=file_path,
            file_name=Path(file_path).name,
            file_extension=Path(file_path).suffix,
        )
        return self.send_to_validation_module(image_data, metadata)

    def send_to_validation_module(self, image_data: bytes, metadata: FileMetadata) -> bool:
        """Send image data to validation module."""
        payload = {
            "image_data": base64.b64encode(image_data).decode("utf-8"),
            "metadata": {
                "file_name": metadata.file_name,
                "file_extension": metadata.file_extension,
                "file_size": len(image_data),
            },
        }
        try:
            response = requests.post(VALIDATION_API_URL, json=payload, timeout=10)
            response_data = response.json()
            if response_data.get("status") == "success":
                return True
            else:
                self.log_error(metadata.file_path, response_data.get("message", "Validation failed."))
                return False
        except requests.RequestException as e:
            self.log_error(metadata.file_path, f"Failed to communicate with validation module: {str(e)}")
            return False

    def log_error(self, file_path: Union[str, None], message: str):
        """Log error in JSON format."""
        log_entry = {
            "timestamp": self.get_timestamp(),
            "file_name": Path(file_path).name if file_path else None,
            "status": "error",
            "message": message,
        }
        self.logger.error(json.dumps(log_entry))

    def log_warning(self, file_path: Union[str, None], message: str):
        """Log warning in JSON format."""
        log_entry = {
            "timestamp": self.get_timestamp(),
            "file_name": Path(file_path).name if file_path else None,
            "status": "warning",
            "message": message,
        }
        self.logger.warning(json.dumps(log_entry))

    @staticmethod
    def get_timestamp() -> str:
        """Get current timestamp in ISO format."""
        from datetime import datetime

        return datetime.utcnow().isoformat() + "Z"


# Example Usage
if __name__ == "__main__":
    processor = ImageProcessor()
    directory = "/path/to/images"
    file_paths = [str(file) for file in Path(directory).glob("*")]

    if not file_paths:
        processor.log_error(None, "No valid image files found in the directory.")
    else:
        result = processor.process_batch(file_paths)
        print("Processed Files:", result.processed_files)
        print("Skipped Files:", result.skipped_files)
        print("Errors:", result.errors)