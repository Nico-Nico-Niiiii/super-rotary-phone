# Required Imports
import logging
import os
import hashlib
import asyncio
from fastapi import FastAPI, HTTPException, BackgroundTasks, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
from datetime import datetime
import aiohttp
import shutil
from PIL import Image, ImageEnhance
import pydicom
from pathlib import Path
import zipfile
from sqlalchemy import create_engine, Column, Integer, String, DateTime, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from sqlalchemy.exc import SQLAlchemyError

# Constants
LOG_PATH = "logs"
IMAGE_PROCESSING_TMP_DIR = "processed_images"
DATABASE_URL = "postgresql://user:password@localhost/db_name"  # Update credentials
AI_API_ENDPOINT = "https://ai_service_inferencing_endpoint"
MAX_RETRIES = 3

# Configuration Management
class Config:
    PACS_TLS_ENDPOINT = "https://pacs_tls_endpoint"
    PACS_OAUTH_TOKEN = "replace_with_actual_token"

# Database Setup
Base = declarative_base()
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Database Models
class Log(Base):
    __tablename__ = "Logs"
    log_id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow)
    patient_id = Column(String(50), nullable=True)
    status = Column(String(20), nullable=True)
    message = Column(Text, nullable=True)

class ImageMetadata(Base):
    __tablename__ = "Image_Metadata"
    image_id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(String(50), nullable=False)
    file_path = Column(Text, nullable=False)
    format = Column(String(10), nullable=False)
    resolution = Column(String(20), nullable=False)
    study_date = Column(DateTime, nullable=True)
    validation_status = Column(String(20), nullable=False)

Base.metadata.create_all(bind=engine)

# FastAPI Setup
app = FastAPI()

# Logger Setup
if not os.path.exists(LOG_PATH):
    os.makedirs(LOG_PATH)

logging.basicConfig(filename=f"{LOG_PATH}/application.log", level=logging.INFO,
                    format="%(asctime)s [%(levelname)s]: %(message)s")

def log_error(patient_id=None, status="error", message=""):
    try:
        session = SessionLocal()
        log_entry = Log(patient_id=patient_id, status=status, message=message)
        session.add(log_entry)
        session.commit()
    except SQLAlchemyError as e:
        logging.error(f"Database error: {str(e)}")
    finally:
        session.close()

# Input Models
class RetrieveImagesRequest(BaseModel):
    patient_id: str
    source: str  # PACS or local

class SendToAIRequest(BaseModel):
    patient_id: str
    processed_images: List[str]

# Image Validation
async def validate_image(file_path: str) -> Dict:
    try:
        patient_id = ""
        if file_path.lower().endswith(".dcm"):
            ds = pydicom.dcmread(file_path)
            checksum = hashlib.md5(open(file_path, "rb").read()).hexdigest()
            metadata = {
                "study_date": str(ds.get("StudyDate", "")),
                "resolution": f"{ds.Columns}x{ds.Rows}",
                "checksum": checksum,
            }
            patient_id = ds.PatientID
        else:
            img = Image.open(file_path)
            checksum = hashlib.md5(open(file_path, "rb").read()).hexdigest()
            metadata = {
                "study_date": None,
                "resolution": f"{img.size[0]}x{img.size[1]}",
                "checksum": checksum,
            }
        return {"patient_id": patient_id, "file_path": file_path, "valid": True, "metadata": metadata}
    except Exception as e:
        return {"patient_id": "", "file_path": file_path, "valid": False, "error": str(e)}

# Image Preprocessing
def preprocess_image(src_path: str, dest_path: str):
    img = Image.open(src_path)
    img = img.convert("RGB")  # Normalize to JPEG compatible
    img = img.resize((256, 256))
    enhancer = ImageEnhance.Contrast(img)
    img = enhancer.enhance(1.5)
    img.save(dest_path, "JPEG", quality=90)

