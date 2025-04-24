from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, UploadFile, File, Form, status
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import os
import shutil
import glob
import json
from datetime import datetime

from . import schema
from . import models
from .database import get_db, engine
from .dependencies import check_openai_config, upload_file

# Import the code generation functionality
import sys
sys.path.append("..")  # Make sure parent directory is in the path
from paste import (
    process_tech_specs, 
    integrate_code_with_enhanced_relationships,
    combined_code_generation_and_integration,
    read_tech_specs_from_excel
)

# Create the tables if they don't exist
models.Base.metadata.create_all(bind=engine)

# Create router
router = APIRouter(tags=["Code Generation"])

@router.get("/health", response_model=schema.StatusResponse)
def health_check():
    """Health check endpoint"""
    return {"status": "ok", "message": "Service is running"}

@router.post("/upload-excel", response_model=schema.UploadExcelResponse)
async def upload_excel_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Upload Excel file with technical specifications"""
    # Save the uploaded file
    file_location = f"uploads/{file.filename}"
    os.makedirs("uploads", exist_ok=True)
    
    # Ensure the file is saved
    with open(file_location, "wb") as f:
        shutil.copyfileobj(file.file, f)
    
    # Process the Excel file to extract tech specs (without code generation)
    try:
        tech_specs = read_tech_specs_from_excel(file_location)
        
        # Store technical specifications in the database
        for spec in tech_specs:
            db_spec = models.TechnicalSpecification(
                user_story_id=spec["user_story_id"],
                tech_spec=spec["tech_spec"]
            )
            db.add(db_spec)
        db.commit()
        
        return {
            "message": f"Successfully uploaded and processed Excel file: {file.filename}",
            "code_generation_dir": file_location,
            "specs_processed": len(tech_specs)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing Excel file: {str(e)}"
        )

@router.post("/generate-code", response_model=schema.CodeGenerationResponse)
def generate_code(
    request: schema.CodeGenerationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Generate code from technical specifications in Excel file"""
    # Check if OpenAI config is properly set
    try:
        check_openai_config()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Azure OpenAI configuration error: {str(e)}"
        )
    
    # Check if file exists
    if not os.path.exists(request.excel_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Excel file not found: {request.excel_file_path}"
        )
    
    # Process tech specs and generate code (in the background)
    def process_and_save():
        try:
            code_generation_dir = process_tech_specs(request.excel_file_path)
            
            # Read the generated code and store in database
            if code_generation_dir:
                user_story_folders = [f for f in os.listdir(code_generation_dir) 
                                    if os.path.isdir(os.path.join(code_generation_dir, f))]
                
                for user_folder in user_story_folders:
                    user_path = os.path.join(code_generation_dir, user_folder)
                    
                    # Priority order for folder names
                    priority_folders = ["final_corrected", "final_validated", "correction", "validated_pass", "initial"]
                    
                    for priority in priority_folders:
                        attempt_path = os.path.join(user_path, f"attempt_{priority}")
                        code_file = os.path.join(attempt_path, "code.py")
                        
                        if os.path.exists(code_file):
                            with open(code_file, 'r') as f:
                                code_content = f.read()
                            
                            # Find the corresponding tech spec in the database
                            tech_spec = db.query(models.TechnicalSpecification).filter(
                                models.TechnicalSpecification.user_story_id == user_folder).first()
                            
                            if tech_spec:
                                # Create a new record for the generated code
                                db_code = models.GeneratedCode(
                                    tech_spec_id=tech_spec.id,
                                    user_story_id=user_folder,
                                    code_content=code_content,
                                    status=priority,
                                    is_validated=priority in ["final_validated", "validated_pass"],
                                    is_corrected=priority in ["final_corrected", "correction"]
                                )
                                db.add(db_code)
                            break
                
                db.commit()
            
            return code_generation_dir
        except Exception as e:
            db.rollback()
            raise e
    
    # Start the background task
    background_tasks.add_task(process_and_save)
    
    # First, check how many specs are in the file before starting the task
    try:
        tech_specs = read_tech_specs_from_excel(request.excel_file_path)
        specs_count = len(tech_specs)
    except Exception as e:
        specs_count = 0
    
    return {
        "message": "Code generation started in the background. Check /status endpoint for updates.",
        "code_generation_dir": f"code_generation_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "specs_processed": specs_count
    }

