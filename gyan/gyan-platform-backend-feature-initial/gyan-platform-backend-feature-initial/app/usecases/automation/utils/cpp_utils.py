import re
import os
import stat
import json
import shutil

class Utils_Java:
    def __init__(self):
    
        with open('config/path/path_config.json', 'r') as file:
            data = json.load(file)
        
        self.asset_path = data["use_case"]["automation_java"]["asset_paths"]["path_1"]
        self.base_directory = f"{self.asset_path}/UTC_Java"


    # def save_classname_testcase(self, file_content, class_name):
    #     """
    #     Save the Java file content as classname.java
    #     """

    #     # sub1="src"
    #     # sub2 = "test"
    #     # sub3 = "java"
    #     # sub4 = "com"
    #     # sub5 = "example"
    #     sub_path = "src/test/java/com/example"
    #     full_path = os.path.join(self.base_directory, sub_path)

    #     folder_path = full_path
    #     self.delete_folder_if_exists(folder_path)

    #     if not os.path.exists(full_path):
    #         os.makedirs(full_path)
        
    #     filename = os.path.join(full_path, f"{class_name}.java")

    #     with open(filename, 'w') as file:
    #         file.write(file_content)
    #     print(f"File saved as '{filename}'.")


    # def delete_folder_if_exists(self, folder_path):
    #     # Check if the folder exists
    #     if os.path.exists(folder_path) and os.path.isdir(folder_path):
    #         print(f"Folder '{folder_path}' exists. Deleting...")
    #         # Delete the folder
    #         shutil.rmtree(folder_path)
    #         print(f"Folder '{folder_path}' has been deleted.")
    #     else:
    #         print(f"Folder '{folder_path}' does not exist.")

