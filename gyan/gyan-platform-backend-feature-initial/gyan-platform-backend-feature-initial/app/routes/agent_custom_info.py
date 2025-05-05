# routes/agent_custom_info.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
import json

from ..database.connection import get_db
from ..models.agent_info import AgentCustomInfo
from ..models.agent_projects import AgentProjectInfo
from ..schemas.agent_custom_info import AgentCustomInfoCreate, AgentCustomInfoResponse, AgentCustomInfoUpdate

router = APIRouter(prefix="/api/agent-custom-info", tags=["Agent Custom Info"])

@router.post("/", response_model=AgentCustomInfoResponse, status_code=status.HTTP_201_CREATED)
def create_agent_custom_info(data: AgentCustomInfoCreate, db: Session = Depends(get_db)):
    """Create agent custom information"""
    # Check if the agent_pro_id exists
    project = db.query(AgentProjectInfo).filter(
        AgentProjectInfo.agent_pro_id == data.agent_pro_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with agent_pro_id {data.agent_pro_id} not found"
        )
    
    # Create new agent info
    db_agent_info = AgentCustomInfo(
        agent_pro_id=data.agent_pro_id,
        agent_project_name=data.agent_project_name,
        agent_name=data.agent_name,
        selected_llm=data.selected_llm,
        selected_tool=data.selected_tool,
        framework=data.framework,
        agent_type=data.agent_type,
        system_prompt=data.system_prompt,
        role=data.role,
        goal=data.goal,
        backstory=data.backstory,
        tasks=data.tasks,
        task_description=data.task_description,
        expected_output=data.expected_output,
        predecessor=data.predecessor,
        successor=data.successor
    )
    
    db.add(db_agent_info)
    db.commit()
    db.refresh(db_agent_info)
    
    return db_agent_info

@router.get("/", response_model=List[AgentCustomInfoResponse])
def get_all_agent_custom_info(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all agent custom information"""
    return db.query(AgentCustomInfo).offset(skip).limit(limit).all()

@router.get("/project/{agent_pro_id}", response_model=List[AgentCustomInfoResponse])
def get_agent_custom_info_by_project(agent_pro_id: str, db: Session = Depends(get_db)):
    """Get agent custom information by project ID"""
    agent_infos = db.query(AgentCustomInfo).filter(
        AgentCustomInfo.agent_pro_id == agent_pro_id
    ).all()
    
    if not agent_infos:
        return []
    
    return agent_infos

@router.get("/{info_id}", response_model=AgentCustomInfoResponse)
def get_agent_custom_info(info_id: int, db: Session = Depends(get_db)):
    """Get specific agent custom information by ID"""
    agent_info = db.query(AgentCustomInfo).filter(AgentCustomInfo.id == info_id).first()
    
    if not agent_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent custom info with ID {info_id} not found"
        )
    
    return agent_info

@router.put("/{info_id}", response_model=AgentCustomInfoResponse)
def update_agent_custom_info(info_id: int, data: AgentCustomInfoUpdate, db: Session = Depends(get_db)):
    """Update agent custom information"""
    agent_info = db.query(AgentCustomInfo).filter(AgentCustomInfo.id == info_id).first()
    
    if not agent_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent custom info with ID {info_id} not found"
        )
    
    # Update fields
    for key, value in data.dict(exclude_unset=True).items():
        setattr(agent_info, key, value)
    
    db.commit()
    db.refresh(agent_info)
    
    return agent_info

@router.delete("/{info_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_custom_info(info_id: int, db: Session = Depends(get_db)):
    """Delete agent custom information"""
    agent_info = db.query(AgentCustomInfo).filter(AgentCustomInfo.id == info_id).first()
    
    if not agent_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent custom info with ID {info_id} not found"
        )
    
    db.delete(agent_info)
    db.commit()
    
    return None