from sqlalchemy import Column, Integer, String, Float, ForeignKey, Boolean, DateTime
from sqlalchemy.sql import func
from sqlalchemy.sql.sqltypes import TIMESTAMP
from ..database.connection import Base
from datetime import datetime
from sqlalchemy.orm import relationship

class Evaluation(Base):
    __tablename__ = "evaluations"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, nullable=False)
   
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    project_name = Column(String, nullable=False)
    name = Column(String, nullable=False)
    dataset_path = Column(String, nullable=False)
    model_name = Column(String, nullable=False)
    model_type = Column(String, nullable=False)
    temperature = Column(Float, nullable=False)
    decode = Column(String, nullable=False)
    top_p = Column(Float, nullable=True)
    top_k = Column(Integer,nullable=True)
    
    
    dataset_hash = Column(String, nullable=False, index=True) 
    training_job_name = Column(String, nullable=False)
    epochs = Column(Integer) 
    batch_size = Column(Integer)  # Batch size
    learning_rate = Column(Float)  # Learning rate for training
    token_length = Column(Integer)  # Max token length for NLP tasks
    quantization = Column(String)  # Quantization method (optional)
    rank = Column(Integer)  # Rank of the task (if applicable, for example in distributed training)
    lora_optimized = Column(Boolean, default=False)  # Whether LoRA optimization is used

    # Status fields
    status = Column(String, default="Queued")  # Overall status of the task (e.g., Queued, In Progress, Completed)
    
    error= Column(String, nullable=True)
    completed_at = Column(DateTime, nullable=True)  # Timestamp for when the task was completed (nullable)
    started_on = Column(DateTime, nullable=True)  # Timestamp for when the task started (nullable)
    

    
    # Evaluation Metrics
    bertscore = Column(Float)
    bleu = Column(Float)
    chrf = Column(Float)
    perplexity = Column(Float)
    rouge = Column(Float)

    bertscore_remark = Column(String)
    bleu_remark = Column(String)
    chrf_remark = Column(String)
    perplexity_remark = Column(String)
    rouge_remark = Column(String)

    # Timestamps
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
    updated_at = Column(TIMESTAMP(timezone=True), onupdate=func.now())

    user = relationship("User", back_populates="evaluations")
    project = relationship("Project", back_populates="evaluations")
    def __repr__(self):
        return f"<TrainingJob(id='{self.id}', status='{self.status}', enqueued_at='{self.created_at}', completed_at='{self.completed_at}')>"
