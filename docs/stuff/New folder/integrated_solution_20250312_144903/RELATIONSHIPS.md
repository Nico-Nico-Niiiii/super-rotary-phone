# Module Relationship Documentation

This document provides detailed information about the relationships between modules, functions, and classes.

## Overview

### Modules
- US_141_code.py
- US_142_code.py
- US_143_code.py

## Module Dependencies

### US_141_code.py
*This module provides an API for uploading and validating datasets, supporting classification and segmentation types. It uses FastAPI for the API framework and AWS S3 for file storage.*

**Imports modules:**
- os
- shutil
- tempfile
- zipfile
- pathlib
- typing
- fastapi
- fastapi.responses
- boto3
- botocore.exceptions
- logging
- uuid

**Entry points:**
- upload_dataset
- get_upload_status

**Functions:**
- `create_temp_dir`: Creates a unique temporary directory
  - Called by: `validate_zip_file`, `upload_dataset`
- `cleanup_temp_dir`: Cleans up the specified temporary directory if it exists
  - Calls: `os.path.exists`, `shutil.rmtree`
  - Called by: `validate_zip_file`, `upload_dataset`
- `validate_dataset_type`: Validates the dataset type
  - Instantiates: `HTTPException`
  - Called by: `upload_dataset`
- `validate_classification_structure`: Validates the folder structure for classification datasets
  - Calls: `Path.iterdir`, `any`
  - Instantiates: `HTTPException`
  - Called by: `validate_zip_file`
- `validate_segmentation_structure`: Validates the folder structure for segmentation datasets
  - Calls: `Path.iterdir`, `any`
  - Instantiates: `HTTPException`
  - Called by: `validate_zip_file`
- `validate_zip_file`: Validates the contents of a zip file based on the dataset type
  - Calls: `create_temp_dir`, `zipfile.ZipFile`, `validate_classification_structure`, `validate_segmentation_structure`, `cleanup_temp_dir`
  - Instantiates: `zipfile.ZipFile`
  - Called by: `upload_dataset`
- `upload_to_s3`: Uploads a file to AWS S3
  - Calls: `s3_client.upload_file`, `logger.error`
  - Instantiates: `HTTPException`
  - Called by: `upload_dataset`
- `post_upload_validation`: Performs post-upload validation for the uploaded dataset
  - Calls: `logger.info`
  - Called by: `upload_dataset`
- `upload_dataset`: API endpoint to upload and validate a dataset
  - Calls: `validate_dataset_type`, `create_temp_dir`, `validate_zip_file`, `upload_to_s3`, `post_upload_validation`, `cleanup_temp_dir`, `logger.error`
  - Instantiates: `uuid.uuid4`, `JSONResponse`, `HTTPException`
- `get_upload_status`: API endpoint to retrieve the upload status of a dataset
  - Calls: `upload_statuses.get`
  - Instantiates: `HTTPException`, `JSONResponse`

### US_142_code.py
*None*

**Imports modules:**
- os
- logging
- json
- requests
- pydicom

**Entry points:**
- __main__

**Functions:**
- `test_validate_file_path`: No documentation available
  - Calls: `DICOMProcessor.validate_file_path`
  - Instantiates: `DICOMProcessor`
- `test_extract_image_data`: No documentation available
  - Calls: `DICOMProcessor.extract_image_data`
  - Instantiates: `DICOMProcessor`
- `test_send_to_validation_module`: No documentation available
  - Calls: `DICOMProcessor.send_to_validation_module`
  - Instantiates: `DICOMProcessor`
- `test_process_batch`: No documentation available
  - Calls: `DICOMProcessor.process_batch`
  - Instantiates: `DICOMProcessor`
- `__main__`: No documentation available
  - Calls: `DICOMProcessor.process_batch`, `os.path.isdir`, `os.listdir`, `os.path.join`
  - Instantiates: `DICOMProcessor`

**Classes:**
- `DICOMProcessor`: No documentation available
  - Used by: `test_validate_file_path`, `test_extract_image_data`, `test_send_to_validation_module`, `test_process_batch`, `__main__`
  - Instantiated by: `test_validate_file_path`, `test_extract_image_data`, `test_send_to_validation_module`, `test_process_batch`, `__main__`

### US_143_code.py
*None*

**Imports modules:**
- os
- logging
- shutil
- tempfile
- typing
- fastapi
- fastapi.security
- fastapi.limiter
- fastapi.limiter.depends
- pydantic
- dotenv
- pathlib
- requests
- json

