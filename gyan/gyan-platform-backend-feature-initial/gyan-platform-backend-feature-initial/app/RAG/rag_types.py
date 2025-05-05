

from abc import ABC, abstractmethod
import networkx as nx
import numpy as np
import hashlib
from typing import List, Any, Dict, Tuple, Optional
from collections import defaultdict

class BaseRAG(ABC):
    def __init__(self, document_loader, chunker, embedding_generator, 
                 vector_store, search_algorithm, generator):
        self.document_loader = document_loader
        self.chunker = chunker
        self.embedding_generator = embedding_generator
        self.vector_store = vector_store
        self.search_algorithm = search_algorithm
        self.generator = generator

    @abstractmethod
    def process_documents(self, zip_path: str) -> List[Any]:
        pass

    @abstractmethod
    def generate_response(self, query: str, max_length: int = 512) -> str:
        pass

     # Add this method to BaseRAG
    def retrieve_context(self, query: str, max_docs: int = 3):
        """
        Retrieve relevant context for a given query
        
        Args:
            query (str): The user query
            max_docs (int): Maximum number of documents to retrieve
            
        Returns:
            List: List of relevant documents
        """
        try:
            # Generate embeddings for the query
            query_embedding = self.embedding_generator.generate_embeddings([query])[0]
            
            # For ChromaDB
            if hasattr(self.vector_store, 'query'):
                results = self.vector_store.query(
                    query_embeddings=[query_embedding],
                    n_results=max_docs
                )
                
                # Convert results to document format
                documents = []
                for i, (doc_content, metadata) in enumerate(zip(
                    results.get('documents', [[]])[0],
                    results.get('metadatas', [[]])[0] 
                )):
                    from langchain_core.documents import Document
                    documents.append(Document(
                        page_content=doc_content,
                        metadata=metadata or {}
                    ))
                
                return documents
                
            # For Pinecone
            elif hasattr(self.vector_store, 'query') and callable(getattr(self.vector_store, 'query')):
                results = self.vector_store.query(
                    vector=query_embedding,
                    top_k=max_docs,
                    include_metadata=True
                )
                
                documents = []
                for match in results.get('matches', []):
                    from langchain_core.documents import Document
                    content = match.get('metadata', {}).get('content', '')
                    metadata = {k: v for k, v in match.get('metadata', {}).items() if k != 'content'}
                    documents.append(Document(
                        page_content=content,
                        metadata=metadata
                    ))
                    
                return documents
                
            # For Weaviate
            elif hasattr(self, 'class_name') and hasattr(self.vector_store, 'query'):
                results = (
                    self.vector_store.query.get(self.class_name, ["content", "file_name", "chunk_id"])
                    .with_near_vector({
                        "vector": query_embedding
                    })
                    .with_limit(max_docs)
                    .do()
                )
                
                documents = []
                for item in results.get('data', {}).get('Get', {}).get(self.class_name, []):
                    from langchain_core.documents import Document
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
                
            # For FAISS
            elif hasattr(self, 'stored_documents') and hasattr(self.vector_store, 'search'):
                import numpy as np
                
                # Convert the query embedding to the right format
                query_vector = np.array([query_embedding]).astype('float32')
                
                # Search in the index
                D, I = self.vector_store.search(query_vector, max_docs)
                
                # Retrieve documents based on indices
                documents = [self.stored_documents[i] for i in I[0] if i < len(self.stored_documents)]
                return documents
                
            else:
                print("⚠️ Unsupported vector store type for context retrieval")
                return []
                
        except Exception as e:
            print(f"❌ Error retrieving context: {str(e)}")
            import traceback
            traceback.print_exc()
            return []

class StandardRAG(BaseRAG):
    def process_documents(self, zip_path: str) -> List[Any]:
        """Standard RAG document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, embeddings)
        index = self.search_algorithm.build_index(embeddings)
        self.vector_store.index = index
        return documents

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Standard RAG response generation - matches AdaptiveRAG exactly"""
        relevant_docs = self.vector_store.search(query)
        
        if relevant_docs:
            context = "\n".join(relevant_docs)
            prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            return response
        
        return "No relevant documents found to answer the query."


