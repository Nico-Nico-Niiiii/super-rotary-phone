# routes/agent_project.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database.connection import get_db
from ..models.agent_info import  AgentCustomInfo
from ..models.agent_projects import AgentProjectInfo
from ..schemas.agent_project import AgentProjectCreate, AgentProjectResponse, AgentProjectUpdate

router = APIRouter(prefix="/api/agent-projects", tags=["Agent Projects"])

@router.post("/", response_model=AgentProjectResponse, status_code=status.HTTP_201_CREATED)
def create_agent_project(project: AgentProjectCreate, db: Session = Depends(get_db)):
    """Create a new agent project"""
    # Check if a project with the same name already exists
    existing_project = db.query(AgentProjectInfo).filter(
        AgentProjectInfo.project_name == project.project_name
    ).first()
    
    if existing_project:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project with this name already exists"
        )
    
    # Create new project
    db_project = AgentProjectInfo(
        project_name=project.project_name,
        agent_project_name=project.agent_project_name,
        agent_pro_id=project.agent_pro_id,
        framework=project.framework,
        system_prompt=project.system_prompt,
        agent_flow=project.agent_flow
    )
    
    db.add(db_project)
    db.commit()
    db.refresh(db_project)
    
    return db_project

@router.get("/")
def get_agent_projects(skip: int = 0, limit: int = 100, project_name: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(AgentProjectInfo)

    if project_name:
        query = query.filter(AgentProjectInfo.project_name == project_name)

    projects = query.offset(skip).limit(limit).all()
    return projects

@router.get("/{project_id}", response_model=AgentProjectResponse)
def get_agent_project(project_id: int, db: Session = Depends(get_db)):
    """Get a specific agent project by ID"""
    project = db.query(AgentProjectInfo).filter(AgentProjectInfo.project_id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent project with ID {project_id} not found"
        )
    
    return project

@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_agent_project(project_id: int, db: Session = Depends(get_db)):
    """Delete an agent project"""
    project = db.query(AgentProjectInfo).filter(AgentProjectInfo.project_id == project_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent project with ID {project_id} not found"
        )
    
    # Delete associated agent custom infos
    db.query(AgentCustomInfo).filter(
        AgentCustomInfo.agent_pro_id == project.agent_pro_id
    ).delete()
    
    # Delete the project
    db.delete(project)
    db.commit()
    
    return None  # Status 204 indicates success with no content

@router.put("/{project_id}", response_model=AgentProjectResponse)
def update_agent_project(
    project_id: int, 
    project_update: AgentProjectUpdate, 
    db: Session = Depends(get_db)
):
    """Update an agent project"""
    db_project = db.query(AgentProjectInfo).filter(AgentProjectInfo.project_id == project_id).first()
    
    if not db_project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent project with ID {project_id} not found"
        )
    
    # Update project attributes
    for key, value in project_update.dict(exclude_unset=True).items():
        setattr(db_project, key, value)
    
    db.commit()
    db.refresh(db_project)
    
    return db_project


@router.get("/by-agent-pro-id/{agent_pro_id}", response_model=AgentProjectResponse)
def get_agent_project_by_pro_id(agent_pro_id: str, db: Session = Depends(get_db)):
    """Get a specific agent project by agent_pro_id"""
    project = db.query(AgentProjectInfo).filter(AgentProjectInfo.agent_pro_id == agent_pro_id).first()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Agent project with agent_pro_id {agent_pro_id} not found"
        )
    
    return project