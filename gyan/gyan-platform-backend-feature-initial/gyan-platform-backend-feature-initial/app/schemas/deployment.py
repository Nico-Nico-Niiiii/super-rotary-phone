from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime


# Pydantic models
class NamespaceRequest(BaseModel):
    namespace: str

class ServiceInfo(BaseModel):
    pod_name: str
    endpoint: str
    host_url: str
    namespace: str
    status: str

class DeletePodRequest(BaseModel):
    pod_name: str
    namespace: Optional[str] = 'default'

class DeleteResponse(BaseModel):
    message: str