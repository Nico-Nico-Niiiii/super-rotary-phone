# Module Relationship Documentation

This document provides detailed information about the relationships between modules, functions, and classes.

## Overview

### Modules
- US_141_code.py
- US_142_code.py
- US_143_code.py
- US_144_code.py
- US_145_code.py
- US_146_code.py
- US_147_code.py

## Module Dependencies

### US_141_code.py
*Module for uploading and validating datasets, with AWS S3 integration and FastAPI endpoints.*

**Imports modules:**
- os
- zipfile
- logging
- tempfile
- typing
- fastapi
- fastapi.responses
- botocore.exceptions
- PIL
- boto3

**Entry points:**
- upload_dataset

**Functions:**
- `extract_and_validate_zip`: Extracts a ZIP file, validates its structure, and returns validation results
  - Calls: `validate_folder_structure`
  - Called by: `upload_dataset`
- `validate_folder_structure`: Validates the folder structure and content of the dataset
  - Called by: `extract_and_validate_zip`
- `upload_to_s3`: Uploads a file to an S3 bucket with retries and error handling
  - Called by: `upload_dataset`
- `upload_dataset`: Endpoint to upload a dataset ZIP file
  - Calls: `extract_and_validate_zip`, `upload_to_s3`

**Classes:**
- `ValidationError`: Custom exception for validation errors
  - Inherits from: `Exception`
  - Used by: `extract_and_validate_zip`
  - Instantiated by: `extract_and_validate_zip`

### US_142_code.py
*None*

**Imports modules:**
- os
- re
- json
- logging
- base64
- pathlib
- typing
- concurrent.futures
- PIL.Image
- pydicom
- requests
- dataclasses

**Entry points:**
- log_event

**Functions:**
- `log_event`: No documentation available
  - Calls: `logging.Formatter.formatTime`

**Classes:**
- `FileMetadata`: No documentation available
  - Inherits from: `dataclass`
- `BatchResult`: No documentation available
  - Inherits from: `dataclass`

### US_143_code.py
*No module documentation available.*

**Imports modules:**
- fastapi
- fastapi
- fastapi
- fastapi.responses
- pydantic
- typing
- os
- requests
- pydicom
- cv2
- pathlib
- shutil
- logging
- hashlib
- aiohttp
- asyncio
- datetime
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy.ext.declarative
- sqlalchemy.orm

**Entry points:**
- validate_image
- preprocess_image

**Functions:**
- `validate_image`: Validates an image for format, resolution, metadata and checksum integrity
  - Calls: `log_error`, `hashlib.md5`, `pydicom.dcmread`, `open`, `str`, `ValueError`, `cv2.imread`, `Path`
- `preprocess_image`: Converts image to JPEG, resizes, adjusts contrast and reduces noise
  - Calls: `cv2.resize`, `pydicom.dcmread`, `cv2.imwrite`, `file_path.replace`, `cv2.normalize`, `cv2.imread`, `Path`
- `log_error`: Logs errors into the database
  - Calls: `Logs`, `session.commit`, `session.add`
  - Called by: `validate_image`

**Classes:**
- `Config`: No documentation available
- `Logs`: No documentation available
  - Inherits from: `Base`
- `ImageMetadata`: No documentation available
  - Inherits from: `Base`
- `RetrieveImagesRequest`: No documentation available
  - Inherits from: `BaseModel`

### US_144_code.py
*None*

**Imports modules:**
- os
- json
- logging
- typing
- dataclasses
- fastapi
- fastapi.responses
- PIL.Image
- pydicom
- pydicom.errors
- datetime
- sqlalchemy
- sqlalchemy.orm
- sqlalchemy.ext.declarative
- celery

**Entry points:**
- upload_files
- get_logs

**Functions:**
- `validate_format`: No documentation available
  - Calls: `pydicom.dcmread`, `Image.open`
  - Called by: `process_batch`
- `validate_metadata`: No documentation available
  - Called by: `process_batch`
- `enforce_file_size_limit`: No documentation available
  - Called by: `process_batch`
- `cleanup_files`: No documentation available
  - Calls: `os.path.exists`, `os.remove`
  - Called by: `process_batch`
- `process_batch`: No documentation available
  - Calls: `os.path.getsize`, `enforce_file_size_limit`, `validate_format`, `validate_metadata`, `cleanup_files`
  - Instantiates: `ValidationResult`
  - Called by: `upload_files`
- `upload_files`: No documentation available
  - Calls: `json.loads`, `process_batch.delay`
- `get_logs`: No documentation available
  - Calls: `Session`, `query`, `filter`

