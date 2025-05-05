from pydantic import BaseModel, EmailStr, validator
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr

class UserResponse(UserBase):
    password: str


class UserCreate(BaseModel):
    """
    Pydantic model for user creation
    """
    email: EmailStr
    password: str
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None

    # Validation methods
    @validator('username', 'first_name', 'last_name', pre=True, always=True)
    def strip_whitespace(cls, v):
        """
        Strip whitespace from name fields
        """
        return v.strip() if isinstance(v, str) else v

    @validator('username')
    def validate_username(cls, v):
        """
        Validate username if provided
        """
        if v and (len(v) < 3 or len(v) > 50):
            raise ValueError('Username must be between 3 and 50 characters')
        return v

    @validator('password')
    def validate_password(cls, v):
        """
        Validate password strength
        """
        if len(v) < 6 or len(v) > 12:
            raise ValueError('Password must be between 6 and 12 characters')
        
        # Check for at least one number
        # if not any(char.isdigit() for char in v):
        #     raise ValueError('Password must contain at least one number')
        
        # Check for at least one special character
        # special_chars = "!@#$%^&*(),.?\":{}|<>"
        # if not any(char in special_chars for char in v):
        #     raise ValueError('Password must contain at least one special character')
        
        return v

    class Config:
        """
        Pydantic model configuration
        """
        schema_extra = {
            "example": {
                "email": "user@capgemini.com",
                "password": "Password123!",
                "username": "johndoe",
                "first_name": "John",
                "last_name": "Doe"
            }
        }

class User(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True