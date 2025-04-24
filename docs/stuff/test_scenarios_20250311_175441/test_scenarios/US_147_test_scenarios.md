# Test Scenarios for US_147

## Summary
This test suite aims to validate the functionality, edge case handling, error management, and integration points of the Batch Data Creation Module. Test coverage includes validation of dataset handling, batch creation, preprocessing, logging, and dynamic training step calculations.

## Test Coverage
### Functional Areas
- Dataset validation and image label extraction
- Batch creation and handling
- Image preprocessing (resize/normalize)
- Dynamic training step calculation
- Logging for corrupted files/missing labels

### Edge Cases
- Insufficient images for batch size
- Invalid dataset path handling
- Corrupted image files

### Areas Not Covered
- Processing unsupported file formats
- Scalability testing with extremely large datasets

## Test Scenarios

### TS-US_147-001: Valid Dataset Path and Image Labels Handling

**Category:** functional

**Description:**
The InputHandler module validates the dataset path and loads image names and labels correctly.

**Test Objective:**
Ensure the module extracts valid image names and labels while correctly handling supported file formats.

**Expected Outcome:**
The dataset is successfully loaded, and valid image names and labels are returned in the correct format.

**Relevant Requirements:** TR-001, TR-006

### TS-US_147-002: Batch Creation for Adequate Number of Images

**Category:** functional

**Description:**
The BatchCreation module distributes images into batches when the total images exceed the specified batch size.

**Test Objective:**
Verify that valid images are divided into equally sized batches based on the batch size.

**Expected Outcome:**
Batches of the correct size are returned, and any leftover images are in an additional batch.

**Relevant Requirements:** TR-005

### TS-US_147-003: Handling Insufficient Images for Batch Size

**Category:** edge_case

**Description:**
Test handling when the number of images in the dataset is less than the batch size.

**Test Objective:**
Validate the pipeline's ability to return an appropriate error message for insufficient images.

**Expected Outcome:**
An error message is logged and returned, indicating that the batch size exceeds the total dataset size.

**Relevant Requirements:** Acceptance Criteria 1

### TS-US_147-004: Parallel Preprocessing of Images

**Category:** performance

**Description:**
The Preprocessor module applies resizing and normalization to images concurrently using threads.

**Test Objective:**
Ensure preprocessing is performed efficiently on all valid images while maintaining data integrity.

**Expected Outcome:**
Images are resized and normalized correctly, and processing time is reduced due to parallel execution.

**Relevant Requirements:** TR-002

### TS-US_147-005: Logging Missing Labels and Corrupted Files

**Category:** functional

**Description:**
Test the logging mechanism for documenting missing labels and corrupted files during preprocessing.

**Test Objective:**
Verify that missing labels and corrupted files are logged accurately in JSON format without halting processing.

**Expected Outcome:**
Structured JSON logs are created with details of missing labels and corrupted files in 'processing_logs.json'.

**Relevant Requirements:** TR-003

### TS-US_147-006: Dynamic Calculation of Training Steps

**Category:** functional

**Description:**
The TrainingStepCalculator dynamically computes training steps based on dataset size and batch size.

**Test Objective:**
Ensure the correct number of training steps is returned using the ceiling division formula.

**Expected Outcome:**
Training steps are calculated correctly and match the dataset size divided by batch size (rounded up).

**Relevant Requirements:** TR-005

### TS-US_147-007: Integration of BatchCreation and Preprocessor

**Category:** integration

**Description:**
Test the functionality when batches created by BatchCreation are passed to Preprocessor for parallel image handling.

**Test Objective:**
Verify the proper collaboration between BatchCreation and Preprocessor in the pipeline workflow.

**Expected Outcome:**
Batches are processed correctly by the Preprocessor, with all valid images returned after processing.

**Relevant Requirements:** TR-001, TR-002

### TS-US_147-008: Error Handling for Invalid Dataset Path

**Category:** error

**Description:**
Test how the InputHandler responds to invalid dataset paths.

**Test Objective:**
Confirm that an appropriate error message is returned and the pipeline halts gracefully.

**Expected Outcome:**
An error message indicating an invalid path is logged, and no further processing takes place.

**Relevant Requirements:** TR-001
