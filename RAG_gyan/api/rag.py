# routes/rag.py
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form, Body
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database.connection import get_db
from ..models.rag import RAGDatabase, RAGFile
from ..schemas.rag import RAGDatabase as RAGDatabaseSchema
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import joinedload
import os
import shutil
import zipfile
from datetime import datetime
from app.RAG.rag_pipeline import RAGPipeline

from pydantic import BaseModel
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from app.RAG.document_loader import DocumentLoader
from app.RAG.chunker_factory import ChunkerFactory
from app.RAG.embedings_geneartor import EnhancedEmbeddingGenerator
from app.RAG.vector_store import VectorStoreFactory
from app.RAG.vector_search import SearchFactory
from app.RAG.rag_types import StandardRAG, GraphRAG, AdaptiveRAG, RaptorRAG
from app.RAG.prompt_optimizer import PromptOptimizer
from app.RAG.reranking_model import RerankingModel
import chromadb
import weaviate
import faiss
import numpy as np
import pinecone
from sentence_transformers import SentenceTransformer
from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec

import re
import uuid
import pickle

# In-memory store for loaded RAG pipelines
_loaded_pipelines = {}

# Helper function to get a loaded RAG pipeline
def get_loaded_database(rag_name: str):
    """Get a loaded RAG pipeline by name"""
    global _loaded_pipelines
    return _loaded_pipelines.get(rag_name)

router = APIRouter(prefix="/rag", tags=["rag"])
os.makedirs("./chroma_db", exist_ok=True)

def process_zip_file(zip_path: str, extract_path: str):
    """Extract and process zip file, returning file information"""
    file_info = []
    try:
        with zipfile.ZipFile(zip_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)
            for file_name in zip_ref.namelist():
                if not file_name.endswith('/'):  # Skip directories
                    file_path = os.path.join(extract_path, file_name)
                    try:
                        content = ""
                        is_text = False
                        
                        text_extensions = {
                            '.txt', '.md', '.csv', '.json', '.xml', 
                            '.yaml', '.yml', '.html', '.htm', '.css', 
                            '.js', '.py', '.java', '.c', '.cpp', '.h', 
                            '.hpp', '.sh', '.bat', '.ps1', '.log',
                            '.ini', '.conf', '.cfg'
                        }
                        
                        file_extension = os.path.splitext(file_name)[1].lower()
                        
                        if file_extension in text_extensions:
                            try:
                                with open(file_path, 'r', encoding='utf-8') as f:
                                    content = f.read()
                                is_text = True
                            except UnicodeDecodeError:
                                encodings = ['latin-1', 'cp1252', 'iso-8859-1']
                                for encoding in encodings:
                                    try:
                                        with open(file_path, 'r', encoding=encoding) as f:
                                            content = f.read()
                                        is_text = True
                                        break
                                    except UnicodeDecodeError:
                                        continue
                        
                        file_info.append({
                            "file_name": os.path.basename(file_name),
                            "file_extension": file_extension,
                            "file_path": file_path,
                            "file_content": content if is_text else "",
                            "file_size": os.path.getsize(file_path) / 1024  # Convert to KB
                        })
                    except Exception as e:
                        print(f"Error processing file {file_name}: {str(e)}")
                        continue
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Error processing zip file: {str(e)}"
        )
    return file_info


