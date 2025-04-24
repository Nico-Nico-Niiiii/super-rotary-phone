


# import traceback
# from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
# from app.RAG.document_loader import DocumentLoader
# from app.RAG.chunker_factory import ChunkerFactory
# from app.RAG.embedings_geneartor import EnhancedEmbeddingGenerator
# from app.RAG.vector_store import VectorStoreFactory
# from app.RAG.vector_search import SearchFactory
# from app.RAG.rag_types import StandardRAG, GraphRAG, AdaptiveRAG, RaptorRAG, CorrectiveRAG, IterativeRAG
# from app.RAG.prompt_optimizer import PromptOptimizer
# from app.RAG.reranking_model import RerankingModel
# from app.RAG.fact_checker import FactChecker

# class RAGPipeline:
#     def __init__(self, rag_type: str, llm_model: str, embedding_model: str, 
#                  chunking_option: str, vector_db: str, search_option: str,  database_name: str = None, 
#                 database_id: str = None ):
#         """
#         Initialize RAG pipeline with provided configurations
        
#         Args:
#             rag_type (str): Type of RAG implementation to use
#             llm_model (str): Language model to use
#             embedding_model (str): Embedding model to use
#             chunking_option (str): Method for chunking documents
#             vector_db (str): Vector database to use
#             search_option (str): Search algorithm to use
#         """
#         self.cleanup_required = False
        
#         try:
#             collection_name = None
#             if database_name:
#                 collection_name = f"rag-{database_name.lower()}-{database_id or 'temp'}"
#             print("collection_name", collection_name)
#             print(f"🚀 Initializing RAG Pipeline")
#             print(f"  RAG Type: {rag_type}")
#             print(f"  LLM Model: {llm_model}")
#             print(f"  Embedding Model: {embedding_model}")
#             print(f"  Chunking Option: {chunking_option}")
#             print(f"  Vector DB: {vector_db}")
#             print(f"  Search Option: {search_option}")

#             # Handle iterative and corrective RAG types
#             if rag_type in ["iterative", "corrective"]:
#                 rag_type = "graph"
#                 print(f"📝 Note: {rag_type} RAG will use Graph RAG implementation.")
            
#             # Set fixed confidence threshold for adaptive RAG
#             confidence_threshold = 0.7 if rag_type == "adaptive" else None

#             # Set fixed RAPTOR parameters
#             raptor_params = {}
#             if rag_type == "raptor":
#                 raptor_params = {
#                     'token_weight_threshold': 0.5,
#                     'max_prompt_attempts': 3
#                 }

#             # Set fixed reranking model for RAPTOR
#             reranking_model_name = None
#             if rag_type == "raptor":
#                 reranking_model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"

#             # Handle GTE model case
#             if embedding_model == "Alibaba-NLP/gte-large-en-v1.5":
#                 embedding_model = "intfloat/e5-large-v2"

#             # Set fixed values for tokens and overlap
#             max_tokens = 100
#             token_overlap = 10

#             # Initialize components
#             print("🔄 Initializing Document Loader...")
#             self.document_loader = DocumentLoader()
#             print("✅ Document Loader initialized successfully")

#             print(f"🔪 Initializing Chunker with option: {chunking_option}...")
#             self.chunker = ChunkerFactory.create_chunker(chunking_option, max_tokens, token_overlap)
#             print("✅ Chunker initialized successfully")

#             print(f"🧬 Initializing Embedding Generator with model: {embedding_model}...")
#             self.embedding_generator = EnhancedEmbeddingGenerator(
#                 model_name=embedding_model,
#                 batch_size=32
#             )
#             print("✅ Embedding Generator initialized successfully")

#             print(f"📦 Initializing Vector Store: {vector_db}...")
#             self.vector_store = VectorStoreFactory.create_store(
#                 store_type=vector_db,
#                 embedding_model=embedding_model,
#                  collection_name=collection_name,
#                  database_name=database_name
#             )
#             print("✅ Vector Store initialized successfully")

#             print(f"🔍 Initializing Search Algorithm: {search_option}...")
#             self.search_algorithm = SearchFactory.create_search_algorithm(search_option)
#             print("✅ Search Algorithm initialized successfully")
            
#             # Initialize language model
#             print(f"🤖 Initializing Language Model: {llm_model}...")
#             self.tokenizer = AutoTokenizer.from_pretrained(llm_model)
#             self.model = AutoModelForSeq2SeqLM.from_pretrained(llm_model)
#             self.generator = pipeline(
#                 "text2text-generation",
#                 model=self.model,
#                 tokenizer=self.tokenizer,
#                 max_length=512
#             )
#             print("✅ Language Model initialized successfully")

