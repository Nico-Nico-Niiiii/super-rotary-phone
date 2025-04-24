# Complete Python Code for Batch Data Creation Module for Model Training

import os
import json
import logging
from math import ceil
from typing import List, Dict, Optional, Tuple
from concurrent.futures import ThreadPoolExecutor
from PIL import Image
import numpy as np

# Configure Logging
logging.basicConfig(
    filename='processing_logs.json',
    filemode='w',
    level=logging.INFO,
    format='%(message)s'
)


class Logger:
    """Logger for JSON structured logging."""
    
    def __init__(self):
        self.logs = {
            "corrupted_files": [],
            "missing_labels": [],
            "batches": []
        }
    
    def log_corrupted_file(self, file_name: str):
        """Log a corrupted file."""
        self.logs["corrupted_files"].append(file_name)
    
    def log_missing_label(self, file_name: str):
        """Log a missing label."""
        self.logs["missing_labels"].append(file_name)
    
    def log_batch_info(self, batch_id: int, image_count: int):
        """Log batch details."""
        self.logs["batches"].append({
            "batch_id": batch_id,
            "image_count": image_count
        })
    
    def save(self):
        """Save logs to a JSON file."""
        with open('processing_logs.json', 'w') as log_file:
            json.dump(self.logs, log_file, indent=4)


class InputHandler:
    """Handles loading datasets, input validation, and reading image names and labels."""
    
    SUPPORTED_FORMATS = ('.png', '.jpeg', '.jpg')
    
    @staticmethod
    def validate_dataset(path: str) -> List[Dict[str, Optional[str]]]:
        """Validate dataset path and extract image names and labels."""
        if not os.path.exists(path):
            raise FileNotFoundError(f"Dataset path {path} does not exist.")
        
        dataset = []
        for file_name in os.listdir(path):
            if file_name.lower().endswith(InputHandler.SUPPORTED_FORMATS):
                # Assuming labels are derived based on filenames (customizable)
                label = os.path.splitext(file_name)[0].split('_')[-1]
                dataset.append({"image_name": file_name, "label": label if label else None})
        
        return dataset


class BatchCreation:
    """Handles creation of training batches."""
    
    @staticmethod
    def create_batches(dataset: List[Dict[str, Optional[str]]], batch_size: int) -> List[List[Dict[str, Optional[str]]]]:
        """Split dataset into batches."""
        if batch_size <= 0:
            raise ValueError("Batch size must be greater than zero.")
        if len(dataset) == 0:
            raise ValueError("Dataset is empty.")
        
        batches = [
            dataset[i:i + batch_size]
            for i in range(0, len(dataset), batch_size)
        ]
        return batches


class Preprocessor:
    """Applies preprocessing steps to images."""
    
    DEFAULT_CONFIG = {
        "resize": (224, 224),
        "normalize": True
    }
    
    @staticmethod
    def preprocess_image(image_path: str, config: Dict = None) -> Optional[np.ndarray]:
        """Resize, normalize, and preprocess an image."""
        try:
            config = config or Preprocessor.DEFAULT_CONFIG
            img = Image.open(image_path).convert('RGB')
            if config.get("resize"):
                img = img.resize(config["resize"])
            img_array = np.array(img, dtype=np.float32)
            if config.get("normalize"):
                img_array = img_array / 255.0  # Simple normalization
            return img_array
        except Exception as e:
            # Handle corrupted files
            logging.error(f"Error processing image {image_path}: {e}")
            return None


class TrainingStepCalculator:
    """Calculate the number of training steps dynamically."""
    
    @staticmethod
    def calculate_steps(total_images: int, batch_size: int) -> int:
        """Calculate steps for given dataset."""
        if batch_size <= 0:
            raise ValueError("Batch size must be greater than zero.")
        return ceil(total_images / batch_size)


class BatchDataPipeline:
    """Main pipeline for batch data creation, processing, and logging."""
    
    def __init__(self, dataset_path: str, batch_size: int, preprocessing_config: Dict = None):
        self.dataset_path = dataset_path
        self.batch_size = batch_size
        self.preprocessing_config = preprocessing_config
        self.logger = Logger()
    
    def run(self):
        """Execute the data creation and preprocessing pipeline."""
        try:
            # Step 1: Input handling
            dataset = InputHandler.validate_dataset(self.dataset_path)
            logging.info(f"Loaded {len(dataset)} images from dataset.")
            
            # Validate labels and log missing ones
            dataset = [d for d in dataset if d["label"] is not None or not self.logger.log_missing_label(d["image_name"])]
            
            # Step 2: Batch creation
            batches = BatchCreation.create_batches(dataset, self.batch_size)
            for batch_id, batch in enumerate(batches, 1):
                self.logger.log_batch_info(batch_id, len(batch))
            
            # Step 3: Preprocessing with parallel execution
            with ThreadPoolExecutor() as executor:
                for batch in batches:
                    # Process each batch in parallel
                    batch_images = [
                        executor.submit(
                            Preprocessor.preprocess_image,
                            os.path.join(self.dataset_path, item["image_name"]),
                            self.preprocessing_config
                        ) for item in batch
                    ]
                    
                    # Collect results and handle corrupted files
                    processed_images = []
                    for img_future, batch_item in zip(batch_images, batch):
                        processed_image = img_future.result()
                        if processed_image is not None:
                            processed_images.append(processed_image)
                        else:
                            self.logger.log_corrupted_file(batch_item["image_name"])
            
            # Step 4: Calculate training steps
            total_training_steps = TrainingStepCalculator.calculate_steps(len(dataset), self.batch_size)
            logging.info(f"Total training steps: {total_training_steps}")
        
        finally:
            # Save final logs
            self.logger.save()


# Example Usage
if __name__ == "__main__":
    dataset_path = "path/to/dataset"
    batch_size = 32
    preprocessing_config = {
        "resize": (224, 224),
        "normalize": True
    }
    
    pipeline = BatchDataPipeline(dataset_path, batch_size, preprocessing_config)
    pipeline.run()