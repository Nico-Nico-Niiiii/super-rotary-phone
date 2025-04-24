# Test Suite for US_143

## Summary
This test suite validates the full functionality of the image retrieval, validation, pre-processing, and integration aspects of the module. It includes functional tests for happy paths, edge cases, error scenarios, boundary conditions, and integration with external PACS and AI services.

## Test Coverage
### Functional Areas Covered
- PACS integration and retrieval
- Error handling in image retrieval
- Image validation and pre-processing
- AI inferencing integration

### Edge Cases Covered
- Non-existing patient ID
- No images available for a valid patient ID
- Transient PACS connection failures

### Areas Not Covered
- Handling complex image transformations for specialized AI models

## Test Cases

### TC-US_143-001: Verify image data retrieval for a valid PATIENT_ID from PACS

**Category:** functional
**Priority:** high

**Preconditions:**
Ensure the PACS server is running and contains valid images for PATIENT_ID 'PAT12345'.

**Inputs:**
- patient_id: PAT12345
- source: PACS

**Steps:**
1. Send a POST request to the '/retrieve-images' endpoint with PATIENT_ID 'PAT12345'.
2. Verify that the response returns a status code of 200.
3. Verify that the retrieved image metadata contains valid entries (e.g., file format is 'DICOM').

**Expected Results:**
1. Response status is 200.
2. The 'images' field contains metadata for images retrieved from PACS, including image_id, file_path, and format.
3. The images are valid and passed validation.

**Traceability:** Acceptance Criteria 1, 4

### TC-US_143-002: Return error when a non-existing PATIENT_ID is queried

**Category:** error
**Priority:** high

**Preconditions:**
Ensure the PACS server does not contain any data for PATIENT_ID 'PAT99999'.

**Inputs:**
- patient_id: PAT99999
- source: PACS

**Steps:**
1. Send a POST request to the '/retrieve-images' endpoint with PATIENT_ID 'PAT99999'.
2. Verify that an error response is returned.

**Expected Results:**
1. Response status is 404.
2. Error message is: 'Patient ID not found in PACS.'

**Traceability:** Acceptance Criteria 2

### TC-US_143-003: Handle scenario when no images are available for a valid PATIENT_ID in PACS

**Category:** error
**Priority:** medium

**Preconditions:**
Ensure the PACS server has a record for PATIENT_ID 'PAT56789' but contains no image data for the patient.

**Inputs:**
- patient_id: PAT56789
- source: PACS

**Steps:**
1. Send a POST request to the '/retrieve-images' endpoint with PATIENT_ID 'PAT56789'.
2. Verify that an appropriate error message is returned.

**Expected Results:**
1. Response status is 404.
2. Error message is: 'No relevant image records available in PACS for the specified PATIENT_ID.'

**Traceability:** Acceptance Criteria 3

### TC-US_143-004: Verify multiple images retrieved and pre-processed for a valid PATIENT_ID

**Category:** integration
**Priority:** high

**Preconditions:**
Ensure the PACS server contains multiple images associated with PATIENT_ID 'PAT24680'.

**Inputs:**
- patient_id: PAT24680
- source: PACS

**Steps:**
1. Send a POST request to the '/retrieve-images' endpoint with PATIENT_ID 'PAT24680'.
2. Verify that multiple image metadata entries are returned for the patient.
3. Verify the logs entry for retrieved images includes the patient_id and the number of successful validations.
4. Confirm that the retrieved images are preprocessed and packaged into a .zip file.

**Expected Results:**
1. Response status is 200.
2. Multiple retrieved images are listed in the metadata.
3. Images are resized to 256x256 resolution, enhanced, converted to JPEG, and zipped.
4. The packaged .zip file path is included in the response.

**Traceability:** Acceptance Criteria 1, 4, 5

### TC-US_143-005: Verify retry mechanism for transient PACS retrieval failures

**Category:** performance
**Priority:** medium

**Preconditions:**
Simulate transient connectivity issues with the PACS server.

**Inputs:**
- patient_id: PAT12345
- source: PACS

**Steps:**
1. Disable the PACS server connection temporarily.
2. Send a POST request to the '/retrieve-images' endpoint with PATIENT_ID 'PAT12345'.
3. Track the retry attempts in logs.
4. Re-enable the PACS server connection before maximum retry limit is reached.

**Expected Results:**
1. The service retries PACS retrieval with exponential backoff intervals (5s, 10s, 20s).
2. Upon re-establishment of connectivity, the request succeeds and retrieves images for the patient.
3. Logs indicate the retry mechanism was triggered.

**Traceability:** Technical Requirement 3

### TC-US_143-006: Validate image pre-processing output quality and naming convention

**Category:** functional
**Priority:** medium

**Preconditions:**
Retrieve images for a valid PATIENT_ID and allow them to be pre-processed.

**Inputs:**
- patient_id: PAT12345
- source: local

**Steps:**
1. Send a POST request to the '/retrieve-images' endpoint with PATIENT_ID 'PAT12345'.
2. Check the processed images stored in the local directory.
3. Verify resolution is standardized to 256x256 pixels.
4. Verify converted images are in JPEG format and filenames follow the convention `<patient_id>_<image_id>.jpeg`.

**Expected Results:**
1. Pre-processed images are resized to 256x256 resolution.
2. Images are converted to JPEG format with enhanced contrast.
3. Images are named following the convention '<patient_id>_<image_id>.jpeg'.

**Traceability:** Technical Requirements 2, 4

### TC-US_143-007: Test concurrent requests for image retrieval and validation

**Category:** performance
**Priority:** high

**Preconditions:**
Ensure the PACS server contains sufficient data for 10 unique PATIENT_IDs.

**Inputs:**
- patient_ids: ['PAT1001', 'PAT1002', 'PAT1003', 'PAT1004', 'PAT1005', 'PAT1006', 'PAT1007', 'PAT1008', 'PAT1009', 'PAT1010']

**Steps:**
1. Send 10 concurrent POST requests to the '/retrieve-images' endpoint, each with a distinct PATIENT_ID.
2. Monitor system resource utilization during processing.
3. Validate successful retrieval and storage of all patient image data.

**Expected Results:**
1. All requests are processed asynchronously with no bottleneck.
2. System handles up to 100 concurrent requests as specified in the performance requirements.
3. Images are validated and processed for each patient.

**Traceability:** Technical Requirement 5
