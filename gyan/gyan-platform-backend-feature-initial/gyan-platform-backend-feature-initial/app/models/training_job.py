from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from ..database.connection import Base
from datetime import datetime

class TrainingJob(Base):
    __tablename__ = 'training_jobs'

    # Primary key (auto-incremented integer ID)
    id = Column(String, primary_key=True, index=True)

    # Unique task identifier (e.g., job name or UUID)
    task_id = Column(String, unique=True, index=True)  # Unique task ID

    # Task details
    name = Column(String)  # Name of the task
    dataset_path = Column(String)  # Path to the dataset
    epochs = Column(Integer)  # Number of epochs for training
    batch_size = Column(Integer)  # Batch size
    learning_rate = Column(Float)  # Learning rate for training
    token_length = Column(Integer)  # Max token length for NLP tasks
    quantization = Column(String)  # Quantization method (optional)
    rank = Column(Integer)  # Rank of the task (if applicable, for example in distributed training)
    lora_optimized = Column(Boolean, default=False)  # Whether LoRA optimization is used
    # eval_steps = Column(Integer)
    # Status fields
    status = Column(String, default="Queued")  # Overall status of the task (e.g., Queued, In Progress, Completed)
    queue_status = Column(String, default="Queued")  # Status of the task in the queue (e.g., Queued, Dequeued, Processing, etc.)

    # Timestamps
    enqueued_at = Column(DateTime, default=datetime.utcnow)  # Timestamp for when the task was added to the queue
    dequeued_at = Column(DateTime, nullable=True)  # Timestamp for when the task was dequeued for processing (nullable)
    completed_at = Column(DateTime, nullable=True)  # Timestamp for when the task was completed (nullable)
    started_on = Column(DateTime, nullable=True)  # Timestamp for when the task started (nullable)
    

    # Error message (optional)
    error = Column(String, nullable=True) 

    # Relationships (Foreign Keys)
    project_id = Column(Integer, ForeignKey('projects.id'))  # Link to a project (assuming a 'projects' table exists)
    user_id = Column(Integer, ForeignKey('users.id'))  # Link to a user (assuming a 'users' table exists)
    user_email = Column(String)
    project_name = Column(String)
    model_type = Column(String)
    model_name = Column(String)
    hf_id = Column(String)
    # Relationships to other tables
    project = relationship("Project", back_populates="training_jobs")  # Backref to project
    user = relationship("User", back_populates="training_jobs")  # Backref to user

    # String representation for easier debugging and logging
    def __repr__(self):
        return f"<TrainingJob(task_id='{self.task_id}', status='{self.status}', enqueued_at='{self.enqueued_at}', completed_at='{self.completed_at}')>"
