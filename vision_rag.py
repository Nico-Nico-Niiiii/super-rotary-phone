# vision_rag.py

import os
import io
import sys
import argparse
import torch
import fitz  # PyMuPDF
import numpy as np
from PIL import Image, ImageDraw, ImageFont
from rich.console import Console
from rich.markdown import Markdown
from rich import print as rprint
from rich.panel import Panel
from tqdm import tqdm
import chromadb
from chromadb.utils import embedding_functions
from transformers import (
    CLIPProcessor, 
    CLIPModel, 
    AutoTokenizer, 
    AutoModel,
    AutoModelForCausalLM, 
    BitsAndBytesConfig
)
from safetensors import safe_open
from safetensors.torch import load_file
import uuid
import json
import shutil
from typing import List, Dict, Tuple, Optional, Union, Any
import tempfile

console = Console()

class VisionRAGSystem:
    def __init__(self, model_path: str = None, db_path: str = "./vector_db"):
        """Initialize the Vision RAG System with models and database"""
        self.db_path = db_path
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        
        console.print(f"[bold green]Using device: {self.device}[/bold green]")
        
        # Initialize embedding models
        self._init_text_embedding_model()
        self._init_image_embedding_model()
        self._init_llm(model_path)
        self._init_vector_db()
    
    def _init_text_embedding_model(self):
        """Initialize text embedding model (E5 base)"""
        console.print("[bold]Loading text embedding model (E5-base-v2)...[/bold]")
        
        self.text_tokenizer = AutoTokenizer.from_pretrained("intfloat/e5-base-v2")
        self.text_model = AutoModel.from_pretrained("intfloat/e5-base-v2").to(self.device)
        
        # For efficiency on GPU
        if self.device == "cuda":
            self.text_model = self.text_model.half()  # Use FP16 for GPU efficiency
    
    def _init_image_embedding_model(self):
        """Initialize image embedding model (CLIP)"""
        console.print("[bold]Loading image embedding model (CLIP)...[/bold]")
        
        self.image_processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch32")
        self.image_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32").to(self.device)
        
        # For efficiency on GPU
        if self.device == "cuda":
            self.image_model = self.image_model.half()  # Use FP16 for GPU efficiency
    
    def _init_llm(self, model_path: str = None):
        """Initialize Large Language Model for generation"""
        if model_path:
            console.print(f"[bold]Loading custom LLM from {model_path}...[/bold]")
            model_path = model_path
        else:
            # Default to Phi-3 mini as it runs well locally
            console.print("[bold]Loading default LLM (Phi-3-mini-4k-instruct)...[/bold]")
            model_path = "microsoft/Phi-3-mini-4k-instruct"
        
        # BitsAndBytes configuration for 4-bit quantization (reduces VRAM usage)
        bnb_config = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
        )
        
        try:
            self.llm_tokenizer = AutoTokenizer.from_pretrained(model_path)
            self.llm = AutoModelForCausalLM.from_pretrained(
                model_path,
                device_map="auto",
                quantization_config=bnb_config,
                torch_dtype=torch.float16
            )
        except Exception as e:
            console.print(f"[bold red]Error loading LLM: {e}[/bold red]")
            console.print("[yellow]Continuing without LLM capability. Query responses will be limited to retrieval only.[/yellow]")
            self.llm = None
            self.llm_tokenizer = None
    
    def _init_vector_db(self):
        """Initialize the ChromaDB vector database"""
        console.print("[bold]Initializing vector database...[/bold]")
        
        # Create client
        self.chroma_client = chromadb.PersistentClient(path=self.db_path)
        
        # Create collections for text and images if they don't exist
        try:
            self.text_collection = self.chroma_client.get_collection("text_chunks")
        except:
            self.text_collection = self.chroma_client.create_collection(
                name="text_chunks",
                metadata={"description": "Text chunks from documents"}
            )
        
        try:
            self.image_collection = self.chroma_client.get_collection("image_chunks")
        except:
            self.image_collection = self.chroma_client.create_collection(
                name="image_chunks",
                metadata={"description": "Image chunks from documents"}
            )
    

    def process_folder(self, folder_path: str, chunk_size: int = 500, chunk_overlap: int = 50) -> None:
        """
        Process all PDF files in a folder
        
        Args:
            folder_path: Path to the folder containing PDF files
            chunk_size: Size of text chunks for embedding
            chunk_overlap: Overlap between consecutive text chunks
        """
        if not os.path.exists(folder_path) or not os.path.isdir(folder_path):
            console.print(f"[bold red]Error: Folder not found at {folder_path}[/bold red]")
            return
        
        console.print(f"[bold]Processing all PDFs in folder: {folder_path}[/bold]")
        
        # Get all PDF files in the folder
        pdf_files = [f for f in os.listdir(folder_path) if f.lower().endswith('.pdf')]
        
        if not pdf_files:
            console.print(f"[yellow]No PDF files found in {folder_path}[/yellow]")
            return
        
        console.print(f"[bold]Found {len(pdf_files)} PDF files[/bold]")
        
        # Process each PDF file
        for i, pdf_file in enumerate(pdf_files):
            pdf_path = os.path.join(folder_path, pdf_file)
            console.print(f"[bold]Processing file {i+1}/{len(pdf_files)}: {pdf_file}[/bold]")
            try:
                self.process_pdf(pdf_path, chunk_size=chunk_size, chunk_overlap=chunk_overlap)
            except Exception as e:
                console.print(f"[bold red]Error processing {pdf_file}: {e}[/bold red]")
                import traceback
                traceback.print_exc()
        
        console.print(f"[bold green]Completed processing {len(pdf_files)} PDF files from {folder_path}[/bold green]")


    def get_text_embedding(self, text: str) -> List[float]:
        """Generate embedding for text using E5 model"""
        # Format text for E5 embedding model
        formatted_text = f"passage: {text}"
        
        inputs = self.text_tokenizer(
            formatted_text, 
            padding=True, 
            truncation=True, 
            max_length=512, 
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.text_model(**inputs)
            embeddings = outputs.last_hidden_state[:, 0, :]
            embeddings = torch.nn.functional.normalize(embeddings, p=2, dim=1)
        
        return embeddings[0].cpu().numpy().tolist()
    
    def get_image_embedding(self, image: Image.Image) -> List[float]:
        """Generate embedding for image using CLIP"""
        inputs = self.image_processor(
            images=image, 
            return_tensors="pt"
        ).to(self.device)
        
        with torch.no_grad():
            outputs = self.image_model.get_image_features(**inputs)
            embeddings = torch.nn.functional.normalize(outputs, p=2, dim=1)
        
        return embeddings[0].cpu().numpy().tolist()
    
    def process_pdf(self, pdf_path: str, chunk_size: int = 500, chunk_overlap: int = 50) -> None:
        """
        Process a PDF document, extract text and images, and store in vector database
        
        Args:
            pdf_path: Path to the PDF file
            chunk_size: Size of text chunks for embedding
            chunk_overlap: Overlap between consecutive text chunks
        """
        if not os.path.exists(pdf_path):
            console.print(f"[bold red]Error: PDF file not found at {pdf_path}[/bold red]")
            return
        
        # Get base filename for reference
        base_filename = os.path.basename(pdf_path)
        console.print(f"[bold]Processing PDF: {base_filename}[/bold]")
        
        # Create a permanent directory to store extracted images
        storage_dir = os.path.join("storage", "images", base_filename.replace(".", "_"))
        os.makedirs(storage_dir, exist_ok=True)
        
        try:
            # Open the PDF
            doc = fitz.open(pdf_path)
            
            # Store page information for cross-referencing
            page_info = {}
            
            # Extract and store text chunks
            text_chunks = []
            current_chunk = ""
            chunk_id = 0
            
            # Process each page
            for page_num, page in enumerate(tqdm(doc, desc="Processing pages")):
                page_info[page_num] = {
                    "images": [],
                    "text_chunks": []
                }
                
                # Extract text from the page
                page_text = page.get_text("text")
                
                # Process images first to ensure text context is preserved
                image_list = page.get_images(full=True)
                page_images = []
                
                # Extract and process images on this page
                for img_index, img_info in enumerate(image_list):
                    xref = img_info[0]  # Image reference number
                    
                    try:
                        # Extract image
                        base_img = doc.extract_image(xref)
                        image_bytes = base_img["image"]
                        image_ext = base_img["ext"]
                        
                        # Open as PIL Image
                        pil_image = Image.open(io.BytesIO(image_bytes))
                        
                        # Skip very small images (likely icons or decorations)
                        if pil_image.width < 50 or pil_image.height < 50:
                            continue
                        
                        # Generate unique ID for this image
                        image_id = f"{base_filename}_p{page_num}_img{img_index}"
                        
                        # Save image to permanent storage
                        image_path = os.path.join(storage_dir, f"{image_id}.{image_ext}")
                        pil_image.save(image_path)
                        
                        # Get image embedding
                        image_embedding = self.get_image_embedding(pil_image)
                        
                        # Get nearby text as context
                        page_dict = page.get_text("dict")
                        image_rect = page.get_image_bbox(img_info)  # Get image rectangle
                        nearby_text = self._get_text_near_rect(page_dict, image_rect, radius=200)
                        
                        # Create OCR-like caption if no nearby text
                        if not nearby_text or len(nearby_text.strip()) < 20:
                            # Generate a basic description using image dimensions and position
                            nearby_text += f" [Image at position {image_rect[0]:.0f},{image_rect[1]:.0f} to {image_rect[2]:.0f},{image_rect[3]:.0f}, dimensions {pil_image.width}x{pil_image.height}]"
                        
                        # Store image info for cross-referencing
                        page_images.append({
                            "id": image_id,
                            "path": image_path,
                            "rect": image_rect,
                            "text": nearby_text,
                            "embedding": image_embedding
                        })
                        
                        # Store image in vector database
                        self.image_collection.add(
                            embeddings=[image_embedding],
                            documents=[nearby_text],
                            metadatas=[{
                                "source": base_filename,
                                "page": page_num + 1,
                                "image_id": image_id,
                                "image_path": image_path,
                                "width": pil_image.width,
                                "height": pil_image.height,
                                "position": f"{image_rect[0]:.0f},{image_rect[1]:.0f},{image_rect[2]:.0f},{image_rect[3]:.0f}"
                            }],
                            ids=[image_id]
                        )
                        
                        # Keep track of images on this page
                        page_info[page_num]["images"].append(image_id)
                        
                    except Exception as e:
                        console.print(f"[yellow]Warning: Could not process image: {e}[/yellow]")
                
                # Now process text with knowledge of images on the page
                words = page_text.split()
                i = 0
                
                while i < len(words):
                    # Add words to current chunk until we reach chunk_size
                    chunk_words = words[i:i+chunk_size]
                    chunk_text = " ".join(chunk_words)
                    
                    # If we have text from a previous page, prepend it
                    if current_chunk:
                        chunk_text = current_chunk + " " + chunk_text
                        current_chunk = ""
                    
                    # If this is a full chunk, process it
                    if len(chunk_words) == chunk_size:
                        # Create unique ID for this text chunk
                        text_id = f"{base_filename}_text_{chunk_id}"
                        chunk_id += 1
                        
                        # Add references to images that appear on this page
                        image_references = ""
                        if page_images:
                            image_ids = [img["id"] for img in page_images]
                            image_references = f" [This text appears on a page with images: {', '.join(image_ids)}]"
                        
                        # Add image references to text
                        augmented_text = chunk_text + image_references
                        
                        # Get embedding for text chunk
                        text_embedding = self.get_text_embedding(augmented_text)
                        
                        # Store text in vector database
                        self.text_collection.add(
                            embeddings=[text_embedding],
                            documents=[augmented_text],
                            metadatas=[{
                                "source": base_filename,
                                "page": page_num + 1,
                                "chunk_id": chunk_id,
                                "type": "text",
                                "contains_images": len(page_images) > 0,
                                "image_count": len(page_images)
                            }],
                            ids=[text_id]
                        )
                        
                        # Keep track of text chunks on this page
                        page_info[page_num]["text_chunks"].append(text_id)
                        
                        # Move to next chunk with overlap
                        i += chunk_size - chunk_overlap
                    else:
                        # If this is the last chunk and it's not full,
                        # save it to prepend to the next page
                        current_chunk = chunk_text
                        break
            
            # Process the final chunk if any text remains
            if current_chunk and len(current_chunk.split()) > 50:  # Only if substantial
                text_id = f"{base_filename}_text_{chunk_id}"
                
                # Get embedding for text chunk
                text_embedding = self.get_text_embedding(current_chunk)
                
                self.text_collection.add(
                    embeddings=[text_embedding],
                    documents=[current_chunk],
                    metadatas=[{
                        "source": base_filename,
                        "page": doc.page_count,
                        "chunk_id": chunk_id,
                        "type": "text"
                    }],
                    ids=[text_id]
                )
                
                # Keep track of text chunks on this page
                page_info[doc.page_count-1]["text_chunks"].append(text_id)
            
            # Create cross-reference indexes
            # This allows us to easily find text associated with images and vice versa
            console.print("[bold]Creating cross-reference indexes...[/bold]")
            
            # Create a JSON file with relationship data for fast lookups
            cross_ref_path = os.path.join(storage_dir, f"{base_filename}_cross_ref.json")
            with open(cross_ref_path, "w") as f:
                json.dump(page_info, f)
            
            console.print(f"[bold green]Successfully processed PDF and stored in vector database[/bold green]")
            console.print(f"[bold green]Images stored in: {storage_dir}[/bold green]")
            
        except Exception as e:
            console.print(f"[bold red]Error processing PDF: {e}[/bold red]")
            import traceback
            traceback.print_exc()
        finally:
            # Clean up
            if 'doc' in locals():
                doc.close()
    
    def _get_text_near_rect(self, page_dict: Dict, rect: List[float], radius: float = 100) -> str:
        """Get text that is near a specific rectangle on the page"""
        nearby_text = []
        
        # Expand the rectangle by the radius
        expanded_rect = [
            rect[0] - radius, rect[1] - radius,
            rect[2] + radius, rect[3] + radius
        ]
        
        # Check each text block on the page
        for block in page_dict["blocks"]:
            if block["type"] == 0:  # Text block
                block_rect = block["bbox"]
                # Check if this block intersects with our expanded rectangle
                if self._rectangles_intersect(block_rect, expanded_rect):
                    for line in block["lines"]:
                        for span in line["spans"]:
                            nearby_text.append(span["text"])
        
        return " ".join(nearby_text)
    
    def _rectangles_intersect(self, rect1: List[float], rect2: List[float]) -> bool:
        """Check if two rectangles intersect"""
        return not (rect1[2] < rect2[0] or  # r1 is left of r2
                   rect1[0] > rect2[2] or  # r1 is right of r2
                   rect1[3] < rect2[1] or  # r1 is above r2
                   rect1[1] > rect2[3])    # r1 is below r2
    
    def search(self, query: Union[str, Image.Image, Tuple[str, Image.Image]], 
              k: int = 5, mode: str = "hybrid") -> List[Dict]:
        """
        Search the vector database for relevant content
        
        Args:
            query: Text string, PIL Image, or Tuple of (text, image)
            k: Number of results to return
            mode: Search mode - "text" (text only), "image" (image only),
                  or "hybrid" (both with weighting)
        
        Returns:
            List of dictionaries containing search results
        """
        results = []
        
        # Check query type and process accordingly
        if isinstance(query, str):
            # Text query
            if mode in ["text", "hybrid"]:
                # Get text embedding
                text_embedding = self.get_text_embedding(query)
                
                # Search text collection
                text_results = self.text_collection.query(
                    query_embeddings=[text_embedding],
                    n_results=k
                )
                
                # Format text results
                for i in range(len(text_results["ids"][0])):
                    results.append({
                        "id": text_results["ids"][0][i],
                        "text": text_results["documents"][0][i],
                        "metadata": text_results["metadatas"][0][i],
                        "distance": text_results["distances"][0][i],
                        "type": "text"
                    })
            
            # Also search image collection using text (CLIP is multimodal)
            if mode in ["image", "hybrid"]:
                # Prepare image embedding from text
                inputs = self.image_processor(
                    text=[query], 
                    return_tensors="pt",
                    padding=True
                ).to(self.device)
                
                with torch.no_grad():
                    text_features = self.image_model.get_text_features(**inputs)
                    text_features = torch.nn.functional.normalize(text_features, p=2, dim=1)
                
                # Increase number of image results for text queries to ensure we get relevant images
                image_k = min(k * 2, 20)  # Get more image results but cap at reasonable number
                
                # Search image collection
                image_text_results = self.image_collection.query(
                    query_embeddings=[text_features[0].cpu().numpy().tolist()],
                    n_results=image_k
                )
                
                # Format image results
                for i in range(len(image_text_results["ids"][0])):
                    results.append({
                        "id": image_text_results["ids"][0][i],
                        "text": image_text_results["documents"][0][i],
                        "metadata": image_text_results["metadatas"][0][i],
                        "distance": image_text_results["distances"][0][i] * 0.9,  # Slight boost for images on text queries
                        "type": "image"
                    })
                
                # For each text result, find associated images from the same page
                # This ensures we display images that appear on the same page as relevant text
                for text_result in [r for r in results if r["type"] == "text"]:
                    source = text_result["metadata"]["source"]
                    page = text_result["metadata"]["page"]
                    
                    # Search the image collection by metadata filter with proper ChromaDB format
                    associated_images = self.image_collection.get(
                        where={"$and": [{"source": {"$eq": source}}, {"page": {"$eq": page}}]}
                    )
                    
                    # Add these images to results
                    if associated_images and "ids" in associated_images and associated_images["ids"]:
                        for i in range(len(associated_images["ids"])):
                            # Check if this image is already in results
                            if not any(r["id"] == associated_images["ids"][i] for r in results):
                                results.append({
                                    "id": associated_images["ids"][i],
                                    "text": associated_images["documents"][i],
                                    "metadata": associated_images["metadatas"][i],
                                    "distance": text_result["distance"] * 1.2,  # Slightly worse than text but related
                                    "type": "image"
                                })
                
        elif isinstance(query, Image.Image):
            # Image query
            image_embedding = self.get_image_embedding(query)
            
            # Search image collection - get more results for image queries
            image_k = min(k * 2, 20)
            
            # Search image collection
            image_results = self.image_collection.query(
                query_embeddings=[image_embedding],
                n_results=image_k
            )
            
            # Format image results
            for i in range(len(image_results["ids"][0])):
                results.append({
                    "id": image_results["ids"][0][i],
                    "text": image_results["documents"][0][i],
                    "metadata": image_results["metadatas"][0][i],
                    "distance": image_results["distances"][0][i],
                    "type": "image"
                })
            
            # For image queries, we want to show relevant text too
            # Find text content from the same pages as the top images
            if mode in ["text", "hybrid"]:
                # Collect all unique source+page combinations from top image results
                top_sources = set()
                for result in results[:min(5, len(results))]:
                    if result["type"] == "image":
                        source = result["metadata"]["source"]
                        page = result["metadata"]["page"]
                        top_sources.add((source, page))
                
                # For each source+page, get related text chunks
                for source, page in top_sources:
                    # Get text chunks from this page with proper ChromaDB filter format
                    related_text = self.text_collection.get(
                        where={"$and": [{"source": {"$eq": source}}, {"page": {"$eq": page}}]}
                    )
                    
                    # Add these text chunks to results
                    if related_text and "ids" in related_text and related_text["ids"]:
                        for i in range(len(related_text["ids"])):
                            # Find distance of the best matching image from this page
                            best_image_distance = min(
                                [r["distance"] for r in results if r["type"] == "image" 
                                 and r["metadata"]["source"] == source 
                                 and r["metadata"]["page"] == page],
                                default=0.5
                            )
                            
                            results.append({
                                "id": related_text["ids"][i],
                                "text": related_text["documents"][i],
                                "metadata": related_text["metadatas"][i],
                                "distance": best_image_distance * 1.1,  # Slightly worse than best image
                                "type": "text"
                            })
            
        elif isinstance(query, tuple) and len(query) == 2:
            # Combined text and image query
            text_query, image_query = query
            
            # Get text embedding
            text_embedding = self.get_text_embedding(text_query)
            
            # Get image embedding
            image_embedding = self.get_image_embedding(image_query)
            
            # Search text collection
            text_results = self.text_collection.query(
                query_embeddings=[text_embedding],
                n_results=k
            )
            
            # Search image collection
            image_results = self.image_collection.query(
                query_embeddings=[image_embedding],
                n_results=k
            )
            
            # Format and combine results with weighted scoring
            for i in range(len(text_results["ids"][0])):
                results.append({
                    "id": text_results["ids"][0][i],
                    "text": text_results["documents"][0][i],
                    "metadata": text_results["metadatas"][0][i],
                    "distance": text_results["distances"][0][i] * 0.7,  # Weight text results (0.7 = higher importance)
                    "type": "text"
                })
            
            for i in range(len(image_results["ids"][0])):
                results.append({
                    "id": image_results["ids"][0][i],
                    "text": image_results["documents"][0][i],
                    "metadata": image_results["metadatas"][0][i],
                    "distance": image_results["distances"][0][i] * 0.7,  # Equal weight to text
                    "type": "image"
                })
                
            # Add associated content (images with text, text with images)
            for result in list(results):  # Use a copy to avoid modification during iteration
                source = result["metadata"]["source"]
                page = result["metadata"]["page"]
                
                if result["type"] == "text":
                    # Find images on this page
                    related_images = self.image_collection.get(
                        where={"source": source, "page": page}
                    )
                    
                    if related_images and "ids" in related_images and related_images["ids"]:
                        for i in range(len(related_images["ids"])):
                            # Check if already in results
                            if not any(r["id"] == related_images["ids"][i] for r in results):
                                results.append({
                                    "id": related_images["ids"][i],
                                    "text": related_images["documents"][i],
                                    "metadata": related_images["metadatas"][i],
                                    "distance": result["distance"] * 1.2,
                                    "type": "image"
                                })
                
                elif result["type"] == "image":
                    # Find text on this page using proper ChromaDB filter format
                    related_text = self.text_collection.get(
                        where={"$and": [{"source": {"$eq": source}}, {"page": {"$eq": page}}]}
                    )
                    
                    if related_text and "ids" in related_text and related_text["ids"]:
                        for i in range(len(related_text["ids"])):
                            # Check if already in results
                            if not any(r["id"] == related_text["ids"][i] for r in results):
                                results.append({
                                    "id": related_text["ids"][i],
                                    "text": related_text["documents"][i],
                                    "metadata": related_text["metadatas"][i],
                                    "distance": result["distance"] * 1.2,
                                    "type": "text"
                                })
        
        # Remove duplicates (by ID)
        seen_ids = set()
        unique_results = []
        for r in results:
            if r["id"] not in seen_ids:
                seen_ids.add(r["id"])
                unique_results.append(r)
        
        # Sort results by distance (lower is better)
        unique_results = sorted(unique_results, key=lambda x: x["distance"])
        
        # Return top k after sorting but ensure we have some diversity (text + images)
        if mode == "hybrid" and len(unique_results) > k:
            # Get at least some results of each type
            text_results = [r for r in unique_results if r["type"] == "text"]
            image_results = [r for r in unique_results if r["type"] == "image"]
            
            # Always include at least one image if available
            if image_results and not any(r["type"] == "image" for r in unique_results[:k]):
                # Replace the last text result with the best image result
                final_results = unique_results[:k-1] + [image_results[0]]
                return final_results
        
        return unique_results[:k]
    
    def display_results(self, results: List[Dict], show_images: bool = True) -> None:
        """
        Display search results in the terminal
        
        Args:
            results: List of result dictionaries
            show_images: Whether to attempt to display images in terminal
        """
        if not results:
            console.print("[yellow]No results found.[/yellow]")
            return
        
        console.print("\n[bold]Search Results:[/bold]\n")
        
        # Group results by source document for better organization
        from collections import defaultdict
        grouped_results = defaultdict(list)
        
        for result in results:
            source_key = f"{result['metadata']['source']}_{result['metadata']['page']}"
            grouped_results[source_key].append(result)
        
        # Process each group
        group_idx = 1
        for source_key, group_results in grouped_results.items():
            # Sort by type (image first) and then by distance
            group_results.sort(key=lambda x: (0 if x["type"] == "image" else 1, x["distance"]))
            
            # Get source info from first result
            first_result = group_results[0]
            metadata = first_result["metadata"]
            source_info = f"Source: {metadata['source']}, Page: {metadata['page']}"
            
            console.print(f"\n[bold]{group_idx}. {source_info}[/bold]")
            group_idx += 1
            
            # Display images first if available
            images_displayed = False
            for result in [r for r in group_results if r["type"] == "image"]:
                metadata = result["metadata"]
                
                if show_images and "image_path" in metadata:
                    try:
                        image_path = metadata["image_path"]
                        if os.path.exists(image_path):
                            img = Image.open(image_path)
                            
                            # Save a copy of the image to ensure it persists
                            result_dir = os.path.join("results", "images")
                            os.makedirs(result_dir, exist_ok=True)
                            result_path = os.path.join(result_dir, os.path.basename(image_path))
                            shutil.copy2(image_path, result_path)
                            
                            # Display image info with similarity score
                            similarity = 1.0 - result["distance"]  # Convert distance to similarity
                            console.print(f"  [bold green]Image Similarity: {similarity:.2%}[/bold green]")
                            console.print(f"  [dim]Image dimensions: {img.width}x{img.height}[/dim]")
                            console.print(f"  [dim]Image saved to: {result_path}[/dim]")
                            
                            # Display context text if available
                            if result["text"]:
                                console.print(Panel(
                                    Markdown(result["text"]),
                                    title="Image Context",
                                    border_style="green",
                                    width=100
                                ))
                            
                            # On systems that support it, try to display the image
                            if sys.platform == "darwin":  # macOS
                                os.system(f"open {result_path}")
                            elif sys.platform == "win32":  # Windows
                                os.system(f"start {result_path}")
                            else:  # Linux/Unix
                                os.system(f"xdg-open {result_path} 2>/dev/null")
                            
                            images_displayed = True
                            
                    except Exception as e:
                        console.print(f"  [yellow]Could not display image: {e}[/yellow]")
            
            # Display text content
            text_results = [r for r in group_results if r["type"] == "text"]
            if text_results:
                # Combine text results if they're from the same page to avoid fragmentation
                combined_text = "\n\n".join([r["text"] for r in text_results])
                
                # Get average similarity score
                avg_similarity = 1.0 - sum([r["distance"] for r in text_results]) / len(text_results)
                
                console.print(Panel(
                    Markdown(combined_text),
                    title=f"Text Content (Similarity: {avg_similarity:.2%})",
                    border_style="blue",
                    width=100
                ))
    
    def generate_answer(self, query: str, results: List[Dict]) -> str:
        """
        Generate an answer based on the query and retrieved results
        
        Args:
            query: User's query
            results: Retrieved context
        
        Returns:
            Generated answer
        """
        if not self.llm or not self.llm_tokenizer:
            # If LLM is not available, return a summary of sources
            return "[yellow]LLM not available. Retrieved relevant documents shown above.[/yellow]"
        
        # Prepare context from results
        context = ""
        for i, result in enumerate(results):
            context += f"--- Document {i+1} ---\n"
            if result["type"] == "image":
                context += f"[Image with caption/context: {result['text']}]\n"
            else:
                context += f"{result['text']}\n"
            context += f"Source: {result['metadata']['source']}, Page: {result['metadata']['page']}\n\n"
        
        # Prepare prompt for LLM
        prompt = f"""
You are a helpful assistant that answers questions based on the provided documents.
Use the context below to answer the question. If the answer is not in the context, 
say "I don't have enough information to answer this question" and suggest what 
additional information would be needed.

Context:
{context}

Question: {query}

Answer:
"""
        
        # Generate response
        inputs = self.llm_tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.llm.generate(
                inputs.input_ids,
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )
        
        response = self.llm_tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        return response
    
    def query(self, query: Union[str, Image.Image, Tuple[str, Image.Image]], 
              k: int = 5, mode: str = "hybrid", generate: bool = True) -> None:
        """
        Process a query and display results
        
        Args:
            query: Text string, PIL Image, or Tuple of (text, image)
            k: Number of results to return
            mode: Search mode ("text", "image", or "hybrid")
            generate: Whether to generate an answer using LLM
        """
        console.print("\n[bold]Searching for:[/bold]")
        if isinstance(query, str):
            console.print(f"Text query: {query}")
        elif isinstance(query, Image.Image):
            console.print("Image query (displaying relevant visual content)")
            # Create a results directory for the query image if it doesn't exist
            query_dir = os.path.join("results", "queries")
            os.makedirs(query_dir, exist_ok=True)
            query_path = os.path.join(query_dir, f"query_{uuid.uuid4()}.png")
            query.save(query_path)
            console.print(f"Query image saved to: {query_path}")
        elif isinstance(query, tuple):
            console.print(f"Multimodal query - Text: {query[0]}")
            console.print("With accompanying image")
        
        # Search for relevant content
        results = self.search(query, k=k, mode=mode)
        
        # Display results
        self.display_results(results)
        
        # For image queries, always show the associated text
        if isinstance(query, Image.Image):
            # Get all text from pages that contain matching images
            relevant_pages = set()
            for result in results:
                if result["type"] == "image":
                    source = result["metadata"]["source"]
                    page = result["metadata"]["page"]
                    relevant_pages.add((source, page))
            
            # If we have relevant pages, find and display all text on those pages
            if relevant_pages:
                console.print("\n[bold]Associated Text Content:[/bold]")
                for source, page in relevant_pages:
                    text_results = self.text_collection.get(
                        where={"$and": [{"source": {"$eq": source}}, {"page": {"$eq": page}}]}
                    )
                    
                    if text_results and text_results["documents"]:
                        combined_text = "\n\n".join(text_results["documents"])
                        console.print(Panel(
                            Markdown(combined_text),
                            title=f"Text from {source}, Page {page}",
                            border_style="blue"
                        ))
        
        # Generate answer if requested and if query contains text
        if generate and (isinstance(query, str) or (isinstance(query, tuple) and isinstance(query[0], str))):
            query_text = query if isinstance(query, str) else query[0]
            
            # For text queries, focus the answer specifically on the question
            focusing_text = ""
            if isinstance(query, str):
                focusing_text = "Ensure your answer focuses specifically on the question asked. "
                if any("image" in result["metadata"] for result in results if "metadata" in result):
                    focusing_text += "Reference relevant images when they support your answer. "
            
            answer = self.generate_answer(query_text, results, focusing_text)
            console.print("\n[bold]Generated Answer:[/bold]")
            console.print(Panel(Markdown(answer), border_style="yellow"))
            
        # For image-only queries with no text generation, provide a basic interpretation
        elif isinstance(query, Image.Image) and not generate:
            # Provide a basic description of what was found
            image_count = sum(1 for r in results if r["type"] == "image")
            if image_count > 0:
                console.print("\n[bold yellow]Image Query Summary:[/bold yellow]")
                console.print(f"Found {image_count} similar images across {len(relevant_pages)} pages.")
                console.print("Related text content displayed above.")
            else:
                console.print("\n[bold yellow]No similar images found in the database.[/bold yellow]")
    
    def generate_answer(self, query: str, results: List[Dict], focusing_text: str = "") -> str:
        """
        Generate an answer based on the query and retrieved results
        
        Args:
            query: User's query
            results: Retrieved context
            focusing_text: Additional instructions for answer generation
        
        Returns:
            Generated answer
        """
        if not self.llm or not self.llm_tokenizer:
            # If LLM is not available, return a summary of sources
            return "[yellow]LLM not available. Retrieved relevant documents shown above.[/yellow]"
        
        # Prepare context from results
        context = ""
        
        # Group results by source and page for better context
        from collections import defaultdict
        grouped_results = defaultdict(list)
        
        for result in results:
            source_key = f"{result['metadata']['source']}_{result['metadata']['page']}"
            grouped_results[source_key].append(result)
        
        # Process each group
        for source_key, group_results in grouped_results.items():
            # Get source info from first result
            source = group_results[0]["metadata"]["source"]
            page = group_results[0]["metadata"]["page"]
            
            context += f"--- Document: {source}, Page: {page} ---\n"
            
            # Add image information first
            image_results = [r for r in group_results if r["type"] == "image"]
            if image_results:
                for img in image_results:
                    if "width" in img["metadata"] and "height" in img["metadata"]:
                        context += f"[Image {img['metadata']['image_id']} - {img['metadata']['width']}x{img['metadata']['height']}]\n"
                    else:
                        context += f"[Image {img['metadata']['image_id']}]\n"
                    
                    if img["text"]:
                        context += f"Image context: {img['text']}\n"
            
            # Add text content
            text_results = [r for r in group_results if r["type"] == "text"]
            if text_results:
                # Sort by chunk_id if available
                text_results.sort(key=lambda x: x["metadata"].get("chunk_id", 0))
                
                # Combine text content
                combined_text = "\n".join([r["text"] for r in text_results])
                context += f"{combined_text}\n"
            
            context += "\n"
        
        # Prepare prompt for LLM
        prompt = f"""
You are a helpful assistant that answers questions based on the provided documents.
Use the context below to answer the question. If the answer is not in the context, 
say "I don't have enough information to answer this question" and suggest what 
additional information would be needed.

{focusing_text}

If the context mentions images, refer to them in your answer when they're relevant.

Context:
{context}

Question: {query}

Answer:
"""
        
        # Generate response
        inputs = self.llm_tokenizer(prompt, return_tensors="pt").to(self.device)
        
        with torch.no_grad():
            outputs = self.llm.generate(
                inputs.input_ids,
                max_new_tokens=512,
                temperature=0.7,
                top_p=0.9,
                do_sample=True
            )
        
        response = self.llm_tokenizer.decode(outputs[0][inputs.input_ids.shape[1]:], skip_special_tokens=True)
        return response
    
    def list_documents(self) -> None:
        """List all documents in the database"""
        # Get all unique documents from text collection
        text_documents = set()
        all_text_metadatas = self.text_collection.get()["metadatas"]
        for metadata in all_text_metadatas:
            if "source" in metadata:
                text_documents.add(metadata["source"])
        
        # Get all unique documents from image collection
        image_documents = set()
        all_image_metadatas = self.image_collection.get()["metadatas"]
        for metadata in all_image_metadatas:
            if "source" in metadata:
                image_documents.add(metadata["source"])
        
        # Combine and print
        all_documents = sorted(text_documents.union(image_documents))
        
        if all_documents:
            console.print("[bold]Documents in database:[/bold]")
            for doc in all_documents:
                console.print(f"  - {doc}")
        else:
            console.print("[yellow]No documents found in the database.[/yellow]")
    
    def clear_database(self) -> None:
        """Clear the vector database"""
        confirmation = input("Are you sure you want to clear the database? This action cannot be undone. (y/n): ")
        if confirmation.lower() == "y":
            try:
                # Delete collections
                self.chroma_client.delete_collection("text_chunks")
                self.chroma_client.delete_collection("image_chunks")
                
                # Reinitialize collections
                self._init_vector_db()
                
                console.print("[bold green]Database cleared successfully.[/bold green]")
            except Exception as e:
                console.print(f"[bold red]Error clearing database: {e}[/bold red]")
        else:
            console.print("[yellow]Database clearing cancelled.[/yellow]")


def main():
    # Create argument parser
    parser = argparse.ArgumentParser(description="Vision RAG System - Process and query PDFs with text and images")
    
    # Create subparsers for different commands
    subparsers = parser.add_subparsers(dest="command", help="Command to execute")
    
    # Subparser for 'process' command
    process_parser = subparsers.add_parser("process", help="Process a PDF document or folder")
    process_parser.add_argument("path", help="Path to the PDF file or folder containing PDFs")
    process_parser.add_argument("--chunk-size", type=int, default=500, help="Size of text chunks")
    process_parser.add_argument("--chunk-overlap", type=int, default=50, help="Overlap between chunks")
    process_parser.add_argument("--model", help="Path to custom LLM model")
    process_parser.add_argument("--db-path", default="./vector_db", help="Path to vector database")
    
    # Subparser for 'query' command
    query_parser = subparsers.add_parser("query", help="Query the system")
    query_parser.add_argument("query", help="Query text")
    query_parser.add_argument("--image", help="Path to query image (optional)")
    query_parser.add_argument("--k", type=int, default=5, help="Number of results to return")
    query_parser.add_argument("--mode", choices=["text", "image", "hybrid"], default="hybrid", help="Search mode")
    query_parser.add_argument("--no-generate", action="store_false", dest="generate", help="Don't generate an answer")
    query_parser.add_argument("--model", help="Path to custom LLM model")
    query_parser.add_argument("--db-path", default="./vector_db", help="Path to vector database")
    
    # Subparser for 'list' command
    list_parser = subparsers.add_parser("list", help="List all documents in the database")
    list_parser.add_argument("--db-path", default="./vector_db", help="Path to vector database")
    list_parser.add_argument("--model", help="Path to custom LLM model")
    
    # Subparser for 'clear' command
    clear_parser = subparsers.add_parser("clear", help="Clear the vector database")
    clear_parser.add_argument("--db-path", default="./vector_db", help="Path to vector database")
    clear_parser.add_argument("--model", help="Path to custom LLM model")
    
    # Parse arguments
    args = parser.parse_args()
    
    if args.command == "process":
        # Initialize system
        system = VisionRAGSystem(model_path=args.model, db_path=args.db_path)
        
        # Check if the path is a directory or a file
        if os.path.isdir(args.path):
            # Process all PDFs in the directory
            system.process_folder(args.path, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)
        else:
            # Process a single PDF file
            system.process_pdf(args.path, chunk_size=args.chunk_size, chunk_overlap=args.chunk_overlap)
    
    elif args.command == "query":
        # Initialize system
        system = VisionRAGSystem(model_path=args.model, db_path=args.db_path)
        
        # Handle query
        if args.image:
            try:
                # Load image
                img = Image.open(args.image)
                
                # Combined query with image and text
                query = (args.query, img)
                
                system.query(query, k=args.k, mode=args.mode, generate=args.generate)
            except Exception as e:
                console.print(f"[bold red]Error loading image: {e}[/bold red]")
                console.print("[yellow]Falling back to text-only query.[/yellow]")
                system.query(args.query, k=args.k, mode="text", generate=args.generate)
        else:
            # Text-only query
            system.query(args.query, k=args.k, mode=args.mode, generate=args.generate)
    
    elif args.command == "list":
        # Initialize system and list documents
        system = VisionRAGSystem(model_path=args.model, db_path=args.db_path)
        system.list_documents()
    
    elif args.command == "clear":
        # Initialize system and clear database
        system = VisionRAGSystem(model_path=args.model, db_path=args.db_path)
        system.clear_database()
    
    else:
        parser.print_help()


if __name__ == "__main__":
    main()