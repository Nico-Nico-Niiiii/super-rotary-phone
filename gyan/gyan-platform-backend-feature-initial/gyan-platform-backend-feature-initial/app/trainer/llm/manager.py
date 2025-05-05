# from src.trainer.llm.gyant5.model import GyanT5Trainer
# from src.trainer.llm.gyant5.model import GyanT5Trainer
# from src.trainer.llm.gyanllama.model import GyanCodeLlama2Trainer
from app.trainer.llm.gyanllama2.model import GyanLlama2Trainer
from app.trainer.llm.gyanllama3.model import GyanLlama3_1Trainer
# from src.trainer.llm.gyancodellama.model import GyanCodeLlamaTrainer
# from src.trainer.llm.gyantinyllama.model import GyanTinyLlamaTrainer
# from src.trainer.llm.gyanphi2.model import GyanPhi2Trainer
# from src.trainer.llm.gyanmistral.model import GyanMistralTrainer
# from src.trainer.llm.gyanyi6b.model import GyanYi6BTrainer
# from src.trainer.llm.gyanopt.model import GyanOptTrainer
# from src.trainer.llm.gyanllama3_1.model import GyanLlama3_1Trainer
from app.cfg.config_loader import Config
from werkzeug.utils import secure_filename
from app.logger.gyan_log import GyanLogger

import os





class LLMTrainingManager:
    def __init__(self, model_type, model_name, project_name, 
                  epochs, batch_size, learning_rate, rank,
                 select_quantization, token_length, lora_enabled,
                 email, filename, file_content, task_id,job_name):
        
        c = Config()
        mod = c.load("./cfg/model_config.json")

        cfg = c.load("./cfg/repo_details.json")
        dataset_root = cfg['dataset_repo']
        model_root = cfg['model_repo']
        log_root = cfg['log_path']
        self.project_name = project_name
        self.data = file_content
        self.model_type = model_type
        self.model_name=model_name
        self.task_id = task_id  # Store task_id
        self.job_name = job_name
        self.email = email
        # Training parameters
        self.epochs = epochs
        self.batch_size = batch_size
        self.learning_rate = learning_rate
        self.rank = rank
        self.select_quantization = select_quantization
        self.token_length = token_length
        self.lora_enabled = lora_enabled

        # getting model_id
        self.model_id = mod['models'][model_name]['model_id']
        # content = self.data.read()
        print("Inside LLM manager")
        print(f"Filename: {filename}")
        # print(f"Content length: {len(content)} bytes")
        # print(f"Content preview: {content[:500]}")
        
        # Create paths for dataset and model storage
        self.DATASET_PATH = dataset_root+'/'+self.email+'/'+model_type+'/'+project_name+'/'+model_name
        self.MODEL_SAVE_PATH = model_root+"/"+self.email+'/'+model_type+'/'+project_name+'/'+model_name + '/' + job_name
        self.LOG_PATH = log_root+"/"+self.email+'/'+model_type+'/'+project_name+'/'+model_name
        
        print("------------------ DATASET PATH ", self.DATASET_PATH)
        
        if os.path.isdir(self.DATASET_PATH):
            print("Dataset Folder Already Available.")
        else:
            os.makedirs(self.DATASET_PATH)
        
        
        data_path = os.path.join(self.DATASET_PATH, secure_filename(filename))
        print("=========== Path", data_path)
        with open(data_path, 'wb') as f:  # Use 'wb' mode for writing binary files
            f.write(self.data)
        
        # self.data.save(path)
        
        print("-------- saving uploaded file")
        
        
        

        model_selector = {
            model_name: GyanLlama2Trainer
            }

        # print("-=========================-")
        # print("Proj", project_name)
        model_class = model_selector[model_name]
        print("Model Class",model_class)
        
        print(" --------- Dataset Path being sent", data_path)
        
        
        self.gyan_trainer = model_class(data_path, self.MODEL_SAVE_PATH, self.LOG_PATH, model_type, model_name, project_name ,epochs, learning_rate, rank, batch_size, token_length, select_quantization, lora_enabled, task_id, job_name)
        
      
    def serve_request(self):
        print("Starting training...")
        print("Data is save")
        


















