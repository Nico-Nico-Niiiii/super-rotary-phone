from transformers import TrainerCallback
import json, os
from datetime import datetime
from ..database.crud import DBOperations 
from ..database.connection import get_db
import time
class GyanLogger(TrainerCallback):

    def __init__(self, log_path, model_type, model_name, project_name,job_name, epochs,task_id):
        super().__init__()
        self.current_step = 0                                                           # Initialize step counter
        self.train_loss = []
        self.eval_loss = []
        self.epochs = []
        self.total_epochs = epochs
        self.batch_size = None
        self.status = "Initializing"
        # Get model name and project name
        self.model_type = model_type
        self.model_name = model_name
        self.project_name = project_name
        self.job_name = job_name
        self.task_id = task_id
        self.last_learning_rate = 0
        # self.privacy = privacy
       

        # self.parent_pid = parent_pid  # Store the parent process ID

        self.log_directory = f"{log_path}/current_log/"  #newc_v      

        # Check if the directory exists and print appropriate message
        if os.path.exists(self.log_directory):
            print(f"Log directory already exists: {self.log_directory}")
        else:
            os.makedirs(self.log_directory, exist_ok=True)                              # Create directory if it doesn't exist
            print(f"Created log directory: {self.log_directory}")

        # Create a log file with a timestamp
        self.log_file = os.path.join(self.log_directory, datetime.now().strftime("%Y%m%d_%H%M%S") + ".log")
        self.log_file_handle = open(self.log_file, "a")                                 # Keep file open
        print(f"Created log file: {self.log_file}")
        self.db = next(get_db())
        # New flag to track evaluation status
        self.is_evaluating = False           #newc_v
     

    #newc_v
    def on_init_begin(self, args, state, control, **kwargs):
            if self.current_step == 0:
                self.status = "Initializing"
            print("Initialization Complete!")
            self.log_current_state()

    def on_train_begin(self, args, state, control, **kwargs):
        self.status = "Training"
        self.batch_size = args.per_device_train_batch_size
        print(f"Training started with batch size: {self.batch_size}")
        self.log_current_state()

    def on_train_end(self, args, state, control, **kwargs):
        self.status = "Completed"
        print(f"Status updated to: {self.status}")
        print("Training Completed !!! ")
        self.log_current_state()

    def on_evaluate(self, args, state, control, **kwargs):
        self.is_evaluating = True  # Set flag when evaluation starts
        print(f"Evaluation ended at step {state.global_step}")

    def on_log(self, args, state, control, logs=None, **kwargs):
        self.current_step += 1

        if logs is not None:
            epoch = logs.get('epoch', None)
            train_loss = logs.get('loss', None)
            eval_loss = logs.get('eval_loss', None)

            if logs.get('learning_rate', 'NA') != 'NA':
                self.last_learning_rate = logs.get('learning_rate')

            if epoch is not None:
                self.epochs.append(epoch)
            if train_loss is not None:
                self.train_loss.append(train_loss)
            if eval_loss is not None:
                self.eval_loss.append(eval_loss)

            # Determine if we're logging an evaluation step
            if self.is_evaluating:
                self.status = "Evaluated"
                self.is_evaluating = False  # Reset after logging evaluation
            else:
                self.status = "Training"

            self.log_current_state(logs)

    def log_current_state(self, logs=None):
        response = {
            "status": self.status,
            "step": self.current_step,
            "epoch": self.epochs[-1] if self.epochs else 0,
            "train_loss": self.train_loss[-1] if self.train_loss else 0,
            "eval_loss": self.eval_loss[-1] if self.eval_loss else 0,
            "batch_size": self.batch_size,
            "model_name": self.model_name,
            "project_name": self.project_name,
            # "learning_rate": logs.get('learning_rate', 0) if logs and logs.get('learning_rate', 'NA') != 'NA' else 0,
            "learning_rate": logs.get('learning_rate', self.last_learning_rate) if logs else self.last_learning_rate,
            "logs": logs,
            # "privacy":self.privacy,
            "total_epochs": self.total_epochs,
            "time": time.time()
        }
        print('Logged values:')
        print(json.dumps(response, indent=2))

        try:
            self.log_file_handle.write(json.dumps(response) + "\n")
            self.log_file_handle.flush()
            os.fsync(self.log_file_handle.fileno())
        except Exception as e:
            print(f"Error writing to log file: {e}")

        try:
            DBOperations.create_training_log(self.db, response, self.task_id)
            self.db.commit()
        except Exception as e:
            print(f"Error writing to database: {e}")
            try:
                self.db.close()
                self.db = next(get_db())
            except Exception as db_error:
                print(f"Error reconnecting to database: {db_error}")
        
    # Close the file handle when done
    def close(self):
            if self.log_file_handle:
                self.log_current_state()
                import time
                time.sleep(10)
                self.log_file_handle.close()
                print(f"Closed log file: {self.log_file}")