@router.post("/integrate-code", response_model=schema.IntegrationResponse)
def integrate_code(
    request: schema.IntegrationRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Integrate generated code with relationship enhancement"""
    # Check if OpenAI config is properly set
    try:
        check_openai_config()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Azure OpenAI configuration error: {str(e)}"
        )
    
    # If a specific folder is provided, check if it exists
    if request.code_generation_folder and not os.path.exists(request.code_generation_folder):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Code generation folder not found: {request.code_generation_folder}"
        )
    
    # Check if any code generation folders exist if not specified
    if not request.code_generation_folder:
        code_gen_folders = [d for d in os.listdir(".") if d.startswith("code_generation_") and os.path.isdir(d)]
        if not code_gen_folders:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No code generation folders found. Generate code first."
            )
    
    # Integrate code (in the background)
    def integrate_and_save():
        try:
            integrated_dir = integrate_code_with_enhanced_relationships(request.code_generation_folder)
            
            if integrated_dir:
                # Read the integrated solution and store in database
                integrated_file = os.path.join(integrated_dir, "integrated_solution.py")
                readme_file = os.path.join(integrated_dir, "README.md")
                relationships_file = os.path.join(integrated_dir, "RELATIONSHIPS.md")
                
                integrated_code = ""
                readme_content = ""
                relationships_doc = ""
                
                if os.path.exists(integrated_file):
                    with open(integrated_file, 'r') as f:
                        integrated_code = f.read()
                
                if os.path.exists(readme_file):
                    with open(readme_file, 'r') as f:
                        readme_content = f.read()
                
                if os.path.exists(relationships_file):
                    with open(relationships_file, 'r') as f:
                        relationships_doc = f.read()
                
                # Create a new record for the integrated solution
                db_solution = models.IntegratedSolution(
                    solution_name=os.path.basename(integrated_dir),
                    integrated_code=integrated_code,
                    readme_content=readme_content,
                    relationships_doc=relationships_doc,
                    source_folder=request.code_generation_folder or "latest"
                )
                db.add(db_solution)
                db.commit()
            
            return integrated_dir
        except Exception as e:
            db.rollback()
            raise e
    
    # Start the background task
    background_tasks.add_task(integrate_and_save)
    
    return {
        "message": "Code integration started in the background. Check /status endpoint for updates.",
        "integrated_solution_dir": f"integrated_solution_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    }

@router.post("/combined-workflow", response_model=schema.CombinedWorkflowResponse)
def combined_workflow(
    request: schema.CombinedWorkflowRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Run the combined workflow (code generation + integration)"""
    # Check if OpenAI config is properly set
    try:
        check_openai_config()
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Azure OpenAI configuration error: {str(e)}"
        )
    
    # Check if file exists
    if not os.path.exists(request.excel_file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Excel file not found: {request.excel_file_path}"
        )
    
    # Run the combined workflow (in the background)
    def process_combined_workflow():
        try:
            code_gen_dir, integrated_dir = combined_code_generation_and_integration(request.excel_file_path)
            
            # Store results in the database (both code generation and integration)
            if code_gen_dir:
                # First, save the tech specs
                tech_specs = read_tech_specs_from_excel(request.excel_file_path)
                tech_spec_ids = {}
                
                for spec in tech_specs:
                    db_spec = models.TechnicalSpecification(
                        user_story_id=spec["user_story_id"],
                        tech_spec=spec["tech_spec"]
                    )
                    db.add(db_spec)
                    db.flush()  # Flush to get the ID
                    tech_spec_ids[spec["user_story_id"]] = db_spec.id
                
                # Next, save the generated code
                user_story_folders = [f for f in os.listdir(code_gen_dir) 
                                    if os.path.isdir(os.path.join(code_gen_dir, f))]
                
                for user_folder in user_story_folders:
                    user_path = os.path.join(code_gen_dir, user_folder)
                    
                    # Priority order for folder names
                    priority_folders = ["final_corrected", "final_validated", "correction", "validated_pass", "initial"]
                    
                    for priority in priority_folders:
                        attempt_path = os.path.join(user_path, f"attempt_{priority}")
                        code_file = os.path.join(attempt_path, "code.py")
                        
                        if os.path.exists(code_file):
                            with open(code_file, 'r') as f:
                                code_content = f.read()
                            
                            # Get the tech spec ID
                            tech_spec_id = tech_spec_ids.get(user_folder)
                            
                            if tech_spec_id:
                                # Create a new record for the generated code
                                db_code = models.GeneratedCode(
                                    tech_spec_id=tech_spec_id,
                                    user_story_id=user_folder,
                                    code_content=code_content,
                                    status=priority,
                                    is_validated=priority in ["final_validated", "validated_pass"],
                                    is_corrected=priority in ["final_corrected", "correction"]
                                )
                                db.add(db_code)
                            break
            
            # Finally, save the integrated solution
            if integrated_dir:
                integrated_file = os.path.join(integrated_dir, "integrated_solution.py")
                readme_file = os.path.join(integrated_dir, "README.md")
                relationships_file = os.path.join(integrated_dir, "RELATIONSHIPS.md")
                
                integrated_code = ""
                readme_content = ""
                relationships_doc = ""
                
                if os.path.exists(integrated_file):
                    with open(integrated_file, 'r') as f:
                        integrated_code = f.read()
                
                if os.path.exists(readme_file):
                    with open(readme_file, 'r') as f:
                        readme_content = f.read()
                
                if os.path.exists(relationships_file):
                    with open(relationships_file, 'r') as f:
                        relationships_doc = f.read()
                
                # Create a new record for the integrated solution
                db_solution = models.IntegratedSolution(
                    solution_name=os.path.basename(integrated_dir),
                    integrated_code=integrated_code,
                    readme_content=readme_content,
                    relationships_doc=relationships_doc,
                    source_folder=code_gen_dir
                )
                db.add(db_solution)
            
            db.commit()
            return code_gen_dir, integrated_dir
        
        except Exception as e:
            db.rollback()
            raise e
    
    # Start the background task
    background_tasks.add_task(process_combined_workflow)
    
    return {
        "message": "Combined workflow started in the background. Check /status endpoint for updates.",
        "code_generation_dir": f"code_generation_{datetime.now().strftime('%Y%m%d_%H%M%S')}",
        "integrated_solution_dir": f"integrated_solution_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
    }

