#!/usr/bin/env python
"""
RAG Database Diagnostic Tool - ChromaDB v0.6.0 Compatible

This script helps diagnose and fix issues with RAG vector databases
and is compatible with ChromaDB v0.6.0.
"""

import os
import sys
import glob
import json
import re
import time
import traceback
import uuid
from datetime import datetime

# Set the base directory to the specified application path
BASE_DIR = "/home/gyan/gyan_copy_adi/GYAN_PLATFORM/gyan-platform-backend/app"
CHROMA_DB_PATH = os.path.join(BASE_DIR, "..", "chroma_db")
METADATA_DIR = os.path.join(BASE_DIR, "..", "vector_db_metadata")

def print_header(text):
    """Print a formatted header"""
    print("\n" + "=" * 80)
    print(f" {text}")
    print("=" * 80)

def print_section(text):
    """Print a section header"""
    print("\n" + "-" * 60)
    print(f" {text}")
    print("-" * 60)

def print_status(status, message):
    """Print a status message"""
    if status:
        print(f"✅ {message}")
    else:
        print(f"❌ {message}")

def create_metadata_dir():
    """Create metadata directory if it doesn't exist"""
    if not os.path.exists(METADATA_DIR):
        os.makedirs(METADATA_DIR, exist_ok=True)
        print_status(True, f"Created vector metadata directory: {METADATA_DIR}")
    else:
        print_status(True, f"Vector metadata directory already exists: {METADATA_DIR}")

def fix_chromadb_collections():
    """Fix ChromaDB collections for v0.6.0"""
    print_section("Fixing ChromaDB Collections")
    
    if not os.path.exists(CHROMA_DB_PATH):
        print_status(False, f"ChromaDB directory not found: {CHROMA_DB_PATH}")
        return False
    
    print_status(True, f"ChromaDB directory found at: {CHROMA_DB_PATH}")
    
    try:
        import chromadb
        print_status(True, "ChromaDB module imported successfully")
        
        try:
            # Create client
            client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
            print_status(True, "Connected to ChromaDB successfully")
            
            # Get all collections (v0.6.0 compatible)
            collections = client.list_collections()
            print(f"Found {len(collections)} ChromaDB collections:")
            
            # Create metadata directory
            create_metadata_dir()
            
            # Process each collection
            for collection in collections:
                # In v0.6.0, the collection objects are just strings
                collection_name = collection
                try:
                    # Get collection (v0.6.0 compatible)
                    coll = client.get_collection(name=collection_name)
                    
                    # Get count and other info
                    count = coll.count()
                    
                    print(f"- {collection_name} (Documents: {count})")
                    
                    # Save metadata
                    metadata = {
                        "db_type": "chromadb",
                        "collection_name": collection_name,
                        "document_count": count,
                        "path": CHROMA_DB_PATH,
                        "chroma_version": "0.6.0",
                        "last_checked": datetime.now().isoformat()
                    }
                    
                    metadata_file = os.path.join(METADATA_DIR, f"chromadb_{collection_name}.json")
                    with open(metadata_file, 'w') as f:
                        json.dump(metadata, f, indent=2)
                        
                    print(f"  Saved metadata to: {metadata_file}")
                    
                except Exception as e:
                    print(f"  Error with collection {collection_name}: {str(e)}")
            
            return True
        
        except Exception as e:
            print_status(False, f"Error with ChromaDB: {str(e)}")
            return False
    
    except ImportError:
        print_status(False, "ChromaDB module not found")
        return False

