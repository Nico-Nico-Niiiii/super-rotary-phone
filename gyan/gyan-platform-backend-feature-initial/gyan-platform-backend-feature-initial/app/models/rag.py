# from sqlalchemy import Column, Integer, String, ForeignKey, Text, Boolean, Float, DateTime
# from sqlalchemy.orm import relationship
# from sqlalchemy.sql import func
# from ..database.connection import Base
# from typing import Optional

# class RAGDatabase(Base):
#     __tablename__ = "rag_databases"

#     id = Column(Integer, primary_key=True, autoincrement=True, index=True)  # Add autoincrement
#     name = Column(String(100), unique=True, index=True)
#     dataset_path = Column(String(500))
#     zip_file_path = Column(String(500))
#     rag_type = Column(String(50))
#     llm_model = Column(String(100))
#     embedding_model = Column(String(100))
#     chunking_option = Column(String(50))
#     vector_db = Column(String(50))
#     search_option = Column(String(50))
#     total_files = Column(Integer)
#     status = Column(String(50), default="Created")
#     created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
#     updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

#     # Relationship to RAGFile
#     files = relationship("RAGFile", back_populates="rag_database", cascade="all, delete-orphan")

# class RAGFile(Base):
#     __tablename__ = "rag_files"

#     id = Column(Integer, primary_key=True, index=True)
#     rag_database_id = Column(Integer, ForeignKey("rag_databases.id"))
#     file_name = Column(String(255))
#     file_extension = Column(String(20))
#     file_path = Column(String(500))
#     file_content = Column(Text, nullable=True)  # Fix this line
#     file_size = Column(Float)
#     created_at = Column(DateTime(timezone=True), server_default=func.now())

#     rag_database = relationship("RAGDatabase", back_populates="files")



# models/rag.py
from sqlalchemy import Column, Integer, String, ForeignKey, Text, Float, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from ..database.connection import Base

class RAGDatabase(Base):
    __tablename__ = "rag_databases"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    name = Column(String(100), unique=True, index=True)
    dataset_path = Column(String(500))
    zip_file_path = Column(String(500))
    rag_type = Column(String(50))
    llm_model = Column(String(100))
    embedding_model = Column(String(100))
    chunking_option = Column(String(50))
    vector_db = Column(String(50))
    search_option = Column(String(50))
    total_files = Column(Integer)
    status = Column(String(50), default="Created")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), nullable=True)

    files = relationship("RAGFile", back_populates="rag_database", cascade="all, delete-orphan")

class RAGFile(Base):
    __tablename__ = "rag_files"

    id = Column(Integer, primary_key=True, autoincrement=True, index=True)
    rag_database_id = Column(Integer, ForeignKey("rag_databases.id"))
    file_name = Column(String(255))
    file_extension = Column(String(20))
    file_path = Column(String(500))
    file_content = Column(Text, nullable=True)
    file_size = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    rag_database = relationship("RAGDatabase", back_populates="files")