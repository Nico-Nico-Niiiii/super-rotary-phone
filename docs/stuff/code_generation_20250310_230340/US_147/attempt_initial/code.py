import os
import json
import argparse
import glob
from typing import List, Dict, Tuple, Optional
from PIL import Image
import numpy as np
from math import ceil
from concurrent.futures import ThreadPoolExecutor
import logging


# Configurations and defaults
class PreprocessingConfig:
    def __init__(self, resize: Tuple[int, int] = (224, 224), normalize: bool = True):
        self.resize = resize
        self.normalize = normalize


class BatchDataCreation:
    def __init__(self, dataset_path: str, batch_size: int, preprocessing_config: Optional[PreprocessingConfig] = None):
        self.dataset_path = dataset_path
        self.batch_size = batch_size
        self.preprocessing_config = preprocessing_config or PreprocessingConfig()
        self.supported_formats = (".jpg", ".jpeg", ".png")

        # Setup logger
        self.setup_logger()

        # Dataset and logs
        self.dataset = []
        self.logs = {
            "corrupted_files": [],
            "missing_labels": [],
            "batches": [],
        }

    def setup_logger(self):
        self.logger = logging.getLogger("BatchDataCreation")
        self.logger.setLevel(logging.DEBUG)
        handler = logging.FileHandler("process_logs.json", mode="w")
        handler.setFormatter(logging.Formatter('%(message)s'))
        self.logger.addHandler(handler)

    def log(self, message: Dict):
        self.logger.info(json.dumps(message))

    def validate_inputs(self):
        """
        Validates the input parameters.
        """
        if not os.path.isdir(self.dataset_path):
            raise ValueError("Invalid dataset path.")
        if self.batch_size <= 0:
            raise ValueError("Batch size must be a positive integer.")

    def load_dataset(self) -> List[Dict]:
        """
        Loads the dataset and validates image formats and labels.
        """
        image_files = glob.glob(os.path.join(self.dataset_path, "*"))
        dataset = []
        for file in image_files:
            if file.lower().endswith(self.supported_formats):
                # Example label extraction logic
                label = os.path.basename(file).split("_")[0] if "_" in os.path.basename(file) else None
                dataset.append({"image_name": file, "label": label})
                if label is None:
                    self.logs["missing_labels"].append(file)
            else:
                self.logs["corrupted_files"].append(file)
        self.dataset = dataset
        return dataset

    def create_batches(self) -> List[List[Dict]]:
        """
        Splits the dataset into batches.
        """
        if len(self.dataset) < self.batch_size:
            raise ValueError("Batch size is larger than the dataset size.")
        batches = [self.dataset[i:i + self.batch_size] for i in range(0, len(self.dataset), self.batch_size)]
        for idx, batch in enumerate(batches):
            self.logs["batches"].append({"batch_id": idx + 1, "image_count": len(batch)})
        return batches

    def preprocess_image(self, image_data: Dict) -> Optional[np.ndarray]:
        """
        Applies preprocessing (resize, normalization) on a single image.
        """
        try:
            with Image.open(image_data["image_name"]) as img:
                img = img.resize(self.preprocessing_config.resize)
                img_array = np.array(img)
                if self.preprocessing_config.normalize:
                    img_array = img_array / 255.0
                return img_array
        except Exception as e:
            self.logs["corrupted_files"].append(image_data["image_name"])
            self.log({"error": str(e), "file": image_data["image_name"]})
            return None

    def preprocess_batch(self, batch: List[Dict]) -> Tuple[np.ndarray, List[str]]:
        """
        Preprocesses a batch of images in parallel.
        """
        preprocessed_images = []
        labels = []
        with ThreadPoolExecutor() as executor:
            results = executor.map(self.preprocess_image, batch)
            for result, data in zip(results, batch):
                if result is not None:
                    preprocessed_images.append(result)
                    labels.append(data["label"])
        return np.array(preprocessed_images), labels

    def convert_to_numpy(self, images: np.ndarray, labels: List[str]) -> Tuple[np.ndarray, np.ndarray]:
        """
        Converts images and labels to numpy arrays.
        """
        label_array = np.array(labels)
        return images, label_array

    def calculate_training_steps(self) -> int:
        """
        Calculates the number of training steps based on batch size and dataset size.
        """
        return ceil(len(self.dataset) / self.batch_size)

    def save_logs(self):
        """
        Saves logs to a JSON file.
        """
        with open("process_logs.json", "w") as log_file:
            json.dump(self.logs, log_file, indent=4)

    def run(self):
        """
        Executes the full batch data creation pipeline.
        """
        try:
            self.validate_inputs()
            self.load_dataset()

            batches = self.create_batches()
            training_steps = self.calculate_training_steps()

            # Processing batches
            for batch_idx, batch in enumerate(batches, 1):
                images, labels = self.preprocess_batch(batch)
                images_np, labels_np = self.convert_to_numpy(images, labels)
                self.log({
                    "batch_id": batch_idx,
                    "processed_images": images_np.shape[0],
                    "labels_count": len(labels_np),
                })

            self.save_logs()
            print(f"Batch data creation completed. Training steps: {training_steps}")
        except Exception as e:
            self.log({"error": str(e)})
            print(f"Error occurred: {e}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Batch Data Creation for Model Training")
    parser.add_argument("--dataset_path", type=str, required=True, help="Path to the dataset")
    parser.add_argument("--batch_size", type=int, required=True, help="Size of each batch")
    parser.add_argument("--resize_width", type=int, default=224, help="Width to resize the images")
    parser.add_argument("--resize_height", type=int, default=224, help="Height to resize the images")
    parser.add_argument("--normalize", type=bool, default=True, help="Whether to normalize images")

    args = parser.parse_args()

    preprocessing_config = PreprocessingConfig(
        resize=(args.resize_width, args.resize_height),
        normalize=args.normalize
    )
    batch_creator = BatchDataCreation(args.dataset_path, args.batch_size, preprocessing_config)
    batch_creator.run()