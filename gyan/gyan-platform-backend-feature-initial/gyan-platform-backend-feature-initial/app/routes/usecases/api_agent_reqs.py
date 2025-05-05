from fastapi import APIRouter, File, UploadFile, Form, HTTPException
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import io
import os
import json
import asyncio

from app.core.utils import load_endpoints, get_prefix
from app.usecases.agent_requirements.funcandtech import Reqs_Agent
from app.usecases.agent_requirements.prompts import func_corrector_prompt, func_validator_prompt, functional_spec_prompt, tech_spec_prompt, tech_corrector_prompt, tech_validator_prompt

from langchain_openai import AzureChatOpenAI
from langgraph.checkpoint.sqlite import SqliteSaver
from langgraph.checkpoint.sqlite.aio import AsyncSqliteSaver
from langchain_core.messages import HumanMessage

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
router_func_tech = APIRouter(prefix=ENDPOINTS["agents"]["func_tech_agent"]["prefix"], tags=["func_tech"])
 
 
# @router_func_tech.post(ENDPOINTS["agents"]["func_tech_agent"]["routes"]["generate"])
# async def result(file: UploadFile = File(...)):

#     try:
#         # Read the uploaded Excel file
#         contents = await file.read()
#         df = pd.read_excel(io.BytesIO(contents))

#         # Extract the user story (assuming only one row exists)
#         user_story = df["userstory"].iloc[0] if "userstory" in df.columns and not df.empty else None

#         if user_story is None:
#             return JSONResponse(content={"error": "No user story found in the uploaded file"}, status_code=400)
                                
#         thread = {"configurable": {"thread_id": "1"}}

#         messages = [HumanMessage(content=user_story)]
#         with SqliteSaver.from_conn_string(":memory:") as checkpointer:
#             abot = Reqs_Agent(model, system_developer=functional_spec_prompt, system_validator=func_validator_prompt, system_corrector=func_corrector_prompt,checkpointer=checkpointer)    
#             for event in abot.graph.stream({"messages": messages},thread):
#                 for v in event.values():
#                     func_spec = v['messages'][0].content

#         with SqliteSaver.from_conn_string(":memory:") as checkpointer:
#             abot = Reqs_Agent(model, system_developer=functional_spec_prompt, system_validator=tech_validator_prompt, system_corrector=tech_corrector_prompt,checkpointer=checkpointer)    
#             for event in abot.graph.stream({"messages": [func_spec]},thread):
#                 for v in event.values():
#                     tech_spec = v['messages'][0].content

#         return JSONResponse(content={'Functional_Specification' : func_spec, 'Technical_Specification': tech_spec})
   
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=str(e))



@router_func_tech.post(ENDPOINTS["agents"]["func_tech_agent"]["routes"]["generate"])
async def process_stream(file: UploadFile = File(...)):
    try:
        # Read the uploaded Excel file
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))

        # Extract the user story (assuming only one row exists)
        user_story = df["userstory"].iloc[0] if "userstory" in df.columns and not df.empty else None
        if user_story is None:
            return JSONResponse(content={"error": "No user story found in the uploaded file"}, status_code=400)

        thread = {"configurable": {"thread_id": "1"}}
        messages = [HumanMessage(content=user_story)]

        # Streaming function to send updates to frontend
        async def event_stream():
            async with AsyncSqliteSaver.from_conn_string(":memory:") as checkpointer:
                abot = Reqs_Agent(
                    model,
                    system_developer=functional_spec_prompt,
                    system_validator=func_validator_prompt,
                    system_corrector=func_corrector_prompt,
                    checkpointer=checkpointer
                )

                # Stream Functional Spec
                func_spec = None
                async for event in abot.graph.astream({"messages": messages}, thread):
                    for v in event.values():
                        func_spec = v['messages'][0]

                    yield f"data: {abot.execution_trace[-1]['step']}\n\n"
                    # await asyncio.sleep(0.5)  # Simulate processing delay

                
                # Stream Technical Spec
                async with AsyncSqliteSaver.from_conn_string(":memory:") as checkpointer:
                    abot = Reqs_Agent(
                        model,
                        system_developer=functional_spec_prompt,
                        system_validator=tech_validator_prompt,
                        system_corrector=tech_corrector_prompt,
                        checkpointer=checkpointer
                    )

                    async for event in abot.graph.astream({"messages": [func_spec]}, thread):
                        for v in event.values():
                            tech_spec = v['messages'][0]
                        
                        yield f"data: {abot.execution_trace[-1]['step']}\n\n"
                        # await asyncio.sleep(0.5)

            # Final result
            final_result = {
                "Functional_Specification": func_spec.content,
                "Technical_Specification": tech_spec.content
            }

            # Send the final result as JSON
            yield f"data: {json.dumps(final_result)}\n\n"
            yield "data: done\n\n"

        # Return the stream to frontend
        return StreamingResponse(event_stream(), media_type="text/event-stream")

    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)
