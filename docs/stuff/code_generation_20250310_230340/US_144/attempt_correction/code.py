```python
import os
import json
import logging
from typing import List, Dict, Union
from dataclasses import dataclass, asdict
from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse
from PIL import Image, UnidentifiedImageError
import pydicom
from pydicom.errors import InvalidDicomError
from datetime import datetime
import sqlalchemy as db
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from celery import Celery

# Setup Logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Constants
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

# FastAPI and Celery Setup
app = FastAPI()
celery_app = Celery('image_validation', broker="redis://localhost:6379/0", backend="redis://localhost:6379/0")

# SQLAlchemy Setup
engine = db.create_engine("sqlite:///validation_logs.db")
Session = sessionmaker(bind=engine)
Base = declarative_base()

class ValidationLogs(Base):
    __tablename__ = "validation_logs"
    id = db.Column(db.Integer, primary_key=True)
    file_name = db.Column(db.String, nullable=False)
    status = db.Column(db.String, nullable=False)
    error_code = db.Column(db.String, nullable=True)
    timestamp = db.Column(db.DateTime, nullable=False)

Base.metadata.create_all(engine)

# Data Model
@dataclass
class ValidationResult:
    file_name: str
    status: str
    message: str
    error_code: Union[str, None] = None

# Temporary Storage Setup
TEMP_STORAGE_DIR = "temp_storage"
os.makedirs(TEMP_STORAGE_DIR, exist_ok=True)

# Helper Functions
def validate_format(file_path: str) -> str:
    try:
        if file_path.endswith('.dcm'):
            pydicom.dcmread(file_path)
            return "DICOM"
        else:
            with Image.open(file_path) as img:
                return img.format
    except (UnidentifiedImageError, InvalidDicomError):
        raise ValueError(ERROR_CODES[102])

def validate_metadata(metadata: Dict[str, Union[str, int]], file_format: str) -> None:
    if not metadata:
        raise ValueError(ERROR_CODES[105])
    if file_format == "DICOM":
        for key in ["model_name", "expected_type", "expected_modality"]:
            if key not in metadata:
                raise ValueError(ERROR_CODES[106])

def enforce_file_size_limit(file_size: int) -> None:
    if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
        raise ValueError(ERROR_CODES[104])

def cleanup_files(file_paths: List[str]) -> None:
    for file_path in file_paths:
        if os.path.exists(file_path):
            os.remove(file_path)

# Celery Task
@celery_app.task(bind=True, default_retry_delay=3, max_retries=3)
def process_batch(self, files: List[str], metadata: Dict[str, Union[str, int]]) -> List[Dict]:
    results = []
    try:
        for file_path in files:
            try:
                file_size = os.path.getsize(file_path)
                enforce_file_size_limit(file_size)

                file_format = validate_format(file_path)
                if file_format not in SUPPORTED_FORMATS:
                    raise ValueError(ERROR_CODES[103])

                validate_metadata(metadata, file_format)
                results.append(asdict(ValidationResult(
                    file_name=os.path.basename(file_path),
                    status="success",
                    message=f"Validation successful for {os.path.basename(file_path)}."
                )))
            except ValueError as exc:
                results.append(asdict(ValidationResult(
                    file_name=os.path.basename(file_path),
                    status="error",
                    message=str(exc),
                    error_code=str(list(ERROR_CODES.keys())[list(ERROR_CODES.values()).index(str(exc))])
                ))            
                logging.error(f"Validation failed for {file_path}: {exc}")
    finally:
        cleanup_files(files)
    return results

# API Endpoints
@app.post("/api/v1/upload", response_model=List[Dict])
async def upload_files(files: List[UploadFile] = File(...), metadata: str = Form(...)) -> JSONResponse:
    if not files:
        raise HTTPException(status_code=400, detail=ERROR_CODES[101])

    try:
        metadata_dict = json.loads(metadata)
    except json.JSONDecodeError:
        raise HTTPException(status_code=400, detail=ERROR_CODES[105])

    temp_file_paths = []
    for file in files:
        temp_path = os.path.join(TEMP_STORAGE_DIR, file.filename)
        with open(temp_path, "wb") as temp_file:
            temp_file.write(await file.read())
        temp_file_paths.append(temp_path)

    task = process_batch.delay(temp_file_paths, metadata_dict)
    return JSONResponse({"task_id": task.id}, status_code=202)

@app.get("/api/v1/logs", response_model=List[Dict])
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
```