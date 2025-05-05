from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse

import os
from app.usecases.agent_code_review.agent_workflow import workflow
from app.core.utils import load_endpoints, get_prefix

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"


ENDPOINTS = load_endpoints()
router_agent_reviewer = APIRouter(prefix=ENDPOINTS["agents"]["code_reviewer"]["prefix"], tags=["agent_reviewer"])


@router_agent_reviewer.post(ENDPOINTS["agents"]["code_reviewer"]["routes"]["generate"])
async def result(code: UploadFile = File(...), specialization: str = Form(...), style_guide: UploadFile = File(...)):
    try:    
        # print(f"Received specialization: {specialization}")
        # print(f"Received code file: {code.filename}, size: {len(await code.read())}")
        # code.seek(0)  # Reset file pointer after reading
        # print(f"Received style guide file: {style_guide.filename}, size: {len(await style_guide.read())}")
        # style_guide.seek(0)  # Reset file pointer after reading

        # Read file contents
        code_content = await code.read()
        style_guide_content = await style_guide.read()

        # Decode file contents to string (assuming UTF-8 encoding)
        code_text = code_content.decode('utf-8')
        style_guide_text = style_guide_content.decode('utf-8')

        app = workflow.compile()
        conversation = app.invoke({"history": code_text, "code": code_text, 'actual_code': code_text, "specialization": specialization, 'iterations': 0, 'style_guide': style_guide_text}, {"recursion_limit":20})

        return JSONResponse(content={
        "Coder Rating": conversation['rating'],
        "comparison": conversation['code_compare'],
        "Revised code": conversation['code']
        })   
    

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    