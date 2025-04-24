from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Any
from datetime import datetime
import json

class TechSpecBase(BaseModel):
    user_story_id: str
    tech_spec: str

class TechSpecCreate(TechSpecBase):
    pass

class TechSpec(TechSpecBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class GeneratedCodeBase(BaseModel):
    user_story_id: str
    code_content: str
    status: str = "initial"
    is_validated: bool = False
    is_corrected: bool = False

class GeneratedCodeCreate(GeneratedCodeBase):
    tech_spec_id: int

class GeneratedCode(GeneratedCodeBase):
    id: int
    tech_spec_id: int
    created_at: datetime
    
    class Config:
        from_attributes = True

class IntegratedSolutionBase(BaseModel):
    solution_name: str
    integrated_code: str
    readme_content: Optional[str] = None
    relationships_doc: Optional[str] = None
    source_folder: str

class IntegratedSolutionCreate(IntegratedSolutionBase):
    pass

class IntegratedSolution(IntegratedSolutionBase):
    id: int
    generation_timestamp: datetime
    
    class Config:
        from_attributes = True

# Special schemas for API operations

class UploadExcelRequest(BaseModel):
    file_location: str = Field(..., description="Path to the Excel file with technical specifications")

class UploadExcelResponse(BaseModel):
    message: str
    code_generation_dir: str
    specs_processed: int

class CodeGenerationRequest(BaseModel):
    excel_file_path: str = Field(..., description="Path to the Excel file with technical specifications")

class CodeGenerationResponse(BaseModel):
    message: str
    code_generation_dir: str
    specs_processed: int

class IntegrationRequest(BaseModel):
    code_generation_folder: Optional[str] = Field(None, description="Path to the folder containing generated code (if None, uses the latest folder)")

class IntegrationResponse(BaseModel):
    message: str
    integrated_solution_dir: str

class CombinedWorkflowRequest(BaseModel):
    excel_file_path: str = Field(..., description="Path to the Excel file with technical specifications")

class CombinedWorkflowResponse(BaseModel):
    message: str
    code_generation_dir: str
    integrated_solution_dir: str

class ModuleDocResponse(BaseModel):
    name: str
    docstring: str
    imports: List[Dict[str, Any]]
    global_vars: List[Dict[str, Any]]
    functions: List[Dict[str, Any]]
    classes: List[Dict[str, Any]]
    relationships: Dict[str, Any]

class ValidationResult(BaseModel):
    validation_report: Dict[str, Any]
    
    @classmethod
    def from_json_file(cls, file_path: str):
        with open(file_path, "r") as f:
            data = json.load(f)
        return cls(validation_report=data.get("validation_report", {}))

class StatusResponse(BaseModel):
    status: str
    message: str
    timestamp: datetime = Field(default_factory=datetime.now)