from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import JSONResponse

from app.usecases.data_analyser.infer import DataAnalyzer
from app.core.utils import load_endpoints, get_prefix
import os

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

ENDPOINTS = load_endpoints()
router_data = APIRouter(prefix=ENDPOINTS["usecases"]["data_analyzer"]["prefix"], tags=["data_analyzer"])


@router_data.post(ENDPOINTS["usecases"]["data_analyzer"]["routes"]["generate"])
async def data_analyser_result(file: UploadFile = File(...)):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file found")
        
        # if not model:
        #   raise HTTPException(status_code=400, detail="Model type not selected")   # For later
        
        data_infer = DataAnalyzer()
        file_path = f"{data_infer.logs_path}/{file.filename}"
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        
        filename_without_extension = data_infer.remove_zip_extension(file.filename)
        extract_to=f"{data_infer.logs_path}/{filename_without_extension}"
        data_infer.unzip_file(file_path, extract_to)
        
        failure_list, scenario_name, pass_child_digits, failed_child_digits, html_file = data_infer.extent_report(file_path)

        api_failure_list = data_infer.extract_api_and_failure(failure_list)
        
        merged_data = []
        current_api = None
        current_group = None

        data_infer.unload_model()
        
        for message in api_failure_list:
            if message["api"] == current_api:
                current_group["failure_messages"].append(message["failure_message"])
                current_group["possible_reasons"].append(message["possible_reasons"])
                current_group["fixes"].append(message["fixes"])
            else:
                if current_group:
                    merged_data.append(current_group)
                current_api = message["api"]
                current_group = {
                    "api": message["api"],
                    "failure_messages": [message["failure_message"]],
                    "possible_reasons": [message["possible_reasons"]],
                    "fixes": [message["fixes"]]
                }
        
        if current_group:
            merged_data.append(current_group)
        
        total = pass_child_digits + failed_child_digits

        result = {
            "filename": filename_without_extension + '/' + html_file,
            "scenario_name": scenario_name,
            "pass_child_logs": pass_child_digits,
            "fail_child_logs": failed_child_digits,
            "total": total,
            "data": merged_data
        }

        return JSONResponse(content=result)
    
    except Exception as e:
        # print(f"Exception raised: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)