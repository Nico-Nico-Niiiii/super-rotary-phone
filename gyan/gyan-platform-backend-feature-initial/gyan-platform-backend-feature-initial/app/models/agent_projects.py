from sqlalchemy import Column, Integer, String, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base

class AgentProjectInfo(Base):
    __tablename__ = "agent_project"
    
    project_id = Column(Integer, primary_key=True, index=True)
    project_name = Column(String, nullable=False)
    agent_project_name = Column(String, nullable=False)
    agent_pro_id = Column(String, nullable=False, unique=True)
    framework = Column(String, nullable=False)
    system_prompt = Column(String, nullable=False)
    agent_flow = Column(String, nullable=False)
    
    # Relationship to custom agents
    agent_custom_infos = relationship("AgentCustomInfo", back_populates="parent_project")