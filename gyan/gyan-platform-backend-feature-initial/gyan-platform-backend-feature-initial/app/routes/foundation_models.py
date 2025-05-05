from fastapi import APIRouter, Depends, HTTPException, Body
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.crud import DBOperations
from ..schemas.foundation_models import FoundationModelCreate, FoundationModelResponse
from ..schemas.playground import LoadFoundationModelRequest, InferFoundationModelRequest
from ..core.security import get_current_user
from typing import List, Optional, Dict, Any
from ..core.utils import get_route, get_prefix, load_endpoints
from ..playground.foundation_playground_manager import FoundationModelPlaygroundManager
from ..models.request_models import ModelRequest
from .. schemas.request_models import ModelRequestCreate
from app.models.guard import GuardInfo
from sqlalchemy.sql import func
from fastapi.responses import JSONResponse

# Get endpoints configuration
ENDPOINTS = load_endpoints()

router = APIRouter(
    prefix=get_prefix("foundation_models"),
    tags=["foundation-models"]
)

foundation_model_playground = FoundationModelPlaygroundManager()


@router.get(ENDPOINTS["foundation_models"]["routes"]["guard_check"])
async def check_guard_counter(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    max_counter = db.query(func.max(GuardInfo.counter)).filter(
        GuardInfo.user_email == current_user["email"]
    ).scalar()

    # If no records exist, return counter as 0
    return {"max_counter": max_counter or 0}



@router.post(ENDPOINTS["foundation_models"]["routes"]["create"])
async def create_foundation_model(
    model: FoundationModelCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        print("Received model data:", model.dict())
        new_model = DBOperations.create_foundation_model(
            db=db,
            model=model
        )
        print("Created model:", new_model.__dict__)
        return {
            "message": "Foundation model created successfully",
            "model": {
                "id": new_model.id,
                "model_type": new_model.model_type,
                "model_name": new_model.model_name,
                "hf_id": new_model.hf_id,
                "gyan_repo_path": new_model.gyan_repo_path,
                "hf_access_token": new_model.hf_access_token,
                "gyan_access_token": new_model.gyan_access_token
            }
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get(ENDPOINTS["foundation_models"]["routes"]["list"])
async def list_foundation_models(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return DBOperations.get_all_foundation_models(db)

@router.get(ENDPOINTS["foundation_models"]["routes"]["get_by_id"])
async def get_foundation_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    model = DBOperations.get_foundation_model(db, model_id)
    if not model:
        raise HTTPException(status_code=404, detail="Foundation model not found")
    return model

@router.put(ENDPOINTS["foundation_models"]["routes"]["update"])
async def update_foundation_model(
    model_id: int,
    model_update: FoundationModelCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        updated_model = DBOperations.update_foundation_model(
            db=db,
            model_id=model_id,
            model_data=model_update
        )
        if not updated_model:
            raise HTTPException(status_code=404, detail="Foundation model not found")
        return {
            "message": "Foundation model updated successfully",
            "model": updated_model
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete(ENDPOINTS["foundation_models"]["routes"]["delete"])
async def delete_foundation_model(
    model_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        success = DBOperations.delete_foundation_model(db, model_id)
        if not success:
            raise HTTPException(status_code=404, detail="Foundation model not found")
        return {"message": "Foundation model deleted successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    

@router.get(ENDPOINTS["foundation_models"]["routes"]["get_by_type"])
async def get_models_by_type(
    model_type: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        if model_type.lower() == "llm":
            model_type = "LLM"
        elif model_type.lower() == "vision":
            model_type = "Vision"
        else:
            model_type = "Vision LLM"
        models = DBOperations.get_models_by_type(db, model_type)
        if not models:
            return {
                "message": f"No models found for type: {model_type}",
                "models": []
            }
        return {
            "message": f"Successfully retrieved models of type: {model_type}",
            "models": models
        }
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error retrieving models: {str(e)}"
        )
    

@router.get(ENDPOINTS["foundation_models"]["routes"]["get_by_name"])
async def get_model_by_name(
    model_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    model = DBOperations.get_foundation_model(db, model_name)
    if not model:
        raise HTTPException(status_code=404, detail="Model not found")
    return model


@router.post(ENDPOINTS["foundation_models"]["routes"]["unloaded_model"])
async def foundation_model_unload(
    unload_request: dict = Body(...)
):
    """
    Unload a foundation model to free up GPU memory resources
    
    Request body should contain:
    - model_name: Name of the model
    - model_id: Hugging Face ID of the model
    """
    try:
        unload_result = await foundation_model_playground.unload_model(
            model_name=unload_request["model_name"],
            model_id=unload_request["model_id"]
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


@router.post(ENDPOINTS["foundation_models"]["routes"]["load_model"])
async def load_foundation_model(
    request: LoadFoundationModelRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    success = await foundation_model_playground.load_model(request.model_name,request.model_id, request.parameters)
    return {"status": "success" if success else "failed"}

@router.post(ENDPOINTS["foundation_models"]["routes"]["infer"])
async def foundation_model_infer(
    request: InferFoundationModelRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    response = await foundation_model_playground.infer(request.model_name, request.model_id, request.message,db=db, current_user=current_user)
    return {"response": response}


@router.post(ENDPOINTS["foundation_models"]["routes"]["request_model"])
async def request_model(
    request: ModelRequestCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    new_request = ModelRequest(
        model_name=request.model_name,
        huggingface_id=request.huggingface_id,
        description=request.description,
        reason=request.reason,
        model_type=request.model_type,
        user_id=current_user["id"],
        user_email=current_user["email"]
    )
    db.add(new_request)
    db.commit()
    return {"message": "Request submitted successfully"}


@router.get(ENDPOINTS["foundation_models"]["routes"]["get_requests"])
async def get_requests(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return db.query(ModelRequest).filter(
        ModelRequest.user_email == current_user["email"]
    ).all()

@router.get(ENDPOINTS["foundation_models"]["routes"]["get_request_by_id"])
async def get_request_by_id(
    request_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    request = db.query(ModelRequest).filter(
        ModelRequest.id == request_id,
        ModelRequest.user_id == current_user["id"]
    ).first()
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
    return request





    