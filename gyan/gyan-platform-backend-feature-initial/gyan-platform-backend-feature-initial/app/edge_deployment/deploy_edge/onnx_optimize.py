import subprocess
import json
import os
import shutil

class Convert_to_onnx:
    def __init__(self, model_type, project_name, model_name, precision_type, framework):
        self.model_type = model_type
        self.project_name = project_name
        self.model_name = model_name
        self.precision_type = precision_type
        self.framework = framework
        self.path = 'asset/deployment_on_edge'

    def optimize(self):
        print(os.listdir(f"model/{self.project_name}/{self.model_type}/{self.model_name}/"))
        if (os.path.isfile(f"model/{self.project_name}/{self.model_type}/{self.model_name}/adapter_config.json")):
            try:
                print("Start merge and unload process......")
                yield ("Start merge and unload process......")
        
                process1 = subprocess.run(['python', 'deploy_edge/merge_and_unload.py', self.model_type, self.model_name, self.project_name], stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

                if process1.returncode != 0:
                    print("Error during execution:", process1.stderr)  # Capture error messages
                    yield (process1.stderr)
                    yield json.dumps({"Error": "Merge and unload failed!!"})
                    return
                else:
                    print("Command executed successfully. Output:", process1.stdout.encode())
                    yield (process1.stdout)

                print("Merge and Unload done!!!")
                yield ("Merge and Unload done!!!")

                onnx_model_path = f"{self.path}/optimized_models/onnx/{self.project_name}/{self.model_type}/{self.model_name}/{self.precision_type}"

                if self.model_name == "ID_GYAN_T5":
                    command = [
                        "optimum-cli", 
                        "export", 
                        "onnx", 
                        "--model", f"{self.path}/merged_peft_model/{self.project_name}/{self.model_type}/{self.model_name}", 
                        "--task", "text2text-generation",
                        "--dtype", f"{self.precision_type}",
                        "--device", "cuda",
                        f"{onnx_model_path}"
                    ]
                else:
                    command = [
                        "optimum-cli", 
                        "export", 
                        "onnx", 
                        "-m", f"{self.path}/merged_peft_model/{self.project_name}/{self.model_type}/{self.model_name}", 
                        "--task", "text-generation", 
                        "--dtype", f"{self.precision_type}",
                        "--device", "cuda",
                        f"{onnx_model_path}"
                    ]

                print("Converting the model to ONNX format......")
                yield ("Converting the model to ONNX format......")
                print(f"Executing command: {' '.join(command)}")

                process = subprocess.run(command, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

                # Check if there was an error
                if process.returncode != 0:
                    print("Error during execution:", process.stderr)  # Capture error messages
                    yield (process.stderr)
                    yield json.dumps({"Error": "Onnx conversion failed!!"})
                    return 
                else:
                    print("Command executed successfully. Output:", process.stdout.encode())
                    yield (process.stdout)

                print("Converted to onnx format!!!")

                yield json.dumps({"Info": f"Model conversion to ONNX format is successfull"})

                source = [f"readme_and_requirements/onnx", 
                        "deploy_edge/onnx_infer.py",
                        f"{self.path}/optimized_models/{self.framework}/{self.project_name}/{self.model_type}/{self.model_name}"]

                # Check if the source directory exists
                for src in source:
                    if not os.path.exists(src):
                        yield json.dumps({"Err": f"Source directory {src} does not exist"})
                        return
                
                if os.path.exists(f"temp/deployment_edge/{self.project_name}_{self.model_name}"):
                    if os.path.isdir(f"temp/deployment_edge/{self.project_name}_{self.model_name}"):
                        # It's a directory, so remove it
                        shutil.rmtree(f"temp/deployment_edge/{self.project_name}_{self.model_name}")
                    else:
                        # It's a file, so remove it
                        os.remove(f"temp/deployment_edge/{self.project_name}_{self.model_name}")

                os.makedirs(f"temp/deployment_edge/{self.project_name}_{self.model_name}")

                dest_path = f"onnx_model/{self.model_name}"
                
                # Copy the directory tree
                for src in source:
                    print(src)
                    if src == f"readme_and_requirements/onnx":
                        for item in os.listdir(src):
                            shutil.copy2(os.path.join(src, item), f"temp/deployment_edge/{self.project_name}_{self.model_name}")
                    elif os.path.isfile(src):
                        shutil.copy2(src, f"temp/deployment_edge/{self.project_name}_{self.model_name}")
                    else:
                        shutil.copytree(src, os.path.join(f"temp/deployment_edge/{self.project_name}_{self.model_name}", dest_path))

                # Create a zip file
                shutil.make_archive(f"asset/deployment_on_edge/zip_files/{self.framework}_{self.model_name}", 'zip', f"temp/deployment_edge/{self.framework}_{self.model_name}")
            except Exception as e:
                print(str(e))
                yield json.dumps({"Error": str(e)})
        else:
            yield json.dumps({"Error": "Model path is not valid"})

    def serve_request(self):
        return self.optimize()