@router.post("/create", response_model=RAGDatabaseSchema)
async def create_rag_database(
    dataset: UploadFile = File(...),
    name: str = Form(...),
    rag_type: str = Form(...),
    llm_model: str = Form(...),
    embedding_model: str = Form(...),
    chunking_option: str = Form(...),
    vector_db: str = Form(...),
    search_option: str = Form(...),
    db: Session = Depends(get_db)
):
    # Validate file is a zip
    if not dataset.filename.endswith('.zip'):
        raise HTTPException(
            status_code=400,
            detail="File must be a ZIP archive"
        )
    
    # Create directories if they don't exist
    os.makedirs("rag_zip_uploads", exist_ok=True)
    os.makedirs("rag_extracted_uploads", exist_ok=True)
    
    # Create unique directories for this upload
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    zip_dir = f"rag_zip_uploads/{name}_{timestamp}"
    extract_dir = f"rag_extracted_uploads/{name}_{timestamp}"
    
    try:
        # Create directories for this specific upload
        os.makedirs(zip_dir, exist_ok=True)
        os.makedirs(extract_dir, exist_ok=True)

        # Save zip file
        zip_path = os.path.join(zip_dir, dataset.filename)
        try:
            with open(zip_path, "wb") as buffer:
                shutil.copyfileobj(dataset.file, buffer)
        except Exception as e:
            raise HTTPException(
                status_code=400,
                detail=f"Failed to save uploaded file: {str(e)}"
            )

        # Validate zip file
        try:
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                if zip_ref.testzip() is not None:
                    raise HTTPException(
                        status_code=400,
                        detail="Corrupted ZIP file"
                    )
        except zipfile.BadZipFile:
            raise HTTPException(
                status_code=400,
                detail="Invalid ZIP file"
            )

        # Initialize RAG Pipeline BEFORE database creation
        pipeline = RAGPipeline(
            rag_type=rag_type,
            llm_model=llm_model,
            embedding_model=embedding_model,
            chunking_option=chunking_option,
            vector_db=vector_db,
            search_option=search_option,
            database_name=name,
            database_id='Temp'
        )
        
        # Process documents first
        processed_documents = pipeline.process_documents(zip_path)
        
        # Check if documents were processed
        if not processed_documents:
            raise HTTPException(
                status_code=400,
                detail="No documents were successfully processed"
            )

        # Create RAG database record AFTER processing documents
        try:
            db_rag = RAGDatabase(
                name=name,
                dataset_path=extract_dir,
                zip_file_path=zip_path,
                rag_type=rag_type,
                llm_model=llm_model,
                embedding_model=embedding_model,
                chunking_option=chunking_option,
                vector_db=vector_db,
                search_option=search_option,
                total_files=len(processed_documents),
                status="Processed"
            )
            db.add(db_rag)
            db.flush()  # This assigns an ID to db_rag

            # Create file records
            for doc in processed_documents:
                db_file = RAGFile(
                    rag_database_id=db_rag.id,
                    file_name=doc.metadata.get("file_name", ""),
                    file_extension=doc.metadata.get("file_type", ""),
                    file_path=doc.metadata.get("source", ""),
                    file_size=doc.metadata.get("file_size", 0),
                    file_content=doc.page_content
                )
                db.add(db_file)

            # Commit all changes
            db.commit()
            db.refresh(db_rag)
            
            return db_rag

        except SQLAlchemyError as e:
            db.rollback()
            raise HTTPException(
                status_code=500,
                detail=f"Database error: {str(e)}"
            )

    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Catch and handle any other unexpected errors
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process RAG database: {str(e)}"
        )

@router.get("/list")
async def get_rag_databases(db: Session = Depends(get_db)):
    """Get all RAG databases"""
    try:
        from ..models.rag import RAGDatabase as RAGDatabaseModel
        return db.query(RAGDatabaseModel).all()
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
        

@router.get("/{rag_id}")
async def get_rag_database(rag_id: int, db: Session = Depends(get_db)):
    """Get a specific RAG database by ID"""
    try:
        db_rag = db.query(RAGDatabase).filter(RAGDatabase.id == rag_id).first()
        if db_rag is None:
            raise HTTPException(
                status_code=404,
                detail="RAG database not found"
            )
        return db_rag
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )

@router.delete("/{rag_id}")
async def delete_rag_database(rag_id: int, db: Session = Depends(get_db)):
    """Delete a RAG database by ID"""
    try:
        db_rag = db.query(RAGDatabase).filter(RAGDatabase.id == rag_id).first()
        if db_rag is None:
            raise HTTPException(
                status_code=404,
                detail="RAG database not found"
            )

        # Delete associated files and directories
        if os.path.exists(db_rag.zip_file_path):
            os.remove(db_rag.zip_file_path)
        if os.path.exists(db_rag.dataset_path):
            shutil.rmtree(db_rag.dataset_path)

        # Delete database record
        db.delete(db_rag)
        db.commit()
        return {"message": "RAG database deleted successfully"}

    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail=f"Database error: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete RAG database: {str(e)}"
        )

