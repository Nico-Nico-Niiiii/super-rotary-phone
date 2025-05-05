import os
import subprocess
import torch
import json
from flask import jsonify
import time
import io 
from bs4 import BeautifulSoup
import shutil
import zipfile
import re
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

class GoUTC:
    
    def __init__(self):
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
            self.data = json.load(file)
        
        self.file_path = self.data["use_case"]["automation_go"]["files_path"]
        self.folder_path = self.data["use_case"]["automation_go"]["output_folder"]
        
        self.program_path = f'{self.file_path}/Program.go'
        self.test_dir = f'{self.file_path}/Test_Codes'
        self.test_folder_dir = f'{self.folder_path}/Test_Codes'
        self.program_test_path =  f'{self.test_dir}/Program_test.go'
        self.assets_path = self.data["use_case"]["automation_go"]["assets_path"]
        # self.logs_path = self.data["use_case"]["automation_go"]["logs_path"]
    
        self.model_name = "meta-llama/Meta-Llama-3.1-8B-Instruct"

    def load_model(self):
        torch.cuda.empty_cache()
        # device_map = {"": 0}

        self.model = AutoModelForCausalLM.from_pretrained(self.model_name, torch_dtype=torch.float16, 
                                                    load_in_4bit=True,
                                                    low_cpu_mem_usage=True,
                                                    device_map={"": 0},
                                                    token='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')
        
        self.tokenizer = AutoTokenizer.from_pretrained(self.model_name, token='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')

        self.pipe = pipeline(task="text-generation", model=self.model, tokenizer=self.tokenizer,torch_dtype=torch.float16, device_map="auto", token='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', do_sample=True, top_k=1, temperature=0.1, top_p=0.95, num_return_sequences=1)

    def unload_model(self):
        del self.pipe
        del self.model
        del self.tokenizer
        torch.cuda.empty_cache()

    def generate_testcase_file(self, source_code, prompt_lib, prompt_text):

        self.load_model()
        
        if prompt_lib == '.':
            print("Generating without prompt")
            prompt_lib_text = "Write only one unit test case for this Go code. cover only 30% part of the code {code_snippet}"
            prompt = prompt_lib_text.replace('{code_snippet}', source_code)
            result = self.pipe(prompt, max_new_tokens=512)
            generated_code = result[0]['generated_text'].replace(prompt, ' ')
            # print("Generated code: ", generated_code)
            self.unload_model()
            return generated_code
        

        elif '{code_description}' in prompt_text and '{code_snippet}' in prompt_text:
            print("Generating with description")
            
            description_prompt = prompt_text.replace('{code_snippet}', source_code)
            description_result = self.pipe(description_prompt, max_new_tokens=700)
            description_text = description_result[0]['generated_text'].replace(description_prompt, ' ')

            prompt = prompt_text.replace('{code_description}', description_text).replace('{code_snippet}', source_code)
            result = self.pipe(prompt, max_new_tokens=2048)
            generated_code = result[0]['generated_text'].replace(prompt, ' ')
            self.unload_model()
            return generated_code

        elif '{code_snippet}' in prompt_text and '{code_description}' not in prompt_text:
            prompt = prompt_text.replace('{code_snippet}', source_code)
            result = self.pipe(prompt, max_new_tokens=1023)
            generated_code = result[0]['generated_text'].replace(prompt, ' ')
            self.unload_model()
            return generated_code
        
        else:
            return 'Invalid prompt library format'

    def generate_code_description(self, code):
        description_prompt = """
        ## Instruction:
        Analyze the following Go code and provide a comprehensive description of the file. Focus on the following aspects:

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

        ## Go code to analyze:
        {code_snippet}
        """

        description_prompt = description_prompt.replace('{code_snippet}', code)
        description_result = self.pipe(description_prompt, max_new_tokens=700)
        description_text = description_result[0]['generated_text'].replace(description_prompt, ' ')

        return description_text


    def generate_testcases_folder(self, source_files, prompt_lib, prompt_text): 

        try:       
            self.load_model()

            descriptions = {}
            generated_code = {}

            for name, content in source_files:
                description_text = self.generate_code_description(content)
                descriptions[name] = {'code' : content, 'desc' : description_text}

            print(" ################ Completed descriptions")

            for filename, data in descriptions.items():
                code = data['code']
                desc_text = data['desc']

                prompt = prompt_text.replace('{code_description}', desc_text).replace('{code_snippet}', code)

                result = self.pipe(prompt, max_new_tokens=4096)
                test_case = result[0]['generated_text'].replace(prompt, " ")
                generated_code[filename] = {'testcase' : test_case}

            self.unload_model()
            return generated_code
        
        except Exception as e:
            print(f"Error in generation: {e}")
            raise RuntimeError(f"Failed to generate test cases. Error details - {e}")

    def build_test_cases(self, source_code, generated_code):
    # Write the source code to the program path
        
        os.makedirs(os.path.dirname(self.program_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.program_test_path), exist_ok=True)
        with open(self.program_path, 'w') as file:
            file.write(source_code)

        # Write the generated test code to the test program path
        with open(self.program_test_path, 'w') as file:
            file.write(generated_code)

        # Temporarily copy test file to source directory
        temp_test_path = os.path.join(self.file_path, 'Program_test.go')
        shutil.copy(self.program_test_path, temp_test_path)

        print("running build command")
        # Command to execute Go tests
        command = f'cd {self.file_path}/ && go test -v Program.go Program_test.go'
        
        try:
            # Run the command and capture the output and errors
            completed_process = subprocess.run(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )
    
            output_lines = completed_process.stdout.splitlines(),  # Return output as an array of lines
            error_lines = completed_process.stderr.splitlines() if completed_process.stderr else None  # Split errors into line

             # Remove the temporary test file
            os.remove(temp_test_path)
            
            if completed_process.returncode != 0 or error_lines or "error:" in output_lines:
                return {
                    'success': False,
                    'error': 'Build failed due to compilation or runtime error',
                    'stdout': output_lines,
                    'stderr': error_lines
                }, None
            
            else:
                print("Build successful, generating report")
                report_path = self.code_coverage_report()
                if not report_path:
                    return {'error': ['Coverage report generation failed']}, None
                test_cases_path = self.test_dir
                print("Test Cases Path :", test_cases_path)
                return report_path, test_cases_path
    
        except Exception as e:
            return {'error': [str(e)]}, None # Wrap error in an array for consistent format


    def code_coverage_report(self):
        temp_test_path = os.path.join(self.file_path, 'Program_test.go')
        shutil.copy(os.path.join(self.test_dir, 'Program_test.go'), temp_test_path)

        command = f"""cd {self.file_path} && go test -coverprofile=program_cover Program.go Program_test.go"""
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        output_lines = completed_process.stdout.splitlines() # Return output as an array of lines
        error_lines = completed_process.stderr.splitlines() if completed_process.stderr else None  # Split errors into line
        print("Output Lines :", output_lines)
        print("Error Lines :", error_lines)

        if completed_process.returncode != 0:
            print("Coverage report generation failed!")
            return None

        command = f"""cd {self.file_path} && go tool cover -html=program_cover -o coverage.html"""
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        output_lines = completed_process.stdout.splitlines(),  # Return output as an array of lines
        error_lines = completed_process.stderr.splitlines() if completed_process.stderr else None  # Split errors into line
        print("Output Lines :", output_lines)
        print("Error Lines :", error_lines)

        if completed_process.returncode != 0:
            print("Coverage report generation failed!")
            return None

        coverage_file_path = f"{self.file_path}/coverage.html"
        os.remove(temp_test_path)

        return coverage_file_path

    
    def build_folder_testcases(self, source_files, test_files):
        os.makedirs(self.test_folder_dir, exist_ok = True)

        #saving source files
        for file in source_files:
            filename = os.path.basename(file["name"])
            #Remove any directory structure
            file_path = os.path.join(self.folder_path, filename)

            #writing source file content
            with open(file_path, "w") as f:
                f.write(file["content"])

        #saving test files
        for test_name, test_content in test_files.items():
            filename = os.path.basename(test_name)

            #Remove any unwanted directory
            name_parts = os.path.splitext(filename)

            #split name and extension
            test_filename = f"{name_parts[0]}_test{name_parts[1]}"
            file_path = os.path.join(self.test_folder_dir, test_filename)

            #write test_file content
            with open(file_path, "w") as f:
                f.write(test_content)

        # copying test files to main dir
        for test_filename in os.listdir(self.test_folder_dir):
            src_path = os.path.join(self.test_folder_dir, test_filename)
            dest_path = os.path.join(self.folder_path, test_filename)
            
            shutil.copy2(src_path, dest_path)  # Copies with metadata
            print(f"Copied {test_filename} to {self.folder_path}")

        folder_path = f'{self.folder_path}'
        file1_path = f'{self.assets_path}/go/go-build.sh'
        file2_path = f'{self.assets_path}/go/go.mod'
            
        # copied_files = []

        try:
            print("Starting build and test process in folder path")

            if not os.path.exists(folder_path):
                os.makedirs(folder_path)

            #copying go-build.sh and go.mod file

            shutil.copy2(file1_path, folder_path)
            print(f"Copied {file_path} to {folder_path}")

            # Copy Makefile
            shutil.copy2(file2_path, folder_path)
            print(f"Copied {file2_path} to {folder_path}")

            #Installing required packages
            install_commands = [
                f'cd {folder_path} && go get golang.org/x/net/proxy',
                f'cd {folder_path} && go get github.com/gorilla/websocket'
            ]

            for cmd in install_commands:
                print(f"Installing package: {cmd}")
                process = subprocess.run(cmd, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
                if process.stderr:
                    print(f"Package installation output: {process.stderr}")
            
            # Build and test
            command = f'cd {folder_path} && go build ./... && go test -v ./...'
            print(f"Executing build command: {command}")

            process = subprocess.Popen(
                command,
                shell=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=1,
                universal_newlines=True
            )

            stdout_lines = []
            stderr_lines = []

            while True:
                stdout_line = process.stdout.readline()
                stderr_line = process.stderr.readline()
                
                if stdout_line:
                    print(f"BUILD OUTPUT: {stdout_line.strip()}")
                    stdout_lines.append(stdout_line.strip())
                if stderr_line:
                    print(f"BUILD ERROR: {stderr_line.strip()}")
                    stderr_lines.append(stderr_line.strip())
                
                if process.poll() is not None and not stdout_line and not stderr_line:
                    break

            exit_code = process.wait()
            print(f"Build process completed with exit code: {exit_code}")

            if process.returncode != 0 or stderr_lines or "error:" in stdout_lines:
                return {
                    'success': False,
                    'error': 'Build failed due to compilation or runtime error',
                    'stdout': stdout_lines,
                    'stderr': stderr_lines
                }, None
            
            else:
                test_cases_path = self.test_folder_dir
                print("Test Cases Path :", test_cases_path)
                report_path = self.code_coverage_report_folder(folder_path)
                if not report_path:
                    return {'error': ['Coverage report generation failed']}, None
                return report_path, test_cases_path
        
        except Exception as e:
            print(f"Error during execution: {str(e)}")
            return {'error': [str(e)]}
        
    def code_coverage_report_folder(self, folder_path):
        command = f'cd {folder_path} && go get golang.org/x/net/proxy &&  go get github.com/gorilla/websocket && go test -coverprofile=program_cover .'
        print(command)
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        if completed_process.returncode != 0:
            return ({"error": "Failed to run tests", "details": completed_process.stderr}), 500

        # Generate HTML coverage report
        command = f'cd {folder_path} && go tool cover -html=program_cover -o coverage.html'
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print(command)
        if completed_process.returncode != 0:
            return ({"error": "Failed to generate coverage report", "details": completed_process.stderr}), 500

        coverage_file_path = f"{self.folder_path}/coverage.html"

        # Remove copied test files from source folder
        for test_filename in os.listdir(self.test_folder_dir):
            copied_file_path = os.path.join(self.folder_path, test_filename)
            if os.path.exists(copied_file_path):
                os.remove(copied_file_path)
                print(f"Removed temporary file: {test_filename}")

        return coverage_file_path
    







        










































    def zip_folder(self, folder_path):
        # Create a BytesIO object to store the zip in memory
        zip_stream = io.BytesIO()

        # Create a ZipFile object
        with zipfile.ZipFile(zip_stream, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            # Walk through the folder and add files to the zip
            for root, dirs, files in os.walk(folder_path):
                for file in files:
                    file_path = os.path.join(root, file)
                    # Add file to the zip with relative path
                    arcname = os.path.relpath(file_path, start=folder_path)
                    zip_file.write(file_path, arcname=arcname)

        # Move the pointer to the beginning of the stream
        zip_stream.seek(0)
        return zip_stream
    
    def generate_coverage_reports(self,root_folder):
        """Generate coverage reports for all Go packages in the project."""
        # print("Generating coverage reports...")
        
        failed_folders = []
        
        for root, dirs, files in os.walk(root_folder):
            if any(file.endswith(".go") for file in files):
                # print(f"Generating coverage for: {root}")
                original_dir = os.getcwd()
                os.chdir(root)
                try:
                    result = subprocess.run(["go", "test", "-coverprofile=coverage"], 
                                            capture_output=True, text=True, check=True)
                    subprocess.run(["go", "tool", "cover", "-html=coverage", "-o", "coverage.html"], check=True)
                    # print(f"Coverage generated successfully for {root}")
                except subprocess.CalledProcessError as e:
                    # print(f"Error generating coverage for {root}:")
                    # print(f"Exit code: {e.returncode}")
                    # print(f"Standard output:\n{e.stdout}")
                    # print(f"Standard error:\n{e.stderr}")
                    failed_folders.append(root)
                finally:
                    if os.path.exists("coverage"):
                        os.remove("coverage")
                    os.chdir(original_dir)
        
        return failed_folders

    def parse_coverage_reports(self,root_folder):
        """Parse all coverage.html files and extract coverage data."""
        all_coverage_data = []
        
        for root, dirs, files in os.walk(root_folder):
            if "coverage.html" in files:
                folder_coverage = self.parse_coverage_html(root)
                if folder_coverage:
                    all_coverage_data.append((root, folder_coverage))
        
        return all_coverage_data

    def parse_coverage_html(self,folder_path):
        """Parse a single coverage.html file and extract coverage data."""
        # print("\nParsing coverage reports...")
        html_path = os.path.join(folder_path, "coverage.html")
        try:
            with open(html_path, "r") as f:
                soup = BeautifulSoup(f, 'html.parser')
            
            coverage_data = []
            select_element = soup.find('select', {'id': 'files'})
            if select_element:
                for option in select_element.find_all('option'):
                    file_path = option['value']
                    coverage_text = option.text
                    match = re.search(r'(.*?)\s+\(([\d.]+)%\)', coverage_text)
                    if match:
                        file_name = os.path.basename(match.group(1))
                        coverage_percentage = float(match.group(2))
                        coverage_data.append((file_name, coverage_percentage))
          
            return coverage_data
        
        except Exception as e:
            print(f"Error parsing coverage HTML for {folder_path}: {e}")
            return None

    def print_coverage_report(self,coverage_data, failed_folders):
        """Print a formatted coverage report."""
        for folder, data in coverage_data:
            print(f"\nCoverage for {folder}:")
            for file_name, coverage in data:
                print(f"  {file_name}: {coverage:.1f}%")
        
        if failed_folders:
            print("\nFolders where coverage generation failed:")
            for folder in failed_folders:
                print(f"  {folder}")

    def count_lines_in_file(self,file_path):
        """Count the number of lines in a file."""
        try:
            with open(file_path, 'r', encoding='utf-8') as file:
                return sum(1 for line in file)
        except Exception as e:
            print(f"Error counting lines in {file_path}: {e}")
            return 0

    def format_coverage_data_as_list(self,coverage_data):
        """
        Format coverage data as a list of tuples (full_folder_path, file_name, percentage, lines).
        """
        formatted_data = []
        for folder, files_data in coverage_data:
            for file_name, percentage in files_data:
                full_file_path = os.path.join(folder, file_name)
                lines = self.count_lines_in_file(full_file_path)
                formatted_data.append((folder, file_name, percentage, lines))
        return formatted_data

    def format_coverage_data_as_dict(self,coverage_data,root_folder):
        """
        Format coverage data as a nested dictionary with the required structure.
        """
        formatted_data = {}
        for folder, files_data in coverage_data:
            relative_folder = os.path.relpath(folder, root_folder)
            folder_key = "." if relative_folder == "." else relative_folder.replace(os.path.sep, "/")
            
            if folder_key not in formatted_data:
                formatted_data[folder_key] = []
            
            for file_name, percentage in files_data:
                full_file_path = os.path.join(folder, file_name)
                lines = self.count_lines_in_file(full_file_path)
                file_info = {
                    "name": file_name,
                    "lines": lines,  
                    "coverage": round(percentage, 1)
                }
                formatted_data[folder_key].append(file_info)
        
        # Add empty lists for folders without .go files
        
        for root, dirs, files in os.walk(root_folder):
            relative_path = os.path.relpath(root, root_folder)
            folder_key = "." if relative_path == "." else relative_path.replace(os.path.sep, "/")
            if folder_key not in formatted_data:
                formatted_data[folder_key] = []
        
        return formatted_data

    def generate_coverage_report_html(self,coverage_data, template_path=None, output_path=None):
        """
        Generate a complete HTML report file with the coverage data included, using an external template file.
        
        :param coverage_data: The JSON data containing coverage information
        :param template_path: Path to the HTML template file
        :param output_path: Path where the generated HTML report should be saved
        """

        # Read the template file
        if template_path is None:
            template_path = self.html_paths
        
        
        if output_path is None:
            output_path = f'{self.logs_path}/Output/'

        if os.path.isdir(output_path):
            output_path = os.path.join(output_path, 'coverage_report.html')


        with open(template_path, 'r', encoding='utf-8') as template_file:
            html_content = template_file.read()
        
        # Convert the coverage data to a JSON string
        json_data = json.dumps(coverage_data)
        
        # Replace the placeholder in the template with the actual data
        updated_content = html_content.replace('const rawData = {}', f'const rawData = {json_data}')
    
        # Write the updated content to the output file
        try:
            with open(output_path, 'w', encoding='utf-8') as output_file:
        
                output_file.write(updated_content)
        
        except Exception as e:
            print(f"Failed to write to output file: {e}")
            return
        
        

    def coverage_report_nested_folder(self):
        root_folder = f'{self.logs_path}/Output/'
        
        failed_folders = self.generate_coverage_reports(root_folder)
        
        coverage_data = self.parse_coverage_reports(root_folder)
        print("\nFull Coverage Report:")
        self.print_coverage_report(coverage_data, failed_folders)

        formatted_data = self.format_coverage_data_as_dict(coverage_data,root_folder)
        
        print("\nCoverage Data as Dictionary:")
        print(json.dumps(formatted_data, indent=2))

        # Generate HTML report
        self.generate_coverage_report_html(formatted_data)

        return formatted_data