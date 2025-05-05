from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.crud import DBOperations
from ..schemas.project import ProjectCreate, ProjectResponse
from ..core.security import get_current_user
from typing import List
from ..core.utils import get_route, get_prefix, load_endpoints

# Get endpoints configuration
ENDPOINTS = load_endpoints()

router = APIRouter(
    prefix=get_prefix("project"),
    tags=["projects"]
)

@router.get(ENDPOINTS["project"]["routes"]["count"])
async def get_project_count(
     db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    count =  DBOperations.get_project_count(db,current_user["email"])
    return {"count" : count}

@router.post(ENDPOINTS["project"]["routes"]["create"])
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        if DBOperations.check_project_name_exists(db, current_user["id"], project.name):
            raise Exception("A project with this name already exists for this user")
            
        print("Received project data:", project.dict()) 
        new_project = DBOperations.create_project(db=db,project=project,user_id=current_user["id"],user_email=current_user["email"])
        print("Created project:", new_project.__dict__)
        return {
            "message": "Project created successfully",
            "project": {
                "id": new_project.id,
                "name": new_project.name,
                "model_type": new_project.model_type.value,
                "model_name": new_project.model_name,
                "status": new_project.status,
                "created_date": new_project.created_date.isoformat(),
                "user_id": new_project.user_id,
                "user_email": new_project.user_email
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(ENDPOINTS["project"]["routes"]["list"])
async def list_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return DBOperations.get_all_projects(db)

@router.get(ENDPOINTS["project"]["routes"]["get_user_projects"])
async def get_user_projects(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if current_user["id"] != user_id:
        raise HTTPException(
            status_code=403,
            detail="Not authorized to access other user's projects"
        )
    try:
        projects = DBOperations.get_user_projects(db, user_id)
        return projects
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching projects: {str(e)}"
        )
    

@router.get(ENDPOINTS["project"]["routes"]["get_by_id"])
async def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    project = DBOperations.get_project(db, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    if project.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this project")
    return project



@router.get(ENDPOINTS["project"]["routes"]["count"])
async def get_project_count(
     db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    count =  DBOperations.get_project_count(db,current_user["email"])
    return {"count" : count}

