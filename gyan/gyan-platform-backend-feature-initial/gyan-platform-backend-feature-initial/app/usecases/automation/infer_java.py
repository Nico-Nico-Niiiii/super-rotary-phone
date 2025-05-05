from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from fastapi.responses import JSONResponse
import shutil
import json
import os
import re
from ansi2html import Ansi2HTMLConverter
from pydantic import BaseModel
import subprocess
import torch

# from .utils.java_utils import Utils_Java
from .utils.automation_utils import Automation_Utils

class GyanCodeLlamaInfer_Java:
    
    def __init__(self):
        # self.utils = Utils_Java
        self.utils = Automation_Utils()
        
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)
        
        model_path = self.data["use_case"]["automation_java"]["java_model"]
        self.output_path = self.data["use_case"]["automation_java"]["output_folder"]
        self.folder_base_directory = f"{self.output_path}/UTC_Java"
        os.makedirs(self.folder_base_directory, exist_ok = True)
        self.asset_path = self.data["use_case"]["automation_java"]["input_files"]
        self.base_directory = f"{self.asset_path}/UTC_Java"
        os.makedirs(self.base_directory, exist_ok = True)
        self.pom_file_path = self.data["use_case"]["automation_java"]["assets"]

        self.model_id = model_path
        
        self.generation_kwargs = {
            "max_new_tokens": 2048,
            "do_sample": True,
            "temperature": 0.1,
            "top_k": 40,
            "top_p": 0.8,
            "repetition_penalty": 1.3
        }

    def load_model(self):
        print("Model id: ", self.model_id)
        # print("Files in the model path: ", os.listdir(self.model_id))
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
        print("Tokenizer loaded")
        self.model = AutoModelForCausalLM.from_pretrained(self.model_id, trust_remote_code=True, device_map={"" : 0}, torch_dtype="auto", token="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")

        print("pipeline loading")
        self.tiny_pipeline = pipeline("text-generation", model=self.model, tokenizer=self.tokenizer)
        print("pipeline loaded")

        return
    
    def generate_testcases_from_file(self, text):
        
        self.load_model()

        instruction = f"""### Instruction
            You are a powerful model. You are given a input source code in java language.
            Your job is to output the unit test cases along with respective import and package headers for given java code below 
             ### Text
            {text}
            ### Response
            """
        
        output = self.tiny_pipeline(instruction, return_full_text=False, **self.generation_kwargs)
        return_text = output[0]['generated_text']
        del self.tiny_pipeline
        del self.model
        del self.tokenizer
        torch.cuda.empty_cache()
        return return_text
    
    def build_testcases_from_file(self,source_code, test_code):
        try:
            self.handle_java_code(source_code)
            self.handle_test_case(test_code)

            self.copy_pom_file(self.pom_file_path, self.base_directory)
            
            command = f"cd {self.base_directory}/ && mvn clean test && mvn jacoco:report"

            process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            output_lines = process.stdout.strip()
            error_lines = process.stderr.strip()
            print("Output Lines ", output_lines)
            print("Error Lines ", error_lines)

            conv = Ansi2HTMLConverter()
            html_output = conv.convert(process.stdout)
            # print("HTML Output: ", html_output)
            html_err = conv.convert(process.stderr)
            # print("HTML Error: ", html_err)

            if process.returncode==0 or "passed" in output_lines:

                report_folder_path = os.path.join(self.base_directory, "target", "site", "jacoco")

                test_cases_path = os.path.join(self.base_directory, "src","test","java","com","example")
                # print("Java coverage report folder path :", report_folder_path)
                return report_folder_path, test_cases_path

            else:
                return {
                    'success': False,
                    'error': 'Test execution failed',
                    'stdout': output_lines,
                    'stderr': error_lines
                }, None
            
        except subprocess.CalledProcessError as e:
            return JSONResponse(content={
                'success': False,
                'error': str(e),
                'stdout': e.stdout,
                'stderr': e.stderr
            }, status_code=400)

    def handle_java_code(self, java_source_code):
        try:
            class_name = self.find_class_name(java_source_code)
            self.save_classname(java_source_code, class_name)
        
        except Exception as e:
            print(f"An error occurred: {e}")

    def handle_java_code_folder(self, java_source_code):
        try:
            # print("Java code recd in folder funcion ---------", java_source_code)
            class_name = self.find_class_name(java_source_code)
            self.save_classname_folder(java_source_code, class_name)
        
        except Exception as e:
            print(f"An error occurred: {e}")

    def find_class_name(self, file_content):
        """
        Find the class name in the given Java file content.
        """
        # print("File Content received :", file_content)
        # Regex to find a class name in Java
        class_pattern = re.compile(r'\bclass\s+(\w+)\b')
        match = class_pattern.search(file_content)
        
        if match:
            return match.group(1)
        else:
            raise ValueError("No class name found in the provided Java source code.")

    def save_classname(self, file_content, class_name):
        """
        Save the Java file content as classname.java
        """
        sub_path = "src/main/java/com/example"
        full_path = os.path.join(self.base_directory, sub_path)

        folder_path = full_path
        self.utils.delete_folder(folder_path)

        filename = f"{class_name}.java"

        self.utils.save_file(folder_path, filename, file_content)
  
        print(f"File saved as '{filename}'.")

    def save_classname_folder(self, file_content, class_name):
        """
        Save the Java file content as classname.java
        """
        sub_path = "src/main/java/com/example"
        full_path = os.path.join(self.folder_base_directory, sub_path)

        folder_path = full_path
        # self.utils.delete_folder(folder_path)

        filename = f"{class_name}.java"

        self.utils.save_file(folder_path, filename, file_content)
  
        print(f"File saved as '{filename}'.")

    def save_classname_testcase(self, file_content, class_name):
        """
        Save the Java file content as classname.java
        """
        sub_path = "src/test/java/com/example"
        full_path = os.path.join(self.base_directory, sub_path)

        folder_path = full_path
        self.utils.delete_folder(folder_path)

        filename = f"{class_name}.java"
        self.utils.save_file(folder_path, filename, file_content)

    def save_classname_testcase_folder(self, file_content, class_name):
        """
        Save the Java file content as classname.java
        """
        sub_path = "src/test/java/com/example"
        full_path = os.path.join(self.folder_base_directory, sub_path)

        folder_path = full_path
        # self.utils.delete_folder(folder_path)

        filename = f"{class_name}.java"
        self.utils.save_file(folder_path, filename, file_content)

    def handle_test_case(self, java_source_code):
        try:
            if 'public' not in java_source_code:
                if 'class' in java_source_code:
                    java_source_code = java_source_code.replace('class', 'public class')
                if 'void' in java_source_code:
                    java_source_code = java_source_code.replace('void', 'public void')

            class_name = self.find_class_name(java_source_code)
            self.save_classname_testcase(java_source_code, class_name)
        
        except Exception as e:
            print(f"An error occurred: {e}")

    def handle_test_case_folder(self, java_source_code):
        try:
            if 'public' not in java_source_code:
                if 'class' in java_source_code:
                    java_source_code = java_source_code.replace('class', 'public class')
                if 'void' in java_source_code:
                    java_source_code = java_source_code.replace('void', 'public void')

            class_name = self.find_class_name(java_source_code)
            self.save_classname_testcase_folder(java_source_code, class_name)
        
        except Exception as e:
            print(f"An error occurred: {e}")

    def copy_pom_file(self, src, dst):
        try:
            shutil.copy(src, dst)
        except Exception as e:
            print(f"An error occurred while copying the pom file: {e}")

    # Function to generate testcases from folder
    def generate_testcases_from_folder(self, source_codes):

        self.load_model()

        generated_code = {}
        for name, content in source_codes:
            # Save each input file
            instruction = f"""### Instruction
            You are a powerful model. You are given a input source code in java language.
            Your job is to output the unit test cases along with respective import and package headers for given java code below 
            ### Text
            {content}
            ### Response
            """
            output = self.tiny_pipeline(instruction, return_full_text=False, **self.generation_kwargs)
            code_output = output[0]['generated_text']
            generated_code[name] = {'testcase': code_output}

        del self.tiny_pipeline
        del self.model
        del self.tokenizer
        torch.cuda.empty_cache()

        return generated_code
    
    #Function to build testcases from folder
    def build_testcases_from_folder(self, source_files,test_files):
        # print("==========source Files===========", source_files)
        # print("==========Test Files==========", test_files)
        try:

            for file in source_files:
                content = file['content']
                self.handle_java_code_folder(content)
        

            for file_path, content in test_files.items():
                self.handle_test_case_folder(content)

            # Copy POM file to the base directory
            self.copy_pom_file(self.pom_file_path, self.folder_base_directory)
            
            # Run Maven commands to build and test
            command = f"cd {self.folder_base_directory}/ && mvn clean test && mvn jacoco:report"
            
            process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

            output_lines = process.stdout.strip()
            error_lines = process.stderr.strip()
            # print("Output Lines ", output_lines)
            # print("Error Lines ", error_lines)

            conv = Ansi2HTMLConverter()
            html_output = conv.convert(process.stdout)
            # print("HTML Output: ", html_output)
            html_err = conv.convert(process.stderr)
            # print("HTML Error: ", html_err)

            if process.returncode==0 or "passed" in output_lines:

                report_folder_path = os.path.join(self.folder_base_directory, "target", "site", "jacoco")

                test_cases_path = os.path.join(self.folder_base_directory, "src","test","java","com","example")
                # print("Java coverage report folder path :", report_folder_path)
                return report_folder_path, test_cases_path

            else:
                return {
                    'success': False,
                    'error': 'Test execution failed',
                    'stdout': output_lines,
                    'stderr': error_lines
                }, None
         
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'stdout': '',
                'stderr': ''
            }
