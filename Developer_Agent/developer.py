from typing import TypedDict, Annotated, Union, Tuple, Optional, List
import operator
from enum import Enum
from dataclasses import dataclass
import numpy as np
import cv2
from pathlib import Path
import logging
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage
from langgraph.graph import StateGraph, END
import glob
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# State Management
class ImageProcessingState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]
    processed_images: Optional[list[np.ndarray]]
    current_image: Optional[np.ndarray]
    validation_status: Optional[bool]
    error_messages: Optional[list[str]]

# Configuration Classes
class ImageBitDepth(Enum):
    """Enum class for supported image bit depths"""
    BIT_1 = 1
    BIT_8 = 8
    BIT_16 = 16
    BIT_24 = 24
    BIT_32 = 32

@dataclass
class PreprocessingConfig:
    """Configuration class for image preprocessing parameters"""
    target_size: Tuple[int, int]  # (width, height)
    target_bit_depth: ImageBitDepth
    normalize: bool = True
    mean: Optional[Union[float, Tuple[float, ...]]] = None
    std: Optional[Union[float, Tuple[float, ...]]] = None

@dataclass
class UserRequirement:
    """Structure for user requirements"""
    title: str
    description: str
    acceptance_criteria: List[str]
    tasks: List[dict]
    folder_path: str

class ImageProcessor:
    """Main image processing class implementing the core functionality"""
    
    def __init__(self, model, checkpointer, system_developer="", system_validator="", system_corrector=""):
        self.system_developer = system_developer
        self.system_validator = system_validator
        self.system_corrector = system_corrector
        self.model = model
        self.config = PreprocessingConfig(
            target_size=(224, 224),  # Default size
            target_bit_depth=ImageBitDepth.BIT_8,
            normalize=True
        )
        
        # Initialize graph
        graph = StateGraph(ImageProcessingState)
        
        # Add nodes
        graph.add_node("developer", self.developer)
        graph.add_node("validator", self.validator)
        graph.add_node("correction", self.correction)
        
        # Add edges
        graph.add_edge("developer", "validator")
        
        # Add conditional edges
        graph.add_conditional_edges(
            "validator",
            lambda state: self.validator(state)["validation_status"],
            {
                True: END,
                False: "correction"
            }
        )
        
        graph.add_edge("correction", "validator")
        
        # Set entry point
        graph.set_entry_point("developer")
        self.graph = graph.compile(checkpointer=checkpointer)

    def process_image(self, image_path: str) -> np.ndarray:
        """Process a single image"""
        try:
            # Read image
            image = cv2.imread(image_path)
            if image is None:
                raise ValueError(f"Failed to read image: {image_path}")

            # Resize
            image = cv2.resize(image, self.config.target_size, interpolation=cv2.INTER_AREA)

            # Convert bit depth
            if self.config.target_bit_depth == ImageBitDepth.BIT_8:
                image = image.astype(np.uint8)
            elif self.config.target_bit_depth == ImageBitDepth.BIT_16:
                image = image.astype(np.uint16)
            elif self.config.target_bit_depth == ImageBitDepth.BIT_32:
                image = image.astype(np.float32)

            # Normalize if required
            if self.config.normalize:
                if self.config.mean is not None and self.config.std is not None:
                    image = (image - self.config.mean) / self.config.std
                else:
                    image = image / 255.0

            return image

        except Exception as e:
            logger.error(f"Error processing image {image_path}: {str(e)}")
            raise

    def process_folder(self, folder_path: str) -> List[np.ndarray]:
        """Process all images in a folder"""
        processed_images = []
        supported_formats = ['.jpg', '.jpeg', '.png', '.bmp']
        
        try:
            # Get all image files
            image_files = []
            for ext in supported_formats:
                image_files.extend(glob.glob(os.path.join(folder_path, f'*{ext}')))
                image_files.extend(glob.glob(os.path.join(folder_path, f'*{ext.upper()}')))

            logger.info(f"Found {len(image_files)} images in {folder_path}")

            # Process each image
            for image_path in image_files:
                try:
                    processed_image = self.process_image(image_path)
                    processed_images.append(processed_image)
                    logger.info(f"Successfully processed {image_path}")
                except Exception as e:
                    logger.error(f"Error processing {image_path}: {str(e)}")
                    continue

            return processed_images

        except Exception as e:
            logger.error(f"Error processing folder {folder_path}: {str(e)}")
            raise

    def developer(self, state: ImageProcessingState) -> dict:
        """Developer node implementation"""
        try:
            messages = state['messages']
            if self.system_developer:
                messages = [SystemMessage(content=self.system_developer)] + messages
            
            # Extract folder path from message
            folder_path = messages[-1].content

            # Process the folder
            processed_images = self.process_folder(folder_path)
            
            return {
                'messages': messages,
                'processed_images': processed_images,
                'current_image': None,
                'validation_status': None,
                'error_messages': []
            }
        except Exception as e:
            logger.error(f"Error in developer node: {str(e)}")
            return {
                'messages': messages,
                'error_messages': [str(e)]
            }

    def validator(self, state: ImageProcessingState) -> dict:
        """Validator node implementation"""
        try:
            messages = state.get("messages", [])
            processed_images = state.get("processed_images", [])

            # Validation checks
            validation_passed = True
            error_messages = []

            if not processed_images:
                validation_passed = False
                error_messages.append("No images were processed")

            for idx, img in enumerate(processed_images):
                # Check image dimensions
                if img.shape[:2] != self.config.target_size:
                    validation_passed = False
                    error_messages.append(f"Image {idx} has incorrect dimensions")

                # Check bit depth
                if img.dtype != np.float32 and img.dtype != np.uint8:
                    validation_passed = False
                    error_messages.append(f"Image {idx} has incorrect bit depth")

                # Check normalization
                if self.config.normalize and img.max() > 1.0:
                    validation_passed = False
                    error_messages.append(f"Image {idx} is not properly normalized")

            return {
                'messages': messages,
                'validation_status': validation_passed,
                'error_messages': error_messages
            }
        except Exception as e:
            logger.error(f"Error in validator node: {str(e)}")
            return {
                'messages': messages,
                'validation_status': False,
                'error_messages': [str(e)]
            }

    def correction(self, state: ImageProcessingState) -> dict:
        """Correction node implementation"""
        try:
            messages = state['messages']
            error_messages = state.get('error_messages', [])

            # Log correction attempts
            logger.info("Attempting corrections:")
            for error in error_messages:
                logger.info(f"- {error}")

            # Reprocess with adjusted parameters if needed
            if "dimensions" in str(error_messages):
                self.config.target_size = (224, 224)  # Reset to default size
            if "bit depth" in str(error_messages):
                self.config.target_bit_depth = ImageBitDepth.BIT_8  # Reset to default bit depth
            if "normalized" in str(error_messages):
                self.config.normalize = True  # Ensure normalization is enabled

            # Reprocess the folder
            folder_path = messages[-1].content
            processed_images = self.process_folder(folder_path)

            return {
                'messages': messages,
                'processed_images': processed_images,
                'validation_status': None,
                'error_messages': []
            }
        except Exception as e:
            logger.error(f"Error in correction node: {str(e)}")
            return {
                'messages': messages,
                'error_messages': [str(e)]
            }

