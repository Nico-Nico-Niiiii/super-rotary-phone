from sqlalchemy import Column, Integer, String, Boolean
from ..database.connection import Base
from sqlalchemy.orm import relationship

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    is_active = Column(Boolean, default=True)

    username = Column(String, nullable=True)
    first_name = Column(String, nullable=True)
    last_name = Column(String, nullable=True)
    gyanhub_token = Column(String, nullable=True)

     # Newly Added Fields
    role = Column(String, nullable=False, default='User')
    gender = Column(String, nullable=False, default='Not Specified')
    phone = Column(String, nullable=False, default='Not Set')
    linkedin = Column(String, nullable=False, default='Not Set')

    projects = relationship("Project", 
                          back_populates="user",
                          foreign_keys="[Project.user_id]")
    training_jobs = relationship("TrainingJob", back_populates="user")
    evaluations = relationship("Evaluation", back_populates="user")