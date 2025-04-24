# Usage Instructions

## Setup and Configuration

1. Prerequisites:
   - Python 3.8 or higher
   - Required packages: OpenCV, NumPy, Pandas, Logging

2. Installation:
   ```bash
   pip install opencv-python numpy pandas
   ```

3. Configuration Settings:
   Modify the configuration with your specific settings:
   - input_directory: Path to your input images
   - output_directory: Path for processed images
   - model_resolution: Target image size (height, width)
   - bit_representations: Required bit depths [1, 8, 16, 24, 32]
   - pixel_datatype: Target pixel datatype
   - log_file: Path for logging

4. Example Usage:
   ```python
   config = Config(
       input_directory="/data/input_images",
       output_directory="/data/processed_images",
       model_resolution=(224, 224),
       bit_representations=[8, 16, 32],
       pixel_datatype="uint8",
       log_file="/logs/preprocessing.log"
   )

   preprocessor = ImagePreprocessor(config)
   preprocessor.run()
   ```

5. Output:
   - Processed images will be saved in output_directory
   - Processing logs will be saved in the specified log_file
   - Console will show progress information
