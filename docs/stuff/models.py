from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime

Base = declarative_base()

class TechnicalSpecification(Base):
    """Database model for technical specifications"""
    __tablename__ = "technical_specifications"
    
    id = Column(Integer, primary_key=True, index=True)
    user_story_id = Column(String(50), index=True)
    tech_spec = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.now)
    updated_at = Column(DateTime, default=datetime.now, onupdate=datetime.now)
    
    # Relationship to generated code
    generated_code = relationship("GeneratedCode", back_populates="tech_spec", cascade="all, delete-orphan")

class GeneratedCode(Base):
    """Database model for generated code"""
    __tablename__ = "generated_code"
    
    id = Column(Integer, primary_key=True, index=True)
    tech_spec_id = Column(Integer, ForeignKey("technical_specifications.id"))
    user_story_id = Column(String(50), index=True)
    code_content = Column(Text, nullable=False)
    is_validated = Column(Boolean, default=False)
    is_corrected = Column(Boolean, default=False)
    status = Column(String(50), default="initial")  # initial, validated_pass, validated_fail, correction, final
    created_at = Column(DateTime, default=datetime.now)
    
    # Relationship to tech spec
    tech_spec = relationship("TechnicalSpecification", back_populates="generated_code")

class IntegratedSolution(Base):
    """Database model for integrated solutions"""
    __tablename__ = "integrated_solutions"
    
    id = Column(Integer, primary_key=True, index=True)
    solution_name = Column(String(255), index=True)
    integrated_code = Column(Text, nullable=False)
    readme_content = Column(Text, nullable=True)
    relationships_doc = Column(Text, nullable=True)
    generation_timestamp = Column(DateTime, default=datetime.now)
    source_folder = Column(String(255), nullable=False)