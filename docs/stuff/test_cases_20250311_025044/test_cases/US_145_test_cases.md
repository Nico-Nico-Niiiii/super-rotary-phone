# Test Suite for US_145

## Summary
This suite validates the functionality, error handling, boundary conditions, and integration of the image quality validation module implemented as part of the AI/ML preprocessing pipeline. The suite ensures compliance with resolution requirements, detects blank images, identifies duplicate DICOM files, and validates the interface for metadata extraction and preprocessing.

## Test Coverage
### Functional Areas Covered
- Image resolution validation
- Blank image detection
- Duplicate DICOM detection
- Metadata extraction
- Preprocessing integration

### Edge Cases Covered
- Blank images in training and inference
- Resolution below threshold
- Duplicate detection in Redis cache

### Areas Not Covered
- Unsupported image formats (e.g., TIFF or BMP)
- Failure scenarios for Redis connection

## Test Cases

### TC-US_145-001: Validate image resolution above threshold (512x512)

**Category:** functional
**Priority:** high

**Preconditions:**
Set up FastAPI server. Ensure Redis is running locally.

**Inputs:**
- operation_type: TRAINING
- images: [{'image_id': 'IMG001', 'file_path': 'tests/images/high_res_image.jpg'}]

**Steps:**
1. Send a POST request to the '/validate' endpoint with the image file path and operation type TRAINING.
2. Monitor the server response.

**Expected Results:**
1. Response status should be SUCCESS.
2. Validation status of the image should be VALID.
3. No error messages in the response.

**Traceability:** Acceptance Criteria 1

### TC-US_145-002: Validate image resolution below threshold (e.g., 400x300)

**Category:** boundary
**Priority:** high

**Preconditions:**
Set up FastAPI server. Ensure Redis is running locally.

**Inputs:**
- operation_type: TRAINING
- images: [{'image_id': 'IMG002', 'file_path': 'tests/images/low_res_image.jpg'}]

**Steps:**
1. Send a POST request to the '/validate' endpoint with the image file path and operation type TRAINING.
2. Monitor the server response.

**Expected Results:**
1. Response status should be SUCCESS.
2. Validation status of the image should be INVALID.
3. Error message: 'Image resolution is below the required minimum of 512x512 pixels.'

**Traceability:** Acceptance Criteria 2

### TC-US_145-003: Detect blank image for AI model inferencing

**Category:** error
**Priority:** high

**Preconditions:**
Set up FastAPI server. Ensure Redis is running locally.

**Inputs:**
- operation_type: INFERENCING
- images: [{'image_id': 'IMG003', 'file_path': 'tests/images/blank_image.jpg'}]

**Steps:**
1. Send a POST request to the '/validate' endpoint with the blank image file path and operation type INFERENCING.
2. Monitor the server response.

**Expected Results:**
1. Response status should be SUCCESS.
2. Validation status of the image should be INVALID.
3. Error message: 'Blank image detected. Inferencing cannot proceed with blank images.'

**Traceability:** Acceptance Criteria 4

### TC-US_145-004: Detect duplicate DICOM images in training dataset

**Category:** functional
**Priority:** high

**Preconditions:**
Set up FastAPI server. Ensure Redis is running locally and preloaded SOP Instance UIDs include a duplicate UID.

**Inputs:**
- operation_type: TRAINING
- images: [{'image_id': 'IMG004', 'file_path': 'tests/dicom_images/duplicate_image.dcm'}, {'image_id': 'IMG005', 'file_path': 'tests/dicom_images/duplicate_image.dcm'}]

**Steps:**
1. Send a POST request to the '/validate' endpoint with a dataset containing duplicate DICOM files.
2. Monitor the server response.

**Expected Results:**
1. Response status should be SUCCESS.
2. Validation status of the duplicate image should be INVALID.
3. Error message: 'Duplicate DICOM image detected. SOP Instance UID: {UID}.'
4. Validation status of the non-duplicate image should be VALID.

**Traceability:** Acceptance Criteria 5

### TC-US_145-005: Validate metadata extraction for DICOM file

**Category:** functional
**Priority:** medium

**Preconditions:**
Set up FastAPI server. Ensure Redis is running locally.

**Inputs:**
- file_path: tests/dicom_images/valid_image.dcm

**Steps:**
1. Send a POST request to the '/metadata/dicom' endpoint with the file path of a valid DICOM image.
2. Monitor the server response.

**Expected Results:**
1. Response status should be SUCCESS.
2. Metadata should include SOP Instance UID.
3. No error messages in the response.

**Traceability:** Technical Specification - Metadata Extraction

### TC-US_145-006: Push validated images for preprocessing after successful validation

**Category:** integration
**Priority:** medium

**Preconditions:**
Validated images available from a previous test with VALID status.

**Inputs:**
- validated_images: [{'image_id': 'IMG001', 'file_path': 'tests/images/high_res_image.jpg'}]

**Steps:**
1. Send a POST request to the '/preprocess' endpoint with the validated images.
2. Monitor the server response.

**Expected Results:**
1. Response status should be SUCCESS.
2. Message: 'Data transferred for image preprocessing.'

**Traceability:** Acceptance Criteria 6
