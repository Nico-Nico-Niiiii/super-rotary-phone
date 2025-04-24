# Test Scenarios for US_144

## Summary
This test suite verifies the image data validation module, focusing on functional correctness, robustness in handling errors, support for edge cases, and integration with external systems like AWS S3 and logging. It ensures compliance with user story requirements and technical specifications.

## Test Coverage
### Functional Areas
- File format validation
- Metadata alignment
- Batch validation
- Log retrieval
- AWS S3 integration

### Edge Cases
- Corrupted files
- Mixed-validity batches
- Empty input

### Areas Not Covered
- Performance testing for large-scale batch uploads
- Localization of error messages
- Asynchronous or distributed processing (multiprocessing impact)

## Test Scenarios

### TS-US_144-001: Validation of supported image file formats

**Category:** functional

**Description:**
Verify that the system correctly accepts JPEG, BMP, PNG, and DICOM file formats.

**Test Objective:**
Ensure supported file formats pass validation and return a success response.

**Expected Outcome:**
Files of supported formats return a success message in the validation results.

**Relevant Requirements:** 1.1 (Validate supported file formats), Acceptance Criteria 1

### TS-US_144-002: Rejection of unsupported file formats

**Category:** error

**Description:**
Verify that unsupported file formats (e.g., GIF, TIFF) are rejected with appropriate error messages.

**Test Objective:**
Ensure that unsupported formats trigger a specific error response.

**Expected Outcome:**
Validation results contain error entries for unsupported formats with a descriptive error message.

**Relevant Requirements:** 1.2 (Reject unsupported formats), Acceptance Criteria 2

### TS-US_144-003: Handling corrupted image files

**Category:** edge_case

**Description:**
Verify that corrupted or unreadable files are identified during validation and logged with error details.

**Test Objective:**
Ensure corrupted files are detected, rejected, and accompanied by meaningful error messages.

**Expected Outcome:**
Validation results indicate errors for corrupted files, including relevant error codes and messages.

**Relevant Requirements:** 1.3 (Detect corrupted images), Acceptance Criteria 3

### TS-US_144-004: Validation of metadata alignment with AI model use-case

**Category:** functional

**Description:**
Verify that metadata provided with a DICOM file aligns with the AI model's expected type and modality.

**Test Objective:**
Ensure metadata mismatches trigger appropriate validation errors.

**Expected Outcome:**
Validation results indicate errors for files with incompatible metadata fields, such as model type or modality mismatch.

**Relevant Requirements:** 1.4 (Validate metadata), Acceptance Criteria 4

### TS-US_144-005: Successful batch validation and S3 upload

**Category:** integration

**Description:**
Verify that a batch with valid files is processed successfully and the files are uploaded to AWS S3.

**Test Objective:**
Confirm that valid files are forwarded for image quality checks and uploaded to S3.

**Expected Outcome:**
The validation results reflect successful processing, and the valid files are found in the S3 bucket.

**Relevant Requirements:** 6.2 (Integration with AWS S3), Acceptance Criteria 5

### TS-US_144-006: Error handling for missing files in batch upload

**Category:** error

**Description:**
Verify that the system can handle empty batches or missing file fields gracefully.

**Test Objective:**
Ensure the system returns a meaningful error when no files are uploaded or are missing from the request.

**Expected Outcome:**
The API responds with an error code and a descriptive message indicating empty or invalid input.

**Relevant Requirements:** 1.7 (Handle edge cases like empty input)

### TS-US_144-007: Handling mixed validity in batch uploads

**Category:** edge_case

**Description:**
Verify that a batch containing both valid and invalid files is processed correctly, with each file validated independently.

**Test Objective:**
Ensure valid files are processed successfully and errors are logged for invalid files in a mixed-validity batch.

**Expected Outcome:**
Validation results contain success entries for valid files and error entries for invalid ones.

**Relevant Requirements:** 1.6 (Process images independently in batches)

### TS-US_144-008: Retrieving validation logs via logs API

**Category:** functional

**Description:**
Verify that the logs endpoint retrieves validation summaries correctly, either for all files or specific files.

**Test Objective:**
Ensure the /api/v1/logs API functions as expected, providing accurate log data in JSON format.

**Expected Outcome:**
API returns all logs or logs for the specified file, with accurate file names, statuses, and timestamps.

**Relevant Requirements:** 7.1 (Provide logs for validation activities)
