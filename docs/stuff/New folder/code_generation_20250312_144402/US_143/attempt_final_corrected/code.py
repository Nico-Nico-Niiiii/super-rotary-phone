```python
import os
import logging
import shutil
import tempfile
from typing import Dict, Any, Optional
from fastapi import FastAPI, HTTPException, BackgroundTasks, Depends
from fastapi.security import HTTPBasic, HTTPBasicCredentials
from fastapi.limiter import Limiter
from fastapi.limiter.depends import RateLimiter
from pydantic import BaseModel, ValidationError
from dotenv import load_dotenv
from pathlib import Path
import requests
import json

# Load environment variables
load_dotenv()

# Constants
DATABASE_URL = os.getenv("DATABASE_URL")
IMAGE_OUTPUT_DIR = os.getenv("IMAGE_OUTPUT_DIR", "./output")
AI_MODULE_URL = os.getenv("AI_MODULE_URL")
PACS_API_URL = os.getenv("PACS_API_URL")
MAX_RETRIES = 3

# Ensure IMAGE_OUTPUT_DIR exists
Path(IMAGE_OUTPUT_DIR).mkdir(parents=True, exist_ok=True)

# Logging configuration
logging.basicConfig(
    filename="app.log",
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s"
)

# FastAPI app
app = FastAPI()

# Security
security = HTTPBasic()

# Rate Limiter
limiter = Limiter(key_func=lambda: "global", default_limits=["10/minute"])

# Models
class PACSResponse(BaseModel):
    patient_id: str
    image_data: str

class AIResponse(BaseModel):
    success: bool
    message: str

# Helper Functions
def validate_pacs_response(response: Dict[str, Any]) -> bool:
    try:
        PACSResponse(**response)
        return True
    except ValidationError as e:
        logging.error(f"PACS response validation failed: {e}")
        return False

def send_to_ai_module(image_path: str) -> Optional[Dict[str, Any]]:
    for attempt in range(MAX_RETRIES):
        try:
            with open(image_path, "rb") as image_file:
                response = requests.post(AI_MODULE_URL, files={"file": image_file})
                response.raise_for_status()
                return response.json()
        except requests.RequestException as e:
            logging.error(f"Attempt {attempt + 1} to send image to AI module failed: {e}")
    return None

def cleanup_temp_files(temp_dir: str):
    try:
        shutil.rmtree(temp_dir)
        logging.info(f"Temporary files in {temp_dir} cleaned up successfully.")
    except Exception as e:
        logging.error(f"Failed to clean up temporary files: {e}")

# Middleware
@app.middleware("http")
async def log_requests(request, call_next):
    response = await call_next(request)
    logging.info(f"Request: {request.method} {request.url} - Status: {response.status_code}")
    return response

# Authentication
def authenticate(credentials: HTTPBasicCredentials = Depends(security)):
    username = os.getenv("API_USERNAME")
    password = os.getenv("API_PASSWORD")
    if credentials.username != username or credentials.password != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    return credentials

# Endpoints
@app.get("/process-image", dependencies=[Depends(RateLimiter(times=10, seconds=60))])
async def process_image(background_tasks: BackgroundTasks, credentials: HTTPBasicCredentials = Depends(authenticate)):
    temp_dir = tempfile.mkdtemp()
    try:
        # Retrieve image from PACS
        response = requests.get(PACS_API_URL)
        response.raise_for_status()
        pacs_data = response.json()

        if not validate_pacs_response(pacs_data):
            raise HTTPException(status_code=400, detail="Invalid PACS response structure")

        patient_id = pacs_data["patient_id"]
        image_data = pacs_data["image_data"]

        # Save image to temporary directory
        image_path = os.path.join(temp_dir, f"{patient_id}.jpg")
        with open(image_path, "wb") as image_file:
            image_file.write(image_data.encode())

        # Send image to AI module
        ai_response = send_to_ai_module(image_path)
        if not ai_response or not ai_response.get("success"):
            raise HTTPException(status_code=500, detail="Failed to process image with AI module")

        # Save processed image to output directory
        processed_image_path = os.path.join(IMAGE_OUTPUT_DIR, f"{patient_id}_processed.jpg")
        shutil.copy(image_path, processed_image_path)

        logging.info(f"Image for patient {patient_id} processed successfully.")
        return {"message": "Image processed successfully", "patient_id": patient_id}

    except requests.RequestException as e:
        logging.error(f"Error retrieving image from PACS: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving image from PACS")
    except Exception as e:
        logging.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="An unexpected error occurred")
    finally:
        background_tasks.add_task(cleanup_temp_files, temp_dir)

# Unit Tests (example)
def test_validate_pacs_response():
    valid_response = {"patient_id": "12345", "image_data": "imagebytes"}
    invalid_response = {"patient_id": "12345"}
    assert validate_pacs_response(valid_response) is True
    assert validate_pacs_response(invalid_response) is False
```