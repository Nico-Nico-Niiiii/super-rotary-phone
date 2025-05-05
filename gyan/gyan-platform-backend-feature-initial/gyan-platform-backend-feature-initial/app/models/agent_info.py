from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text
from ..database.connection import Base
from sqlalchemy.orm import relationship

class AgentCustomInfo(Base):
    __tablename__ = "agent_custom_info"
    
    id = Column(Integer, primary_key=True, index=True)
    agent_pro_id = Column(String, ForeignKey("agent_project.agent_pro_id"), nullable=False, index=True)
    agent_project_name = Column(String, nullable=False)
    agent_name = Column(String, nullable=False)
    selected_llm = Column(String, nullable=True)
    selected_tool = Column(String, nullable=True)
    framework = Column(String, nullable=True)
    agent_type = Column(String, nullable=True)
    system_prompt = Column(Text, nullable=True)
    role = Column(String, nullable=True)
    goal = Column(Text, nullable=True)
    backstory = Column(Text, nullable=True)
    tasks = Column(Text, nullable=True) 
    task_description = Column(Text, nullable=True)
    expected_output = Column(Text, nullable=True)
    predecessor = Column(String, nullable=True) 
    successor = Column(String, nullable=True)   
    node_id = Column(String)  
    
    # Relationship to the parent project
    parent_project = relationship("AgentProjectInfo", back_populates="agent_custom_infos")

    def as_dict(self):
        """Convert model to dictionary"""
        return {
            "id": self.id,
            "agent_pro_id": self.agent_pro_id,
            "agent_project_name": self.agent_project_name,
            "agent_name": self.agent_name,
            "selected_llm": self.selected_llm,
            "selected_tool": self.selected_tool,
            "framework": self.framework,
            "agent_type": self.agent_type,
            "system_prompt": self.system_prompt,
            "role": self.role,
            "goal": self.goal,
            "backstory": self.backstory,
            "tasks": self.tasks,
            "task_description": self.task_description,
            "expected_output": self.expected_output,
            "predecessor": self.predecessor,
            "successor": self.successor,
            "node_id": self.node_id
        }