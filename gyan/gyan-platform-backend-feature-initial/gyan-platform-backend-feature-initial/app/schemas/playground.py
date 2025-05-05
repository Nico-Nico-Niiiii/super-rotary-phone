# schemas/playground.py
from pydantic import BaseModel

class LoadModelRequest(BaseModel):
    model_type: str
    model_name: str
    project_name: str
    job_name: str
    parameters: dict

class InferModelRequest(BaseModel):
    model_type: str
    model_name: str
    project_name: str
    job_name: str
    message: str

class LoadFoundationModelRequest(BaseModel):
    model_id: str
    model_name: str
    parameters: dict

class InferFoundationModelRequest(BaseModel):
    model_id: str
    model_name: str
    message: str