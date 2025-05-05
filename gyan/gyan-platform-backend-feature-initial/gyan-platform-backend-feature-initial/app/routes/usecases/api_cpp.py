
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
import tempfile
import json
import subprocess
import os
import shutil
import logging

from app.usecases.automation.infer_cpp import CPP_UTC
from app.core.utils import load_endpoints

ENDPOINTS = load_endpoints()

router_cpp = APIRouter(prefix=ENDPOINTS["usecases"]["automation"]["cpp"]["prefix"], tags=["automation_cpp"])
cpp_utc = CPP_UTC()

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["generate"]["file"])
async def generate_file(request: Request):
    try:
        data = await request.json()
        user_code = data["requestBody"]["input"][0]["content"]

        header_file_name = cpp_utc.extract_headers_and_declarations(user_code)

        output = cpp_utc.infer_for_file(user_code)

        project_base_dir = cpp_utc.create_cpp_project_structure("UTCProject", user_code, output, header_file_name)

        print("Project base directory :", project_base_dir)
        cpp_utc.process_cpp_code(user_code, project_base_dir)

        src = f'{cpp_utc.asset_path}/CMakeLists.txt'
        dst = os.path.join(project_base_dir, 'CMakeLists.txt')
        shutil.copy(src, dst)

        return {"Code": output}
    
    except Exception as e:
        print(f"An error occurred in generate_use_case: {e}")
        raise HTTPException(detail='Internal server error or CUDA Out Of Memory', status_code = 500)

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["build"]["file"])
async def build_testcases_from_file(request: Request):
    data = await request.json()
    print("Data received for single file build for cpp :", data)

    # Extracting source code
    if isinstance(data["requestBody"]["input"], list) and len(data["requestBody"]["input"]) > 0:
        source_code = data["requestBody"]["input"][0]["content"]
    else:
        return{"error": "No source code provided"}
    
    #Extracting generated test code
    test_code_data = data["requestBody"].get("test_code", {})
    if isinstance(test_code_data, dict) and test_code_data:
        test_code = next(iter(test_code_data.values()))
    
    else:
        return {"error": "No test code provided"}
    
    coverage_path, test_case_path = cpp_utc.build_file_testcases(source_code, test_code)
    print("===============Covergae Path==============", coverage_path)
    print("===============Test Case Path==============", test_case_path)


    return {"Report": coverage_path, "Test": test_case_path}

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["download"]["coverage_file"])
async def download_coverage_report_file(request: Request):
    "Function to download the coverage report of single file"
    data =  await request.json()
    folder_path = data.get("folder_path")

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")

    # Create a temporary ZIP file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4], 'zip', folder_path)

    return FileResponse(
        path=zip_file_path,
        media_type="application/zip",
        filename=f"{os.path.basename(folder_path)}.zip", 
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["download"]["test_file"])
async def download_test_file(request: Request):
    "Function to download test cases of single file"
    data = await request.json()
    folder_path = data.get("stored_tests")

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")

    # Create a temporary ZIP file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4], 'zip', folder_path)

    return FileResponse(
        path=zip_file_path,
        media_type="application/zip",
        filename=f"{os.path.basename(folder_path)}.zip", 
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )
    # ================================FOLDER CASE=================================

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["generate"]["folder"])
async def generate_testcases_folder(request: Request):
    try:
        data = await request.json()
        source_files = data['requestBody']['input']
        
        # Create a base project directory
        project_base_dir, include_dir = cpp_utc.create_cpp_project_structure_folder("UTCProject_Folder", source_files)
        print("Project base dir :", project_base_dir)
        
        file_outputs, file_headers = cpp_utc.infer_for_folder(source_files)
        
        # Create the project structure with all files
        cpp_utc.create_cpp_project_structure_folder("UTCProject_Folder", source_files, file_outputs, file_headers)
        
        # Process all files to generate headers
        cpp_utc.cpp_utils.process_multiple_files(source_files, include_dir)
        
        # Copy the CMakeLists.txt file
        src = cpp_utc.folder_assets_path
        print("Source cmake file :", src)
        dst = os.path.join(project_base_dir, 'CMakeLists.txt')
        shutil.copy(src, dst)

        # print("Gnerated file outputs : ", file_outputs)

        formatted_outputs = {}
        for file_name, output in file_outputs.items():
            formatted_outputs[file_name] = {"testcase": output}

        return {"ZipCodes" : formatted_outputs}
        

    except Exception as e:
        print(f"Error generating test cases: {e}")
        return {"error": str(e)}
                 
@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["build"]["folder"])
async def build_testcases_from_folder(request: Request):
    try:
        data = await request.json()
        # print("Data received for folder build:", data)
       
        # Extract the source code files
        source_files = data["requestBody"]["input"]  # Input code files
        test_files = data["requestBody"].get("test_code", {})  # Test code files

        # print("Data received in test_files:", test_files)

        report_path, test_case_path = cpp_utc.build_folder_testcases(source_files, test_files)

        # print("Report Path", report_path)

        return {"Report": report_path, "Test": test_case_path}
    
        
    except subprocess.CalledProcessError as e:
        print(f"Build or test failed: {e}")
        return {
            'success': False,
            'error': 'Build or test failed',
            'command': e.cmd,
            'returncode': e.returncode
        }
    except Exception as e:
        print(f"An unexpected error occurred: {e}")
        return {'success': False, 'error': f'Internal server error: {str(e)}'}
    finally:
        # Return to the original directory
        os.chdir('../../')
    

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["download"]["coverage_folder"])
async def download_coverage_report_file(request: Request):
    "Function to download the coverage report of single file"
    data =  await request.json()
    folder_path = data.get("folder_path")

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")

    # Create a temporary ZIP file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4], 'zip', folder_path)

    return FileResponse(
        path=zip_file_path,
        media_type="application/zip",
        filename=f"{os.path.basename(folder_path)}.zip", 
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )

@router_cpp.post(ENDPOINTS["usecases"]["automation"]["cpp"]["routes"]["download"]["test_folder"])
async def download_test_file(request: Request):
    "Function to download test cases of single file"
    data = await request.json()
    folder_path = data.get("stored_tests")  

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")

    # Create a temporary ZIP file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4], 'zip', folder_path)

    return FileResponse(
        path=zip_file_path,
        media_type="application/zip",
        filename=f"{os.path.basename(folder_path)}.zip", 
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )
















































