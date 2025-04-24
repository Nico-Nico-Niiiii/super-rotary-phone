# Core Implementation of the Specification
import os
import re
import json
import logging
import base64
from pathlib import Path
from typing import List, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image, UnidentifiedImageError
import pydicom
import requests
from dataclasses import dataclass, field


# Dataclass Definitions

@dataclass
class FileMetadata:
    file_path: str
    file_name: str
    file_extension: str


@dataclass
class BatchResult:
    processed_files: List[str] = field(default_factory=list)
    skipped_files: List[str] = field(default_factory=list)
    errors: List[dict] = field(default_factory=list)


# Logging Setup
LOG_DIRECTORY = "/var/logs/extraction/"
os.makedirs(LOG_DIRECTORY, exist_ok=True)
logging.basicConfig(
    filename=os.path.join(LOG_DIRECTORY, "extraction.log"),
    level=logging.INFO,
    format=json.dumps({"timestamp": "%(asctime)s", "level": "%(levelname)s", "message": "%(message)s"}),
)


def log_event(file_name: Optional[str], status: str, message: str):
    log_entry = {"file_name": file_name, "status": status, "message": message}
    logging.info(json.dumps(log_entry))


class FileValidator:
    SUPPORTED_FORMATS = {".jpg", ".png", ".bmp", ".dcm"}

    @staticmethod
    def validate_path(file_path: str) -> bool:
        if not os.path.exists(file_path):
            log_event(None, "error", f"Path '{file_path}' does not exist.")
            return False
        if not os.path.isabs(file_path):
            log_event(None, "error", f"Path '{file_path}' must be absolute.")
            return False
        if re.search(r"(\\|//).*", file_path):
            log_event(None, "error", f"Path '{file_path}' points to a network directory.")
            return False
        return True

    @staticmethod
    def validate_format(file_path: str) -> bool:
        file_extension = Path(file_path).suffix.lower()
        if file_extension not in FileValidator.SUPPORTED_FORMATS:
            log_event(file_path, "error", f"Unsupported file format: {file_extension}.")
            return False
        return True


class ImageExtractor:
    @staticmethod
    def extract_image_data(file_path: str) -> Optional[bytes]:
        file_extension = Path(file_path).suffix.lower()
        try:
            if file_extension in {".jpg", ".png", ".bmp"}:
                with Image.open(file_path) as img:
                    img.verify()  # Preliminary corruption check
                    with open(file_path, "rb") as fh:
                        return fh.read()
            elif file_extension == ".dcm":
                dicom = pydicom.dcmread(file_path)
                return dicom.pixel_array.tobytes()
        except (UnidentifiedImageError, pydicom.errors.InvalidDicomError, FileNotFoundError) as e:
            log_event(file_path, "error", f"Failed to extract image data: {str(e)}")
            return None


class BatchProcessor:
    BATCH_SIZE = 100

    def __init__(self, integration_module_url: str):
        self.integration_module_url = integration_module_url

    def process_files(self, file_paths: List[str]) -> BatchResult:
        if len(file_paths) > self.BATCH_SIZE:
            log_event(None, "warning", "Batch size exceeded limit. Only processing the first 100 files.")
            file_paths = file_paths[: self.BATCH_SIZE]

        result = BatchResult()

        with ThreadPoolExecutor() as executor:
            future_to_file = {executor.submit(self.process_single_file, file_path): file_path for file_path in file_paths}

            for future in as_completed(future_to_file):
                file_path = future_to_file[future]
                try:
                    success, msg = future.result()
                    if success:
                        result.processed_files.append(file_path)
                    else:
                        result.skipped_files.append(file_path)
                        result.errors.append({"file": file_path, "reason": msg})
                except Exception as e:
                    log_event(file_path, "error", f"Unhandled error during processing: {str(e)}")
                    result.errors.append({"file": file_path, "reason": "Unhandled error."})

        return result

    def process_single_file(self, file_path: str) -> (bool, str):
        if not FileValidator.validate_path(file_path):
            return False, "Invalid file path."
        if not FileValidator.validate_format(file_path):
            return False, "Unsupported file format."

        image_data = ImageExtractor.extract_image_data(file_path)
        if not image_data:
            return False, "Image extraction failed."

        metadata = {
            "file_name": Path(file_path).name,
            "file_extension": Path(file_path).suffix,
            "file_size": os.path.getsize(file_path),
        }

        success, msg = self.send_to_validation_module(image_data, metadata)
        return success, msg

    def send_to_validation_module(self, image_data: bytes, metadata: dict) -> (bool, str):
        try:
            payload = {
                "image_data": base64.b64encode(image_data).decode("utf-8"),
                "metadata": metadata,
            }
            response = requests.post(f"{self.integration_module_url}/validate-image", json=payload, timeout=10)

            if response.status_code == 200:
                response_data = response.json()
                status = response_data.get("status", "")
                if status == "success":
                    return True, "Validation succeeded."
                else:
                    return False, response_data.get("message", "Unknown validation error.")
            else:
                return False, f"HTTP error: {response.status_code}."
        except requests.RequestException as e:
            log_event(metadata["file_name"], "error", f"Validation module request failed: {str(e)}")
            return False, "Validation module communication failed."


# Main Execution or Integration
if __name__ == "__main__":
    batch_processor = BatchProcessor(integration_module_url="http://localhost:5000")
    directory = "/path/to/images"

    if not FileValidator.validate_path(directory):
        print("Invalid directory path.")
    else:
        file_paths = [str(f) for f in Path(directory).glob("*") if FileValidator.validate_format(f)]
        if not file_paths:
            log_event(None, "error", f"No valid image files found in directory: {directory}.")
        else:
            result = batch_processor.process_files(file_paths)
            print("Batch Processing Complete.")
            print("Processed Files:", result.processed_files)
            print("Skipped Files:", result.skipped_files)
            print("Errors:", result.errors)