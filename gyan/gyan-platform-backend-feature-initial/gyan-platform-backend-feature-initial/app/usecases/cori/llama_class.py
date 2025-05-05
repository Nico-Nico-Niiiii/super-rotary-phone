import torch
from langchain.text_splitter import RecursiveCharacterTextSplitter
import transformers
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.vectorstores import FAISS
from langchain_community.document_loaders import PyPDFDirectoryLoader
import json


class Llama3_8B_gen:
    def __init__(self, model_id):
        try:
            self.pipeline = transformers.pipeline("text-generation", model=model_id, model_kwargs={"torch_dtype": torch.float16, "load_in_8bit":True}, device_map="auto", token="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")
            self.terminators = [self.pipeline.tokenizer.eos_token_id, self.pipeline.tokenizer.convert_tokens_to_ids("<|eot_id|>")]

        except Exception as e:
            print(f"Exception in Llama class - {e}")

    # @staticmethod
    def generate_prompt(self, system_prompt, query, retrieved_text):
        messages = [
            {"role": "system", "content": system_prompt.format(retrieved_text) },
            {"role": "user", "content": query}
            ]
        
        ans = self.pipeline.tokenizer.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
        return ans
    
    def generate(self, system_prompt, query, retrieved_context):
        try:
            prompt = self.generate_prompt(system_prompt,query ,retrieved_context)
            
            # print("Generated prompt", prompt)
            output = self.pipeline(prompt, max_new_tokens=8000, eos_token_id=self.terminators, do_sample=True, temperature=0.7, top_p=0.9,)  
                
            return output[0]["generated_text"][len(prompt):]
        
        except Exception as e:
            print(f"Error in Llama Generate Function - {e}")

        # finally:
        #     self.pipeline = None
        #     torch.cuda.empty_cache()

       


class Langchain_RAG:
    def __init__(self, pdf_file_path):
    
        self.embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-mpnet-base-v2")
        self.pdf_file_path = pdf_file_path
        print("loading pdf file , this may take time to process")
        # self.loader = loader = PDFMinerLoader(self.pdf_file_path)   
        self.loader = PyPDFDirectoryLoader(self.pdf_file_path)
        self.data = self.loader.load_and_split()
        print(len(self.data))
        # self.data = self.loader.load()
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