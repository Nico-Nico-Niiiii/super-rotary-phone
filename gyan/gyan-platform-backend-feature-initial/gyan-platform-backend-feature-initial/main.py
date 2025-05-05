import os

os.environ["HF_HOME"] = "/media/sahil/data1/hf_models"

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import auth, project, foundation_models, training_job, train_log, playground, evaluation, prompt, deployment, rag, agentic_framework_chat, agent_project, agent_custom_info, agent_workflow, agent_info, users, raise_query, pipeline
from app.routes.usecases import api_chatbot, api_bios, api_data, api_c, api_java, api_go, api_cpp, api_agent_reqs, api_agent_review, api_agent_userstory, api_code_review, api_cori, api_gyanhub, api_swd_wifi, api_test_scenario, api_ticket_mngt, api_agent_dev
from app.database.connection import Base, engine
from app.models.usecases_prompts import UsecasePromptInfo 
from fastapi.staticfiles import StaticFiles
from app.middleware.auth_middleware import AuthMiddleware


from dotenv import load_dotenv

load_dotenv()

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI()

# app.add_middleware(AuthMiddleware)
# Configure CORS    
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


required_directories = [
    "./chroma_db",
    "./uploads",
    "./eval_uploads",
    "./rag_zip_uploads",
    "./rag_extracted_uploads"
]

for directory in required_directories:
    os.makedirs(directory, exist_ok=True)
# os.makedirs("./chroma_db", exist_ok=True)
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
app.mount("/eval_uploads", StaticFiles(directory="eval_uploads"), name="eval_uploads")
app.mount("/rag_zip_uploads", StaticFiles(directory="rag_zip_uploads"), name="rag_zip_uploads")
app.mount("/rag_extracted_uploads", StaticFiles(directory="rag_extracted_uploads"), name="rag_extracted_uploads")

# Include routers
app.include_router(auth.router)
app.include_router(project.router) 
app.include_router(foundation_models.router)
app.include_router(training_job.router)
app.include_router(train_log.router)
app.include_router(playground.router)
app.include_router(evaluation.router)
app.include_router(prompt.router)
app.include_router(deployment.router)
app.include_router(rag.router)
app.include_router(agentic_framework_chat.router)  
app.include_router(agent_project.router)  
app.include_router(agent_custom_info.router)  
app.include_router(agent_workflow.router)  
app.include_router(agent_info.router)
app.include_router(users.router)
app.include_router(raise_query.router)
app.include_router(pipeline.router)


# Usecases 
app.include_router(api_c.router_c)
app.include_router(api_cpp.router_cpp)
app.include_router(api_go.router_go)
app.include_router(api_java.router_java)
app.include_router(api_bios.router_bios)
app.include_router(api_chatbot.router_chat)
app.include_router(api_code_review.router_code_rev)
app.include_router(api_cori.router_cori)
app.include_router(api_data.router_data)
app.include_router(api_swd_wifi.router_swd)
app.include_router(api_ticket_mngt.router_ticket_mgnt)
app.include_router(api_test_scenario.router_scenario)

# Agents
app.include_router(api_agent_reqs.router_func_tech)
app.include_router(api_agent_review.router_agent_reviewer)
app.include_router(api_agent_userstory.router_userstory)
app.include_router(api_agent_dev.router_dev_agent)

# GyanHub
app.include_router(api_gyanhub.router_gyanhub)


@app.get("/")
async def root():
    return {"message": "Welcome to MLOps Backend API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000)