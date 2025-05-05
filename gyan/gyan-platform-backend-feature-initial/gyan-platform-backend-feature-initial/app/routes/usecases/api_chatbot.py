# from flask import Blueprint, request
from fastapi import APIRouter, File, UploadFile, HTTPException, Request, Depends
from fastapi.responses import JSONResponse


from app.usecases.chatbot.infer import ChatbotModelHandler
from app.core.utils import load_endpoints, get_prefix
import os

from app.database.connection import get_db
from app.models.rag import RAGDatabase
from sqlalchemy.orm import Session

os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'

ENDPOINTS = load_endpoints()
router_chat = APIRouter(prefix=ENDPOINTS["usecases"]["chatbot"]["prefix"], tags=["chatbot"])

chatbot_infer = ChatbotModelHandler()

@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["get_models"])
async def chatbot_get_models(request: Request):
   models = chatbot_infer.get_models()
   return JSONResponse(content=models)


@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["unload_model"])
async def chatbot_unload_model():
    """
    Unload the currently loaded model to free up resources
    """
    unload_result = chatbot_infer.unload_model()
    return JSONResponse(content=unload_result, status_code=200)


@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["load_model"])
async def chatbot_load_model(request: Request):
   model = await request.json()
   model_selected = model["model"]

   load_model = chatbot_infer.load_model(model_selected)
   return JSONResponse(content=load_model, status_code = 200) 

# @router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["infer"])
# async def chatbot_inf(request: Request):
#    query = await request.json()
#    text = query["message"]
#    print("Text recieved: ", text)
#    chatbot_inf = chatbot_infer.chatbot_inf(text)
#    return JSONResponse(content=chatbot_inf)

@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["infer"])
async def chatbot_inf(request: Request, db: Session = Depends(get_db)):
    try:
        data = await request.json()
        text = data["message"]
        rag_name = data.get("rag_name")
        
        print("Text received: ", text)
        print("RAG database: ", rag_name if rag_name else "None")
        
        if rag_name:
            # Fetch RAG details from database
            db_rag = db.query(RAGDatabase).filter(RAGDatabase.name == rag_name).first()
            if not db_rag:
                return JSONResponse(
                    content={
                        "success": False,
                        "error": f"RAG database '{rag_name}' not found"
                    },
                    status_code=404
                )
            
            # Create RAG configuration dictionary
            rag_config = {
                "name": db_rag.name,
                "rag_type": db_rag.rag_type,
                "llm_model": db_rag.llm_model,
                "embedding_model": db_rag.embedding_model,
                "chunking_option": db_rag.chunking_option,
                "vector_db": db_rag.vector_db,
                "search_option": db_rag.search_option,
                "dataset_path": db_rag.dataset_path,
                "status": db_rag.status
            }
            
            # Pass both text and RAG configuration to inference
            response = chatbot_infer.chatbot_inf(text, rag_config)
        else:
            # Normal inference without RAG
            response = chatbot_infer.chatbot_inf(text)
        
        return JSONResponse(content={
            "success": True,
            "response": response,
            "rag_used": bool(rag_name)
        })
        
    except Exception as e:
        print(f"Error in inference: {str(e)}")
        return JSONResponse(
            content={
                "success": False,
                "error": f"Error processing request: {str(e)}"
            },
            status_code=500
        )

@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["prompt"])
async def chatbot_submit_prompt(request: Request):
   prompt = chatbot_infer.submit_prompt(request)
   return JSONResponse(content=prompt)




@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["rag"])
async def chatbot_submit_rag(request: Request):
   rag = chatbot_infer.submit_rag(request)
   return JSONResponse(content = rag)

@router_chat.post(ENDPOINTS["usecases"]["chatbot"]["routes"]["add_rlhf"])
async def chatbot_rlhf_csv(request: Request):
   json_data = await request.json()
   print("jSON_data", json_data)
   rag = chatbot_infer.add_rlhf(json_data)
   return JSONResponse(content = rag)