@router.get("/tech-specs", response_model=List[schema.TechSpec])
def get_all_tech_specs(db: Session = Depends(get_db)):
    """Get all technical specifications"""
    return db.query(models.TechnicalSpecification).all()

@router.get("/tech-specs/{spec_id}", response_model=schema.TechSpec)
def get_tech_spec(spec_id: int, db: Session = Depends(get_db)):
    """Get a specific technical specification by ID"""
    spec = db.query(models.TechnicalSpecification).filter(models.TechnicalSpecification.id == spec_id).first()
    if not spec:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Technical specification with ID {spec_id} not found"
        )
    return spec

@router.get("/generated-code", response_model=List[schema.GeneratedCode])
def get_all_generated_code(db: Session = Depends(get_db)):
    """Get all generated code"""
    return db.query(models.GeneratedCode).all()

@router.get("/generated-code/{code_id}", response_model=schema.GeneratedCode)
def get_generated_code(code_id: int, db: Session = Depends(get_db)):
    """Get a specific generated code by ID"""
    code = db.query(models.GeneratedCode).filter(models.GeneratedCode.id == code_id).first()
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated code with ID {code_id} not found"
        )
    return code

@router.get("/generated-code/by-user-story/{user_story_id}", response_model=List[schema.GeneratedCode])
def get_generated_code_by_user_story(user_story_id: str, db: Session = Depends(get_db)):
    """Get all generated code for a specific user story ID"""
    return db.query(models.GeneratedCode).filter(models.GeneratedCode.user_story_id == user_story_id).all()

@router.get("/integrated-solutions", response_model=List[schema.IntegratedSolution])
def get_all_integrated_solutions(db: Session = Depends(get_db)):
    """Get all integrated solutions"""
    return db.query(models.IntegratedSolution).all()

