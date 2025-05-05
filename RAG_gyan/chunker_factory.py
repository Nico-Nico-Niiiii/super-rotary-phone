import tiktoken
from langchain_core.documents import Document
from langchain.text_splitter import RecursiveCharacterTextSplitter
from typing import List
import re
import nltk
from nltk.tokenize import sent_tokenize
import nltk

try:
    nltk.data.find('tokenizers/punkt')
except LookupError:
    nltk.download('punkt')

class AgenticTextChunker:
    def __init__(self,
                 max_tokens: int = 500,
                 token_overlap: int = 50,
                 model_name: str = 'cl100k_base'):
        """
        Initialize agentic text chunker with token-based segmentation
       
        Args:
            max_tokens (int): Maximum number of tokens per chunk
            token_overlap (int): Number of tokens to overlap between chunks
            model_name (str): Tokenizer model name
        """
        self.max_tokens = max_tokens
        self.token_overlap = token_overlap
        self.tokenizer = tiktoken.get_encoding(model_name)
 
    def _semantic_split(self, text: str) -> List[str]:
        """
        Perform semantic splitting based on text structure
       
        Args:
            text (str): Input text to split
       
        Returns:
            List[str]: List of semantic chunks
        """
        strategies = [
            text.split('\n\n'),
            [sentence.strip() for sentence in text.replace('.\n', '。').split('。') if sentence.strip()]
        ]
        chunks = strategies[0] if len(strategies[0]) > 1 else strategies[1]
        return chunks
 
    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents using agentic approach
       
        Args:
            documents (List[Document]): Input documents
       
        Returns:
            List[Document]: Chunked documents
        """
        chunked_documents = []
       
        for doc in documents:
            semantic_chunks = self._semantic_split(doc.page_content)
            current_chunk = []
            current_tokens = 0
           
            for chunk in semantic_chunks:
                chunk_tokens = len(self.tokenizer.encode(chunk))
               
                if current_tokens + chunk_tokens > self.max_tokens:
                    chunk_text = ' '.join(current_chunk)
                    chunked_documents.append(
                        Document(
                            page_content=chunk_text,
                            metadata={
                                **doc.metadata,
                                'chunk_size': len(self.tokenizer.encode(chunk_text))
                            }
                        )
                    )
                   
                    current_chunk = current_chunk[-self.token_overlap:] + [chunk]
                    current_tokens = len(self.tokenizer.encode(' '.join(current_chunk)))
                else:
                    current_chunk.append(chunk)
                    current_tokens += chunk_tokens
           
            if current_chunk:
                chunk_text = ' '.join(current_chunk)
                chunked_documents.append(
                    Document(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            'chunk_size': len(self.tokenizer.encode(chunk_text))
                        }
                    )
                )
       
        return chunked_documents
 
class RecursiveChunker:
    def __init__(self, chunk_size: int = 500, chunk_overlap: int = 50):
        """
        Initialize recursive character text splitter
       
        Args:
            chunk_size (int): Size of text chunks
            chunk_overlap (int): Overlap between chunks
        """
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap
        )
   
    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents using recursive character text splitter
       
        Args:
            documents (List[Document]): Input documents
       
        Returns:
            List[Document]: Chunked documents
        """
        return self.text_splitter.split_documents(documents)


class SemanticChunker:
    def __init__(self, max_chunk_size: int = 500, overlap: int = 50):
        """
        Initialize semantic chunker that splits based on document structure
        
        Args:
            max_chunk_size (int): Maximum size of each chunk
            overlap (int): Overlap between chunks
        """
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents using semantic boundaries like paragraphs and sections
        
        Args:
            documents (List[Document]): Input documents
        
        Returns:
            List[Document]: Chunked documents
        """
        chunked_documents = []
        
        for doc in documents:
            # Split on semantic boundaries (paragraphs, sections, etc.)
            chunks = []
            
            # First try to split on double newlines (paragraphs)
            paragraphs = doc.page_content.split('\n\n')
            
            current_chunk = []
            current_size = 0
            
            for paragraph in paragraphs:
                if current_size + len(paragraph) > self.max_chunk_size:
                    if current_chunk:
                        chunks.append(' '.join(current_chunk))
                    current_chunk = [paragraph]
                    current_size = len(paragraph)
                else:
                    current_chunk.append(paragraph)
                    current_size += len(paragraph)
            
            if current_chunk:
                chunks.append(' '.join(current_chunk))
            
            # Create documents from chunks
            for chunk in chunks:
                chunked_documents.append(
                    Document(
                        page_content=chunk,
                        metadata={**doc.metadata, 'chunk_size': len(chunk)}
                    )
                )
        
        return chunked_documents

class SentenceChunker:
    def __init__(self, max_sentences: int = 5, overlap_sentences: int = 1):
        """
        Initialize sentence-based chunker with robust NLTK handling
        
        Args:
            max_sentences (int): Maximum number of sentences per chunk
            overlap_sentences (int): Number of sentences to overlap between chunks
        """
        self.max_sentences = max_sentences
        self.overlap_sentences = overlap_sentences
        self._ensure_nltk_resources()
        
    def _ensure_nltk_resources(self):
        """Ensure all required NLTK resources are available"""
        try:
            # Try to find punkt
            nltk.data.find('tokenizers/punkt')
        except LookupError:
            # Download punkt if not found
            nltk.download('punkt', quiet=True)
            
    def _fallback_sentence_split(self, text: str) -> List[str]:
        """
        Fallback method for sentence splitting when NLTK fails
        
        Args:
            text (str): Input text to split
            
        Returns:
            List[str]: List of sentences
        """
        # Simple rule-based sentence splitting
        potential_endings = ['. ', '! ', '? ', '.\n', '!\n', '?\n']
        sentences = []
        current_sentence = ""
        
        for char in text:
            current_sentence += char
            if any(current_sentence.endswith(end) for end in potential_endings):
                sentences.append(current_sentence.strip())
                current_sentence = ""
                
        if current_sentence.strip():  # Add any remaining text
            sentences.append(current_sentence.strip())
            
        return sentences

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents based on sentence boundaries with fallback mechanism
        
        Args:
            documents (List[Document]): Input documents
        
        Returns:
            List[Document]: Chunked documents
        """
        chunked_documents = []
        
        for doc in documents:
            try:
                # Try NLTK sentence tokenization first
                sentences = sent_tokenize(doc.page_content)
            except Exception as e:
                # Fall back to rule-based splitting if NLTK fails
                sentences = self._fallback_sentence_split(doc.page_content)
            
            # Create chunks of sentences
            for i in range(0, len(sentences), self.max_sentences - self.overlap_sentences):
                chunk_sentences = sentences[i:i + self.max_sentences]
                chunk_text = ' '.join(chunk_sentences)
                
                chunked_documents.append(
                    Document(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            'chunk_size': len(chunk_text),
                            'num_sentences': len(chunk_sentences)
                        }
                    )
                )
        
        return chunked_documents