@router.get("/test/{rag_id}/status")
async def test_vector_store(rag_id: int, db: Session = Depends(get_db)):
    """Test any vector store database and return its status"""
    try:
        # Get RAG database info
        db_rag = db.query(RAGDatabase).filter(RAGDatabase.id == rag_id).first()
        if not db_rag:
            raise HTTPException(
                status_code=404,
                detail="RAG database not found"
            )

        status_info = {}
        print("Name of db", db_rag.name)
        
        if db_rag.vector_db == "chromadb":
            try:
                print("1")
                # Use PersistentClient with specific path
                client = chromadb.PersistentClient(path="./chroma_db")
                print("2")
                # Generate consistent collection name
                # collection_name = f"rag_{db_rag.name.lower()}_{db_rag.id}"
                collection_name = f"rag-{db_rag.name.lower()}-Temp"
                print("3")
                try:
                    # Try to get the collection
                    print("********************8")
                    collection = client.get_collection(name=collection_name)
                    print("4")
                    status_info = {
                        "collection_name": collection.name,
                        "total_documents": collection.count(),
                        "status": "active"
                    }
                    print("5")
                
                except ValueError:
                    # Collection not found
                    collections = client.list_collections()
                    print("6")
                    status_info = {
                        "status": "not_found",
                        "available_collections": [c.name for c in collections],
                        "error": f"No collection found matching {collection_name}"
                    }
                
                except Exception as e:
                    # Fallback error handling
                    print("7")
                    status_info = {
                        "status": "error",
                        "error": str(e),
                        "available_collections": [c.name for c in client.list_collections()]
                    }
            
            except Exception as e:
                print("8")
                status_info = {
                    "status": "error",
                    "error": str(e)
                }

        elif db_rag.vector_db == "pinecone":
            try:
                # Initialize Pinecone client
                pc = Pinecone(api_key="pcsk_7BJ2Bj_DRSQZvLAjq9CdAtcNsXNTB38PsCYbbSC38REHTANgfY2PznaEAY48ReEQBWozni")
                
                # List all available indexes
                # available_indexes = pc.list_indexes().names()
                available_indexes = "pineenv"
                
                # Look for an index that matches our naming pattern
                base_name = f"rag-{db_rag.name.lower()}-temp"
                # matching_indexes = [idx for idx in available_indexes if idx.startswith(base_name)]
                matching_indexes = [idx for idx in available_indexes if idx.startswith(available_indexes)]
                if matching_indexes:
                    # Get the most recently created index (highest number)
                    index_name = sorted(matching_indexes)[-1]
                    index = pc.Index(index_name)
                    index_stats = index.describe_index_stats()
                    
                    status_info = {
                        "collection_name": index_name,
                        "total_vectors": index_stats.get('total_vector_count', 0),
                        "dimension": index_stats.get('dimension', 0),
                        "status": "active",
                        "all_matching_indexes": matching_indexes  # Added for debugging
                    }
                else:
                    status_info = {
                        "status": "not_found",
                        "available_indexes": available_indexes,
                        "error": f"No index found matching pattern {base_name}"
                    }
                
            except Exception as e:
                status_info = {
                    "status": "error",
                    "error": str(e)
                }

        elif db_rag.vector_db == "weaviate":
            try:
                # Initialize Weaviate client
                client = weaviate.Client(url="http://localhost:8080")
                
                # Generate class name
                # class_name = f"RAG_{db_rag.name.replace(' ', '_').lower()}_{db_rag.id}"
                class_name = f"RAG-{db_rag.name.replace(' ', '_').lower()}-Temp"
                
                try:
                    # Check if class exists
                    if client.schema.exists(class_name):
                        # Count objects in the class
                        count = client.query.aggregate(class_name).with_meta_count().do()
                        
                        status_info = {
                            "collection_name": class_name,
                            "total_objects": count['data']['Aggregate'][class_name][0]['meta']['count'],
                            "status": "active"
                        }
                    else:
                        status_info = {
                            "status": "not_found",
                            "error": f"No class found matching {class_name}"
                        }
                
                except Exception as e:
                    status_info = {
                        "status": "error",
                        "error": str(e)
                    }
            
            except Exception as e:
                status_info = {
                    "status": "error",
                    "error": str(e)
                }

        elif db_rag.vector_db == "faiss":
            try:
                # For FAISS, we'll need to load the index file
                import faiss
                
                # Assuming indexes are saved with a specific naming convention
                # index_path = f"./faiss_indexes/rag_{db_rag.name.lower()}_{db_rag.id}.index"
                index_path = f"./faiss_indexes/rag-{db_rag.name.lower()}-Temp.index"
                
                try:
                    # Load the index
                    index = faiss.read_index(index_path)
                    
                    status_info = {
                        "collection_name": f"rag-{db_rag.name.lower()}-{db_rag.id}",
                        "total_vectors": index.ntotal,
                        "dimension": index.d,
                        "status": "active"
                    }
                
                except Exception as e:
                    status_info = {
                        "status": "error",
                        "error": str(e)
                    }
            
            except Exception as e:
                status_info = {
                    "status": "error",
                    "error": str(e)
                }

        return {
            "status": "success",
            "db_info": {
                "id": db_rag.id,
                "name": db_rag.name,
                "vector_db": db_rag.vector_db,
                "created_at": db_rag.created_at,
                "status": db_rag.status
            },
            "store_info": status_info
        }

    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error testing vector store: {str(e)}"
        )

