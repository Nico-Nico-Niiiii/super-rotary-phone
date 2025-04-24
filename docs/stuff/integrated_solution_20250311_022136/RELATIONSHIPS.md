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
*No module documentation available.*

**Imports modules:**
- fastapi
- fastapi
- fastapi
- fastapi
- fastapi
- fastapi
- fastapi
- fastapi.security
- fastapi.security
- pydantic
- typing
- typing
- typing
- zipfile
- zipfile
- pathlib
- tempfile
- shutil
- os
- boto3
- botocore.exceptions
- PIL
- logging
- traceback

**Entry points:**
- get_user_role
- validate_dataset_structure
- upload_to_s3
- post_upload_validation

**Functions:**
- `get_user_role`: Mock function to check user role based on token; replace in production with actual RBAC check
  - Calls: `mock_user_roles.get`, `Security`, `HTTPException`
- `validate_dataset_structure`: Validates dataset directory structure based on dataset type
  - Calls: `logging.error`, `validation_details.append`, `any`, `validate_image_file`, `f.is_dir`, `masks_folder.iterdir`, `traceback.format_exc`, `str`, `dataset_path.iterdir`, `masks_folder.exists`, `subfolder.iterdir`, `images_folder.exists`, `images_folder.iterdir`
- `validate_image_file`: Check if the file is a valid image format
  - Calls: `Image.open`
  - Called by: `validate_dataset_structure`
- `upload_to_s3`: Upload validated dataset to AWS S3
  - Calls: `logging.error`, `s3_client.upload_file`, `os.walk`, `logging.info`, `boto3.client`
- `post_upload_validation`: Trigger post-upload dataset quality checks in the cloud (Stub implementation)
  - Calls: `logging.info`

**Classes:**
- `ValidationResult`: No documentation available
  - Inherits from: `BaseModel`
- `S3UploadMetadata`: No documentation available
  - Inherits from: `BaseModel`

### US_142_code.py
*None*

**Imports modules:**
- os
- pathlib
- logging
- json
- logging.handlers
- concurrent.futures
- PIL.Image
- PIL.UnidentifiedImageError
- pydicom
- pydicom.errors.InvalidDicomError
- typing
- base64
- requests
- time

**Entry points:**
- __main__

**Functions:**
- `log_event`: No documentation available
  - Calls: `time.strftime`, `logger.info`, `json.dumps`
  - Called by: `validate_file_path`, `extract_image_data`, `process_batch`, `validate_and_extract`, `send_to_validation_module`, `handle_directory_input`
- `validate_file_path`: Validates the given file path
  - Calls: `os.path.exists`, `Path.is_dir`, `log_event`
  - Called by: `validate_and_extract`
- `validate_file_format`: Validates the file format to ensure it's one of the supported formats
  - Calls: `Path.suffix`
  - Called by: `validate_and_extract`
- `extract_image_data`: Extracts image data from the provided file based on its format
  - Calls: `Image.open`, `pydicom.dcmread`, `log_event`
  - Called by: `validate_and_extract`
- `process_batch`: Processes a batch of file paths
  - Calls: `log_event`, `validate_and_extract`, `as_completed`
  - Instantiates: `BatchResult`
  - Called by: `handle_directory_input`
- `validate_and_extract`: Validates the file and extracts its image data if valid
  - Calls: `validate_file_path`, `validate_file_format`, `extract_image_data`, `log_event`
  - Instantiates: `FileMetadata`
  - Called by: `process_batch`
- `send_to_validation_module`: Sends the extracted image data to the validation module via REST API
  - Calls: `base64.b64encode`, `os.path.getsize`, `requests.post`, `log_event`
- `handle_directory_input`: Handles a directory input, processing all valid files within
  - Calls: `os.path.exists`, `os.path.isdir`, `os.listdir`, `os.path.isfile`, `log_event`, `process_batch`
  - Called by: `__main__`

**Classes:**
- `FileMetadata`: No documentation available
  - Used by: `validate_and_extract`, `extract_image_data`, `send_to_validation_module`
  - Instantiated by: `validate_and_extract`
- `BatchResult`: No documentation available
  - Used by: `process_batch`, `handle_directory_input`
  - Instantiated by: `process_batch`, `handle_directory_input`

### US_143_code.py
*No module documentation available.*

**Imports modules:**
- logging
- os
- hashlib
- asyncio
- fastapi
- fastapi
- fastapi
- fastapi
- fastapi.responses
- pydantic
- typing
- typing
- datetime
- aiohttp
- shutil
- PIL
- PIL
- pydicom
- pathlib
- zipfile
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy
- sqlalchemy.ext.declarative
- sqlalchemy.orm
- sqlalchemy.exc

**Entry points:**
- log_error
- preprocess_image

**Functions:**
- `log_error`: No documentation available
  - Calls: `logging.error`, `Log`, `session.close`, `SessionLocal`, `str`, `session.add`, `session.commit`
- `preprocess_image`: No documentation available
  - Calls: `ImageEnhance.Contrast`, `img.resize`, `Image.open`, `img.convert`, `enhancer.enhance`, `img.save`

