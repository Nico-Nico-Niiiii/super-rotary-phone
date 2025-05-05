# routers/training_logs.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from ..database.connection import get_db
from ..database.crud import DBOperations
from ..schemas.train_log import TrainingLogResponse
from ..core.security import get_current_user
from ..core.utils import get_route, get_prefix, load_endpoints

ENDPOINTS = load_endpoints()
router = APIRouter(
    prefix=get_prefix("training_logs"),
    tags=["training_logs"]
)

@router.get(
    ENDPOINTS["training_logs"]["routes"]["get_logs"],
    response_model=List[TrainingLogResponse]
)
async def get_training_logs(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all training logs for a specific task"""
    logs = DBOperations.get_training_logs(db, job_id)
    if not logs:
        raise HTTPException(status_code=404, detail="No logs found for this task")
    return logs

@router.get(
    ENDPOINTS["training_logs"]["routes"]["get_latest"],
    response_model=TrainingLogResponse
)
async def get_latest_training_log(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get the latest training log for a specific task"""
    log = DBOperations.get_latest_training_log(db, job_id)
    if not log:
        raise HTTPException(status_code=404, detail="No logs found for this task")
    return log

@router.delete(
    ENDPOINTS["training_logs"]["routes"]["delete_logs"]
)
async def delete_training_logs(
    task_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Delete all training logs for a specific task"""
    if DBOperations.delete_training_logs(db, task_id):
        return {"message": "Logs deleted successfully"}
    raise HTTPException(status_code=404, detail="No logs found for this task")