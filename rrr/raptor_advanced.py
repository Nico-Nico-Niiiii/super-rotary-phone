#!/usr/bin/env python3
"""
Advanced RAPTOR RAG implementation with LangChain and LangGraph
This incorporates more advanced reranking capabilities inspired by your original RAPTOR implementation
"""

from typing import List, Dict, Any, Optional, TypedDict, Union, Tuple
import numpy as np

# LangChain imports
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnableLambda

# LangChain for reranking
from langchain_community.retrievers.multi_query import MultiQueryRetriever
from langchain_community.retrievers import BM25Retriever
from langchain_community.retrievers.document_compressors import LLMChainExtractor
from langchain_community.retrievers.document_compressors import EmbeddingsFilter
from langchain.retrievers.document_compressors import DocumentCompressorPipeline
from langchain.retrievers import ContextualCompressionRetriever

# LangGraph
import langgraph.graph as graph
from langgraph.graph import END

# Import the base RAG system
from rag_inference import LangGraphRAG

class RaptorAdvancedRAG(LangGraphRAG):
    """
    Advanced RAPTOR RAG implementation with enhanced reranking capabilities
    """
    
    def __init__(self, *args, **kwargs):
        """Initialize with RAPTOR as the RAG type"""
        # Force RAPTOR type
        kwargs["rag_type"] = "raptor"
        
        # Add additional parameters
        self.reranking_methods = kwargs.pop("reranking_methods", ["llm", "relevance"])
        self.use_multi_query = kwargs.pop("use_multi_query", True)
        self.use_bm25 = kwargs.pop("use_bm25", True)
        self.token_weight_threshold = kwargs.pop("token_weight_threshold", 0.5)
        self.max_prompt_attempts = kwargs.pop("max_prompt_attempts", 3)
        
        # Initialize the base class
        super().__init__(*args, **kwargs)
    
    def _create_raptor_rag_workflow(self):
        """
        Create an advanced RAPTOR RAG workflow with enhanced reranking capabilities
        Overrides the base implementation
        """
        # Define the state
        class State(TypedDict):
            query: str
            expanded_queries: Optional[List[str]]
            vector_results: Optional[List[Document]]
            keyword_results: Optional[List[Document]]
            combined_results: Optional[List[Document]]
            reranked_results: Optional[List[Document]]
            extracted_context: Optional[str]
            answer: Optional[str]
            attempts: int
        
        def generate_query_variations(state: State) -> State:
            """Generate variations of the query to improve retrieval"""
            if not self.use_multi_query:
                return {**state, "expanded_queries": [state["query"]]}
                
            query = state["query"]
            
            # Create the prompt for query expansion
            prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "You are an expert at expanding search queries to improve document retrieval. "
                    "For a given query, generate 3 variations that could help retrieve relevant information. "
                    "The variations should be different from each other and target different aspects or "
                    "phrasings of the original query."
                )),
                ("human", (
                    "Original query: {query}\n\n"
                    "Generate 3 alternative search queries that could help retrieve relevant information. "
                    "Return ONLY the list of queries, one per line, nothing else."
                ))
            ])
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Generate variations
            try:
                variations = chain.invoke({"query": query})
                
                # Process the variations
                expanded_queries = [query]  # Start with the original query
                
                for line in variations.strip().split("\n"):
                    # Clean up the variation
                    clean_line = line.strip()
                    
                    # Remove numbering if present
                    if clean_line and clean_line[0].isdigit() and clean_line[1:3] in [". ", ") ", ": "]:
                        clean_line = clean_line[3:].strip()
                    
                    # Add if not empty and not a duplicate
                    if clean_line and clean_line != query and clean_line not in expanded_queries:
                        expanded_queries.append(clean_line)
                
                # Ensure we have at least one query
                if not expanded_queries:
                    expanded_queries = [query]
            except Exception as e:
                if self.verbose:
                    print(f"Error generating query variations: {e}")
                expanded_queries = [query]
            
            return {
                **state,
                "expanded_queries": expanded_queries
            }
        
        def retrieve_vector_documents(state: State) -> State:
            """Retrieve documents using vector search"""
            if not self.vector_store:
                raise ValueError("Vector store not initialized. Please process documents first.")
                
            expanded_queries = state.get("expanded_queries", [state["query"]])
            
            # Get results for each query
            all_docs = []
            for query in expanded_queries:
                docs = self.vector_store.similarity_search(query, k=3)
                all_docs.extend(docs)
            
            # Deduplicate by content
            unique_docs = []
            seen_contents = set()
            
            for doc in all_docs:
                if doc.page_content not in seen_contents:
                    unique_docs.append(doc)
                    seen_contents.add(doc.page_content)
            
            return {
                **state,
                "vector_results": unique_docs
            }
        
        def retrieve_keyword_documents(state: State) -> State:
            """Retrieve documents using keyword (BM25) search"""
            if not self.use_bm25:
                return {**state, "keyword_results": []}
                
            expanded_queries = state.get("expanded_queries", [state["query"]])
            
            # Get all documents from the vector store
            if not hasattr(self, 'all_documents') or not self.all_documents:
                # This is inefficient but necessary without direct access to documents
                try:
                    # Try to get all documents
                    all_docs = self.vector_store.similarity_search(
                        "get all documents", k=1000
                    )
                    self.all_documents = all_docs
                except Exception as e:
                    if self.verbose:
                        print(f"Error retrieving documents for BM25: {e}")
                    return {**state, "keyword_results": []}
            
            # Create BM25 retriever
            try:
                bm25_retriever = BM25Retriever.from_documents(
                    self.all_documents,
                    k=3
                )
                
                # Get results for each query
                all_docs = []
                for query in expanded_queries:
                    docs = bm25_retriever.get_relevant_documents(query)
                    all_docs.extend(docs)
                
                # Deduplicate by content
                unique_docs = []
                seen_contents = set()
                
                for doc in all_docs:
                    if doc.page_content not in seen_contents:
                        unique_docs.append(doc)
                        seen_contents.add(doc.page_content)
                
                return {
                    **state,
                    "keyword_results": unique_docs
                }
            except Exception as e:
                if self.verbose:
                    print(f"Error with BM25 retrieval: {e}")
                return {**state, "keyword_results": []}
        
        def combine_results(state: State) -> State:
            """Combine and deduplicate results from different retrieval methods"""
            vector_results = state.get("vector_results", [])
            keyword_results = state.get("keyword_results", [])
            
            # Combine all results
            all_docs = vector_results + keyword_results
            
            # Deduplicate by content
            unique_docs = []
            seen_contents = set()
            
            for doc in all_docs:
                if doc.page_content not in seen_contents:
                    unique_docs.append(doc)
                    seen_contents.add(doc.page_content)
            
            return {
                **state,
                "combined_results": unique_docs
            }
        
        def rerank_documents(state: State) -> State:
            """Rerank documents using multiple methods"""
            query = state["query"]
            documents = state.get("combined_results", [])
            reranking_methods = self.reranking_methods
            
            if not documents:
                return {**state, "reranked_results": []}
            
            # Get scores for each document using different methods
            doc_scores = {doc.page_content: {} for doc in documents}
            
            # LLM-based relevance scoring
            if "llm" in reranking_methods:
                prompt = ChatPromptTemplate.from_messages([
                    ("system", (
                        "You are an expert at evaluating document relevance to a query. "
                        "For each document, provide a relevance score from 0.0 to 1.0, where "
                        "1.0 means highly relevant and 0.0 means not relevant at all."
                    )),
                    ("human", (
                        "Query: {query}\n\n"
                        "Document: {document}\n\n"
                        "Score this document's relevance to the query from 0.0 to 1.0. "
                        "Return ONLY the score as a number, nothing else."
                    ))
                ])
                
                score_chain = (
                    prompt 
                    | self.llm
                    | StrOutputParser()
                )
                
                # Score each document
                for doc in documents:
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
                        
                        doc_scores[doc.page_content]["llm"] = score
                    except Exception as e:
                        if self.verbose:
                            print(f"Error during LLM document scoring: {e}")
                        doc_scores[doc.page_content]["llm"] = 0.5  # Default score
            
            # Keyword match scoring
            if "keyword" in reranking_methods:
                # Extract keywords from query
                keywords = set(query.lower().split())
                
                for doc in documents:
                    content = doc.page_content.lower()
                    # Count keyword matches
                    matches = sum(1 for keyword in keywords if keyword in content)
                    # Calculate score
                    score = min(1.0, matches / max(1, len(keywords)))
                    doc_scores[doc.page_content]["keyword"] = score
            
            # Simple relevance scoring based on query terms
            if "relevance" in reranking_methods:
                query_terms = query.lower().split()
                
                for doc in documents:
                    content = doc.page_content.lower()
                    # Calculate term frequency for each query term
                    term_scores = []
                    for term in query_terms:
                        if len(term) < 3:  # Skip short terms
                            continue
                        occurrences = content.count(term)
                        score = min(1.0, occurrences / 5)  # Cap at 5 occurrences
                        term_scores.append(score)
                    
                    # Average the term scores
                    if term_scores:
                        avg_score = sum(term_scores) / len(term_scores)
                    else:
                        avg_score = 0.5
                    
                    doc_scores[doc.page_content]["relevance"] = avg_score
            
            # Calculate aggregate score for each document
            aggregate_scores = {}
            for doc_content, scores in doc_scores.items():
                if scores:
                    aggregate_scores[doc_content] = sum(scores.values()) / len(scores)
                else:
                    aggregate_scores[doc_content] = 0.5
            
            # Sort documents by aggregate score
            sorted_docs = []
            for doc in documents:
                score = aggregate_scores.get(doc.page_content, 0.5)
                sorted_docs.append((doc, score))
            
            sorted_docs.sort(key=lambda x: x[1], reverse=True)
            
            # Take top documents
            reranked_docs = [doc for doc, _ in sorted_docs[:5]]
            
            return {
                **state,
                "reranked_results": reranked_docs
            }
        
        def extract_context(state: State) -> State:
            """Extract the most relevant parts of documents using LLM"""
            query = state["query"]
            documents = state.get("reranked_results", [])
            
            if not documents:
                return {**state, "extracted_context": ""}
            
            # Concatenate all document content
            all_content = "\n\n---\n\n".join(doc.page_content for doc in documents)
            
            # Create the prompt for context extraction
            prompt = ChatPromptTemplate.from_messages([
                ("system", (
                    "You are an expert at extracting the most relevant information from documents "
                    "to answer specific queries. Focus only on information that directly relates to the query."
                )),
                ("human", (
                    "Query: {query}\n\n"
                    "Documents:\n{documents}\n\n"
                    "Extract only the most relevant information from these documents to answer the query. "
                    "Focus on key facts, definitions, and direct answers. "
                    "Limit your response to 500 words maximum."
                ))
            ])
            
            # Chain: Prompt -> LLM -> Output Parser
            chain = (
                prompt 
                | self.llm
                | StrOutputParser()
            )
            
            # Extract context
            try:
                extracted = chain.invoke({
                    "query": query,
                    "documents": all_content
                })
                
                return {
                    **state,
                    "extracted_context": extracted
                }
            except Exception as e:
                if self.verbose:
                    print(f"Error during context extraction: {e}")
                return {
                    **state,
                    "extracted_context": all_content[:2000]  # Fallback to truncated content
                }
        
        def optimize_prompt(state: State) -> State:
            """Optimize the prompt based on the query complexity and context"""
            query = state["query"]
            context = state.get("extracted_context", "")
            attempt = state.get("attempts", 0)
            
            # Choose template based on attempt number (for variety)
            templates = [
                "Context:\n{context}\n\nQuestion: {query}\n\nAnswer:",
                "Based on the following context:\n{context}\n\nPlease answer: {query}",
                "Given this information:\n{context}\n\nRespond to: {query}"
            ]
            
            template_idx = attempt % len(templates)
            base_template = templates[template_idx]
            
            # Decide if we need to add any specific instructions based on query type
            if "compare" in query.lower() or "difference" in query.lower():
                # Add comparative analysis instruction
                base_template += " Provide a clear comparison highlighting similarities and differences."
            elif "list" in query.lower() or "what are" in query.lower():
                # Add list instruction
                base_template += " Provide a comprehensive list with brief explanations."
            elif "how" in query.lower():
                # Add step-by-step instruction
                base_template += " Provide a clear step-by-step explanation."
            elif "why" in query.lower():
                # Add reasoning instruction
                base_template += " Explain the reasoning thoroughly."
            
            # Format the prompt
            prompt = base_template.format(
                context=context,
                query=query
            )
            
            return {
                **state,
                "optimized_prompt": prompt,
                "attempts": attempt + 1
            }
        
        def generate_answer(state: State) -> State:
            """Generate an answer using the optimized prompt"""
            prompt = state.get("optimized_prompt", "")
            
            if not prompt:
                return {**state, "answer": "Failed to generate a prompt to answer the query."}
            
            try:
                # Use the prompt directly with the LLM
                answer = self.llm.invoke(prompt)
                
                return {
                    **state,
                    "answer": answer.content
                }
            except Exception as e:
                if self.verbose:
                    print(f"Error generating answer: {e}")
                return {
                    **state,
                    "answer": "An error occurred while generating the answer."
                }
        
        def check_answer_quality(state: State) -> Union[Dict[str, Any], str]:
            """Check the quality of the answer and decide whether to retry"""
            answer = state.get("answer", "")
            attempts = state.get("attempts", 0)
            
            # If no answer or error message
            if not answer or "error occurred" in answer.lower():
                if attempts < self.max_prompt_attempts:
                    return "optimize_prompt"
                else:
                    return END
            
            # Check for minimum length
            if len(answer.split()) < 20:
                if attempts < self.max_prompt_attempts:
                    return "optimize_prompt"
                else:
                    return END
            
            # If answer seems good enough or max attempts reached
            return END
        
        # Define the workflow using LangGraph
        builder = graph.StateGraph(State)
        
        # Add nodes
        builder.add_node("generate_query_variations", generate_query_variations)
        builder.add_node("retrieve_vector_documents", retrieve_vector_documents)
        builder.add_node("retrieve_keyword_documents", retrieve_keyword_documents)
        builder.add_node("combine_results", combine_results)
        builder.add_node("rerank_documents", rerank_documents)
        builder.add_node("extract_context", extract_context)
        builder.add_node("optimize_prompt", optimize_prompt)
        builder.add_node("generate_answer", generate_answer)
        
        # Add edges
        builder.add_edge("generate_query_variations", "retrieve_vector_documents")
        builder.add_edge("generate_query_variations", "retrieve_keyword_documents")
        builder.add_edge("retrieve_vector_documents", "combine_results")
        builder.add_edge("retrieve_keyword_documents", "combine_results")
        builder.add_edge("combine_results", "rerank_documents")
        builder.add_edge("rerank_documents", "extract_context")
        builder.add_edge("extract_context", "optimize_prompt")
        builder.add_edge("optimize_prompt", "generate_answer")
        
        # Add conditional edge
        builder.add_conditional_edges(
            "generate_answer",
            check_answer_quality,
            {
                "optimize_prompt": "optimize_prompt",
                END: END
            }
        )
        
        # Set entry point
        builder.set_entry_point("generate_query_variations")
        
        # Compile the graph
        self.rag_workflow = builder.compile()

