from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
import torch
import logging
import nltk
import zipfile 
import io
import os
import json
import shutil
import subprocess
from datetime import datetime

from app.usecases.automation.utils.automation_utils import Automation_Utils
from app.usecases.automation.utils.cpp_utils import CPP_Utils

class CPP_UTC:
    def __init__(self):
        self.utils = Automation_Utils()
        self.cpp_utils = CPP_Utils()

        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
            self.data = json.load(file)

        self.model_id = self.data["use_case"]["automation_cpp"]["model_path"]
        self.file_path = self.data["use_case"]["automation_cpp"]["input_file"]
        self.folder_path = self.data["use_case"]["automation_cpp"]["input_folder"]
        self.asset_path = self.data["use_case"]["automation_cpp"]["assets_path"]
        self.folder_assets_path = self.data["use_case"]["automation_cpp"]["folder_assets_path"]
        

    def load_model(self):
        try:
            self.tokenizer = AutoTokenizer.from_pretrained("meta-llama/Meta-Llama-3.1-8B-Instruct", trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                "meta-llama/Meta-Llama-3.1-8B-Instruct",
                load_in_8bit = True,
                torch_dtype="auto",
                device_map={"": 0},
                trust_remote_code=True
            )
            self.tiny_pipeline = pipeline(
                "text-generation",
                model=self.model,
                tokenizer=self.tokenizer
            )
            self.generation_kwargs = {
                "max_new_tokens": 1024,
                "do_sample": True,
                "temperature": 0.1,
                "top_k": 40,
                "top_p": 0.8,
                "repetition_penalty": 1.3
            }

        except Exception as e:
            logging.error(f"Failed to initialize model: {e}")
            raise

    #v2
    def infer_model(self, text):
        instruction = f"""### Instruction
        Given the C++ code below, provide C++ Unit Test Case Code using Google Test (GTest).
        
        The test code should:
        1. Include the appropriate headers for the source code and GTest
        2. Contain at least one TEST that tests the functionality
        3. Include a main function that initializes GTest and runs all tests
        4. Follow standard GTest conventions and best practices
        5. The output **must only contain valid C++ code**—no explanations, additional text, or comments.  
        6. Don't add anything related to Java or any other language in this.
        
        ### Example Format
        #include "SourceFile.h"
        #include <gtest/gtest.h>
        
        TEST(TestSuiteName, TestName) {{
            // Test assertions here
        }}
        
        int main(int argc, char** argv) {{
            ::testing::InitGoogleTest(&argc, argv);
            return RUN_ALL_TESTS();
        }}
        
        ### C++ Code
        {text}
        
        ### Unit Test Case Code
        """
        
        try:
            output = self.tiny_pipeline(instruction, return_full_text=False, **self.generation_kwargs)
            return output[0]['generated_text'].strip()
        except Exception as e:
            logging.error(f"Failed to generate text: {e}")
            raise


    def unload_model(self):
        del self.tiny_pipeline
        del self.model
        del self.tokenizer
        torch.cuda.empty_cache()


    def infer_for_folder(self, source_files):
        self.load_model()
        # Process each file and generate test cases
        file_outputs = {}
        file_headers = {}
        
        for file_info in source_files:
            file_name = file_info['name']
            file_content = file_info['content']
            
            # Extract headers and declarations
            header_file_name = self.extract_headers_and_declarations(file_content)
            file_headers[file_name] = header_file_name
            # print("========================File headers :=============================", file_headers)
            
            # Generate test cases
            output = self.infer_model(file_content)
            file_outputs[file_name] = output   

        self.unload_model()

        return file_outputs, file_headers

    def infer_for_file(self, user_code):
        self.load_model()
        ans = self.infer_model(user_code)
        self.unload_model()

        return ans


    def clean_test_code(self, raw_test_code):
        # Remove unnecessary tokens
        cleaned_code = raw_test_code.replace("```cpp", "").replace("```", "").strip()
        return cleaned_code
    
    def create_cpp_project_structure_folder(self, project_name, files=None, outputs=None, headers=None):
        """Create a project structure for multiple C++ files."""
        if files is None:
            files = []
        if outputs is None:
            outputs = {}
        if headers is None:
            headers = {}
        
        print("=======================Headers are====================", headers)
        
        base_dir = f'{self.folder_path}/{project_name}'
        print(f"Base directory for project: {base_dir}")
        
        # Remove the existing project directory if it exists
        if os.path.exists(base_dir):
            shutil.rmtree(base_dir)
        
        # Create the main project directories
        os.makedirs(os.path.join(base_dir, "build"), exist_ok=True)
        src_dir = os.path.join(base_dir, "src")
        main_dir = os.path.join(src_dir, "main")
        test_dir = os.path.join(src_dir, "test")
        
        # include_dir = os.makedirs(os.path.join(main_dir, "include"), exist_ok=True)
        include_dir = os.path.join(main_dir, "include")  
        os.makedirs(include_dir, exist_ok=True) 
        os.makedirs(os.path.join(main_dir, "src"), exist_ok=True)
        os.makedirs(os.path.join(test_dir, "src"), exist_ok=True)
        
        
        # Create directories for each file
        for file_info in files:
            file_name = file_info['name']
            file_content = file_info['content']
            base_name = os.path.splitext(file_name)[0]
                
            # Create source file
            cleaned_file_name = os.path.basename(file_name) 
            with open(os.path.join(main_dir, "src", cleaned_file_name), 'w') as source_file:
                source_file.write(file_content)
            
            header_file = headers.get(f'cpp/{cleaned_file_name}', f"{os.path.splitext(cleaned_file_name)[0]}.h")  

            main_file_name = f'main_{cleaned_file_name}'
            with open(os.path.join(main_dir, "src", main_file_name), 'w') as main_file:
                main_file.write(f'#include "{header_file}"\n')
                main_file.write('int main() {\n')
                main_file.write('    // Main function\n')
                main_file.write('    return 0;\n')
                main_file.write('}\n')
            
            # Create test file if available
            if file_name in outputs:
                test_code = outputs[file_name]
                cleaned_test_code = self.clean_test_code(test_code)
                cleaned_file_name = os.path.basename(base_name) 
                test_file_path = os.path.join(test_dir, "src", f"{cleaned_file_name}_test.cpp")
                with open(test_file_path, 'w') as test_file:
                    test_file.write(cleaned_test_code)
        
        print(f"Multi-file project structure for {project_name} created successfully.")
        return base_dir, include_dir

    def create_cpp_project_structure(self, project_name, program_code, test_code, header_code):
        # base_dir = "/media/sahil/data1/usecases/gyan-platform-backend/user_assets/usecases/automation/Cpp/Test_Files/UTC_Project"
        base_dir = f'{self.file_path}/{project_name}'
        print("Base directory for files is :", base_dir)
        # Remove the existing UTCProject directory if it exists
        if os.path.exists(base_dir):
            shutil.rmtree(base_dir)
    
        src_dir = os.path.join(base_dir, "src")
        main_dir = os.path.join(src_dir, "main")
        test_dir = os.path.join(src_dir, "test")
        build_dir = os.path.join(base_dir, "build")  
    
    
        # Create directories
        os.makedirs(os.path.join(main_dir, "include"), exist_ok=True)
        os.makedirs(os.path.join(main_dir, "src"), exist_ok=True)
        os.makedirs(os.path.join(test_dir, "src"), exist_ok=True)
        os.makedirs(build_dir, exist_ok=True) 
    
        # Create main.cpp
        main_file_path = os.path.join(main_dir, "src", "main.cpp")

        with open(main_file_path, 'w') as main_file:
            main_file.write(f'#include "{header_code}"\n')  # Dynamically include the correct header file
            main_file.write('int main() {\n')
            main_file.write('    // Main function\n')
            main_file.write('    return 0;\n')
            main_file.write('}\n')
    
        # Create header.h (this should be done in process_cpp_code instead)
        # Update this part if needed based on the extracted header file name
    
        # Create program.cpp
        program_file_path = os.path.join(main_dir, "src", "program.cpp")
        with open(program_file_path, 'w') as program_file:
            program_file.write(program_code)
    
    # Clean and create ProgramTest.cpp
        cleaned_test_code = self.clean_test_code(test_code)
        test_file_path = os.path.join(test_dir, "src", "ProgramTest.cpp")
        with open(test_file_path, 'w') as test_file:
            test_file.write(cleaned_test_code)  # Write cleaned test code
            
        print(f"UTCProject structure for {project_name} created successfully.")
        return base_dir
    

    def extract_headers_and_declarations(self, code):
        header_file, _ = self.cpp_utils.extract_headers_and_declarations(code)
        return header_file

    def process_cpp_code(self, user_code, project_base_dir):
            self.cpp_utils.process_cpp_code(user_code, project_base_dir)

    def build_file_testcases(self, source_code, test_code):

        try:
            project_dir = f'{self.file_path}/UTCProject'
            test_file_path = f'{project_dir}/src/test/src/ProgramTest.cpp'
            with open(test_file_path, 'w') as test_file:
                test_file.write(test_code) 

            build_dir = os.path.join(project_dir, 'build')
            os.makedirs(build_dir, exist_ok=True)

            os.chdir(build_dir)

            command_cmake = ['cmake', '..']
            command_make = ['make']
            command_run_tests = ['./run_tests']
            command_ctest = ['ctest']

            cmake_process = subprocess.run(command_cmake, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if cmake_process.returncode != 0:
                return None, {
                    'success': False,
                    'error': 'CMake configuration failed',
                    'stdout': cmake_process.stdout,
                    'stderr': cmake_process.stderr
                }

            make_process = subprocess.run(command_make, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if make_process.returncode != 0:
                return {
                    'success': False,
                    'error': 'Make build failed',
                    'stdout': make_process.stdout,
                    'stderr': make_process.stderr
                }, None

            run_tests_process = subprocess.run(command_run_tests, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if run_tests_process.returncode != 0:
                return {
                    'success': False,
                    'error': 'Custom run_tests failed',
                    'stdout': run_tests_process.stdout,
                    'stderr': run_tests_process.stderr
                }, None

            ctest_process = subprocess.run(command_ctest, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if ctest_process.returncode != 0:
                return {
                    'success': False,
                    'error': 'CTest execution failed',
                    'stdout': ctest_process.stdout,
                    'stderr': ctest_process.stderr
                }, None
            
            report_path = self.generate_coverage_report_file()
            test_case_path = f'{self.file_path}/UTCProject/src/test/src'
            return report_path, test_case_path

        except subprocess.CalledProcessError as e:
            logging.error(f"Build or test failed: {e.stderr}")
            return {
                'success': False,
                'error': 'Build or test failed',
                'stdout': e.stdout,
                'stderr': e.stderr
            }, None

        except Exception as e:
            logging.error(f"An unexpected error occurred: {e}")
            return ({'success': False, 'error': 'Internal server error'}), 500

        finally:
            os.chdir('../../')

    def generate_coverage_report_file(self):
        project_dir = f'{self.file_path}/UTCProject'
        coverage_dir = os.path.join(project_dir, 'build', 'coverage_report')

        # Step 1: Compile and run tests
        command = f"cd {project_dir} && cmake -B build && cmake --build build && cd build && ./run_tests"
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Check for any errors during test execution
        if completed_process.returncode != 0:
            return ({"error": f"Error during test execution: {completed_process.stderr}"}), 500

        # Step 2: Generate lcov report using the custom target in CMake
        command = f"cd {project_dir}/build && make coverage"
        completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)

        # Check for any errors during coverage generation
        if completed_process.returncode != 0:
            return ({"error": f"Error during coverage generation: {completed_process.stderr}"}), 500

        return coverage_dir
            
   
    def build_folder_testcases(self, source_files, test_files):

        try:

            project_dir = f'{self.folder_path}/UTCProject_Folder'
            test_files_dir = f'{project_dir}/src/test/src'
            for test_name, test_content in test_files.items():
                filename = os.path.basename(test_name)
                name_parts = os.path.splitext(filename)  
                test_filename = f"{name_parts[0]}_test{name_parts[1]}"

                file_path = os.path.join(test_files_dir, test_filename)

                # Write test file content
                with open(file_path, "w") as f:
                    f.write(test_content)

                print(f"Saved test file: {file_path}")

            build_dir = os.path.join(project_dir, 'build')
            os.makedirs(build_dir, exist_ok=True)

            os.chdir(build_dir)

            command_cmake = ['cmake', '..']
            command_make = ['make']
            command_run_tests = ['./run_tests']
            command_ctest = ['ctest']

            cmake_process = subprocess.run(command_cmake, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if cmake_process.returncode != 0:
                return{
                    'success': False,
                    'error': 'CMake configuration failed',
                    'stdout': cmake_process.stdout,
                    'stderr': cmake_process.stderr
                }, None

            make_process = subprocess.run(command_make, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if make_process.returncode != 0:
                return {
                    'success': False,
                    'error': 'Make build failed',
                    'stdout': make_process.stdout,
                    'stderr': make_process.stderr
                },None

            run_tests_process = subprocess.run(command_run_tests, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if run_tests_process.returncode != 0:
                return {
                    'success': False,
                    'error': 'Custom run_tests failed',
                    'stdout': run_tests_process.stdout,
                    'stderr': run_tests_process.stderr
                }, None

            ctest_process = subprocess.run(command_ctest, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            if ctest_process.returncode != 0:
                return {
                    'success': False,
                    'error': 'CTest execution failed',
                    'stdout': ctest_process.stdout,
                    'stderr': ctest_process.stderr
                }, None
            
            report_path = self.generate_coverage_report_folder()
            test_cases_path = f'{self.folder_path}/UTCProject_Folder/src/test/src'
            return report_path, test_cases_path
       
        except subprocess.CalledProcessError as e:
            logging.error(f"Build or test failed: {e.stderr}")
            return {
                'success': False,
                'error': 'Build or test failed',
                'stdout': e.stdout,
                'stderr': e.stderr
            }, None

        except Exception as e:
            logging.error(f"An unexpected error occurred: {e}")
            return ({'success': False, 'error': 'Internal server error'}), 500

        finally:
            os.chdir('../../')

    def generate_coverage_report_folder(self):
        project_dir = f'{self.folder_path}/UTCProject_Folder'
        coverage_dir = os.path.join(project_dir, 'build', 'coverage_report')
        
        try:
            # Step 1: Compile and run tests
            command = f"cd {project_dir} && cmake -B build && cmake --build build && cd build && make run_tests"
            completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Check for any errors during test execution
            if completed_process.returncode != 0:
                print(f"Error during test execution: {completed_process.stderr}")
                return {"error": f"Error during test execution: {completed_process.stderr}"}
            
            # Step 2: Generate lcov report using the custom target in CMake
            command = f"cd {project_dir}/build && make coverage"
            completed_process = subprocess.run(command, shell=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            
            # Check for any errors during coverage generation
            if completed_process.returncode != 0:
                print(f"Error during coverage generation: {completed_process.stderr}")
                return {"error": f"Error during coverage generation: {completed_process.stderr}"}
            
            # Step 3: Check if the coverage directory exists
            if not os.path.exists(coverage_dir):
                print(f"Coverage directory not found: {coverage_dir}")
                return {"error": f"Coverage directory not found: {coverage_dir}"}
            
            return coverage_dir
        
        except Exception as e:
            print(f"Error generating coverage report: {e}")
            return {"error": f"Error generating coverage report: {str(e)}"}

  
      
    

        