#             self.fact_checker = FactChecker()
            
#             # Initialize RAG implementation
#             base_params = {
#                 'document_loader': self.document_loader,
#                 'chunker': self.chunker,
#                 'embedding_generator': self.embedding_generator,
#                 'vector_store': self.vector_store,
#                 'search_algorithm': self.search_algorithm,
#                 'generator': self.generator
#             }


#             print(f"🧠 Initializing RAG Implementation: {rag_type}...")
#             if rag_type == "standard":
#                 self.rag_implementation = StandardRAG(**base_params)
#             elif rag_type == "graph":
#                 self.rag_implementation = GraphRAG(**base_params)
#             elif rag_type == "corrective":
#                 self.rag_implementation = CorrectiveRAG(fact_checker=self.fact_checker,**base_params)
#             elif rag_type == "iterative":
#                 self.rag_implementation = IterativeRAG(**base_params)
#             elif rag_type == "adaptive":
#                 self.rag_implementation = AdaptiveRAG(
#                     confidence_threshold=confidence_threshold,
#                     **base_params
#                 )
#             elif rag_type == "raptor":
#                 reranking_model = RerankingModel(model_name=reranking_model_name)
#                 prompt_optimizer = PromptOptimizer(
#                     embedding_generator=self.embedding_generator,
#                     tokenizer=self.tokenizer
#                 )
                
#                 self.rag_implementation = RaptorRAG(
#                     reranking_model=reranking_model,
#                     prompt_optimizer=prompt_optimizer,
#                     **raptor_params,
#                     **base_params
#                 )
#             else:
#                 raise ValueError(f"Unsupported RAG type: {rag_type}")
            
#             print("✅ RAG Implementation initialized successfully")
#             print("🎉 RAG Pipeline initialized completely!")
                
#         except Exception as e:
#             print(f"❌ Error during initialization: {str(e)}")
#             traceback.print_exc()
#             raise

#     def process_documents(self, zip_path: str):
#         """
#         Process documents through the selected RAG implementation
        
#         Args:
#             zip_path (str): Path to the ZIP file containing documents
            
#         Returns:
#             List[Document]: List of processed documents
#         """
#         try:
#             print(f"📂 Starting document processing for: {zip_path}")
#             documents = self.rag_implementation.process_documents(zip_path)
            
#             if documents:
#                 print(f"✅ Successfully processed {len(documents)} documents")
#                 print(f"🗃️ Documents loaded into vector store")
#                 self.cleanup_required = True
#             else:
#                 print("⚠️ No documents were processed")
            
#             return documents
#         except Exception as e:
#             print(f"❌ Error processing documents: {str(e)}")
#             traceback.print_exc()
#             self.cleanup()
#             return []

#     def generate_response(self, query: str, max_length: int = 512) -> str:
#         """
#         Generate response using the selected RAG implementation
        
#         Args:
#             query (str): User query
#             max_length (int): Maximum length of generated response
            
#         Returns:
#             str: Generated response
#         """
#         try:
#             print(f"❓ Generating response for query: {query[:50]}...")
#             response = self.rag_implementation.generate_response(query, max_length)
            
#             if response:
#                 print("✅ Response generated successfully")
#             else:
#                 print("⚠️ No response generated")
            
#             return response
#         except Exception as e:
#             print(f"❌ Error generating response: {str(e)}")
#             return ""

#     def cleanup(self):
#         """Cleanup resources"""
#         if self.cleanup_required:
#             try:
#                 print("🧹 Starting cleanup process...")
#                 self.document_loader.cleanup()
#                 print("✅ Cleanup completed successfully")
#             except Exception as e:
#                 print(f"❌ Error during cleanup: {str(e)}")

#     def __del__(self):
#         """Destructor to ensure cleanup"""
#         self.cleanup()

    
#     def load_vector_store(self):
#         """Load an existing vector store based on the database configuration"""
#         try:
#             if self.vector_db == "chromadb":
#                 import chromadb
#                 client = chromadb.PersistentClient(path="./chroma_db")
#                 collection_name = f"rag_{self.database_name.lower()}_Temp"
                
#                 try:
#                     self.vector_store = client.get_collection(name=collection_name)
#                     return True
#                 except ValueError:
#                     print(f"Collection {collection_name} not found")
#                     return False
                    
