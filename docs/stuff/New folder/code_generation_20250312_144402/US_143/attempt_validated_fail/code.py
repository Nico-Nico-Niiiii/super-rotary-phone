# Python Code Implementation

import os
import logging
import asyncio
import aiohttp
import hashlib
import zipfile
from typing import List, Dict, Union
from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from datetime import datetime
from PIL import Image, ImageEnhance
import pydicom
from pydicom.errors import InvalidDicomError
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuration
DATABASE_URL = "postgresql://user:password@localhost:5432/pacs_ai"
PACS_API_URL = "https://pacs.example.com/api"
AI_API_URL = "https://ai.example.com/inference"
RETRY_LIMIT = 3
RETRY_BACKOFF = 5  # seconds
IMAGE_OUTPUT_DIR = "./processed_images"
LOG_FILE = "./logs/system.log"

# Logging Configuration
logging.basicConfig(
    filename=LOG_FILE,
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
)

# Database Setup
Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Logs(Base):
    __tablename__ = "logs"
    log_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(String(50))
    status = Column(String(20))
    message = Column(Text)


class ImageMetadata(Base):
    __tablename__ = "image_metadata"
    image_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50))
    file_path = Column(Text)
    format = Column(String(10))
    resolution = Column(String(20))
    study_date = Column(DateTime)
    validation_status = Column(String(20))


Base.metadata.create_all(bind=engine)

# FastAPI Initialization
app = FastAPI()


# Models
class RetrieveImagesRequest(BaseModel):
    patient_id: str
    source: str


class SendToAIRequest(BaseModel):
    patient_id: str
    processed_images: List[str]


# Utility Functions
def calculate_checksum(file_path: str) -> str:
    """Calculate the checksum of a file."""
    hash_md5 = hashlib.md5()
    with open(file_path, "rb") as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hash_md5.update(chunk)
    return hash_md5.hexdigest()


def validate_image(file_path: str) -> Union[Dict, None]:
    """Validate image format, integrity, and metadata."""
    try:
        if file_path.endswith(".dcm"):
            # Validate DICOM file
            dicom = pydicom.dcmread(file_path)
            metadata = {
                "study_date": dicom.StudyDate,
                "resolution": f"{dicom.Rows}x{dicom.Columns}",
                "checksum": calculate_checksum(file_path),
            }
            return metadata
        elif file_path.endswith((".jpg", ".jpeg", ".png")):
            # Validate standard image formats
            with Image.open(file_path) as img:
                metadata = {
                    "resolution": f"{img.width}x{img.height}",
                    "checksum": calculate_checksum(file_path),
                }
                return metadata
        else:
            return None
    except (InvalidDicomError, IOError) as e:
        logging.error(f"Validation failed for {file_path}: {str(e)}")
        return None


def preprocess_image(file_path: str, output_dir: str) -> str:
    """Preprocess image: resize, adjust contrast, reduce noise."""
    try:
        with Image.open(file_path) as img:
            # Resize image
            img = img.resize((512, 512))

            # Enhance contrast
            enhancer = ImageEnhance.Contrast(img)
            img = enhancer.enhance(1.5)

            # Save as JPEG
            output_path = os.path.join(output_dir, os.path.basename(file_path).split(".")[0] + ".jpeg")
            img.save(output_path, "JPEG")
            return output_path
    except Exception as e:
        logging.error(f"Preprocessing failed for {file_path}: {str(e)}")
        return None


async def retrieve_images_from_pacs(patient_id: str) -> List[str]:
    """Retrieve images from PACS with retry mechanism."""
    retries = 0
    while retries < RETRY_LIMIT:
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(f"{PACS_API_URL}/images/{patient_id}") as response:
                    if response.status == 200:
                        data = await response.json()
                        return [image["file_path"] for image in data["images"]]
                    else:
                        raise HTTPException(status_code=response.status, detail="Failed to retrieve images from PACS")
        except Exception as e:
            retries += 1
            logging.error(f"PACS retrieval failed: {str(e)}. Retrying in {RETRY_BACKOFF * retries} seconds...")
            await asyncio.sleep(RETRY_BACKOFF * retries)
    raise HTTPException(status_code=500, detail="Failed to retrieve images from PACS after retries")


def package_images(images: List[str], output_dir: str) -> str:
    """Package images into a zip file."""
    zip_path = os.path.join(output_dir, "images.zip")
    with zipfile.ZipFile(zip_path, "w") as zipf:
        for image in images:
            zipf.write(image, os.path.basename(image))
    return zip_path


async def send_to_ai(patient_id: str, images: List[str]):
    """Send images to AI module asynchronously."""
    try:
        async with aiohttp.ClientSession() as session:
            payload = {"patient_id": patient_id, "processed_images": images}
            async with session.post(f"{AI_API_URL}/inference", json=payload) as response:
                if response.status == 200:
                    logging.info(f"Images sent to AI module for patient {patient_id}")
                else:
                    raise HTTPException(status_code=response.status, detail="Failed to send images to AI module")
    except Exception as e:
        logging.error(f"Failed to send images to AI module: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to send images to AI module")


# API Endpoints
@app.post("/retrieve-images")
async def retrieve_images(request: RetrieveImagesRequest, background_tasks: BackgroundTasks):
    """Retrieve images for a given patient ID."""
    patient_id = request.patient_id
    source = request.source

    if source not in ["PACS", "local", "external"]:
        raise HTTPException(status_code=400, detail="Invalid source specified")

    try:
        if source == "PACS":
            images = await retrieve_images_from_pacs(patient_id)
        else:
            # Local or external storage retrieval logic
            images = [os.path.join(dp, f) for dp, dn, filenames in os.walk("/mnt") for f in filenames if patient_id in f]

        validated_images = []
        for image_path in images:
            metadata = validate_image(image_path)
            if metadata:
                validated_images.append(preprocess_image(image_path, IMAGE_OUTPUT_DIR))
            else:
                logging.warning(f"Validation failed for image {image_path}")

        zip_path = package_images(validated_images, IMAGE_OUTPUT_DIR)
        background_tasks.add_task(send_to_ai, patient_id, validated_images)

        return {"status": "success", "message": "Images retrieved successfully", "zip_path": zip_path}
    except Exception as e:
        logging.error(f"Error retrieving images: {str(e)}")
        raise HTTPException(status_code=500, detail="Error retrieving images")


@app.post("/send-to-ai")
async def send_images_to_ai(request: SendToAIRequest):
    """Send preprocessed images to AI module."""
    try:
        await send_to_ai(request.patient_id, request.processed_images)
        return {"status": "success", "message": "Images sent for AI inferencing"}
    except Exception as e:
        logging.error(f"Error sending images to AI module: {str(e)}")
        raise HTTPException(status_code=500, detail="Error sending images to AI module")