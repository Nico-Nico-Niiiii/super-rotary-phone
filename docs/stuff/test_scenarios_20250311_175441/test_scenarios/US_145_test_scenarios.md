# Test Scenarios for US_145

## Summary
Test scenarios for validating the Image Quality Validation module's functionality, error handling, edge cases, and integration with preprocessing workflows, ensuring compliance with user story requirements and technical specifications.

## Test Coverage
### Functional Areas
- Resolution validation
- Blank image detection
- Duplicate DICOM detection
- Metadata extraction
- Preprocessing integration

### Edge Cases
- Corrupted DICOM file metadata
- Unsupported image formats
- Empty dataset

### Areas Not Covered
- Color image handling for blank detection
- Resolution validation for corrupt files
- Limits on Redis performance under high load

## Test Scenarios

### TS-US_145-001: Validation of images with resolution greater than or equal to the minimum threshold (512x512)

**Category:** functional

**Description:**
Tests that the system successfully validates images with resolutions that meet or exceed the required minimum threshold and returns a success message.

**Test Objective:**
Verify that valid images pass the resolution check without errors.

**Expected Outcome:**
The system returns a success response with validation status marked as 'VALID' and no error messages for qualifying images.

**Relevant Requirements:** Acceptance Criteria 1

### TS-US_145-002: Validation failure when resolution is below 512x512

**Category:** functional

**Description:**
Tests that the system rejects images with resolutions below the required threshold, returning an error message.

**Test Objective:**
Ensure the resolution validation correctly flags images below the minimum resolution.

**Expected Outcome:**
The system responds with validation status marked as 'INVALID' and an error message indicating resolution is below the threshold.

**Relevant Requirements:** Acceptance Criteria 2

### TS-US_145-003: Blank image detection for training datasets

**Category:** functional

**Description:**
Tests that blank images in a training dataset are identified and excluded from validation results while providing appropriate messages.

**Test Objective:**
Verify blank image detection logic for training workflows.

**Expected Outcome:**
The system identifies blank images, excludes them from valid results, and returns a message indicating their removal.

**Relevant Requirements:** Acceptance Criteria 3

### TS-US_145-004: Blank image detection for inferencing datasets

**Category:** functional

**Description:**
Tests that blank images submitted for AI model inferencing are rejected with an appropriate error message.

**Test Objective:**
Check blank image detection during AI prediction workflows.

**Expected Outcome:**
The system marks blank images as 'INVALID' and returns an error message indicating inferencing cannot proceed with blank images.

**Relevant Requirements:** Acceptance Criteria 4

### TS-US_145-005: Duplicate DICOM detection for training datasets

**Category:** functional

**Description:**
Tests that duplicate DICOM images in training datasets are identified and excluded, with appropriate messages indicating their removal.

**Test Objective:**
Validate duplicate detection based on SOP Instance UID in Redis cache.

**Expected Outcome:**
Duplicate DICOM images are flagged, removed from valid results, and error messages are returned for each duplicate.

**Relevant Requirements:** Acceptance Criteria 5

### TS-US_145-006: Error handling for unsupported image formats

**Category:** error

**Description:**
Tests that the system rejects unsupported image formats (e.g., BMP, GIF) with appropriate error messages.

**Test Objective:**
Ensure input validation catches invalid image formats.

**Expected Outcome:**
The system returns an error response with a message indicating only JPEG, PNG, or DICOM formats are supported.

**Relevant Requirements:** Edge Case 1

### TS-US_145-007: Error handling for corrupted DICOM files

**Category:** edge_case

**Description:**
Tests that the system properly handles corrupted DICOM files with missing or invalid SOPInstanceUID metadata.

**Test Objective:**
Check the robustness of metadata extraction and response to corrupted inputs.

**Expected Outcome:**
The system returns an error response and marks the image as 'INVALID' with an error message indicating SOPInstanceUID is missing or corrupted.

**Relevant Requirements:** Edge Case 4

### TS-US_145-008: Integration with preprocessing module for valid images

**Category:** integration

**Description:**
Tests that validated images are correctly transferred to the preprocessing module for downstream processing.

**Test Objective:**
Ensure integration between image validation and preprocessing.

**Expected Outcome:**
The system successfully transfers validated images, returns a success message, and confirms data integrity during transfer.

**Relevant Requirements:** Acceptance Criteria 6
