from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
import os
from contextlib import asynccontextmanager
import uvicorn

from . import models
from .database import engine
from .routes import router

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# Create required directories
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create directories needed by the application
    os.makedirs("uploads", exist_ok=True)
    logger.info("Created uploads directory")
    
    yield
    
    # Cleanup temporary files if needed
    temp_files = [f for f in os.listdir('.') if f.startswith('temp_') and f.endswith('.py')]
    for temp_file in temp_files:
        try:
            os.remove(temp_file)
            logger.info(f"Cleaned up temporary file: {temp_file}")
        except Exception as e:
            logger.error(f"Error cleaning up {temp_file}: {e}")

# Create database tables
models.Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Code Generator API",
    description="""
    API for generating and integrating code from technical specifications.
    
    Features:
    - Generate code from technical specifications in Excel files
    - Validate and correct generated code
    - Integrate modules with relationship analysis
    - Comprehensive API documentation
    """,
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development - specify origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(router, prefix="/api")

# Root endpoint
@app.get("/")
async def root():
    return {
        "message": "Welcome to the Code Generator API",
        "docs": "/docs",
        "redoc": "/redoc"
    }

if __name__ == "__main__":
    # Run the app with uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)