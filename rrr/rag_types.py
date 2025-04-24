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
    
class RefeedRAG(BaseRAG):
    def __init__(self, 
                 document_loader=None,
                 chunker=None,
                 embedding_generator=None,
                 vector_store=None,
                 search_algorithm=None,
                 generator=None,
                 reranking_model=None,  # Make reranking_model optional
                 refeed_iterations: int = 2,
                 refeed_enrichment_factor: float = 0.3,
                 refeed_query_reformulation: bool = True,
                 max_refeed_docs: int = 10,
                 **kwargs):
        # Filter out any unexpected kwargs before passing to BaseRAG
        base_kwargs = {
            'document_loader': document_loader,
            'chunker': chunker,
            'embedding_generator': embedding_generator,
            'vector_store': vector_store,
            'search_algorithm': search_algorithm,
            'generator': generator
        }
        super().__init__(**base_kwargs)
        self.reranking_model = reranking_model
        self.refeed_iterations = refeed_iterations
        self.refeed_enrichment_factor = refeed_enrichment_factor
        self.refeed_query_reformulation = refeed_query_reformulation
        self.max_refeed_docs = max_refeed_docs
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """RefeedRAG document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def _reformulate_query(self, original_query: str, retrieved_docs: List[str]) -> str:
        """Reformulate the query based on retrieved documents"""
        if not self.refeed_query_reformulation:
            return original_query
            
        context = "\n".join(retrieved_docs[:3])  # Use top 3 docs for reformulation
        prompt = f"""
        Original query: {original_query}
        
        Context from retrieved documents:
        {context}
        
        Based on this context, reformulate the original query to be more specific and focused on retrieving relevant information:
        """
        
        try:
            reformulated_query = self.generator(prompt, max_length=100)[0]["generated_text"]
            # Ensure we have a reformulated query that's not too long
            if len(reformulated_query.split()) > 3 and len(reformulated_query) < 300:
                return reformulated_query
            return original_query
        except Exception as e:
            print(f"Query reformulation failed: {e}")
            return original_query

    def _refeed_retrieval(self, query: str, initial_docs: List[str]) -> List[str]:
        """Perform iterative retrieval with refeed mechanism"""
        current_docs = initial_docs
        current_query = query
        
        for iteration in range(self.refeed_iterations):
            # Reformulate query based on current documents
            current_query = self._reformulate_query(current_query, current_docs)
            
            # Get new documents based on reformulated query
            new_docs = self.vector_store.search(current_query)
            
            if not new_docs:
                break
                
            # Combine previous and new documents, removing duplicates
            combined_docs = current_docs.copy()
            for doc in new_docs:
                if doc not in combined_docs:
                    combined_docs.append(doc)
            
            # Rerank the combined documents if reranking_model is available
            if self.reranking_model:
                try:
                    ranked_results = self.reranking_model.rerank_passages(query, combined_docs)
                    current_docs = [result["passage"] for result in ranked_results[:self.max_refeed_docs]]
                except Exception as e:
                    print(f"Reranking failed in refeed iteration {iteration}: {e}")
                    # If reranking fails, just keep the top docs from combined set
                    current_docs = combined_docs[:self.max_refeed_docs]
            else:
                # No reranking model available, use original order
                current_docs = combined_docs[:self.max_refeed_docs]
                
            # Enrich with some random docs from the combined set to avoid echo chamber
            if len(combined_docs) > len(current_docs):
                import random
                num_random = int(len(current_docs) * self.refeed_enrichment_factor)
                remaining_docs = [d for d in combined_docs if d not in current_docs]
                random_docs = random.sample(remaining_docs, min(num_random, len(remaining_docs)))
                current_docs.extend(random_docs)
        
        return current_docs

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """RefeedRAG response generation with iterative retrieval"""
        # Initial retrieval
        initial_docs = self.vector_store.search(query)
        
        if not initial_docs:
            return "No relevant documents found to answer the query."

        # Apply initial reranking if reranking_model is available
        if self.reranking_model:
            try:
                ranked_results = self.reranking_model.rerank_passages(query, initial_docs)
                initial_ranked_docs = [result["passage"] for result in ranked_results]
            except Exception as e:
                print(f"Initial reranking failed, using original order: {e}")
                initial_ranked_docs = initial_docs
        else:
            # No reranking model available, use original order
            initial_ranked_docs = initial_docs

        # Perform refeed retrieval process
        final_docs = self._refeed_retrieval(query, initial_ranked_docs)
        
        # Join the final context
        context = "\n".join(final_docs)

        # Create the prompt and generate response
        prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
        
        response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
        return response
    

class SelfReflectiveRAG(BaseRAG):
    def __init__(
        self, 
        document_loader=None,
        chunker=None,
        embedding_generator=None,
        vector_store=None,
        search_algorithm=None,
        generator=None,
        relevance_threshold: float = 0.5,
        max_iterations: int = 3,
        **kwargs
    ):
        # Filter out unexpected kwargs before passing to BaseRAG
        base_kwargs = {
            'document_loader': document_loader,
            'chunker': chunker,
            'embedding_generator': embedding_generator,
            'vector_store': vector_store,
            'search_algorithm': search_algorithm,
            'generator': generator
        }
        super().__init__(**base_kwargs)
        
        self.relevance_threshold = relevance_threshold
        self.max_iterations = max_iterations
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """Process documents for the self-reflective RAG"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def retrieve(self, query: str) -> List[str]:
        """Retrieve documents based on the query"""
        return self.vector_store.search(query)

    def grade(self, query: str, documents: List[str]) -> List[Tuple[str, float]]:
        """Grade the retrieved documents using a more reliable method"""
        try:
            # Simple but effective grading approach using TF-IDF concepts
            graded_docs = []
            query_terms = [term.lower() for term in query.split() if len(term) > 2]
            
            for doc in documents:
                # Count term frequency in the document
                term_matches = 0
                doc_lower = doc.lower()
                
                for term in query_terms:
                    if term in doc_lower:
                        term_matches += doc_lower.count(term)
                
                # Calculate a relevance score
                if query_terms:
                    # Base score on percentage of query terms present
                    terms_present = sum(1 for term in query_terms if term in doc_lower)
                    coverage_score = terms_present / len(query_terms)
                    
                    # Include term frequency as a factor
                    frequency_factor = min(1.0, term_matches / (len(query_terms) * 2))
                    
                    # Combined score
                    score = (coverage_score * 0.7) + (frequency_factor * 0.3)
                else:
                    score = 0.0
                    
                graded_docs.append((doc, score))
            
            # Sort by relevance score (highest first)
            return sorted(graded_docs, key=lambda x: x[1], reverse=True)
            
        except Exception as e:
            print(f"Warning: Error in document grading: {str(e)}")
            # Fallback to simple scoring
            return [(doc, 0.5) for doc in documents]  # Neutral scores

    def are_docs_relevant(self, graded_docs: List[Tuple[str, float]]) -> bool:
        """Determine if the documents are relevant enough"""
        if not graded_docs:
            return False
            
        # Check if any document exceeds the relevance threshold
        has_relevant_docs = any(score >= self.relevance_threshold for _, score in graded_docs)
        
        # If we have multiple results with decent scores, consider them relevant
        if len(graded_docs) >= 3 and all(score >= 0.3 for _, score in graded_docs[:3]):
            return True
            
        return has_relevant_docs

    def rewrite_query(self, original_query: str, graded_docs: List[Tuple[str, float]]) -> str:
        """Rewrite the query based on retrieved documents"""
        # Create context from graded documents
        context = "\n\n".join([
            f"Document: {doc[:200]}..." 
            for doc, _ in graded_docs[:3]  # Only use top 3 docs for context
        ])
        
        # Create prompt for query rewriting
        prompt = f"""
        Original query: {original_query}
        
        The following documents were retrieved but seem to be only partially relevant:
        {context}
        
        Based on these results, rewrite the query to better target relevant information.
        Important: If the query seems appropriate but the documents don't contain the information,
        respond with EXACTLY: "NO_REWRITE: The information may not be in the document collection."
        
        New query:
        """
        
        # Generate rewritten query
        try:
            response = self.generator(prompt, max_length=100)[0]["generated_text"]
            
            # Check for the special NO_REWRITE case
            if "NO_REWRITE:" in response:
                print("Information likely not in documents - stopping query rewrites")
                return "NO_REWRITE"
                
            # Clean up the response to extract just the query
            rewritten_query = response.strip()
            
            # If the rewritten query is too long, too short, or too similar, fall back to original
            if (len(rewritten_query) < 10 or 
                len(rewritten_query) > 300 or 
                rewritten_query.lower() == original_query.lower()):
                return original_query
                
            return rewritten_query
            
        except Exception as e:
            print(f"Query rewriting failed: {str(e)}")
            return original_query

    def generate_output(self, query: str, relevant_docs: List[Tuple[str, float]], max_length: int) -> str:
        """Generate the final output using relevant documents"""
        try:
            # Extract just the documents from the graded pairs
            docs = [doc for doc, _ in relevant_docs[:5]]  # Use top 5 relevant docs
            
            # Create context from documents
            context = "\n\n".join(docs)
            
            # Create prompt for response generation
            prompt = f"""
            Question: {query}
            
            Context information:
            {context}
            
            Based only on the context information provided, answer the question thoroughly.
            If the context doesn't contain information to answer the question completely, 
            only provide what can be answered from the context and mention that some information may be missing.
            """
            
            # Generate and return response
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            return response
            
        except Exception as e:
            print(f"Error generating output: {str(e)}")
            
            # Fallback to simple response with documents
            fallback_response = f"Here's what I found about '{query}':\n\n"
            for i, (doc, _) in enumerate(relevant_docs[:3]):
                fallback_response += f"Document {i+1}:\n{doc}\n\n"
            
            return fallback_response

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Main method implementing the self-reflective RAG architecture"""
        current_query = query
        
        # First attempt - try with original query
        print(f"Initial query: '{current_query}'")
        retrieved_docs = self.retrieve(current_query)
        
        # If no documents were found on first try
        if not retrieved_docs:
            print("No documents found with initial query")
            rewritten_query = self.rewrite_query(current_query, [])
            if rewritten_query == "NO_REWRITE":
                return "I couldn't find information about this topic in the documents."
            
            current_query = rewritten_query
            retrieved_docs = self.retrieve(current_query)
            if not retrieved_docs:
                return "No relevant documents were found to answer your question."
        
        # Grade initial documents
        graded_docs = self.grade(query, retrieved_docs)
        print(f"Found {len(graded_docs)} documents")
        
        # If documents are good enough on first try, answer immediately
        if self.are_docs_relevant(graded_docs):
            print("Documents are relevant - generating answer directly")
            return self.generate_output(query, graded_docs, max_length)
        
        # Otherwise, try the iterative approach
        for iteration in range(1, self.max_iterations):
            print(f"Documents not relevant enough - iteration {iteration+1}")
            
            # Rewrite query
            rewritten_query = self.rewrite_query(current_query, graded_docs)
            
            # Check for special stop case
            if rewritten_query == "NO_REWRITE":
                print("LLM indicates information is not in documents")
                # Use the best documents we have
                return self.generate_output(query, graded_docs, max_length)
                
            if rewritten_query == current_query:
                print("Query unchanged - stopping iterations")
                break
                
            current_query = rewritten_query
            print(f"Rewritten query: '{current_query}'")
            
            # Retrieve with new query
            new_docs = self.retrieve(current_query)
            if not new_docs:
                continue
                
            # Grade new documents
            graded_docs = self.grade(query, new_docs)
            print(f"Found {len(graded_docs)} documents")
            
            # If good enough, generate output
            if self.are_docs_relevant(graded_docs):
                print("Found relevant documents")
                return self.generate_output(query, graded_docs, max_length)
        
        # Use best documents found so far for final attempt
        print("Using best documents found for answer generation")
        return self.generate_output(query, graded_docs, max_length)


class FusionRAG(BaseRAG):
    def __init__(
        self,
        document_loader=None,
        chunker=None,
        embedding_generator=None,
        vector_store=None,
        search_algorithm=None,
        generator=None,
        num_similar_queries: int = 2,
        fusion_k: int = 60,
        num_results: int = 3,
        **kwargs
    ):
        # Filter out unexpected kwargs before passing to BaseRAG
        base_kwargs = {
            'document_loader': document_loader,
            'chunker': chunker,
            'embedding_generator': embedding_generator,
            'vector_store': vector_store,
            'search_algorithm': search_algorithm,
            'generator': generator
        }
        super().__init__(**base_kwargs)
        
        self.num_similar_queries = num_similar_queries
        self.fusion_k = fusion_k
        self.num_results = num_results
        self.embeddings = None

    def process_documents(self, zip_path: str) -> List[Any]:
        """Process documents for the fusion RAG"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def generate_similar_queries(self, query: str) -> List[str]:
        """Generate simple variations of the query"""
        # Clean up the original query
        query = query.lower().strip()
        
        # Extract the main topic
        topic = query
        for prefix in ["what are", "what is", "the", "main", "list"]:
            topic = topic.replace(prefix, "")
        topic = topic.strip()
        
        # Simple variations using query terms
        words = topic.split()
        
        # Create variations by combining terms differently
        variations = []
        if len(words) > 1:
            variations.append(' '.join(words[::-1]))  # Reverse word order
        
        # Add general query variations
        variations.extend([
            f"methods {topic}",
            f"{topic} techniques"
        ])
        
        # Deduplicate and remove empty queries
        result = []
        seen = set([query])
        for var in variations:
            var = var.strip()
            if var and var.lower() not in seen and len(var) > 3:
                result.append(var)
                seen.add(var.lower())
        
        # Return the needed number of variations
        return result[:self.num_similar_queries]

    def format_search_results(self, documents: List[str], query_id: int) -> List[Dict]:
        """Format search results with document IDs for fusion"""
        formatted_results = []
        
        for i, doc in enumerate(documents):
            # Use simple integer hash
            doc_id = str(abs(hash(doc)) % 10000000)
            
            formatted_results.append({
                "id": doc_id,
                "content": doc,
                "query_id": query_id,
                "rank": i + 1
            })
        
        return formatted_results

    def reciprocal_rank_fusion(self, results_lists: List[List[Dict]]) -> List[Dict]:
        """Simplified Reciprocal Rank Fusion"""
        doc_scores = {}
        doc_content = {}
        
        for results in results_lists:
            for doc in results:
                doc_id = doc["id"]
                rank = doc["rank"]
                
                # RRF formula: 1 / (rank + k)
                score = 1 / (rank + self.fusion_k)
                doc_scores[doc_id] = doc_scores.get(doc_id, 0) + score
                
                if doc_id not in doc_content:
                    doc_content[doc_id] = doc["content"]
        
        # Sort and create result list
        fused_results = []
        for doc_id, score in sorted(doc_scores.items(), key=lambda x: x[1], reverse=True):
            fused_results.append({
                "id": doc_id,
                "content": doc_content[doc_id],
                "score": score
            })
        
        return fused_results

    def extract_methods_from_text(self, text: str) -> List[str]:
        """Extract method names from text using regex patterns"""
        methods = []
        
        # Look for numbered lists (e.g., "1. Regression Analysis")
        import re
        
        # Pattern 1: Numbered lists (1. Method name)
        numbered_pattern = r'\d+\.\s*([^.]+)'
        numbered_items = re.findall(numbered_pattern, text)
        if numbered_items:
            methods.extend([item.strip() for item in numbered_items if len(item.strip()) > 3])
        
        # Pattern 2: Bullet points (• Method name or - Method name)
        bullet_pattern = r'[•\-*]\s*([^.]+)'
        bullet_items = re.findall(bullet_pattern, text)
        if bullet_items:
            methods.extend([item.strip() for item in bullet_items if len(item.strip()) > 3])
        
        # Pattern 3: "such as" or "including" followed by a list
        such_as_pattern = r'(?:such as|including|like)[: ]([^.]+)'
        such_as_matches = re.findall(such_as_pattern, text.lower())
        
        for match in such_as_matches:
            # Split by commas and "and"
            items = re.split(r',|\sand\s', match)
            methods.extend([item.strip() for item in items if len(item.strip()) > 3])
        
        # Pattern 4: Sentences with specific method terms
        if not methods:
            method_terms = ["regression", "classification", "clustering", "neural network", 
                           "machine learning", "deep learning", "decision tree", "random forest",
                           "support vector", "k-means", "naive bayes", "dimensionality reduction"]
            
            sentences = [s.strip() for s in text.split('.') if s.strip()]
            for sentence in sentences:
                sentence_lower = sentence.lower()
                if any(term in sentence_lower for term in method_terms):
                    # If the sentence is too long, try to extract just the relevant part
                    if len(sentence) > 100:
                        for term in method_terms:
                            if term in sentence_lower:
                                term_index = sentence_lower.find(term)
                                # Extract a reasonable window around the term
                                start = max(0, term_index - 20)
                                end = min(len(sentence), term_index + len(term) + 20)
                                methods.append(sentence[start:end].strip())
                    else:
                        methods.append(sentence)
        
        return methods

    def clean_and_format_methods(self, methods: List[str]) -> str:
        """Clean and format a list of methods"""
        # Clean up each method
        cleaned_methods = []
        seen_methods = set()
        
        for method in methods:
            # Basic cleaning
            cleaned = method.strip()
            
            # Skip empty or very short items
            if len(cleaned) < 3:
                continue
                
            # Skip if we've seen this before (case-insensitive)
            if cleaned.lower() in seen_methods:
                continue
                
            cleaned_methods.append(cleaned)
            seen_methods.add(cleaned.lower())
        
        # Format as a numbered list
        if cleaned_methods:
            return "\n".join([f"{i+1}. {method}" for i, method in enumerate(cleaned_methods)])
        return ""

    def find_relevant_section(self, text: str, query_terms: List[str]) -> str:
        """Find the most relevant section of text based on query terms"""
        # Split text into paragraphs
        paragraphs = text.split('\n\n')
        
        # Score each paragraph based on query term frequency
        scored_paragraphs = []
        for para in paragraphs:
            para = para.strip()
            if len(para) < 10:  # Skip very short paragraphs
                continue
                
            score = 0
            para_lower = para.lower()
            for term in query_terms:
                if term in para_lower:
                    score += para_lower.count(term)
                    
            scored_paragraphs.append((para, score))
            
        # Sort by score
        scored_paragraphs.sort(key=lambda x: x[1], reverse=True)
        
        # Return top paragraph if we found any
        if scored_paragraphs and scored_paragraphs[0][1] > 0:
            return scored_paragraphs[0][0]
            
        # If no good match, return the first paragraph
        return text.split('\n\n')[0] if text else ""

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Generate response with more flexible extraction"""
        try:
            print(f"Original query: '{query}'")
            
            # First, check if this is a methods/techniques query
            query_lower = query.lower()
            
            # Extract important terms from the query
            query_terms = query_lower.split()
            query_terms = [term for term in query_terms if len(term) > 3]
            
            is_methods_query = any(term in query_lower for term in ["method", "technique", "approach", "algorithm"])
            
            if not is_methods_query:
                # For non-method queries, use standard retrieval
                results = self.vector_store.search(query)
                if not results:
                    return "No relevant documents found to answer the query."
                    
                context = "\n\n".join(results[:2])
                prompt = f"Question: {query}\n\nBased on this information:\n{context}\n\nAnswer:"
                response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
                return response.strip()
            
            # For method queries, use the fusion approach
            similar_queries = self.generate_similar_queries(query)
            print(f"Generated {len(similar_queries)} similar queries")
            
            # Add original query to the list
            all_queries = [query] + similar_queries
            
            # Get search results for all queries
            all_results = []
            
            for i, q in enumerate(all_queries):
                if i > 0:
                    print(f"Alternative query {i}: '{q}'")
                    
                results = self.vector_store.search(q)
                
                if results:
                    formatted_results = self.format_search_results(results, i)
                    all_results.append(formatted_results)
            
            if not all_results:
                return "No relevant documents found to answer the query."
            
            # Perform reciprocal rank fusion
            fused_results = self.reciprocal_rank_fusion(all_results)
            
            # Get statistics about fusion
            total_results = sum(len(r) for r in all_results)
            unique_docs = len(fused_results)
            print(f"Fused {total_results} total results into {unique_docs} unique documents")
            
            # Get top results
            top_results = fused_results[:self.num_results]
            
            # Direct method extraction approach
            all_methods = []
            for result in top_results:
                content = result["content"]
                methods = self.extract_methods_from_text(content)
                all_methods.extend(methods)
            
            # Clean and format the methods
            formatted_methods = self.clean_and_format_methods(all_methods)
            
            if formatted_methods:
                return f"Based on the documents, here are the data science methods:\n\n{formatted_methods}"
            
            # If direct extraction didn't work, try using the generator
            # But with a very specific prompt
            
            # First, find the most relevant parts of each document
            relevant_parts = []
            for result in top_results:
                content = result["content"]
                relevant_section = self.find_relevant_section(content, query_terms + ["method", "technique"])
                if relevant_section:
                    relevant_parts.append(relevant_section)
            
            # Combine the relevant parts
            combined_content = "\n\n".join(relevant_parts)
            
            # Limit content length to avoid token issues
            if len(combined_content) > 2000:
                combined_content = combined_content[:2000]
            
            prompt = f"""
            Question: {query}
            
            Content from documents:
            {combined_content}
            
            Extract and list ONLY the specific data science methods or techniques mentioned in the documents.
            Format your answer as a numbered list. Do not add any methods that aren't mentioned in the documents.
            """
            
            response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
            
            # Check if the response looks like a good list of methods
            # If it has numbered items, it's probably a good response
            if any(str(i) + "." in response for i in range(1, 10)):
                return response.strip()
            
            # Final fallback - just use the most relevant document content
            for result in top_results:
                content = result["content"]
                if "method" in content.lower() or "technique" in content.lower():
                    # Find paragraphs that mention methods
                    paragraphs = content.split('\n\n')
                    for para in paragraphs:
                        para_lower = para.lower()
                        if "method" in para_lower or "technique" in para_lower:
                            # Turn this paragraph into a list
                            sentences = [s.strip() for s in para.split('.') if s.strip()]
                            formatted = "\n\n".join(sentences[:3])  # Use first 3 sentences
                            
                            prompt = f"""
                            Based on this information:
                            {formatted}
                            
                            Create a numbered list of data science methods mentioned.
                            """
                            
                            list_response = self.generator(prompt, max_length=200)[0]["generated_text"]
                            
                            if any(str(i) + "." in list_response for i in range(1, 10)):
                                return list_response.strip()
            
            # Ultimate fallback
            return "Based on the documents, I couldn't extract a clear list of data science methods. Please try a more specific query."
            
        except Exception as e:
            print(f"Error in generate_response: {str(e)}")
            return "I encountered an error processing your query. Please try again with a different question."
            
    def retrieve(self, query: str) -> List[str]:
        """Retrieve documents based on the query"""
        return self.vector_store.search(query)


from typing import List, Any

class SpeculativeRAG(BaseRAG):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.embeddings = None
        
    def process_documents(self, zip_path: str) -> List[Any]:
        """Process documents for the RAG system"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents
        
    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Generate a response using the parent implementation"""
        # Get the parent response first
        try:
            # Use BaseRAG implementation directly
            answer = super().generate_response(query, max_length)
            
            # If we got a string response, return it
            if isinstance(answer, str) and answer and "No specific information found" not in answer:
                return answer
        except Exception:
            pass  # Continue to fallback if parent implementation fails
            
        # Fallback: Retrieve documents directly and construct response
        docs = self.vector_store.search(query)
        if not docs:
            return "No relevant information found for this query."
            
        # For simple "what is" queries, extract definitions
        if "what is" in query.lower() or "define" in query.lower():
            # Extract the query subject
            subject = query.lower().replace("what is", "").replace("define", "").strip()
            
            # Find paragraphs defining the subject
            for doc in docs:
                if subject in doc.lower():
                    # Extract the first paragraph that contains the subject
                    paragraphs = doc.split("\n\n")
                    for paragraph in paragraphs:
                        if subject in paragraph.lower() and len(paragraph) > 50:
                            # Remove any author/date information
                            if "Author:" in paragraph or "Created:" in paragraph:
                                continue
                            return paragraph.strip()
            
        # For other queries, return the most relevant document part
        most_relevant = docs[0]
        
        # Remove document metadata if present
        if "Document Properties:" in most_relevant:
            # Get content after the metadata section
            parts = most_relevant.split("Document Properties:")
            if len(parts) > 1 and "\n\n" in parts[1]:
                most_relevant = parts[1].split("\n\n", 1)[1]
        
        # Remove author information if present
        if "Author:" in most_relevant:
            lines = most_relevant.split("\n")
            filtered_lines = [line for line in lines if not (
                line.startswith("Author:") or 
                line.startswith("Created:") or 
                line.startswith("Modified:")
            )]
            most_relevant = "\n".join(filtered_lines)
        
        # Extract only paragraphs directly relevant to the query
        paragraphs = most_relevant.split("\n\n")
        query_keywords = query.lower().replace("?", "").replace(".", "").split()
        
        # Filter out common words to focus on key terms
        stop_words = ["what", "are", "is", "the", "in", "of", "and", "for", "to", "a", "on"]
        key_terms = [word for word in query_keywords if word not in stop_words]
        
        # Find paragraphs that contain the key query terms
        relevant_paragraphs = []
        for paragraph in paragraphs:
            # Skip paragraphs with section headers or non-content
            if not paragraph.strip() or "202" in paragraph or len(paragraph) < 30:
                continue
                
            # Check if paragraph contains any key terms from query
            paragraph_lower = paragraph.lower()
            match_score = sum(1 for term in key_terms if term in paragraph_lower)
            
            # Only include highly relevant paragraphs
            if match_score >= 1:
                # If this paragraph specifically answers the query, use only this one
                if all(term in paragraph_lower for term in key_terms if len(term) > 3):
                    return paragraph.strip()
                relevant_paragraphs.append((paragraph, match_score))
        
        # Sort paragraphs by relevance score
        relevant_paragraphs.sort(key=lambda x: x[1], reverse=True)
        
        # Return only the most relevant paragraph
        if relevant_paragraphs:
            return relevant_paragraphs[0][0].strip()
        else:
            # Last fallback - just return the first non-empty paragraph
            for paragraph in paragraphs:
                if paragraph.strip():
                    return paragraph.strip()
        
        return "No relevant information could be extracted from the available documents."

        
class AgenticRAG(BaseRAG):
    def __init__(self, 
                 agent_tools=None,
                 max_iterations: int = 4,
                 verbose: bool = False,
                 *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.max_iterations = max_iterations
        self.verbose = verbose
        self.embeddings = None
        self.agent_tools = agent_tools or []
        
    def process_documents(self, zip_path: str) -> List[Any]:
        """AgenticRAG document processing"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        
        # Set up retriever tool for agent if not provided
        if not self.agent_tools:
            retriever_tool = self._create_retriever_tool()
            self.agent_tools = [retriever_tool]
            
        return documents

    def _create_retriever_tool(self):
        """Create a retriever tool for the agent"""
        from transformers.agents import Tool
        
        # Define retriever function
        def retriever_func(query):
            docs = self.vector_store.search(query)
            return "\n".join([f"===== Document {i} =====\n{doc}" for i, doc in enumerate(docs)])
        
        # Create a custom Tool class with all required attributes
        class RetrieverTool(Tool):
            name = "retriever"
            description = "Retrieves documents from the knowledge base that are semantically similar to the input query"
            
            # Define the required inputs attribute
            inputs = {
                "query": {
                    "type": "string", 
                    "description": "The query to retrieve relevant documents for"
                }
            }
            
            # Define the required output_type attribute
            output_type = "string"
            
            def __call__(self, query):
                return retriever_func(query)
        
        return RetrieverTool()

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """AgenticRAG response generation using agent-based retrieval"""
        try:
            from transformers.agents import HfAgent
            
            if not self.agent_tools:
                return "No agent tools available. Please process documents first."
            
            # Create agent with proper configuration
            agent = HfAgent(
                tools=self.agent_tools,
                llm=self.generator,  # Assuming generator is compatible with HfAgent
                verbose=self.verbose
            )
            
            # Create a prompt that instructs the agent to use the retriever tool
            enhanced_query = (
                f"Please answer this question using the retriever tool to find relevant information: {query}"
                f"\n\nMake multiple retriever calls with different query formulations if needed."
                f"\n\nIf you don't find relevant information after several attempts, say so clearly."
            )
            
            # Execute the agent with proper error handling
            try:
                response = agent.run(enhanced_query)
                return response
            except Exception as agent_error:
                if self.verbose:
                    print(f"Agent execution error: {str(agent_error)}")
                
                # Fallback to direct retrieval and response generation
                return self._fallback_response_generation(query, max_length)
                
        except ImportError as e:
            if self.verbose:
                print(f"HfAgent import error: {str(e)}")
            return self._fallback_response_generation(query, max_length)
        except Exception as e:
            error_msg = f"Agent-based retrieval failed: {str(e)}"
            if self.verbose:
                print(error_msg)
            return self._fallback_response_generation(query, max_length)
    
    def _fallback_response_generation(self, query: str, max_length: int) -> str:
        """Fallback method when agent-based retrieval fails"""
        relevant_docs = self.vector_store.search(query)
        
        if not relevant_docs:
            return "No relevant documents found to answer the query."
            
        context = "\n".join(relevant_docs)
        prompt = f"Context: {context}\n\nQuestion: {query}\n\nAnswer:"
        
        try:
            # Handle different generator output formats
            response = self.generator(prompt, max_length=max_length)
            
            if isinstance(response, list) and len(response) > 0:
                if isinstance(response[0], dict) and "generated_text" in response[0]:
                    return response[0]["generated_text"]
                else:
                    return str(response[0])
            elif isinstance(response, dict) and "generated_text" in response:
                return response["generated_text"]
            elif isinstance(response, str):
                return response
            else:
                return "Unable to parse generator response."
                
        except Exception as gen_error:
            if self.verbose:
                print(f"Generator error in fallback: {str(gen_error)}")
            return f"Failed to generate response. Error: {str(gen_error)}"
        

