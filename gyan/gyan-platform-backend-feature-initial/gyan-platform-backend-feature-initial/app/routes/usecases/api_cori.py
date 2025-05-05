from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

from app.usecases.cori.infer import CORI_TestCases
from app.core.utils import load_endpoints, get_prefix
import os

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
# cori = Blueprint('cori', __name__,template_folder='templates',static_folder='static')

ENDPOINTS = load_endpoints()
router_cori = APIRouter(prefix=ENDPOINTS["usecases"]["cori"]["prefix"], tags=["cori"])


@router_cori.post(ENDPOINTS["usecases"]["cori"]["routes"]["generate"])
async def cori_result(excel_file: UploadFile = File(...)):
    try:
        # print("Recd file - ", excel_file.filename)
        excel_contents = await excel_file.read()
        # print(f"File size: {len(excel_contents)} bytes")

        cori = CORI_TestCases()
        # print("calling infer")
        data = cori.infer_cori(excel_contents)
   
        return JSONResponse(content={'test_cases': data})

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    