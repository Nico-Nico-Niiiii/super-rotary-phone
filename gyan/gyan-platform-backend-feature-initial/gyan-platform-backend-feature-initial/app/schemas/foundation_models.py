from pydantic import BaseModel, ConfigDict
from typing import Optional

class FoundationModelBase(BaseModel):
    model_type: str
    model_name: str
    hf_id: str
    gyan_repo_path: str
    gyan_access_token: str
    hf_access_token: Optional[str] = "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"
    
    # Modern Pydantic v2 config
    model_config = ConfigDict(
        from_attributes=True,  # This replaces orm_mode
        protected_namespaces=()  # To avoid model_ prefix warnings
    )

class FoundationModelCreate(FoundationModelBase):
    pass  # Using pass because we want exactly the same fields as the base model

class FoundationModelResponse(FoundationModelBase):
    id: int  # Only Response needs id because it's returned from database