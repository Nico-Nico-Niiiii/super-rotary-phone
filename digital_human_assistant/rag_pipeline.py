"""Load documents, embed, create vector DB, and retrieve snippets."""
from __future__ import annotations
from typing import List
from pathlib import Path

from langchain_community.document_loaders import (
    TextLoader, PyPDFLoader, UnstructuredMarkdownLoader)
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings

from config import CONFIG

# Single global embedding model
EMBED = HuggingFaceEmbeddings(model_name=CONFIG.embed_model)

VECTOR_DB: Chroma | None = None


def _load_all_docs(data_path: Path):
    """Walk through *data_path* and load supported file types."""
    loaders = []
    for p in data_path.rglob("*"):
        if p.suffix.lower() in (".txt", ".md"):
            loaders.append(TextLoader(str(p)))
        elif p.suffix.lower() == ".pdf":
            loaders.append(PyPDFLoader(str(p)))
    docs = []
    for loader in loaders:
        docs.extend(loader.load())
    return docs


def build_vector_store(force: bool = False):
    """Create or load the persistent Chroma vector store."""
    global VECTOR_DB
    if VECTOR_DB and not force:
        return VECTOR_DB

    if CONFIG.chroma_path.exists() and not force:
        VECTOR_DB = Chroma(persist_directory=str(CONFIG.chroma_path), embedding_function=EMBED)
        return VECTOR_DB

    print("[RAG] Building Chroma index (first‑time)…")
    docs = _load_all_docs(CONFIG.data_dir)
    VECTOR_DB = Chroma.from_documents(documents=docs,
                                      embedding=EMBED,
                                      persist_directory=str(CONFIG.chroma_path))
    return VECTOR_DB


def retrieve(query: str, k: int = 4) -> List[str]:
    """Return *k* chunks most relevant to *query*."""
    vs = build_vector_store()
    matches = vs.similarity_search(query, k=k)
    return [m.page_content for m in matches]