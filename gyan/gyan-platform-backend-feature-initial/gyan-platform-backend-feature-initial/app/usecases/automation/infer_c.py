import nltk
import zipfile 
import io
import os
import json
from nltk.tokenize import word_tokenize
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline
from flask import jsonify, request
from fastapi.responses import HTMLResponse
import torch
import time
import shutil
import subprocess

from app.usecases.automation.utils.automation_utils import Automation_Utils

class C_UTC:
    def __init__(self):
            self.utils = Automation_Utils()

            with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)
            
            self.file_path = self.data["use_case"]["automation_c"]["files_path"]
            self.assets_path = self.data["use_case"]["automation_c"]["assets_path"]
            self.output_folder = self.data["use_case"]["automation_c"]["output_folder"]
            self.model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"
         
    
    def count_tokens_nltk(self, file_path):
        with open(file_path, 'r', encoding='utf-8') as file:
            content = file.read()
        tokens = word_tokenize(content)
        return len(tokens)
        
    def initialize_model_pipeline(self):
        # Clear CUDA cache
        torch.cuda.empty_cache()
        torch.cuda.memory.empty_cache()
        device_map = {"": 0}  # Assign to GPU 0
       
        try:
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_name,
                torch_dtype=torch.bfloat16,  # Optimized memory usage
                load_in_4bit=True,           # 4-bit precision loading
                low_cpu_mem_usage=True,      # Reduce CPU memory usage
                device_map=device_map,
                token = "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"
        
            )

            self.tokenizer = AutoTokenizer.from_pretrained(self.model_name)

            self.pipe = pipeline(
                task="text-generation", 
                model=self.model, 
                tokenizer=self.tokenizer, 
                do_sample=True, 
                top_k=1,
                temperature=0.1,
                top_p=0.95,
                num_return_sequences=1,
                eos_token_id=self.tokenizer.eos_token_id
            )

        except Exception as e:
            print(f"Error loading local model: {e}")
            raise ValueError(f"Could not load model: {self.model_name}")
        
    def unload_model(self):
        del self.pipe
        del self.model
        del self.tokenizer
        torch.cuda.empty_cache()
    
    # Function to generate code description
    def generate_code_description(self, source_code):

        description_prompt = f"""
        ## Instruction:
        Analyze the following C code and provide a comprehensive description of the file. Focus on the following aspects:

        1. **File Purpose and Overall Functionality**: Explain the main purpose of the file and how its functions and components contribute to the program.
        2. **Functions and Methods**: Describe each function and method, their roles, and how they interact with other parts of the code.
        3. **Key Data Structures and Variables**: Identify and explain the key data structures, types, and important variables used in the file.
        4. **Input Parameters**: For each function, provide an explanation of the input parameters and their significance.
        5. **Return Values**: Explain what each function returns and the meaning of those return values.
        6. **Core Operations and Algorithms**: Outline any significant operations, algorithms, or logic that are central to the functionality of the file.
        7. **Error Handling**: Discuss how errors are managed or handled in the file.
        8. **Dependencies**: Identify any dependencies on other functions, libraries, or external resources.
        9. **Edge Cases and Special Conditions**: Highlight how the file handles edge cases or unusual conditions.
        10. **Performance and Optimization**: Discuss any performance considerations or optimizations made in the code.
        11. **Concurrency Considerations**: If applicable, mention any concurrency aspects or threading mechanisms used.

        Provide a thorough description to serve as the basis for understanding and testing the C file.

        ## C code to analyze:
        {source_code}
        """
