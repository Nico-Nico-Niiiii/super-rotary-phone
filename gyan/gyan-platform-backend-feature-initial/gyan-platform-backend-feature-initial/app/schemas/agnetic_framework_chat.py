# schemas.py
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from uuid import UUID


class QueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    image_url: Optional[str] = None


class MessageBase(BaseModel):
    content: str
    sender: str
    metadata: Optional[Dict[str, Any]] = None


class MessageCreate(MessageBase):
    conversation_id: str


class MessageResponse(MessageBase):
    id: str
    created_at: datetime
    
    class Config:
        from_attributes = True


class ConversationBase(BaseModel):
    title: Optional[str] = None


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(ConversationBase):
    pass


class ConversationResponse(ConversationBase):
    id: str
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class ConversationListItem(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    title: Optional[str] = None
    preview: Optional[str] = None
    
    class Config:
        from_attributes = True


class ConversationList(BaseModel):
    conversations: List[ConversationListItem]


class ConversationDetail(BaseModel):
    conversation_id: str
    messages: List[MessageResponse]


class StreamEvent(BaseModel):
    event: str
    data: Dict[str, Any]


class StreamResponse(BaseModel):
    events: List[StreamEvent]
    is_active: bool


class ToolCallBase(BaseModel):
    tool_name: str
    input_data: Optional[Dict[str, Any]] = None


class ToolCallCreate(ToolCallBase):
    agent_run_id: str


class ToolCallUpdate(BaseModel):
    output_data: Dict[str, Any]
    completed_at: datetime


class ToolCallResponse(ToolCallBase):
    id: str
    agent_run_id: str
    output_data: Optional[Dict[str, Any]] = None
    started_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
       from_attributes = True


class AgentRunBase(BaseModel):
    conversation_id: str
    status: str = "running"


class AgentRunCreate(AgentRunBase):
    pass


class AgentRunUpdate(BaseModel):
    status: str
    completed_at: Optional[datetime] = None
    error: Optional[str] = None


class AgentRunResponse(AgentRunBase):
    id: str
    started_at: datetime
    completed_at: Optional[datetime] = None
    error: Optional[str] = None
    
    class Config:
        from_attributes = True


class QueryResponse(BaseModel):
    conversation_id: str
    message_id: str