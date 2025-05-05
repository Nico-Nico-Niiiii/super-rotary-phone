from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
from ..database.connection import Base

class ModelRequest(Base):
    __tablename__ = "model_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    model_name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    huggingface_id = Column(String, nullable=False)
    description = Column(String)
    reason = Column(String)
    status = Column(String, default="PENDING")
    user_id = Column(Integer, nullable=False)
    user_email = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)