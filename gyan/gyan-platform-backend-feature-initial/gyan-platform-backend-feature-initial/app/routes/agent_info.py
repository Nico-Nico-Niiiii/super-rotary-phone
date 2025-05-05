# routes/agent_info.py
from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional

from ..database.connection import get_db
from ..models.agent_info import AgentCustomInfo
from ..models.agent_projects import AgentProjectInfo

router = APIRouter(prefix="/api/agent-info", tags=["Agent Info"])

@router.post("/save", status_code=status.HTTP_200_OK)
def save_agent_info(agent_data: Dict[str, Any] = Body(...), db: Session = Depends(get_db)):
    """Save agent information for workflow nodes"""
    agent_pro_id = agent_data.get("agent_pro_id")
    node_id = agent_data.get("node_id")
    
    if not agent_pro_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="agent_pro_id is required"
        )
    
    # Check if the agent_pro_id exists
    project = db.query(AgentProjectInfo).filter(
        AgentProjectInfo.agent_pro_id == agent_pro_id
    ).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project with agent_pro_id {agent_pro_id} not found"
        )
    
    # Check if info_id is provided for update
    info_id = agent_data.get("id")
    
    if info_id and info_id != "new":
        # Update existing agent info
        agent_info = db.query(AgentCustomInfo).filter(AgentCustomInfo.id == info_id).first()
        
        if not agent_info:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Agent info with ID {info_id} not found"
            )
        
        # Update fields
        for key, value in agent_data.items():
            if hasattr(agent_info, key):
                setattr(agent_info, key, value)
        
        db.commit()
        db.refresh(agent_info)
        
        return {"success": True, "message": "Agent info updated successfully", "agent_info": agent_info.as_dict()}
    else:
        # Create new agent info
        new_agent_info = AgentCustomInfo(
            agent_pro_id=agent_pro_id,
            agent_project_name=agent_data.get("agent_project_name", project.agent_project_name),
            agent_name=agent_data.get("agent_name", ""),
            selected_llm=agent_data.get("selected_llm", ""),
            selected_tool=agent_data.get("selected_tool", ""),
            framework=agent_data.get("framework", project.framework),
            agent_type=agent_data.get("agent_type", ""),
            system_prompt=agent_data.get("system_prompt", ""),
            role=agent_data.get("role", ""),
            goal=agent_data.get("goal", ""),
            backstory=agent_data.get("backstory", ""),
            tasks=agent_data.get("tasks", []),
            task_description=agent_data.get("task_description", ""),
            expected_output=agent_data.get("expected_output", ""),
            predecessor=agent_data.get("predecessor", ""),
            successor=agent_data.get("successor", ""),
            node_id=node_id
        )
        
        db.add(new_agent_info)
        db.commit()
        db.refresh(new_agent_info)
        
        return {"success": True, "message": "Agent info created successfully", "agent_info": new_agent_info.as_dict()}

@router.get("/node/{node_id}", status_code=status.HTTP_200_OK)
def get_agent_info_by_node(node_id: str, db: Session = Depends(get_db)):
    """Get agent information by node ID"""
    agent_info = db.query(AgentCustomInfo).filter(AgentCustomInfo.node_id == node_id).first()
    
    if not agent_info:
        return {"success": False, "message": "No agent info found for this node"}
    
    return {"success": True, "agent_info": agent_info.as_dict()}

@router.get("/{info_id}", status_code=status.HTTP_200_OK)
def get_agent_info(info_id: int, db: Session = Depends(get_db)):
    """Get agent information by ID"""
    agent_info = db.query(AgentCustomInfo).filter(AgentCustomInfo.id == info_id).first()
    
    if not agent_info:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent info with ID {info_id} not found"
        )
    
    return {"success": True, "agent_info": agent_info.as_dict()}