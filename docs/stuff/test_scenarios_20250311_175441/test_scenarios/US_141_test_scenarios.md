# Test Scenarios for US_141

## Summary
This test suite validates the functionality, edge cases, error handling, and integration of the FastAPI-based dataset upload module, ensuring that datasets are uploaded, validated, and stored in AWS S3 as per the requirements of training AI models.

## Test Coverage
### Functional Areas
- Classification dataset upload and validation
- Segmentation dataset upload and validation
- AWS S3 storage

### Edge Cases
- Empty sub-folders in classification dataset
- Large datasets near maximum size limitations

### Areas Not Covered
- Concurrent dataset uploads (future scalability requirement)
- Dynamic token-role mapping for RBAC

## Test Scenarios

### TS-US_141-001: Valid Classification Dataset Upload

**Category:** functional

**Description:**
Validate that the module correctly handles the upload of a classification dataset with sub-folders representing classes containing valid images.

**Test Objective:**
Verify successful dataset upload, validation of folder structure, and storage in AWS S3.

**Expected Outcome:**
Validation passes, dataset is stored in AWS S3, and a success message is returned to the user.

**Relevant Requirements:** Acceptance Criteria 1, 2, 8

### TS-US_141-002: Invalid Folder Structure for Classification Dataset

**Category:** error

**Description:**
Test that the system returns an error message when the classification dataset folder does not contain sub-folders representing classes.

**Test Objective:**
Ensure that the folder structure validation logic properly detects and reports errors for invalid classification dataset structures.

**Expected Outcome:**
System returns an error message indicating that the classification dataset does not meet folder structure requirements.

**Relevant Requirements:** Acceptance Criteria 4

### TS-US_141-003: Empty Sub-folders in Classification Dataset

**Category:** edge_case

**Description:**
Test how the system handles a classification dataset with one or more empty sub-folders.

**Test Objective:**
Verify that the dataset is uploaded to AWS S3 but the system issues a warning about empty sub-folders.

**Expected Outcome:**
Dataset is stored in AWS S3 successfully, and a warning message is returned to the user.

**Relevant Requirements:** Acceptance Criteria 6

### TS-US_141-004: Valid Segmentation Dataset Upload

**Category:** functional

**Description:**
Validate that the module correctly handles the upload of a segmentation dataset containing 'images' and 'mask' folders with valid files.

**Test Objective:**
Verify successful dataset upload, validation of folder structure, and storage in AWS S3.

**Expected Outcome:**
Validation passes, dataset is stored in AWS S3, and a success message is returned to the user.

**Relevant Requirements:** Acceptance Criteria 3, 8

### TS-US_141-005: Missing Mask Files in Segmentation Dataset

**Category:** error

**Description:**
Test that the system returns an error message when the segmentation dataset contains images without corresponding mask files.

**Test Objective:**
Ensure that the system properly detects and reports missing mask files in segmentation datasets.

**Expected Outcome:**
System returns an error message indicating that mask files are missing.

**Relevant Requirements:** Acceptance Criteria 7

### TS-US_141-006: Corrupt or Unsupported Image File Validation

**Category:** error

**Description:**
Test the handling of datasets containing corrupt or unsupported image files.

**Test Objective:**
Ensure that the module detects and rejects datasets with unsupported formats or corrupted files.

**Expected Outcome:**
System returns an error message indicating unsupported image formats or corrupted files.

**Relevant Requirements:** Acceptance Criteria 5, 9

### TS-US_141-007: Failure to Store Dataset in AWS S3

**Category:** error

**Description:**
Simulate an AWS S3 storage failure and test how the module handles such scenarios.

**Test Objective:**
Ensure that appropriate error messages are returned to the user when storing the dataset in AWS S3 fails.

**Expected Outcome:**
System returns an error message indicating failure to upload the dataset to AWS S3.

**Relevant Requirements:** Acceptance Criteria 10

### TS-US_141-008: Post-Upload Image Validation Trigger

**Category:** integration

**Description:**
Verify that image data validation is triggered upon successful upload of the dataset to AWS S3.

**Test Objective:**
Ensure that the system initiates post-upload validation tasks as a placeholder for cloud-based checks.

**Expected Outcome:**
Backend logs indicate that post-upload image validation was triggered, and no errors are recorded.

**Relevant Requirements:** Acceptance Criteria 11
