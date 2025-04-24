# Test Suite for US_147

## Summary
This test suite validates the functionality, boundary cases, error handling, and performance of the Batch Data Creation Module for model training. It ensures that dataset validation, batch creation, preprocessing, and logging are accurate and in accordance with user story requirements and technical specifications.

## Test Coverage
### Functional Areas Covered
- Dataset validation
- Batch creation with valid and insufficient dataset
- Preprocessing steps (resize, normalization)
- Logging of corrupted files and batch details
- Training step calculations

### Edge Cases Covered
- Incorrect dataset path
- Batch size greater than dataset size
- Corrupted or unsupported files
- Incomplete batch processing scenario

### Areas Not Covered
- Advanced preprocessing transformations beyond resizing and normalization
- Handling non-standard or nested dataset directory structures

## Test Cases

### TC-US_147-001: Validate handling of an incorrect dataset path

**Category:** error
**Priority:** high

**Preconditions:**
The BatchDataPipeline class is initialized.

**Inputs:**
- dataset_path: ./nonexistent_directory/
- batch_size: 32
- preprocessing_config: {'resize': [224, 224], 'normalize': True}

**Steps:**
1. Initialize the BatchDataPipeline with the given dataset path, batch size, and preprocessing config.
2. Execute the pipeline to validate the dataset path.

**Expected Results:**
1. The system raises a FileNotFoundError with an appropriate error message: 'Dataset directory not found: ./nonexistent_directory/'.
2. No further processing is performed.

**Traceability:** Requirement TR-001: Validate dataset path.

### TC-US_147-002: Validate batch creation with insufficient dataset size

**Category:** boundary
**Priority:** high

**Preconditions:**
A valid dataset directory with 5 image files exists.

**Inputs:**
- dataset_path: ./small_dataset/
- batch_size: 10
- preprocessing_config: {'resize': [224, 224], 'normalize': True}

**Steps:**
1. Initialize the BatchDataPipeline with the given dataset path, batch size, and preprocessing config.
2. Execute the pipeline to create batches.

**Expected Results:**
1. The system returns an error or warning message: 'Batch size exceeds the number of images in the dataset.'
2. No batches are created, and the process terminates gracefully.

**Traceability:** Acceptance Criteria 1: Error handling when images are less than the batch size.

### TC-US_147-003: Test successful batch creation for a valid dataset

**Category:** functional
**Priority:** high

**Preconditions:**
A valid dataset directory with 50 image files exists.

**Inputs:**
- dataset_path: ./valid_dataset/
- batch_size: 10
- preprocessing_config: {'resize': [224, 224], 'normalize': True}

**Steps:**
1. Initialize the BatchDataPipeline with the given dataset path, batch size, and preprocessing config.
2. Execute the pipeline to create and check batches.

**Expected Results:**
1. The system successfully creates 5 batches of images, each containing 10 images.
2. Logs contain the batch details: {'batch_id': 1, 'image_count': 10} repeated for all 5 batches.
3. Preprocessing is correctly applied to all images in batches.

**Traceability:** Requirement TR-002: Dataset should be split into appropriate batches; User Story AC 2.

### TC-US_147-004: Test handling of corrupted image files during preprocessing

**Category:** error
**Priority:** medium

**Preconditions:**
A dataset directory with 20 valid images and 3 corrupted files exists.

**Inputs:**
- dataset_path: ./corrupted_dataset/
- batch_size: 5
- preprocessing_config: {'resize': [224, 224], 'normalize': True}

**Steps:**
1. Initialize the BatchDataPipeline with the given dataset path, batch size, and preprocessing config.
2. Execute the pipeline to preprocess images.

**Expected Results:**
1. The system logs the corrupted files: {'corrupted_files': ['file1.jpg', 'file2.jpg', 'file3.jpg']}.
2. The process skips the corrupted files and continues processing valid images.
3. All valid images are preprocessed and added to batches.

**Traceability:** Requirement TR-003: Log corrupted files in JSON; Requirement TR-005: Fault-tolerant processing.

### TC-US_147-005: Validate accurate calculation of training steps

**Category:** functional
**Priority:** high

**Preconditions:**
A valid dataset with 64 images and a batch size of 16.

**Inputs:**
- dataset_path: ./dataset_steps/
- batch_size: 16
- preprocessing_config: {'resize': [224, 224], 'normalize': True}

**Steps:**
1. Initialize the BatchDataPipeline with the given dataset path, batch size, and preprocessing config.
2. Execute the pipeline and compute the number of training steps.

**Expected Results:**
1. The system calculates the number of training steps as ceil(64/16) = 4.
2. Logs contain the correct value of training steps along with batch statistics.

**Traceability:** Requirement TR-006: Calculate training steps dynamically; Subtask 4.

### TC-US_147-006: Test parallel preprocessing with a large dataset

**Category:** performance
**Priority:** medium

**Preconditions:**
A dataset directory with 1000 images exists.

**Inputs:**
- dataset_path: ./large_dataset/
- batch_size: 50
- preprocessing_config: {'resize': [224, 224], 'normalize': True}

**Steps:**
1. Initialize the BatchDataPipeline with the given dataset path, batch size, and preprocessing config.
2. Execute the pipeline to preprocess all images in the dataset.
3. Measure the time taken for preprocessing and batch creation.

**Expected Results:**
1. The pipeline uses parallel threads to preprocess images, reducing processing time significantly compared to sequential runs.
2. Batches are created accurately, and logs show the correct details.
3. The total time for processing stays within acceptable limits (depending on system configuration).

**Traceability:** Requirement TR-002: Parallel preprocessing; Requirement TR-001: Handle large datasets efficiently.
