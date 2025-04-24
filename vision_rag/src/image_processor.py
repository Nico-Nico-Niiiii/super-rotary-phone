import os
import base64
import io
from typing import Dict, List, Optional, Tuple, Union
from pathlib import Path
import json
import torch
import numpy as np
from PIL import Image
from openai import AzureOpenAI
import torchvision.transforms as transforms
from torch.cuda import is_available as cuda_available

from utils.logger import logger
from config.settings import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,
    IMAGE_DIRECTORY,
    MAX_IMAGE_SIZE,
    IMAGE_FORMATS,
)


class ImageProcessor:
    """
    Process images for the vision-based RAG system with GPU acceleration.
    Extract features and generate embeddings using Azure OpenAI.
    """
    
    def __init__(self):
        """Initialize the ImageProcessor with Azure OpenAI client and GPU support."""
        self.client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )
        self.model = AZURE_OPENAI_CHAT_DEPLOYMENT_NAME
        
        # Set up device (GPU if available, otherwise CPU)
        self.device = torch.device("cuda" if cuda_available() else "cpu")
        logger.info(f"ImageProcessor initialized with model: {self.model} on device: {self.device}")
        
        # Set up GPU-accelerated transforms
        self.transform = transforms.Compose([
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Create image directory if it doesn't exist
        os.makedirs(IMAGE_DIRECTORY, exist_ok=True)
    
    def image_to_base64(self, image_path: Union[str, Path]) -> str:
        """
        Convert an image to base64 encoding.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Base64 encoded string of the image
        """
        with open(image_path, "rb") as img_file:
            return base64.b64encode(img_file.read()).decode("utf-8")
    
    def resize_image(self, image: Image.Image) -> Image.Image:
        """
        Resize image to fit within max dimensions while preserving aspect ratio.
        Uses GPU if available.
        
        Args:
            image: PIL Image object
            
        Returns:
            Resized PIL Image object
        """
        width, height = image.size
        max_width, max_height = MAX_IMAGE_SIZE
        
        # Check if resizing is needed
        if width <= max_width and height <= max_height:
            return image
        
        # Calculate new dimensions
        if width > height:
            new_width = max_width
            new_height = int(height * (max_width / width))
        else:
            new_height = max_height
            new_width = int(width * (max_height / height))
        
        # GPU-accelerated resize if possible
        if self.device.type == "cuda" and hasattr(transforms, "Resize"):
            # Convert PIL to tensor, resize, then back to PIL
            tensor_img = self.transform(image).unsqueeze(0).to(self.device)
            resized_tensor = transforms.functional.resize(tensor_img, (new_height, new_width))
            # Convert back to PIL
            resized_img = transforms.ToPILImage()(resized_tensor.squeeze(0).cpu())
            return resized_img
        else:
            # Fall back to standard PIL resize
            return image.resize((new_width, new_height), Image.LANCZOS)
    
    def preprocess_image(self, image_path: Union[str, Path]) -> Optional[Dict]:
        """
        Preprocess an image for analysis with GPU acceleration where possible.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with preprocessed image data or None if processing fails
        """
        try:
            # Load and preprocess image
            image_path = Path(image_path)
            
            # Get the file extension to determine format
            file_ext = image_path.suffix.lower()
            
            try:
                # First, try opening directly
                image = Image.open(image_path)
                format_name = image.format
                
                # If format is None, try to determine from file extension
                if format_name is None:
                    ext_to_format = {
                        '.jpg': 'JPEG',
                        '.jpeg': 'JPEG',
                        '.png': 'PNG',
                        '.webp': 'WEBP',
                        '.gif': 'GIF',
                        '.bmp': 'BMP'
                    }
                    format_name = ext_to_format.get(file_ext, 'JPEG')  # Default to JPEG
            except Exception as img_error:
                logger.warning(f"Initial image open failed, trying with explicit format: {img_error}")
                
                # Try opening with explicit format based on file extension
                with open(image_path, 'rb') as f:
                    image_data = f.read()
                    
                image = Image.open(io.BytesIO(image_data))
                
                # Determine format from extension
                if file_ext in ['.jpg', '.jpeg']:
                    format_name = 'JPEG'
                elif file_ext == '.png':
                    format_name = 'PNG'
                elif file_ext == '.webp':
                    format_name = 'WEBP'
                else:
                    format_name = 'JPEG'  # Default
            
            # Convert to RGB if needed (handle PNG with alpha channel)
            if image.mode != "RGB":
                image = image.convert("RGB")
            
            # Resize if needed
            image = self.resize_image(image)
            
            # Get image metadata
            width, height = image.size
            
            # Save processed image to buffer for base64 encoding
            buffer = io.BytesIO()
            image.save(buffer, format=format_name)
            buffer.seek(0)
            
            base64_image = base64.b64encode(buffer.read()).decode("utf-8")
            
            return {
                "filename": image_path.name,
                "format": format_name,
                "width": width,
                "height": height,
                "base64": base64_image,
            }
        
        except Exception as e:
            logger.error(f"Error preprocessing image {image_path}: {e}")
            return None
    
    def extract_image_features(self, image_data: Dict) -> Dict:
        """
        Extract features from an image using Azure OpenAI's vision capabilities.
        Handles content policy violations gracefully.
        
        Args:
            image_data: Dictionary with preprocessed image data
            
        Returns:
            Dictionary with extracted features and embeddings
        """
        try:
            # Create messages for the API call with a more neutral, clinical prompt
            messages = [
                {
                    "role": "system",
                    "content": "You are a clinical document analysis assistant. Describe the image objectively and factually, focusing on visual elements like charts, diagrams, text, and standard medical notations. Maintain a professional, neutral tone appropriate for clinical documentation."
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/{image_data['format'].lower()};base64,{image_data['base64']}"
                            }
                        },
                        {
                            "type": "text",
                            "text": "Describe this clinical document image objectively. Focus on the visual elements, layout, and factual content."
                        }
                    ]
                }
            ]
            
            # Call the Azure OpenAI API
            try:
                response = self.client.chat.completions.create(
                    model=self.model,
                    messages=messages,
                    max_tokens=800,
                    temperature=0.3,
                )
                
                # Extract the description
                description = response.choices[0].message.content
            except Exception as api_error:
                # Check if it's a content policy violation
                error_str = str(api_error)
                if "ResponsibleAIPolicyViolation" in error_str or "content_filter" in error_str:
                    logger.warning(f"Content policy violation for image {image_data['filename']}. Using fallback description.")
                    # Use a fallback description instead
                    description = f"Image {image_data['filename']} - {image_data['width']}x{image_data['height']} {image_data['format']} format. This image could not be analyzed due to content restrictions."
                else:
                    # If it's another type of error, re-raise
                    raise
            
            # Get embedding for the description
            embedding_response = self.client.embeddings.create(
                model="text-embedding-ada-002",  # Use appropriate embedding model
                input=description
            )
            
            embedding = embedding_response.data[0].embedding
            
            # Return the features and embedding
            return {
                "filename": image_data["filename"],
                "description": description,
                "embedding": embedding,
                "metadata": {
                    "width": image_data["width"],
                    "height": image_data["height"],
                    "format": image_data["format"],
                }
            }
            
        except Exception as e:
            logger.error(f"Error extracting features from image {image_data['filename']}: {e}")
            raise


    def process_directory(self, directory: Union[str, Path] = None) -> List[Dict]:
        """
        Process all images in a directory.
        
        Args:
            directory: Path to directory containing images (default: IMAGE_DIRECTORY)
            
        Returns:
            List of dictionaries with extracted features for each image
        """
        if directory is None:
            directory = IMAGE_DIRECTORY
        
        directory = Path(directory)
        if not directory.exists():
            logger.error(f"Directory does not exist: {directory}")
            return []
        
        results = []
        
        # Process all images in the directory
        for file_path in directory.iterdir():
            if file_path.is_file() and file_path.suffix.lower() in IMAGE_FORMATS:
                logger.info(f"Processing image: {file_path}")
                try:
                    # Preprocess the image
                    image_data = self.preprocess_image(file_path)
                    if image_data:
                        # Extract features
                        features = self.extract_image_features(image_data)
                        results.append(features)
                except Exception as e:
                    logger.error(f"Error processing image {file_path}: {e}")
        
        logger.info(f"Processed {len(results)} images")
        return results
    
    def process_single_image(self, image_path: Union[str, Path]) -> Optional[Dict]:
        """
        Process a single image.
        
        Args:
            image_path: Path to the image file
            
        Returns:
            Dictionary with extracted features or None if processing fails
        """
        image_path = Path(image_path)
        if not image_path.exists():
            logger.error(f"Image does not exist: {image_path}")
            return None
        
        try:
            # Use GPU batching when available for single images
            # (Prepare for possible future batch processing)
            if self.device.type == "cuda":
                logger.debug(f"Processing image {image_path} with GPU acceleration")
            
            # Preprocess the image
            image_data = self.preprocess_image(image_path)
            if image_data:
                # Extract features
                return self.extract_image_features(image_data)
            return None
        except Exception as e:
            logger.error(f"Error processing image {image_path}: {e}")
            return None

    def process_image_file(self, file_data: bytes, filename: str) -> Optional[Dict]:
        """
        Process an image from uploaded file data.
        
        Args:
            file_data: Binary image data
            filename: Name of the file
            
        Returns:
            Dictionary with extracted features or None if processing fails
        """
        try:
            # Create a temporary file
            temp_path = os.path.join(IMAGE_DIRECTORY, filename)
            with open(temp_path, "wb") as f:
                f.write(file_data)
            
            # Process the image
            result = self.process_single_image(temp_path)
            
            return result
        except Exception as e:
            logger.error(f"Error processing uploaded image {filename}: {e}")
            return None
        




        





    





