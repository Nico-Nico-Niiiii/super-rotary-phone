import torch
from IPython.display import display_markdown
from transformers import AutoTokenizer, AutoModelForCausalLM, BitsAndBytesConfig
from langchain.text_splitter import RecursiveCharacterTextSplitter
from transformers import pipeline
import transformers
from langchain.document_loaders import UnstructuredPDFLoader,PDFMinerLoader,TextLoader
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS

# Hugging Face model id
model_id = "meta-llama/Meta-Llama-3-8B-Instruct"
 
pipeline = transformers.pipeline(
    "text-generation",
    model=model_id,
    model_kwargs={
        "torch_dtype": torch.float16,
    },
    device_map="auto",
)

terminators =  [
    pipeline.tokenizer.eos_token_id,
    pipeline.tokenizer.convert_tokens_to_ids("<|eot_id|>")
]

### Pdf file Path for RAG
pdf_file_path = "/media/aipredators/Projects/SahilM/pdf/CORI.pdf"

class Llama3_8B_gen:
    def __init__(self,pipeline):
        self.pipeline= pipeline
        
    @staticmethod
    def generate_prompt(query,retrieved_text):
        messages = [
            {"role": "system", "content": "Instructions for Generating Test Scenarios:\n\nYou are tasked with generating comprehensive and relevant test scenarios for a given software requirement. The aim is to cover both positive and negative test scenarios that will help in verifying the system's functionality and robustness.\n\nUnderstand the Requirement: Carefully read the requirement, description, and rationale provided. This information outlines what the system should do and why it should do it.\nPositive Test Scenarios:\nThese scenarios should verify that the system behaves as expected under normal, valid conditions.\nFocus on typical use cases and ensure the scenarios cover all main functionalities.\nConsider various valid inputs, user actions, and expected system responses.\nWrite the positive test scenarios and respected test steps in detail.\n\nNegative Test Scenarios:\nThese scenarios should test how the system handles invalid, unexpected, or extreme conditions.\nInclude edge cases, error conditions, and scenarios that might cause the system to fail.\nEnsure that the system responds gracefully to invalid inputs and handles errors appropriately.\nWrite the positive test scenarios and respected test steps in detail.\n\nOutput Format:\nTest Scenario ID: Provide a unique identifier for each test scenario.\nTitle: Summarize the test scenario in a brief title.\nSteps: Write detailed steps with respect to scenario.\nExpected Result: Specify the expected outcome of the test.\n\nTask:\nGiven the requirement, description, and rationale provided below, generate comprehensive and relevant test scenarios. The test scenarios should include both positive and negative cases.\n\nBelow is context in which requirement, description, and rationale is described. \n\ncontext:\n{}\n\nBegin the generation now.\n".format(retrieved_text) },
            {"role": "user", "content": query},]
        return pipeline.tokenizer.apply_chat_template(messages, tokenize=False,add_generation_prompt=True)
    
    def generate(self,query,retrieved_context):
        prompt = self.generate_prompt(query ,retrieved_context)
        output =  pipeline(prompt,max_new_tokens=8000,eos_token_id=terminators,do_sample=True,
                            temperature=0.7,top_p=0.9,)         
        return output[0]["generated_text"][len(prompt):]
    
class Langchain_RAG:
    def __init__(self,pdf_file_path):
        # self.embeddings = HuggingFaceEmbeddings(model_name="BAAI/bge-small-en-v1.5")
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
        self.pdf_file_path = pdf_file_path
        print("loading pdf file , this may take time to process")
        self.loader = loader = PDFMinerLoader(self.pdf_file_path)   
        self.data = self.loader.load()
        print("<< pdf file loaded")
        print("<< chunking")
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=0, separators=[" ", ",", "\n"])
        self.texts = text_splitter.split_documents(self.data)
        print("<< chunked")
        self.get_vec_value= FAISS.from_documents(self.texts, self.embeddings)
        print("<< saved")
        self.retriever = self.get_vec_value.as_retriever(search_kwargs={"k": 4})
        
    def __call__(self,query):
        rev = self.retriever.get_relevant_documents(query) 
        return "".join([i.page_content for i in rev])

text_gen = Llama3_8B_gen(pipeline=pipeline)
retriever = Langchain_RAG(pdf_file_path=pdf_file_path)
 
def Rag_qa(query):
    retriever_context = retriever(query)
    resut = text_gen.generate(query,retriever_context)
    return resut
 
req = "Personalized Planning State Navigation" 
desc = "The software shall provide an option to enter the Personalized Planning state from a surgeon's Choose Case screen."
ratio = "This requirement ensures the user can access the personalized planning state from the correct page."
prompt = f"Requirement: {req}\n\nDescription: {desc}\n\nRationale: {ratio}"

out = Rag_qa(prompt)
print(out)