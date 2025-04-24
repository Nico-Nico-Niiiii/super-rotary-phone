# Test Suite for US_141: Training Dataset Upload and Validation Module

## Summary
This test suite validates the functionality, error handling, and integration of the API service for dataset upload, validation, and storage, as described in the user story and technical specification.

## Test Coverage
### Functional Areas Covered
- Dataset upload via API
- Dataset structure validation
- Image format validation
- AWS S3 integration for storage
- Error handling for invalid inputs

### Edge Cases Covered
- Empty class subfolders in classification datasets
- Large dataset upload validation
- Incorrect dataset folder structure
- Invalid or unsupported image formats
- AWS S3 failure scenarios

### Areas Not Covered
- Concurrent uploads (limited by system constraints)
- Post-upload validation (stub implementation in code)

## Test Cases

### TC-US_141-001: Successful Upload of a Valid Classification Dataset

**Category:** functional
**Priority:** high

**Preconditions:**
User has a valid authentication token. A classification dataset zip file with the correct folder structure and supported image formats is available.

**Inputs:**
- file: classification_dataset.zip
- datasetType: classification

**Steps:**
1. Send a POST request to the /api/upload-dataset endpoint with the classification dataset zip file and datasetType as 'classification'.

**Expected Results:**
1. HTTP 200 OK response is returned.
2. Validation results indicate success, with no warnings or errors.
3. The dataset is successfully uploaded and stored in the AWS S3 bucket.
4. A success message is logged and returned to the user.

**Traceability:** Acceptance Criteria 1, 2, 8

### TC-US_141-002: Validation Failure for Incorrect Classification Dataset Structure

**Category:** error
**Priority:** high

**Preconditions:**
User has a valid authentication token. A zip file containing a dataset for classification but with an incorrect folder structure is available.

**Inputs:**
- file: invalid_classification_dataset.zip
- datasetType: classification

**Steps:**
1. Send a POST request to the /api/upload-dataset endpoint with the invalid classification dataset zip file and datasetType as 'classification'.

**Expected Results:**
1. HTTP 400 Bad Request response is returned.
2. Validation results contain error messages specifying structural issues, such as missing class subfolders or empty folders.
3. The dataset is not uploaded to the AWS S3 bucket.

**Traceability:** Acceptance Criteria 1, 2, 4, 6

### TC-US_141-003: Validation Failure for Invalid Image Format in Segmentation Dataset

**Category:** error
**Priority:** high

**Preconditions:**
User has a valid authentication token. A segmentation dataset zip file with the correct folder structure but invalid image formats is available.

**Inputs:**
- file: segmentation_with_invalid_image_format.zip
- datasetType: segmentation

**Steps:**
1. Send a POST request to the /api/upload-dataset endpoint with the segmentation dataset zip file and datasetType as 'segmentation'.

**Expected Results:**
1. HTTP 400 Bad Request response is returned.
2. Validation results indicate errors related to image format issues, specifying unsupported formats.
3. The dataset is not uploaded to the AWS S3 bucket.

**Traceability:** Acceptance Criteria 1, 3, 9

### TC-US_141-004: Warning for Empty Subfolder in Classification Dataset

**Category:** functional
**Priority:** medium

**Preconditions:**
User has a valid authentication token. A classification dataset zip file with an empty class subfolder is available.

**Inputs:**
- file: classification_with_empty_folder.zip
- datasetType: classification

**Steps:**
1. Send a POST request to the /api/upload-dataset endpoint with the classification dataset zip file, which contains an empty class subfolder.
2. Verify validation results and logs.

**Expected Results:**
1. HTTP 200 OK response is returned.
2. Validation results contain a warning specifying that one or more subfolders are empty.
3. The dataset is successfully uploaded to the AWS S3 bucket with a warning logged.

**Traceability:** Acceptance Criteria 1, 2, 6

### TC-US_141-005: Error During Upload to AWS S3

**Category:** error
**Priority:** high

**Preconditions:**
User has a valid authentication token. A valid dataset zip file is available. AWS S3 credentials or service availability issue is simulated.

**Inputs:**
- file: valid_dataset.zip
- datasetType: segmentation

**Steps:**
1. Simulate an AWS S3 failure or provide invalid credentials.
2. Send a POST request to the /api/upload-dataset endpoint with the valid segmentation dataset zip file.

**Expected Results:**
1. HTTP 500 Internal Server Error response is returned.
2. Validation results contain an error indicating that the dataset upload to the cloud training bucket failed.
3. The dataset is not stored in the AWS S3 bucket.

**Traceability:** Acceptance Criteria 10

### TC-US_141-006: Performance Test: Upload and Validation of Large Classification Dataset

**Category:** performance
**Priority:** medium

**Preconditions:**
User has a valid authentication token. A valid large classification dataset zip file (~5GB) is available.

**Inputs:**
- file: large_classification_dataset.zip
- datasetType: classification

**Steps:**
1. Send a POST request to the /api/upload-dataset endpoint with the large classification dataset zip file and datasetType as 'classification'.
2. Measure the time taken for each step: file extraction, validation, and upload to AWS S3.

**Expected Results:**
1. Validation and upload operations complete within 5 minutes.
2. The dataset is successfully uploaded to the AWS S3 bucket.
3. HTTP 200 OK response is returned with validation indicating success.

**Traceability:** Non-Functional Requirement - Performance
