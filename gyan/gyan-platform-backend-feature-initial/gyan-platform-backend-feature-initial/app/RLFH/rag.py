from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.core.prompts.prompts import SimpleInputPrompt
from langchain.embeddings.huggingface import HuggingFaceEmbeddings
from llama_index.embeddings.langchain import LangchainEmbedding
from llama_index.embeddings.openai import OpenAIEmbedding
from llama_index.core.node_parser import SentenceSplitter
from llama_index.llms.openai import OpenAI
from llama_index.core import Settings
import csv
import torch
import os
import pandas as pd

documents=SimpleDirectoryReader("/media/shared/Anjali_RLHF/Anjali_RLHF/rl/Data").load_data()
documents

system_prompt="""
You are a customer service chatbot specialized in [AIR PURIFIER , MOLKEULE]. 
You must only answer questions directly related to this topic using the provided knowledge base. 
If a question is outside this scope — like personal opinions, general knowledge, or unrelated topics — clearly state that you can only answer questions about [AIR PURIFIER] and politely refuse to respond to unrelated queries.

Examples:
User: "what is Air purifier?"
Assistant: "Air Purifier is an air filter used to remove airborne microorganisms, viruses, and bacteria. It is usually installed in bathrooms and other public places to filter airborne bacteria, viruses, and fungal spores."

User: "What is Molekule?"
Assistant: Molekule is a leading air purifier manufacturer, offering a wide range of air purifiers for homes and businesses. "

User: "Why is the sky blue?"
Assistant: "I'm here to help with questions related to air purifier. Please reach out if you have any questions on that."

User: "What’s the capital of France?"
Assistant: "I specialize in assisting with [Air purifier] questions. If you have any queries related to that, feel free to ask."

"""

query_wrapper_prompt=SimpleInputPrompt("<|USER|>{query_str}<|ASSISTANT|>")



llm = HuggingFaceLLM(
    context_window=4096,
    max_new_tokens=256,
    generate_kwargs={"temperature": 0.0, "do_sample": False},
    system_prompt=system_prompt,
    query_wrapper_prompt=query_wrapper_prompt,
    tokenizer_name="meta-llama/Llama-2-7b-chat-hf",
    model_name="meta-llama/Llama-2-7b-chat-hf",
    device_map="auto",
    # uncomment this if using CUDA to reduce memory usage
    model_kwargs={"torch_dtype": torch.float16 , "load_in_8bit":True}
)

embed_model=LangchainEmbedding(
    HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2"))

Settings.llm = llm
Settings.embed_model = embed_model
Settings.node_parser = SentenceSplitter(chunk_size=1024, chunk_overlap=20)
Settings.num_output = 512
Settings.context_window = 4096

index=VectorStoreIndex.from_documents(documents)

query_engine=index.as_query_engine()

def process_and_save_responses(question):
    """Processes a question using RAG and saves the response to CSV."""
    
    response = query_engine.query(question)  # This returns a complex object
    
    # Extract response text from the RAG result
    if hasattr(response, "response"):  # Check if "response" attribute exists
        answer = str(response.response)
    else:
        answer = str(response)  # Convert entire response to string as a fallback

    # Save response and default reward (adjustable)
    save_to_csv([question, answer, "9"])  
    return answer



def save_to_csv(data):
    """Safely writes data to CSV."""
    file_exists = os.path.isfile("qa_rewards.csv")
    
    try:
        with open("qa_rewards.csv", mode='a', newline='') as file:
            writer = csv.writer(file)
            if not file_exists:
                writer.writerow(["question", "answer", "reward"])  # Write header
            writer.writerow([str(item) for item in data])  # Convert all to string before writing
    except Exception as e:
        print(f"Error writing to CSV: {str(e)}")