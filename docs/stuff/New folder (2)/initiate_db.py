
import os
import subprocess
import sys
import json
import time
import requests
from pathlib import Path
import shutil

class IndividualDatabaseSetup:
    def __init__(self):
        self.base_dir = Path.cwd()
        print("base dir",self.base_dir)
        self.data_dir = self.base_dir / "vector_databases"
        print("data dir",self.data_dir)
    def check_weaviate_running(self):
        """Check if Weaviate is already running"""
        try:
            response = requests.get("http://localhost:8080/v1/meta")
            return response.status_code == 200
        except:
            return False

    def check_docker_container(self, container_name):
        """Check if a Docker container is running"""
        try:
            result = subprocess.run(
                ["docker", "ps", "--filter", f"name={container_name}", "--format", "{{.Names}}"],
                capture_output=True,
                text=True
            )
            return container_name in result.stdout
        except:
            return False

    def setup_weaviate(self):
        """Setup Weaviate database"""
        print("\n=== Setting up Weaviate ===")
        weaviate_dir = self.data_dir / "weaviate"
        print("weaviate dir", weaviate_dir)
        # Check if Weaviate is already running
        if self.check_weaviate_running():
            print("? Weaviate is already running!")
            return True
            
        weaviate_dir.mkdir(parents=True, exist_ok=True)
        
        # Create docker-compose.yml if it doesn't exist
        docker_compose_path = weaviate_dir / "docker-compose.yml"
        print("docker", docker_compose_path)
        
        if not docker_compose_path.exists():
            print("Not logic")
            docker_compose = """
version: '3.4'
services:
  weaviate:
    image: semitechnologies/weaviate:1.24.1
    ports:
      - "8080:8080"
    restart: on-failure:0
    environment:
      QUERY_DEFAULTS_LIMIT: 25
      AUTHENTICATION_ANONYMOUS_ACCESS_ENABLED: 'true'
      PERSISTENCE_DATA_PATH: '/var/lib/weaviate'
      DEFAULT_VECTORIZER_MODULE: 'none'
    volumes:
      - ./data:/var/lib/weaviate
"""
            with open(docker_compose_path, "w") as f:
                f.write(docker_compose)
        
        # Start Weaviate container if not running
        if not self.check_docker_container("weaviate"):
            try:
                print("In try block")
                subprocess.run(["docker", "compose", "-f", str(docker_compose_path), "up", "-d"])
                print("Waiting for Weaviate to start...")
                for _ in range(6):  # Try for 30 seconds
                    if self.check_weaviate_running():
                        print("? Weaviate setup successful!")
                        return True
                    time.sleep(5)
            except Exception as e:
                print(f"Error setting up Weaviate: {str(e)}")
                return False
        return False
    






    def setup_chromadb(self):
        """Setup ChromaDB"""
        print("\n=== Setting up ChromaDB ===")
        chroma_dir = self.data_dir / "chromadb"
        
        # Check if ChromaDB is already set up
        if (chroma_dir / "persist" / "chroma.sqlite3").exists():
            print("? ChromaDB is already set up!")
            return True
            
        chroma_dir.mkdir(parents=True, exist_ok=True)
        
        # Create ChromaDB configuration if it doesn't exist
        config_path = chroma_dir / "chroma_config.json"
        if not config_path.exists():
            config = {
                "chroma_server_host": "localhost",
                "chroma_server_http_port": "8000",
                "persist_directory": str(chroma_dir / "persist"),
                "chroma_db_impl": "duckdb+parquet"
            }
            with open(config_path, "w") as f:
                json.dump(config, f, indent=2)
            
        # Create and run test script
        test_script = """
import chromadb
from chromadb.config import Settings

client = chromadb.PersistentClient(
    path="./vector_databases/chromadb/persist",
    settings=Settings(
        allow_reset=True,
        is_persistent=True
    )
)

# Create a test collection
collection = client.create_collection(name="test_collection")
print("ChromaDB test collection created successfully!")
"""
        with open(chroma_dir / "test_chroma.py", "w") as f:
            f.write(test_script)
            
        try:
            subprocess.run([sys.executable, str(chroma_dir / "test_chroma.py")], check=True)
            print("? ChromaDB setup successful!")
            return True
        except Exception as e:
            print(f"Error setting up ChromaDB: {str(e)}")
            return False

    def setup_faiss(self):
        """Setup FAISS"""
        print("\n=== Setting up FAISS ===")
        faiss_dir = self.data_dir / "faiss"
        
        # Check if FAISS index already exists
        if (faiss_dir / "test_index.faiss").exists():
            print("? FAISS is already set up!")
            return True
            
        faiss_dir.mkdir(parents=True, exist_ok=True)
        
        # Create FAISS test script
        test_script = """
import faiss
import numpy as np
# Create a small index for testing
dimension = 128
index = faiss.IndexFlatL2(dimension)

# Add some test vectors
vectors = np.random.random((10, dimension)).astype('float32')
index.add(vectors)

# Save the index
faiss.write_index(index, "./vector_databases/faiss/test_index.faiss")
print("FAISS test index created successfully!")
"""
        with open(faiss_dir / "test_faiss.py", "w") as f:
            f.write(test_script)
            
        try:
            subprocess.run([sys.executable, str(faiss_dir / "test_faiss.py")], check=True)
            print("? FAISS setup successful!")
            return True
        except Exception as e:
            print(f"Error setting up FAISS: {str(e)}")
            return False

    def setup_pinecone(self):
        """Setup Pinecone configuration"""
        print("\n=== Setting up Pinecone ===")
        pinecone_dir = self.data_dir / "pinecone"
        
        # Check if Pinecone config already exists
        if (pinecone_dir / "pinecone_config.json").exists():
            print("? Pinecone configuration already exists!")
            return True
            
        pinecone_dir.mkdir(parents=True, exist_ok=True)
        
        # Create Pinecone configuration template
        config = {
            "api_key": "pcsk_7BJ2Bj_DRSQZvLAjq9CdAtcNsXNTB38PsCYbbSC38REHTANgfY2PznaEAY48ReEQBWozni",
            "environment": "gcp-starter",
            "project_name": "vector-search",
            "index_name": "document-store",
            "dimension": 384,
            "metric": "cosine"
        }
        
        with open(pinecone_dir / "pinecone_config.json", "w") as f:
            json.dump(config, f, indent=2)
        
        # Create Pinecone test script
        test_script = """
import pinecone
import json
import os

def test_pinecone_connection():
    # Load configuration
    with open("./vector_databases/pinecone/pinecone_config.json") as f:
        config = json.load(f)
    
    # Initialize Pinecone
    pinecone.init(
        api_key=config["api_key"],
        environment=config["environment"]
    )
    
    # List indexes
    print("Connected to Pinecone successfully!")
    print("Available indexes:", pinecone.list_indexes())

if __name__ == "__main__":
    test_pinecone_connection()
"""
        with open(pinecone_dir / "test_pinecone.py", "w") as f:
            f.write(test_script)
            
        print("? Pinecone configuration created!")
        print("Please update the API key in pinecone_config.json before testing")
        return True

    def create_main_config(self):
        """Create main configuration file"""
        config_path = self.data_dir / "config.json"
        if config_path.exists():
            print("\n? Main configuration file already exists!")
            return
            
        config = {
            "databases": {
                "weaviate": {
                    "enabled": True,
                    "host": "http://localhost:8080",
                    "data_path": str(self.data_dir / "weaviate")
                },
                "chromadb": {
                    "enabled": True,
                    "persist_dir": str(self.data_dir / "chromadb/persist")
                },
                "faiss": {
                    "enabled": True,
                    "index_path": str(self.data_dir / "faiss")
                },
                "pinecone": {
                    "enabled": True,
                    "config_path": str(self.data_dir / "pinecone/pinecone_config.json")
                }
            },
            "embedding_model": "intfloat/e5-large-v2",
            "batch_size": 32
        }
        
        with open(config_path, "w") as f:
            json.dump(config, f, indent=2)
        print("\n? Main configuration file created!")

def main():
    setup = IndividualDatabaseSetup()
    
    # Create main directory
    setup.data_dir.mkdir(exist_ok=True)
    
    # Setup each database
    weaviate_success = setup.setup_weaviate()
    # chromadb_success = setup.setup_chromadb()
    # faiss_success = setup.setup_faiss()
    # pinecone_success = setup.setup_pinecone()
    
    # Create main configuration
    setup.create_main_config()
    
    print("\n=== Setup Summary ===")
    print(f"Weaviate: {'?' if weaviate_success else '?'}")
    # print(f"ChromaDB: {'?' if chromadb_success else '?'}")
    # print(f"FAISS: {'?' if faiss_success else '?'}")
    # print(f"Pinecone: {'?' if pinecone_success else '?'}")
    
    print("\n=== Next Steps ===")
    # if not (setup.data_dir / "pinecone/pinecone_config.json").exists():
    #     print("1. Update Pinecone API key in: vector_databases/pinecone/pinecone_config.json")
    if not setup.check_weaviate_running():
        print("2. Verify Weaviate is running: http://localhost:8080/v1/meta")
    
if __name__ == "__main__":
    main()  