from typing import List, Dict, Any
import uuid
import chromadb

import faiss
import numpy as np
import pinecone
from sentence_transformers import SentenceTransformer
from langchain_core.documents import Document
from pinecone import Pinecone, ServerlessSpec
import os
import pickle
import re
from langchain_core.documents import Document

from urllib.parse import urlparse

from dataclasses import dataclass, field
import time

import weaviate
# from weaviate import WeaviateClient
# from weaviate.connect import ConnectionParams
# from weaviate.data import Type


from urllib.parse import urlparse




class WeaviateStore:
    def __init__(self, embedding_model: str, collection_name: str = None, database_name: str = None):
        """Initialize Weaviate vector store"""
        self.embedding_model = embedding_model

        weaviate_url= "http://localhost:8080"
        # if not weaviate_url.startswith(("http://", "https://")):
        #     weaviate_url = "http://" + weaviate_url
        
    
        self.client = weaviate.Client(
            url=weaviate_url
        )
        
        # self.class_name = f"Document_{uuid.uuid4().hex[:8]}"
        self.class_name = f"RAG_{database_name.replace(' ', '_').lower()}_Temp"

        
        
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
            self.client.schema.create(schema)
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
    def __init__(self, embedding_model: str, collection_name: str = None, database_name: str = None, **kwargs):
        """Initialize ChromaDB vector store with persistent storage"""
        self.embedding_model = embedding_model
        
        try:
            # Use PersistentClient to ensure data is saved between sessions
            self.client = chromadb.PersistentClient(path="./chroma_db")
            
            # Generate collection name if not provided
            # if not collection_name:
            #     collection_name = f"rag_{database_name.lower()}_Temp" if database_name else f"documents_{uuid.uuid4().hex[:8]}"
            
            print("Inside chroma store", collection_name)
            
            # Modify collection creation for Chroma v0.6.0
            try:
                # Try to get existing collection
                self.collection = self.client.get_collection(name=collection_name)
            except:
                # If not exists, create new collection
                self.collection = self.client.create_collection(
                    name=collection_name,
                    metadata={"hnsw:space": "cosine"}
                )
            
            # Store the collection name
            self.collection_name = self.collection.name
            
            print(f"ChromaDB Collection Accessed/Created: {self.collection_name}")
        
        except Exception as e:
            print(f"Error initializing ChromaDB: {str(e)}")
            raise

    def store_embeddings(self, chunks, embeddings):
        """Store embeddings in ChromaDB"""
        try:
            # Generate unique IDs for each chunk
            ids = [str(uuid.uuid4()) for _ in chunks]
            
            # Extract document contents and metadata
            documents = [chunk.page_content for chunk in chunks]
            metadatas = [chunk.metadata for chunk in chunks]
            
            # Add embeddings to the collection
            self.collection.add(
                ids=ids,
                embeddings=embeddings,
                documents=documents,
                metadatas=metadatas
            )
            
            print(f"Stored {len(chunks)} documents in collection {self.collection_name}")
        
        except Exception as e:
            print(f"Error storing embeddings: {str(e)}")
            raise

# class FaissStore:
#     def __init__(self, embedding_model: str ):
#         """Initialize FAISS vector store"""
#         self.embedding_model = embedding_model
#         try:
#             self.dimension = SentenceTransformer(embedding_model).get_sentence_embedding_dimension()
#             self.index = faiss.IndexFlatL2(self.dimension)
#             self.documents = []
#         except Exception as e:
#             print(f"Error initializing FAISS: {str(e)}")
#             raise

#     def store_embeddings(self, chunks: List[Document], embeddings: List[List[float]]):
#         """Store embeddings in FAISS"""
#         try:
#             embeddings_array = np.array(embeddings).astype('float32')
#             self.index.add(embeddings_array)
#             self.documents.extend([chunk.page_content for chunk in chunks])
#         except Exception as e:
#             print(f"Error storing in FAISS: {str(e)}")
#             raise

#     def search(self, query: str, top_k: int = 5) -> List[str]:
#         """Search documents in FAISS"""
#         try:
#             embedding_model = SentenceTransformer(self.embedding_model)
#             query_embedding = embedding_model.encode(query).reshape(1, -1).astype('float32')
            
#             distances, indices = self.index.search(query_embedding, top_k)
#             return [self.documents[i] for i in indices[0]]
#         except Exception as e:
#             print(f"Error searching FAISS: {str(e)}")
#             return []




