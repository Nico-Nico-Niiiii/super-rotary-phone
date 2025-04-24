# Python code for Image Data Validation System

import os
import json
import logging
from typing import List, Dict, Union
from dataclasses import dataclass
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
import pydicom
from pydicom.errors import InvalidDicomError
from datetime import datetime
import sqlalchemy as db
from sqlalchemy.orm import sessionmaker
from celery import Celery

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

MAX_FILE_SIZE_MB = 50
SUPPORTED_FORMATS = ['JPEG', 'BMP', 'PNG', 'DICOM']
ERROR_CODES = {
    101: "Empty input detected.",
    102: "Corrupted image detected.",
    103: "Unsupported file format.",
    104: "File size exceeds limit.",
    105: "Missing required metadata.",
    106: "Failed metadata validation.",
    107: "Ambiguous file format."
}

# FastAPI app initialization
app = FastAPI()

# Celery broker and backend setup
celery_app = Celery(
    'image_validation',
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

# SQLAlchemy database setup
engine = db.create_engine("sqlite:///validation_logs.db")
Session = sessionmaker(bind=engine)
Base = db.declarative_base()

class ValidationLogs(Base):
    __tablename__ = "validation_logs"
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False)
    error_code = db.Column(db.String, nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False)

Base.metadata.create_all(engine)

@dataclass
class ValidationResult:
    file_name: str
    status: str
    message: str

# Storage configuration
TEMP_STORAGE_DIR = "temp_storage"
os.makedirs(TEMP_STORAGE_DIR, exist_ok=True)

# Helper function to validate image formats
def validate_format(file_path: str) -> str:
    try:
        if file_path.endswith('.dcm'):
            pydicom.dcmread(file_path)  # Check if the file is a valid DICOM file
            return "DICOM"
        else:
            with Image.open(file_path) as img:
                return img.format
    except UnidentifiedImageError:
        raise ValueError(ERROR_CODES[102])
    except InvalidDicomError:
        raise ValueError(ERROR_CODES[102])

# Helper function to validate metadata
def validate_metadata(metadata: Dict[str, Union[str, int]], file_format: str) -> None:
    if not metadata:
        raise ValueError(ERROR_CODES[105])
    if file_format == "DICOM":
        required_keys = ["model_name", "expected_type", "expected_modality"]
        for key in required_keys:
            if key not in metadata:
                raise ValueError(ERROR_CODES[106])
    # Additional metadata validation can be implemented here

# Helper function to enforce file size limit
def enforce_file_size_limit(file_size: int) -> None:
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(ERROR_CODES[104])

# Celery task for batch processing
@celery_app.task
def process_batch(files: List[str], metadata: Dict[str, Union[str, int]]) -> List[Dict]:
    results = []
    for file in files:
        try:
            file_size = os.path.getsize(file)
            enforce_file_size_limit(file_size)
            
            file_format = validate_format(file)
            if file_format not in SUPPORTED_FORMATS:
                raise ValueError(ERROR_CODES[103])
            
            validate_metadata(metadata, file_format)
            results.append({
                "file_name": os.path.basename(file),
                "status": "success",
                "message": f"Validation successful for {os.path.basename(file)}."
            })
        except ValueError as exc:
            results.append({
                "file_name": os.path.basename(file),
                "status": "error",
                "message": str(exc)
            })
        
        # Log the result
        session = Session()
        log_entry = ValidationLogs(
            file_name=os.path.basename(file),
            status=results[-1]["status"],
            error_code=str(exc) if results[-1]["status"] == "error" else None,
            timestamp=datetime.utcnow()
        )
        session.add(log_entry)
        session.commit()
    return results

@app.post("/api/v1/upload")
async def upload_files(files: List[UploadFile], metadata: str = Form(...)) -> JSONResponse:
    if not files:
        raise HTTPException(status_code=400, detail=ERROR_CODES[101])
    metadata_dict = json.loads(metadata)

    temp_file_paths = []
    for file in files:
        temp_path = os.path.join(TEMP_STORAGE_DIR, file.filename)
        with open(temp_path, "wb") as temp_file:
            temp_file.write(await file.read())
        temp_file_paths.append(temp_path)

    task = process_batch.delay(temp_file_paths, metadata_dict)
    return JSONResponse({"task_id": task.id}, status_code=202)

@app.get("/api/v1/logs")
def get_logs(file_name: Union[str, None] = None) -> JSONResponse:
    session = Session()
    query = session.query(ValidationLogs)
    if file_name:
        query = query.filter(ValidationLogs.file_name == file_name)

    logs = query.all()
    results = [
        {
            "file_name": log.file_name,
            "status": log.status,
            "error_code": log.error_code,
            "timestamp": log.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        for log in logs
    ]
    return JSONResponse(results)

# Unit tests can be added using pytest for comprehensive coverage