# AI Integration
async def send_images_to_ai(patient_id: str, images: List[str]):
    data = {"patient_id": patient_id, "processed_images": images}
    async with aiohttp.ClientSession() as session:
        async with session.post(AI_API_ENDPOINT, json=data) as response:
            if response.status in (200, 201):
                result = await response.json()
                return {"status": "success", "message": result.get("message", "Images sent successfully")}
            else:
                return {"status": "error", "message": f"AI API responded with {response.status}"}

# API Endpoints
@app.post("/retrieve-images")
async def retrieve_images(request: RetrieveImagesRequest, background_tasks: BackgroundTasks):
    if not request.patient_id or not request.source:
        raise HTTPException(status_code=400, detail="Missing required fields")
    
    images = []  # This will store paths to retrieved images
    try:
        if request.source.upper() == "PACS":
            # Simulate PACS retrieval here and add retry mechanism
            for attempt in range(MAX_RETRIES):
                try:
                    async with aiohttp.ClientSession() as session:
                        headers = {"Authorization": f"Bearer {Config.PACS_OAUTH_TOKEN}"}
                        async with session.get(f"{Config.PACS_TLS_ENDPOINT}/patient/{request.patient_id}/images", headers=headers) as response:
                            if response.status == 200:
                                pacs_data = await response.json()
                                images = pacs_data.get("images", [])
                                break
                            else:
                                raise ConnectionError(f"PACS responded with {response.status}")
                except Exception as e:
                    await asyncio.sleep(5 * (2 ** attempt))
                    if attempt == MAX_RETRIES - 1:
                        raise HTTPException(status_code=500, detail="Failed to retrieve data from PACS")
        elif request.source.upper() == "LOCAL":
            # Scan local directory for relevant images
            images_dir = f"./local_data/{request.patient_id}"
            if os.path.exists(images_dir):
                images = [str(file) for file in Path(images_dir).rglob("*") if file.is_file()]
            else:
                raise HTTPException(status_code=404, detail="Local patient data not found")
        else:
            raise HTTPException(status_code=400, detail="Invalid source specified")
        
        # Validate images
        processed_images_metadata = []
        for image in images:
            validation = await validate_image(image)
            if validation["valid"]:
                processed_images_metadata.append(validation)
            else:
                log_error(patient_id=request.patient_id, message=f"Validation failed for {image}: {validation.get('error')}")
        
        # Preprocess images and move to staged directory
        if not os.path.exists(IMAGE_PROCESSING_TMP_DIR):
            os.makedirs(IMAGE_PROCESSING_TMP_DIR)
        prepared_images = []
        for meta in processed_images_metadata:
            dest_path = os.path.join(IMAGE_PROCESSING_TMP_DIR, os.path.basename(meta["file_path"]).replace(" ", "_") + ".jpeg")
            preprocess_image(meta["file_path"], dest_path)
            prepared_images.append(dest_path)
        
        # Package into .zip file
        zip_path = os.path.join(IMAGE_PROCESSING_TMP_DIR, f"{request.patient_id}_images.zip")
        with zipfile.ZipFile(zip_path, 'w') as zipf:
            for file in prepared_images:
                zipf.write(file, os.path.basename(file))
        
        # Send to AI asynchronously
        background_tasks.add_task(send_images_to_ai, request.patient_id, prepared_images)

        return JSONResponse({"status": "success", "message": "Images processed and sent to AI", "zip_file": zip_path})
    except Exception as e:
        log_error(patient_id=request.patient_id, message=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/send-to-ai")
async def send_to_ai_api(request: SendToAIRequest):
    try:
        response = await send_images_to_ai(request.patient_id, request.processed_images)
        if response["status"] == "success":
            return JSONResponse(response)
        else:
            raise HTTPException(status_code=500, detail=response["message"])
    except Exception as e:
        log_error(patient_id=request.patient_id, message=str(e))
        raise HTTPException(status_code=500, detail=str(e))