**Classes:**
- `Config`: No documentation available
- `Log`: No documentation available
  - Inherits from: `Base`
- `ImageMetadata`: No documentation available
  - Inherits from: `Base`
- `RetrieveImagesRequest`: No documentation available
  - Inherits from: `BaseModel`
- `SendToAIRequest`: No documentation available
  - Inherits from: `BaseModel`

### US_144_code.py
*A Python module for validating image data, including format, metadata, corruption, and size constraints. It also provides APIs for uploading images and fetching validation logs.*

**Imports modules:**
- os
- datetime
- typing
- PIL.Image
- pydicom
- pydicom.errors
- flask
- logging
- shutil
- boto3
- sqlite3
- uuid

**Entry points:**
- __main__

**Functions:**
- `initialize_database`: Initializes the SQLite database with tables for validation logs and uploaded files
  - Calls: `sqlite3.connect`
  - Called by: `__main__`
- `generate_error_message`: Generates a formatted error message
  - Called by: `validate_batch`
- `upload_to_s3`: Uploads a file to an S3 bucket
  - Calls: `s3_client.upload_file`, `logger.error`
  - Called by: `validate_batch`
- `log_validation_result`: Logs the validation result to the SQLite database
  - Calls: `sqlite3.connect`, `logger.error`
  - Called by: `validate_batch`
- `validate_batch`: Validates a batch of files for format, metadata, corruption, and size constraints
  - Calls: `ValidationEngine.validate_file_size`, `ValidationEngine.validate_image_format`, `ValidationEngine.validate_metadata`, `generate_error_message`, `upload_to_s3`, `log_validation_result`, `logger.error`
  - Instantiates: `ValidationResult`
  - Called by: `upload_images`

**Classes:**
- `ValidationResult`: Stores validation results for input files (success/error)
  - Used by: `validate_batch`
  - Instantiated by: `validate_batch`
- `ValidationEngine`: Handles file validation including format, metadata, corruption, and size constraints
  - Used by: `validate_batch`

### US_145_code.py
*No module documentation available.*

**Imports modules:**
- fastapi
- fastapi
- fastapi
- fastapi
- concurrent.futures
- pydantic
- typing
- typing
- typing
- redis
- cv2
- numpy
- pydicom
- os
- uvicorn
- PIL
- fastapi.responses

**Entry points:**
- validate_resolution
- detect_blank_image
- detect_duplicate_dicom

**Functions:**
- `validate_resolution`: Validate the resolution of an image file
  - Calls: `str`, `cv2.imread`
- `detect_blank_image`: Detect if an image is completely or predominantly blank based on pixel intensity distribution
  - Calls: `np.array`, `str`, `np.sum`, `cv2.imread`
- `detect_duplicate_dicom`: Detect duplicates based on SOPInstanceUID from the DICOM metadata
  - Calls: `redis_client.get`, `pydicom.dcmread`, `hasattr`, `str`, `redis_client.set`

**Classes:**
- `ImageMetadata`: No documentation available
  - Inherits from: `BaseModel`
- `ValidationRequest`: No documentation available
  - Inherits from: `BaseModel`
- `MetadataExtractionRequest`: No documentation available
  - Inherits from: `BaseModel`
- `PreprocessingRequest`: No documentation available
  - Inherits from: `BaseModel`

### US_146_code.py
*None*

**Imports modules:**
- os
- cv2
- numpy
- PIL.Image
- PIL.UnidentifiedImageError
- logging
- dask.bag

**Entry points:**
- __main__

**Functions:**
- `log_and_raise`: Logs an error message and raises an exception
  - Calls: `logger.error`
  - Called by: `decode_image`, `resize_image`, `normalize_image`, `route_data`
- `validate_input`: Validates the input parameters for image preprocessing
  - Calls: `logger.info`
  - Called by: `__main__`
- `decode_image`: Decodes the image from the file into a NumPy ndarray
  - Calls: `Image.open`, `Image.verify`, `log_and_raise`
  - Called by: `process_batch`
- `resize_image`: Resizes image to the target resolution while maintaining aspect ratio with padding
  - Calls: `cv2.resize`, `cv2.copyMakeBorder`, `log_and_raise`
  - Called by: `process_batch`
- `normalize_image`: Normalizes the pixel values and converts the image datatype
  - Calls: `log_and_raise`
  - Called by: `process_batch`
- `route_data`: Routes the processed image data to the appropriate endpoint using specified protocol
  - Calls: `logger.info`, `logger.warning`, `log_and_raise`
- `process_batch`: Processes images in parallel as a batch using Dask
  - Calls: `decode_image`, `resize_image`, `normalize_image`, `logger.warning`

### US_147_code.py
*No module documentation available.*

**Imports modules:**
- os
- json
- logging
- math
- typing
- typing
- typing
- typing
- concurrent.futures
- PIL
- numpy

**Classes:**
- `Logger`: Logger for JSON structured logging
- `InputHandler`: Handles loading datasets, input validation, and reading image names and labels
  - Instantiated by: `BatchDataPipeline.run`
