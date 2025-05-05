# models.py
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List

class YAMLGenerationRequest(BaseModel):
    model_type: str
    model_name: str
    job_name: str
    project_name: str
    namespace: str
    docker_image: str
    cpu_limit: int
    memory_limit: int
    gpu_limit: int
    cpu_request: int
    memory_request: int
    gpu_request: int

class YAMLDeployRequest(BaseModel):
    yaml_file: str

class ServiceResponse(BaseModel):
    yaml: Optional[str] = None
    message: str

class ErrorResponse(BaseModel):
    error: str