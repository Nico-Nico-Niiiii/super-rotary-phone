# schemas/agent_custom_info.py
from pydantic import BaseModel, Field
from typing import Optional

class AgentCustomInfoBase(BaseModel):
    agent_pro_id: str
    agent_project_name: str
    agent_name: str

    
class AgentCustomInfoCreate(AgentCustomInfoBase):
    selected_llm: Optional[str] = None
    selected_tool: Optional[str] = None
    framework: Optional[str] = None
    agent_type: Optional[str] = None
    system_prompt: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    tasks: Optional[str] = None
    task_description: Optional[str] = None
    expected_output: Optional[str] = None
    predecessor: Optional[str] = None
    successor: Optional[str] = None

class AgentCustomInfoUpdate(BaseModel):
    agent_name: Optional[str] = None
    selected_llm: Optional[str] = None
    selected_tool: Optional[str] = None
    framework: Optional[str] = None
    agent_type: Optional[str] = None
    system_prompt: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    tasks: Optional[str] = None
    task_description: Optional[str] = None
    expected_output: Optional[str] = None
    predecessor: Optional[str] = None
    successor: Optional[str] = None

class AgentCustomInfoResponse(AgentCustomInfoBase):
    id: int
    selected_llm: Optional[str] = None
    selected_tool: Optional[str] = None
    framework: Optional[str] = None
    agent_type: Optional[str] = None
    system_prompt: Optional[str] = None
    role: Optional[str] = None
    goal: Optional[str] = None
    backstory: Optional[str] = None
    tasks: Optional[str] = None
    task_description: Optional[str] = None
    expected_output: Optional[str] = None
    predecessor: Optional[str] = None
    successor: Optional[str] = None
    
    class Config:
        orm_mode = True