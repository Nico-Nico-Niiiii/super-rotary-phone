# Test Scenarios for US_144

## Summary
This test suite evaluates the Image Data Validation System by testing its ability to validate image formats, metadata, and size, handle errors, and correctly integrate with related services. Tests cover functional requirements, edge cases, error handling, and integration with downstream systems.

## Test Coverage
### Functional Areas
- Supported formats validation
- File size limit enforcement
- Metadata validation
- Logs retrieval

### Edge Cases
- Mixed batches of valid and invalid files
- Empty input batch

### Areas Not Covered
- Retry mechanism for S3 upload failures (limitation in implementation)
- Support for additional file formats beyond JPEG, BMP, PNG, and DICOM

## Test Scenarios

### TS-US_144-001: Validate supported image formats

**Category:** functional

**Description:**
Validates that the system correctly identifies and accepts supported file formats (JPEG, BMP, PNG, DICOM).

**Test Objective:**
Ensure that the system successfully processes files of all supported formats.

**Expected Outcome:**
The system should return a success message for each file of a supported format.

**Relevant Requirements:** Acceptance Criteria #1

### TS-US_144-002: Reject unsupported image formats

**Category:** error

**Description:**
Tests how the system handles an unsupported file format being uploaded.

**Test Objective:**
Verify that an unsupported format (e.g., TIFF, GIF) is rejected and an appropriate error message is returned.

**Expected Outcome:**
The system returns an error message indicating unsupported file format.

**Relevant Requirements:** Acceptance Criteria #2

### TS-US_144-003: Detect and reject corrupted image files

**Category:** error

**Description:**
Tests the system's ability to detect corrupted files that cannot be read.

**Test Objective:**
Ensure corrupted files do not pass validation and return a meaningful error message.

**Expected Outcome:**
The system returns an error message stating that the file is corrupted.

**Relevant Requirements:** Acceptance Criteria #3

### TS-US_144-004: Reject images for invalid AI model use-case

**Category:** functional

**Description:**
Tests the system's ability to validate metadata alignment with the target model's use case.

**Test Objective:**
Ensure images whose metadata does not match the AI model's expected configuration are rejected.

**Expected Outcome:**
The system returns an error message stating that the image is not related to the target use-case.

**Relevant Requirements:** Acceptance Criteria #4

### TS-US_144-005: Reject files exceeding maximum size limit

**Category:** functional

**Description:**
Tests the system's enforcement of the 50MB maximum file size limit.

**Test Objective:**
Ensure files exceeding the size limit are rejected with the correct error message.

**Expected Outcome:**
The system returns an error message indicating that the file exceeds the size limit.

**Relevant Requirements:** Technical Requirements #4

### TS-US_144-006: Handle batch upload with mixed validity

**Category:** edge_case

**Description:**
Tests the system's behavior when a batch contains a mix of valid and invalid files.

**Test Objective:**
Verify that valid files progress for further processing while invalid files are logged and appropriate error messages are returned.

**Expected Outcome:**
The system validates each file independently and returns a mixed result (success for valid files, error messages for invalid files).

**Relevant Requirements:** Technical Requirements #6, Acceptance Criteria #1-4

### TS-US_144-007: Retrieve validation logs for a specific file

**Category:** functional

**Description:**
Tests the API's ability to fetch validation logs for a specified file.

**Test Objective:**
Ensure the `/api/v1/logs` endpoint returns relevant logs for a specific file.

**Expected Outcome:**
The system returns a JSON response containing logs for the specified file.

**Relevant Requirements:** Technical Requirements #8, API Specification `/api/v1/logs`

### TS-US_144-008: Integration test for successful uploads to S3

**Category:** integration

**Description:**
Tests the system's integration with Amazon S3 for uploading successfully validated files.

**Test Objective:**
Ensure that validated files are reliably uploaded to the correct S3 bucket.

**Expected Outcome:**
The system uploads the files successfully and updates the log with the upload status.

**Relevant Requirements:** Technical Requirements #7, Success Workflow

### TS-US_144-009: Handle empty batch input gracefully

**Category:** edge_case

**Description:**
Tests the system's behavior when no files are included in the batch upload.

**Test Objective:**
Ensure that the system provides a meaningful error message and does not crash.

**Expected Outcome:**
The system returns an error message indicating that no files were provided.

**Relevant Requirements:** Technical Requirements #8
