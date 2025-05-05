# Module Relationship Documentation

This document provides detailed information about the relationships between modules, functions, and classes.

## Overview

### Modules
- US_171_code.py

## Module Dependencies

### US_171_code.py
*None*

**Imports modules:**
- fastapi
- pydantic
- typing
- sqlalchemy
- sqlalchemy.exc
- re
- requests
- logging
- cachetools
- functools
- fastapi.security
- fastapi.middleware.trustedhost
- fastapi.middleware.cors
- fastapi_limiter
- fastapi_limiter.depends
- redis
- json

**Entry points:**
- post_dicom_sr_details
- get_dicom_sr

**Functions:**
- `validate_patient_id`: Validate patient ID format
  - Calls: `re.match`, `logger.error`
  - Called by: `post_dicom_sr_details`, `get_dicom_sr`
- `fetch_dicom_sr_from_db`: Fetch DICOM SR from the database
  - Calls: `engine.connect`, `logger.warning`, `logger.error`, `HTTPException`
  - Called by: `post_dicom_sr_details`, `get_dicom_sr`
- `fetch_dicom_image_from_pacs`: Fetch DICOM image from PACS server
  - Calls: `requests.get`, `response.raise_for_status`, `response.json`, `logger.error`, `HTTPException`
  - Called by: `post_dicom_sr_details`
- `perform_ai_inference`: Perform AI inference on DICOM image
  - Calls: `requests.post`, `response.raise_for_status`, `response.json`, `logger.error`, `HTTPException`
  - Called by: `post_dicom_sr_details`
- `post_dicom_sr_details`: Post DICOM SR details
  - Calls: `validate_patient_id`, `fetch_dicom_sr_from_db`, `fetch_dicom_image_from_pacs`, `perform_ai_inference`
- `get_dicom_sr`: Get DICOM SR by patient ID
  - Calls: `validate_patient_id`, `logger.info`, `fetch_dicom_sr_from_db`, `cache.__contains__`, `cache.__setitem__`
- `test_validate_patient_id`: No documentation available
  - Calls: `validate_patient_id`
- `test_fetch_dicom_sr_from_db`: No documentation available
- `test_fetch_dicom_image_from_pacs`: No documentation available
- `test_perform_ai_inference`: No documentation available

**Classes:**
- `PatientDetails`: No documentation available
  - Inherits from: `BaseModel`
  - Used by: `post_dicom_sr_details`
- `DicomSR`: No documentation available
  - Inherits from: `BaseModel`

## Function Call Graph

This section shows which functions call other functions across all modules.

- `US_171_code.fetch_dicom_image_from_pacs` calls:
  - `US_171_code.HTTPException`
  - `logger.error`
  - `requests.get`
  - `response.json`
  - `response.raise_for_status`

- `US_171_code.fetch_dicom_sr_from_db` calls:
  - `US_171_code.HTTPException`
  - `engine.connect`
  - `logger.error`
  - `logger.warning`

- `US_171_code.get_dicom_sr` calls:
  - `US_171_code.fetch_dicom_sr_from_db`
  - `US_171_code.validate_patient_id`
  - `cache.__contains__`
  - `cache.__setitem__`
  - `logger.info`

- `US_171_code.perform_ai_inference` calls:
  - `US_171_code.HTTPException`
  - `logger.error`
  - `requests.post`
  - `response.json`
  - `response.raise_for_status`

- `US_171_code.post_dicom_sr_details` calls:
  - `US_171_code.fetch_dicom_image_from_pacs`
  - `US_171_code.fetch_dicom_sr_from_db`
  - `US_171_code.perform_ai_inference`
  - `US_171_code.validate_patient_id`

- `US_171_code.test_validate_patient_id` calls:
  - `US_171_code.validate_patient_id`

- `US_171_code.validate_patient_id` calls:
  - `logger.error`
  - `re.match`
