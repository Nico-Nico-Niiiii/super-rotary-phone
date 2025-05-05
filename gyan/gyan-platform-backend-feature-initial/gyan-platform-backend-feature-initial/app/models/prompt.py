from sqlalchemy import Column, Integer, String, DateTime, Enum
from datetime import datetime
from ..database.connection import Base

class PromptLibraryInfo(Base):
    __tablename__ = "prompts"
    
    id = Column(Integer, primary_key=True, index=True)
    user_email = Column(String, nullable=False)
    prompt_library_name = Column(String, nullable=False)
    prompt_subsection_name = Column(String, nullable=False)
    prompt = Column(String, nullable=False)
    prompt_description = Column(String, nullable=False)
 