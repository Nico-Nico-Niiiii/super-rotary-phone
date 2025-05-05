from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict
from ..database.connection import get_db
from ..models.prompt import PromptLibraryInfo
from ..schemas.prompt import PromptBase, PromptResponse
from sqlalchemy.exc import SQLAlchemyError
from ..core.security import get_current_user
from ..core.utils import get_route, get_prefix, load_endpoints
from sqlalchemy import and_


ENDPOINTS = load_endpoints()
router = APIRouter(prefix=ENDPOINTS["prompts"]["prefix"], tags=["prompts"])

# @router.post("/create", response_model=PromptBase)
# async def create_prompt(prompt: PromptBase, db: Session = Depends(get_db)):
#     try:
#         db_prompt = PromptLibraryInfo(
#             user_email=prompt.user_email,
#             prompt_library_name=prompt.prompt_library_name,
#             prompt_subsection_name=prompt.prompt_subsection_name,
#             prompt=prompt.prompt,
#             prompt_description=prompt.prompt_description
#         )
#         db.add(db_prompt)
#         db.commit()
#         db.refresh(db_prompt)
#         return db_prompt
#     except SQLAlchemyError as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Database error: {str(e)}"
#         )


@router.post("/create", response_model=PromptBase)
async def create_prompt(prompt: PromptResponse, db: Session = Depends(get_db)):
    # Check if section name already exists for this library
    existing_section = db.query(PromptLibraryInfo).filter(
        and_(
            PromptLibraryInfo.prompt_library_name == prompt.prompt_library_name,
            PromptLibraryInfo.prompt_subsection_name == prompt.prompt_subsection_name
        )
    ).first()
    
    if existing_section:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Section name '{prompt.prompt_subsection_name}' already exists in library '{prompt.prompt_library_name}'"
        )
    
    try:
        db_prompt = PromptLibraryInfo(
            user_email=prompt.user_email,
            prompt_library_name=prompt.prompt_library_name,
            prompt_subsection_name=prompt.prompt_subsection_name,
            prompt=prompt.prompt,
            prompt_description=prompt.prompt_description
        )
        db.add(db_prompt)
        db.commit()
        db.refresh(db_prompt)
        return db_prompt
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    

@router.post("/bulk-create")
async def bulk_create_prompts(prompts: List[PromptResponse], db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
    # First check for duplicate section names
    section_names = {}
    for prompt in prompts:
        key = (prompt.prompt_library_name, prompt.prompt_subsection_name)
        if key in section_names:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Duplicate section name '{prompt.prompt_subsection_name}' in library '{prompt.prompt_library_name}'"
            )
        section_names[key] = True
        
    # Check against existing sections in database
    for prompt in prompts:
        existing_section = db.query(PromptLibraryInfo).filter(
            and_(
                PromptLibraryInfo.prompt_library_name == prompt.prompt_library_name,
                PromptLibraryInfo.prompt_subsection_name == prompt.prompt_subsection_name
            )
        ).first()
        
        if existing_section:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Section name '{prompt.prompt_subsection_name}' already exists in library '{prompt.prompt_library_name}'"
            )
    
    try:
        db_prompts = []
        for prompt in prompts:
            db_prompt = PromptLibraryInfo(
                user_email=current_user["email"],
                prompt_library_name=prompt.prompt_library_name,
                prompt_subsection_name=prompt.prompt_subsection_name,
                prompt=prompt.prompt,
                prompt_description=prompt.prompt_description
            )
            db_prompts.append(db_prompt)
        
        db.add_all(db_prompts)
        db.commit()
        for prompt in db_prompts:
            db.refresh(prompt)
        return db_prompts
    except SQLAlchemyError as e:
        print("Error in prompt addition to DB", str(e))
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

# @router.post("/bulk-create", response_model=List[PromptBase])
# async def bulk_create_prompts(prompts: List[PromptBase], db: Session = Depends(get_db), current_user: dict = Depends(get_current_user)):
#     try:
#         db_prompts = []
#         for prompt in prompts:
#             db_prompt = PromptLibraryInfo(
#                 user_email=current_user["email"],
#                 prompt_library_name=prompt.prompt_library_name,
#                 prompt_subsection_name=prompt.prompt_subsection_name,
#                 prompt=prompt.prompt,
#                 prompt_description=prompt.prompt_description
#             )
#             db_prompts.append(db_prompt)
        
#         db.add_all(db_prompts)
#         db.commit()
#         for prompt in db_prompts:
#             db.refresh(prompt)
#         return db_prompts
#     except SQLAlchemyError as e:
#         db.rollback()
#         raise HTTPException(
#             status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
#             detail=f"Database error: {str(e)}"
        # )

@router.get("/list", response_model=List[PromptBase])
async def list_prompts(db: Session = Depends(get_db)):
    return db.query(PromptLibraryInfo).all()

@router.get("/library/{library_name}", response_model=List[PromptBase])
async def get_prompts_by_library(library_name: str, db: Session = Depends(get_db)):
    prompts = db.query(PromptLibraryInfo).filter(
        PromptLibraryInfo.prompt_library_name == library_name
    ).all()
    if not prompts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No prompts found for library: {library_name}"
        )
    return prompts

@router.get("/user/{user_email}", response_model=List[PromptBase])
async def get_prompts_by_user(user_email: str, db: Session = Depends(get_db)):
    prompts = db.query(PromptLibraryInfo).filter(
        PromptLibraryInfo.user_email == user_email
    ).all()
    if not prompts:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No prompts found for user: {user_email}"
        )
    return prompts

@router.get("/{prompt_id}", response_model=PromptBase)
async def get_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(PromptLibraryInfo).filter(PromptLibraryInfo.id == prompt_id).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt with id {prompt_id} not found"
        )
    return prompt




@router.put("/{prompt_id}", response_model=PromptBase)
async def update_prompt(prompt_id: int, prompt_update: PromptBase, db: Session = Depends(get_db)):
    existing_section = db.query(PromptLibraryInfo).filter(
        and_(
            PromptLibraryInfo.prompt_library_name == prompt_update.prompt_library_name,
            PromptLibraryInfo.prompt_subsection_name == prompt_update.prompt_subsection_name,
            PromptLibraryInfo.id != prompt_id
        )
    ).first()
    
    if existing_section:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Section name '{prompt_update.prompt_subsection_name}' already exists"
        )

    db_prompt = db.query(PromptLibraryInfo).filter(PromptLibraryInfo.id == prompt_id).first()
    if not db_prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Prompt not found"
        )
    
    try:
        for var, value in vars(prompt_update).items():
            if value is not None:
                setattr(db_prompt, var, value)
        
        db.commit()
        db.refresh(db_prompt)
        return db_prompt
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )
    
    

@router.delete("/{prompt_id}")
async def delete_prompt(prompt_id: int, db: Session = Depends(get_db)):
    prompt = db.query(PromptLibraryInfo).filter(PromptLibraryInfo.id == prompt_id).first()
    if not prompt:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Prompt with id {prompt_id} not found"
        )
    
    try:
        db.delete(prompt)
        db.commit()
        return {"message": f"Prompt {prompt_id} deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/library/{library_name}")
async def delete_library(library_name: str, db: Session = Depends(get_db)):
    try:
        deleted = db.query(PromptLibraryInfo).filter(
            PromptLibraryInfo.prompt_library_name == library_name
        ).delete()
        
        if deleted == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Library {library_name} not found"
            )
            
        db.commit()
        return {"message": f"Library {library_name} deleted successfully"}
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )