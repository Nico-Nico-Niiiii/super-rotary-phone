from sqlalchemy import Column, Integer, String, JSON, ForeignKey, DateTime, Boolean, Float, Table
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import uuid
from ..database.connection import Base



class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    email = Column(String,  index=True)
    project_id = Column(String, nullable=True) 
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    steps = Column(JSON, nullable=False)  # Store the entire steps array as JSON
    status = Column(String, default="draft")  # draft, running, completed, failed
    created_by = Column(String, nullable=True)  # User ID if authentication is implemented
    
    def __repr__(self):
        return f"<Workflow(id={self.id}, name={self.name}, status={self.status})>"