class PineconeStore:
    def __init__(self, embedding_model: str = "google/flan-t5-large", collection_name: str = None, database_name: str = None):
        self.embedding_model = embedding_model
        try:
            self.pc = Pinecone(api_key="pcsk_2sqpR7_FY6XeaGrqY1NikHysefnoj37anCK9fWMZ5rrxPzW3HU5xWUPVgJZSep9sYpdsCw")
            
            # Initialize the sentence transformer first to get dimensions
            self.sentence_transformer = SentenceTransformer(embedding_model)
            self.dimension = self.sentence_transformer.get_sentence_embedding_dimension()
            print(f"Embedding dimension for model {embedding_model}: {self.dimension}")
            
            # First check for existing index with matching dimensions
            existing_indexes = self.pc.list_indexes().names()
            matching_index = self._find_matching_index(existing_indexes)
            
            if matching_index:
                self.index_name = matching_index
                print(f"Using existing index with matching dimension: {self.index_name}")
            else:
                # Prepare sanitized name for new index
                if collection_name:
                    sanitized_name = re.sub(r'[^a-z0-9-]', '-', collection_name.lower())
                    sanitized_name = re.sub(r'-+', '-', sanitized_name.strip('-'))
                    if not sanitized_name[0].isalpha():
                        sanitized_name = f"idx-{sanitized_name}"
                    sanitized_name = sanitized_name[:45]
                else:
                    sanitized_name = f"idx-{uuid.uuid4().hex[:8]}"
                
                # Check if we need to delete an index
                if len(existing_indexes) >= 5:
                    print("Reached index limit. Finding index to delete...")
                    self._handle_index_limit(existing_indexes)
                    # Refresh the list after deletion
                    existing_indexes = self.pc.list_indexes().names()
                
                # Now create the new index
                print(f"Creating new index: {sanitized_name}")
                self.pc.create_index(
                    name=sanitized_name,
                    dimension=self.dimension,
                    metric='cosine',
                    spec=ServerlessSpec(
                        cloud='aws',
                        region='us-east-1'
                    )
                )
                self.index_name = sanitized_name
            
            # Wait for a moment to ensure index is ready
            time.sleep(5)
            self.index = self.pc.Index(self.index_name)
            print(f"Successfully connected to Pinecone index: {self.index_name}")
                
        except Exception as e:
            print(f"Error initializing Pinecone: {str(e)}")
            raise

    def store_embeddings(self, chunks, embeddings):
        """Store embeddings in Pinecone"""
        try:
            # Validate dimensions before processing
            if not embeddings or len(embeddings) == 0:
                raise ValueError("No embeddings provided")
                
            embedding_dim = len(embeddings[0])
            if embedding_dim != self.dimension:
                print(f"Warning: Input embedding dimension ({embedding_dim}) does not match index dimension ({self.dimension})")
                print("Adjusting embeddings to match index dimension...")
                embeddings = [self._adjust_embedding(emb) for emb in embeddings]
            
            # Process in batches
            batch_size = 100
            total_processed = 0
            
            for i in range(0, len(chunks), batch_size):
                batch_chunks = chunks[i:i + batch_size]
                batch_embeddings = embeddings[i:i + batch_size]
                
                vectors = [
                    {
                        'id': str(uuid.uuid4()),
                        'values': emb,
                        'metadata': {
                            'content': chunk.page_content,
                            **chunk.metadata
                        }
                    }
                    for chunk, emb in zip(batch_chunks, batch_embeddings)
                ]
                
                self.index.upsert(vectors=vectors)
                total_processed += len(batch_chunks)
                print(f"Processed batch: {total_processed}/{len(chunks)} documents")
            
            print(f"Successfully stored {total_processed} documents in Pinecone index {self.index_name}")
        
        except Exception as e:
            print(f"Error storing embeddings in Pinecone: {str(e)}")
            raise

    def _handle_index_limit(self, existing_indexes):
        """Handle index limit by deleting the oldest or least used index"""
        try:
            # First try to find a non-matching dimension index to delete
            for index_name in existing_indexes:
                try:
                    index = self.pc.Index(index_name)
                    stats = index.describe_index_stats()
                    if stats.get('dimension') != self.dimension:
                        print(f"Deleting non-matching dimension index: {index_name}")
                        self.pc.delete_index(index_name)
                        # Wait for deletion to complete
                        time.sleep(5)
                        return True
                except Exception as e:
                    print(f"Error checking index {index_name}: {e}")
            
            # If no non-matching index found, delete the oldest one
            oldest_index = self._get_oldest_index(existing_indexes)
            if oldest_index:
                print(f"Deleting oldest index: {oldest_index}")
                self.pc.delete_index(oldest_index)
                # Wait for deletion to complete
                time.sleep(5)
                return True
            
            return False
        except Exception as e:
            print(f"Error handling index limit: {e}")
            return False

    def _find_matching_index(self, existing_indexes):
        """Find an index with matching dimension"""
        for index_name in existing_indexes:
            try:
                index = self.pc.Index(index_name)
                stats = index.describe_index_stats()
                if stats.get('dimension') == self.dimension:
                    print(f"Found matching index with dimension {self.dimension}")
                    return index_name
            except Exception as e:
                print(f"Error checking index {index_name}: {e}")
        return None

    def _get_oldest_index(self, existing_indexes):
        """Get the oldest index based on vector count and last updated"""
        try:
            index_stats = []
            for index_name in existing_indexes:
                try:
                    index = self.pc.Index(index_name)
                    stats = index.describe_index_stats()
                    vector_count = stats.get('total_vector_count', 0)
                    index_stats.append((index_name, vector_count))
                except Exception as e:
                    print(f"Error getting stats for index {index_name}: {e}")
            
            # Sort by vector count (fewer vectors might mean less important/older)
            index_stats.sort(key=lambda x: x[1])
            return index_stats[0][0] if index_stats else None
        
        except Exception as e:
            print(f"Error finding oldest index: {e}")
            return existing_indexes[0] if existing_indexes else None

    def _adjust_embedding(self, embedding):
        """Adjust embedding dimension to match index requirement"""
        current_dim = len(embedding)
        
        if current_dim == self.dimension:
            return embedding
        
        if current_dim < self.dimension:
            # Pad with zeros
            padding = [0.0] * (self.dimension - current_dim)
            adjusted = list(embedding) + padding
            print(f"Padded embedding from {current_dim} to {len(adjusted)} dimensions")
            return adjusted
        
        # Truncate if longer
        adjusted = embedding[:self.dimension]
        print(f"Truncated embedding from {current_dim} to {len(adjusted)} dimensions")
        return adjusted

    def query(self, query_embedding, top_k=5):
        """Query the index for similar documents"""
        try:
            # Adjust query embedding dimension if necessary
            if len(query_embedding) != self.dimension:
                query_embedding = self._adjust_embedding(query_embedding)
            
            results = self.index.query(
                vector=query_embedding,
                top_k=top_k,
                include_metadata=True
            )
            return results
        except Exception as e:
            print(f"Error querying Pinecone: {str(e)}")
            raise






