# from fastapi import APIRouter, Depends, HTTPException, status
# from sqlalchemy.orm import Session
# from typing import Optional

# from ..database.connection import get_db
# from ..models.user import User
# from ..core.security import get_current_user
# from pydantic import BaseModel

# router = APIRouter(prefix="/users", tags=["users"])

# class UserProfileUpdate(BaseModel):
#     username: Optional[str] = None
#     first_name: Optional[str] = None
#     last_name: Optional[str] = None

# class UserProfileResponse(BaseModel):
#     id: int
#     email: str
#     username: Optional[str] = None
#     first_name: Optional[str] = None
#     last_name: Optional[str] = None
#     is_active: bool
    
#     class Config:
#         orm_mode = True

# @router.get("/me", response_model=UserProfileResponse)
# def get_current_user_profile(
#     current_user: User = Depends(get_current_user),
# ):
#     """Get profile information for the current logged-in user"""
#     return current_user

# @router.patch("/me", response_model=UserProfileResponse)
# def update_user_profile(
#     profile_data: UserProfileUpdate,
#     current_user: User = Depends(get_current_user),
#     db: Session = Depends(get_db)
# ):
#     """Update profile information for the current logged-in user"""
    
#     # Update user model with provided fields
#     for field, value in profile_data.dict(exclude_unset=True).items():
#         setattr(current_user, field, value)
    
#     # Save to database
#     db.commit()
#     db.refresh(current_user)
    
#     return current_user


from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional

from ..database.connection import get_db
from ..models.user import User
from ..core.security import get_current_user
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])

class UserProfileUpdate(BaseModel):
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    gender: Optional[str] = None
    linkedin: Optional[str] = None
    phone: Optional[str] = None

class UserProfileResponse(BaseModel):
    id: int
    email: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    is_active: bool
    
    class Config:
        orm_mode = True

@router.get("/me")
def get_current_user_profile(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get profile information for the current logged-in user"""
    user = db.query(User).filter(User.email == current_user["email"]).first()
    print("USER", user)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    # Replace None values with "Not Set"
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username if user.username else "Not Set",
        "first_name": user.first_name if user.first_name else "Not Set",
        "last_name": user.last_name if user.last_name else "Not Set",
        "is_active": user.is_active,
    }
    

@router.patch("/me")
def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update profile information for the current logged-in user"""
    print("Profile data", profile_data)
    user = db.query(User).filter(User.email == current_user["email"]).first()
    # Update user model with provided fields
    for field, value in profile_data.dict(exclude_unset=True).items():
        setattr(user, field, value)
    
    # Save to database
    db.commit()
    db.refresh(user)
    
    return user


@router.get("/users/fetch")
def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Fetch user details from the database"""
    user = db.query(User).filter(User.email == current_user["email"]).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="User not found"
        )
    
    # Replace None values with "Not Set"
    return {
        "id": user.id,
        "email": user.email,
        "username": user.username if user.username else "Not Set",
        "first_name": user.first_name if user.first_name else "Not Set",
        "last_name": user.last_name if user.last_name else "Not Set",
        "is_active": user.is_active,
    }
