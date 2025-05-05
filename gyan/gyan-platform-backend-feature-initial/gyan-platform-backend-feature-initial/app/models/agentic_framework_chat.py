
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from ..database.connection import Base
from datetime import datetime
from sqlalchemy.orm import relationship


# models.py
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid



class Conversation(Base):
    __tablename__ = "conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    title = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<Conversation(id={self.id}, created_at={self.created_at})>"


class Message(Base):
    __tablename__ = "messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), index=True)
    content = Column(Text)
    sender = Column(String)  # 'user', 'ai', 'tool'
    created_at = Column(DateTime, default=datetime.now)
    metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<Message(id={self.id}, sender={self.sender}, content_preview={self.content[:20]}...)>"


class AgentRun(Base):
    __tablename__ = "agent_runs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("conversations.id"), index=True)
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    status = Column(String, default="running")  # 'running', 'completed', 'error'
    error = Column(Text, nullable=True)
    
    def __repr__(self):
        return f"<AgentRun(id={self.id}, status={self.status})>"


class ToolCall(Base):
    __tablename__ = "tool_calls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    agent_run_id = Column(UUID(as_uuid=True), ForeignKey("agent_runs.id"), index=True)
    tool_name = Column(String)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.now)
    completed_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<ToolCall(id={self.id}, tool_name={self.tool_name})>"