class FaissStore:
    def __init__(self, embedding_model: str, collection_name: str = None, database_name: str = None):
        """Initialize FAISS vector store"""
        self.embedding_model = embedding_model
        try:
            self.dimension = SentenceTransformer(embedding_model).get_sentence_embedding_dimension()
            self.index = faiss.IndexFlatL2(self.dimension)
            self.documents = []
            
            # Use provided collection name or generate a default
            if not collection_name:
                collection_name = f"faiss_index_{uuid.uuid4().hex[:8]}"
            
            self.collection_name = collection_name
            
            # Create directory for FAISS indexes if it doesn't exist
            os.makedirs("./faiss_indexes", exist_ok=True)
            
            print(f"Successfully initialized FAISS index: {self.collection_name}")
        except Exception as e:
            print(f"Error initializing FAISS: {str(e)}")
            raise

    def store_embeddings(self, chunks: List[Document], embeddings: List[List[float]]):
        """Store embeddings in FAISS"""
        try:
            embeddings_array = np.array(embeddings).astype('float32')
            self.index.add(embeddings_array)
            self.documents.extend([chunk.page_content for chunk in chunks])
            
            # Save index and documents
            index_path = f"./faiss_indexes/{self.collection_name}.index"
            docs_path = f"./faiss_indexes/{self.collection_name}_docs.pkl"
            
            faiss.write_index(self.index, index_path)
            with open(docs_path, 'wb') as f:
                pickle.dump(self.documents, f)
            
            print(f"Stored {len(chunks)} documents in FAISS index {self.collection_name}")
        except Exception as e:
            print(f"Error storing in FAISS: {str(e)}")
            raise


class VectorStoreFactory:
    @staticmethod
    def create_store(store_type: str, embedding_model: str, collection_name: str = None, database_name: str = None, **kwargs) -> object:
        """Create vector store based on type"""
        stores = {
            "weaviate": WeaviateStore,
            "chromadb": ChromaStore,
            "faiss": FaissStore,
            "pinecone": PineconeStore
        }
        
        if store_type not in stores:
            raise ValueError(f"Unknown store type: {store_type}")
            
        return stores[store_type](
            embedding_model=embedding_model, 
            collection_name=collection_name, 
            database_name=database_name,
            **kwargs
        )