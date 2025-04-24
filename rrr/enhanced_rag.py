#!/usr/bin/env python3
"""
Enhanced Interactive RAG system with fallback to LLM knowledge
Adds the ability to use the LLM's general knowledge when documents don't contain relevant information

Usage:
python enhanced_rag.py
"""

import os
import sys
import zipfile
import tempfile
import logging
import importlib.util
import subprocess
from typing import List, Dict, Any, Optional, TypedDict, Union
from pathlib import Path

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Check and install required packages if needed
def check_and_install_packages():
    """Check and install required packages if they're not already installed"""
    required_packages = [
        "langchain", "langchain-core", "langchain-community", "langchain-openai",
        "langgraph", "chromadb", "sentence-transformers", "faiss-cpu", "docx2txt", "numpy"
    ]
    
    for package in required_packages:
        try:
            # Try to import the package (adjust name for import)
            import_name = package.replace("-", "_")
            importlib.import_module(import_name)
            logger.info(f"Package {package} is already installed")
        except ImportError:
            # If import fails, install the package
            logger.info(f"Installing {package}...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", package])

# Azure OpenAI setup
def setup_azure_openai():
    """Set up Azure OpenAI config in environment variables"""
    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
    ]
    
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        # Set values explicitly
        logger.info("Setting up Azure OpenAI configuration...")
        
        if "AZURE_OPENAI_API_KEY" not in os.environ:
            os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
        
        if "AZURE_OPENAI_ENDPOINT" not in os.environ:
            os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
        
        if "AZURE_OPENAI_API_VERSION" not in os.environ:
            os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
        
        if "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME" not in os.environ:
            os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"
    
    # Verify all variables are set
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        raise EnvironmentError(f"Missing Azure OpenAI configuration: {', '.join(missing)}")
    
    logger.info("Azure OpenAI configuration verified")
    return True

# Now import the required packages after ensuring they're installed
check_and_install_packages()

# LangChain imports
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
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