#             elif self.vector_db == "pinecone":
#                 from pinecone import Pinecone
#                 pc = Pinecone(api_key="pcsk_2sqpR7_FY6XeaGrqY1NikHysefnoj37anCK9fWMZ5rrxPzW3HU5xWUPVgJZSep9sYpdsCw")
#                 index_name = f"rag-{self.database_name.lower()}-temp"
                
#                 try:
#                     self.vector_store = pc.Index(index_name)
#                     return True
#                 except Exception as e:
#                     print(f"Pinecone index error: {str(e)}")
#                     return False
                    
#             elif self.vector_db == "weaviate":
#                 import weaviate
#                 client = weaviate.Client(url="http://localhost:8080")
#                 class_name = f"RAG_{self.database_name.replace(' ', '_').lower()}_Temp"
                
#                 if client.schema.exists(class_name):
#                     self.vector_store = client
#                     self.class_name = class_name
#                     return True
#                 else:
#                     print(f"Weaviate class {class_name} not found")
#                     return False
                    
#             elif self.vector_db == "faiss":
#                 import faiss
#                 import pickle
                
#                 index_path = f"./faiss_indexes/rag_{self.database_name.lower()}_Temp.index"
#                 documents_path = f"./faiss_indexes/rag_{self.database_name.lower()}_Temp_docs.pkl"
                
#                 try:
#                     self.vector_store = faiss.read_index(index_path)
#                     with open(documents_path, 'rb') as f:
#                         self.stored_documents = pickle.load(f)
#                     return True
#                 except Exception as e:
#                     print(f"FAISS loading error: {str(e)}")
#                     return False
                    
#             return False
#         except Exception as e:
#             print(f"Error loading vector store: {str(e)}")
#             return False





















# ///////////////////////////////////////////////////////////////
import traceback
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline
from app.RAG.document_loader import DocumentLoader
from app.RAG.chunker_factory import ChunkerFactory
from app.RAG.embedings_geneartor import EnhancedEmbeddingGenerator
from app.RAG.vector_store import VectorStoreFactory
from app.RAG.vector_search import SearchFactory
from app.RAG.rag_types import StandardRAG, GraphRAG, AdaptiveRAG, RaptorRAG, CorrectiveRAG, IterativeRAG
from app.RAG.prompt_optimizer import PromptOptimizer
from app.RAG.reranking_model import RerankingModel
from app.RAG.fact_checker import FactChecker

