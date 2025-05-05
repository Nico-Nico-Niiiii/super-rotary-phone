from fastapi import APIRouter, Depends, HTTPException, status, Body
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import json

from ..database.connection import get_db
from ..core.security import get_current_user
from ..core.utils import get_route, get_prefix, load_endpoints
from  ..playground.llm.playground_manager import PlaygroundManager
from ..schemas.playground import LoadModelRequest, InferModelRequest
from fastapi.responses import JSONResponse

ENDPOINTS = load_endpoints()
router = APIRouter(
    prefix=get_prefix("playground"),
    tags=["playground"]
)

playground_manager = PlaygroundManager()

@router.get(ENDPOINTS["playground"]["routes"]["user_models"])
async def get_models_by_user(
    email: str,
    project_name: str = None,
    model_name: str = None,
    model_type: str = None,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all completed models for a user with optional filters"""
    try:
        models = playground_manager.get_user_models(
            db=db,
            email=current_user["email"],
            project_name=project_name,
            model_name=model_name,
            model_type=model_type
        )
        return models
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(ENDPOINTS["playground"]["routes"]["projects"])
async def get_user_projects(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get all projects for a user"""
    try:
        projects = playground_manager.get_user_projects(
            db=db,
            email=current_user["email"]
        )
        return projects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# @router.post(ENDPOINTS["playground"]["routes"]["unload_model"])
# async def chatbot_unload_model():
#     """
#     Unload the currently loaded model to free up resources
#     """
#     unload_result = playground_manager.unload_model()
#     return JSONResponse(content=unload_result, status_code=200)


@router.post(ENDPOINTS["playground"]["routes"]["unloaded_model"])
async def chatbot_unload_model(
    unload_request: dict = Body(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Unload a model to free up GPU memory resources
    
    Request body should contain:
    - email: User email
    - model_type: Type of model
    - project_name: Project name
    - model_name: Model name
    - job_name: Job name
    """
    try:
        unload_result = await playground_manager.unload_model(
            email=current_user["email"],
            model_type=unload_request["model_type"],
            project_name=unload_request["project_name"],
            model_name=unload_request["model_name"],
            job_name=unload_request["job_name"]
        )
        
        if unload_result:
            return JSONResponse(
                content={"status": "success", "message": "Model unloaded successfully"},
                status_code=200
            )
        else:
            return JSONResponse(
                content={"status": "error", "message": "Model was not loaded or could not be unloaded"},
                status_code=400
            )
    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": f"Error unloading model: {str(e)}"},
            status_code=500
        )


@router.post(ENDPOINTS["playground"]["routes"]["load_model"])
async def load_model(
   request: LoadModelRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Load a model for inference"""
    try:
        print("hello from request playground")
        print("***************************************************************************")
        success = await playground_manager.load_model(
            email=current_user["email"],
            model_type=request.model_type,
            project_name=request.project_name,
            model_name=request.model_name,
            job_name=request.job_name,
            parameters=request.parameters
        )
        return {"status": "success" if success else "failed"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get(ENDPOINTS["playground"]["routes"]["model_status"])
async def get_model_status(
    model_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Check if a model is loaded and ready for inference"""
    try:
        status = playground_manager.get_model_status(model_id)
        return {"status": status}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post(ENDPOINTS["playground"]["routes"]["infer"])
async def infer(
   request: InferModelRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Generate inference from loaded model"""
    try:
        response = await playground_manager.infer(
            email=current_user["email"],
            model_type=request.model_type,
            project_name=request.project_name,
            model_name=request.model_name,
            message=request.message,
            job_name=request.job_name,
            db=db, 
            current_user=current_user
        )
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))