@router.get("/integrated-solutions/{solution_id}", response_model=schema.IntegratedSolution)
def get_integrated_solution(solution_id: int, db: Session = Depends(get_db)):
    """Get a specific integrated solution by ID"""
    solution = db.query(models.IntegratedSolution).filter(models.IntegratedSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integrated solution with ID {solution_id} not found"
        )
    return solution

@router.get("/download-code/{code_id}")
def download_generated_code(code_id: int, db: Session = Depends(get_db)):
    """Download a specific generated code as a Python file"""
    code = db.query(models.GeneratedCode).filter(models.GeneratedCode.id == code_id).first()
    if not code:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Generated code with ID {code_id} not found"
        )
    
    # Create a temporary file
    file_path = f"temp_{code.user_story_id}.py"
    with open(file_path, "w") as f:
        f.write(code.code_content)
    
    return FileResponse(
        path=file_path,
        filename=f"{code.user_story_id}_code.py",
        media_type="application/octet-stream"
    )

@router.get("/download-solution/{solution_id}")
def download_integrated_solution(solution_id: int, db: Session = Depends(get_db)):
    """Download a specific integrated solution as a Python file"""
    solution = db.query(models.IntegratedSolution).filter(models.IntegratedSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integrated solution with ID {solution_id} not found"
        )
    
    # Create a temporary file
    file_path = f"temp_integrated_solution.py"
    with open(file_path, "w") as f:
        f.write(solution.integrated_code)
    
    return FileResponse(
        path=file_path,
        filename="integrated_solution.py",
        media_type="application/octet-stream"
    )

@router.get("/relationship-docs/{solution_id}")
def get_relationship_docs(solution_id: int, db: Session = Depends(get_db)):
    """Get the relationship documentation for a specific integrated solution"""
    solution = db.query(models.IntegratedSolution).filter(models.IntegratedSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integrated solution with ID {solution_id} not found"
        )
    
    if not solution.relationships_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No relationship documentation found for solution ID {solution_id}"
        )
    
    return {"relationships_doc": solution.relationships_doc}

@router.get("/validation-results/{user_story_id}")
def get_validation_results(user_story_id: str):
    """Get validation results for a specific user story ID"""
    # Find the latest code generation folder
    code_gen_folders = [d for d in os.listdir(".") if d.startswith("code_generation_") and os.path.isdir(d)]
    if not code_gen_folders:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No code generation folders found"
        )
    
    # Sort by creation time, most recent first
    code_gen_folders.sort(key=lambda d: os.path.getctime(d), reverse=True)
    latest_folder = code_gen_folders[0]
    
    # Look for validation results
    validation_file = os.path.join(latest_folder, user_story_id, "validation_results.json")
    if not os.path.exists(validation_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No validation results found for user story ID {user_story_id}"
        )
    
    try:
        result = schema.ValidationResult.from_json_file(validation_file)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading validation results: {str(e)}"
        )

@router.get("/module-docs/{solution_id}/{module_name}")
def get_module_docs(solution_id: int, module_name: str, db: Session = Depends(get_db)):
    """Get enhanced API documentation for a specific module in an integrated solution"""
    solution = db.query(models.IntegratedSolution).filter(models.IntegratedSolution.id == solution_id).first()
    if not solution:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Integrated solution with ID {solution_id} not found"
        )
    
    # Try to find the module docs file
    solution_folder = solution.source_folder
    if solution_folder == "latest":
        # Find the latest integrated solution folder
        int_solution_folders = [d for d in os.listdir(".") if d.startswith("integrated_solution_") and os.path.isdir(d)]
        if not int_solution_folders:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No integrated solution folders found"
            )
        
        # Sort by creation time, most recent first
        int_solution_folders.sort(key=lambda d: os.path.getctime(d), reverse=True)
        solution_folder = int_solution_folders[0]
    
    api_docs_file = os.path.join(solution_folder, "enhanced_api_documentation.json")
    if not os.path.exists(api_docs_file):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No API documentation found for solution ID {solution_id}"
        )
    
    try:
        with open(api_docs_file, "r") as f:
            api_docs = json.load(f)
        
        if module_name not in api_docs:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Module {module_name} not found in API documentation"
            )
        
        return api_docs[module_name]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading API documentation: {str(e)}"
        )