from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse

import os
import io
import pandas as pd

# Import the code generator module
from app.usecases.agent_development.code_generator import CodeGenerationManager
from app.usecases.agent_development.inference import configure_openai, get_directory_structure_with_content

from app.core.utils import load_endpoints

#  Add Router
ENDPOINTS = load_endpoints()
router_dev_agent = APIRouter(prefix=ENDPOINTS["agents"]["development_agent"]["prefix"], tags=["dev_agent"]) 

manager = CodeGenerationManager()
configure_openai()

@router_dev_agent.post(ENDPOINTS["agents"]["development_agent"]["routes"]["generate"])
async def agentic_code_generation(excel_file: UploadFile = File(...)):
    contents = await excel_file.read()
    df = pd.read_excel(io.BytesIO(contents))

    # run of complete worflow 
    code_gen_dir, integrated_dir = manager.run_combined_workflow(df)

    if code_gen_dir and integrated_dir:
        print("\nWorkflow completed successfully!")
        print(f"Generated code: {code_gen_dir}")
        print(f"Integrated solution: {integrated_dir}")

    ## Add logic to read code src from directory & send in response
    # code_content = get_directory_structure_with_content(code_gen_dir)
    integrated_content = get_directory_structure_with_content(integrated_dir)

    return JSONResponse(content={"integrated_content": integrated_content})