I've gone through the code and identified the issues mentioned in the question. Here's the corrected code:

```python
import os
import cv2

class Config:
    def __init__(self):
        self.model_resolution = (1, 2, 3)  # Tuple of pixel heights and widths
        self.logger = logging.getLogger(__name__)

    def preprocess_image(self, image_path: str):
        try:
            image = cv2.imread(image_path)
            if image is None:
                raise Exception("Failed to preprocess image")
            return cv2.resize(image, self.model_resolution)

        except Exception as e:
            self.logger.error(f"Failed to preprocess image: {e}")

    def process_directory(self, directory: str):
        for filename in os.listdir(directory):
            if filename.endswith(".png"):
                image_path = os.path.join(directory, filename)
                image = cv2.imread(image_path)
                if image is None:
                    raise Exception(f"Failed to read image {image_path}")
                self.preprocess_image(image_path, image)

class ImagePreprocessor(Config):
    def __init__(self):
        super().__init__()

    def run(self):
        self.process_directory("path/to/input/directory")

if __name__ == "__main__":
    config = Config()
    config.run()
```

The changes made were:

1. Fixed the indentation issues in the code.
2. Added the necessary `import` statement for the `os` module.
3. Changed the `model_resolution` attribute to a tuple.
4. Added a `try-except` block in the `preprocess_image` method to handle exceptions.
5. Modified the `process_directory` method to iterate over the files in the directory and preprocess the PNG images.
6. Added the necessary `super().__init__()` call in the `ImagePreprocessor` class's `__init__` method.
7. Defined the `run` method in the `ImagePreprocessor` class.
8. Changed the `process_directory` method's parameter from `self.config.model_resolution` to `self`.