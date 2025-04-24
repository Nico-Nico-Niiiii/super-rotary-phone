import os
import math
import click
import requests
from bs4 import BeautifulSoup

from langchain.chat_models import AzureChatOpenAI
from langchain.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import Chroma
from langchain.docstore.document import Document
from langchain.schema import SystemMessage, HumanMessage

# Set Azure OpenAI environment variables
os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"

# We'll do iterative summarization to avoid LLM token-limit overload.
# For that, we'll define some chunk-size parameters
MAX_CHUNK_TOKENS = 2000     # # tokens we allow from each chunk set
SUMMARY_TOKENS = 600        # tokens budget for each chunk summary
FINAL_SUMMARY_TOKENS = 1000 # tokens for the final summary step

###############################################################################
# 1) GPU-based Embedding Model
###############################################################################
# This embedding model runs on GPU if available (device="cuda").
# Choose a smaller or bigger Sentence Transformers model as you like.
embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2",
    model_kwargs={"device": "cuda"}  # or 'cpu' if you don't have a GPU
)

###############################################################################
# 2) Chroma Vector Store
###############################################################################
# We'll store the data in a local folder named "chroma_db" so it's persistent.
PERSIST_DIR = "chroma_db"
vectorstore = Chroma(
    collection_name="deep_research_chunks",
    embedding_function=embeddings,
    persist_directory=PERSIST_DIR
)

###############################################################################
# 3) Text Chunking Utility
###############################################################################
CHUNK_SIZE = 1000     # characters per chunk
CHUNK_OVERLAP = 200   # overlap between chunks

def chunk_text(text: str, chunk_size: int = CHUNK_SIZE, chunk_overlap: int = CHUNK_OVERLAP):
    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunk = text[start:end]
        chunks.append(chunk)

        start = end - chunk_overlap
        if start < 0:
            start = 0
        if start >= len(text):
            break
    return chunks

###############################################################################
# 4) Web Scraping
###############################################################################
def scrape_webpage(url: str) -> str:
    """
    Fetch the given URL and return its visible text (removing scripts/styles).
    """
    resp = requests.get(url, timeout=15)
    resp.raise_for_status()
    soup = BeautifulSoup(resp.text, "html.parser")
    for s in soup(["script", "style"]):
        s.decompose()
    return soup.get_text(separator="\n").strip()

###############################################################################
# 5) Add scraped, chunked documents to Chroma
###############################################################################
def add_url_to_chroma(url: str):
    """
    1) Scrape the URL.
    2) Chunk the text into overlapping segments.
    3) Store each chunk as a separate Document in Chroma.
    4) Persist the DB so it's saved on disk.
    """
    print(f"[Scraping] URL: {url}")
    raw_text = scrape_webpage(url)
    print(f" --> Raw text length: {len(raw_text)} characters")

    # Create overlapping chunks
    doc_chunks = chunk_text(raw_text, CHUNK_SIZE, CHUNK_OVERLAP)
    print(f" --> Created {len(doc_chunks)} chunk(s).")

    # Convert to Documents
    docs = []
    for i, chunk in enumerate(doc_chunks):
        metadata = {
            "source": url,
            "chunk_index": i
        }
        docs.append(Document(page_content=chunk, metadata=metadata))

    # Add to the vectorstore
    vectorstore.add_documents(docs)
    vectorstore.persist()
    print(f" --> Added {len(docs)} chunk-docs to Chroma.\n")

###############################################################################
# 6) Iterative Summaries to Avoid LLM Overload
###############################################################################
def call_azure_openai_chat(messages, max_tokens=1000, temperature=0.2):
    """
    Helper function to call an Azure OpenAI Chat model with the given messages.
    """
    llm = AzureChatOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        deployment_name=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
        temperature=temperature,
        max_tokens=max_tokens
    )
    response = llm(messages)
    return response.content.strip()

def summarize_chunk_set(chunk_set, user_query):
    """
    Summarize a single set of chunk texts (combined) into a partial summary.
    """
    # Combine chunk texts
    combined_text = "\n\n".join(chunk_set)

    system_prompt = (
        "You are a helpful research assistant. Summarize the following text in detail, "
        "focusing on any relevance to the user's query. Keep the summary concise enough "
        "to fit within token limits, but retain important details."
    )
    user_prompt = f"User's Query: {user_query}\n\nText:\n{combined_text}"

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]

    summary = call_azure_openai_chat(messages, max_tokens=SUMMARY_TOKENS)
    return summary

def iterative_summarize(chunks, user_query):
    """
    For a large set of chunk texts, we group them so that each group won't exceed
    the LLM's token limit. Then we produce partial summaries, and finally combine
    those partials into a final summary.
    """
    # In a perfect world, we measure tokens precisely. 
    # For demonstration, let's assume each chunk is small enough to combine several safely.
    # We'll just group them in sets of 5 or so.
    group_size = 5
    partial_summaries = []

    current_set = []
    for chunk in chunks:
        current_set.append(chunk)
        if len(current_set) >= group_size:
            part_summary = summarize_chunk_set(current_set, user_query)
            partial_summaries.append(part_summary)
            current_set = []

    # Summarize any remainder
    if current_set:
        part_summary = summarize_chunk_set(current_set, user_query)
        partial_summaries.append(part_summary)

    # Now combine partial summaries into one final summary
    big_combined_text = "\n\n".join(partial_summaries)
    system_prompt = (
        "Combine these partial summaries into one comprehensive final report. "
        "Ensure it is detailed, covers all main points, and ties everything together."
    )
    user_prompt = f"User's Query: {user_query}\n\nPARTIAL SUMMARIES:\n{big_combined_text}"

    messages = [
        SystemMessage(content=system_prompt),
        HumanMessage(content=user_prompt)
    ]
    final_summary = call_azure_openai_chat(messages, max_tokens=FINAL_SUMMARY_TOKENS)
    return final_summary

###############################################################################
# 7) Generating a "Deep Research" report from DB
###############################################################################
def generate_deep_report(user_query: str):
    """
    1) Retrieve a large set of relevant chunks from Chroma.
    2) Summarize them in small groups (partial summaries).
    3) Combine partial summaries into a final comprehensive report
       without exceeding token limits.
    """
    # Let's retrieve a fairly large set to ensure we get broad coverage
    # but not so large that it's guaranteed to blow up token usage.
    # You can tune 'k' as you see fit.
    k = 40
    relevant_docs = vectorstore.similarity_search(user_query, k=k)

    # Gather the chunk texts
    chunk_texts = [doc.page_content for doc in relevant_docs]

    # Summarize in an iterative manner
    final_report = iterative_summarize(chunk_texts, user_query)
    return final_report

###############################################################################
# 8) CLI
###############################################################################
@click.group()
def cli():
    """
    A CLI tool for GPU-based embeddings + Chroma DB storage.
    """


@cli.command()
@click.argument("url")
def scrape(url):
    """
    Scrape a URL, chunk it, store in Chroma with GPU-based embeddings.
    """
    add_url_to_chroma(url)


@cli.command()
@click.argument("query")
def report(query):
    """
    Generate a deep research report for a given query, 
    pulling from chunked data in Chroma, 
    iteratively summarizing to avoid token overload.
    """
    final_report = generate_deep_report(query)
    click.echo("\n==== DEEP RESEARCH REPORT ====\n")
    click.echo(final_report)
    click.echo("\n==============================\n")


if __name__ == "__main__":
    cli()