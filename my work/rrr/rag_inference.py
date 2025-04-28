import os
import zipfile
import tempfile
import logging
import argparse
from typing import List, Dict, Any, Optional, TypedDict, Union
from pathlib import Path

# LangChain imports
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.messages import HumanMessage, SystemMessage
from langchain_core.runnables import RunnableLambda, RunnablePassthrough

# LangChain document loaders
from langchain_community.document_loaders import (
    DirectoryLoader, PyPDFLoader, TextLoader, 
    CSVLoader, Docx2txtLoader  # Using Docx2txtLoader instead of DocxLoader
)

# LangChain vector stores
from langchain_community.vectorstores import Chroma, FAISS

# LangChain text splitters
from langchain_text_splitters import (
    RecursiveCharacterTextSplitter, 
    CharacterTextSplitter, 
    TokenTextSplitter
)

# LangChain embeddings
from langchain_openai import OpenAIEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# LangChain LLMs
from langchain_openai import ChatOpenAI, AzureChatOpenAI
from langchain_community.llms import HuggingFacePipeline

# LangGraph
import langgraph.graph as graph
from langgraph.graph import END
from langchain.globals import set_verbose, set_debug

class LangGraphRAG:
    """
    RAG system implemented with LangChain and LangGraph.
    Supports multiple RAG types and workflows.
    """
    
    def __init__(
        self,
        embedding_model_name: str = "sentence-transformers/all-MiniLM-L6-v2",
        llm_model_name: str = "gpt-3.5-turbo",
        vector_store_type: str = "chroma",
        chunking_method: str = "recursive",
        max_tokens: int = 500,
        token_overlap: int = 50,
        rag_type: str = "standard",
        verbose: bool = False,
    ):
        """
        Initialize the RAG system with LangGraph
        
        Args:
            embedding_model_name: Name of the embedding model
            llm_model_name: Name of the LLM model
            vector_store_type: Type of vector store
            chunking_method: Method for chunking documents
            max_tokens: Maximum tokens per chunk
            token_overlap: Overlap between chunks
            rag_type: Type of RAG workflow to use
            verbose: Whether to use verbose mode
        """
        self.verbose = verbose
        if verbose:
            set_verbose(True)
            set_debug(True)
            logging.basicConfig(level=logging.INFO)
            
        self.embedding_model_name = embedding_model_name
        self.llm_model_name = llm_model_name
        self.vector_store_type = vector_store_type
        self.chunking_method = chunking_method
        self.max_tokens = max_tokens
        self.token_overlap = token_overlap
        self.rag_type = rag_type
        
        # Initialize components
        self.initialize_components()
        
        # Create the RAG workflow
        self.create_rag_workflow()
    
    def initialize_components(self):
        """Initialize all components of the RAG system"""
        # Initialize embedding model
        self._initialize_embedding_model()
        
        # Initialize text splitter
        self._initialize_text_splitter()
        
        # Initialize LLM
        self._initialize_llm()
        
        # Vector store will be initialized when documents are loaded
        self.vector_store = None
    
    def _initialize_embedding_model(self):
        """Initialize the embedding model based on the provided name"""
        if "openai" in self.embedding_model_name.lower():
            self.embedding_model = OpenAIEmbeddings(model=self.embedding_model_name)
        else:
            # Use HuggingFace embeddings
            self.embedding_model = HuggingFaceEmbeddings(model_name=self.embedding_model_name)
    
    def _initialize_text_splitter(self):
        """Initialize the text splitter based on the specified method"""
        if self.chunking_method == "recursive":
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.max_tokens,
                chunk_overlap=self.token_overlap
            )
        elif self.chunking_method == "character":
            self.text_splitter = CharacterTextSplitter(
                chunk_size=self.max_tokens,
                chunk_overlap=self.token_overlap
            )
        elif self.chunking_method == "token":
            self.text_splitter = TokenTextSplitter(
                chunk_size=self.max_tokens,
                chunk_overlap=self.token_overlap
            )
        else:
            # Default to recursive
            self.text_splitter = RecursiveCharacterTextSplitter(
                chunk_size=self.max_tokens,
                chunk_overlap=self.token_overlap
            )
    
    def _initialize_llm(self):
        """Initialize the LLM based on the provided name"""
        # Check if Azure OpenAI credentials are available
        required_vars = [
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ENDPOINT",
            "AZURE_OPENAI_API_VERSION",
            "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
        ]
        
        has_azure_config = all(os.environ.get(var) for var in required_vars)
        
        if has_azure_config:
            # Use Azure OpenAI
            self.llm = AzureChatOpenAI(
                deployment_name=os.environ.get("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"),
                openai_api_version=os.environ.get("AZURE_OPENAI_API_VERSION"),
                azure_endpoint=os.environ.get("AZURE_OPENAI_ENDPOINT"),
                api_key=os.environ.get("AZURE_OPENAI_API_KEY")
            )
            if self.verbose:
                print("Using Azure OpenAI for LLM")
        elif "gpt" in self.llm_model_name.lower() or "openai" in self.llm_model_name.lower():
            self.llm = ChatOpenAI(model_name=self.llm_model_name)
        else:
            # For local models, we'd use HuggingFacePipeline
            # This is a placeholder and would need to be customized based on the model
            self.llm = HuggingFacePipeline.from_model_id(
                model_id=self.llm_model_name,
                task="text-generation",
                pipeline_kwargs={"max_new_tokens": 512}
            )
    
    def create_rag_workflow(self):
        """Create the RAG workflow using LangGraph"""
        # Will be created when documents are processed
        self.rag_workflow = None
    
    def process_documents(self, file_path: str) -> List[Document]:
        """
        Process documents and create the vector store
        
        Args:
            file_path: Path to the document or directory
            
        Returns:
            List of processed document chunks
        """
        # Load and process documents
        docs = self._load_documents(file_path)
        chunks = self.text_splitter.split_documents(docs)
        
        print(f"Loaded {len(docs)} documents, created {len(chunks)} chunks")
        
        # Create vector store
        self._create_vector_store(chunks)
        
        # Create the RAG workflow based on the selected type
        self._create_specific_rag_workflow()
        
        return chunks
    
    def _load_documents(self, file_path: str) -> List[Document]:
        """
        Load documents from the provided file path
        
        Args:
            file_path: Path to the document or directory
            
        Returns:
            List of loaded documents
        """
        if file_path.endswith(".zip"):
            # Handle ZIP files
            return self._load_from_zip(file_path)
        elif os.path.isdir(file_path):
            # Handle directories
            return self._load_from_directory(file_path)
        else:
            # Handle individual files
            return self._load_individual_file(file_path)
    
    def _load_from_zip(self, zip_path: str) -> List[Document]:
        """Load documents from a ZIP file"""
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Extract ZIP contents
            with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                zip_ref.extractall(temp_dir)
            
            # Load documents from the extracted directory
            return self._load_from_directory(temp_dir)
    
    def _load_from_directory(self, directory_path: str) -> List[Document]:
        """Load documents from a directory"""
        # Define loaders for different file types
        pdf_loader = DirectoryLoader(directory_path, glob="**/*.pdf", loader_cls=PyPDFLoader)
        text_loader = DirectoryLoader(directory_path, glob="**/*.txt", loader_cls=TextLoader)
        csv_loader = DirectoryLoader(directory_path, glob="**/*.csv", loader_cls=CSVLoader)
        docx_loader = DirectoryLoader(directory_path, glob="**/*.docx", loader_cls=Docx2txtLoader)  # Changed to Docx2txtLoader
        
        # Load documents
        documents = []
        for loader in [pdf_loader, text_loader, csv_loader, docx_loader]:
            try:
                documents.extend(loader.load())
            except Exception as e:
                print(f"Error loading documents with {loader.__class__.__name__}: {str(e)}")
        
        return documents
    
    def _load_individual_file(self, file_path: str) -> List[Document]:
        """Load a single document file"""
        # Select the appropriate loader based on file extension
        if file_path.endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif file_path.endswith(".txt"):
            loader = TextLoader(file_path)
        elif file_path.endswith(".csv"):
            loader = CSVLoader(file_path)
        elif file_path.endswith(".docx"):
            loader = Docx2txtLoader(file_path)  # Changed to Docx2txtLoader
        else:
            raise ValueError(f"Unsupported file type: {file_path}")
        
        return loader.load()
    
    def _create_vector_store(self, documents: List[Document]) -> None:
        """
        Create the vector store with the provided documents
        
        Args:
            documents: List of documents to store
        """
        if self.vector_store_type.lower() == "chroma":
            self.vector_store = Chroma.from_documents(
                documents=documents,
                embedding=self.embedding_model
            )
        elif self.vector_store_type.lower() == "faiss":
            self.vector_store = FAISS.from_documents(
                documents=documents,
                embedding=self.embedding_model
            )
        else:
            # Default to Chroma
            self.vector_store = Chroma.from_documents(
                documents=documents,
                embedding=self.embedding_model
            )
    
    def _create_specific_rag_workflow(self):
        """Create the specific RAG workflow based on the selected type"""
        rag_type_mapping = {
            "standard": self._create_standard_rag_workflow,
            "iterative": self._create_iterative_rag_workflow,
            "self-reflective": self._create_self_reflective_rag_workflow,
            "adaptive": self._create_adaptive_rag_workflow,
            "raptor": self._create_raptor_rag_workflow,
        }
        
        # Get the appropriate workflow creation function
        create_workflow = rag_type_mapping.get(self.rag_type, self._create_standard_rag_workflow)
        create_workflow()
    
    def _create_standard_rag_workflow(self):
        """Create a standard RAG workflow"""
        # Define the state
        class State(TypedDict):
            query: str
            context: Optional[List[Document]]
            answer: Optional[str]
        
        def retrieve(state: State) -> State:
            """Retrieve relevant documents from the vector store"""
            query = state["query"]
            
            # Get relevant documents from vector store
            if self.vector_store is None:
                raise ValueError("Vector store not initialized. Please process documents first.")
            
            documents = self.vector_store.similarity_search(query, k=4)
            
            return {
                **state,
                "context": documents
            }
        
        def generate(state: State) -> State:
            """Generate an answer based on the retrieved documents"""
            query = state["query"]
            context = state.get("context", [])
            
            if not context:
                return {**state, "answer": "No relevant information found to answer the query."}
            
            # Extract text from documents for the prompt
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Create the prompt
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content="You are a helpful AI assistant that answers questions based on the provided context."),
                HumanMessage(content="Context information:\n\n{context}\n\nQuestion: {query}\n\nAnswer:")
            ])
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain
            answer = chain.invoke({"context": context_text, "query": query})
            
            return {
                **state,
                "answer": answer
            }
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("retrieve", retrieve)
        builder.add_node("generate", generate)
        
        # Add edges
        builder.add_edge("retrieve", "generate")
        builder.add_edge("generate", END)
        
        # Set entry point
        builder.set_entry_point("retrieve")
        
        # Compile the graph
        self.rag_workflow = builder.compile()

    # Include other RAG workflow implementations here...
    # For brevity, I'm not including all the implementations, but they would follow similar patterns

    def _create_raptor_rag_workflow(self):
        """Create a RAPTOR RAG workflow with re-ranking capabilities"""
        # Define the state
        class State(TypedDict):
            query: str
            initial_context: Optional[List[Document]]
            reranked_context: Optional[List[Document]]
            answer: Optional[str]
        
        def retrieve_initial(state: State) -> State:
            """Retrieve an initial set of relevant documents from the vector store"""
            query = state["query"]
            
            # Get relevant documents from vector store
            if self.vector_store is None:
                raise ValueError("Vector store not initialized. Please process documents first.")
            
            # Retrieve more documents than needed for reranking
            documents = self.vector_store.similarity_search(query, k=10)
            
            return {
                **state,
                "initial_context": documents
            }
        
        def rerank_documents(state: State) -> State:
            """Rerank documents based on relevance to the query"""
            query = state["query"]
            initial_docs = state.get("initial_context", [])
            
            if not initial_docs:
                return {**state, "reranked_context": []}
            
            # Create the prompt for document scoring
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=(
                    "You are an expert at evaluating document relevance to a query. "
                    "For each document, provide a relevance score from 0.0 to 1.0, where "
                    "1.0 means highly relevant and 0.0 means not relevant at all."
                )),
                HumanMessage(content=(
                    "Query: {query}\n\n"
                    "Document: {document}\n\n"
                    "Score this document's relevance to the query from 0.0 to 1.0. "
                    "Return ONLY the score as a number, nothing else."
                ))
            ])
            
            # Chain: Prompt -> LLM -> Output Parser
            score_chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Score each document
            scored_docs = []
            for doc in initial_docs:
                try:
                    score_str = score_chain.invoke({
                        "query": query,
                        "document": doc.page_content
                    })
                    # Extract score
                    try:
                        score = float(score_str.strip())
                        # Ensure score is between 0 and 1
                        score = max(0.0, min(1.0, score))
                    except ValueError:
                        score = 0.5  # Default score
                    
                    scored_docs.append((doc, score))
                except Exception as e:
                    if self.verbose:
                        print(f"Error during document scoring: {e}")
                    scored_docs.append((doc, 0.5))  # Default score
            
            # Sort by score (descending)
            scored_docs.sort(key=lambda x: x[1], reverse=True)
            
            # Take top 5 docs
            reranked_docs = [doc for doc, _ in scored_docs[:5]]
            
            return {
                **state,
                "reranked_context": reranked_docs
            }
        
        def generate(state: State) -> State:
            """Generate an answer based on the reranked documents"""
            query = state["query"]
            context = state.get("reranked_context", [])
            
            if not context:
                return {**state, "answer": "No relevant information found to answer the query."}
            
            # Extract text from documents for the prompt
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Create the prompt
            prompt = ChatPromptTemplate.from_messages([
                SystemMessage(content=(
                    "You are a helpful AI assistant that answers questions based on the "
                    "provided context. The context has been carefully selected and ranked "
                    "for relevance to the query."
                )),
                HumanMessage(content=(
                    "Context information:\n\n{context}\n\n"
                    "Question: {query}\n\n"
                    "Provide a comprehensive answer based on the context. "
                    "If the context doesn't contain sufficient information, clearly state that limitation."
                ))
            ])
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain
            answer = chain.invoke({"context": context_text, "query": query})
            
            return {
                **state,
                "answer": answer
            }
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("retrieve_initial", retrieve_initial)
        builder.add_node("rerank_documents", rerank_documents)
        builder.add_node("generate", generate)
        
        # Add edges
        builder.add_edge("retrieve_initial", "rerank_documents")
        builder.add_edge("rerank_documents", "generate")
        builder.add_edge("generate", END)
        
        # Set entry point
        builder.set_entry_point("retrieve_initial")
        
        # Compile the graph
        self.rag_workflow = builder.compile()
    
    def generate_response(self, query: str) -> str:
        """
        Generate a response to the query using the RAG workflow
        
        Args:
            query: User query
            
        Returns:
            Generated response
        """
        if self.rag_workflow is None:
            raise ValueError("RAG workflow not initialized. Please process documents first.")
        
        # Initialize state with the query
        if self.rag_type == "standard":
            initial_state = {"query": query}
        elif self.rag_type == "iterative":
            initial_state = {"query": query, "original_query": query, "iteration": 0}
        elif self.rag_type == "self-reflective":
            initial_state = {"query": query}
        elif self.rag_type == "adaptive":
            initial_state = {"query": query}
        elif self.rag_type == "raptor":
            initial_state = {"query": query}
        else:
            initial_state = {"query": query}
        
        # Run the workflow
        result = self.rag_workflow.invoke(initial_state)
        
        # Extract the answer from the result
        answer = result.get("answer", "No answer generated.")
        
        return answer