# models/training_log.py
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from ..database.connection import Base

class TrainingLog(Base):
    __tablename__ = "train_logs"

    id = Column(Integer, primary_key=True, index=True)
    task_id = Column(String, ForeignKey("training_jobs.task_id"))
    step = Column(Integer)
    epoch = Column(Float)
    train_loss = Column(Float)
    eval_loss = Column(Float)
    learning_rate = Column(Float)
    batch_size = Column(Integer)
    model_name = Column(String)
    project_name = Column(String)
    total_epochs = Column(Integer)
    status = Column(String)
    user_email = Column(String)
    job_name = Column(String)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())