- `BatchCreation`: Handles creation of training batches
  - Instantiated by: `BatchDataPipeline.run`
- `Preprocessor`: Applies preprocessing steps to images
- `TrainingStepCalculator`: Calculate the number of training steps dynamically
  - Instantiated by: `BatchDataPipeline.run`
- `BatchDataPipeline`: Main pipeline for batch data creation, processing, and logging
  - Instantiated by: `global`

## Function Call Graph

This section shows which functions call other functions across all modules.

- `US_141_code.get_user_role` calls:
  - `US_141_code.HTTPException`
  - `US_141_code.Security`
  - `mock_user_roles.get`

- `US_141_code.post_upload_validation` calls:
  - `logging.info`

- `US_141_code.upload_to_s3` calls:
  - `boto3.client`
  - `logging.error`
  - `logging.info`
  - `os.walk`
  - `s3_client.upload_file`

- `US_141_code.validate_dataset_structure` calls:
  - `US_141_code.any`
  - `US_141_code.str`
  - `US_141_code.validate_image_file`
  - `dataset_path.iterdir`
  - `f.is_dir`
  - `images_folder.exists`
  - `images_folder.iterdir`
  - `logging.error`
  - `masks_folder.exists`
  - `masks_folder.iterdir`
  - `subfolder.iterdir`
  - `traceback.format_exc`
  - `validation_details.append`

- `US_141_code.validate_image_file` calls:
  - `Image.open`

- `US_142_code.extract_image_data` calls:
  - `Image.open`
  - `US_142_code.log_event`
  - `pydicom.dcmread`

- `US_142_code.handle_directory_input` calls:
  - `US_142_code.log_event`
  - `US_142_code.process_batch`
  - `os.listdir`
  - `os.path.exists`
  - `os.path.isdir`
  - `os.path.isfile`

- `US_142_code.log_event` calls:
  - `json.dumps`
  - `logger.info`
  - `time.strftime`

- `US_142_code.process_batch` calls:
  - `US_142_code.as_completed`
  - `US_142_code.log_event`
  - `US_142_code.validate_and_extract`

- `US_142_code.send_to_validation_module` calls:
  - `US_142_code.log_event`
  - `base64.b64encode`
  - `os.path.getsize`
  - `requests.post`

- `US_142_code.validate_and_extract` calls:
  - `US_142_code.extract_image_data`
  - `US_142_code.log_event`
  - `US_142_code.validate_file_format`
  - `US_142_code.validate_file_path`

- `US_142_code.validate_file_format` calls:
  - `Path.suffix`

- `US_142_code.validate_file_path` calls:
  - `Path.is_dir`
  - `US_142_code.log_event`
  - `os.path.exists`

- `US_143_code.log_error` calls:
  - `US_143_code.Log`
  - `US_143_code.SessionLocal`
  - `US_143_code.str`
  - `logging.error`
  - `session.add`
  - `session.close`
  - `session.commit`

- `US_143_code.preprocess_image` calls:
  - `Image.open`
  - `ImageEnhance.Contrast`
  - `enhancer.enhance`
  - `img.convert`
  - `img.resize`
  - `img.save`

- `US_144_code.initialize_database` calls:
  - `sqlite3.connect`

- `US_144_code.log_validation_result` calls:
  - `logger.error`
  - `sqlite3.connect`

- `US_144_code.upload_to_s3` calls:
  - `logger.error`
  - `s3_client.upload_file`

- `US_144_code.validate_batch` calls:
  - `US_144_code.generate_error_message`
  - `US_144_code.log_validation_result`
  - `US_144_code.upload_to_s3`
  - `ValidationEngine.validate_file_size`
  - `ValidationEngine.validate_image_format`
  - `ValidationEngine.validate_metadata`
  - `logger.error`

- `US_145_code.detect_blank_image` calls:
  - `US_145_code.str`
  - `cv2.imread`
  - `np.array`
  - `np.sum`

- `US_145_code.detect_duplicate_dicom` calls:
  - `US_145_code.hasattr`
  - `US_145_code.str`
  - `pydicom.dcmread`
  - `redis_client.get`
  - `redis_client.set`

- `US_145_code.validate_resolution` calls:
  - `US_145_code.str`
  - `cv2.imread`

- `US_146_code.decode_image` calls:
  - `Image.open`
  - `Image.verify`
  - `US_146_code.log_and_raise`

- `US_146_code.log_and_raise` calls:
  - `logger.error`

- `US_146_code.normalize_image` calls:
  - `US_146_code.log_and_raise`

- `US_146_code.process_batch` calls:
  - `US_146_code.decode_image`
  - `US_146_code.normalize_image`
  - `US_146_code.resize_image`
  - `logger.warning`

- `US_146_code.resize_image` calls:
  - `US_146_code.log_and_raise`
  - `cv2.copyMakeBorder`
  - `cv2.resize`

- `US_146_code.route_data` calls:
  - `US_146_code.log_and_raise`
  - `logger.info`
  - `logger.warning`

- `US_146_code.validate_input` calls:
  - `logger.info`
