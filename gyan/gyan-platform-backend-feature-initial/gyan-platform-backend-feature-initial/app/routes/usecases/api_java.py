#### JAVA ENDPOINTS
from fastapi import APIRouter, Response, UploadFile, File, Depends, HTTPException, Cookie, Request
from fastapi.responses import JSONResponse, FileResponse
from app.core.utils import load_endpoints, get_prefix
from app.usecases.automation.infer_java import GyanCodeLlamaInfer_Java
import tempfile
import subprocess
import os
import json
import logging
import zipfile
import imgkit
import shutil

ENDPOINTS = load_endpoints()

router_java = APIRouter(prefix=ENDPOINTS["usecases"]["automation"]["java"]["prefix"], tags=["automation_java"])

# Class Instance
java_utc = GyanCodeLlamaInfer_Java()

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["generate"]["file"])
async def generate_testcases_from_file(request: Request):
    data = await request.json()

    source_code = data["requestBody"]["input"][0]["content"]
 
    output_code = java_utc.generate_testcases_from_file(source_code)

    print("Generated  Javatest cases: ", output_code)
    return {'Code': output_code}

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["build"]["file"])
async def build_utc(request: Request):
    "Building for a single file"
    data =  await request.json()
    # print("Data received for single file build :", data)

    if isinstance(data["requestBody"]["input"], list) and len(data["requestBody"]["input"]) > 0:
        source_code = data["requestBody"]["input"][0]["content"]
    else:
        return {"error": "No source code provided"}

    test_code_data = data["requestBody"].get("test_code", {})
    if isinstance(test_code_data, dict) and test_code_data:
        test_code = next(iter(test_code_data.values()))  # Get the first test case

    result, test_cases_path = java_utc.build_testcases_from_file(source_code, test_code)
    print("===========JAVA TEST CASES PATH=========", test_cases_path)
    return {"Report": result, "Test": test_cases_path}


@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["download"]["coverage_file"])
async def download_coverage_report_file(request: Request):
    "Function to download the coverage report of single file"
    data = await request.json()
    folder_path = data.get("folder_path")

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail = "Folder not found")
    
    #create a zip file
    zip_file_path = tempfile.NamedTemporaryFile(delete=False,suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4],'zip', folder_path)

    return FileResponse(
        path = zip_file_path,
        media_type = "application/zip",
        filename = f"{os.path.basename(folder_path)}.zip",
        headers={"Content=Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip'}
    )

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["download"]["test_file"])
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

# ======================================FOR FOLDER==================================

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["generate"]["folder"])
async def generate_testcases_from_folder(request: Request):
    data = await request.json()
    # print("Data received for folder case:", data)

    source_files = [(file['name'], file['content']) for file in data['requestBody']['input']]

    try:
        generated_codes = java_utc.generate_testcases_from_folder(source_files)
        print("Folder output codes:", generated_codes)
        return {"ZipCodes": generated_codes}
    
    except Exception as e:
        print(f"Error during test case generation: {e}")
        return HTTPException(detail=f"Exception {e}", status_code=500)

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["build"]["folder"])
async def build_utc_from_folder(request: Request):
    "Function to build testcases from folder"
    data = await request.json()
    print("Data received for folder build:", data)

    source_files = data["requestBody"]["input"]
    test_files = data["requestBody"].get("test_code", {})

    report_path, test_cases_path = java_utc.build_testcases_from_folder(source_files, test_files)
    print("Test Cases received from folder build:", test_cases_path)

    return {"Report": report_path, "Test": test_cases_path}

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["download"]["coverage_folder"])
async def download_coverage_report_folder(request: Request):
    data = await request.json()
    folder_path =data.get("folder_path")

    if not folder_path or not os.path.isdir(folder_path):
        raise HTTPException(status_code=400, detail="Folder not found")
    
    zip_file_path = tempfile.NamedTemporaryFile(delete=False, suffix=".zip").name
    shutil.make_archive(zip_file_path[:-4],'zip', folder_path)

    return FileResponse(
        path = zip_file_path,
        media_type = "application/zip",
        filename = f"{os.path.basename(folder_path)}.zip",
        headers={"Content-Disposition": f'attachment; filename = "{os.path.basename(folder_path)}.zip"'}

    )

@router_java.post(ENDPOINTS["usecases"]["automation"]["java"]["routes"]["download"]["test_folder"])
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


















