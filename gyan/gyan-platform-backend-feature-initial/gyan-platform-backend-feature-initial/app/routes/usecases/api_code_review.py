from fastapi import APIRouter, File, UploadFile, Form, HTTPException, Request
from fastapi.responses import JSONResponse

from app.usecases.src_code_review.infer import SrcCode_Review
from app.core.utils import load_endpoints, get_prefix
import os

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
cr_infer = SrcCode_Review()

ENDPOINTS = load_endpoints()
router_code_rev = APIRouter(prefix=ENDPOINTS["usecases"]["src_code_review"]["prefix"], tags=["src_code_review"])

@router_code_rev.post(ENDPOINTS["usecases"]["src_code_review"]["routes"]["generate"])
async def review_code(request: Request):
    data = await request.json()

    source_code = data["source_code"]
    language = data["language"]
    
    result = cr_infer.infer(source_code, language)

    response_data = {'review': result}
    return JSONResponse(content = response_data, status_code=200)