# schemas.py

from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class ModelRequestBase(BaseModel):
   model_name: str
   huggingface_id: str 
   description: str
   reason: str
   model_type: str = "LLM"

class ModelRequestCreate(ModelRequestBase):
   pass

class ModelRequest(ModelRequestBase):
   id: int
   status: str
   user_id: int
   user_email: str
   created_at: datetime

   class Config:
       orm_mode = True

class ModelRequestResponse(BaseModel):
   id: int
   model_name: str
   huggingface_id: str
   description: str
   reason: str
   status: str
   created_at: datetime
   model_type: str