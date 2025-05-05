from sqlalchemy import Column, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database.connection import Base

class Execution(Base):
    __tablename__ = "executions"

    id = Column(String, primary_key=True, index=True)  # Execution ID (UUID)
    agent_pro_id = Column(String, index=True)  # Agent's workflow ID
    timestamp = Column(DateTime, default=datetime.utcnow)  # Execution start time
    status = Column(String, default="running")  # Status: running, completed, failed

    messages = relationship("Message", back_populates="execution", cascade="all, delete-orphan")


class Message(Base):
    __tablename__ = "messages"

    id = Column(String, primary_key=True, index=True)  # Message ID (UUID)
    execution_id = Column(String, ForeignKey("executions.id"), index=True)  # Link to execution
    sender = Column(String)  # "user" or "agent"
    content = Column(Text)  # Message text
    timestamp = Column(DateTime, default=datetime.utcnow)  # Message time

    execution = relationship("Execution", back_populates="messages")



