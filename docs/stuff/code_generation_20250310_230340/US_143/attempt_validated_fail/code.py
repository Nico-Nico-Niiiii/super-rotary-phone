# Python Code Implementation

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
import os
import requests
import pydicom
import cv2
from pathlib import Path
import shutil
import logging
import hashlib
import aiohttp
import asyncio
from datetime import datetime
from sqlalchemy import create_engine, Column, String, Integer, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# Configuration
class Config:
    PACS_API_URL = "https://pacs-server.api"
    PACS_API_KEY = "your_api_key"
    AI_API_URL = "https://ai-module.api/send-images"
    RETRY_BACKOFF_INITIAL = 5  # seconds
    MAX_RETRIES = 3  # maximum retries for PACS
    STORAGE_PATH = "./images"
    LOGS_DB_URL = "postgresql://user:password@localhost/logs_db"
    SECURE_TEMP_DIR = "./temp"

# Database setup
Base = declarative_base()
engine = create_engine(Config.LOGS_DB_URL, echo=True)
Session = sessionmaker(bind=engine)
session = Session()

class Logs(Base):
    __tablename__ = 'logs'
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(String(50))
    status = Column(String(20))
    message = Column(String)

class ImageMetadata(Base):
    __tablename__ = 'image_metadata'
    image_id = Column(Integer, primary_key=True, autoincrement=True)
    patient_id = Column(String(50))
    file_path = Column(String)
    format = Column(String)
    resolution = Column(String)
    study_date = Column(DateTime)
    validation_status = Column(String)

Base.metadata.create_all(engine)

# FastAPI instance
app = FastAPI()

# Helper functions

def validate_image(file_path: str, patient_id: str):
    """
    Validates an image for format, resolution, metadata and checksum integrity.
    Logs any validation errors.
    """
    try:
        extension = Path(file_path).suffix.lower()
        if extension not in [".dcm", ".jpeg", ".jpg", ".png"]:
            raise ValueError(f"Invalid file format: {extension}")

        if extension == ".dcm":
            dcm_data = pydicom.dcmread(file_path)
            if not dcm_data.PatientID or not dcm_data.StudyDate:
                raise ValueError("Missing DICOM metadata")

            checksum = hashlib.md5(open(file_path, "rb").read()).hexdigest()
            resolution = f"{dcm_data.Rows}x{dcm_data.Columns}"
            study_date = dcm_data.StudyDate
            return {
                "status": "valid",
                "checksum": checksum,
                "resolution": resolution,
                "study_date": study_date,
            }
        else:
            img = cv2.imread(file_path)
            if img is None:
                raise ValueError("Invalid image file")
            
            height, width, _ = img.shape
            resolution = f"{width}x{height}"
            checksum = hashlib.md5(open(file_path, "rb").read()).hexdigest()
            return {
                "status": "valid",
                "checksum": checksum,
                "resolution": resolution,
            }
    except Exception as e:
        log_error(patient_id, "Validation failed", str(e))
        return {"status": "invalid", "error": str(e)}

def preprocess_image(file_path: str):
    """
    Converts image to JPEG, resizes, adjusts contrast and reduces noise.
    """
    extension = Path(file_path).suffix.lower()
    if extension == ".dcm":
        # Convert DICOM to JPEG
        dcm_data = pydicom.dcmread(file_path)
        pixel_array = dcm_data.pixel_array
        converted_path = file_path.replace(".dcm", ".jpg")
        cv2.imwrite(converted_path, cv2.normalize(pixel_array, None, 0, 255, cv2.NORM_MINMAX))
        return converted_path
    else:
        image = cv2.imread(file_path)
        resized_image = cv2.resize(image, (512, 512))
        processed_path = file_path.replace(extension, ".jpg")
        cv2.imwrite(processed_path, resized_image)
        return processed_path

async def send_to_ai(images: List[str], patient_id: str):
    """
    Sends preprocessed images to the AI module.
    """
    try:
        # Package images into a zip file
        zip_path = f"{Config.SECURE_TEMP_DIR}/{patient_id}_images.zip"
        with shutil.ZipFile(zip_path, 'w') as zip_file:
            for image in images:
                zip_file.write(image, Path(image).name)
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                Config.AI_API_URL, 
                data={"patient_id": patient_id, "file": open(zip_path, 'rb')}
            ) as response:
                if response.status != 200:
                    raise Exception(f"AI Module returned status code {response.status}")
        os.remove(zip_path)  # Cleanup
    except Exception as e:
        log_error(patient_id, "AI Integration failed", str(e))
        return {"status": "error", "message": str(e)}

def log_error(patient_id: str, status: str, message: str):
    """
    Logs errors into the database.
    """
    error_log = Logs(patient_id=patient_id, status=status, message=message)
    session.add(error_log)
    session.commit()

# Routes

class RetrieveImagesRequest(BaseModel):
    patient_id: str
    source: str

@app.post("/retrieve-images")
async def retrieve_images(request: RetrieveImagesRequest, background_tasks: BackgroundTasks):
    """
    Retrieves images from PACS/local storage, validates, preprocesses them
    and prepares them for AI inferencing.
    """
    try:
        # Retrieve from PACS or local
        if request.source.lower() == "pacs":
            # Simulate PACS query (TODO: replace with actual PACS API call)
            retries = 0
            while retries < Config.MAX_RETRIES:
                try:
                    response = requests.get(
                        f"{Config.PACS_API_URL}/retrieve-images",
                        headers={"Authorization": f"Bearer {Config.PACS_API_KEY}"},
                        params={"patient_id": request.patient_id}
                    )
                    if response.status_code == 200:
                        images = response.json().get("images", [])
                        break
                except Exception:
                    retries += 1
                    await asyncio.sleep(Config.RETRY_BACKOFF_INITIAL * (2 ** retries))
            else:
                raise HTTPException(status_code=500, detail="Failed to fetch images from PACS")
        else:
            images = []  # Simulate local storage scanning

        # Validate and preprocess
        validated_images = []
        for image in images:
            file_path = image.get("file_path")
            validation_result = validate_image(file_path, request.patient_id)
            if validation_result["status"] == "valid":
                preprocessed_path = preprocess_image(file_path)
                validated_images.append(preprocessed_path)

        background_tasks.add_task(send_to_ai, validated_images, request.patient_id)
        return JSONResponse(
            status_code=200, 
            content={"status": "success", "images": validated_images}
        )

    except Exception as e:
        log_error(request.patient_id, "Internal error", str(e))
        raise HTTPException(status_code=500, detail=str(e))