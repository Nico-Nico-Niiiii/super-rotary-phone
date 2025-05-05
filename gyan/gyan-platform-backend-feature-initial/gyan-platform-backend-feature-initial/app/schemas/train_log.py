# schemas/training_log.py
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class TrainingLogBase(BaseModel):
    step: int
    epoch: float
    train_loss: float
    eval_loss: float
    learning_rate: float
    batch_size: int
    model_name: str
    project_name: str
    total_epochs: int
    status: str
    user_email: str
    job_name: str

class TrainingLogCreate(TrainingLogBase):
    task_id: str

class TrainingLogResponse(TrainingLogBase):
    id: int
    task_id: str
    timestamp: datetime

    class Config:
        from_attributes = True