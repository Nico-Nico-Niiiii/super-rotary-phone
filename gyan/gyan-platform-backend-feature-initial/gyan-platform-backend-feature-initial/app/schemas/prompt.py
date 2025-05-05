from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class PromptBase(BaseModel):
    id: int
    user_email: str
    prompt_library_name: str
    prompt_subsection_name: str
    prompt: str
    prompt_description: str

    class Config:
        from_attributes = True

class PromptResponse(BaseModel):
    prompt_library_name: str
    prompt_subsection_name: str
    prompt: str
    prompt_description: str

    class Config:
        from_attributes = True