def check_faiss_indexes():
    """Check FAISS indexes"""
    print_section("Checking FAISS Indexes")
    
    faiss_dir = os.path.join(BASE_DIR, "..", "faiss_indexes")
    if not os.path.exists(faiss_dir):
        print_status(False, f"FAISS directory not found: {faiss_dir}")
        return False
    
    print_status(True, f"FAISS directory found at: {faiss_dir}")
    
    try:
        import faiss
        import pickle
        print_status(True, "FAISS module imported successfully")
        
        # List all files
        files = os.listdir(faiss_dir)
        index_files = [f for f in files if f.endswith('.index')]
        doc_files = [f for f in files if f.endswith('_docs.pkl')]
        
        print(f"Found {len(index_files)} FAISS index files:")
        
        # Create metadata directory
        create_metadata_dir()
        
        # Process each index
        for index_file in index_files:
            base_name = index_file.replace('.index', '')
            docs_file = f"{base_name}_docs.pkl"
            
            if docs_file in doc_files:
                try:
                    # Load index
                    index_path = os.path.join(faiss_dir, index_file)
                    docs_path = os.path.join(faiss_dir, docs_file)
                    
                    index = faiss.read_index(index_path)
                    
                    # Load documents
                    with open(docs_path, 'rb') as f:
                        documents = pickle.load(f)
                    
                    doc_count = len(documents)
                    print(f"- {index_file} (Vectors: {index.ntotal}, Documents: {doc_count})")
                    
                    # Save metadata
                    metadata = {
                        "db_type": "faiss",
                        "index_name": base_name,
                        "index_path": index_path,
                        "docs_path": docs_path,
                        "vector_count": index.ntotal,
                        "document_count": doc_count,
                        "last_checked": datetime.now().isoformat()
                    }
                    
                    metadata_file = os.path.join(METADATA_DIR, f"faiss_{base_name}.json")
                    with open(metadata_file, 'w') as f:
                        json.dump(metadata, f, indent=2)
                        
                    print(f"  Saved metadata to: {metadata_file}")
                    
                except Exception as e:
                    print(f"  Error with index {index_file}: {str(e)}")
            else:
                print(f"- {index_file} (Missing documents file)")
        
        return True
    
    except ImportError:
        print_status(False, "FAISS module not found")
        return False
    except Exception as e:
        print_status(False, f"Error checking FAISS indexes: {str(e)}")
        return False

def fix_specific_database():
    """Fix a specific database by name"""
    print_section("Fix Specific Database")
    
    database_name = input("Enter database name (e.g., 'MoleFaiss'): ").strip()
    
    if not database_name:
        print("Database name cannot be empty")
        return False
    
    # Ask for database type
    print("\nSelect database type:")
    print("1. ChromaDB")
    print("2. FAISS")
    print("3. Weaviate")
    print("4. Pinecone")
    db_type = input("Enter choice (1-4): ").strip()
    
    if db_type == "1":
        vector_db = "chromadb"
    elif db_type == "2":
        vector_db = "faiss"
    elif db_type == "3":
        vector_db = "weaviate"
    elif db_type == "4":
        vector_db = "pinecone"
    else:
        print("Invalid choice")
        return False
    
    # Standardize database name for collection naming
    std_name = re.sub(r'[^a-z0-9]', '_', database_name.lower())
    std_name = re.sub(r'_+', '_', std_name.strip('_'))
    
    # Create metadata directory
    create_metadata_dir()
    
    # Generate collection names
    collection_names = []
    
    if vector_db == "chromadb":
        collection_names = [
            f"rag_{std_name}",
            f"rag-{std_name}-temp",
            f"rag_{std_name}_Temp",
            database_name.lower()
        ]
    elif vector_db == "faiss":
        collection_names = [
            f"rag_{std_name}",
            f"rag-{std_name}-temp",
            f"rag_{std_name}_Temp",
            database_name
        ]
    elif vector_db == "weaviate":
        collection_names = [
            f"RAG{std_name[0].upper() + std_name[1:]}",
            f"RAG_{std_name.upper()}",
            f"Rag{database_name}"
        ]
    elif vector_db == "pinecone":
        # Sanitize for Pinecone
        sanitized = re.sub(r'[^a-z0-9-]', '-', std_name)
        sanitized = re.sub(r'-+', '-', sanitized.strip('-'))
        if not sanitized[0].isalpha():
            sanitized = f"idx-{sanitized}"
        sanitized = sanitized[:45]
        
        collection_names = [
            sanitized,
            f"rag-{std_name}-temp",
            f"idx-{std_name}"
        ]
    
    # Create metadata for each potential collection name
    print(f"\nCreating metadata files for database: {database_name}")
    print(f"Database type: {vector_db}")
    print("Potential collection names:")
    
    for collection_name in collection_names:
        print(f"- {collection_name}")
        
        if vector_db == "chromadb":
            metadata = {
                "db_type": "chromadb",
                "collection_name": collection_name,
                "database_name": database_name,
                "path": CHROMA_DB_PATH,
                "created_at": datetime.now().isoformat()
            }
            
            metadata_file = os.path.join(METADATA_DIR, f"chromadb_{collection_name}.json")
            
        elif vector_db == "faiss":
            metadata = {
                "db_type": "faiss",
                "index_name": collection_name,
                "database_name": database_name,
                "index_path": os.path.join(BASE_DIR, "..", "faiss_indexes", f"{collection_name}.index"),
                "docs_path": os.path.join(BASE_DIR, "..", "faiss_indexes", f"{collection_name}_docs.pkl"),
                "created_at": datetime.now().isoformat()
            }
            
            metadata_file = os.path.join(METADATA_DIR, f"faiss_{collection_name}.json")
            
        elif vector_db == "weaviate":
            metadata = {
                "db_type": "weaviate",
                "class_name": collection_name,
                "database_name": database_name,
                "created_at": datetime.now().isoformat()
            }
            
            metadata_file = os.path.join(METADATA_DIR, f"weaviate_{collection_name}.json")
            
        elif vector_db == "pinecone":
            metadata = {
                "db_type": "pinecone",
                "index_name": collection_name,
                "database_name": database_name,
                "created_at": datetime.now().isoformat()
            }
            
            metadata_file = os.path.join(METADATA_DIR, f"pinecone_{collection_name}.json")
        
        # Write metadata file
        with open(metadata_file, 'w') as f:
            json.dump(metadata, f, indent=2)
            
        print(f"  Saved metadata to: {metadata_file}")
    
    return True

