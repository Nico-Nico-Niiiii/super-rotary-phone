from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Enum, Text, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from ..database.connection import Base  # Use your existing Base

# Enum classes for query status, visibility, and priority
class VisibilityType(str, enum.Enum):
    PUBLIC = "public"
    PRIVATE = "private"

class QueryStatus(str, enum.Enum):
    PENDING = "pending"
    IN_PROGRESS = "in-progress"
    RESOLVED = "resolved"

class PriorityLevel(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"

# Your User model is already defined separately, so we only need to define the relationship
# in the Query, Comment and other models

class Query(Base):
    __tablename__ = "queries"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    description = Column(Text)
    category = Column(String, index=True)
    status = Column(Enum(QueryStatus), default=QueryStatus.PENDING, index=True)
    priority = Column(Enum(PriorityLevel), default=PriorityLevel.MEDIUM, index=True)
    visibility = Column(Enum(VisibilityType), default=VisibilityType.PRIVATE, index=True)
    resolution = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    
    # Foreign keys - using email instead of user_id for tracking
    user_email = Column(String, ForeignKey("users.email"))
    
    # Relationships - This will work with your existing User model
    user = relationship("User", backref="queries")
    
    # Other relationships
    comments = relationship("Comment", back_populates="query", cascade="all, delete-orphan")


class Comment(Base):
    __tablename__ = "comments"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow, nullable=True)
    
    # Foreign keys
    user_email = Column(String, ForeignKey("users.email"))
    query_id = Column(Integer, ForeignKey("queries.id", ondelete="CASCADE"))
    
    # Relationships
    user = relationship("User", backref="comments")
    query = relationship("Query", back_populates="comments")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    content = Column(Text)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Notification types
    type = Column(String, index=True)  # comment, resolution, status_change, etc.
    
    # Foreign keys
    user_email = Column(String, ForeignKey("users.email"))
    query_id = Column(Integer, ForeignKey("queries.id", ondelete="CASCADE"), nullable=True)
    
    # Relationships
    user = relationship("User", backref="notifications")
    query = relationship("Query")