from fastapi import APIRouter, Depends, HTTPException, File, Form, UploadFile, status
from sqlalchemy.orm import Session
from app.database.connection import get_db
from app.database.crud import DBOperations
from app.core.security import get_current_user
from typing import List
from app.core.utils import get_route, get_prefix, load_endpoints
import pandas as pd
import json
from app.evaluation.llm.eval_manager import GyanLlama2Infer
from app.schemas.evaluation import JobRequest

ENDPOINTS = load_endpoints()
router = APIRouter(prefix=ENDPOINTS["evaluation"]["prefix"], tags=["evaluation"])



model_selector = {
    "Gyan/Llama3-8B" : GyanLlama2Infer,
    "Gyan/OPT-350M" : GyanLlama2Infer
}




@router.get(ENDPOINTS["evaluation"]["routes"]["count"])
async def get_evaluation_count(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    count =  DBOperations.get_evaluation_count(db,current_user["email"])
    return {"count" : count}


@router.get("/recent-activities")
async def get_recent_activities(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    activities = DBOperations.get_recent_activities(db, current_user["email"])
    return {"activities": activities or []}


@router.get(ENDPOINTS["evaluation"]["routes"]["model_types"])
async def get_model_types(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return {"model_types": DBOperations.get_model_types(db, current_user["id"])}

@router.get(ENDPOINTS["evaluation"]["routes"]["projects"])
async def get_projects(
    project_name: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return {"projects": DBOperations.get_projects(db, project_name)}


@router.get(ENDPOINTS["evaluation"]["routes"]["get-job"])
async def get_jobs(
    job_request: JobRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    print("Project name and p[roject id]", job_request.project_name)
    return {"projects": DBOperations.get_jobs(db, job_request.project_name, job_request.project_id, current_user["email"])}

@router.get(ENDPOINTS["evaluation"]["routes"]["models"])
async def get_models(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return {"models": DBOperations.get_models(db, current_user["id"])}

@router.post(ENDPOINTS["evaluation"]["routes"]["evaluate"])
async def create_evaluation(
    file: UploadFile = File(...),
    data: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        data = json.loads(data)
        print(data)
        user_email=current_user["email"]
        dataset_path = None
        dataset_hash = None
        if file:
            file_location = f"eval_uploads/{user_email}_{file.filename}"
            try:
                file_content = await file.read()
                with open(file_location, "wb") as buffer:
                    buffer.write(file_content)
                print(f"File eval saved to {file_location}")
                dataset_path = file_location
                dataset_hash = DBOperations.generate_dataset_hash(file_content)
                # data_file = pd.read_csv(file_location)
                file_name = file.filename  # File name
                file_type = file.content_type  # File type (MIME type)

                # Save these details for future computations
                file_metadata = {
                    'file_name': file_name,
                    'file_path': dataset_path,
                    'file_type': file_type
                }

                # Example: You could store file_metadata in a database or pass it to a computation function
                print(f"File metadata: {file_metadata}")
            except Exception as e:
                print(f"Error saving file: {e}")
                raise HTTPException(status_code=500, detail="File upload failed")
        file_obj = file

        try:
            print("))))))))))))))))))))))))))")
            print("Data model",data["model_name"])
            # model_class = model_selector[data["model_name"]]
            # print("model_class",model_class)
            infer_instance = GyanLlama2Infer(data["model_type"], data["model_name"], data["project_name"], user_email, data["training_job_name"])
        except Exception as e:
            print("Error", str(e))
            return {'error': f'Error : {str(e)}'}, 500
            
        except RuntimeError as e:
            if 'CUDA out of memory' in str(e):
                print("Error Loading Model! CUDA Out of Memory.")
                return {"error": "Error Loading Model! CUDA Out of Memory."}, 500
            raise HTTPException(status_code=500, detail=f"Failed to load model: {str(e)}")
        
        try:
            # data_file = pd.read_csv(file)

            # insert data in db
            evaluation_data = {
            "name": data["name"],
            "project_id": data["project_id"],
            "user_id": current_user["id"],
            "email": current_user["email"],
            "model_type": data["model_type"],
            "model_name": data["model_name"],
            "dataset_path": dataset_path,
            "dataset_hash": dataset_hash,
            "training_job_name": data["training_job_name"],
            "epochs": data["epochs"],
            "batch_size": data["batch_size"],
            "learning_rate": data["learning_rate"],# @router.get(ENDPOINTS["evaluation"]["routes"]["get_results"])
# async def get_evaluation(
#     evaluation_id: int,
#     db: Session = Depends(get_db),
#     current_user: dict = Depends(get_current_user)
# ):
#     evaluation = DBOperations.get_evaluation(db, evaluation_id)
#     if not evaluation:
#         raise HTTPException(status_code=404, detail="Evaluation not found")
#     return evaluation
            "error": None
            }

            evaluation = DBOperations.create_evaluation(db, evaluation_data)
            # return {f"Result {result}, Evaluation db {evaluation}"}, 200
            print("data sent", evaluation)

            data_file = pd.read_csv(file_location)
            print("DataFrame columns:", data_file.columns)
            print("First few rows:")
            print(data_file.head())
            result = infer_instance.evaluate_all_metrics(dataset=data_file, strategy=data["decode"], temperature=data["temperature"],top_k=data["top_k"],top_p=data["top_p"])
            print("???????????????????????????????????????????????????????", result)
            update_success = DBOperations.udpate_evaluation(db, result, evaluation.id)
    
            if update_success:
                return {
                    "message": "Evaluation completed successfully",
                    "evaluation_id": evaluation.id,
                    "results": result
                }
            else:
                return {"error": "Failed to update evaluation results"}, 500
            
           
        except Exception as e:
            return {'error': f'Error processing the file: {str(e)}'}, 500

    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))



@router.get(ENDPOINTS["evaluation"]["routes"]["list"])
async def get_project_evaluations(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return DBOperations.get_project_evaluations(db, project_id)



@router.delete(ENDPOINTS["evaluation"]["routes"]["delete"])
async def delete_evaluation(
    evaluation_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if DBOperations.delete_evaluation(db, evaluation_id):
        return {"message": "Evaluation deleted successfully"}
    raise HTTPException(status_code=404, detail="Evaluation not found")