# Example usage
if __name__ == "__main__":
    import argparse
    import os
    
    parser = argparse.ArgumentParser(description="Advanced RAPTOR RAG Implementation")
    parser.add_argument("--documents", type=str, required=True, help="Path to documents")
    parser.add_argument("--llm-model", type=str, default="gpt-3.5-turbo", help="LLM model name")
    
    args = parser.parse_args()
    
    # Check if OpenAI API key is set
    if "OPENAI_API_KEY" not in os.environ and "gpt" in args.llm_model.lower():
        api_key = input("Enter your OpenAI API key: ")
        os.environ["OPENAI_API_KEY"] = api_key
    
    # Create RAPTOR RAG instance
    rag = RaptorAdvancedRAG(
        embedding_model_name="sentence-transformers/all-MiniLM-L6-v2",
        llm_model_name=args.llm_model,
        vector_store_type="chroma",
        reranking_methods=["llm", "keyword", "relevance"],
        use_multi_query=True,
        use_bm25=True,
        verbose=True
    )
    
    # Process documents
    print(f"Processing documents from {args.documents}...")
    rag.process_documents(args.documents)
    print("Document processing complete.")
    
    # Interactive query loop
    print("\nEnter queries, or 'quit' to exit:")
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
            print(f"Error generating response: {e}")