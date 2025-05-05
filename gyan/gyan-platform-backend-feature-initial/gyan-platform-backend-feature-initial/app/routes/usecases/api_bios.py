from fastapi import APIRouter, File, UploadFile, HTTPException 
from fastapi.responses import JSONResponse

from app.usecases.bios_log_analyser.infer import  BiosDataProcessor
from app.core.utils import load_endpoints, get_prefix
import os

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

ENDPOINTS = load_endpoints()
router_bios = APIRouter(prefix=ENDPOINTS["usecases"]["bios"]["prefix"], tags=["bios_logs"])

processor_instance = BiosDataProcessor(input_file=None)
logs_path = processor_instance.logs_path

@router_bios.post(ENDPOINTS["usecases"]["bios"]["routes"]["generate"])
async def bios_logs(file: UploadFile = File(...)):
    try:
        if not file:
            raise HTTPException(status_code=400, detail="No file found")
        
        # model_type = request.form.get('model')  # Currently not needed, keep for later.
        
        files_dir = os.path.join(logs_path, "input_files")
        os.makedirs(files_dir, exist_ok=True)
        
        # Save the uploaded file
        file_path = os.path.join(files_dir, file.filename)
        with open(file_path, "wb") as f:
            f.write(await file.read())

        bios_infer = BiosDataProcessor(file_path)
        failure_list = bios_infer.txt_to_excel()
        
        bios_out = file.filename
        normal_counts = sum(1 for item in failure_list if 'Anomaly' not in item['Output'])
        anomaly_counts = len(failure_list) - normal_counts
        total = len(failure_list)

        response_data = {
            'out': bios_out,
            'chat_messages': failure_list,
            'normal_counts': normal_counts,
            'anomaly_counts': anomaly_counts,
            'total': total
        }
        return JSONResponse(content=response_data, status_code=200)

    except Exception as e:
        print(f"Exception raised {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)