class GraphRAG(BaseRAG):
    def __init__(self, similarity_threshold: float = 0.7, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.similarity_threshold = similarity_threshold
        self.embeddings = None
        self.knowledge_graph = nx.Graph()
        self.chunk_to_node_map = {}
        self.node_counter = 0

    def process_documents(self, zip_path: str) -> List[Any]:
        """Graph RAG document processing - matches AdaptiveRAG exactly"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        
        self._build_knowledge_graph(chunks, self.embeddings)
        
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        
        return documents

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Graph RAG response generation - matches AdaptiveRAG exactly"""
        relevant_docs = self.vector_store.search(query)
        
        if relevant_docs:
            context = "\n".join(relevant_docs)
            prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            return response
        
        return "No relevant documents found to answer the query."

    def _build_knowledge_graph(self, chunks: List[Any], embeddings: List[List[float]]):
        """Build knowledge graph in background for future use"""
        for chunk, embedding in zip(chunks, embeddings):
            node_id = self._create_node_id()
            chunk_id = self._get_chunk_id(chunk)
            content = chunk.content if hasattr(chunk, 'content') else str(chunk)
            
            self.knowledge_graph.add_node(
                node_id, 
                content=content,
                embedding=embedding,
                chunk_id=chunk_id
            )
            self.chunk_to_node_map[chunk_id] = node_id

    def _create_node_id(self) -> str:
        self.node_counter += 1
        return f"node_{self.node_counter}"

    def _get_chunk_id(self, chunk: Any) -> str:
        content = chunk.content if hasattr(chunk, 'content') else str(chunk)
        return hashlib.md5(content.encode()).hexdigest()

class AdaptiveRAG(BaseRAG):
    def __init__(self, confidence_threshold: float = 0.7, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.confidence_threshold = confidence_threshold
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """Adaptive RAG document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Adaptive RAG response generation"""
        
        relevant_docs = self.vector_store.search(query)
        
        
        if relevant_docs:
            context = "\n".join(relevant_docs)
            prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            return response
        
        return "No relevant documents found to answer the query."
    
class IterativeRAG(BaseRAG):
    def __init__(self, max_iterations: int = 3, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_iterations = max_iterations
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """Iterative RAG document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Iterative RAG response generation"""
        current_query = query
        context_history = []
        response = ""

        for iteration in range(self.max_iterations):
            relevant_docs = self.vector_store.search(current_query)
            
            if not relevant_docs:
                break

            context_history.extend(relevant_docs)
    
            context = "\n".join(context_history)
            prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
            
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            
            follow_up_prompt = (
                f"Based on the original question: '{query}'\n"
                f"And the current answer: '{response}'\n"
                "What follow-up question should be asked to get more relevant information? "
                "If no follow-up is needed, respond with 'COMPLETE'."
            )
            
            next_query = self.generator(follow_up_prompt, max_length=100)[0]["generated_text"]
            
            if "COMPLETE" in next_query:
                break
                
            current_query = next_query

        return response if response else "No relevant documents found to answer the query."


class CorrectiveRAG(BaseRAG):
    def __init__(self, fact_checker, correction_threshold: float = 0.7, 
                 max_correction_attempts: int = 2, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fact_checker = fact_checker
        self.correction_threshold = correction_threshold
        self.max_correction_attempts = max_correction_attempts
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """Corrective RAG document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Corrective RAG response generation with fact-checking"""
        for attempt in range(self.max_correction_attempts):
            
            relevant_docs = self.vector_store.search(query)
            
            if not relevant_docs:
                return "No relevant documents found to answer the query."

            context = "\n".join(relevant_docs)
            prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            
            fact_check_results = self.fact_checker.verify_response(
                response=response,
                context=relevant_docs,
                query=query
            )
            
            if fact_check_results["confidence"] >= self.correction_threshold:
                return response
            
            correction_prompt = (
                f"The following response may contain inaccuracies:\n{response}\n\n"
                f"Source documents state:\n{context}\n\n"
                f"Please provide a corrected response to the original question: {query}\n"
                "Ensure all statements are supported by the source documents."
            )
            
            response = self.generator(correction_prompt, max_length=max_length)[0]["generated_text"]
            
            if attempt == self.max_correction_attempts - 1:
                return response

        return response    

class RaptorRAG(BaseRAG):
    def __init__(self, reranking_model, prompt_optimizer, 
                 token_weight_threshold: float = 0.5,
                 max_prompt_attempts: int = 3,
                 *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.reranking_model = reranking_model
        self.prompt_optimizer = prompt_optimizer
        self.token_weight_threshold = token_weight_threshold
        self.max_prompt_attempts = max_prompt_attempts
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """RAPTOR document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """RAPTOR response generation"""

        relevant_docs = self.vector_store.search(query)
        
        if not relevant_docs:
            return "No relevant documents found to answer the query."

        try:
            ranked_results = self.reranking_model.rerank_passages(query, relevant_docs)
            relevant_docs = [result["passage"] for result in ranked_results]
        except Exception as e:
            print(f"Reranking failed, using original order: {e}")

        context = "\n".join(relevant_docs)

        try:
            prompt = self.prompt_optimizer.optimize(
                query=query,
                context=context,
                attempt=0
            )
        except Exception as e:
            print(f"Prompt optimization failed, using default prompt: {e}")
            prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"

        response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
        return response