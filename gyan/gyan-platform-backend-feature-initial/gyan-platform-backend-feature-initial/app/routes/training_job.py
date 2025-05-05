from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, status
from sqlalchemy.orm import Session
from ..database.connection import get_db
from ..database.crud import DBOperations
from ..schemas.training_job import TrainingJobCreate, TrainingJobResponse
from ..core.security import get_current_user
from typing import List
from ..core.utils import get_route, get_prefix, load_endpoints
import json
from ..trainer.llm.queue_manager import TaskQueue, TaskNode
import uuid
import time
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
import os
import shutil
from app.trainer.llm.manager import LLMTrainingManager
from ..models.training_job import TrainingJob
import torch
from fastapi.responses import JSONResponse
from app.logger.log_archiver import LogsManager
from app.logger.log_request import TrainLogs
import logging
from app.logger.gyan_log import GyanLogger

logging.basicConfig(level=logging.INFO)

ENDPOINTS = load_endpoints()
os.makedirs("uploads", exist_ok=True)

router = APIRouter(
    prefix=get_prefix("training"),
    tags=["training"]
)


@router.get(ENDPOINTS["training"]["routes"]["count"])
async def get_training_job(
     db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    count = DBOperations.get_training_count(db,current_user["email"])
    return {"count" : count}

def check_running_jobs(task_queue: TaskQueue, db: Session):
    """Check the jobs in the queue and start training if necessary."""
    print("Checking running jobs at time:", datetime.now())
    try:
        if not task_queue.is_empty():
            # Peek at the first task in the queue
            task = task_queue.peek()
        

            if task.queue_status == 'Queued':
                # Change status to Running in the task queue
                task.queue_status= 'Running'
                DBOperations.update_task_status(db, task.task_id, "Running")

                job = db.query(TrainingJob).filter(TrainingJob.task_id == task.task_id).first()
                print("updated to running")
                LogsManager(model_type=job.model_type,  model_name=job.model_name, project_name=job.project_name)
                TrainLogs(job.user_email, job.model_type, job.model_name, job.project_name , job.epochs)

                 # Add database logging
                log_data = {
                    "step": 0,
                    "epoch": 0,
                    "train_loss": 0,
                    "eval_loss": 0,
                    "learning_rate": job.learning_rate,
                    "batch_size": job.batch_size,
                    "model_name": job.model_name,
                    "project_name": job.project_name,
                    "job_name": job.name,
                    "user_email": job.user_email,
                    "total_epochs": job.epochs,
                    "status": "Running"
                }
                
                try:
                    DBOperations.create_training_log(db, log_data, task.task_id)
                except Exception as db_error:
                    print(f"Error storing log in database: {db_error}")

                print("Logs Manager called")
                print("Task :", task)
                
                # Modify GyanLogger to include task_id
                logger = GyanLogger(
                    log_path=f"./log/{job.user_email}/{job.model_type}/{job.project_name}/{job.model_name}",
                    model_type=job.model_type,
                    model_name=job.model_name,
                    project_name=job.project_name,
                    job_name=job.name,
                    epochs=job.epochs,
                    task_id=task.task_id  # Add task_id here
                )
                # train_logs = TrainLogs(job.user_email, job.model_type, job.model_name, job.project_name , job.epochs)
                # print(train_logs)
                print("Logs Manager called", logger)
                print("Task :",task)
                # start training
                task_queue.head.train_instance = LLMTrainingManager(model_type=job.model_type, model_name=job.model_name,
                                                                    project_name=job.project_name,  epochs=job.epochs, 
                                                                    batch_size=job.batch_size, learning_rate=job.learning_rate,rank=job.rank, select_quantization=job.quantization,
                                                                    token_length=job.token_length, lora_enabled=job.lora_optimized,
                                                                    email=job.user_email, filename=task.filename, file_content=task.content,task_id=task.task_id, job_name=job.name)
                
           
                
            # After training, mark the task as completed
            elif task.queue_status == 'Running' and not task_queue.head.train_instance.gyan_trainer.p.is_alive():
                # print(f"task.task_id: {task.task_id} Finished Execution")
                # task_queue.dequeue()
                # task.queue_status= 'Completed'
                # DBOperations.update_task_status(db, task.task_id, "Completed")
                # print("Model training is done, Dequed node")
                # torch.cuda.empty_cache()
                # task = {"task_id": task.task_id}  # Example task for demonstration
                # return {"message": f"Training is completed for the task:", "task_id": task['task_id']}, status.HTTP_200_OK
                try:
                    # Check for training success/failure
                    if hasattr(task_queue.head.train_instance.gyan_trainer, 'training_success'):
                        training_successful = task_queue.head.train_instance.gyan_trainer.training_success
                    else:
                        # If training_success attribute doesn't exist, check error logs or exit code
                        training_successful = task_queue.head.train_instance.gyan_trainer.p.exitcode == 0

                    if training_successful:
                        print(f"Task {task.task_id}: Training completed successfully")
                        task.queue_status = 'Completed'
                        DBOperations.update_task_status(db, task.task_id, "Completed")
                    else:
                        print(f"Task {task.task_id}: Training failed")
                        task.queue_status = 'Failed'
                        DBOperations.update_task_status(db, task.task_id, "Failed")
                        # error_msg = trainer.error_message if hasattr(trainer, 'error_message') and trainer.error_message else "Unknown training error occurred"
                        error_msg = "CUDA error"
                        DBOperations.update_task_error(db, task.task_id, error_msg)
                        
                        print(f"Error message saved to database: {error_msg}")
                        logging.error(f"Training failed for task {task.task_id}: {error_msg}")


                       
                        
                        # if hasattr(task_queue.head.train_instance.gyan_trainer, 'error_check'):
                        #     error_msg = task_queue.head.train_instance.gyan_trainer.error_message
                        #     print("Error##########################",error_msg)
                        #     logging.error(f"Training failed for task {task.task_id}: {error_msg}")
                        #     # Update DB with error message
                        #     DBOperations.update_task_error(db, task.task_id, error_msg)

                except Exception as e:
                    error_msg = f"Error checking training status: {str(e)}"
                    print(error_msg)
                    task.queue_status = 'Failed'
                    DBOperations.update_task_status(db, task.task_id, "Failed")
                    DBOperations.update_task_error(db, task.task_id, error_msg)


                finally:
                    # Clean up resources
                    torch.cuda.empty_cache()
                    task_queue.dequeue()
                    
                return {
                    "message": f"Training {task.queue_status.lower()} for task:", 
                    "task_id": task.task_id,
                    "status": task.queue_status
                }, status.HTTP_200_OK
           
    except Exception as e:
        error_msg = f"Queue processing error: {str(e)}"
        print(error_msg)
        logging.error(error_msg)
        if 'task' in locals() and task:
            DBOperations.update_task_error(db, task.task_id, error_msg)

    except MemoryError:
        print("MemoryError: Not enough memory add job!!!")        
     
        return {"msg":"Something went wrong with training request", "msg_type":"ERR"}, status.HTTP_500_INTERNAL_SERVER_ERROR

task_queue = TaskQueue() 






# def scheduled_check_jobs():
#     with get_db() as db:
#         print("fun run")
#         check_running_jobs(task_queue, db)  

# scheduler = BackgroundScheduler()
# # Add job to the scheduler to run every 10 seconds (or any other interval you prefer)
# scheduler.add_job(scheduled_check_jobs, 'interval', seconds=60)
# scheduler.start()

def scheduled_check_jobs():
    try:
        db = next(get_db())
        try:
            print("Running scheduled job check")
            check_running_jobs(task_queue, db)
        except Exception as e:
            print(f"Error in scheduled job: {e}")
        finally:
            db.close()
    except Exception as e:
        print(f"Database connection error in scheduler: {e}")

# Initialize scheduler with error handling
try:
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(scheduled_check_jobs, 'interval', seconds=60, max_instances=1)
    scheduler.start()
    print("Scheduler started successfully")
except Exception as e:
    print(f"Error starting scheduler: {e}")





@router.post(ENDPOINTS["training"]["routes"]["create"])
async def create_training_job(
    project_id: int,
    dataset: UploadFile = File(None),
    data: str = Form(...),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    try:
        # Generate a unique task ID using uuid
        task_id = str(uuid.uuid4())  # Generates a unique UUID and converts it to string
        
        # Parse the JSON data
        training_data = json.loads(data)
        print("Parsed training data:", training_data)
        print("File")
        print(dataset)
        
        # Handle file upload
        user_email=current_user["email"]
        dataset_path = None
        if dataset:
            # Save the file in the uploads directory
            print("Inside dataset")
            print(dataset.filename)
            file_location = f"uploads/{task_id}_{user_email}_{dataset.filename}"
            print(dataset.file)

            try:
                file_content = await dataset.read()
                with open(file_location, "wb") as buffer:
                    buffer.write(file_content)  # Save the uploaded file
                print(f"File saved to {file_location}")
                dataset_path = file_location  # Set the dataset path to the file's location
                # Extract file metadata
                file_name = dataset.filename  # File name
                file_type = dataset.content_type  # File type (MIME type)

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
        print("1")
        file_obj = dataset
        print(file_obj)
        print("2")
        print(training_data['status'])

        if training_data['status'] == 'Waiting':
            job = {
            "task_id": task_id,  # Add the generated task_id here
            "name": training_data["name"],
            "dataset_path": dataset_path,
            "epochs": training_data["epochs"],
            "batch_size": training_data["batch_size"],
            "learning_rate": training_data["learning_rate"],
            "token_length": training_data["token_length"],
            "quantization": training_data["quantization"],
            "rank": training_data["rank"],
            "lora_optimized": training_data["lora_optimized"],
            # "eval_steps": training_data["eval_steps"],
            "status": training_data["status"],
            "queue_status": training_data["status"],
            "enqueued_at": None 
            }
            
            new_job = DBOperations.create_training_job(
            db=db,
            job=job,
            project_id=project_id,
            user_id=current_user["id"],
            user_email=current_user["email"]
            )

            return job
        
        
        if training_data["status"] != "Waiting":

            task_node = TaskNode(
                task_id=task_id,
                file_obj=file_obj,
                queue_status="Queued",
                enqueued_at=datetime.utcnow(),
                content=file_content
            )
            print(task_node)

            # Add the TaskNode to the queue
            task_queue.enqueue(task_node)
      
        
        # Prepare the job dictionary with queue-related information and task_id
        job = {
            "task_id": task_id,  # Add the generated task_id here
            "name": training_data["name"],
            "dataset_path": dataset_path,
            "epochs": training_data["epochs"],
            "batch_size": training_data["batch_size"],
            "learning_rate": training_data["learning_rate"],
            "token_length": training_data["token_length"],
            "quantization": training_data["quantization"],
            "rank": training_data["rank"],
            "lora_optimized": training_data["lora_optimized"],
            # "eval_steps": training_data["eval_steps"],
            "status": training_data.get("status", "Queued"),
            "queue_status": "Queued",  # Set initial queue status to "Queued"
            "enqueued_at": None  # Will be set in the CRUD or after inserting to queue
        }

        
       
        
        # Now, process the task in the queue and update the enqueued_at time
        job["enqueued_at"] = job["enqueued_at"] or training_data.get("enqueued_at", None) or datetime.utcnow()
        
        # Create training job in DB with updated queue-related details
        new_job = DBOperations.create_training_job(
            db=db,
            job=job,
            project_id=project_id,
            user_id=current_user["id"],
            user_email=current_user["email"]
        )
        print("job inserted in database")
        
        # Set 'started_on' as the enqueued_at timestamp and 'error' as None (or handle errors as needed)
        job_response = {
            "id": new_job.id,
            "task_id": new_job.task_id,
            "name": new_job.name,
            "status": new_job.status,
            "queue_status": new_job.queue_status,
            "dataset_path": new_job.dataset_path,
            "epochs": new_job.epochs,
            "batch_size": new_job.batch_size,
            "learning_rate": new_job.learning_rate,
            "token_length": new_job.token_length,
            "quantization": new_job.quantization,
            "rank": new_job.rank,
            "lora_optimized": new_job.lora_optimized,
            # "eval_steps": new_job.eval_steps,
            "project_id": new_job.project_id,
            "user_id": new_job.user_id,
            "project_name": new_job.project_name,
            "started_on": new_job.enqueued_at,  # Use enqueued_at for started_on
            "error": None,  # No error at this stage, set to None
            "enqueued_at": new_job.enqueued_at,
            "completed_at": new_job.completed_at,
        }

        

        check_running_jobs(task_queue, db)
        print("check running function called")
        
        # Return the job response
        return job_response
        
    except Exception as e:
        print("Error in create_training_job:", str(e))
        raise HTTPException(
            status_code=400, 
            detail={
                "message": str(e),
                "type": type(e).__name__
            }
        )



@router.get(ENDPOINTS["training"]["routes"]["list"], response_model=List[TrainingJobResponse])
async def list_training_jobs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return DBOperations.get_project_training_jobs(db, project_id)



@router.get(ENDPOINTS["training"]["routes"]["get"], response_model=List[TrainingJobResponse])
async def get_training_job(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    return DBOperations.get_error_job(db, project_id)

@router.put(ENDPOINTS["training"]["routes"]["update_job_status"])
async def update_job_status(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if DBOperations.update_job_status(db, job_id):
        return {"message": "Job updated successfully"}
    raise HTTPException(status_code=404, detail="Job not found")
    



@router.delete(ENDPOINTS["training"]["routes"]["delete"])
async def delete_training_job(
    job_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    if DBOperations.delete_training_job(db, job_id):
        return {"message": "Job deleted successfully"}
    raise HTTPException(status_code=404, detail="Job not found")

