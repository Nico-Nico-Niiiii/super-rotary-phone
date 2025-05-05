from sqlalchemy import Column, Integer, String, Boolean
from ..database.connection import Base

class FoundationModelInfo(Base):
    __tablename__ = "foundation_models_info"
    
    id = Column(Integer, primary_key=True, index=True)
    model_type = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    hf_id = Column(String, nullable=False)
    gyan_repo_path = Column(String, nullable=True)
    hf_access_token = Column(String, default="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")
    gyan_access_token = Column(String, nullable=True)
    is_accessable = Column(Boolean, default=True)