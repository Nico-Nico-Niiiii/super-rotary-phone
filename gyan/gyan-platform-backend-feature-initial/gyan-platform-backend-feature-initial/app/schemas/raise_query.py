from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Any
from datetime import datetime
from enum import Enum


class VisibilityType(str, Enum):
    PUBLIC = "public"
    PRIVATE = "private"


class QueryStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"


class PriorityLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


# User schemas - reference to existing user schemas
class UserBase(BaseModel):
    email: EmailStr
    username: Optional[str] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = "User"
    gender: Optional[str] = "Not Specified"
    phone: Optional[str] = "Not Set"
    linkedin: Optional[str] = "Not Set"


class UserRead(UserBase):
    id: int
    is_active: bool

    class Config:
        orm_mode = True


# Query schemas
class QueryBase(BaseModel):
    title: str
    description: str
    category: str
    status: QueryStatus = QueryStatus.IN_PROGRESS
    priority: PriorityLevel = PriorityLevel.MEDIUM
    visibility: VisibilityType = VisibilityType.PRIVATE


class QueryCreate(QueryBase):
    pass


class QueryResolved(BaseModel):
    resolution: str
    


class QueryUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    priority: Optional[PriorityLevel] = None
    visibility: Optional[VisibilityType] = None
    status: Optional[QueryStatus] = None
    resolution: Optional[str] = None


class QueryInDB(QueryBase):
    id: int
    user_email: str
    status: QueryStatus = QueryStatus.PENDING
    created_at: datetime
    updated_at: Optional[datetime] = None
    resolved_at: Optional[datetime] = None
    resolution: Optional[str] = None

    class Config:
        orm_mode = True


class Query(QueryInDB):
    user: UserRead

    class Config:
        orm_mode = True


# Comment schemas
class CommentBase(BaseModel):
    content: str


class CommentCreate(CommentBase):
    query_id: int


class CommentUpdate(CommentBase):
    pass


class CommentInDB(CommentBase):
    id: int
    query_id: int
    user_email: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


class Comment(BaseModel):
    id: int
    query_id: int
    user_email: str
    content: str
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        orm_mode = True


# Category schemas
class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(CategoryBase):
    pass


class Category(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True


# Notification schemas
class NotificationBase(BaseModel):
    content: str
    type: str
    query_id: Optional[int] = None


class NotificationCreate(NotificationBase):
    user_email: str


class Notification(NotificationBase):
    id: int
    user_email: str
    is_read: bool = False
    created_at: datetime
    query: Optional[QueryInDB] = None

    class Config:
        orm_mode = True


# Response schemas
class StandardResponse(BaseModel):
    success: bool
    message: str
    data: Optional[Any] = None


class TokenData(BaseModel):
    email: Optional[str] = None
    exp: Optional[datetime] = None


