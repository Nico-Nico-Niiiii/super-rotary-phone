# routes/agent_workflow.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any
from uuid import uuid4

from ..database.connection import get_db
from ..models.agent_projects import AgentProjectInfo
from ..models.agent_workflow import AgentWorkflow
from ..models.agent_chatdb import Execution, Message
from app.agents.crewai import CrewAIService
from pydantic import BaseModel
import re


class WorkflowRequest(BaseModel):
    agent_pro_id: str

class SendMessageRequest(BaseModel):
    execution_id : str
    agent_pro_id : str
    message : str

router = APIRouter(prefix="/api/agent-workflows", tags=["Agent Workflows"])

crew_service = CrewAIService()

@router.post("/save/{agent_pro_id}", status_code=status.HTTP_200_OK)
def save_workflow(agent_pro_id: str, workflow_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Save agent workflow data"""
    # Check if the agent_pro_id exists
    project = db.query(AgentProjectInfo).filter(
        AgentProjectInfo.agent_pro_id == agent_pro_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with agent_pro_id {agent_pro_id} not found"
        )
    
    # Check if workflow already exists
    existing_workflow = db.query(AgentWorkflow).filter(
        AgentWorkflow.agent_pro_id == agent_pro_id
    ).first()
    
    if existing_workflow:
        # Update existing workflow
        existing_workflow.workflow_data = workflow_data
        db.commit()
        return {"message": "Workflow updated successfully"}
    else:
        # Create new workflow
        new_workflow = AgentWorkflow(
            agent_pro_id=agent_pro_id,
            workflow_data=workflow_data
        )
        db.add(new_workflow)
        db.commit()
        return {"message": "Workflow saved successfully"}

@router.get("/{agent_pro_id}", status_code=status.HTTP_200_OK)
def get_workflow(agent_pro_id: str, db: Session = Depends(get_db)):
    """Get agent workflow data"""
    workflow = db.query(AgentWorkflow).filter(
        AgentWorkflow.agent_pro_id == agent_pro_id
    ).first()
    
    if not workflow:
        return {"nodes": [], "connections": []}
    
    return workflow.workflow_data


@router.post("/execute")
async def execute_workflow(request: WorkflowRequest, db: Session =Depends(get_db)):
    """API endpoint to execute a workflow by fetching data from the database."""
    result = crew_service.run_workflow(db, request.agent_pro_id, '')
    return {"result": result}




@router.post("/executions/start")
async def start_execution(request: WorkflowRequest, db: Session = Depends(get_db)):
    """Create a new execution session in the database"""
    execution_id = str(uuid4())
    new_execution = Execution(
        id=execution_id,
        agent_pro_id=request.agent_pro_id,
        status="running"
    )
    db.add(new_execution)
    db.commit()
    return {"execution_id": execution_id}




@router.post("/executions/{execution_id}/send-message")
async def send_message(request: SendMessageRequest, db: Session = Depends(get_db)):
    """Send a message, store it, and trigger workflow execution"""
    print("Inside route", request)
    execution = db.query(Execution).filter(Execution.id == request.execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")
    print("Execution", execution)
    # Store the user message
    user_message = Message(
        id=str(uuid4()),
        execution_id=request.execution_id,
        sender="user",
        content=request.message
    )
    db.add(user_message)
    db.commit()

    # Run workflow and generate agent response
    response = crew_service.run_workflow(db, request.agent_pro_id, request.message)
    print("Response from crew", response)
    # Store the agent's response
    agent_message = Message(
        id=str(uuid4()),
        execution_id=request.execution_id,
        sender="agent",
        content=str(response)
    )
    db.add(agent_message)

    # Mark execution as completed
    execution.status = "completed"
    db.commit()

    return {"response": response}




@router.get("/executions/{execution_id}/history")
async def get_execution_history(execution_id: str, db: Session = Depends(get_db)):
    """Fetch chat history for a specific execution from the database"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    if not execution:
        raise HTTPException(status_code=404, detail="Execution not found")

    messages = db.query(Message).filter(Message.execution_id == execution_id).order_by(Message.timestamp).all()
    for msg in messages:
        result = msg.content
        msg.content = re.sub(r'\r?\n+', '\n', result.strip())
    return {
        "execution_id": execution.id,
        "agent_pro_id": execution.agent_pro_id,
        "status": execution.status,
        "timestamp": execution.timestamp,
        "messages": [{"sender": msg.sender, "content": msg.content, "timestamp": msg.timestamp} for msg in messages]
    }



@router.get("/executions/history")
async def list_executions(db: Session = Depends(get_db)):
    """Fetch all past executions"""
    executions = db.query(Execution).order_by(Execution.timestamp.desc()).all()
    return [
        {
            "execution_id": ex.id,
            "agent_pro_id": ex.agent_pro_id,
            "status": ex.status,
            "timestamp": ex.timestamp
        }
        for ex in executions
    ]




@router.delete("/executions/{execution_id}", status_code=status.HTTP_200_OK)
async def delete_execution(execution_id: str, db: Session = Depends(get_db)):
    """Delete an execution and all its associated messages"""
    execution = db.query(Execution).filter(Execution.id == execution_id).first()
    
    if not execution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Execution with ID {execution_id} not found"
        )
    
    # SQLAlchemy will automatically delete all related messages due to the
    # cascade="all, delete-orphan" setting in the relationship
    db.delete(execution)
    db.commit()
    
    return {"message": f"Execution {execution_id} and all associated messages deleted successfully"}



