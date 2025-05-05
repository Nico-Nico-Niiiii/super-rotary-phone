from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from ..database.connection import get_db
from app.core.security import get_current_user
from app.models.raise_query import Query as QueryModel, Comment as CommentModel, Notification, VisibilityType, QueryStatus, PriorityLevel
from app.schemas.raise_query import (
    QueryCreate, QueryUpdate, Query, QueryInDB, 
    CommentCreate, Comment, 
    StandardResponse, UserRead, QueryBase, QueryResolved
)

router = APIRouter(prefix="/api/queries", tags=["queries"])

# Create a new query
@router.post("/")
async def create_query(
    query: QueryBase,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Create new query
    db_query = QueryModel(
        title=query.title,
        description=query.description,
        category=query.category,
        status=query.status,
        priority=query.priority,
        visibility=query.visibility,
        user_email=current_user["email"],
    )
    
    db.add(db_query)
    db.commit()
    db.refresh(db_query)
    
    return db_query

# Get current user's queries
@router.get("/my/")
async def get_my_queries(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    queries = db.query(QueryModel).filter(
        QueryModel.user_email == current_user["email"]
    ).order_by(QueryModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return queries

# Get public queries
@router.get("/public/")
async def get_public_queries(
    db: Session = Depends(get_db),
    current_user: UserRead = Depends(get_current_user),  # Authenticate user
    skip: int = 0,
    limit: int = 100,
    category: Optional[str] = None
):
    query = db.query(QueryModel).filter(
        QueryModel.visibility == VisibilityType.PUBLIC
    )
    
    if category:
        query = query.filter(QueryModel.category == category)
    
    queries = query.order_by(QueryModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return queries

# Get a specific query by ID
@router.get("/{query_id}")
async def get_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    query = db.query(QueryModel).filter(QueryModel.id == query_id).first()
    
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Check if user has permission to view this query
    if query.visibility != VisibilityType.PUBLIC and query.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to access this query")
    
    return query

# Update a query
@router.put("/{query_id}")
async def update_query(
    query_id: int,
    query_update: QueryUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_query = db.query(QueryModel).filter(QueryModel.id == query_id).first()
    
    if not db_query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Only the owner can update their query
    if db_query.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to update this query")
    
    # Update fields if they are provided
    update_data = query_update.dict(exclude_unset=True)
    
    # Set updated_at timestamp
    update_data["updated_at"] = datetime.utcnow()
    
    # Set resolved_at if status is changed to RESOLVED
    if query_update.status == QueryStatus.RESOLVED and db_query.status != QueryStatus.RESOLVED:
        update_data["resolved_at"] = datetime.utcnow()
    
    for key, value in update_data.items():
        setattr(db_query, key, value)
    
    db.commit()
    db.refresh(db_query)
    
    # Create notification for status changes if applicable
    if query_update.status and query_update.status != db_query.status:
        notification = Notification(
            content=f"Status of your query '{db_query.title}' has been updated to {db_query.status.value}",
            type="status_change",
            user_email=db_query.user_email,
            query_id=db_query.id
        )
        db.add(notification)
        db.commit()
    
    return db_query

# Delete a query
@router.delete("/{query_id}", response_model=StandardResponse)
async def delete_query(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    db_query = db.query(QueryModel).filter(QueryModel.id == query_id).first()
    
    if not db_query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Only the owner can delete their query
    if db_query.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to delete this query")
    
    db.delete(db_query)
    db.commit()
    
    return StandardResponse(
        success=True,
        message="Query deleted successfully"
    )

# Add a comment to a query
@router.post("/comments/{query_id}/")
async def add_comment(
    query_id: int,
    content: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    # Check if query exists
    query = db.query(QueryModel).filter(QueryModel.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Check if user has permission to comment
    if query.visibility != VisibilityType.PUBLIC and query.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to comment on this query")
    
    # Create new comment
    db_comment = CommentModel(
        content=content,
        query_id=query_id,
        user_email=current_user["email"],
        created_at=datetime.utcnow() 
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Create notification for query owner if commenter is not the owner
    # if current_user["email"] != query.user_email:
    #     notification = Notification(
    #         content=f"New comment on your query '{query.title}'",
    #         type="comment",
    #         user_email=query.user_email,
    #         query_id=query.id
    #     )
    #     db.add(notification)
    #     db.commit()
    
    return db_comment

# Get comments for a query
@router.get("/{query_id}/comments/")
async def get_query_comments(
    query_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    # Check if query exists
    query = db.query(QueryModel).filter(QueryModel.id == query_id).first()
    if not query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Check if user has permission to view comments
    if query.visibility != VisibilityType.PUBLIC and query.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to view comments on this query")
    
    # Use CommentModel instead of Comment schema
    comments = db.query(CommentModel).filter(
        CommentModel.query_id == query_id
    ).order_by(CommentModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return comments

# Get queries by category
@router.get("/category/{category}")
async def get_queries_by_category(
    category: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100,
    visibility: Optional[VisibilityType] = None
):
    query = db.query(QueryModel).filter(QueryModel.category == category)
    
    # Filter by visibility
    if visibility:
        query = query.filter(QueryModel.visibility == visibility)
    else:
        # If visibility not specified, show public queries and user's own queries
        query = query.filter(
            (QueryModel.visibility == VisibilityType.PUBLIC) | 
            (QueryModel.user_email == current_user.email)
        )
    
    queries = query.order_by(QueryModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return queries

# Search queries
# @router.get("/search/", response_model=List[QueryInDB])
# async def search_queries(
#     search_term: str = Query(min_length=1),
#     db: Session = Depends(get_db),
#     current_user: UserRead = Depends(get_current_user),
#     skip: int = 0,
#     limit: int = 100,
#     category: Optional[str] = None
# ):
#     # Base query: show public queries and user's own queries
#     query = db.query(QueryModel).filter(
#         (QueryModel.visibility == VisibilityType.PUBLIC) | 
#         (QueryModel.user_email == current_user.email)
#     )
    
#     # Apply search filter
#     query = query.filter(
#         (QueryModel.title.ilike(f"%{search_term}%")) | 
#         (QueryModel.description.ilike(f"%{search_term}%"))
#     )
    
#     # Filter by category if specified
#     if category and category.lower() != "all":
#         query = query.filter(QueryModel.category == category)
    
#     queries = query.order_by(QueryModel.created_at.desc()).offset(skip).limit(limit).all()
    
#     return queries

# Get queries by status
@router.get("/status/{status}")
async def get_queries_by_status(
    status: QueryStatus,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    skip: int = 0,
    limit: int = 100
):
    # For own queries filtered by status
    queries = db.query(QueryModel).filter(
        QueryModel.status == status,
        QueryModel.user_email == current_user["email"]
    ).order_by(QueryModel.created_at.desc()).offset(skip).limit(limit).all()
    
    return queries

# Mark a query as resolved
@router.put("/{query_id}/resolve")
async def resolve_query(
    query_id: int,
    resolution: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    
    db_query = db.query(QueryModel).filter(QueryModel.id == query_id).first()
    
    if not db_query:
        raise HTTPException(status_code=404, detail="Query not found")
    
    # Only the owner can resolve their query
    if db_query.user_email != current_user["email"]:
        raise HTTPException(status_code=403, detail="Not authorized to resolve this query")
    
    # Update query status and resolution
    db_query.status = QueryStatus.RESOLVED
    db_query.resolution = resolution
    db_query.resolved_at = datetime.utcnow()
    db_query.updated_at = datetime.utcnow()
    
    db.commit()
    db.refresh(db_query)
    
    return db_query