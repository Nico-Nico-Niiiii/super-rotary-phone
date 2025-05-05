import os
import json
import time

class TrainLogs:
    def __init__(self,email,  model_type, model_name, project_name,epochs):
        self.email = email
        self.model_type = model_type
        self.model_name = model_name
        self.project_name = project_name
        # self.privacy = privacy
        self.total_epochs=epochs
        

        self.log_directory = f"./log/{email}/{model_type}/{project_name}/{model_name}/current_log/" #newc_v
        self.max_attempts = 1  # Reduce max attempts for faster retries
        self.retry_delay = 0.5  # Reduce delay for quicker retries

    def get_log_status(self):
        if not os.path.exists(self.log_directory):
            return {"Message": "Log directory does not exist", "is_training": False}, 404

        log_files = [f for f in os.listdir(self.log_directory) if f.endswith(".log")]
        log_files.sort(key=lambda x: os.path.getctime(os.path.join(self.log_directory, x)), reverse=True)

        if not log_files:
            return {"Message": "No log files found", "is_training": False}, 404

        latest_log_file = os.path.join(self.log_directory, log_files[0])
        print(f"Latest log file: {latest_log_file}")

        for attempt in range(self.max_attempts):
            with open(latest_log_file, "r") as f:
                lines = f.readlines()
                if not lines:
                    # print("Log file is empty")
                    time.sleep(self.retry_delay)
                    continue

                last_line = lines[-1].strip()
                if not last_line:
                    # print("Last log entry is empty")
                    time.sleep(self.retry_delay)
                    continue

                log_entry = json.loads(last_line)
                
                # Check if logs is None and handle it appropriately
                # logs = log_entry.get("logs") or {}
                
                data_json = {
                    "step": log_entry.get("step", 0),
                    "train_loss": log_entry.get("train_loss", 0), 
                    "eval_loss": log_entry.get("eval_loss", 0),                      
                    "epoch": round(log_entry.get("epoch", 0),2),
                    # "learning_rate": logs.get("learning_rate", 0),
                    "learning_rate": round(log_entry.get("learning_rate", 0),2),
                    "batch_size": log_entry.get("batch_size", 0),  # Log batch size
                    "model_name": self.model_name,  # Assume these keys are always present
                    "project_name": self.project_name,
                    # "privacy":self.privacy,
                    "total_epochs":self.total_epochs,
                    "status": log_entry.get("status", "Unknown") ,      #newc_v
                    "time": log_entry.get("time_stamp","Not known")
                }
                return data_json, 200

        print("Failed to read log file after multiple attempts")
        return {"Message": "Failed to read log file after multiple attempts", "is_training": False}, 500
