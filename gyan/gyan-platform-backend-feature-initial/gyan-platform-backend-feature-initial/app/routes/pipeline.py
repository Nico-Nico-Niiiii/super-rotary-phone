from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
import json
from datetime import datetime

from ..database.connection import get_db
from app.models.pipeline import Workflow
from app.schemas.pipeline import WorkflowCreate, WorkflowResponse, WorkflowListResponse, WorkflowTriggerRequest
from app.core.security import get_current_user
router = APIRouter(prefix="/api/workflows", tags=["workflows"])

@router.post("/", response_model=WorkflowResponse, status_code=status.HTTP_201_CREATED)
async def create_workflow(workflow: WorkflowCreate, db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    """
    Create a new workflow
    """
    db_workflow = Workflow(
        name=workflow.name,
        project_id=workflow.project_id,
        email=current_user["email"],
        steps=json.loads(workflow.json())["steps"],
        status="draft"
    )
    
    db.add(db_workflow)
    db.commit()
    db.refresh(db_workflow)
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        email=db_workflow.email,
        project_id=db_workflow.project_id,
        steps=db_workflow.steps,
        status=db_workflow.status,
        created_at=db_workflow.created_at,
        updated_at=db_workflow.updated_at,
        created_by=db_workflow.created_by
    )

@router.get("/")
async def list_workflows(
    project_id: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    List all workflows with pagination, filtered by project_id and user email
    """
    query = db.query(Workflow)
    
    # Filter by the current user's email
    query = query.filter(Workflow.email == current_user["email"])
    
    # Additionally filter by project_id if provided
    if project_id:
        query = query.filter(Workflow.project_id == project_id)
        
    workflows = query.offset(skip).limit(limit).all()
    
    workflow_responses = []
    for workflow in workflows:
        workflow_responses.append(
            WorkflowResponse(
                id=workflow.id,
                name=workflow.name,
                steps=workflow.steps,
                status=workflow.status,
                created_at=workflow.created_at,
                updated_at=workflow.updated_at,
                created_by=workflow.created_by,
                email=workflow.email,
                project_id=workflow.project_id
            )
        )
    
    return WorkflowListResponse(workflows=workflow_responses)


@router.get("/{workflow_id}", response_model=WorkflowResponse)
async def get_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """
    Get a specific workflow by ID
    """
    workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if not workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID {workflow_id} not found"
        )
    
    return WorkflowResponse(
        id=workflow.id,
        name=workflow.name,
        steps=workflow.steps,
        status=workflow.status,
        created_at=workflow.created_at,
        updated_at=workflow.updated_at,
        created_by=workflow.created_by
    )

@router.put("/{workflow_id}", response_model=WorkflowResponse)
async def update_workflow(
    workflow_id: str, 
    workflow_update: WorkflowCreate, 
    db: Session = Depends(get_db)
):
    """
    Update an existing workflow
    """
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if not db_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID {workflow_id} not found"
        )
    
    db_workflow.name = workflow_update.name
    db_workflow.steps = json.loads(workflow_update.json())["steps"]
    db_workflow.updated_at = datetime.now()
    
    db.commit()
    db.refresh(db_workflow)
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        steps=db_workflow.steps,
        status=db_workflow.status,
        created_at=db_workflow.created_at,
        updated_at=db_workflow.updated_at,
        created_by=db_workflow.created_by
    )

@router.delete("/{workflow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_workflow(workflow_id: str, db: Session = Depends(get_db)):
    """
    Delete a workflow
    """
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if not db_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID {workflow_id} not found"
        )
    
    db.delete(db_workflow)
    db.commit()
    
    return {"message": "Workflow deleted successfully"}

@router.post("/{workflow_id}/trigger", response_model=WorkflowResponse)
async def trigger_workflow(
    workflow_id: str,
    db: Session = Depends(get_db)
):
    """
    Trigger a workflow execution
    """
    db_workflow = db.query(Workflow).filter(Workflow.id == workflow_id).first()
    
    if not db_workflow:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Workflow with ID {workflow_id} not found"
        )
    
    # Update workflow status to running
    db_workflow.status = "running"
    
    # Update the first step status to running
    steps = db_workflow.steps
    if steps and len(steps) > 0:
        steps[0]["status"] = "running"
        db_workflow.steps = steps
    
    db_workflow.updated_at = datetime.now()
    db.commit()
    db.refresh(db_workflow)
    
    # In a real-world scenario, you would trigger an async task/job here
    # For example: background_tasks.add_task(execute_workflow, db_workflow.id)
    
    return WorkflowResponse(
        id=db_workflow.id,
        name=db_workflow.name,
        steps=db_workflow.steps,
        status=db_workflow.status,
        created_at=db_workflow.created_at,
        updated_at=db_workflow.updated_at,
        created_by=db_workflow.created_by
    )

@router.post("/trigger", status_code=status.HTTP_202_ACCEPTED)
async def trigger_unsaved_workflow(
    workflow: WorkflowTriggerRequest,
):
    """
    Trigger a workflow execution without saving it first
    This is for the immediate execution of a workflow designed in the UI
    """
    # Here you would call your workflow engine or task queue
    # Since this is a temporary workflow, you might want to generate a temporary ID
    # and return some status information or job ID
    
    return {"message": "Workflow triggered successfully", "job_id": "temp-job-id"}