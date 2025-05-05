from sqlalchemy import Column, Integer, String, ForeignKey, Enum, DateTime
from ..database.connection import Base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

class ModelType(str, enum.Enum):
    LLM = "Large Language Model"
    VISION = "Vision"
    VISION_LLM = "Vision LLM"



class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    model_type = Column(Enum(ModelType))
    model_name = Column(String)
    model_path = Column(String, nullable=True)
    model_repository_path = Column(String, nullable=True)
    dataset_repository_path = Column(String, nullable=True)
    status = Column(String, default="Active")
    created_date = Column(DateTime, default=datetime.utcnow)
    
    # Foreign keys
    user_id = Column(Integer, ForeignKey("users.id"))
    # Store email as regular column
    user_email = Column(String)
    
    # Specify foreign_keys in relationship
    user = relationship("User", 
                       back_populates="projects",
                       foreign_keys=[user_id])
    training_jobs = relationship("TrainingJob", back_populates="project")
    evaluations = relationship("Evaluation", back_populates="project")