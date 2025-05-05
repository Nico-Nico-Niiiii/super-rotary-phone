from sqlalchemy import Column, Integer, String, Boolean
from ..database.connection import Base

class GuardInfo(Base):
    __tablename__ = "guard_info"
    
    id = Column(Integer, primary_key=True, index=True)
    counter = Column(Integer, default=0)
    prompt = Column(String, nullable=False)
    answer_category = Column(String, nullable=False)
    user_email = Column(String, nullable=False)
 