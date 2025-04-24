# Test Scenarios for US_147

## Summary
This test suite ensures the batch data preparation module functions as expected across functional, edge case, error handling, and integration scenarios. It tests proper dataset validation, batch creation, image preprocessing, training step calculation, logging integrity, and error tolerance.

## Test Coverage
### Functional Areas
- Dataset validation
- Batch creation
- Image preprocessing
- Training step calculation
- Logging

### Edge Cases
- Batch size larger than dataset
- Empty dataset

### Areas Not Covered
- Limited support for non-standard image formats
- Reliance on filename labeling conventions

## Test Scenarios

### TS-US_147-001: Validate Dataset Path and Input Parameters

**Category:** functional

**Description:**
Tests if the system validates the provided dataset path and input parameters correctly.

**Test Objective:**
Ensure invalid paths or unsupported image formats are rejected, and appropriate error messages are returned.

**Expected Outcome:**
System throws an error for invalid paths or unsupported formats; valid paths load successfully.

**Relevant Requirements:** ['TR-001', 'TR-006']

### TS-US_147-002: Batch Creation with Sufficient Images

**Category:** functional

**Description:**
Tests if the system distributes a valid dataset into batches according to the provided batch size.

**Test Objective:**
Verify batch creation logic ensures all images are appropriately grouped into batches, including handling incomplete last batches.

**Expected Outcome:**
Dataset is divided into batches, with proper handling for the last batch if the dataset size is not a multiple of the batch size.

**Relevant Requirements:** ['TR-002']

### TS-US_147-003: Edge Case: Batch Size Larger Than Dataset

**Category:** edge_case

**Description:**
Tests the system’s behavior when the provided batch size exceeds the total number of images in the dataset.

**Test Objective:**
Validate that an appropriate error message is returned, as per the user story acceptance criteria.

**Expected Outcome:**
The system throws an error stating that the batch size exceeds the dataset size.

**Relevant Requirements:** ['Acceptance Criteria #1']

### TS-US_147-004: Parallel Preprocessing of Images

**Category:** performance

**Description:**
Tests if the preprocessing module efficiently processes images in batches using threading.

**Test Objective:**
Verify performance improvement through parallel preprocessing and correctness of processed images.

**Expected Outcome:**
Images are resized and normalized correctly, with preprocessing times reduced due to parallel processing.

**Relevant Requirements:** ['TR-002', 'Subtask #3']

### TS-US_147-005: Error Handling for Corrupted Files in Preprocessing

**Category:** error

**Description:**
Tests whether corrupted files in the dataset are skipped during preprocessing and logged correctly.

**Test Objective:**
Ensure corrupted files are identified and skipped without terminating the pipeline.

**Expected Outcome:**
Corrupted files are logged, preprocessing continues for the remaining images, and the pipeline completes successfully.

**Relevant Requirements:** ['TR-005', 'TR-003']

### TS-US_147-006: Verify Training Step Calculation Logic

**Category:** functional

**Description:**
Tests the dynamic calculation of training steps based on total image count and batch size.

**Test Objective:**
Validate that the number of steps is rounded up for incomplete batches using the ceiling function.

**Expected Outcome:**
The calculated training steps match the formula `ceil(total_images / batch_size)`.

**Relevant Requirements:** ['TR-005', 'Subtask #2']

### TS-US_147-007: Integration Test for Batch Data Pipeline

**Category:** integration

**Description:**
Tests the end-to-end functionality of the pipeline, including validation, batch creation, preprocessing, logging, and training step calculation.

**Test Objective:**
Ensure all components work together seamlessly to prepare batch data for model training.

**Expected Outcome:**
The pipeline completes successfully, generates valid batches, preprocesses images, logs outputs, and calculates training steps.

**Relevant Requirements:** ['Technical Requirements Overview', 'Subtasks #1–#4']

### TS-US_147-008: Log File Completeness and Structure

**Category:** functional

**Description:**
Tests whether generated JSON logs include information on corrupted files, missing labels, and batch metadata.

**Test Objective:**
Validate the format and completeness of generated logs for traceability and debugging.

**Expected Outcome:**
Log files contain accurate information on corrupted files, missing labels, batch details, and other relevant data in JSON format.

**Relevant Requirements:** ['TR-003']
