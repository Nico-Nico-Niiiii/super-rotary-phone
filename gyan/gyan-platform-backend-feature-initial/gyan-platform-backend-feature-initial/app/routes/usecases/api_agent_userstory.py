from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse

import io
import os
import json
import pandas as pd

from langchain_openai import AzureChatOpenAI
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langchain_core.messages import HumanMessage

from app.usecases.agent_userstory.userstory import UserStory_Agent
from app.usecases.agent_userstory.prompts import user_story_prompt, validator_prompt, corrector_prompt
from app.core.utils import load_endpoints, get_prefix

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"

model = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
)

ENDPOINTS = load_endpoints()
router_userstory = APIRouter(prefix=ENDPOINTS["agents"]["userstory_agent"]["prefix"], tags=["userstory"])


# @router_userstory.post(ENDPOINTS["agents"]["userstory_agent"]["routes"]["generate"])
# async def result(file: UploadFile = File(...)):
#     try:
#         # Read the uploaded Excel file
#         contents = await file.read()
#         df = pd.read_excel(io.BytesIO(contents))

#         # Extract the user story (assuming only one row exists)
#         first_col_name = df.columns[0]
#         req = df[first_col_name].iloc[0] if not df.empty else None

#         if req is None:
#             return JSONResponse(content={"error": "No requirement found in the uploaded file"}, status_code=400)
                                
#         thread = {"configurable": {"thread_id": "1"}}

#         messages = [HumanMessage(content=req)]
#         with SqliteSaver.from_conn_string(":memory:") as checkpointer:
#             abot = UserStory_Agent(model, system_developer=user_story_prompt, system_validator=validator_prompt, system_corrector=corrector_prompt,checkpointer=checkpointer)    
#             for event in abot.graph.stream({"messages": messages},thread):
#                 for v in event.values():
#                     userstory = v['messages'][0].content

#         return JSONResponse(content={'userstory' : userstory})
   
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))


@router_userstory.post(ENDPOINTS["agents"]["userstory_agent"]["routes"]["generate"])
async def process_stream(file: UploadFile = File(...)):
    try:
        # Read the uploaded Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        first_col_name = df.columns[0]
        req = df[first_col_name].iloc[0] if not df.empty else None

        if req is None:
            return JSONResponse(content={"error": "No requirement found in the uploaded file"}, status_code=400)
        
        thread = {"configurable": {"thread_id": "1"}}
        messages = [HumanMessage(content=req)]

        # Streaming function to send updates to frontend
        async def event_stream():
            async with AsyncSqliteSaver.from_conn_string(":memory:") as checkpointer:
                abot = UserStory_Agent(
                    model,
                    system_developer=user_story_prompt,
                    system_validator=validator_prompt,
                    system_corrector=corrector_prompt,
                    checkpointer=checkpointer
                )

                # Stream Userstory Generation
                userstory = None
                async for event in abot.graph.astream({"messages": messages}, thread):
                    for v in event.values():
                        userstory = v['messages'][0]

                    yield f"data: {abot.execution_trace[-1]['step']}\n\n"
                    # await asyncio.sleep(0.5)  # Simulate processing delay


            # Final result
            final_result = {
                "userstory": userstory.content,
            }

            # Send the final result as JSON
            yield f"data: {json.dumps(final_result)}\n\n"
            yield "data: done\n\n"

        # Return the stream to frontend
        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