@router.post("/test/{rag_id}/query")
async def test_rag_query(
    rag_id: int,
    query: str = Body(...),
    top_k: int = Body(5),
    db: Session = Depends(get_db)
):
    """Test RAG by running a query against the vector store"""
    try:
        # Get RAG database info
        db_rag = db.query(RAGDatabase).filter(RAGDatabase.id == rag_id).first()
        if not db_rag:
            raise HTTPException(
                status_code=404,
                detail="RAG database not found"
            )

        # Embedding model for query conversion
        embedding_model = SentenceTransformer(db_rag.embedding_model)
        query_embedding = embedding_model.encode(query).tolist()

        # Documents to store results
        documents = []

        if db_rag.vector_db == "chromadb":
            try:
                # Initialize ChromaDB client
                client = chromadb.PersistentClient(path="./chroma_db")
                
                # Generate collection name
                # collection_name = f"rag_{db_rag.name.lower()}_{db_rag.id}"
                collection_name = f"rag-{db_rag.name.lower()}-Temp"
                
                # Get the collection
                collection = client.get_collection(name=collection_name)
                
                # Query the collection
                results = collection.query(
                    query_embeddings=[query_embedding],
                    n_results=top_k
                )
                
                # Extract documents
                documents = results.get('documents', [[]])[0]
            
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"ChromaDB query error: {str(e)}"
                )

        elif db_rag.vector_db == "pinecone":
            try:
                # Initialize Pinecone client
                pc = Pinecone(api_key="pcsk_2sqpR7_FY6XeaGrqY1NikHysefnoj37anCK9fWMZ5rrxPzW3HU5xWUPVgJZSep9sYpdsCw")
                # index_name = f"rag-{db_rag.name.lower()}-{db_rag.id}"
                index_name = f"rag-{db_rag.name.lower()}-temp"
                
                # Get the index
                index = pc.Index(index_name)
                
                # Query Pinecone index
                results = index.query(
                    vector=query_embedding,
                    top_k=top_k,
                    include_metadata=True
                )
                
                # Extract documents from metadata
                documents = [
                    match.get('metadata', {}).get('content', '') 
                    for match in results.get('matches', [])
                ]
            
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Pinecone query error: {str(e)}"
                )

        elif db_rag.vector_db == "weaviate":
            try:
                # Initialize Weaviate client
                client = weaviate.Client(url="http://localhost:8080")
                
                # Generate class name
                # class_name = f"RAG_{db_rag.name.replace(' ', '_').lower()}_{db_rag.id}"
                class_name = f"RAG-{db_rag.name.replace(' ', '_').lower()}-Temp"
                
                # Perform vector search
                results = (
                    client.query.get(class_name, ["content"])
                    .with_near_vector({
                        "vector": query_embedding
                    })
                    .with_limit(top_k)
                    .do()
                )
                
                # Extract documents
                documents = [
                    item.get('content', '') 
                    for item in results.get('data', {}).get('Get', {}).get(class_name, [])
                ]
            
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"Weaviate query error: {str(e)}"
                )

        elif db_rag.vector_db == "faiss":
            try:
                # Import necessary libraries
                import faiss
                import pickle
                
                # Paths for FAISS index and documents
               
               
                index_path = f"./faiss_indexes/rag-{db_rag.name.lower()}-Temp.index"
                documents_path = f"./faiss_indexes/rag-{db_rag.name.lower()}-Temp_docs.pkl"
                
                # Load FAISS index and stored documents
                index = faiss.read_index(index_path)
                with open(documents_path, 'rb') as f:
                    stored_documents = pickle.load(f)
                
                # Search in FAISS index
                D, I = index.search(
                    np.array(query_embedding).reshape(1, -1).astype('float32'), 
                    top_k
                )
                
                # Extract documents
                documents = [stored_documents[i] for i in I[0]]
            
            except Exception as e:
                raise HTTPException(
                    status_code=500,
                    detail=f"FAISS query error: {str(e)}"
                )

        # If no documents found
        if not documents:
            return {
                "query": query,
                "response": "No relevant documents found",
                "similar_documents": [],
                "metadata": {
                    "vector_db": db_rag.vector_db,
                    "model": db_rag.llm_model,
                    "embedding_model": db_rag.embedding_model
                }
            }

        # Generate response using LLM
        context = "\n".join(documents)
        prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
        
        # Initialize tokenizer and model
        tokenizer = AutoTokenizer.from_pretrained(db_rag.llm_model)
        model = AutoModelForSeq2SeqLM.from_pretrained(db_rag.llm_model)
        generator = pipeline(
            "text2text-generation",
            model=model,
            tokenizer=tokenizer,
            max_length=512
        )
        
        # Generate response
        response = generator(prompt)[0]["generated_text"]

        return {
            "query": query,
            "response": response,
            "similar_documents": documents,
            "metadata": {
                "vector_db": db_rag.vector_db,
                "model": db_rag.llm_model,
                "embedding_model": db_rag.embedding_model,
                "total_chunks_found": len(documents)
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error testing query: {str(e)}"
        )

class RAGLoadRequest(BaseModel):
    rag_name: str

@router.post("/test/load")
async def load_rag_database(request: RAGLoadRequest, db: Session = Depends(get_db)):
    """Load a RAG database for use with the chatbot"""
    try:
        # Find the RAG database by name
        db_rag = db.query(RAGDatabase).filter(RAGDatabase.name == request.rag_name).first()
        if not db_rag:
            return {
                "success": False,
                "error": f"RAG database '{request.rag_name}' not found"
            }
            
        # Initialize RAG Pipeline
        pipeline = RAGPipeline(
            rag_type=db_rag.rag_type,
            llm_model=db_rag.llm_model,
            embedding_model=db_rag.embedding_model,
            chunking_option=db_rag.chunking_option,
            vector_db=db_rag.vector_db,
            search_option=db_rag.search_option,
            database_name=db_rag.name,
            database_id=str(db_rag.id),
            load_only=True
        )
        
        # Load the vector store
        success = pipeline.load_vector_store()
        
        # Store the pipeline in memory for later use in inference
        global _loaded_pipelines
        _loaded_pipelines[db_rag.name] = pipeline
       
        # Update database status
        db_rag.status = "Loaded"
        db.commit()
            
        return {
            "success": True,
            "message": f"RAG database '{request.rag_name}' loaded successfully",
            "database_info": {
                "id": db_rag.id,
                "name": db_rag.name,
                "vector_db": db_rag.vector_db,
                "status": db_rag.status
            }
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error loading RAG database: {str(e)}"
        }


@router.get("/test/loaded")
async def list_loaded_databases():
    """List all loaded RAG databases"""
    global _loaded_pipelines
    return {
        "success": True,
        "loaded_databases": list(_loaded_pipelines.keys())
    }