class TokenChunker:
    def __init__(self, max_tokens: int = 500, overlap_tokens: int = 50, model_name: str = 'cl100k_base'):
        """
        Initialize token-based chunker
        
        Args:
            max_tokens (int): Maximum number of tokens per chunk
            overlap_tokens (int): Number of tokens to overlap between chunks
            model_name (str): Name of the tokenizer model
        """
        self.max_tokens = max_tokens
        self.overlap_tokens = overlap_tokens
        self.tokenizer = tiktoken.get_encoding(model_name)

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents based on token count
        
        Args:
            documents (List[Document]): Input documents
        
        Returns:
            List[Document]: Chunked documents
        """
        chunked_documents = []
        
        for doc in documents:
            # Tokenize the entire document
            tokens = self.tokenizer.encode(doc.page_content)
            
            # Create chunks based on token counts
            for i in range(0, len(tokens), self.max_tokens - self.overlap_tokens):
                chunk_tokens = tokens[i:i + self.max_tokens]
                chunk_text = self.tokenizer.decode(chunk_tokens)
                
                chunked_documents.append(
                    Document(
                        page_content=chunk_text,
                        metadata={
                            **doc.metadata,
                            'chunk_size': len(chunk_tokens)
                        }
                    )
                )
        
        return chunked_documents

class FixedSizeChunker:
    def __init__(self, chunk_size: int = 1000, overlap: int = 100):
        """
        Initialize fixed-size chunker
        
        Args:
            chunk_size (int): Size of each chunk in characters
            overlap (int): Number of characters to overlap between chunks
        """
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk_documents(self, documents: List[Document]) -> List[Document]:
        """
        Chunk documents into fixed-size pieces
        
        Args:
            documents (List[Document]): Input documents
        
        Returns:
            List[Document]: Chunked documents
        """
        chunked_documents = []
        
        for doc in documents:
            text = doc.page_content
            
            # Create chunks of fixed size
            for i in range(0, len(text), self.chunk_size - self.overlap):
                chunk_text = text[i:i + self.chunk_size]
                
                chunked_documents.append(
                    Document(
                        page_content=chunk_text,
                        metadata={**doc.metadata, 'chunk_size': len(chunk_text)}
                    )
                )
        
        return chunked_documents

# Update the ChunkerFactory to include new chunking methods
class ChunkerFactory:
    @staticmethod
    def create_chunker(method: str, max_tokens: int , token_overlap: int) -> object:
        """
        Create a chunker based on the selected method
        
        Args:
            method (str): Chunking method
            max_tokens (int): Maximum number of tokens per chunk
            token_overlap (int): Number of tokens to overlap between chunks
        
        Returns:
            object: Chunking object
        """

        if method == "agentic":
            return AgenticTextChunker(max_tokens, token_overlap)
        elif method == "recursive":
            return RecursiveChunker(max_tokens, token_overlap)
        elif method == "semantic":
            return SemanticChunker(max_tokens, token_overlap)
        elif method == "sentence":
            return SentenceChunker(max_tokens, token_overlap)
        elif method == "token":
            return TokenChunker(max_tokens, token_overlap)
        elif method == "fixed":
            return FixedSizeChunker(max_tokens, token_overlap)
        else:
            raise ValueError(f"Unknown chunking method: {method}")
