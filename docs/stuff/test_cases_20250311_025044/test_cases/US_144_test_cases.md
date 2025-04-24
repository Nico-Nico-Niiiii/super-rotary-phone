# Test Suite for US_144

## Summary
This test suite verifies proper functioning of the image data validation system, covering supported formats, metadata requirements, corrupted files, AWS S3 upload integration, SQLite logging, and REST API endpoints.

## Test Coverage
### Functional Areas Covered
- Validation of supported formats
- Handling of unsupported formats
- Corruption detection
- Metadata validation
- API integration for logs retrieval

### Edge Cases Covered
- Empty or invalid metadata
- Mixed file validity within a batch
- Corrupted and unsupported files

### Areas Not Covered
- Performance testing for high-concurrent batch uploads
- Scalability testing for large-scale datasets

## Test Cases

### TC-US_144-001: Validation success for supported image formats

**Category:** functional
**Priority:** high

**Preconditions:**
SQLite database is initialized, AWS S3 connection is configured, and Flask API is running.

**Inputs:**
- files: ['image1.jpg', 'image2.png', 'image3.bmp', 'image4.dcm']
- metadata: {'model_name': 'AI_Xray_Classifier', 'expected_type': 'DICOM', 'expected_modality': 'X-ray'}

**Steps:**
1. Set up the `/temp_uploads` folder with the provided files.
2. Send an HTTP POST request to `/api/v1/upload` with the files and metadata.
3. Capture the JSON response.

**Expected Results:**
1. Validation result indicates success for valid files.
2. Each file's validation status is 'success' with a detailed success message.
3. Files are successfully uploaded to AWS S3 bucket.

**Traceability:** Acceptance Criteria 1

### TC-US_144-002: Validation failure for unsupported image formats

**Category:** error
**Priority:** high

**Preconditions:**
SQLite database is initialized, Flask API is running.

**Inputs:**
- files: ['unsupported_file.tif', 'unsupported_file.gif']
- metadata: {'model_name': 'AI_Generic_Classifier', 'expected_type': 'Generic', 'expected_modality': 'Any'}

**Steps:**
1. Set up the `/temp_uploads` folder with the unsupported files.
2. Send an HTTP POST request to `/api/v1/upload` with the files and metadata.
3. Capture the JSON response.

**Expected Results:**
1. Validation fails for unsupported formats with status 'error' and error code 101.
2. Each error message specifies 'Unsupported image format'.
3. No files are uploaded to AWS S3.

**Traceability:** Acceptance Criteria 2

### TC-US_144-003: Validation failure for corrupted files

**Category:** error
**Priority:** high

**Preconditions:**
SQLite database is initialized, Flask API is running.

**Inputs:**
- files: ['corrupted_image.jpg', 'corrupted_dicom.dcm']
- metadata: {'model_name': 'AI_Xray_Classifier', 'expected_type': 'DICOM', 'expected_modality': 'X-ray'}

**Steps:**
1. Set up the `/temp_uploads` folder with corrupted files.
2. Send an HTTP POST request to `/api/v1/upload` with the files and metadata.
3. Capture the JSON response.

**Expected Results:**
1. Validation fails for corrupted files with status 'error' and error code 102.
2. Each error message specifies 'Corrupted image detected'.
3. No files are logged or uploaded to AWS S3.

**Traceability:** Acceptance Criteria 3

### TC-US_144-004: Validation failure for mismatched AI model metadata use-case

**Category:** functional
**Priority:** high

**Preconditions:**
SQLite database is initialized, Flask API is running.

**Inputs:**
- files: ['valid_xray_image1.dcm', 'valid_ct_image2.dcm']
- metadata: {'model_name': 'AI_Xray_Classifier', 'expected_type': 'DICOM', 'expected_modality': 'X-ray'}

**Steps:**
1. Set up the `/temp_uploads` folder with files including an invalid modality.
2. Send an HTTP POST request to `/api/v1/upload` with the files and metadata.
3. Capture the JSON response.

**Expected Results:**
1. Valid X-ray file is successfully validated with status 'success'.
2. Validation fails for CT modality files with status 'error' and error code 103.
3. Error message specifies 'Mismatched metadata for target AI model use-case'.

**Traceability:** Acceptance Criteria 4

### TC-US_144-005: Validation logs retrieval via API

**Category:** integration
**Priority:** medium

**Preconditions:**
SQLite database contains logs for previous uploads.

**Inputs:**
- file_name_filter: valid_xray_image1.dcm

**Steps:**
1. Send an HTTP GET request to `/api/v1/logs` with 'file_name' filter as parameter.
2. Capture the JSON response.

**Expected Results:**
1. API response includes logs for the filtered file.
2. Logs contain file name, validation status, timestamp, and success/error details.

**Traceability:** System Logging Requirement