# 
        # Generate the description
        description_result = self.pipe(description_prompt, max_new_tokens=700)
        description_text = description_result[0]['generated_text'].replace(description_prompt, ' ')
        return description_text

    
    # ================= for file==========================================
    # Function to generate test cases based on the request and model pipeline
    def generate_testcases_file(self, source_code, prompt_lib, prompt_text):
        try:
            # Initialize the model pipeline
            print("Initializing model pipeline...")
            self.initialize_model_pipeline()

        except Exception as e:
            print(f"Error initializing pipeline: {e}")
            raise RuntimeError("Failed to initialize pipeline. Ensure the model path is correct.")

        if prompt_lib == '.':
            # No prompt library provided, default to Section 1
            # print("No prompt library provided, generating code directly...")
            prompt_lib_text = "Write only one unit test case for this C code. Cover only 30% part of the code {code_snippet}"
            prompt = prompt_lib_text.replace('{code_snippet}', source_code)
            result = self.pipe(prompt, max_new_tokens=512)
            generated_code = result[0]['generated_text'].replace(prompt, ' ')

            self.unload_model()
            
            # print("No Prompt:", generated_code)
            return generated_code

        elif '{code_description}' in prompt_text and '{code_snippet}' in prompt_text:
        
            description_text = self.generate_code_description(source_code)

            prompt = prompt_text.replace('{code_description}', description_text).replace('{code_snippet}', source_code)
            
            # Initialize the model pipeline
            try:
                result = self.pipe(prompt, max_new_tokens=2048)
                generated_code = result[0]['generated_text'].replace(prompt, ' ')
                self.unload_model()
                return generated_code

            except Exception as e:
                print(f"Error generating testcases: {e}")
                raise RuntimeError(f"Failed to generate test cases - {e}")

        elif '{code_snippet}' in prompt_text and '{code_description}' not in prompt_text:
            print("Normal prompt selected, generating code with prompt library...")

            try:
                prompt = prompt_text.replace('{code_snippet}', source_code)
                result = self.pipe(prompt, max_new_tokens=1024)
                
                generated_code = result[0]['generated_text'].replace(prompt, ' ')
                # print("Gen prompt", generated_code)
                self.unload_model()
                return generated_code


            except Exception as e:
                print(f"Error generating test cases - {e}")
                raise RuntimeError(f"Failed to generate code - {e}")

           
        else:
            return 'Error - Invalid prompt library format'
        

    def build_file_testcases(self, source_code, test_code):
        program_file = "program.c"
        self.test_code_dir = f'{self.file_path}/Test_Codes'
        os.makedirs(self.test_code_dir, exist_ok = True)
        test_file =f"{self.test_code_dir}/program_test.c"

        self.utils.save_file(self.file_path, program_file, source_code)
        self.utils.save_file(self.test_code_dir, test_file, test_code)

        command = (
        f'cd {self.file_path}/ && gcc -o program_test program.c {self.test_code_dir}/program_test.c && ./program_test'
    )

        try:
            # Run the subprocess command
            completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
         
            output_lines = completed_process.stdout.splitlines()
            error_lines = completed_process.stderr.splitlines()
            # print("output_lines",completed_process.stdout)
            # print("error_lines",completed_process.stderr)

            if completed_process.returncode != 0 or error_lines or "error:" in output_lines:
                return {
                    'success': False,
                    'error': 'Build failed due to compilation or runtime error',
                    'stdout': output_lines,
                    'stderr': error_lines
                }, None


            # # Analyze the output
            results = []
            for line in output_lines:
                # Example parsing; adjust according to your test output format
                if 'passed' in line:
                    results.append(f"Test case passed: {line.strip()}")
                elif 'failed' in line:
                    results.append(f"Test case failed: {line.strip()}")

            # Add errors if any
            if error_lines:
                results.append('Errors encountered during test execution:')
                results.extend(error_lines)

            
            # # If no results, indicate all tests passed
            if not results:
                results.append('All test cases passed!')

            # Print results for debugging
            print("Test Results:", completed_process.stdout)

            test_cases_path = self.test_code_dir

            output = "\n".join(results)
            print("==========Output===========", output)
            if "passed" in output.lower():
                print("Going to coverage report function")
                report_path = self.code_coverage_file()
                return report_path, test_cases_path
            
            return {
            'success': False,
            'error': 'Test execution failed',
            'stdout': output_lines,
            'stderr': error_lines
        }, None

        except Exception as e:
            print(f"Exception {e}")
            return f"Error - {e}"


    def code_coverage_file(self):
        coverage_dir = os.path.join(self.file_path, "coverage")
        os.makedirs(coverage_dir, exist_ok=True)
        # print("Made coverage directory", coverage_dir)
        # Step 1: Compile, run tests, and generate coverage files
        command = f"cd {self.file_path} && gcc -fprofile-arcs -ftest-coverage -o program_test program.c {self.test_code_dir}/program_test.c && ./program_test"
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        # print("Output of report command:", completed_process)
        
        # Check for any errors during test execution
        if completed_process.returncode != 0:
            return f"Error during test execution: {completed_process.stderr}"

        # Step 2: Generate lcov report
        command = f"cd {self.file_path}/ && lcov --capture --directory . --output-file coverage/coverage.info && genhtml coverage/coverage.info --output-directory coverage/html"
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if completed_process.returncode != 0:
            return f"Error during coverage generation: {completed_process.stderr}"
        
        report_folder_path = coverage_dir
        # print("Report Folder path :", report_folder_path)
        return report_folder_path

    def copy_coverage_to_reports(self, source_dir):
        destination_dir = self.base_static_dir
        print("Source Directory:", source_dir)
        print("Destination Directory:", destination_dir)

        # Remove existing directory if it exists to prevent conflicts
        if os.path.exists(destination_dir):
            shutil.rmtree(destination_dir)

        source_html_dir = os.path.join(source_dir, "html")  

        if os.path.exists(source_html_dir):  
            shutil.copytree(source_html_dir, destination_dir, dirs_exist_ok=True)
        else:
            print(f"Error: {source_html_dir} does not exist!")

        # Generate the URL for accessing the report
        coverage_url = f"http://localhost:8020/coverage_report/index.html"
        
        print(f"Coverage report copied to: {destination_dir}")
        print(f"Coverage report URL: {coverage_url}")

        return coverage_url


    # ===============for Folder==================================================
    def process_files_and_generate_test_cases(self, source_files, prompt_lib, prompt_text):
        try:
            # Initialize the model pipeline
            print("Initializing model pipeline...")
            self.initialize_model_pipeline()
            
            descriptions = {}
            generated_code = {}

            # Create Code Descriptions
            for name, content in source_files:
                # Create & store descriptions
                description_text = self.generate_code_description(content)
                descriptions[name] = {'code': content, 'desc' : description_text}

            print("###################### Completed descriptions")

            # Generate testcases using descriptions
            for filename, data in descriptions.items():
                code = data['code']
                desc_text = data['desc']

                prompt = prompt_text.replace('{code_description}', desc_text).replace('{code_snippet}', code)

                result = self.pipe(prompt, max_new_tokens=4096)
                test_case = result[0]['generated_text'].replace(prompt, " ")
                generated_code[filename] = {'testcase' : test_case}

            # print("Descriptions ----------------- \n", descriptions)
            # print("Generated Codes --------------------- \n", generated_code)
            
            self.unload_model()
            return generated_code
        
        except Exception as e:
            print(f"Error in generation: {e}")
            raise RuntimeError(f"Failed to generate test cases. Error details - {e}")

    def build_folder_testcases(self, source_files, test_files):
        #save source files
        for file in source_files:
            filename = os.path.basename(file["name"])  # Remove any directory structure
            file_path = os.path.join(self.output_folder, filename)

            # Write source file content
            with open(file_path, "w") as f:
                f.write(file["content"])

            # print(f"Saved source file: {file_path}")

        # print("========== Saving Test Files ==========")
            
        # Save test files
        for test_name, test_content in test_files.items():
            filename = os.path.basename(test_name)  # Remove any directory structure
            name_parts = os.path.splitext(filename)  # Split name and extension
            test_filename = f"{name_parts[0]}_test{name_parts[1]}"  # Append `_test`
            test_code_dir = f'{self.output_folder}/Test_Codes'
            os.makedirs(test_code_dir, exist_ok = True)

            file_path = os.path.join(test_code_dir, test_filename)

            # Write test file content
            with open(file_path, "w") as f:
                f.write(test_content)

            # print(f"Saved test file: {file_path}")
        
        # Copy build script and Makefile
        build_script_path = f'{self.assets_path}/builder/build.sh'
        makefile_path = f'{self.assets_path}/builder/Makefile'
        
        try:
            # Copy build.sh
            shutil.copy2(build_script_path, self.output_folder)
            # print(f"Copied {build_script_path} to {self.output_folder}")

            # Copy Makefile
            shutil.copy2(makefile_path, self.output_folder)
            # print(f"Copied {makefile_path} to {folder_path}")

            # Set execute permissions for build.sh
            command_chmod = f'chmod +x {os.path.join(self.output_folder, "build.sh")}'
            subprocess.run(command_chmod, shell=True, check=True)
            # print(f"Set execute permissions for build.sh")

            # Build and test C files
            command = f'cd {self.output_folder} && ./build.sh'
            print(f"Executing command: {command}")

            # Run the subprocess command
            completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            error_lines = completed_process.stderr.splitlines()
            output_lines = completed_process.stdout.splitlines() + completed_process.stderr.splitlines()
        
            if completed_process.returncode != 0 or error_lines or "error:" in output_lines:
                return {
                    'success': False,
                    'error': 'Build failed due to compilation or runtime error',
                    'stdout': output_lines,
                    'stderr': error_lines
                }, None
        
            # Parse test results
            test_results = self.parse_test_results(output_lines)
            test_cases_path = f'{self.output_folder}/Test_Codes'
            
            # Generate report if tests passed
            if any("passed" in result.lower() for result in test_results):
                # print("Tests passed, generating coverage report")
                report_path = self.code_coverage_folder(self.output_folder)
                return report_path, test_cases_path
            
            return {
            'success': False,
            'error': 'Test execution failed',
            'stdout': output_lines,
            'stderr': error_lines
        }, None
            
        except Exception as e:
            print('Exception:', e)
            return f"Error - {str(e)}"

    def parse_test_results(self, output_lines):
            # Parse the test results from output lines (Customize based on your output format)
            test_results = {"passed": 0, "failed": 0, "details": []}
            for line in output_lines:
                if "PASSED" in line:
                    test_results["passed"] += 1
                elif "FAILED" in line:
                    test_results["failed"] += 1
                    test_results["details"].append(line)
            return test_results
    
    def code_coverage_folder(self, folder_path=None):
        coverage_dir = os.path.join(self.output_folder, "coverage")
        os.makedirs(coverage_dir, exist_ok=True)

        # Copy build files
        file1_path = f'{self.assets_path}/builder/coverage_command.sh'
        file2_path = f'{self.assets_path}/builder/Makefile'

        try:
            shutil.copy2(file1_path, folder_path)
            shutil.copy2(file2_path, folder_path)
        except Exception as e:
            return f"Error: Failed to copy build scripts: {str(e)}"

        # Build the C program with coverage flags using the coverage.sh script
        build_command = f'cd {folder_path} && chmod +x coverage_command.sh && ./coverage_command.sh'
        completed_process = subprocess.run(build_command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if completed_process.returncode != 0:
            return f"Error: Failed to build program with coverage flags: {completed_process.stderr}"
        
        report_path = f'{coverage_dir}/html'
        return report_path