def create_image_processor(model, checkpointer):
    """Factory function to create an ImageProcessor instance"""
    system_prompts = {
        "developer": "Expert image processing system. Process images according to specifications.",
        "validator": "Validate processed images against requirements.",
        "corrector": "Correct any issues found during validation."
    }
    
    return ImageProcessor(
        model=model,
        checkpointer=checkpointer,
        system_developer=system_prompts["developer"],
        system_validator=system_prompts["validator"],
        system_corrector=system_prompts["corrector"]
    )

if __name__ == "__main__":
    from langgraph.checkpoint.sqlite import SqliteSaver
    from langchain_huggingface import HuggingFaceEndpoint, ChatHuggingFace
    
    # Initialize the model
    llm = HuggingFaceEndpoint(
        repo_id="meta-llama/Meta-Llama-3-8B-Instruct",
        task="text-generation",
        max_new_tokens=8000,
        do_sample=False,
        temperature=0.5
    )
    
    model = ChatHuggingFace(llm=llm, verbose=True)
    
    # Folder path
    folder_path = r"C:\Users\ADITYANJ\OneDrive - Capgemini\Pictures\Screenshots"
    
    # Create processor instance and process images
    with SqliteSaver.from_conn_string(":memory:") as checkpointer:
        processor = create_image_processor(model, checkpointer)
        
        # Create message with folder path
        user_message = HumanMessage(content=folder_path)
        
        # Process the request
        thread = {"configurable": {"thread_id": "1"}}
        for event in processor.graph.stream({"messages": [user_message]}, thread):
            if event.get('error_messages'):
                logger.error("Errors occurred:")
                for error in event['error_messages']:
                    logger.error(f"- {error}")
            if event.get('processed_images'):
                logger.info(f"Successfully processed {len(event['processed_images'])} images")
                
                # Save processed images (optional)
                output_folder = os.path.join(os.path.dirname(folder_path), "processed_images")
                os.makedirs(output_folder, exist_ok=True)
                
                for idx, img in enumerate(event['processed_images']):
                    output_path = os.path.join(output_folder, f"processed_{idx}.png")
                    # Convert to uint8 for saving
                    if img.dtype == np.float32:
                        img = (img * 255).astype(np.uint8)
                    cv2.imwrite(output_path, img)
                    logger.info(f"Saved processed image to {output_path}")