**Classes:**
- `ValidationLogs`: No documentation available
  - Inherits from: `Base`
  - Used by: `get_logs`
- `ValidationResult`: No documentation available
  - Used by: `process_batch`
  - Instantiated by: `process_batch`

### US_145_code.py
*A FastAPI module for validating image quality, detecting duplicates, and extracting metadata from DICOM files.*

**Imports modules:**
- fastapi
- typing
- pydantic
- PIL.Image
- numpy
- pydicom
- redis
- logging
- os

**Entry points:**
- validate_images
- extract_metadata
- preprocess

**Functions:**
- `validate_images`: Endpoint to validate a list of images based on resolution, blank detection, and duplicate detection
  - Calls: `Validator.validate_image_format`, `Validator.validate_image_resolution`, `Validator.detect_blank_image`, `Validator.detect_duplicate_dicom`
  - Instantiates: `ValidationResult`, `ValidationResponse`
- `extract_metadata`: Endpoint to extract metadata from a DICOM file
  - Calls: `pydicom.dcmread`
- `preprocess`: Endpoint to preprocess validated images

**Classes:**
- `ValidationRequest`: Model for validation request containing operation type and images
  - Inherits from: `BaseModel`
  - Used by: `validate_images`
  - Instantiated by: `validate_images`
- `ValidationResult`: Model for individual image validation result
  - Inherits from: `BaseModel`
  - Used by: `validate_images`
  - Instantiated by: `validate_images`
- `ValidationResponse`: Model for validation response containing status, validated images, and summary
  - Inherits from: `BaseModel`
  - Used by: `validate_images`
  - Instantiated by: `validate_images`
- `Validator`: Utility class for image validation functions
  - Used by: `validate_images`

### US_146_code.py
*No module documentation available.*

**Imports modules:**
- os
- logging
- cv2
- numpy
- PIL
- PIL
- PIL
- typing
- typing
- dask
- dask

**Classes:**
- `ValidationError`: Custom exception for validation errors
  - Inherits from: `Exception`
- `ImagePreprocessingPipeline`: No documentation available
  - Instantiated by: `global`

### US_147_code.py
*No module documentation available.*

**Imports modules:**
- os
- json
- argparse
- glob
- typing
- typing
- typing
- typing
- PIL
- numpy
- math
- concurrent.futures
- logging

**Classes:**
- `PreprocessingConfig`: No documentation available
  - Instantiated by: `global`
- `BatchDataCreation`: No documentation available
  - Instantiated by: `global`

## Function Call Graph

This section shows which functions call other functions across all modules.

- `US_141_code.extract_and_validate_zip` calls:
  - `US_141_code.validate_folder_structure`

- `US_141_code.upload_dataset` calls:
  - `US_141_code.extract_and_validate_zip`
  - `US_141_code.upload_to_s3`

- `US_142_code.log_event` calls:
  - `logging.Formatter.formatTime`

- `US_143_code.log_error` calls:
  - `US_143_code.Logs`
  - `session.add`
  - `session.commit`

- `US_143_code.preprocess_image` calls:
  - `US_143_code.Path`
  - `cv2.imread`
  - `cv2.imwrite`
  - `cv2.normalize`
  - `cv2.resize`
  - `file_path.replace`
  - `pydicom.dcmread`

- `US_143_code.validate_image` calls:
  - `US_143_code.Path`
  - `US_143_code.ValueError`
  - `US_143_code.log_error`
  - `US_143_code.open`
  - `US_143_code.str`
  - `cv2.imread`
  - `hashlib.md5`
  - `pydicom.dcmread`

- `US_144_code.cleanup_files` calls:
  - `os.path.exists`
  - `os.remove`

- `US_144_code.get_logs` calls:
  - `US_144_code.Session`
  - `US_144_code.filter`
  - `US_144_code.query`

- `US_144_code.process_batch` calls:
  - `US_144_code.cleanup_files`
  - `US_144_code.enforce_file_size_limit`
  - `US_144_code.validate_format`
  - `US_144_code.validate_metadata`
  - `os.path.getsize`

- `US_144_code.upload_files` calls:
  - `json.loads`
  - `process_batch.delay`

- `US_144_code.validate_format` calls:
  - `Image.open`
  - `pydicom.dcmread`

- `US_145_code.extract_metadata` calls:
  - `pydicom.dcmread`

- `US_145_code.validate_images` calls:
  - `Validator.detect_blank_image`
  - `Validator.detect_duplicate_dicom`
  - `Validator.validate_image_format`
  - `Validator.validate_image_resolution`