def debug_collection_name(database_name):
    """Debug issues with a specific database name"""
    print_section(f"Debugging Collection for: {database_name}")
    
    # Standardize the name
    std_name = re.sub(r'[^a-z0-9]', '_', database_name.lower())
    std_name = re.sub(r'_+', '_', std_name.strip('_'))
    
    # Generate different naming variations
    variations = [
        f"rag_{std_name}",
        f"rag-{std_name}-temp",
        f"rag_{std_name}_Temp",
        f"rag_{std_name.replace('-', '_')}",
        std_name,
        database_name.lower(),
        database_name.replace(' ', '_').lower()
    ]
    
    print("Checking for these collection name variations:")
    for i, var in enumerate(variations):
        print(f"{i+1}. {var}")
    
    # Check if any of these exist in ChromaDB
    try:
        import chromadb
        client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
        
        # List all collections
        all_collections = client.list_collections()
        print(f"\nFound {len(all_collections)} ChromaDB collections:")
        
        for collection in all_collections:
            print(f"- {collection}")
            
            # Check if this is a variation of our database name
            for var in variations:
                if var in collection or collection in var:
                    print(f"  ➡️ This matches variation: {var}")
                    
                    # Try to get the collection
                    try:
                        coll = client.get_collection(name=collection)
                        count = coll.count()
                        print(f"  ✅ Collection accessible with {count} documents")
                        
                        # Create metadata
                        metadata = {
                            "db_type": "chromadb",
                            "collection_name": collection,
                            "database_name": database_name,
                            "path": CHROMA_DB_PATH,
                            "document_count": count,
                            "created_at": datetime.now().isoformat()
                        }
                        
                        # Save metadata
                        metadata_file = os.path.join(METADATA_DIR, f"chromadb_{collection}.json")
                        with open(metadata_file, 'w') as f:
                            json.dump(metadata, f, indent=2)
                            
                        print(f"  ✅ Saved metadata to: {metadata_file}")
                        
                    except Exception as e:
                        print(f"  ❌ Error accessing collection: {str(e)}")
    
    except Exception as e:
        print(f"Error checking ChromaDB collections: {str(e)}")

def main():
    """Main function"""
    print_header("RAG Database Diagnostic Tool - ChromaDB v0.6.0 Compatible")
    print(f"Base path: {BASE_DIR}")
    print(f"ChromaDB path: {CHROMA_DB_PATH}")
    print(f"Metadata directory: {METADATA_DIR}")
    
    # Create metadata directory
    create_metadata_dir()
    
    # Show options
    print("\nAvailable options:")
    print("1. Fix ChromaDB collections (v0.6.0 compatible)")
    print("2. Check FAISS indexes")
    print("3. Fix specific database")
    print("4. Debug collection name")
    print("5. Exit")
    
    choice = input("Enter choice (1-5): ").strip()
    
    if choice == "1":
        fix_chromadb_collections()
    elif choice == "2":
        check_faiss_indexes()
    elif choice == "3":
        fix_specific_database()
    elif choice == "4":
        database_name = input("Enter database name to debug: ").strip()
        debug_collection_name(database_name)
    elif choice == "5":
        print("Exiting...")
        sys.exit(0)
    else:
        print("Invalid choice")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nOperation cancelled by user")
    except Exception as e:
        print(f"Error: {str(e)}")
        traceback.print_exc()