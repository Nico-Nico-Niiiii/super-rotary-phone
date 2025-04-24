# Test Scenarios for US_141

## Summary
The test scenarios validate the end-to-end functionality, error handling, edge cases, and integration points of the FastAPI-based RESTful API module for uploading, validating, and storing datasets to a cloud training bucket. They ensure the system adheres to the acceptance criteria in the user story and technical specification, covering roles, validation requirements, and storage consistency.

## Test Coverage
### Functional Areas
- Classification dataset upload and validation
- Segmentation dataset upload and validation
- RBAC enforcement
- Post-upload tasks trigger

### Edge Cases
- Empty subfolders in classification dataset
- Unsupported image formats

### Areas Not Covered
- Concurrency for multiple uploads (future enhancement)
- Dynamic role-based authentication (mock implementation)

## Test Scenarios

### TS-US_141-001: Upload valid classification dataset

**Category:** functional

**Description:**
Testing the upload functionality with a valid classification dataset following the required folder structure.

**Test Objective:**
Verify that a valid classification dataset is extracted, validated, uploaded to AWS S3, and a success message is returned.

**Expected Outcome:**
The system validates the folder structure, uploads the dataset to AWS S3, triggers post-upload validation, and returns a success message with no warnings or errors.

**Relevant Requirements:** Acceptance Criteria: 1, 2, 8, 11

### TS-US_141-002: Upload invalid classification dataset with missing subfolders

**Category:** error

**Description:**
Testing validation for a classification dataset with missing subfolders or images.

**Test Objective:**
Verify that the system recognizes a missing folder and returns an appropriate error message.

**Expected Outcome:**
The system identifies the missing subfolders, rejects the upload, and returns an error message specifying the issue.

**Relevant Requirements:** Acceptance Criteria: 1, 2, 4

### TS-US_141-003: Upload segmentation dataset with mismatched filenames

**Category:** error

**Description:**
Testing the validation for a segmentation dataset where image filenames do not match their corresponding mask filenames.

**Test Objective:**
Verify that the system identifies mismatched filenames in the segmentation dataset and returns an error message.

**Expected Outcome:**
The system rejects the dataset, logs the mismatched files, and returns an error message indicating the issue.

**Relevant Requirements:** Acceptance Criteria: 1, 3, 7

### TS-US_141-004: Upload classification dataset containing empty subfolders

**Category:** edge_case

**Description:**
Testing the behavior when a classification dataset contains one or more empty subfolders.

**Test Objective:**
Verify that the system uploads the dataset with a warning about the empty subfolders.

**Expected Outcome:**
The system successfully uploads the dataset, provides a warning about the empty subfolders, and logs the event.

**Relevant Requirements:** Acceptance Criteria: 1, 2, 6

### TS-US_141-005: Upload dataset exceeding maximum allowed size

**Category:** error

**Description:**
Testing the upload functionality with a zip file that exceeds the 5GB size limit.

**Test Objective:**
Verify that the system enforces the maximum file size limit and returns an appropriate error message.

**Expected Outcome:**
The system rejects the file upload and responds with an HTTP 400 error, specifying the file size limit violation.

**Relevant Requirements:** Non-Functional Requirements: Maximum File Size (5GB)

### TS-US_141-006: Simulate failed upload to AWS S3

**Category:** error

**Description:**
Testing the system's behavior when the dataset upload to AWS S3 fails (e.g., due to network issues or incorrect credentials).

**Test Objective:**
Verify that the system handles S3 upload failures gracefully and informs the user with an error message.

**Expected Outcome:**
The system retries or logs the failure, ensures no partial upload, and returns an error message indicating the failure of the cloud storage operation.

**Relevant Requirements:** Acceptance Criteria: 10

### TS-US_141-007: Upload dataset with unsupported image formats

**Category:** error

**Description:**
Testing dataset validation when one or more images are in unsupported formats.

**Test Objective:**
Verify that the system detects unsupported image formats (non-JPEG/PNG) and returns an appropriate error.

**Expected Outcome:**
The system aborts the upload, specifies invalid image files in the response, and returns an error message to the user.

**Relevant Requirements:** Acceptance Criteria: 1, 9

### TS-US_141-008: Role-based access control enforcement

**Category:** functional

**Description:**
Testing if the API enforces user roles, allowing or denying access based on mock role-based access control (RBAC).

**Test Objective:**
Verify that users with valid tokens corresponding to permitted roles can upload datasets, while others receive an HTTP 403 response.

**Expected Outcome:**
Users with valid roles can proceed with uploads; invalid roles or tokens are denied access with a 403 Forbidden error.

**Relevant Requirements:** Non-Functional Requirements: RBAC Enforcement

### TS-US_141-009: Trigger post-upload validation task

**Category:** integration

**Description:**
Testing if a post-upload validation task is triggered after a dataset is successfully uploaded to AWS S3.

**Test Objective:**
Verify that the system triggers the post-upload validation and logs a success message.

**Expected Outcome:**
The system triggers the post-upload validation and completes without errors, logging a confirmation message.

**Relevant Requirements:** Acceptance Criteria: 8, 11
