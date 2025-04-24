from typing import List
import uuid
import os
import chromadb
import weaviate
import faiss
import numpy as np
import pinecone
from sentence_transformers import SentenceTransformer
from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec
import pickle


class WeaviateStore:
    def __init__(self, embedding_model: str, persist_directory: str = "./weaviate_data"):
        """Initialize Weaviate vector store with persistence"""
        self.embedding_model = embedding_model
        self.persist_directory = persist_directory
        
        # Create persist directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        # Configure weaviate with local persistence
        weaviate_url = "http://localhost:8080"
        
        # Connect to Weaviate with explicit persistence configuration
        self.client = weaviate.Client(
            url=weaviate_url,
            additional_headers={
                "X-Weaviate-Persist-Data-Path": self.persist_directory
            }
        )
        
        # Check if we have a stored class name
        class_name_file = os.path.join(persist_directory, "class_name.txt")
        if os.path.exists(class_name_file):
            with open(class_name_file, 'r') as f:
                self.class_name = f.read().strip()
        else:
            self.class_name = f"Document_{uuid.uuid4().hex[:8]}"
            with open(class_name_file, 'w') as f:
                f.write(self.class_name)
        
        # Define schema
        schema = {
            "classes": [
                {
                    "class": self.class_name,
                    "vectorizer": "none",
                    "properties": [
                        {"name": "content", "dataType": ["text"]},
                        {"name": "source", "dataType": ["text"]},
                        {"name": "page_number", "dataType": ["int"]},
                        {"name": "chunk_id", "dataType": ["text"]}
                    ]
                }
            ]
        }
        
        try:
            # Check if class exists before creating
            existing_classes = self.client.schema.get()
            class_exists = any(cls["class"] == self.class_name for cls in existing_classes.get("classes", []))
            
            if not class_exists:
                self.client.schema.create(schema)
                
            # Save configuration details
            config_file = os.path.join(persist_directory, "weaviate_config.pkl")
            with open(config_file, 'wb') as f:
                pickle.dump({
                    'class_name': self.class_name,
                    'embedding_model': self.embedding_model
                }, f)
                
        except Exception as e:
            print(f"Error initializing Weaviate: {str(e)}")
            raise

    def store_embeddings(self, chunks: List[Document], embeddings: List[List[float]]):
        """Store embeddings in Weaviate"""
        try:
            for chunk, embedding in zip(chunks, embeddings):
                
                metadata = chunk.metadata
                data_object = {
                    "content": chunk.page_content,
                    "source": metadata.get('source', ''),
                    "page_number": metadata.get('page_number', 0),
                    "chunk_id": metadata.get('chunk_id', str(uuid.uuid4()))
                }
                
                self.client.data_object.create(
                    data_object=data_object,
                    class_name=self.class_name,
                    vector=embedding
                )
                
            # Keep track of stored chunks count in local file
            count_file = os.path.join(self.persist_directory, "chunk_count.txt")
            count = 0
            if os.path.exists(count_file):
                with open(count_file, 'r') as f:
                    try:
                        count = int(f.read().strip())
                    except:
                        count = 0
            
            count += len(chunks)
            with open(count_file, 'w') as f:
                f.write(str(count))
                
        except Exception as e:
            print(f"Error storing in Weaviate: {str(e)}")
            raise

    def search(self, query: str, top_k: int = 5) -> List[str]:
        """Search documents in Weaviate"""
        try:
            embedding_model = SentenceTransformer(self.embedding_model)
            query_embedding = embedding_model.encode(query).tolist()
            
            result = self.client.query.get(
                self.class_name, 
                ["content", "source", "page_number"]
            ).with_near_vector(
                {"vector": query_embedding}
            ).with_limit(top_k).do()
            
            return [res["content"] for res in result["data"]["Get"][self.class_name]]
        except Exception as e:
            print(f"Error searching Weaviate: {str(e)}")
            return []


