from fastapi import FastAPI, HTTPException, Query, Body
from pydantic import BaseModel, Field, ValidationError
from typing import Optional, Dict, Any
import logging
import requests
import os
from dataclasses import dataclass
from sqlalchemy import create_engine, text
from sqlalchemy.exc import SQLAlchemyError

# Initialize FastAPI app
app = FastAPI()

# Configure logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

# Configuration for database and external services
@dataclass
class Config:
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    PACS_SERVER_URL: str = os.getenv("PACS_SERVER_URL", "http://pacs-server/api")
    AI_ENGINE_URL: str = os.getenv("AI_ENGINE_URL", "http://ai-engine/api")

config = Config()

# Database connection
engine = create_engine(config.DATABASE_URL)

# Models for request and response validation
class PatientDetails(BaseModel):
    first_name: str = Field(..., example="John")
    last_name: str = Field(..., example="Doe")
    date_of_birth: str = Field(..., example="1990-01-01")

class DicomSRResponse(BaseModel):
    patient_id: str
    dicom_sr: Dict[str, Any]

# Utility functions
def validate_patient_id(patient_id: str) -> bool:
    """Validate the format of PATIENT_ID."""
    return patient_id.isalnum() and len(patient_id) <= 20

def fetch_dicom_sr_from_db(patient_id: str) -> Optional[Dict[str, Any]]:
    """Fetch DICOM SR document from the database."""
    try:
        with engine.connect() as connection:
            query = text("SELECT * FROM dicom_sr WHERE patient_id = :patient_id")
            result = connection.execute(query, {"patient_id": patient_id}).fetchone()
            if result:
                return dict(result)
            return None
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

def fetch_dicom_image_from_pacs(patient_id: str) -> Optional[Dict[str, Any]]:
    """Fetch DICOM image from PACS server."""
    try:
        response = requests.get(f"{config.PACS_SERVER_URL}/dicom-images/{patient_id}")
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 404:
            return None
        else:
            logger.error(f"PACS server error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="PACS server error")
    except requests.RequestException as e:
        logger.error(f"Error connecting to PACS server: {e}")
        raise HTTPException(status_code=500, detail="Error connecting to PACS server")

def perform_ai_inference(dicom_image: Dict[str, Any]) -> Dict[str, Any]:
    """Perform AI inference on DICOM image."""
    try:
        response = requests.post(f"{config.AI_ENGINE_URL}/infer", json=dicom_image)
        if response.status_code == 200:
            return response.json()
        else:
            logger.error(f"AI engine error: {response.status_code} - {response.text}")
            raise HTTPException(status_code=500, detail="AI engine error")
    except requests.RequestException as e:
        logger.error(f"Error connecting to AI engine: {e}")
        raise HTTPException(status_code=500, detail="Error connecting to AI engine")

# API Endpoints
@app.get("/api/search/dicom-sr", response_model=DicomSRResponse)
async def get_dicom_sr(patient_id: str = Query(..., example="12345"), ai_flag: Optional[bool] = Query(False)):
    """
    Fetch DICOM SR document using PATIENT_ID.
    """
    if not validate_patient_id(patient_id):
        raise HTTPException(status_code=400, detail="Invalid PATIENT_ID format")

    dicom_sr = fetch_dicom_sr_from_db(patient_id)
    if dicom_sr:
        return {"patient_id": patient_id, "dicom_sr": dicom_sr}

    dicom_image = fetch_dicom_image_from_pacs(patient_id)
    if not dicom_image:
        raise HTTPException(status_code=404, detail="DICOM image not found")

    if ai_flag:
        dicom_sr = perform_ai_inference(dicom_image)
        return {"patient_id": patient_id, "dicom_sr": dicom_sr}

    raise HTTPException(status_code=404, detail="DICOM SR document not found")

@app.post("/api/search/dicom-sr-details", response_model=DicomSRResponse)
async def post_dicom_sr_details(patient_details: PatientDetails = Body(...), ai_flag: Optional[bool] = Query(False)):
    """
    Fetch DICOM SR document using PATIENT_DETAILS and derive PATIENT_ID.
    """
    try:
        with engine.connect() as connection:
            query = text("""
                SELECT patient_id FROM patients
                WHERE first_name = :first_name AND last_name = :last_name AND date_of_birth = :date_of_birth
            """)
            result = connection.execute(query, patient_details.dict()).fetchone()
            if not result:
                raise HTTPException(status_code=404, detail="Patient not found")
            patient_id = result["patient_id"]
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        raise HTTPException(status_code=500, detail="Database error")

    return await get_dicom_sr(patient_id=patient_id, ai_flag=ai_flag)

# Run the application
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