class CPP_Utils:
    def extract_headers_and_declarations(self, cpp_code):
        # Extract header file name from #include directive or create a default one
        header_file_name = self.extract_header_file_name(cpp_code)
    
        # Create the content for the header file
        header_content = f"#ifndef {header_file_name.upper().replace('.', '_')}\n"
        header_content += f"#define {header_file_name.upper().replace('.', '_')}\n\n"
    
        # Extract class definitions, method signatures, and function declarations
        class_definitions = self.extract_class_definitions(cpp_code)
        method_signatures = self.extract_method_signatures_from_implementations(cpp_code)
        function_declarations = self.extract_function_declarations(cpp_code)
    
        # Add class definitions and method signatures to the header
        if class_definitions:
            header_content += "// Class Definitions\n"
            header_content += "\n".join(class_definitions) + "\n\n"
        
        if method_signatures:
            header_content += "// Method Signatures (From Implementations)\n"
            header_content += "\n".join(method_signatures) + "\n\n"
    
        # Add function declarations to the header
        if function_declarations:
            header_content += "// Function Declarations\n"
            header_content += "\n".join(function_declarations) + "\n\n"
    
        header_content += f"#endif // {header_file_name.upper().replace('.', '_')}\n"
    
        return header_file_name, header_content
    
    def extract_header_file_name(self, cpp_code):
        # Extract the first #include directive
        match = re.search(r'#include\s+"([^"]+)"', cpp_code)
        if match:
            return match.group(1)
        return "program.h"  # Default header name if none found

    def extract_class_definitions(self, cpp_code):
        # Capture class definitions without method implementations
        class_definitions = re.findall(r'class\s+\w+\s*{[^}]*};', cpp_code, re.DOTALL)
        return class_definitions
    
    def extract_method_signatures_from_implementations(self, cpp_code):
        # Regex to capture class method implementations, class names, and methods (including return types)
        method_implementations = re.findall(r'([a-zA-Z_]\w*)::([a-zA-Z_]\w*)\s*\([^)]*\)\s*\{', cpp_code)
        
        class_methods = {}
        
        for class_name, method_name in method_implementations:
            if class_name not in class_methods:
                class_methods[class_name] = []
            # Example for now assumes methods take two double parameters, adjust accordingly
            method_signature = f'double {method_name}(double num1, double num2);'
            class_methods[class_name].append(method_signature)
        
        # Constructing the class with public methods
        method_signatures = []
        for class_name, methods in class_methods.items():
            class_signature = f'class {class_name} {{\npublic:\n'
            class_signature += '\n    '.join(methods) + "\n};"
            method_signatures.append(class_signature)
        
        return method_signatures


    def extract_function_declarations(self, cpp_code):
        # Existing regex for function declarations or prototypes outside of classes
        function_declarations = re.findall(r'\b[a-zA-Z_][\w\s]*\s+[a-zA-Z_]\w*\s*\([^)]*\)\s*(?=\s*;|\s*\{)', cpp_code)
        
        # Add semicolons to standalone function declarations
        declarations = [decl + ";" for decl in function_declarations]
        
        return declarations
    
    def update_header_file(self, header_file_path, header_content):
        with open(header_file_path, 'w') as header_file:
            header_file.write(header_content)
            print("Written header file")
    
    def process_cpp_code(self, cpp_code, project_base_dir):
        # Extract header file name and content
        header_file_name, header_content = self.extract_headers_and_declarations(cpp_code)
    
        # Define the header file path
        header_file_path = os.path.join(project_base_dir, "src", "main", "include", header_file_name)
    
        # Update the header file with extracted content
        self.update_header_file(header_file_path, header_content)
    
        print(f"Updated {header_file_name} with declarations.")



    def process_multiple_files(self, files, include_dir):
        """Process multiple C++ files and generate header files for each."""
        
        headers = {}
        for file_info in files:
            file_name = file_info['name']
            file_content = file_info['content']

            # print("===================FILE CONTENT==========================", file_content)

            # Extract header file name from #include statement
            match = re.search(r'#include\s*"(.*?)"', file_content)
            if match:
                header_file_name = match.group(1)  # Extracted header file name
            else:
                # Default to cleaned file name if no #include found
                base_name = os.path.splitext(file_name)[0]
                header_file_name = os.path.basename(base_name) + ".h"

            print("Extracted header file name:", header_file_name)
            print("Include dir is", include_dir)
            
            file_dir = os.path.join(include_dir, header_file_name)
            print("Header file name:", file_dir)

            # Process the file
            _, header_content = self.extract_headers_and_declarations(file_content)

            # Define the header file path
            header_file_path = file_dir

            # Update the header file with extracted content
            self.update_header_file(header_file_path, header_content)

            # Store the header information
            headers[file_name] = header_file_name

            print(f"Updated {header_file_name} for {file_name} with declarations.")

        return headers



    # def process_multiple_files(self, files, include_dir):
    #     """Process multiple C++ files and generate header files for each."""

    #     headers = {}
    #     for file_info in files:
    #         file_name = file_info['name']
    #         file_content = file_info['content']

    #         print("===================FILE CONTENT==========================",file_content)
            
    #         # Extract base name without extension
    #         base_name = os.path.splitext(file_name)[0]
    #         cleaned_file_name = os.path.basename(base_name) 
    #         print("Cleaned file name for header :", cleaned_file_name)
    #         print("Include dir is ", include_dir)
    #         file_dir = os.path.join(include_dir, f'{cleaned_file_name}.h')
    #         print("Header file name :", file_dir)
            
    #         # Process the file
    #         header_file_name, header_content = self.extract_headers_and_declarations(file_content)
            
    #         # Define the header file path
    #         # header_file_path = os.path.join(file_dir, "src", "main", "include", header_file_name)
    #         header_file_path = file_dir
            
    #         # Update the header file with extracted content
    #         self.update_header_file(header_file_path, header_content)
            
    #         # Store the header information
    #         headers[file_name] = header_file_name
            
    #         print(f"Updated {header_file_name} for {file_name} with declarations.")
            
    #     return headers


    