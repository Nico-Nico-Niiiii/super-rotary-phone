from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class ModelType(str, Enum):
    LLM = "Large Language Model"
    VISION = "Vision"
    VISION_LLM = "Vision LLM"
    



class ProjectBase(BaseModel):
    name: str

    @validator('name')
    def validate_name(cls, v):
        if not v[0].isupper():
            raise ValueError('Project name must start with a capital letter')
        if len(v) > 10:
            raise ValueError('Project name must not exceed 10 characters')
        if not v.replace(' ', '').isalnum():
            raise ValueError('Project name can only contain letters, numbers and spaces')
        return v

class ProjectCreate(ProjectBase):
    type: ModelType
    model: str

class ProjectResponse(ProjectBase):
    id: int
    model_type: ModelType
    model_name: str
    model_path: Optional[str] = None
    model_repository_path: Optional[str] = None
    dataset_repository_path: Optional[str] = None
    status: str
    created_date: datetime
    user_id: int
    user_email: str

    class Config:
        from_attributes = True