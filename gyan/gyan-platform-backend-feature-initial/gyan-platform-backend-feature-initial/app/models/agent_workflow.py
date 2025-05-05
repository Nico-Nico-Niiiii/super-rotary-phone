# models/models.py
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, JSON
from ..database.connection import Base
from sqlalchemy.orm import relationship
from ..models.agent_projects import AgentProjectInfo

# ... existing models ...

class AgentWorkflow(Base):
    __tablename__ = "agent_workflow"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_pro_id = Column(String, ForeignKey("agent_project.agent_pro_id"), nullable=False, unique=True)
    workflow_data = Column(JSON, nullable=True)
    
    # Relationship
    project = relationship("AgentProjectInfo", back_populates="workflow")

# Update AgentProjectInfo to include the workflow relationship
AgentProjectInfo.workflow = relationship("AgentWorkflow", back_populates="project", uselist=False)