from pydantic import BaseModel, validator
from typing import Optional
from datetime import datetime
from enum import Enum

class JobStatus(str, Enum):
    COMPLETED = "Completed"
    IN_PROGRESS = "In-Progress"
    FAILED = "Failed"
    QUEUED = "Queued"
    TERMINATED = "Terminated"
    RUNNING = "Running"
    WAITING = "Waiting"


class TrainingJobCreate(BaseModel):
    name: str
    dataset_path: Optional[str] = None
    epochs: int
    batch_size: int
    learning_rate: float
    token_length: int
    quantization: str
    rank: int
    lora_optimized: bool = False
    # eval_steps: int

    @validator('name')
    def validate_name(cls, v):
        if not v[0].isupper():
            raise ValueError('Job name must start with a capital letter')
        if len(v) > 10:
            raise ValueError('Job name must not exceed 10 characters')
        if not v.replace(' ', '').isalnum():
            raise ValueError('Job name can only contain letters, numbers and spaces')
        return v

class TrainingJobResponse(BaseModel):
    id: str
    name: str
    status: JobStatus
    started_on: datetime
    dataset_path: Optional[str]
    epochs: int
    batch_size: int
    learning_rate: float
    token_length: int
    quantization: str
    rank: int
    lora_optimized: bool
    # eval_steps: int
    error: Optional[str]
    project_id: int
    user_id: int
    user_email: str
    project_name: str
    model_type: str
    model_name: str
    hf_id: str
    task_id: str
    queue_status: str
    enqueued_at: datetime  # Use 'enqueued_at' instead of 'started_on'
    completed_at: Optional[datetime] = None  # Make this optional
    started_on: Optional[datetime]
    error: Optional[str] 

    class Config:
        from_attributes = True










