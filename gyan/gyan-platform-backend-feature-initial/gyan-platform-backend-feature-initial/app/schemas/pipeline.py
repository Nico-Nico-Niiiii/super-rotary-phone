from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import uuid

class Position(BaseModel):
    x: float
    y: float

class WorkflowStep(BaseModel):
    type: str
    name: str
    status: str = "pending"
    order: int
    position: Position
    selected_job: Optional[str] = None

class WorkflowCreate(BaseModel):
    name: str
    project_id: Optional[str] = None
    steps: List[WorkflowStep]

class WorkflowTriggerRequest(BaseModel):
    steps: List[Dict[str, Any]]

class WorkflowResponse(BaseModel):
    id: str
    name: str
    steps: List[Dict[str, Any]]
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[str] = None

class WorkflowListResponse(BaseModel):
    workflows: List[WorkflowResponse]