class RAGPipeline:
    def __init__(self, rag_type: str, llm_model: str, embedding_model: str, 
                 chunking_option: str, vector_db: str, search_option: str, database_name: str = None, 
                 database_id: str = None, load_only: bool = False):
        """
        Initialize RAG pipeline with provided configurations
        
        Args:
            rag_type (str): Type of RAG implementation to use
            llm_model (str): Language model to use
            embedding_model (str): Embedding model to use
            chunking_option (str): Method for chunking documents
            vector_db (str): Vector database to use
            search_option (str): Search algorithm to use
            database_name (str): Name of the database
            database_id (str): ID of the database
            load_only (bool): If True, only load existing vector store without creating new components
        """
        self.cleanup_required = False
        self.rag_type = rag_type
        self.llm_model = llm_model
        self.embedding_model = embedding_model
        self.chunking_option = chunking_option
        self.vector_db = vector_db
        self.search_option = search_option
        self.database_name = database_name
        self.database_id = database_id
        
        try:
            collection_name = None
            if database_name:
                collection_name = f"rag-{database_name.lower()}-{database_id or 'temp'}"
            # When load_only is True, we'll still initialize all required components
            # but we'll load the vector store instead of creating a new one
            if load_only:
                print(f"🔄 Initializing RAG Pipeline in load-only mode")
                print(f"📂 Database: {database_name}")
                print(f"🔍 Vector DB: {vector_db}")
                
                # Load the vector store first
                print(f"📦 Loading existing Vector Store: {vector_db}...")
                if self.load_vector_store():
                    print("✅ Vector Store loaded successfully")
                else:
                    raise ValueError(f"Failed to load vector store for {database_name}")
                
                # Initialize language model for queries
                print(f"🤖 Initializing Language Model: {llm_model}...")
                self.tokenizer = AutoTokenizer.from_pretrained(llm_model)
                self.model = AutoModelForSeq2SeqLM.from_pretrained(llm_model)
                self.generator = pipeline(
                    "text2text-generation",
                    model=self.model,
                    tokenizer=self.tokenizer,
                    max_length=512
                )
                print("✅ Language Model initialized successfully")
                
                # Initialize other required components
                print(f"🔍 Initializing Search Algorithm: {search_option}...")
                self.search_algorithm = SearchFactory.create_search_algorithm(search_option)
                print("✅ Search Algorithm initialized successfully")
                
                print(f"🧬 Initializing Embedding Generator with model: {embedding_model}...")
                self.embedding_generator = EnhancedEmbeddingGenerator(
                    model_name=embedding_model,
                    batch_size=32
                )
                print("✅ Embedding Generator initialized successfully")
                
                # Initialize minimal components needed for RAG implementations
                print("🔄 Initializing Document Loader...")
                self.document_loader = DocumentLoader()
                print("✅ Document Loader initialized successfully")

                print(f"🔪 Initializing Chunker with option: {chunking_option}...")
                max_tokens = 100
                token_overlap = 10
                self.chunker = ChunkerFactory.create_chunker(chunking_option, max_tokens, token_overlap)
                print("✅ Chunker initialized successfully")
                
                # Initialize fact checker for certain RAG types
                if rag_type in ["corrective"]:
                    self.fact_checker = FactChecker()
                
                # Initialize RAG implementation
                self.initialize_rag_implementation()
                
                print("🎉 RAG Pipeline loaded in query-only mode!")
                return
            
            # Normal initialization for creating new vector stores
            collection_name = None
            if database_name:
                collection_name = f"rag-{database_name.lower()}-{database_id or 'temp'}"
            print("collection_name", collection_name)
            print("database_name", database_name)
            print(f"🚀 Initializing RAG Pipeline")
            print(f"  RAG Type: {rag_type}")
            print(f"  LLM Model: {llm_model}")
            print(f"  Embedding Model: {embedding_model}")
            print(f"  Chunking Option: {chunking_option}")
            print(f"  Vector DB: {vector_db}")
            print(f"  Search Option: {search_option}")

            # Handle iterative and corrective RAG types
            if rag_type in ["iterative", "corrective"]:
                rag_type = "graph"
                print(f"📝 Note: {rag_type} RAG will use Graph RAG implementation.")
            
            # Set fixed confidence threshold for adaptive RAG
            confidence_threshold = 0.7 if rag_type == "adaptive" else None

            # Set fixed RAPTOR parameters
            raptor_params = {}
            if rag_type == "raptor":
                raptor_params = {
                    'token_weight_threshold': 0.5,
                    'max_prompt_attempts': 3
                }

            # Set fixed reranking model for RAPTOR
            reranking_model_name = None
            if rag_type == "raptor":
                reranking_model_name = "cross-encoder/ms-marco-MiniLM-L-6-v2"

            # Handle GTE model case
            if embedding_model == "Alibaba-NLP/gte-large-en-v1.5":
                embedding_model = "intfloat/e5-large-v2"

            # Set fixed values for tokens and overlap
            max_tokens = 100
            token_overlap = 10

            # Initialize components
            print("🔄 Initializing Document Loader...")
            self.document_loader = DocumentLoader()
            print("✅ Document Loader initialized successfully")

            print(f"🔪 Initializing Chunker with option: {chunking_option}...")
            self.chunker = ChunkerFactory.create_chunker(chunking_option, max_tokens, token_overlap)
            print("✅ Chunker initialized successfully")

            print(f"🧬 Initializing Embedding Generator with model: {embedding_model}...")
            self.embedding_generator = EnhancedEmbeddingGenerator(
                model_name=embedding_model,
                batch_size=32
            )
            print("✅ Embedding Generator initialized successfully")

            print(f"📦 Initializing Vector Store: {vector_db}...")
            # self.vector_store = VectorStoreFactory.create_store(
            #     store_type=vector_db,
            #     config={
            #         "embedding_model": embedding_model,
            #         "collection_name": collection_name,
            #         "database_name": database_name
            #     }
            # )

            self.vector_store = VectorStoreFactory.create_store(
                store_type=vector_db,
                embedding_model=embedding_model,
                collection_name=collection_name,
                database_name = database_name
                
            )
            print("✅ Vector Store initialized successfully")

            print(f"🔍 Initializing Search Algorithm: {search_option}...")
            self.search_algorithm = SearchFactory.create_search_algorithm(search_option)
            print("✅ Search Algorithm initialized successfully")
            
            # Initialize language model
            print(f"🤖 Initializing Language Model: {llm_model}...")
            self.tokenizer = AutoTokenizer.from_pretrained(llm_model)
            self.model = AutoModelForSeq2SeqLM.from_pretrained(llm_model)
            self.generator = pipeline(
                "text2text-generation",
                model=self.model,
                tokenizer=self.tokenizer,
                max_length=512
            )
            print("✅ Language Model initialized successfully")

            self.fact_checker = FactChecker()
            
            # Initialize RAG implementation
            self.initialize_rag_implementation()
            print("🎉 RAG Pipeline initialized completely!")
                
        except Exception as e:
            print(f"❌ Error during initialization: {str(e)}")
            traceback.print_exc()
            raise
    
    def initialize_rag_implementation(self):
        """Initialize the appropriate RAG implementation based on rag_type"""
        print(f"🧠 Initializing RAG Implementation: {self.rag_type}...")
        
        base_params = {
            'document_loader': self.document_loader,
            'chunker': self.chunker,
            'embedding_generator': self.embedding_generator,
            'vector_store': self.vector_store,
            'search_algorithm': self.search_algorithm,
            'generator': self.generator
        }
        
        if self.rag_type == "standard":
            self.rag_implementation = StandardRAG(**base_params)
        elif self.rag_type == "graph":
            self.rag_implementation = GraphRAG(**base_params)
        elif self.rag_type == "corrective":
            if not hasattr(self, 'fact_checker'):
                self.fact_checker = FactChecker()
            base_params['fact_checker'] = self.fact_checker
            self.rag_implementation = CorrectiveRAG(**base_params)
        elif self.rag_type == "iterative":
            self.rag_implementation = IterativeRAG(**base_params)
        elif self.rag_type == "adaptive":
            self.rag_implementation = AdaptiveRAG(
                confidence_threshold=0.7,
                **base_params
            )
        elif self.rag_type == "raptor":
            reranking_model = RerankingModel(model_name="cross-encoder/ms-marco-MiniLM-L-6-v2")
            prompt_optimizer = PromptOptimizer(
                embedding_generator=self.embedding_generator,
                tokenizer=self.tokenizer
            )
            
            raptor_params = {
                'token_weight_threshold': 0.5,
                'max_prompt_attempts': 3,
                'reranking_model': reranking_model,
                'prompt_optimizer': prompt_optimizer
            }
            
            self.rag_implementation = RaptorRAG(**raptor_params, **base_params)
        else:
            raise ValueError(f"Unsupported RAG type: {self.rag_type}")
        
        print("✅ RAG Implementation initialized successfully")

    def process_documents(self, zip_path: str):
        """
        Process documents through the selected RAG implementation
        
        Args:
            zip_path (str): Path to the ZIP file containing documents
            
        Returns:
            List[Document]: List of processed documents
        """
        try:
            print(f"📂 Starting document processing for: {zip_path}")
            documents = self.rag_implementation.process_documents(zip_path)
            
            if documents:
                print(f"✅ Successfully processed {len(documents)} documents")
                print(f"🗃️ Documents loaded into vector store")
                self.cleanup_required = True
            else:
                print("⚠️ No documents were processed")
            
            return documents
        except Exception as e:
            print(f"❌ Error processing documents: {str(e)}")
            traceback.print_exc()
            self.cleanup()
            return []

    # def generate_response(self, query: str, max_length: int = 512) -> str:
    #     """
    #     Generate response using the selected RAG implementation
        
    #     Args:
    #         query (str): User query
    #         max_length (int): Maximum length of generated response
            
    #     Returns:
    #         str: Generated response
    #     """
    #     try:
    #         print(f"❓ Generating response for query: {query[:50]}...")
    #         response = self.rag_implementation.generate_response(query, max_length)
            
    #         if response:
    #             print("✅ Response generated successfully")
    #         else:
    #             print("⚠️ No response generated")
            
    #         return response
    #     except Exception as e:
    #         print(f"❌ Error generating response: {str(e)}")
    #         return ""



    def generate_response(self, query: str, max_length: int = 512) -> str:
        """
        Generate response using the selected RAG implementation
        
        Args:
            query (str): User query
            max_length (int): Maximum length of generated response
            
        Returns:
            str: Generated response
        """
        try:
            print(f"❓ Generating response for query: {query[:50]}...")
            
            # For loaded RAG databases, we may need to retrieve context directly
            if hasattr(self, 'vector_store') and not hasattr(self.rag_implementation, 'generate_response'):
                print("📚 Using direct context retrieval for loaded RAG database")
                
                # Retrieve relevant context
                context_docs = self.rag_implementation.retrieve_context(query, max_docs=3)
                
                if context_docs:
                    context_text = "\n\n".join([doc.page_content for doc in context_docs])
                    print(f"✅ Retrieved {len(context_docs)} context documents")
                    
                    # Construct prompt with context
                    prompt = f"""Context information:
    {context_text}

    Given the context information, please respond to the following:
    {query}"""
                    
                    # Generate response with context
                    response = self.generator(prompt, max_length=max_length)[0]['generated_text']
                else:
                    print("⚠️ No relevant context found, generating response without RAG")
                    response = self.generator(query, max_length=max_length)[0]['generated_text']
                    
                return response
                
            # Use the RAG implementation's generate_response if available
            elif hasattr(self.rag_implementation, 'generate_response'):
                response = self.rag_implementation.generate_response(query, max_length)
                
                if response:
                    print("✅ Response generated successfully")
                else:
                    print("⚠️ No response generated")
                
                return response
            else:
                # Fallback to direct generation without RAG
                print("⚠️ No RAG implementation found, using direct generation")
                response = self.generator(query, max_length=max_length)[0]['generated_text']
                return response
                
        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            import traceback
            traceback.print_exc()
            return f"Error generating response: {str(e)}"



    def cleanup(self):
        """Cleanup resources"""
        if self.cleanup_required:
            try:
                print("🧹 Starting cleanup process...")
                if hasattr(self, 'document_loader') and self.document_loader:
                    self.document_loader.cleanup()
                print("✅ Cleanup completed successfully")
            except Exception as e:
                print(f"❌ Error during cleanup: {str(e)}")

    def __del__(self):
        """Destructor to ensure cleanup"""
        self.cleanup()



    def retrieve_context(self, query: str, max_docs: int = 3):
        """
        Retrieve relevant context for a given query using the appropriate RAG implementation
        
        Args:
            query (str): The user query
            max_docs (int): Maximum number of documents to retrieve
            
        Returns:
            List[Document]: List of relevant documents
        """
        try:
            # Create a Document object with the query as page_content
            from langchain_core.documents import Document
            query_doc = Document(page_content=query)
            
            # Generate embeddings for the query using the embedding_generator
            query_embedding = self.embedding_generator.generate_embeddings([query_doc])[0]
            
            if self.vector_db == "chromadb":
                import chromadb
                
                # Create persistent client
                client = chromadb.PersistentClient(path="./chroma_db")
                
                # Generate collection name
                collection_names = [
                    f"rag_{self.database_name.lower()}_Temp",
                    f"rag-{self.database_name.lower()}-{self.database_id or 'temp'}",
                    f"rag_{self.database_name.lower()}_{self.database_id}"
                ]
                
                for collection_name in collection_names:
                    try:
                        # Get the collection
                        collection = client.get_collection(name=collection_name)
                        
                        # Query the collection
                        results = collection.query(
                            query_embeddings=[query_embedding],
                            n_results=max_docs
                        )
                        
                        # Convert results to document format
                        documents = []
                        for i, (doc_content, metadata) in enumerate(zip(
                            results.get('documents', [[]])[0],
                            results.get('metadatas', [[]])[0] 
                        )):
                            documents.append(Document(
                                page_content=doc_content,
                                metadata=metadata or {}
                            ))
                        
                        return documents
                        
                    except Exception as e:
                        print(f"Error with ChromaDB collection {collection_name}: {str(e)}")
                        continue
                
                print("❌ No suitable ChromaDB collection found")
                return []
                        
            elif self.vector_db == "pinecone":
                from pinecone import Pinecone
                
                # Initialize Pinecone client
                pc = Pinecone(api_key="your_pinecone_api_key")  # Replace with actual API key
                
                # Try different naming patterns
                index_names = [
                    f"rag-{self.database_name.lower()}-temp",
                    f"rag_{self.database_name.lower()}_{self.database_id}",
                    f"rag-{self.database_name.lower()}-{self.database_id}"
                ]
                
                for index_name in index_names:
                    try:
                        # Get the index
                        index = pc.Index(index_name)
                        
                        # Query Pinecone index
                        results = index.query(
                            vector=query_embedding,
                            top_k=max_docs,
                            include_metadata=True
                        )
                        
                        # Convert results to document format
                        documents = []
                        for match in results.get('matches', []):
                            content = match.get('metadata', {}).get('content', '')
                            metadata = {k: v for k, v in match.get('metadata', {}).items() if k != 'content'}
                            documents.append(Document(
                                page_content=content,
                                metadata=metadata
                            ))
                            
                        return documents
                        
                    except Exception as e:
                        print(f"Error with Pinecone index {index_name}: {str(e)}")
                        continue
                
                print("❌ No suitable Pinecone index found")
                return []
                        
            elif self.vector_db == "weaviate":
                import weaviate
                
                # Initialize Weaviate client
                client = weaviate.Client(url="http://localhost:8080")
                
                # Try different class naming patterns
                class_names = [
                    f"RAG_{self.database_name.replace(' ', '_').lower()}_Temp",
                    f"RAG_{self.database_name.replace(' ', '_').lower()}_{self.database_id}",
                    f"Rag{self.database_name.replace(' ', '')}"
                ]
                
                for class_name in class_names:
                    try:
                        # Query Weaviate
                        results = (
                            client.query.get(class_name, ["content", "file_name", "chunk_id"])
                            .with_near_vector({
                                "vector": query_embedding
                            })
                            .with_limit(max_docs)
                            .do()
                        )
                        
                        # Convert results to document format
                        documents = []
                        for item in results.get('data', {}).get('Get', {}).get(class_name, []):
                            content = item.get('content', '')
                            metadata = {
                                'file_name': item.get('file_name', ''),
                                'chunk_id': item.get('chunk_id', '')
                            }
                            documents.append(Document(
                                page_content=content,
                                metadata=metadata
                            ))
                            
                        return documents
                        
                    except Exception as e:
                        print(f"Error with Weaviate class {class_name}: {str(e)}")
                        continue
                
                print("❌ No suitable Weaviate class found")
                return []
                        
            elif self.vector_db == "faiss":
                import numpy as np
                import faiss
                
                try:
                    # Convert query embedding to the right format
                    query_vector = np.array([query_embedding]).astype('float32')
                    
                    # Search in the index
                    D, I = self.vector_store.search(query_vector, max_docs)
                    
                    # Retrieve documents based on indices
                    documents = []
                    for i in I[0]:
                        if i < len(self.stored_documents):
                            documents.append(self.stored_documents[i])
                    
                    return documents
                    
                except Exception as e:
                    print(f"FAISS error: {str(e)}")
                    return []
                    
            else:
                print(f"Unsupported vector store type: {self.vector_db}")
                return []
                    
        except Exception as e:
            print(f"Error retrieving context: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

    def load_vector_store(self):
        """Load an existing vector store based on the database configuration"""
        try:
            if self.vector_db == "chromadb":
                import chromadb
                from sentence_transformers import SentenceTransformer
                
                # Create persistent client
                client = chromadb.PersistentClient(path="./chroma_db")

                # existing_collections = client.list_collections()
                # print("Existing ChromaDB collections:")
                # for collection in existing_collections:
                #     print(f"- {collection.name}")
            
                
                # Try different naming patterns
                collection_names = [
                    f"rag_{self.database_name.lower()}_Temp",
                    f"rag-{self.database_name.lower()}-{self.database_id or 'temp'}",
                    f"rag_{self.database_name.lower()}_{self.database_id}"
                ]
                
                for collection_name in collection_names:
                    try:
                        print(f"Attempting to load ChromaDB collection: {collection_name}")
                        self.vector_store = client.get_collection(name=collection_name)
                        print(f"✅ Successfully loaded ChromaDB collection: {collection_name}")
                        return True
                    except ValueError as e:
                        print(f"Collection {collection_name} not found: {str(e)}")
                        continue
                
                # If we get here, we couldn't find any matching collection
                print("❌ Failed to find any matching ChromaDB collection")
                return False
                        
            elif self.vector_db == "pinecone":
                from pinecone import Pinecone
                
                # Initialize Pinecone client
                pc = Pinecone(api_key="pcsk_2sqpR7_FY6XeaGrqY1NikHysefnoj37anCK9fWMZ5rrxPzW3HU5xWUPVgJZSep9sYpdsCw")
                
                # Try different naming patterns
                index_names = [
                    # f"rag-{self.database_name.lower()}-Temp",
                    # f"rag_{self.database_name.lower()}_{self.database_id}",
                    # f"rag-{self.database_name.lower()}-{self.database_id}",
                    "pineenv"
                ]
                
                # List available indexes for debugging
                available_indexes = pc.list_indexes().names()
                print(f"Available Pinecone indexes: {available_indexes}")
                
                for index_name in index_names:
                    try:
                        print(f"Attempting to load Pinecone index: {index_name}")
                        # Check if index exists in available indexes
                        matching_indexes = [idx for idx in available_indexes if idx.startswith(index_name)]
                        
                        if matching_indexes:
                            # Get the most recently created index
                            actual_index_name = sorted(matching_indexes)[-1]
                            self.vector_store = pc.Index(actual_index_name)
                            print(f"✅ Successfully loaded Pinecone index: {actual_index_name}")
                            return True
                        else:
                            print(f"No Pinecone index found matching pattern: {index_name}")
                            continue
                    except Exception as e:
                        print(f"Error connecting to Pinecone index {index_name}: {str(e)}")
                        continue
                
                # If we get here, we couldn't find any matching index
                print("❌ Failed to find any matching Pinecone index")
                return False
                    
            elif self.vector_db == "weaviate":
                import weaviate
                
                # Initialize Weaviate client
                client = weaviate.Client(url="http://localhost:8080")
                
                # Try different naming patterns
                class_names = [
                    f"RAG_{self.database_name.replace(' ', '_').lower()}_Temp",
                    f"RAG_{self.database_name.replace(' ', '_').lower()}_{self.database_id}",
                    f"Rag{self.database_name.replace(' ', '')}"  # Another possible pattern
                ]
                
                # List available classes for debugging
                schema = client.schema.get()
                available_classes = [cls['class'] for cls in schema['classes']] if 'classes' in schema else []
                print(f"Available Weaviate classes: {available_classes}")
                
                for class_name in class_names:
                    try:
                        print(f"Checking for Weaviate class: {class_name}")
                        if client.schema.exists(class_name):
                            self.vector_store = client
                            self.class_name = class_name
                            print(f"✅ Successfully loaded Weaviate class: {class_name}")
                            return True
                        else:
                            print(f"Weaviate class {class_name} not found")
                            continue
                    except Exception as e:
                        print(f"Error checking Weaviate class {class_name}: {str(e)}")
                        continue
                
                # If we get here, we couldn't find any matching class
                print("❌ Failed to find any matching Weaviate class")
                return False
                    
            elif self.vector_db == "faiss":
                import faiss
                import pickle
                import os
                
                # Try different file naming patterns
                index_paths = [
                    f"./faiss_indexes/rag-{self.database_name.lower()}-Temp.index",
                    f"./faiss_indexes/rag_{self.database_name.lower()}_Temp.index",
                    f"./faiss_indexes/rag_{self.database_name.lower()}_{self.database_id}.index",
                    f"./faiss_indexes/rag-{self.database_name.lower()}-{self.database_id or 'temp'}.index"
                ]
                
                doc_paths = [
                     f"./faiss_indexes/rag-{self.database_name.lower()}-Temp_docs.pkl",
                    f"./faiss_indexes/rag_{self.database_name.lower()}_Temp_docs.pkl",
                    f"./faiss_indexes/rag_{self.database_name.lower()}_{self.database_id}_docs.pkl",
                    f"./faiss_indexes/rag-{self.database_name.lower()}-{self.database_id or 'temp'}_docs.pkl"
                ]
                
                # List available files for debugging
                if os.path.exists("./faiss_indexes"):
                    available_files = os.listdir("./faiss_indexes")
                    print(f"Available FAISS files: {available_files}")
                
                for i, index_path in enumerate(index_paths):
                    doc_path = doc_paths[i]
                    try:
                        print(f"Attempting to load FAISS index: {index_path}")
                        if os.path.exists(index_path) and os.path.exists(doc_path):
                            # Load FAISS index and stored documents
                            self.vector_store = faiss.read_index(index_path)
                            with open(doc_path, 'rb') as f:
                                self.stored_documents = pickle.load(f)
                            print(f"✅ Successfully loaded FAISS index: {index_path}")
                            return True
                        else:
                            print(f"FAISS files not found: {index_path} or {doc_path}")
                            continue
                    except Exception as e:
                        print(f"Error loading FAISS index {index_path}: {str(e)}")
                        continue
                
                # If we get here, we couldn't find any matching files
                print("❌ Failed to find any matching FAISS index files")
                return False
                
            # Unsupported vector database type    
            print(f"❌ Unsupported vector database type: {self.vector_db}")
            return False
            
        except Exception as e:
            print(f"❌ Error loading vector store: {str(e)}")
            traceback.print_exc()
            return False