class ChromaStore:
    def __init__(self, embedding_model: str, persist_directory: str = "./chroma_db"):
        """Initialize ChromaDB vector store with persistence"""
        self.embedding_model = embedding_model
        self.persist_directory = persist_directory
        
        try:
            # Create persist directory if it doesn't exist
            os.makedirs(persist_directory, exist_ok=True)
            
            # Create a persistent client
            self.client = chromadb.PersistentClient(path=persist_directory)
            
            # Check if collection exists or create a new one
            collection_name_file = os.path.join(persist_directory, "collection_name.txt")
            if os.path.exists(collection_name_file):
                with open(collection_name_file, 'r') as f:
                    collection_name = f.read().strip()
                
                # Try to get the existing collection
                try:
                    self.collection = self.client.get_collection(name=collection_name)
                    print(f"Using existing collection: {collection_name}")
                except Exception:
                    # If collection doesn't exist, create a new one
                    collection_name = f"documents_{uuid.uuid4().hex[:8]}"
                    self.collection = self.client.create_collection(
                        name=collection_name,
                        metadata={"hnsw:space": "cosine"}
                    )
                    # Save the new collection name
                    with open(collection_name_file, 'w') as f:
                        f.write(collection_name)
            else:
                # Create a new collection and save its name
                collection_name = f"documents_{uuid.uuid4().hex[:8]}"
                self.collection = self.client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
                # Create directory if it doesn't exist
                os.makedirs(os.path.dirname(collection_name_file), exist_ok=True)
                # Save the new collection name
                with open(collection_name_file, 'w') as f:
                    f.write(collection_name)
                
            # Save configuration
            config_file = os.path.join(persist_directory, "chroma_config.pkl")
            with open(config_file, 'wb') as f:
                pickle.dump({
                    'collection_name': collection_name,
                    'embedding_model': self.embedding_model
                }, f)
                
        except Exception as e:
            print(f"Error initializing ChromaDB: {str(e)}")
            raise

    def store_embeddings(self, chunks: List[Document], embeddings: List[List[float]]):
        """Store embeddings in ChromaDB"""
        try:
            batch_size = 100
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                batch_embeddings = embeddings[i:i + batch_size]
                
                ids = [str(uuid.uuid4()) for _ in batch_chunks]
                documents = [chunk.page_content for chunk in batch_chunks]
                metadatas = [chunk.metadata for chunk in batch_chunks]
                
                self.collection.add(
                    ids=ids,
                    embeddings=batch_embeddings,
                    documents=documents,
                    metadatas=metadatas
                )
        except Exception as e:
            print(f"Error storing in ChromaDB: {str(e)}")
            raise

    def search(self, query: str, top_k: int = 5) -> List[str]:
        """Search documents in ChromaDB"""
        try:
            embedding_model = SentenceTransformer(self.embedding_model)
            query_embedding = embedding_model.encode(query).tolist()
            
            results = self.collection.query(
                query_embeddings=[query_embedding],
                n_results=top_k
            )
            
            return results['documents'][0]
        except Exception as e:
            print(f"Error searching ChromaDB: {str(e)}")
            return []


class FaissStore:
    def __init__(self, embedding_model: str, persist_directory: str = "./faiss_index"):
        """Initialize FAISS vector store with persistence"""
        self.embedding_model = embedding_model
        self.persist_directory = persist_directory
        self.index_file = os.path.join(persist_directory, "faiss_index.bin")
        self.documents_file = os.path.join(persist_directory, "documents.pkl")
        self.metadata_file = os.path.join(persist_directory, "metadata.pkl")
        
        # Create directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        try:
            self.embedding_model_instance = SentenceTransformer(embedding_model)
            self.dimension = self.embedding_model_instance.get_sentence_embedding_dimension()
            
            # Try to load existing index and documents
            if os.path.exists(self.index_file) and os.path.exists(self.documents_file):
                self.index = faiss.read_index(self.index_file)
                with open(self.documents_file, 'rb') as f:
                    self.documents = pickle.load(f)
                print(f"Loaded existing FAISS index with {len(self.documents)} documents")
            else:
                # Create new index and empty documents list
                self.index = faiss.IndexFlatL2(self.dimension)
                self.documents = []
                print("Created new FAISS index")
                
            # Save configuration
            with open(self.metadata_file, 'wb') as f:
                pickle.dump({
                    'embedding_model': self.embedding_model,
                    'dimension': self.dimension,
                    'document_count': len(getattr(self, 'documents', []))
                }, f)
                
        except Exception as e:
            print(f"Error initializing FAISS: {str(e)}")
            raise

    def store_embeddings(self, chunks: List[Document], embeddings: List[List[float]]):
        """Store embeddings in FAISS and save to disk"""
        try:
            embeddings_array = np.array(embeddings).astype('float32')
            self.index.add(embeddings_array)
            self.documents.extend([chunk.page_content for chunk in chunks])
            
            # Save index and documents to disk
            faiss.write_index(self.index, self.index_file)
            with open(self.documents_file, 'wb') as f:
                pickle.dump(self.documents, f)
                
            # Update metadata
            with open(self.metadata_file, 'wb') as f:
                pickle.dump({
                    'embedding_model': self.embedding_model,
                    'dimension': self.dimension,
                    'document_count': len(self.documents)
                }, f)
                
            print(f"Saved FAISS index with {len(self.documents)} documents to {self.persist_directory}")
        except Exception as e:
            print(f"Error storing in FAISS: {str(e)}")
            raise

    def search(self, query: str, top_k: int = 5) -> List[str]:
        """Search documents in FAISS"""
        try:
            if not hasattr(self, 'embedding_model_instance'):
                self.embedding_model_instance = SentenceTransformer(self.embedding_model)
                
            # Ensure query_embedding is correct shape
            query_embedding = self.embedding_model_instance.encode(query)
            query_embedding = query_embedding.reshape(1, -1).astype('float32')
            
            # Check if index is empty
            if self.index.ntotal == 0:
                print("FAISS index is empty - no documents to search")
                return []
                
            # Perform search
            distances, indices = self.index.search(query_embedding, min(top_k, self.index.ntotal))
            
            # Validate indices to avoid out of range errors
            valid_indices = [i for i in indices[0] if i >= 0 and i < len(self.documents)]
            
            if not valid_indices:
                print("No valid search results found")
                return []
                
            # Return matched documents
            return [self.documents[i] for i in valid_indices]
        except Exception as e:
            print(f"Error searching FAISS: {str(e)}")
            traceback.print_exc()  # Add traceback for debugging
            return []


