from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

from app.usecases.test_scenario_gen.infer import TestScenarioGenerator
from app.core.utils import load_endpoints, get_prefix
import os

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

ENDPOINTS = load_endpoints()
router_scenario = APIRouter(prefix=ENDPOINTS["usecases"]["test_scenario_gen"]["prefix"], tags=["test_scenario"])


@router_scenario.post(ENDPOINTS["usecases"]["test_scenario_gen"]["routes"]["generate"])
async def result(image: UploadFile = File(...), choice: str = Form(...)):
    try:
        image_bytes = await image.read()

        test_scenario_gen = TestScenarioGenerator()
        response = test_scenario_gen.process_image_and_prompt(image_bytes, choice)
        
        return JSONResponse(content={'test_scenario' : response})
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))