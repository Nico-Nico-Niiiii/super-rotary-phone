# from pydantic import BaseModel
# from datetime import datetime
# from typing import List, Optional
# from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Form

# class RAGFileBase(BaseModel):
#     file_name: str
#     file_extension: str
#     file_path: str
#     file_size: float

# class RAGFileCreate(RAGFileBase):
#     file_content: str

# class RAGFile(RAGFileBase):
#     id: int
#     rag_database_id: int
#     created_at: datetime

#     class Config:
#         from_attributes = True

# class RAGDatabaseBase(BaseModel):
#     name: str
#     rag_type: str
#     llm_model: str
#     embedding_model: str
#     chunking_option: str
#     vector_db: str
#     search_option: str

# class RAGDatabaseCreate(RAGDatabaseBase):
#     pass

# class RAGDatabase(RAGDatabaseBase):
#     id: int
#     dataset_path: str
#     zip_file_path: str
#     total_files: int
#     status: str
#     created_at: datetime
#     updated_at: Optional[datetime] = None
#     files: List[RAGFile] = []

#     class Config:
#         from_attributes = True


# class RAGDatabaseCreate(BaseModel):
#     name: str
#     dataset: UploadFile
#     rag_type: str
#     llm_model: str
#     embedding_model: str
#     chunking_option: str
#     vector_db: str
#     search_option: str


# class RAGDatabaseCreateRequest(BaseModel):
#     name: str
#     rag_type: str
#     llm_model: str
#     embedding_model: str
#     chunking_option: str
#     vector_db: str
#     search_option: str

#     class Config:
#         from_attributes = True


from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import List, Optional
from fastapi import UploadFile

class RAGFileBase(BaseModel):
    file_name: str
    file_extension: str
    file_path: str
    file_size: float
    file_content: Optional[str] = ""

    class Config:
        from_attributes = True

class RAGFile(RAGFileBase):
    id: int
    rag_database_id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RAGDatabaseBase(BaseModel):
    name: str
    rag_type: str
    llm_model: str
    embedding_model: str
    chunking_option: str
    vector_db: str
    search_option: str

    class Config:
        from_attributes = True

class RAGDatabase(RAGDatabaseBase):
    id: int
    dataset_path: str
    zip_file_path: str
    total_files: int
    status: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    files: List[RAGFile] = []

    class Config:
        from_attributes = True