class EnhancedRAG:
    """
    Enhanced RAG system with fallback to LLM knowledge when documents lack relevant information
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
        use_fallback: bool = True,  # Whether to use general knowledge fallback
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
            use_fallback: Whether to use general knowledge fallback
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
        self.use_fallback = use_fallback
        
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
                api_key=os.environ.get("AZURE_OPENAI_API_KEY"),
                temperature=0  # Added temperature=0 for more consistent responses
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
        docx_loader = DirectoryLoader(directory_path, glob="**/*.docx", loader_cls=Docx2txtLoader)
        
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
            loader = Docx2txtLoader(file_path)
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
    
    def _assess_context_relevance(self, query: str, context: List[str]) -> bool:
        """
        Assess whether the retrieved context is relevant to the query
        
        Args:
            query: The user's query
            context: List of context strings from documents
            
        Returns:
            True if context is relevant, False otherwise
        """
        if not context:
            return False
            
        # Check if context is very short
        total_context_length = sum(len(c) for c in context)
        if total_context_length < 50:
            return False
        
        # Use LLM to assess relevance
        combined_context = "\n\n".join(context)
        
        # Create prompt for relevance assessment
        prompt = PromptTemplate.from_template(
            "You are an expert at determining whether a context contains information relevant to a query.\n\n"
            "Query: {query}\n\n"
            "Context: {context}\n\n"
            "Does this context contain specific information that helps answer the query?\n"
            "Respond with ONLY 'yes' or 'no'. If the context merely mentions the query terms but "
            "doesn't provide useful information for answering the query, respond with 'no'."
        )
        
        # Create chain
        chain = (
            prompt 
            | self.llm
            | StrOutputParser()
        )
        
        # Run the chain
        try:
            result = chain.invoke({
                "query": query,
                "context": combined_context
            }).strip().lower()
            
            return result == "yes"
        except Exception as e:
            if self.verbose:
                print(f"Error assessing context relevance: {e}")
            # Default to using context if assessment fails
            return True
    
    def _use_general_knowledge(self, query: str) -> str:
        """
        Use the LLM's general knowledge to answer a query when documents lack relevant information
        
        Args:
            query: The user's query
            
        Returns:
            Response using the LLM's general knowledge
        """
        try:
            # Create prompt for using general knowledge
            prompt = PromptTemplate.from_template(
                "You are a helpful AI assistant answering a user's question.\n\n"
                "Question: {query}\n\n"
                "The user's documents didn't contain relevant information to answer this specific question. "
                "Please answer using your general knowledge. Start your response with 'Based on general knowledge: '"
            )
            
            # Create chain
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain
            return chain.invoke({"query": query})
        except Exception as e:
            if self.verbose:
                print(f"Error using general knowledge: {e}")
            return f"I couldn't find relevant information in your documents, and encountered an error using general knowledge: {str(e)}"
    
    def _create_standard_rag_workflow(self):
        """Create a standard RAG workflow with fallback to general knowledge"""
        # Define the state
        class State(TypedDict):
            query: str
            context: Optional[List[Document]]
            context_relevance: Optional[bool]
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
        
        def assess_relevance(state: State) -> State:
            """Assess whether retrieved context is relevant to the query"""
            query = state["query"]
            context = state.get("context", [])
            
            if not context:
                return {**state, "context_relevance": False}
            
            # Extract text from documents for assessment
            context_texts = [doc.page_content for doc in context]
            
            # Assess relevance
            is_relevant = self._assess_context_relevance(query, context_texts)
            
            return {
                **state,
                "context_relevance": is_relevant
            }
            
        def generate(state: State) -> State:
            """Generate an answer based on context or using general knowledge if needed"""
            query = state["query"]
            context = state.get("context", [])
            is_relevant = state.get("context_relevance", False)
            
            # If no context or not relevant and fallback is enabled
            if (not context or not is_relevant) and self.use_fallback:
                if self.verbose:
                    print(f"No relevant context found, using general knowledge for: {query}")
                answer = self._use_general_knowledge(query)
                return {**state, "answer": answer}
            
            # Use context if available (even if deemed not relevant when fallback is disabled)
            if context:
                # Extract text from documents for the prompt
                context_texts = [doc.page_content for doc in context]
                context_text = "\n\n".join(context_texts)
                
                # Use PromptTemplate for more reliable template handling
                prompt = PromptTemplate.from_template(
                    "You are a helpful AI assistant that answers questions based on the provided context.\n\n"
                    "Context:\n{context}\n\n"
                    "Question:\n{query}\n\n"
                    "Answer the question based on the context above. If the context doesn't contain relevant "
                    "information to fully answer the question, explain what specific information is missing."
                )
                
                # Chain: Prompt -> LLM -> Output Parser
                chain = (
                    prompt 
                    | self.llm
                    | StrOutputParser()
                )
                
                # Run the chain with explicit parameters
                try:
                    answer = chain.invoke({"context": context_text, "query": query})
                    if self.verbose:
                        print(f"Generated answer with context of length {len(context_text)}")
                except Exception as e:
                    logger.error(f"Error in generate step: {e}")
                    answer = f"Error generating response: {str(e)}"
                
                return {**state, "answer": answer}
            
            # Fallback response if no context and fallback disabled
            return {**state, "answer": "No relevant information found in the documents to answer your query."}
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("retrieve", retrieve)
        builder.add_node("assess_relevance", assess_relevance)
        builder.add_node("generate", generate)
        
        # Add edges
        builder.add_edge("retrieve", "assess_relevance")
        builder.add_edge("assess_relevance", "generate")
        builder.add_edge("generate", END)
        
        # Set entry point
        builder.set_entry_point("retrieve")
        
        # Compile the graph
        self.rag_workflow = builder.compile()
    
    def _create_iterative_rag_workflow(self):
        """Create an iterative RAG workflow that refines queries based on initial results"""
        # Define the state
        class State(TypedDict):
            query: str
            original_query: str
            iteration: int
            context: Optional[List[Document]]
            context_relevance: Optional[bool]
            answer: Optional[str]
            follow_up_needed: bool
        
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
        
        def assess_relevance(state: State) -> State:
            """Assess whether retrieved context is relevant to the query"""
            query = state["query"]
            original_query = state.get("original_query", query)
            context = state.get("context", [])
            
            if not context:
                return {**state, "context_relevance": False}
            
            # Extract text from documents for assessment
            context_texts = [doc.page_content for doc in context]
            
            # Assess relevance to the original query
            is_relevant = self._assess_context_relevance(original_query, context_texts)
            
            return {
                **state,
                "context_relevance": is_relevant
            }
        
        def generate(state: State) -> State:
            """Generate an answer based on retrieved documents or general knowledge"""
            query = state["query"]
            original_query = state.get("original_query", query)
            context = state.get("context", [])
            is_relevant = state.get("context_relevance", False)
            iteration = state.get("iteration", 0)
            
            # Check if we've run out of iterations and need to use general knowledge
            max_iterations_reached = iteration >= 3
            
            # If context is not relevant but we have iterations left, allow follow-up
            if not is_relevant and not max_iterations_reached:
                return {
                    **state,
                    "answer": "Still searching for relevant information...",
                    "follow_up_needed": True
                }
            
            # If no relevant context after iterations or no context at all, use general knowledge if enabled
            if (not context or not is_relevant) and self.use_fallback:
                if self.verbose:
                    print(f"No relevant context found after iterations, using general knowledge")
                answer = self._use_general_knowledge(original_query)
                return {
                    **state, 
                    "answer": answer,
                    "follow_up_needed": False
                }
            
            # Use context if available
            if context:
                # Extract text from documents for the prompt
                context_texts = [doc.page_content for doc in context]
                context_text = "\n\n".join(context_texts)
                
                # Use PromptTemplate for more reliable template handling
                prompt = PromptTemplate.from_template(
                    "You are a helpful AI assistant that answers questions based on provided context.\n\n"
                    "Context information:\n{context}\n\n"
                    "Original question: {original_query}\n"
                    "Current query: {query}\n"
                    "Iteration number: {iteration}\n\n"
                    "Answer the original question based on the context information. "
                    "If the context doesn't contain enough information, say so clearly."
                )
                
                # Chain: Prompt -> LLM -> Output Parser
                chain = (
                    prompt 
                    | self.llm
                    | StrOutputParser()
                )
                
                # Run the chain with explicit parameters
                try:
                    answer = chain.invoke({
                        "context": context_text, 
                        "query": query,
                        "original_query": original_query,
                        "iteration": iteration
                    })
                except Exception as e:
                    logger.error(f"Error in generate step: {e}")
                    answer = f"Error generating response: {str(e)}"
                
                return {
                    **state,
                    "answer": answer,
                    "follow_up_needed": False  # We've found information or reached max iterations
                }
            
            # Fallback response if no context and fallback disabled
            return {
                **state, 
                "answer": "No relevant information found in the documents to answer your query.",
                "follow_up_needed": False
            }
        
        def decide_next_action(state: State) -> Union[Dict[str, Any], str]:
            """Decide whether to continue iterating or finish"""
            if not state.get("follow_up_needed", False) or state.get("iteration", 0) >= 3:
                return END
            
            return "reformulate_query"
        
        def reformulate_query(state: State) -> State:
            """Reformulate the query based on the current context and answer"""
            original_query = state.get("original_query", state["query"])
            current_query = state["query"]
            current_answer = state.get("answer", "")
            current_context = state.get("context", [])
            iteration = state.get("iteration", 0) + 1
            
            # Extract text snippets from current context
            context_snippets = [doc.page_content[:150] + "..." for doc in current_context]
            context_summary = "\n".join(context_snippets)
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are an expert at reformulating search queries to find more relevant information.\n\n"
                "Original question: {original_query}\n"
                "Current query: {current_query}\n"
                "Current answer: {current_answer}\n"
                "Context snippets found so far:\n{context_summary}\n\n"
                "Based on this information, formulate a new search query that will help find better information "
                "to answer the original question. Focus on key concepts that might not be well-covered yet. "
                "Return ONLY the new search query, nothing else."
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                new_query = chain.invoke({
                    "original_query": original_query,
                    "current_query": current_query,
                    "current_answer": current_answer,
                    "context_summary": context_summary
                })
            except Exception as e:
                logger.error(f"Error in reformulate_query step: {e}")
                new_query = current_query  # Fallback to current query if error
            
            return {
                **state,
                "query": new_query,
                "original_query": original_query,
                "iteration": iteration
            }
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("retrieve", retrieve)
        builder.add_node("assess_relevance", assess_relevance)
        builder.add_node("generate", generate)
        builder.add_node("reformulate_query", reformulate_query)
        
        # Add conditional edges
        builder.add_conditional_edges(
            "generate",
            decide_next_action,
            {
                "reformulate_query": "reformulate_query",
                END: END
            }
        )
        
        # Add regular edges
        builder.add_edge("retrieve", "assess_relevance")
        builder.add_edge("assess_relevance", "generate")
        builder.add_edge("reformulate_query", "retrieve")
        
        # Set entry point
        builder.set_entry_point("retrieve")
        
        # Compile the graph
        self.rag_workflow = builder.compile()
    
    def _create_self_reflective_rag_workflow(self):
        """Create a self-reflective RAG workflow that evaluates its own answers"""
        # Define the state
        class State(TypedDict):
            query: str
            context: Optional[List[Document]]
            context_relevance: Optional[bool]
            draft_answer: Optional[str]
            relevance_score: Optional[float]
            answer: Optional[str]
        
        def retrieve(state: State) -> State:
            """Retrieve relevant documents from the vector store"""
            query = state["query"]
            
            # Get relevant documents from vector store
            if self.vector_store is None:
                raise ValueError("Vector store not initialized. Please process documents first.")
            
            documents = self.vector_store.similarity_search(query, k=5)
            
            return {
                **state,
                "context": documents
            }
        
        def assess_relevance(state: State) -> State:
            """Assess whether retrieved context is relevant to the query"""
            query = state["query"]
            context = state.get("context", [])
            
            if not context:
                return {**state, "context_relevance": False}
            
            # Extract text from documents for assessment
            context_texts = [doc.page_content for doc in context]
            
            # Assess relevance
            is_relevant = self._assess_context_relevance(query, context_texts)
            
            return {
                **state,
                "context_relevance": is_relevant
            }
        
        def choose_knowledge_source(state: State) -> str:
            """Choose whether to use context or general knowledge"""
            is_relevant = state.get("context_relevance", False)
            
            if is_relevant or not self.use_fallback:
                return "generate_draft"
            else:
                return "use_general_knowledge"
        
        def generate_draft(state: State) -> State:
            """Generate a draft answer based on the retrieved documents"""
            query = state["query"]
            context = state.get("context", [])
            
            if not context:
                return {
                    **state, 
                    "draft_answer": "No relevant information found to answer the query."
                }
            
            # Extract text from documents for the prompt
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are a helpful AI assistant that answers questions based on the provided context.\n\n"
                "Context information:\n{context}\n\n"
                "Question: {query}\n\n"
                "Answer:"
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                draft_answer = chain.invoke({"context": context_text, "query": query})
            except Exception as e:
                logger.error(f"Error in generate_draft step: {e}")
                draft_answer = f"Error generating draft answer: {str(e)}"
            
            return {
                **state,
                "draft_answer": draft_answer
            }
        
        def use_general_knowledge(state: State) -> State:
            """Use general knowledge to answer the query"""
            query = state["query"]
            
            answer = self._use_general_knowledge(query)
            
            return {
                **state,
                "draft_answer": answer,
                "answer": answer  # Set final answer directly
            }
        
        def evaluate_relevance(state: State) -> State:
            """Evaluate the relevance and quality of the draft answer"""
            query = state["query"]
            context = state.get("context", [])
            draft_answer = state.get("draft_answer", "")
            
            # Skip evaluation for general knowledge answers
            if draft_answer.lower().startswith("based on general knowledge"):
                return {
                    **state,
                    "relevance_score": 1.0  # Assume general knowledge answers are relevant
                }
            
            # Extract text from documents for the prompt
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are an expert evaluator of answer quality and relevance. "
                "You assess if answers are fully supported by the provided context.\n\n"
                "Question: {query}\n\n"
                "Context information:\n{context}\n\n"
                "Draft answer: {draft_answer}\n\n"
                "Evaluate how well the draft answer is supported by the context on a scale from 0.0 to 1.0. "
                "Return ONLY a number between 0.0 and 1.0, where 1.0 means perfectly supported "
                "and 0.0 means not supported at all."
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                result_str = chain.invoke({
                    "context": context_text, 
                    "query": query,
                    "draft_answer": draft_answer
                })
                
                # Extract score - handling potential unexpected outputs
                try:
                    score = float(result_str.strip())
                    # Ensure score is between 0 and 1
                    score = max(0.0, min(1.0, score))
                except ValueError:
                    # If we can't extract a valid score, use a moderate default
                    score = 0.5
            except Exception as e:
                logger.error(f"Error in evaluate_relevance step: {e}")
                score = 0.5  # Default to moderate score on error
            
            return {
                **state,
                "relevance_score": score
            }
        
        def decide_next_step(state: State) -> str:
            """Decide whether to use the draft answer or refine it"""
            # Skip for general knowledge answers
            if state.get("draft_answer", "").lower().startswith("based on general knowledge"):
                return END
                
            score = state.get("relevance_score", 0.0)
            
            if score >= 0.8:
                return "use_draft_as_final"
            else:
                return "generate_final"
        
        def use_draft_as_final(state: State) -> State:
            """Use the draft answer as the final answer"""
            return {
                **state,
                "answer": state.get("draft_answer", "")
            }
        
        def generate_final(state: State) -> State:
            """Generate the final answer based on the evaluation"""
            query = state["query"]
            context = state.get("context", [])
            draft_answer = state.get("draft_answer", "")
            relevance_score = state.get("relevance_score", 0.0)
            
            # If the draft answer wasn't sufficiently supported by context, refine it
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are a careful AI assistant that ensures all information in your answers is "
                "fully supported by the provided context. Never include unsupported information.\n\n"
                "Question: {query}\n\n"
                "Context information:\n{context}\n\n"
                "Draft answer: {draft_answer}\n\n"
                "The draft answer received a relevance score of {relevance_score}, indicating it may not be "
                "entirely supported by the context. Please refine the answer to ensure it's fully "
                "supported by the provided context. Only include information found in the context. "
                "If the context doesn't provide sufficient information, clearly state that limitation."
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                refined_answer = chain.invoke({
                    "context": context_text, 
                    "query": query,
                    "draft_answer": draft_answer,
                    "relevance_score": relevance_score
                })
            except Exception as e:
                logger.error(f"Error in generate_final step: {e}")
                refined_answer = draft_answer  # Fallback to draft answer if error
            
            return {
                **state,
                "answer": refined_answer
            }
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("retrieve", retrieve)
        builder.add_node("assess_relevance", assess_relevance)
        builder.add_node("generate_draft", generate_draft)
        builder.add_node("use_general_knowledge", use_general_knowledge)
        builder.add_node("evaluate_relevance", evaluate_relevance)
        builder.add_node("use_draft_as_final", use_draft_as_final)
        builder.add_node("generate_final", generate_final)
        
        # Add edges
        builder.add_edge("retrieve", "assess_relevance")
        
        # Add conditional edge for knowledge source selection
        builder.add_conditional_edges(
            "assess_relevance",
            choose_knowledge_source,
            {
                "generate_draft": "generate_draft",
                "use_general_knowledge": "use_general_knowledge"
            }
        )
        
        builder.add_edge("generate_draft", "evaluate_relevance")
        builder.add_edge("use_general_knowledge", END)
        
        # Add conditional edge for draft evaluation
        builder.add_conditional_edges(
            "evaluate_relevance",
            decide_next_step,
            {
                "use_draft_as_final": "use_draft_as_final",
                "generate_final": "generate_final"
            }
        )
        
        builder.add_edge("use_draft_as_final", END)
        builder.add_edge("generate_final", END)
        
        # Set entry point
        builder.set_entry_point("retrieve")
        
        # Compile the graph
        self.rag_workflow = builder.compile()
    
    def _create_adaptive_rag_workflow(self):
        """Create an adaptive RAG workflow with fallback to general knowledge"""
        # Define the state
        class State(TypedDict):
            query: str
            search_strategy: str
            context: Optional[List[Document]]
            context_relevance: Optional[bool]
            answer: Optional[str]
            confidence: Optional[float]
        
        def determine_search_strategy(state: State) -> State:
            """Determine the search strategy based on the query"""
            query = state["query"]
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You analyze search queries and determine the best search strategy. "
                "Choose from the following strategies:\n"
                "- 'semantic': For conceptual, abstract, or non-specific queries\n"
                "- 'keyword': For queries with specific technical terms, names, or facts\n"
                "- 'hybrid': For queries that have both conceptual and specific elements\n\n"
                "Query: {query}\n\n"
                "Based on this query, which search strategy would be most effective? "
                "Return ONLY the strategy name: 'semantic', 'keyword', or 'hybrid'."
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                strategy = chain.invoke({"query": query}).strip().lower()
                
                # Ensure a valid strategy
                if strategy not in ["semantic", "keyword", "hybrid"]:
                    strategy = "hybrid"  # Default to hybrid
            except Exception as e:
                logger.error(f"Error in determine_search_strategy step: {e}")
                strategy = "hybrid"  # Default to hybrid on error
            
            return {
                **state,
                "search_strategy": strategy
            }
        
        def retrieve(state: State) -> State:
            """Retrieve relevant documents from the vector store based on the chosen strategy"""
            query = state["query"]
            strategy = state["search_strategy"]
            
            # Get relevant documents from vector store
            if self.vector_store is None:
                raise ValueError("Vector store not initialized. Please process documents first.")
            
            k = 5  # Default number of results
            
            if strategy == "semantic":
                # For semantic search, use vector similarity search
                documents = self.vector_store.similarity_search(query, k=k)
            
            elif strategy == "keyword":
                # For keyword search, use MMR retrieval with higher diversity
                documents = self.vector_store.max_marginal_relevance_search(
                    query, k=k, fetch_k=2*k, lambda_mult=0.5
                )
            
            else:  # hybrid
                # Get documents from both methods and combine
                semantic_docs = self.vector_store.similarity_search(query, k=k//2)
                keyword_docs = self.vector_store.max_marginal_relevance_search(
                    query, k=k//2, fetch_k=k, lambda_mult=0.3
                )
                
                # Combine and deduplicate results
                seen_contents = set()
                documents = []
                
                for doc in semantic_docs + keyword_docs:
                    if doc.page_content not in seen_contents:
                        documents.append(doc)
                        seen_contents.add(doc.page_content)
                        if len(documents) >= k:
                            break
            
            return {
                **state,
                "context": documents
            }
        
        def assess_relevance(state: State) -> State:
            """Assess whether retrieved context is relevant to the query"""
            query = state["query"]
            context = state.get("context", [])
            
            if not context:
                return {**state, "context_relevance": False}
            
            # Extract text from documents for assessment
            context_texts = [doc.page_content for doc in context]
            
            # Assess relevance
            is_relevant = self._assess_context_relevance(query, context_texts)
            
            return {
                **state,
                "context_relevance": is_relevant
            }
        
        def choose_knowledge_source(state: State) -> str:
            """Choose whether to use context or general knowledge"""
            is_relevant = state.get("context_relevance", False)
            
            if is_relevant or not self.use_fallback:
                return "generate_from_context"
            else:
                return "generate_from_general_knowledge"
        
        def generate_from_context(state: State) -> State:
            """Generate an answer based on the retrieved documents"""
            query = state["query"]
            context = state.get("context", [])
            strategy = state["search_strategy"]
            
            if not context:
                return {
                    **state, 
                    "answer": "No relevant information found to answer the query.",
                    "confidence": 0.0
                }
            
            # Extract text from documents for the prompt
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are a helpful AI assistant that answers questions based on the provided context. "
                "You always indicate your confidence in your answer based on how well the context "
                "supports your response.\n\n"
                "Context information (retrieved using {strategy} search):\n\n{context}\n\n"
                "Question: {query}\n\n"
                "Answer the question based on the context above. At the end of your answer, include "
                "a confidence score from 0.0 to 1.0 in the format [Confidence: X.X] to indicate "
                "how well the context supports your answer."
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                result = chain.invoke({
                    "context": context_text, 
                    "query": query,
                    "strategy": strategy
                })
                
                # Extract confidence score
                confidence = 0.7  # Default confidence
                if "[Confidence:" in result:
                    try:
                        confidence_str = result.split("[Confidence:")[1].split("]")[0].strip()
                        confidence = float(confidence_str)
                        # Remove the confidence marker from the answer
                        answer = result.split("[Confidence:")[0].strip()
                    except (IndexError, ValueError):
                        # If parsing fails, use the whole response
                        answer = result
                else:
                    answer = result
            except Exception as e:
                logger.error(f"Error in generate step: {e}")
                answer = f"Error generating response: {str(e)}"
                confidence = 0.0
            
            return {
                **state,
                "answer": answer,
                "confidence": confidence
            }
        
        def generate_from_general_knowledge(state: State) -> State:
            """Generate a response using general knowledge"""
            query = state["query"]
            
            answer = self._use_general_knowledge(query)
            confidence = 0.9  # Generally high confidence for general knowledge
            
            return {
                **state,
                "answer": answer,
                "confidence": confidence
            }
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("determine_search_strategy", determine_search_strategy)
        builder.add_node("retrieve", retrieve)
        builder.add_node("assess_relevance", assess_relevance)
        builder.add_node("generate_from_context", generate_from_context)
        builder.add_node("generate_from_general_knowledge", generate_from_general_knowledge)
        
        # Add edges
        builder.add_edge("determine_search_strategy", "retrieve")
        builder.add_edge("retrieve", "assess_relevance")
        
        # Add conditional edge for knowledge source
        builder.add_conditional_edges(
            "assess_relevance",
            choose_knowledge_source,
            {
                "generate_from_context": "generate_from_context",
                "generate_from_general_knowledge": "generate_from_general_knowledge"
            }
        )
        
        builder.add_edge("generate_from_context", END)
        builder.add_edge("generate_from_general_knowledge", END)
        
        # Set entry point
        builder.set_entry_point("determine_search_strategy")
        
        # Compile the graph
        self.rag_workflow = builder.compile()
    
    def _create_raptor_rag_workflow(self):
        """Create a RAPTOR RAG workflow with fallback to general knowledge"""
        # Define the state
        class State(TypedDict):
            query: str
            initial_context: Optional[List[Document]]
            reranked_context: Optional[List[Document]]
            context_relevance: Optional[bool]
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
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are an expert at evaluating document relevance to a query. "
                "For each document, provide a relevance score from 0.0 to 1.0, where "
                "1.0 means highly relevant and 0.0 means not relevant at all.\n\n"
                "Query: {query}\n\n"
                "Document: {document}\n\n"
                "Score this document's relevance to the query from 0.0 to 1.0. "
                "Return ONLY the score as a number, nothing else."
            )
            
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
                    # Run the chain with explicit parameters
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
        
        def assess_relevance(state: State) -> State:
            """Assess whether reranked context is relevant to the query"""
            query = state["query"]
            context = state.get("reranked_context", [])
            
            if not context:
                return {**state, "context_relevance": False}
            
            # Extract text from documents for assessment
            context_texts = [doc.page_content for doc in context]
            
            # Assess relevance
            is_relevant = self._assess_context_relevance(query, context_texts)
            
            return {
                **state,
                "context_relevance": is_relevant
            }
        
        def choose_knowledge_source(state: State) -> str:
            """Choose whether to use context or general knowledge"""
            is_relevant = state.get("context_relevance", False)
            
            if is_relevant or not self.use_fallback:
                return "generate_from_context"
            else:
                return "generate_from_general_knowledge"
        
        def generate_from_context(state: State) -> State:
            """Generate an answer based on the reranked documents"""
            query = state["query"]
            context = state.get("reranked_context", [])
            
            if not context:
                return {**state, "answer": "No relevant information found to answer the query."}
            
            # Extract text from documents for the prompt
            context_texts = [doc.page_content for doc in context]
            context_text = "\n\n".join(context_texts)
            
            # Use PromptTemplate for more reliable template handling
            prompt = PromptTemplate.from_template(
                "You are a helpful AI assistant that answers questions based on the "
                "provided context. The context has been carefully selected and ranked "
                "for relevance to the query.\n\n"
                "Context information:\n\n{context}\n\n"
                "Question: {query}\n\n"
                "Provide a comprehensive answer based on the context. "
                "If the context doesn't contain sufficient information, clearly state that limitation."
            )
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Run the chain with explicit parameters
            try:
                answer = chain.invoke({"context": context_text, "query": query})
                if self.verbose:
                    print(f"Generated answer with context of length {len(context_text)}")
            except Exception as e:
                logger.error(f"Error in generate step: {e}")
                answer = f"Error generating response: {str(e)}"
            
            return {
                **state,
                "answer": answer
            }
        
        def generate_from_general_knowledge(state: State) -> State:
            """Generate a response using general knowledge"""
            query = state["query"]
            
            answer = self._use_general_knowledge(query)
            
            return {
                **state,
                "answer": answer
            }
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("retrieve_initial", retrieve_initial)
        builder.add_node("rerank_documents", rerank_documents)
        builder.add_node("assess_relevance", assess_relevance)
        builder.add_node("generate_from_context", generate_from_context)
        builder.add_node("generate_from_general_knowledge", generate_from_general_knowledge)
        
        # Add edges
        builder.add_edge("retrieve_initial", "rerank_documents")
        builder.add_edge("rerank_documents", "assess_relevance")
        
        # Add conditional edge for knowledge source
        builder.add_conditional_edges(
            "assess_relevance",
            choose_knowledge_source,
            {
                "generate_from_context": "generate_from_context",
                "generate_from_general_knowledge": "generate_from_general_knowledge"
            }
        )
        
        builder.add_edge("generate_from_context", END)
        builder.add_edge("generate_from_general_knowledge", END)
        
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
        try:
            result = self.rag_workflow.invoke(initial_state)
            
            # Extract the answer from the result
            answer = result.get("answer", "No answer generated.")
            
            return answer
        except Exception as e:
            logger.error(f"Error in workflow execution: {e}", exc_info=True)
            return f"Error generating response: {str(e)}"

def get_user_zip_path() -> str:
    """Get the ZIP file path from the user"""
    while True:
        zip_path = input("Enter the path to your document ZIP file: ").strip()
        
        # Check if the path is empty
        if not zip_path:
            print("Error: Please enter a valid path.")
            continue
        
        # Check if the file exists
        if not os.path.exists(zip_path):
            print(f"Error: File {zip_path} does not exist.")
            continue
            
        # Check if it's a ZIP file
        if not zip_path.lower().endswith('.zip'):
            print("Error: The file must be a ZIP file with .zip extension.")
            continue
            
        return zip_path

def get_rag_type() -> str:
    """Get the RAG type from the user"""
    rag_options = {
        "1": "standard",
        "2": "iterative",
        "3": "self-reflective",
        "4": "adaptive",
        "5": "raptor"
    }
    
    print("\nSelect RAG Type:")
    print("1. Standard RAG (Basic retrieval and generation)")
    print("2. Iterative RAG (Multiple retrieval steps with query reformulation)")
    print("3. Self-reflective RAG (Evaluates its own answers for relevance)")
    print("4. Adaptive RAG (Adjusts search strategy based on query type)")
    print("5. RAPTOR RAG (Advanced reranking - Recommended)")
    
    while True:
        choice = input("Enter your choice (1-5): ").strip()
        
        if choice in rag_options:
            return rag_options[choice]
        else:
            print("Invalid choice. Please enter a number from 1-5.")

def get_vector_store_type() -> str:
    """Get the vector store type from the user"""
    store_options = {
        "1": "chroma",
        "2": "faiss"
    }
    
    print("\nSelect Vector Store Type:")
    print("1. ChromaDB (Default, good all-around choice)")
    print("2. FAISS (Faster for large document collections)")
    
    while True:
        choice = input("Enter your choice (1-2): ").strip()
        
        if choice in store_options:
            return store_options[choice]
        else:
            print("Invalid choice. Please enter 1 or 2.")

def get_chunking_method() -> str:
    """Get the chunking method from the user"""
    chunking_options = {
        "1": "recursive",
        "2": "character",
        "3": "token"
    }
    
    print("\nSelect Chunking Method:")
    print("1. Recursive (Splits on multiple separators, good for most documents)")
    print("2. Character (Simple character-based splitting)")
    print("3. Token (Precise token-based splitting)")
    
    while True:
        choice = input("Enter your choice (1-3): ").strip()
        
        if choice in chunking_options:
            return chunking_options[choice]
        else:
            print("Invalid choice. Please enter a number from 1-3.")

def get_chunk_size() -> tuple:
    """Get the chunk size and overlap from the user"""
    print("\nSet Chunk Size and Overlap:")
    print("Recommended values: 500 tokens with 50 token overlap")
    
    try:
        size = input("Enter chunk size (tokens) [500]: ").strip()
        max_tokens = int(size) if size else 500
        
        overlap = input("Enter chunk overlap (tokens) [50]: ").strip()
        token_overlap = int(overlap) if overlap else 50
        
        return max_tokens, token_overlap
    except ValueError:
        print("Invalid input. Using default values: 500 tokens with 50 token overlap.")
        return 500, 50

def get_use_fallback() -> bool:
    """Ask if general knowledge fallback should be used"""
    print("\nWhen documents don't contain relevant information:")
    print("1. Fallback to using LLM's general knowledge (Recommended)")
    print("2. Only use information from documents (Limit to retrieval)")
    
    while True:
        choice = input("Enter your choice (1-2): ").strip()
        
        if choice == "1":
            return True
        elif choice == "2":
            return False
        else:
            print("Invalid choice. Please enter 1 or 2.")

def get_verbose_mode() -> bool:
    """Get verbose mode setting from the user"""
    while True:
        choice = input("\nEnable verbose mode for debugging? (y/n) [n]: ").strip().lower()
        
        if choice == "" or choice == "n":
            return False
        elif choice == "y":
            return True
        else:
            print("Invalid choice. Please enter 'y' or 'n'.")

def main():
    """Main function with interactive setup"""
    try:
        print("\n===============================================================")
        print("             Enhanced RAG System with Azure OpenAI")
        print("===============================================================\n")
        
        # Set up Azure OpenAI
        setup_azure_openai()
        
        # Get configuration from user
        zip_path = get_user_zip_path()
        rag_type = get_rag_type()
        vector_store_type = get_vector_store_type()
        chunking_method = get_chunking_method()
        max_tokens, token_overlap = get_chunk_size()
        use_fallback = get_use_fallback()
        verbose = get_verbose_mode()
        
        # Summary of settings
        print("\n===============================================================")
        print("Configuration Summary:")
        print(f"  Document: {zip_path}")
        print(f"  RAG Type: {rag_type}")
        print(f"  Vector Store: {vector_store_type}")
        print(f"  Chunking Method: {chunking_method}")
        print(f"  Chunk Size: {max_tokens} tokens")
        print(f"  Chunk Overlap: {token_overlap} tokens")
        print(f"  General Knowledge Fallback: {'Enabled' if use_fallback else 'Disabled'}")
        print(f"  Verbose Mode: {'Enabled' if verbose else 'Disabled'}")
        print("===============================================================\n")
        
        # Initialize the RAG system
        print("Initializing RAG system...")
        rag = EnhancedRAG(
            embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
            llm_model_name="gpt-4o",  # Will use Azure OpenAI
            vector_store_type=vector_store_type,
            chunking_method=chunking_method,
            max_tokens=max_tokens,
            token_overlap=token_overlap,
            rag_type=rag_type,
            use_fallback=use_fallback,
            verbose=verbose
        )
        
        # Process documents
        print(f"Processing documents from {zip_path}...")
        rag.process_documents(zip_path)
        print("Document processing complete.")
        
        # Interactive query loop
        print("\n===============================================================")
        print("                    Interactive Query Mode")
        print("           Enter your questions, or 'quit' to exit")
        print("===============================================================\n")
        
        while True:
            query = input("\nQuery: ").strip()
            if query.lower() in ["quit", "exit", "q"]:
                break
            
            if not query:
                continue
            
            try:
                print("\nGenerating response...")
                response = rag.generate_response(query)
                print(f"\nResponse: {response}")
            except Exception as e:
                logger.error(f"Error generating response: {e}", exc_info=True if verbose else False)
                print(f"Error generating response: {e}")
                
    except Exception as e:
        logger.error(f"Error in main: {e}", exc_info=True)
        print(f"Error: {e}")

if __name__ == "__main__":
    main()