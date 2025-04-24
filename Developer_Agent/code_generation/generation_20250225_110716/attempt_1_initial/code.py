from pathlib import Path
import os
import fileType
import numpy as np
import tensorflow as tf
from typing import Tuple

class ImagePreprocessor:
    def __init__(self, model_directory: str, batch_size: int) -> None:
        """
        Initialize the ImagePreprocessor instance.

        Args:
        - model_directory (str): Directory path where the AI model resides.
        - batch_size (int): Number of images to be processed in each batch.
        """
        self.model_directory = Path(model_directory)
        self.batch_size = batch_size

    def preprocess_image(self, image_path: str) -> tf.image:
        """
        Perform image preprocessing for a given image.

        Args:
        - image_path (str): Path to the image to be preprocessed.

        Returns:
        - tf.image: Preprocessed image.
        """
        image = tf.io.read_file(image_path)
        image = tf.image.decode_image(image, channels=3)
        image = tf.image.convert_image_dtype(image, tf.float32)
        return image

    def resize_image(self, image: tf.image, new_size: Tuple[int, int]) -> tf.image:
        """
        Resize an image to the desired size.

        Args:
        - image (tf.image): The image to be resized.
        - new_size (Tuple[int, int]): The desired size of the image (width, height).

        Returns:
        - tf.image: Resized image.
        """
        return tf.image.resize(image, new_size)

    def normalize_image(self, image: tf.image) -> tf.image:
        """
        Normalize an image to the pixel datatype required by the AI model.

        Args:
        - image (tf.image): The image to be normalized.

        Returns:
        - tf.image: Normalized image.
        """
        return tf.image.cast(image, tf.uint8)

    def preprocess_and_save_batch(self, dataset: tf.data.Dataset) -> None:
        """
        Preprocess a batch of images and save the preprocessed images to the model directory.

        Args:
        - dataset (tf.data.Dataset): Batch of images to be preprocessed.
        """
        for i, image in enumerate(dataset):
            preprocessed_image = self.preprocess_image(image)
            preprocessed_image = self.resize_image(preprocessed_image, (244, 244))  # Assuming the model requires 244x244 images
            preprocessed_image = self.normalize_image(preprocessed_image)
            tf.saved_model.save(preprocessed_image, os.path.join(self.model_directory, f"preprocessed_image_epoch_{i}"))

    def preprocess_and_predict(self, dataset: tf.data.Dataset) -> None:
        """
        Preprocess a batch of images and perform model inferencing using the preprocessed images.

        Args:
        - dataset (tf.data.Dataset): Batch of images to be preprocessed.
        """
        for i, image in enumerate(dataset):
            preprocessed_image = self.preprocess_image(image)
            preprocessed_image = self.resize_image(preprocessed_image, (244, 244))  # Assuming the model requires 244x244 images
            preprocessed_image = self.normalize_image(preprocessed_image)
            tf.io.write_to TensorFlowRecord(preprocessed_image, os.path.join(self.model_directory, f"preprocessed_image_epoch_{i}.tfrecord"))

    def run(self) -> None:
        """
        Run the image preprocessing and prediction workflow.

        Args:
        None
        """
        model_directory = self.model_directory
        batch_size = self.batch_size
        
        if os.path.exists(model_directory):
            training_dataset = tf.data.TFRecordDataset(model_directory).batch(batch_size)
            validation_dataset = tf.data.TFRecordDataset(model_directory).batch(batch_size)
        
            self.preprocess_and_save_batch(training_dataset)
            self.preprocess_and_predict(validation_dataset)
        else:
            print("Model directory does not exist")