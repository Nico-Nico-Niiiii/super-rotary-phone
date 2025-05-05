import os
import shutil
class LogsManager:

    def __init__(self,model_type,model_name,project_name):
        self.model_type = model_type.lower()
        self.model_name = model_name
        self.project_name = project_name

        self.log_directory = f"./logs/{self.model_type}/{self.project_name}/{self.model_name}/current_log/"
        self.log_old_directory = f"./logs/{self.model_type}/{self.project_name}/{self.model_name}/old_log/"

        self.move()

    def move(self):

        if os.path.exists(self.log_directory):
            print(f"Log directory already exists: {self.log_directory}")
        else:
            os.makedirs(self.log_directory, exist_ok=True)
            print(f"Created log directory: {self.log_directory}")

        if os.path.exists(self.log_old_directory):
                    print(f"Log directory already exists: {self.log_old_directory}")
        else:
            os.makedirs(self.log_old_directory, exist_ok=True)
            print(f"Created log directory: {self.log_old_directory}")

        entries = os.listdir(self.log_directory)

        for entry in entries:
            file = os.path.join(self.log_directory, entry)
            if os.path.isfile(file):
                print("### FILE FOUND ", file)

                shutil.move(file, self.log_old_directory)
                print("### FILE MOVED ")


