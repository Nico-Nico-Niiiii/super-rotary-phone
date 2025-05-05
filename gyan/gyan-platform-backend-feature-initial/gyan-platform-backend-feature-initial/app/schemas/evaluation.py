from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime

class EvaluationBase(BaseModel):
    email: str
    user_id: str
    project_id: str
    project_name: str
    name: str
    dataset_path: str
    dataset_hash: str
    model_name: str
    model_type: str
    temperature: float = Field(..., ge=0.0, le=1.0)
    decode: str
    top_k: Optional[int] = None  # Made optional to match model (nullable=True)
    top_p: Optional[float] = None 
    dataset_hash: str
    training_job_name: str
    epochs: int = Field(..., gt=0)
    batch_size: int = Field(..., gt=0)
    learning_rate: float = Field(..., gt=0.0)
    token_length: int = Field(..., gt=0)
    quantization: str
    rank: int
    lora_optimized: bool = False

    status: str = Field("Queued")
   
  
    completed_at: Optional[datetime] = None
    started_on: Optional[datetime] = None
    error: Optional[str] = None

class EvaluationCreate(EvaluationBase):
    pass

class EvaluationUpdate(BaseModel):
    bertscore: Optional[float] = Field(None, ge=0.0, le=1.0)
    bleu: Optional[float] = Field(None, ge=0.0, le=1.0)
    chrf: Optional[float] = Field(None, ge=0.0, le=1.0)
    perplexity: Optional[float] = None
    rouge: Optional[float] = Field(None, ge=0.0, le=1.0)

    bertscore_remark: Optional[str] = None
    bleu_remark: Optional[str] = None
    chrf_remark: Optional[str] = None
    perplexity_remark: Optional[str] = None
    rouge_remark: Optional[str] = None

class EvaluationCompare(BaseModel):
    same_dataset: bool
    metrics_comparison: dict

class EvaluationInDB(EvaluationBase):
    id: int
    bertscore: Optional[float] = None
    bleu: Optional[float] = None
    chrf: Optional[float] = None
    perplexity: Optional[float] = None
    rouge: Optional[float] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    bertscore_remark: Optional[str] = None
    bleu_remark: Optional[str] = None
    chrf_remark: Optional[str] = None
    perplexity_remark: Optional[str] = None
    rouge_remark: Optional[str] = None

    class Config:
        orm_mode = True

class EvaluationResponse(EvaluationInDB):
    pass

class JobRequest(BaseModel):
    project_name: str
    project_id: int