class PineconeStore:
    def __init__(self, embedding_model: str = "intfloat/e5-large-v2", persist_directory: str = "./pinecone_data"):
        """
        Initialize Pinecone vector store with local persistence
        Note: This implementation emulates Pinecone's behavior with local storage
        """
        self.embedding_model = embedding_model
        self.persist_directory = persist_directory
        self.metadata_file = os.path.join(persist_directory, "pinecone_metadata.pkl")
        self.vectors_file = os.path.join(persist_directory, "pinecone_vectors.pkl")
        
        # Create directory if it doesn't exist
        os.makedirs(persist_directory, exist_ok=True)
        
        try:
            # Initialize with a local storage approach
            self.index_name = "documents-main"
            self.dimension = SentenceTransformer(embedding_model).get_sentence_embedding_dimension()
            
            # Load or create local vector storage
            if os.path.exists(self.vectors_file):
                with open(self.vectors_file, 'rb') as f:
                    self.vectors = pickle.load(f)
                print(f"Loaded {len(self.vectors)} vectors from local storage")
            else:
                self.vectors = []
                print("Created new local vector storage for Pinecone emulation")
            
            # Save metadata
            with open(self.metadata_file, 'wb') as f:
                pickle.dump({
                    'index_name': self.index_name,
                    'dimension': self.dimension,
                    'embedding_model': self.embedding_model,
                    'vector_count': len(self.vectors)
                }, f)
                
            print(f"Successfully initialized local Pinecone emulation at {persist_directory}")
            
        except Exception as e:
            print(f"Error initializing Pinecone local storage: {str(e)}")
            raise

    def store_embeddings(self, chunks: List[Document], embeddings: List[List[float]]):
        """Store embeddings in local Pinecone emulation"""
        try:
            # Create vector entries similar to Pinecone format
            new_vectors = [
                {
                    'id': str(uuid.uuid4()),
                    'values': embedding,
                    'metadata': {
                        'content': chunk.page_content,
                        **chunk.metadata
                    }
                }
                for chunk, embedding in zip(chunks, embeddings)
            ]
            
            # Add to local storage
            self.vectors.extend(new_vectors)
            
            # Save to disk
            with open(self.vectors_file, 'wb') as f:
                pickle.dump(self.vectors, f)
            
            # Update metadata
            with open(self.metadata_file, 'wb') as f:
                pickle.dump({
                    'index_name': self.index_name,
                    'dimension': self.dimension,
                    'embedding_model': self.embedding_model,
                    'vector_count': len(self.vectors)
                }, f)
                
            print(f"Stored {len(chunks)} new vectors in local Pinecone emulation. Total: {len(self.vectors)}")
                
        except Exception as e:
            print(f"Error storing in local Pinecone emulation: {str(e)}")
            raise

    def search(self, query: str, top_k: int = 5) -> List[str]:
        """Search documents in local Pinecone emulation"""
        try:
            embedding_model = SentenceTransformer(self.embedding_model)
            query_embedding = embedding_model.encode(query).tolist()
            
            # Compute cosine similarity manually
            def cosine_similarity(a, b):
                dot_product = sum(x * y for x, y in zip(a, b))
                magnitude_a = sum(x * x for x in a) ** 0.5
                magnitude_b = sum(x * x for x in b) ** 0.5
                return dot_product / (magnitude_a * magnitude_b) if magnitude_a * magnitude_b > 0 else 0
            
            # Calculate similarities and get top_k
            similarities = [(vector, cosine_similarity(query_embedding, vector['values'])) 
                           for vector in self.vectors]
            
            # Sort by similarity (higher is better)
            similarities.sort(key=lambda x: x[1], reverse=True)
            
            # Return top_k document contents
            return [sim[0]['metadata']['content'] for sim in similarities[:top_k]]
            
        except Exception as e:
            print(f"Error searching local Pinecone emulation: {str(e)}")
            return []


class VectorStoreFactory:
    @staticmethod
    def create_store(store_type: str, embedding_model: str, persist_directory: str = None, **kwargs) -> object:
        """Create vector store based on type with persistence"""
        if persist_directory is None:
            # Default persist directory based on store type
            persist_directory = f"./{store_type}_data"
            
        stores = {
            "weaviate": WeaviateStore,
            "chromadb": ChromaStore,
            "faiss": FaissStore,
            "pinecone": PineconeStore
        }
        
        if store_type not in stores:
            raise ValueError(f"Unknown store type: {store_type}")
        
        # Add persist_directory to kwargs
        kwargs["persist_directory"] = persist_directory
            
        return stores[store_type](embedding_model=embedding_model, **kwargs)