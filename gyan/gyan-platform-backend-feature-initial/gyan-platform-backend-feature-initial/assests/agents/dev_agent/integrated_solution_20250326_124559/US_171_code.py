```python
from fastapi import FastAPI, HTTPException, Depends, Request
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, List, Dict, Any
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError
import re
import requests
import logging
from cachetools import TTLCache
from functools import lru_cache
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi_limiter import FastAPILimiter
from fastapi_limiter.depends import RateLimiter
import redis
import json

# Initialize FastAPI app
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = "sqlite:///./test.db"
engine = create_engine(DATABASE_URL)

# PACS server configuration
PACS_SERVER_URL = "http://pacs-server/api"

# AI engine configuration
AI_ENGINE_URL = "http://ai-engine/api"

# Caching configuration
cache = TTLCache(maxsize=100, ttl=300)

# Redis for rate limiting
redis_client = redis.StrictRedis(host="localhost", port=6379, db=0)
FastAPILimiter.init(redis_client)

# Security configuration
security = HTTPBasic()

# Middleware for trusted hosts and CORS
app.add_middleware(TrustedHostMiddleware, allowed_hosts=["*"])
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class PatientDetails(BaseModel):
    patient_id: str = Field(..., regex=r"^[A-Z0-9]{8,12}$")
    name: Optional[str]
    dob: Optional[str]

class DicomSR(BaseModel):
    patient_id: str
    sr_data: Dict[str, Any]

# Utility functions
def validate_patient_id(patient_id: str) -> bool:
    """Validate patient ID format."""
    pattern = r"^[A-Z0-9]{8,12}$"
    if not re.match(pattern, patient_id):
        logger.error(f"Invalid patient ID format: {patient_id}")
        return False
    return True

def fetch_dicom_sr_from_db(patient_id: str) -> Optional[Dict[str, Any]]:
    """Fetch DICOM SR from the database."""
    try:
        with engine.connect() as connection:
            query = text("SELECT * FROM dicom_sr WHERE patient_id = :patient_id")
            result = connection.execute(query, {"patient_id": patient_id}).fetchone()
            if result:
                return dict(result)
            else:
                logger.warning(f"No DICOM SR found for patient ID: {patient_id}")
                return None
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

def fetch_dicom_image_from_pacs(patient_id: str) -> Optional[Dict[str, Any]]:
    """Fetch DICOM image from PACS server."""
    try:
        response = requests.get(f"{PACS_SERVER_URL}/dicom/{patient_id}", timeout=10)
        response.raise_for_status()
        data = response.json()
        if "image_data" not in data:
            logger.error("Malformed response from PACS server")
            raise HTTPException(status_code=502, detail="Malformed response from PACS server")
        return data
    except requests.RequestException as e:
        logger.error(f"Error fetching DICOM image from PACS: {e}")
        raise HTTPException(status_code=502, detail="Error fetching DICOM image from PACS")

def perform_ai_inference(image_data: Dict[str, Any]) -> Dict[str, Any]:
    """Perform AI inference on DICOM image."""
    try:
        response = requests.post(f"{AI_ENGINE_URL}/inference", json=image_data, timeout=10)
        response.raise_for_status()
        data = response.json()
        if "inference_results" not in data:
            logger.error("Malformed response from AI engine")
            raise HTTPException(status_code=502, detail="Malformed response from AI engine")
        return data
    except requests.RequestException as e:
        logger.error(f"Error performing AI inference: {e}")
        raise HTTPException(status_code=502, detail="Error performing AI inference")

# Endpoints
@app.post("/dicom-sr", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def post_dicom_sr_details(details: PatientDetails, credentials: HTTPBasicCredentials = Depends(security)):
    """Post DICOM SR details."""
    if not validate_patient_id(details.patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID format")

    dicom_sr = fetch_dicom_sr_from_db(details.patient_id)
    if dicom_sr:
        return {"status": "success", "data": dicom_sr}

    dicom_image = fetch_dicom_image_from_pacs(details.patient_id)
    if not dicom_image:
        raise HTTPException(status_code=404, detail="DICOM image not found")

    inference_results = perform_ai_inference(dicom_image)
    return {"status": "success", "data": inference_results}

@app.get("/dicom-sr/{patient_id}", dependencies=[Depends(RateLimiter(times=5, seconds=60))])
async def get_dicom_sr(patient_id: str):
    """Get DICOM SR by patient ID."""
    if not validate_patient_id(patient_id):
        raise HTTPException(status_code=400, detail="Invalid patient ID format")

    if patient_id in cache:
        logger.info(f"Cache hit for patient ID: {patient_id}")
        return cache[patient_id]

    dicom_sr = fetch_dicom_sr_from_db(patient_id)
    if dicom_sr:
        cache[patient_id] = dicom_sr
        return dicom_sr

    raise HTTPException(status_code=404, detail="DICOM SR not found")

# Unit tests (to be run separately)
def test_validate_patient_id():
    assert validate_patient_id("ABC12345") == True
    assert validate_patient_id("INVALID_ID") == False

def test_fetch_dicom_sr_from_db():
    # Mock database and test cases
    pass

def test_fetch_dicom_image_from_pacs():
    # Mock PACS server and test cases
    pass

def test_perform_ai_inference():
    # Mock AI engine and test cases
    pass
```