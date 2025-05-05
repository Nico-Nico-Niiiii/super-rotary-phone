from fastapi import APIRouter, Response, UploadFile, File, Depends, HTTPException, Request
from fastapi.responses import JSONResponse, FileResponse
from fastapi.encoders import jsonable_encoder
import tempfile
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.usecases.automation.infer_c import C_UTC
from app.database.connection import get_db
from app.database.crud import DBOperations
from app.core.utils import load_endpoints, get_prefix
import os
import json
import logging
import zipfile
import imgkit
import subprocess
import time
import shutil
from html2image import Html2Image
import subprocess

ENDPOINTS = load_endpoints()

router_c = APIRouter(prefix=ENDPOINTS["usecases"]["automation"]["c"]["prefix"], tags=["automation_c"])
c_utc = C_UTC()

hti = Html2Image()
intermediate_results = {}


@router_c.get(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["prompts"]["get_name"])
def get_c_prompt_name(
    db: Session = Depends(get_db)
):
    prompt_objs = DBOperations.get_prompts(db, "Automation", "C Prompts")

    # Convert the SQLAlchemy objects to dicts
    prompt_list = [
        {
            "prompt_description": prompt.prompt_description,
            "prompt_text" : prompt.prompt
        }
        for prompt in prompt_objs
    ]

    # print("Prompt list", prompt_list)
    
    return JSONResponse(content=jsonable_encoder({"prompt": prompt_list})) 


# ============================= FOR FILES ========================================

@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["generate"]["file"])
async def generate_testcases_file(request : Request):
    data = await request.json()

    # print("Data rcd for file - ", data)
    
    source_code = data["requestBody"]["input"][0]["content"]
    prompt_lib = data["requestBody"]["prompt"]
    prompt_text = data["requestBody"]["prompt_text"]

    generated_code = c_utc.generate_testcases_file(source_code, prompt_lib, prompt_text)
    return {'Code': generated_code}

@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["build"]["file"])
async def build_test_cases_file(request: Request):
    data = await request.json()
    # print("Data received for single file build:", data)

    # Extract source code - should be the first file in the input array
    if isinstance(data["requestBody"]["input"], list) and len(data["requestBody"]["input"]) > 0:
        source_code = data["requestBody"]["input"][0]["content"]
    else:
        # Handle error case or fallback
        return {"error": "No source code provided"}

    # Extract test code
    # test_code = data["requestBody"]["test_code"]["testToSend"]["content"]
    test_code_data = data["requestBody"].get("test_code", {})
    if isinstance(test_code_data, dict) and test_code_data:
        test_code = next(iter(test_code_data.values()))  # Get the first test case

    else:
        return {"error": "No test code provided"}
    # Call your build function
    coverage_path, test_case_path = c_utc.build_file_testcases(source_code, test_code)
    print("=========Output received===========", test_case_path)

    return {"Report": coverage_path, "Test": test_case_path}


@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["download"]["coverage_file"])
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


@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["download"]["test_file"])
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

@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["generate"]["folder"])
async def generate_testcases_folder(request: Request):
    # print("GENERATE for folders")

    data = await request.json()
    # print("Data recd for folder - ", data)
    
    prompt_lib = data["requestBody"]["prompt"]
    prompt_text = data["requestBody"]["prompt_text"]

    source_files = [(file['name'], file['content']) for file in data['requestBody']['input']]

    try:
        generated_codes = c_utc.process_files_and_generate_test_cases(source_files, prompt_lib, prompt_text)
        # print("==============Folder output codes============", generated_codes)
        return {"ZipCodes" : generated_codes}
    
    except Exception as e:
        print(f"Error during test case generation: {e}")
        return HTTPException(detail=f"Exception {e}", status_code=500)
    
@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["build"]["folder"])
async def build_testcases_from_folder(request: Request):

    data = await request.json()
    # print("Data received for folder build:", data)
    
    # Extract the source code files
    source_files = data["requestBody"]["input"]  # Input code files
    test_files = data["requestBody"].get("test_code", {})  # Test code 

    # Pass the files data to the build function
    report_path, test_cases_path = c_utc.build_folder_testcases(source_files, test_files)
    # print("================output received for folder build=========", output)

    return {"Report": report_path, "Test": test_cases_path}

@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["download"]["coverage_folder"])
async def downlaod_coverage_report_folder(request: Request):
    "Function to download the coverage report of folder"
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
        filename=f"{os.path.basename(folder_path)}.zip",  # Set correct ZIP filename
        headers={"Content-Disposition": f'attachment; filename="{os.path.basename(folder_path)}.zip"'}
    )

@router_c.post(ENDPOINTS["usecases"]["automation"]["c"]["routes"]["download"]["test_folder"])
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


