import traceback
import os
import re
import chromadb  # Import chromadb at the top level
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from document_loader import DocumentLoader
from chunker import ChunkerFactory
from embedings import EnhancedEmbeddingGenerator
from vector_store import VectorStoreFactory
from vector_search import SearchFactory
from rag_types import (
    StandardRAG, GraphRAG, AdaptiveRAG, RaptorRAG, 
    IterativeRAG, CorrectiveRAG, RefeedRAG, 
    SelfReflectiveRAG, FusionRAG, SpeculativeRAG,
    AgenticRAG, RealmRAG
)
from prompt_optimizer import PromptOptimizer
from reranking_model import RerankingModel

class RAGPipeline:
    def __init__(self):
        """Initialize RAG pipeline with user interaction and cleanup handling"""
        self.cleanup_required = False
        self.document_loader = DocumentLoader()
        
        try:
            # First, prompt user to upload a document
            print("\nPlease upload your document.")
            zip_path = input("Enter the path to your document: ")
            
            # Store document path for future reference
            self.document_path = zip_path
            
            # Check if documents are valid before proceeding
            if not os.path.exists(zip_path):
                raise FileNotFoundError(f"File not found at path: {zip_path}")
            
            # Define common vector database paths to check
            vectordb_paths = {
                "weaviate": "./weaviate_data",
                "chromadb": "./chroma_db",
                "chromadb_alt": "./chromadb_data",  # Add alternate ChromaDB path
                "faiss": "./faiss_data",
                "pinecone": "./pinecone_data"
            }
            
            # Check if any vector database exists
            existing_db = None
            existing_db_type = None
            
            for db_type, db_path in vectordb_paths.items():
                if os.path.exists(db_path):
                    # Check if the path exists and contains any files or directories
                    content = os.listdir(db_path)
                    if content:
                        print(f"\nFound existing vector database at {db_path}")
                        existing_db = db_path
                        existing_db_type = db_type
                        break
                    else:
                        print(f"Found empty directory at {db_path}, not using as vector database")
            
            # Ask user if they want to use the existing database
            use_existing_db = False
            if existing_db:
                choice = input(f"Do you want to use the existing {existing_db_type} database? (y/n): ").strip().lower()
                use_existing_db = choice in ['y', 'yes']
                
                if use_existing_db:
                    print(f"Using existing {existing_db_type} database from {existing_db}")
                    # If we found chromadb_alt, set the db_type to chromadb
                    if existing_db_type == "chromadb_alt":
                        existing_db_type = "chromadb"
                        
                    # For ChromaDB, detect the embedding dimension from the existing collection
                    if existing_db_type == "chromadb":
                        try:
                            # Temporarily create a client to check collection properties
                            temp_client = chromadb.PersistentClient(path=existing_db)
                            
                            # Try to get the existing collection name
                            collection_name_file = os.path.join(existing_db, "collection_name.txt")
                            collection_name = "documents"  # Default name
                            
                            # Check if we have a saved collection name
                            if os.path.exists(collection_name_file):
                                with open(collection_name_file, 'r') as f:
                                    collection_name = f.read().strip()
                            
                            # For ChromaDB v0.6.0 and later, list_collections returns only names
                            collection_names = temp_client.list_collections()
                            collection_found = False
                            
                            # Look for a collection starting with our target name
                            matching_collection_name = None
                            for coll_name in collection_names:
                                if coll_name.startswith(collection_name):
                                    collection_found = True
                                    matching_collection_name = coll_name
                                    print(f"Using existing collection: {coll_name}")
                                    break
                            
                            if matching_collection_name:
                                # Get the collection
                                collection = temp_client.get_collection(matching_collection_name)
                                
                                # Test query to determine embedding size
                                try:
                                    import numpy as np
                                    # Create a random query embedding with dimensions that match the collection
                                    # Try different dimensions until one works
                                    dimensions_to_try = [384, 768, 1024]  # Common embedding dimensions
                                    matching_dimension = None
                                    
                                    for dim in dimensions_to_try:
                                        try:
                                            # Get sample embedding and use for test query
                                            random_embedding = np.random.rand(dim).tolist()
                                            _ = collection.query(
                                                query_embeddings=[random_embedding],
                                                n_results=1
                                            )
                                            matching_dimension = dim
                                            print(f"Detected embedding dimension: {matching_dimension}")
                                            break
                                        except Exception as e:
                                            if "dimension" in str(e).lower():
                                                continue
                                            else:
                                                # Some other error occurred
                                                print(f"Error testing dimension {dim}: {str(e)}")
                                    
                                    if matching_dimension:
                                        # Find the appropriate embedding model for this dimension
                                        dimension_to_model = {
                                            384: "sentence-transformers/all-MiniLM-L6-v2",  # 384 dimensions
                                            768: "BAAI/bge-base-en-v1.5",                  # 768 dimensions
                                            1024: "intfloat/e5-large-v2"                   # 1024 dimensions
                                        }
                                        
                                        embedding_model = dimension_to_model.get(matching_dimension, "intfloat/e5-large-v2")
                                        print(f"Using compatible embedding model: {embedding_model}")
                                except Exception as e:
                                    print(f"Could not determine embedding dimension: {str(e)}")
                        except Exception as e:
                            print(f"Error inspecting existing ChromaDB: {str(e)}")
                else:
                    print("Not using existing database. Setting up new configuration.")
                    existing_db = None
                    existing_db_type = None
            
            # If using existing database, use simplified configuration
            if use_existing_db and existing_db:
                # Ask for RAG type
                rag_options = [
                    "standard", "graph", "adaptive", "raptor", 
                    "iterative", "corrective", "refeed",
                    "self-reflective", "fusion", "speculative", "agentic", "realm"
                ]
                print("\nSelect RAG Type:")
                for i, rag_type in enumerate(rag_options, 1):
                    print(f"{i}. {rag_type}")
                rag_choice = int(input("Enter the number of your choice: "))
                rag_type = rag_options[rag_choice - 1]
                
                # Ask for search algorithm only
                search_options = ["hnsw", "faiss", "brute_force", "annoy"]
                print("\nSelect Search Algorithm:")
                for i, method in enumerate(search_options, 1):
                    print(f"{i}. {method}")
                search_choice = int(input("Enter the number of your choice: "))
                search_algorithm = search_options[search_choice - 1]
                
                # Use default values for other parameters
                llm_model = "google/flan-t5-large"
                embedding_model = embedding_model if 'embedding_model' in locals() else "intfloat/e5-large-v2"
                chunking_method = "recursive"
                max_tokens = 100
                token_overlap = 10
                
                # Initialize with existing vector store
                self.vector_store = VectorStoreFactory.create_store(
                    store_type=existing_db_type,
                    embedding_model=embedding_model,
                    persist_directory=existing_db
                )
                
            else:
                # No existing database or user chose not to use it, go through full configuration
                print("Setting up new configuration.")
                
                # Ask for RAG type
                rag_options = [
                    "standard", "graph", "adaptive", "raptor", 
                    "iterative", "corrective", "refeed",
                    "self-reflective", "fusion", "speculative", "agentic", "realm"
                ]
                print("\nSelect RAG Type:")
                for i, rag_type in enumerate(rag_options, 1):
                    print(f"{i}. {rag_type}")
                rag_choice = int(input("Enter the number of your choice: "))
                rag_type = rag_options[rag_choice - 1]
                
                # Set fixed confidence threshold for adaptive RAG
                confidence_threshold = 0.7 if rag_type == "adaptive" else None

                # Set fixed RAPTOR parameters
                raptor_params = {}
                if rag_type == "raptor":
                    raptor_params = {
                        'token_weight_threshold': 0.5,
                        'max_prompt_attempts': 3
                    }

                # Show LLM model selection menu 
                llm_options = ["google/flan-t5-large", "google/flan-t5-base", "t5-small"]
                print("\nSelect Language Model:")
                for i, model in enumerate(llm_options, 1):
                    print(f"{i}. {model}")
                llm_choice = int(input("Enter the number of your choice: "))
                selected_llm_model = llm_options[llm_choice - 1]
                llm_model = selected_llm_model

                # Set fixed reranking model for RAPTOR
                reranking_model = None
                if rag_type == "raptor":
                    reranking_model = "cross-encoder/ms-marco-MiniLM-L-6-v2"

                embedding_options = ["sentence-transformers/all-MiniLM-L6-v2", 
                                   "Alibaba-NLP/gte-large-en-v1.5",
                                   "intfloat/e5-large-v2", 
                                   "BAAI/bge-large-en-v1.5"]
                print("\nSelect Embedding Model:")
                for i, model in enumerate(embedding_options, 1):
                    print(f"{i}. {model}")
                embedding_choice = int(input("Enter the number of your choice: "))
                selected_embedding_model = embedding_options[embedding_choice - 1]
                
                embedding_model = "intfloat/e5-large-v2" if selected_embedding_model == "Alibaba-NLP/gte-large-en-v1.5" else selected_embedding_model

                chunking_options = ["recursive", "semantic", "sentence", "token", "fixed", "agentic"]
                print("\nSelect Chunking Method:")
                for i, method in enumerate(chunking_options, 1):
                    print(f"{i}. {method}")
                chunking_choice = int(input("Enter the number of your choice: "))
                chunking_method = chunking_options[chunking_choice - 1]
                
                db_options = ["weaviate", "chromadb", "faiss", "pinecone"]
                print("\nSelect Vector Database:")
                for i, db in enumerate(db_options, 1):
                    print(f"{i}. {db}")
                db_choice = int(input("Enter the number of your choice: "))
                vector_db = db_options[db_choice - 1]

                search_options = ["hnsw", "faiss", "brute_force", "annoy"]
                print("\nSelect Search Algorithm:")
                for i, method in enumerate(search_options, 1):
                    print(f"{i}. {method}")
                search_choice = int(input("Enter the number of your choice: "))
                search_algorithm = search_options[search_choice - 1]

                # Set fixed values for tokens and overlap
                max_tokens = 100
                token_overlap = 10

                # Initialize vector store with persistence
                self.vector_store = VectorStoreFactory.create_store(
                    store_type=vector_db,
                    embedding_model=embedding_model,
                    persist_directory=f"./{vector_db}_data"
                )
            
            # Common initialization for both paths (existing DB or new setup)
            self.chunker = ChunkerFactory.create_chunker(chunking_method, max_tokens, token_overlap)
            self.embedding_generator = EnhancedEmbeddingGenerator(
                model_name=embedding_model,
                batch_size=32
            )
            self.search_algorithm = SearchFactory.create_search_algorithm(search_algorithm)
            
            # Initialize language model with optimized parameters
            self.tokenizer = AutoTokenizer.from_pretrained(llm_model)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(llm_model)
            
            # UPDATED: Enhanced generator configuration for better responses
            self.generator = pipeline(
                "text2text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_length=512  # Keep it simple like the second code
            )
            
            # Initialize base parameters
            base_params = {
                'document_loader': self.document_loader,
                'chunker': self.chunker,
                'embedding_generator': self.embedding_generator,
                'vector_store': self.vector_store,
                'search_algorithm': self.search_algorithm,
                'generator': self.generator
            }

            # Process the document if this is a new setup (not using existing DB)
            if not existing_db:
                print(f"\nProcessing document: {zip_path}")
                # Load the documents first
                self.documents = self.document_loader.load_documents(zip_path)
                print(f"Loaded {len(self.documents)} document(s)")
                
                # Create chunks
                self.chunks = self.chunker.chunk_documents(self.documents)
                print(f"Created {len(self.chunks)} chunk(s)")
                
                # Generate embeddings
                embeddings = self.embedding_generator.generate_embeddings([chunk.page_content for chunk in self.chunks])
                print(f"Generated {len(embeddings)} embedding(s)")
                
                # Store in vector database
                self.vector_store.store_embeddings(self.chunks, embeddings)
                print("Document processed and stored in vector database.")
            else:
                print("Using existing vector database.")
                # Load documents for reference even with existing DB
                try:
                    self.documents = self.document_loader.load_documents(zip_path)
                    print(f"Loaded {len(self.documents)} document(s) from {zip_path}")
                    self.chunks = self.chunker.chunk_documents(self.documents)
                    print(f"Created {len(self.chunks)} chunk(s) for reference")
                except Exception as e:
                    print(f"Note: Could not load document for reference: {str(e)}")
            
            # Extended RAG type initialization including Agentic
            if rag_type == "standard":
                self.rag_implementation = StandardRAG(**base_params)
            elif rag_type == "graph":
                self.rag_implementation = GraphRAG(**base_params)
            elif rag_type == "adaptive":
                self.rag_implementation = AdaptiveRAG(
                    confidence_threshold=confidence_threshold,
                    **base_params
                )
            elif rag_type == "raptor":
                reranking_model_instance = RerankingModel(model_name=reranking_model)
                prompt_optimizer = PromptOptimizer(
                    embedding_generator=self.embedding_generator,
                    tokenizer=self.tokenizer
                )
                self.rag_implementation = RaptorRAG(
                    reranking_model=reranking_model_instance,
                    prompt_optimizer=prompt_optimizer,
                    **raptor_params,
                    **base_params
                )
            elif rag_type == "iterative":
                self.rag_implementation = IterativeRAG(
                    max_iterations=3,
                    **base_params
                )
            elif rag_type == "corrective":
                self.rag_implementation = CorrectiveRAG(
                    fact_checker=None,
                    correction_threshold=0.7,
                    max_correction_attempts=2,
                    **base_params
                )
            elif rag_type == "refeed":
                self.rag_implementation = RefeedRAG(
                    k_passages=3,
                    num_candidates=3,
                    **base_params
                )
            elif rag_type == "self-reflective":
                self.rag_implementation = SelfReflectiveRAG(
                    relevance_threshold=0.7,
                    max_iterations=3,
                    **base_params
                )
            elif rag_type == "fusion":
                self.rag_implementation = FusionRAG(
                    num_similar_queries=4,
                    fusion_k=60,
                    **base_params
                )
            elif rag_type == "realm":
                self.rag_implementation = RealmRAG(
                    max_context_docs=5,
                    max_refinement_steps=2,
                    **base_params
                )
            elif rag_type == "speculative":
                # For speculative RAG, extend the generator with additional capabilities
                speculative_generator = {
                    'generator': self.generator,
                    'speculation_threshold': 0.8,
                    'max_speculation_length': 50
                }
                base_params['generator'] = speculative_generator
                self.rag_implementation = SpeculativeRAG(**base_params)
            elif rag_type == "agentic":
                # Initialize Agentic RAG
                self.rag_implementation = AgenticRAG(**base_params)
                # Set the agentic parameters after initialization
                if hasattr(self.rag_implementation, 'reasoning_steps'):
                    self.rag_implementation.reasoning_steps = 3
                if hasattr(self.rag_implementation, 'task_decomposition_threshold'):
                    self.rag_implementation.task_decomposition_threshold = 0.7
                if hasattr(self.rag_implementation, 'context_refresh_rate'):
                    self.rag_implementation.context_refresh_rate = 2
            
            print("RAG Pipeline initialized successfully. Ready to generate responses.")
                
        except Exception as e:
            print(f"Error during initialization: {str(e)}")
            traceback.print_exc()
            raise

    def process_documents(self, zip_path: str = None):
        """
        Process documents through the selected RAG implementation.
        If zip_path is None, use the document path provided during initialization.
        """
        try:
            # If we already have documents and chunks, just return them
            if hasattr(self, 'documents') and self.documents:
                print("Documents already processed.")
                return self.documents
                
            # If zip_path is None, use the document path from initialization
            if zip_path is None and hasattr(self, 'document_path'):
                zip_path = self.document_path
            
            # Check if we're reprocessing documents with existing vector store
            print(f"Processing documents...")
            if hasattr(self, 'vector_store') and hasattr(self.vector_store, 'collection'):
                # For ChromaDB, we should use the document loader and chunker but skip the vector store addition
                documents = self.document_loader.load_documents(zip_path)
                chunks = self.chunker.chunk_documents(documents)
                # Store the chunks for later use but don't add to vector store
                self.documents = documents
                self.chunks = chunks
                self.cleanup_required = True
                return documents
            else:
                # Normal processing through the RAG implementation
                documents = self.rag_implementation.process_documents(zip_path)
                self.cleanup_required = True
                self.documents = documents
                return documents
        except Exception as e:
            print(f"Error processing documents: {str(e)}")
            traceback.print_exc()
            self.cleanup()
            return []

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Generate response using the selected RAG implementation"""
        try:
            return self.rag_implementation.generate_response(query, max_length)
        except Exception as e:
            print(f"Error generating response: {str(e)}")
            return ""

    def _minimal_clean_response(self, text):
        """Apply minimal cleaning to preserve content but fix formatting issues"""
        if not text:
            return ""
            
        # Remove HTML tags
        text = re.sub(r'<[^>]+>', '', text)
        
        # Replace HTML entities
        text = re.sub(r'&nbsp;', ' ', text)
        text = re.sub(r'&amp;', '&', text)
        text = re.sub(r'&lt;', '<', text)
        text = re.sub(r'&gt;', '>', text)
        
        # Normalize whitespace
        text = re.sub(r'\s+', ' ', text)
        
        # Remove redundant question repetition only if at beginning
        text = re.sub(r'^The question is[:]?\s*.*?[\.\?]\s*', '', text)
        text = re.sub(r'^Question[:]?\s*.*?[\.\?]\s*', '', text)
        
        # Remove repeated sentences (but NOT content matching "Data Science is")
        clean_pattern = r'(.{30,}?)\s*\1+'
        while re.search(clean_pattern, text):
            text = re.sub(clean_pattern, r'\1', text)
        
        # Fix common abbreviation spacing
        text = re.sub(r'(\w)\.(\w)', r'\1. \2', text)
        
        return text.strip()

    def debug_document_processing(self):
        """Debug method to verify document loading and indexing"""
        
        # Check if document file exists
        if hasattr(self, 'document_path'):
            if os.path.exists(self.document_path):
                print(f"Document path exists: {self.document_path}")
                
                # Try to load the document directly
                try:
                    test_docs = self.document_loader.load_documents(self.document_path)
                    print(f"Test loading document: Success - {len(test_docs)} document(s)")
                except Exception as e:
                    print(f"Test loading document: Failed - {str(e)}")
            else:
                print(f"Document path does not exist: {self.document_path}")
        else:
            print("Document path not set")
        
        # Check if we have documents loaded
        if hasattr(self, 'documents') and self.documents:
            print(f"Documents loaded: {len(self.documents)} document(s)")
            for i, doc in enumerate(self.documents[:2]):  # Show first 2 docs
                print(f"Document {i+1} sample: {str(doc)[:100]}...")
        else:
            print("No documents loaded into memory.")
        
        # Check chunks
        if hasattr(self, 'chunks') and self.chunks:
            print(f"Chunks created: {len(self.chunks)} chunk(s)")
            for i, chunk in enumerate(self.chunks[:2]):  # Show first 2 chunks
                print(f"Chunk {i+1} sample: {chunk.page_content[:100]}...")
        else:
            print("No chunks stored in memory.")
        
        # Check vector store
        if hasattr(self, 'vector_store'):
            print(f"Vector store type: {type(self.vector_store).__name__}")
            
            # Check if ChromaDB collection exists
            if hasattr(self.vector_store, 'collection'):
                try:
                    # Get collection info
                    print(f"Collection name: {self.vector_store.collection.name}")
                    
                    # Try to get collection count
                    try:
                        count = self.vector_store.collection.count()
                        print(f"Number of embeddings in collection: {count}")
                    except Exception as e:
                        print(f"Error getting collection count: {str(e)}")
                    
                    # Test basic query to verify collection works
                    try:
                        # Use a simple test query
                        test_query = "test"
                        test_embedding = self.embedding_generator.generate_embeddings([test_query])[0]
                        
                        # Query with limit 1 to test
                        results = self.vector_store.collection.query(
                            query_embeddings=[test_embedding],
                            n_results=1,
                            include=["documents"]
                        )
                        
                        if 'documents' in results and results['documents'] and len(results['documents']) > 0:
                            doc_sample = results['documents'][0][0]
                            print(f"Test query successful. Sample result:\n{doc_sample[:150]}...")
                            
                            # Try to load documents again if not already loaded
                            if (not hasattr(self, 'documents') or not self.documents) and hasattr(self, 'document_path'):
                                try:
                                    print("Attempting to load documents from file...")
                                    self.documents = self.document_loader.load_documents(self.document_path)
                                    self.chunks = self.chunker.chunk_documents(self.documents)
                                    print(f"Successfully loaded {len(self.documents)} document(s) and created {len(self.chunks)} chunk(s)")
                                except Exception as e:
                                    print(f"Error loading documents from file: {str(e)}")
                        else:
                            print("Test query returned no results.")
                    except Exception as e:
                        print(f"Error performing test query: {str(e)}")
                except Exception as e:
                    print(f"Error accessing collection info: {str(e)}")
            else:
                print("No collection found in vector store.")
        else:
            print("No vector store initialized.")
        
        print("========================================")
        
        # Provide troubleshooting guidance based on findings
        if hasattr(self.vector_store, 'collection'):
            try:
                count = self.vector_store.collection.count()
                if count > 0:
                    # Vector store has data but documents might not be loaded in memory
                    if not hasattr(self, 'documents') or not self.documents:
                        if hasattr(self, 'document_path') and os.path.exists(self.document_path):
                            return "Vector database contains embeddings, but documents aren't loaded in memory. Attempting to load them now."
                        else:
                            return "Vector database contains embeddings, but cannot find source document. Query will use database content only."
                    return f"Document processing appears complete. {count} embeddings found in vector store."
                else:
                    return "Issue detected: Vector database exists but contains no embeddings. Try reprocessing the document."
            except Exception as e:
                # Could not get count, but collection exists
                return f"Vector database exists, but encountered error checking embeddings: {str(e)}"
        elif hasattr(self, 'documents') and self.documents and hasattr(self, 'chunks') and self.chunks:
            return "Documents and chunks are in memory, but not stored in vector database. Try reinitializing with a new vector database."
        elif not hasattr(self, 'documents') or not self.documents:
            return "Issue detected: No documents were loaded. Check document path and file format."
        elif not hasattr(self, 'chunks') or not self.chunks:
            return "Issue detected: Documents were loaded but not chunked properly."
        elif not hasattr(self, 'vector_store'):
            return "Issue detected: Vector store not initialized."
        
        return "Document processing status unclear. Try reinitializing the pipeline."
        
    def cleanup(self):
        """Cleanup resources"""
        if hasattr(self, 'cleanup_required') and self.cleanup_required:
            try:
                if hasattr(self, 'document_loader'):
                    self.document_loader.cleanup()
                print("Resources cleaned up successfully.")
            except Exception as e:
                print(f"Error during cleanup: {str(e)}")
                traceback.print_exc()
        else:
            print("No cleanup required.")

    def __del__(self):
        """Destructor to ensure cleanup"""
        try:
            self.cleanup()
        except:
            pass