**Entry points:**
- process_image
- test_validate_pacs_response

**Functions:**
- `validate_pacs_response`: Validates the structure of a PACS response using the PACSResponse model
  - Calls: `PACSResponse`
  - Instantiates: `PACSResponse`
  - Called by: `process_image`
- `send_to_ai_module`: Sends an image file to the AI module for processing
  - Calls: `requests.post`, `response.raise_for_status`, `response.json`
  - Called by: `process_image`
- `cleanup_temp_files`: Cleans up temporary files in the specified directory
  - Calls: `shutil.rmtree`
  - Called by: `process_image`
- `log_requests`: Middleware to log HTTP requests and responses
  - Calls: `call_next`, `logging.info`
- `authenticate`: Authenticates a user using HTTP Basic credentials
  - Calls: `os.getenv`
  - Called by: `process_image`
- `process_image`: Endpoint to process an image retrieved from PACS and send it to the AI module
  - Calls: `requests.get`, `response.raise_for_status`, `response.json`, `validate_pacs_response`, `send_to_ai_module`, `shutil.copy`, `cleanup_temp_files`
- `test_validate_pacs_response`: Unit test for the validate_pacs_response function
  - Calls: `validate_pacs_response`

**Classes:**
- `PACSResponse`: Model for validating PACS response data
  - Inherits from: `BaseModel`
  - Used by: `validate_pacs_response`
  - Instantiated by: `validate_pacs_response`
- `AIResponse`: Model for validating AI module response data
  - Inherits from: `BaseModel`

## Function Call Graph

This section shows which functions call other functions across all modules.

- `US_141_code.cleanup_temp_dir` calls:
  - `os.path.exists`
  - `shutil.rmtree`

- `US_141_code.get_upload_status` calls:
  - `upload_statuses.get`

- `US_141_code.post_upload_validation` calls:
  - `logger.info`

- `US_141_code.upload_dataset` calls:
  - `US_141_code.cleanup_temp_dir`
  - `US_141_code.create_temp_dir`
  - `US_141_code.post_upload_validation`
  - `US_141_code.upload_to_s3`
  - `US_141_code.validate_dataset_type`
  - `US_141_code.validate_zip_file`
  - `logger.error`

- `US_141_code.upload_to_s3` calls:
  - `logger.error`
  - `s3_client.upload_file`

- `US_141_code.validate_classification_structure` calls:
  - `Path.iterdir`
  - `US_141_code.any`

- `US_141_code.validate_segmentation_structure` calls:
  - `Path.iterdir`
  - `US_141_code.any`

- `US_141_code.validate_zip_file` calls:
  - `US_141_code.cleanup_temp_dir`
  - `US_141_code.create_temp_dir`
  - `US_141_code.validate_classification_structure`
  - `US_141_code.validate_segmentation_structure`
  - `zipfile.ZipFile`

- `US_142_code.__main__` calls:
  - `DICOMProcessor.process_batch`
  - `os.listdir`
  - `os.path.isdir`
  - `os.path.join`

- `US_142_code.test_extract_image_data` calls:
  - `DICOMProcessor.extract_image_data`

- `US_142_code.test_process_batch` calls:
  - `DICOMProcessor.process_batch`

- `US_142_code.test_send_to_validation_module` calls:
  - `DICOMProcessor.send_to_validation_module`

- `US_142_code.test_validate_file_path` calls:
  - `DICOMProcessor.validate_file_path`

- `US_143_code.authenticate` calls:
  - `os.getenv`

- `US_143_code.cleanup_temp_files` calls:
  - `shutil.rmtree`

- `US_143_code.log_requests` calls:
  - `US_143_code.call_next`
  - `logging.info`

- `US_143_code.process_image` calls:
  - `US_143_code.cleanup_temp_files`
  - `US_143_code.send_to_ai_module`
  - `US_143_code.validate_pacs_response`
  - `requests.get`
  - `response.json`
  - `response.raise_for_status`
  - `shutil.copy`

- `US_143_code.send_to_ai_module` calls:
  - `requests.post`
  - `response.json`
  - `response.raise_for_status`

- `US_143_code.test_validate_pacs_response` calls:
  - `US_143_code.validate_pacs_response`

- `US_143_code.validate_pacs_response` calls:
  - `US_143_code.PACSResponse`
