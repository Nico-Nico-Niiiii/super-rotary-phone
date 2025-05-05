# schemas/agent_project.py
from pydantic import BaseModel, Field
from typing import Optional, List

class AgentProjectBase(BaseModel):
    project_name: str
    agent_project_name: str
    framework: str
    system_prompt: str
    agent_flow: str

class AgentProjectCreate(AgentProjectBase):
    agent_pro_id: str

class AgentProjectUpdate(BaseModel):
    project_name: Optional[str] = None
    agent_project_name: Optional[str] = None
    framework: Optional[str] = None
    system_prompt: Optional[str] = None
    agent_flow: Optional[str] = None

class AgentProjectResponse(AgentProjectBase):
    project_id: int
    agent_pro_id: str
    
    class Config:
        orm_mode = True