class RealmRAG(BaseRAG):
    def __init__(self, 
                 document_loader=None,
                 chunker=None,
                 embedding_generator=None,
                 vector_store=None,
                 search_algorithm=None,
                 generator=None,
                 max_context_docs: int = 5,
                 max_refinement_steps: int = 2,
                 **kwargs):
        # Filter base kwargs to avoid unexpected argument errors
        base_kwargs = {
            'document_loader': document_loader,
            'chunker': chunker,
            'embedding_generator': embedding_generator,
            'vector_store': vector_store,
            'search_algorithm': search_algorithm,
            'generator': generator
        }
        super().__init__(**base_kwargs)
        
        self.max_context_docs = max_context_docs
        self.max_refinement_steps = max_refinement_steps
        self.embeddings = None
        
        # Domain-specific prefixes for different types of queries
        self.domain_prefixes = {
            "legal": "In the context of legal matters, ",
            "technical": "From a technical perspective, ",
            "medical": "In medical terminology, ",
            "finance": "In financial context, ",
            "general": ""  # Default empty prefix
        }

    def process_documents(self, zip_path: str) -> List[Any]:
        """Process documents for the Realm RAG"""
        documents = self.document_loader.load_zip(zip_path)
        chunks = self.chunker.chunk_documents(documents)
        self.embeddings = self.embedding_generator.generate_embeddings(chunks)
        self.vector_store.store_embeddings(chunks, self.embeddings)
        index = self.search_algorithm.build_index(self.embeddings)
        self.vector_store.index = index
        return documents

    def identify_domain(self, query: str) -> str:
        """Identify the domain of the query"""
        query_lower = query.lower()
        
        domain_keywords = {
            "legal": ["law", "legal", "court", "rights", "litigation", "attorney"],
            "technical": ["code", "software", "hardware", "system", "programming"],
            "medical": ["health", "medical", "disease", "treatment", "diagnosis"],
            "finance": ["money", "finance", "investment", "market", "stock"]
        }
        
        # Check each domain
        for domain, keywords in domain_keywords.items():
            for keyword in keywords:
                if keyword in query_lower:
                    return domain
        
        # Default to general if no match
        return "general"

    def extract_key_terms(self, query: str) -> List[str]:
        """Extract key search terms from the query"""
        # Remove common stop words
        stop_words = ["the", "a", "an", "and", "in", "on", "at", "to", "for", "with", "by", "about"]
        
        # Convert to lowercase and remove punctuation
        query_lower = query.lower()
        for char in ",.?!;:()[]{}\"'":
            query_lower = query_lower.replace(char, ' ')
        
        # Split and filter out stop words and short terms
        words = query_lower.split()
        terms = [word for word in words if word not in stop_words and len(word) >= 3]
        
        # Return unique terms
        return list(set(terms))

    def retrieve_context_documents(self, query: str, additional_terms: List[str] = []) -> List[str]:
        """Retrieve relevant context documents"""
        # First get documents matching the original query
        primary_docs = self.vector_store.search(query)
        all_docs = list(primary_docs)
        
        # Then supplement with documents matching key terms
        if additional_terms:
            for term in additional_terms:
                term_docs = self.vector_store.search(term)
                for doc in term_docs:
                    if doc not in all_docs:
                        all_docs.append(doc)
                        # Limit to max context docs
                        if len(all_docs) >= self.max_context_docs:
                            break
                if len(all_docs) >= self.max_context_docs:
                    break
        
        # Limit to max context docs
        return all_docs[:self.max_context_docs]

    def generate_response(self, query: str, max_length: int = 512) -> str:
        """Main method implementing the Realm RAG architecture"""
        try:
            # Step 1: Context Analysis
            domain = self.identify_domain(query)
            key_terms = self.extract_key_terms(query)
            
            # Step 2: Initial Document Retrieval
            context_docs = self.retrieve_context_documents(query, key_terms)
            
            if not context_docs:
                return "No relevant documents found to answer the query."
            
            # Step 3: Iterative Refinement Process
            context_history = []
            current_query = query
            
            # Apply domain-specific prefix
            domain_prefix = self.domain_prefixes.get(domain, "")
            prefixed_query = domain_prefix + query
            
            # Start with initial context
            context_history.extend(context_docs)
            
            for step in range(self.max_refinement_steps):
                # Format current context
                context = "\n\n---\n\n".join(context_history)
                
                # Limit context size to avoid token issues (if needed)
                if len(context) > 3000:
                    context = context[:3000]
                
                # Generate prompt
                prompt = f"""
                Question: {prefixed_query}
                
                Context information:
                {context}
                
                Based only on the provided context, answer the question directly and thoroughly.
                """
                
                # Generate response
                response = self.generator(prompt, max_length=max_length)[0]["generated_text"]
                
                # Check if we need more context
                follow_up_prompt = f"""
                Original question: '{query}'
                Current answer: '{response}'
                
                Is the answer complete, or should we seek more specific information?
                If complete, respond with 'COMPLETE'.
                If not, what specific information should we look for next?
                """
                
                # Get follow-up query
                refinement_decision = self.generator(follow_up_prompt, max_length=100)[0]["generated_text"]
                
                # If complete or last iteration, return response
                if "COMPLETE" in refinement_decision or step == self.max_refinement_steps - 1:
                    return response.strip()
                
                # Extract follow-up query
                if "should look for" in refinement_decision:
                    follow_up_parts = refinement_decision.split("should look for")
                    if len(follow_up_parts) > 1:
                        next_query = follow_up_parts[1].strip()
                    else:
                        next_query = refinement_decision
                else:
                    next_query = refinement_decision
                
                # Get additional context based on follow-up
                additional_docs = self.vector_store.search(next_query)
                
                # Add new unique docs to context history
                for doc in additional_docs:
                    if doc not in context_history:
                        context_history.append(doc)
                
                # Update current query
                current_query = next_query
            
            # Return final response
            return response.strip()
            
        except Exception as e:
            print(f"Error in generate_response: {str(e)}")
            
            # Simple error recovery
            try:
                results = self.vector_store.search(query)
                if results and len(results) > 0:
                    simple_prompt = f"Question: {query}\n\nBased on this: {results[0]}\n\nAnswer:"
                    simple_response = self.generator(simple_prompt, max_length=max_length)[0]["generated_text"]
                    return simple_response.strip()
            except Exception as backup_error:
                print(f"Backup error recovery failed: {str(backup_error)}")
                
            return f"I encountered an error processing your query about '{query}'. Please try a different question."