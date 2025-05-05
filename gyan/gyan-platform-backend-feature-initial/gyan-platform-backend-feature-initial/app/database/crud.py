from sqlalchemy.orm import Session
from ..models.user import User
from ..schemas.user import UserCreate
from ..core.security import get_password_hash
from ..schemas.project import ProjectCreate 
from ..models.project import Project
from ..models.foundation_models import FoundationModelInfo
from ..schemas.foundation_models import FoundationModelCreate 
from ..models.usecases_prompts import UsecasePromptInfo
from ..models.training_job import TrainingJob
from ..schemas.training_job import TrainingJobCreate
from datetime import datetime
import logging
from ..models.train_log import TrainingLog
from ..schemas.train_log import TrainingLogCreate
import os

# guard
from ..models.guard import GuardInfo

# evaluation
from ..models.evaluation import Evaluation
from ..schemas.evaluation import EvaluationCreate, EvaluationUpdate
import hashlib
from typing import List, Optional, Any
from sqlalchemy import literal, desc, select, union_all, and_, func

class DBOperations:


    # guard function
    @staticmethod
    def log_restricted_prompt(
        db: Session, 
        user_email: str, 
        prompt: str, 
        answer_category: str = "Restricted"
    ):
        """
        Log a restricted prompt for a user.
        
        If the user's email already exists in the guard_info table, 
        increment the counter. Otherwise, create a new entry.
        
        Args:
            db (Session): Database session
            user_email (str): Email of the user
            prompt (str): The restricted prompt
            answer_category (str, optional): Category of the restricted answer. Defaults to "Restricted".
        
        Returns:
            GuardInfo: The created or updated GuardInfo object
        """
        # Try to find an existing entry for the user
        existing_entry = db.query(GuardInfo).filter(
            and_(
                GuardInfo.user_email == user_email
            )
        ).first()
        
        if existing_entry:
            latest_counter = db.query(func.max(GuardInfo.counter)).filter(
            GuardInfo.user_email == user_email
            ).scalar()

        # If user has previous records, increment the latest counter; otherwise, start from 1
            new_counter = (latest_counter or 0) + 1

        # Insert the new restricted entry with the incremented counter
            new_entry = GuardInfo(
                user_email=user_email,
                prompt=prompt,
                answer_category=answer_category,
                counter=new_counter  
            )
            # If entry exists, increment the counter
            db.add(new_entry)
            db.commit()
            db.refresh(new_entry)
            return new_entry
        
        # If no existing entry, create a new one
        new_entry = GuardInfo(
            user_email=user_email,
            prompt=prompt,
            answer_category=answer_category,
            counter=1
        )
        
        db.add(new_entry)
        db.commit()
        db.refresh(new_entry)
        return new_entry


    @staticmethod
    def create_user(db: Session, user: UserCreate):
        hashed_password = get_password_hash(user.password)
        db_user = User(
            email=user.email,
            hashed_password=hashed_password,
            username=user.username if hasattr(user, 'username') else None,
            first_name=user.first_name if hasattr(user, 'first_name') else None,
            last_name=user.last_name if hasattr(user, 'last_name') else None,
            is_active=True 
        )
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    # Add this method to your DBOperations class

    @staticmethod
    def update_user_token(db: Session, user_id: int, token: str):
        """
        Update user's gyanhub_token
        
        Args:
            db (Session): Database session
            user_id (int): User ID
            token (str): Token from external system
            
        Returns:
            User: Updated user object
        """
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            user.gyanhub_token = token
            db.commit()
            db.refresh(user)
        return user

    @staticmethod
    def get_user_by_email(db: Session, email: str):
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def get_user_by_username(db: Session, username: str):
        """
        Retrieve a user by their username
        
        Args:
            db (Session): Database session
            username (str): Username to search for
        
        Returns:
            User or None: User object if found, otherwise None
        """
        return db.query(User).filter(User.username == username).first()
    
    @staticmethod
    def create_project(db: Session, project: ProjectCreate, user_id: int, user_email: str):
        try:
            db_project = Project(
            name=project.name,
            model_type=project.type,
            model_name=project.model,
            status="Active",
            user_id=user_id,
            user_email=user_email,
            model_path=None,
            model_repository_path=None,
            dataset_repository_path=None
            )
            print("Creating project with data:", {
            "name": db_project.name,
            "model_type": db_project.model_type,
            "model_name": db_project.model_name
            })
            db.add(db_project)
            db.commit()
            db.refresh(db_project)
            return db_project
        except Exception as e:
            db.rollback()
            raise Exception(f"Failed to create project: {str(e)}")

    @staticmethod
    def get_user_projects(db: Session, user_id: int):
        return db.query(Project).filter(Project.user_id == user_id).order_by(Project.id.desc()).all()

    @staticmethod
    def get_project(db: Session, project_id: int):
        return db.query(Project).filter(Project.id == project_id).first()
    
    

    @staticmethod
    def get_all_projects(db: Session):
        return db.query(Project).all()
    
    @staticmethod
    def check_project_name_exists(db: Session, user_id: int, project_name: str):
        existing_project = db.query(Project).filter(
            Project.user_id == user_id,
            Project.name == project_name
        ).first()
        return existing_project is not None
    
    @staticmethod
    def create_foundation_model(db: Session, model: FoundationModelCreate):
        db_model = FoundationModelInfo(**model.dict())
        db.add(db_model)
        db.commit()
        db.refresh(db_model)
        return db_model

    @staticmethod
    def get_all_foundation_models(db: Session):
        return db.query(FoundationModelInfo).all()

    @staticmethod
    def get_foundation_model(db: Session, model_name: str):
        return db.query(FoundationModelInfo).filter(FoundationModelInfo.model_name == model_name).first()

    @staticmethod
    def update_foundation_model(db: Session, model_id: int, model_data: FoundationModelCreate):
        db_model = db.query(FoundationModelInfo).filter(FoundationModelInfo.id == model_id).first()
        if db_model:
            for key, value in model_data.dict().items():
                setattr(db_model, key, value)
            db.commit()
            db.refresh(db_model)
        return db_model

    @staticmethod
    def delete_foundation_model(db: Session, model_id: int):
        db_model = db.query(FoundationModelInfo).filter(FoundationModelInfo.id == model_id).first()
        if db_model:
            db.delete(db_model)
            db.commit()
            return True
        return False
    
    @staticmethod
    def get_models_by_type(db: Session, model_type: str):
        return (
            db.query(FoundationModelInfo)
            .filter(FoundationModelInfo.model_type == model_type,  FoundationModelInfo.is_accessable == True)
            .all()
        )
    

    @staticmethod
    def create_training_job(db: Session, job: dict, project_id: int, user_id: int, user_email: str):
        try:
            print("Creating training job with:", {
                **job,
                "project_id": project_id,
                "user_id": user_id
            })

            # Check if the project exists
            project = db.query(Project).filter(Project.id == project_id).first()
            if not project:
                raise Exception("Project not found")
            
            
            
            
            
            project_name = project.name 
            model_type = project.model_type
            model_name = project.model_name

            model = db.query(FoundationModelInfo).filter(FoundationModelInfo.model_name == model_name).first()
            if not model:
                raise Exception("Project not found")
            
            hf_id = model.hf_id

        
            # Generate job ID
            last_job = db.query(TrainingJob).order_by(TrainingJob.id.desc()).first()
            job_number = 1 if not last_job else int(last_job.id.split('-')[1]) + 1
            job_id = f"TRN-{str(job_number).zfill(3)}"
            
            # Create the training job entry with task_id
            db_job = TrainingJob(
                id=job_id,
                task_id=job["task_id"],  # Pass the task_id here
                name=job["name"],
                dataset_path=job["dataset_path"],
                epochs=job["epochs"],
                batch_size=job["batch_size"],
                learning_rate=job["learning_rate"],
                token_length=job["token_length"],
                quantization=job["quantization"],
                rank=job["rank"],
                lora_optimized=job["lora_optimized"],
                status=job["status"],
                queue_status=job["queue_status"],
                enqueued_at=job["enqueued_at"],
                project_id=project_id,
                user_id=user_id,
                user_email=user_email,
                project_name=project_name,
                model_name=model_name,
                model_type=model_type,
                hf_id=hf_id,
                started_on=datetime.utcnow(),  # Set started_on if available
                error=job.get("error", None)  # Set error if available
            )
            
            db.add(db_job)
            db.commit()
            db.refresh(db_job)
            return db_job
        except Exception as e:
            db.rollback()
            print("Database error:", str(e))
            raise Exception(f"Failed to create training job: {str(e)}")
    
    @staticmethod
    def update_task_status(db: Session, task_id: str, new_status: str):
        try:
            job = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
            if job:
                job.queue_status = new_status  # Update the queue status
                if new_status == "Running":
                    job.status = "Running"  # Set the task status to 'Running'
                    job.dequeued_at = datetime.utcnow()  # Set the dequeued time
                elif new_status == "Completed":
                    job.status = "Completed"  # Set the task status to 'Completed'
                    job.completed_at = datetime.utcnow()  # Set the completed time
                db.commit()
                db.refresh(job)
                print(f"Updated task {task_id} status to {new_status}")
            else:
                print(f"Job with task_id {task_id} not found in the database.")
        except Exception as e:
            db.rollback()
            print(f"Error updating task {task_id} status: {str(e)}")
            raise Exception(f"Failed to update task status: {str(e)}")
        
    @staticmethod
    def update_task_error(db: Session, task_id: str, error_message: str):
        """Update the error message for a training job."""
        try:
            job = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
            if job:
                job.error = error_message
                job.updated_at = datetime.utcnow()
                db.commit()
                return True
            return False
        except Exception as e:
            db.rollback()
            logging.error(f"Error updating task error message: {e}")
            raise

    @staticmethod
    def get_project_training_jobs(db: Session, project_id: str):
        return db.query(TrainingJob).filter(
            TrainingJob.project_id == project_id
        ).order_by(TrainingJob.enqueued_at.desc()).all()
    
    @staticmethod
    def get_error_job(db:Session, job_id: str):
        return db.query(TrainingJob).filter(
            TrainingJob.id == job_id
        )

    @staticmethod
    def delete_training_job(db: Session, job_id: str):
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        db.query(TrainingLog).filter(TrainingLog.task_id == job.task_id).delete(synchronize_session=False)
        # log = db.query(TrainingLog).filter(TrainingLog.task_id == job.task_id)
        if job:
            try:
                if os.path.exists(job.dataset_path):
                    os.remove(job.dataset_path)
            except Exception as e:
                print(f"Error deleting file: {e}")
            # db.delete(log)
            db.delete(job)
            db.commit()
            return True
        return False
    
    @staticmethod
    def create_training_log(db: Session, log_data: dict, task_id: str) -> TrainingLog:
        existing_log = db.query(TrainingLog).filter(
        TrainingLog.task_id == task_id,
        TrainingLog.step == log_data["step"]).first()

        if existing_log:
           
            return existing_log
        job = db.query(TrainingJob).filter(TrainingJob.task_id == task_id).first()
        db_log = TrainingLog(
            task_id=task_id,
            step=log_data["step"],
            epoch=log_data["epoch"],
            train_loss=log_data["train_loss"],
            eval_loss=log_data["eval_loss"],
            learning_rate=log_data["learning_rate"],
            batch_size=log_data["batch_size"],
            model_name=log_data["model_name"],
            project_name=log_data["project_name"],
            job_name=job.name,
            user_email=job.user_email,
            total_epochs=log_data["total_epochs"],
            status=log_data["status"]
        )
        db.add(db_log)
        db.commit()
        db.refresh(db_log)
        return db_log

    @staticmethod
    def get_training_logs(db: Session, job_id: str):
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        task_id = job.task_id
        return db.query(TrainingLog).filter(TrainingLog.task_id == task_id).all()

    @staticmethod
    def get_latest_training_log(db: Session, job_id: str):
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        task_id = job.task_id
        return db.query(TrainingLog)\
                 .filter(TrainingLog.task_id == task_id)\
                 .order_by(TrainingLog.timestamp.desc())\
                 .first()

    @staticmethod
    def delete_training_logs(db: Session, task_id: str) -> bool:
        num_deleted = db.query(TrainingLog)\
                       .filter(TrainingLog.task_id == task_id)\
                       .delete()
        db.commit()
        return num_deleted > 0
    
    @staticmethod
    def get_queued_jobs(db: Session, project_id: str):
        """Get all jobs that are currently in Queued status, ordered by enqueue time"""
        return db.query(TrainingJob).filter(
            TrainingJob.project_id == project_id
        ).filter(TrainingJob.queue_status == "Queued").order_by(TrainingJob.enqueued_at.asc()).all()
    



    @staticmethod
    def update_job_status(db: Session, job_id: str):
        """Update query"""
        job = db.query(TrainingJob).filter(TrainingJob.id == job_id).first()
        if job:
            job.queue_status = "Queued"
            job.status = "Queued"
            db.commit()
            return True
        else:
            return False
        



    # evaluation crud operations
    @staticmethod
    def create_evaluation(db: Session, evaluation_data: dict) -> Evaluation:
        db_eval = Evaluation(**evaluation_data)
        db.add(db_eval)
        db.commit()
        db.refresh(db_eval)
        return db_eval
    
    
    @staticmethod
    def udpate_evaluation(db:Session, eval_result:dict, id: int) -> EvaluationUpdate:
        eval = db.query(Evaluation).filter(Evaluation.id == id).first()
        if eval:
            try:
                # Get both final_scores and remarks from the result
                final_scores = eval_result.get("final_scores", {})
                remarks = eval_result.get("remarks", {})
                # results = eval_result.get("results", {})

                # Update metrics
                eval.bertscore = final_scores.get("bertscore")
                eval.bleu = final_scores.get("bleu")
                eval.chrf = final_scores.get("chrf")
                eval.perplexity = final_scores.get("perplexity")
                eval.rouge = final_scores.get("rouge")
                
                # Update remarks (you'll need to add these columns to your model if you want to store remarks)
                eval.bertscore_remark = remarks.get("bertscore")
                eval.bleu_remark = remarks.get("bleu")
                eval.chrf_remark = remarks.get("chrf")
                eval.perplexity_remark = remarks.get("perplexity")
                eval.rouge_remark = remarks.get("rouge")
                
                # Store the complete results as JSON if needed
                # eval.raw_results = results  # You'll need to add this column if you want to store raw results
                
                # Update status and completion time
                eval.status = "Completed"
                eval.completed_at = datetime.now()
                
                db.commit()
                return True
            except Exception as e:
                print(f"Error updating evaluation: {str(e)}")
                eval.status = "Failed"
                eval.error = str(e)
                db.commit()
                return False
        return False
   


    @staticmethod
    def get_evaluation(db: Session, evaluation_id: int) -> Optional[Evaluation]:
        return db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()

    @staticmethod
    def get_project_evaluations(db: Session, project_id: int) -> List[Evaluation]:
        return db.query(Evaluation).filter(
            Evaluation.project_id == project_id
        ).order_by(Evaluation.created_at.desc()).all()

    @staticmethod
    def get_model_types(db: Session, user_id: int) -> List[str]:
        evaluations = db.query(Evaluation.model_type).filter(
            Evaluation.user_id == user_id
        ).distinct().all()
        return [eval[0] for eval in evaluations]

    @staticmethod
    def get_models(db: Session, user_id: int) -> List[str]:
        evaluations = db.query(Evaluation.model_name).filter(
            Evaluation.user_id == user_id
        ).distinct().all()
        return [eval[0] for eval in evaluations]

    @staticmethod
    def get_projects(db: Session, project_name: str) -> List[str]:
        evaluations = db.query(Evaluation).filter(
            Evaluation.project_name == project_name
        ).all()
        # return [eval[0] for eval in evaluations]
        return evaluations

    staticmethod
    def get_jobs(db: Session, project_name: str, project_id: int, email: str) -> List[str]:
        print("Inside crud", project_name)
        evaluations = db.query(Evaluation).filter(
            Evaluation.project_name == project_name
        ).all()
        # return [eval[0] for eval in evaluations]
        return evaluations

    @staticmethod
    def delete_evaluation(db: Session, evaluation_id: int) -> bool:
        evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if evaluation:
            db.delete(evaluation)
            db.commit()
            return True
        return False

    @staticmethod
    def update_status(db: Session, evaluation_id: int, status: str) -> Optional[Evaluation]:
        evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if evaluation:
            evaluation.status = status
            db.commit()
            db.refresh(evaluation)
            return evaluation
        return None

    @staticmethod
    def generate_dataset_hash(file_content: bytes) -> str:
        return hashlib.sha256(file_content).hexdigest()
    


    # dashboard routes

    @staticmethod
    def get_evaluation_count(db: Session, email: str):
        evaluation = db.query(Evaluation).filter(Evaluation.email == email).count()
        return evaluation
    
    @staticmethod
    def get_training_count(db: Session, email: str):
        training = db.query(TrainingJob).filter(TrainingJob.user_email == email).count()
        return training
    
    @staticmethod
    def get_project_count(db: Session, email: str):
        project = db.query(Project).filter(Project.user_email == email).count()
        return project
    

    @staticmethod
    def get_recent_activities(db: Session, email: str, limit: int = 3):
        training_query = select(
            TrainingJob.name,
            TrainingJob.completed_at.label('completed_at'),
            TrainingJob.model_type,
            literal('Training').label('type')
        ).where(
            TrainingJob.user_email == email,
            TrainingJob.completed_at.isnot(None)
        )

        eval_query = select(
            Evaluation.name,
            Evaluation.completed_at.label('completed_at'),
            Evaluation.model_type,
            literal('Evaluation').label('type')
        ).where(
            Evaluation.email == email,
            Evaluation.completed_at.isnot(None)
        )

        query = union_all(training_query, eval_query).order_by(desc('completed_at')).limit(limit)
        results = db.execute(query).all()
        
        return [{"name": r.name, "type": r.type, "completed_at": r.completed_at} for r in results]

    @staticmethod
    def get_prompts(db: Session, usecase: str, prompt_subsection: str):
        return db.query(UsecasePromptInfo).filter(
            and_(
                UsecasePromptInfo.usecase_name == usecase,
                UsecasePromptInfo.prompt_subsection_name == prompt_subsection)
            ).all()