from flask import request, jsonify
from werkzeug.utils import secure_filename
import torch
import os
import csv
import pandas as pd
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
os.environ['TF_FORCE_GPU_ALLOW_GROWTH'] = 'true'
from app.RAG.rag_pipeline import RAGPipeline

import zipfile
from peft import PeftModel, PeftConfig
import re
import json
import zipfile
from app.routes.rag import load_rag_database
from app.database.connection import get_db
from app.models.rag import RAGDatabase

'''
-------------------------------------Chatbots--------------------------------'''

class ChatbotModelHandler:
    # Class-level variables (shared across all instances)
    loaded_model = None
    loaded_tokenizer = None
    conversation_history = []
    prompt_data = None
    rag_data = None

    def __init__(self):
        # Path and config variables remain as instance variables
        # with open('config/path/path_config.json', 'r') as file:
        #     self.data = json.load(file)

        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)
        
        self.path = self.data["use_case"]["chatbot"]["model_path"]
        self.temp_path = self.data["use_case"]["chatbot"]["logs_path"]

    def get_files(self):
        return os.listdir(self.path)

    def extract_zip(self, zip_file_path, extract_path):
        with zipfile.ZipFile(zip_file_path, 'r') as zip_ref:
            zip_ref.extractall(extract_path)

    def prepare_input_data(self, file_paths, tokenizer, max_length):
        input_text = ""
        for file_path in file_paths:
            if file_path.endswith('.txt'):
                with open(file_path, 'r', encoding='utf-8') as file:
                    input_text += file.read().strip() + ' '
            elif file_path.endswith('.csv'):
                with open(file_path, 'r', encoding='utf-8') as file:
                    reader = csv.reader(file)
                    for row in reader:
                        input_text += ' '.join(row) + ' '

        inputs = tokenizer.encode("extract information: " + input_text, return_tensors="pt", max_length=max_length, truncation=True)
        return inputs

    def get_models(self):
        models = os.listdir(self.path)
        return models
    
    def unload_model(self):
        """
        Unload the currently loaded model and free up GPU resources.
        
        Returns:
            dict: A response indicating whether the unload was successful
        """
        try:
            # Check if a model is loaded
            if ChatbotModelHandler.loaded_model and ChatbotModelHandler.loaded_tokenizer is not None:
                # Delete the model to free up memory
                print("Helo from inside unload model")
                del ChatbotModelHandler.loaded_model
                del ChatbotModelHandler.loaded_tokenizer
                ChatbotModelHandler.loaded_model = None
                
                # Force garbage collection to release memory
                import gc
                gc.collect()
                
                # Clear CUDA cache if available
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                        print("CUDA memory cache cleared")
                    
                    # Additional CUDA optimization
                    if hasattr(torch.cuda, 'ipc_collect'):
                        torch.cuda.ipc_collect()
                    
                    # Reset peak memory stats for monitoring
                    if hasattr(torch.cuda, 'reset_peak_memory_stats'):
                        torch.cuda.reset_peak_memory_stats()
                except ImportError:
                    pass  # Torch not available
                    
                return {"success": True, "message": "Model successfully unloaded and CUDA memory cleared"}
            else:
                return {"success": True, "message": "No model was loaded"}
        except Exception as e:
            print(f"Error unloading model: {str(e)}")
            return {"success": False, "error": f"Failed to unload model: {str(e)}"}

    def load_model(self, selected_model):
        # data = request.json
        # selected_model = data['model']
        # selected_project = data['project']
        full_path = os.path.join(self.path, selected_model)

        if selected_model:
            # Load the model and tokenizer only if they are not already loaded
            if ChatbotModelHandler.loaded_model is None or ChatbotModelHandler.loaded_tokenizer is None:
                config = PeftConfig.from_pretrained(full_path)
                ChatbotModelHandler.loaded_model = AutoModelForSeq2SeqLM.from_pretrained(config.base_model_name_or_path, device_map={"": 0})
                ChatbotModelHandler.loaded_tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)
                ChatbotModelHandler.loaded_model = PeftModel.from_pretrained(ChatbotModelHandler.loaded_model, full_path, device_map={"": 0})
                ChatbotModelHandler.conversation_history.clear()
            
            return 'Model loaded successfully'
        else:
            return 'Error loading model'

    # def chatbot_inf(self, user_message):
    #     # data = request.json
    #     # user_message = data['message']

    #     if ChatbotModelHandler.loaded_model and ChatbotModelHandler.loaded_tokenizer:
    #         recent_history = ChatbotModelHandler.conversation_history[-10:]
    #         combined_prompt = f"{' '.join(recent_history)}\nUser: {user_message}\nBot:"

    #         if ChatbotModelHandler.prompt_data:
    #             combined_prompt += f" Prompt Type: {ChatbotModelHandler.prompt_data['promptType']}, Prompt Text: {ChatbotModelHandler.prompt_data['promptText']}"

    #         if ChatbotModelHandler.rag_data is not None and torch.is_tensor(ChatbotModelHandler.rag_data) and torch.numel(ChatbotModelHandler.rag_data) > 0:
    #             rag_text = ChatbotModelHandler.loaded_tokenizer.decode(ChatbotModelHandler.rag_data[0], skip_special_tokens=True)
    #             combined_prompt += f" RAG Data: {rag_text}"

    #         input_ids = ChatbotModelHandler.loaded_tokenizer(combined_prompt, return_tensors="pt", truncation=True).input_ids.cuda()
    #         outputs = ChatbotModelHandler.loaded_model.generate(input_ids=input_ids, max_new_tokens=500, do_sample=True, top_p=0.9, temperature=0.7)
    #         response = ChatbotModelHandler.loaded_tokenizer.batch_decode(outputs.detach().cpu().numpy(), skip_special_tokens=True)[0]
    #         response = re.sub(r'\b[Bb]ot:\s*', '', response)

    #         ChatbotModelHandler.conversation_history.append(f"User: {user_message}")
    #         ChatbotModelHandler.conversation_history.append(f"Bot: {response}")

    #         ChatbotModelHandler.conversation_history = ChatbotModelHandler.conversation_history[-10:]
    #     else:
    #         response = 'Model is not loaded. Please load the model first.'

    #     return response

    # def chatbot_inf(self, user_message, rag_name=None):
    #     """Generate response using model with optional RAG enhancement"""
    #     try:


    #         if not ChatbotModelHandler.loaded_model or not ChatbotModelHandler.loaded_tokenizer:
    #             return 'Model is not loaded. Please load the model first.'

    #         # Get recent conversation history
    #         recent_history = ChatbotModelHandler.conversation_history[-10:]
    #         combined_prompt = f"{' '.join(recent_history)}\nUser: {user_message}\nBot:"

    #         # Add prompt data if available
    #         if ChatbotModelHandler.prompt_data:
    #             combined_prompt += f" Prompt Type: {ChatbotModelHandler.prompt_data['promptType']}, Prompt Text: {ChatbotModelHandler.prompt_data['promptText']}"

    #         # Handle RAG if provided
    #         if rag_name:
    #             try:
                    

    #                 print(f"🔍 Using RAG database: {rag_name}")
    #                 # Initialize RAG components
    #                 rag_pipeline = RAGPipeline(
    #                     rag_type="standard",  # or get from config
    #                     llm_model=self.loaded_model,
    #                     embedding_model="sentence-transformers/all-MiniLM-L6-v2",  # or get from config
    #                     chunking_option="paragraph",  # or get from config
    #                     vector_db="chromadb",  # or get from config
    #                     search_option="brute_force",  # or get from config
    #                     database_name=rag_name,
    #                     load_only=True
    #                 )
                    
    #                 # Get context using RAG
    #                 context = rag_pipeline.retrieve_context(user_message)
    #                 if context:
    #                     context_text = "\n".join([doc.page_content for doc in context])
    #                     combined_prompt = f"""Context information:
    # {context_text}

    # Previous conversation:
    # {' '.join(recent_history)}

    # User: {user_message}
    # Bot:"""
    #                     print("✅ Added RAG context to prompt")
                    
    #             except Exception as e:
    #                 print(f"❌ Error using RAG: {str(e)}")
    #                 # Continue without RAG
            
    #         # Generate response
    #         input_ids = ChatbotModelHandler.loaded_tokenizer(
    #             combined_prompt, 
    #             return_tensors="pt", 
    #             truncation=True
    #         ).input_ids.cuda()
            
    #         outputs = ChatbotModelHandler.loaded_model.generate(
    #             input_ids=input_ids, 
    #             max_new_tokens=500, 
    #             do_sample=True, 
    #             top_p=0.9, 
    #             temperature=0.7
    #         )
            
    #         response = ChatbotModelHandler.loaded_tokenizer.batch_decode(
    #             outputs.detach().cpu().numpy(), 
    #             skip_special_tokens=True
    #         )[0]
            
    #         response = re.sub(r'\b[Bb]ot:\s*', '', response)

    #         # Update conversation history
    #         ChatbotModelHandler.conversation_history.append(f"User: {user_message}")
    #         ChatbotModelHandler.conversation_history.append(f"Bot: {response}")
    #         ChatbotModelHandler.conversation_history = ChatbotModelHandler.conversation_history[-10:]

    #         return response

    #     except Exception as e:
    #         print(f"❌ Error generating response: {str(e)}")
    #         return f"Error generating response: {str(e)}"

    
    def chatbot_inf(self, user_message, rag_config=None):
        """Generate response using model with optional RAG enhancement"""
        try:
            if not ChatbotModelHandler.loaded_model or not ChatbotModelHandler.loaded_tokenizer:
                return 'Model is not loaded. Please load the model first.'

            # Get recent conversation history
            recent_history = ChatbotModelHandler.conversation_history[-10:]
            combined_prompt = f"{' '.join(recent_history)}\nUser: {user_message}\nBot:"

            # Add prompt data if available
            if ChatbotModelHandler.prompt_data:
                combined_prompt += f" Prompt Type: {ChatbotModelHandler.prompt_data['promptType']}, Prompt Text: {ChatbotModelHandler.prompt_data['promptText']}"

            # Handle RAG if provided
            if rag_config:
                try:
                    print(f"🔍 Using RAG database: {rag_config['name']}")
                    # Initialize RAG components using configuration
                    rag_pipeline = RAGPipeline(
                        rag_type=rag_config['rag_type'],
                        llm_model=rag_config['llm_model'],
                        embedding_model=rag_config['embedding_model'],
                        chunking_option=rag_config['chunking_option'],
                        vector_db=rag_config['vector_db'],
                        search_option=rag_config['search_option'],
                        database_name=rag_config['name'],
                        load_only=True
                    )
                    
                    # Get context using RAG
                    context = rag_pipeline.retrieve_context(user_message)
                    if context:
                        context_text = "\n".join([doc.page_content for doc in context])
                        combined_prompt = f"""Context information:
    {context_text}

    Previous conversation:
    {' '.join(recent_history)}

    User: {user_message}
    Bot:"""
                        print("✅ Added RAG context to prompt")
                    
                except Exception as e:
                    print(f"❌ Error using RAG: {str(e)}")
                    # Continue without RAG
            
            try:
                # Clear CUDA cache before processing
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()

                # Generate response with error handling
                input_ids = ChatbotModelHandler.loaded_tokenizer(
                    combined_prompt, 
                    return_tensors="pt", 
                    truncation=True,
                    max_length=512  # Add max length to prevent too long sequences
                ).input_ids.cuda()
                
                with torch.no_grad():  # Add this to reduce memory usage
                    outputs = ChatbotModelHandler.loaded_model.generate(
                        input_ids=input_ids, 
                        max_new_tokens=500, 
                        do_sample=True, 
                        top_p=0.9, 
                        temperature=0.7,
                        pad_token_id=ChatbotModelHandler.loaded_tokenizer.pad_token_id,
                        eos_token_id=ChatbotModelHandler.loaded_tokenizer.eos_token_id
                    )
                
                # Move to CPU for decoding
                outputs = outputs.cpu()
                response = ChatbotModelHandler.loaded_tokenizer.batch_decode(
                    outputs.numpy(), 
                    skip_special_tokens=True
                )[0]
                
                response = re.sub(r'\b[Bb]ot:\s*', '', response)

                # Update conversation history
                ChatbotModelHandler.conversation_history.append(f"User: {user_message}")
                ChatbotModelHandler.conversation_history.append(f"Bot: {response}")
                ChatbotModelHandler.conversation_history = ChatbotModelHandler.conversation_history[-10:]

                return response

            except RuntimeError as e:
                print(f"CUDA Error: {str(e)}")
                # Try to recover by moving to CPU
                if torch.cuda.is_available():
                    torch.cuda.empty_cache()
                    ChatbotModelHandler.loaded_model = ChatbotModelHandler.loaded_model.cpu()
                    return self.chatbot_inf(user_message, rag_config)  # Retry on CPU
                raise

        except Exception as e:
            print(f"❌ Error generating response: {str(e)}")
            return f"Error generating response: {str(e)}"


    def submit_prompt(self, request):
        data = request.json
        ChatbotModelHandler.prompt_data = {
            'model': data['model'],
            'project': data['project'],
            'promptType': data['promptType'],
            'promptText': data['promptText']
        }
        return jsonify({'status': 'Prompt submitted successfully'})

    def submit_rag(self, request):
        model = request.form['model']
        project = request.form['project']
        file = request.files['file']

        if file and file.filename.endswith('.zip'):
            save_directory = self.temp_path
            if not os.path.exists(save_directory):
                os.makedirs(save_directory)

            filename = secure_filename(file.filename)
            file_path = os.path.join(save_directory, filename)
            file.save(file_path)

            extract_path = os.path.join(save_directory, filename.split('.')[0])
            self.extract_zip(file_path, extract_path)

            if ChatbotModelHandler.loaded_tokenizer is None:
                full_path = os.path.join(self.path, model, project)
                config = PeftConfig.from_pretrained(full_path)
                ChatbotModelHandler.loaded_tokenizer = AutoTokenizer.from_pretrained(config.base_model_name_or_path)

            file_paths = [os.path.join(root, f) for root, _, files in os.walk(extract_path) for f in files]
            input_data = self.prepare_input_data(file_paths, ChatbotModelHandler.loaded_tokenizer, max_length=512)

            ChatbotModelHandler.rag_data = input_data
            return jsonify({'status': 'RAG file submitted successfully'})
        else:
            return jsonify({'status': 'Invalid file format. Only ZIP files are allowed.'})


    def add_rlhf(self, json_data):
        """
        Save human feedback (RLHF) data to CSV
        """
        try:
            # Load request data
            question = json_data['question']
            answer = json_data['answer']
            rating = json_data['rating']
            vectorDB = json_data['vector_db']
            
            # Define the CSV file path
            csv_file = os.path.join(self.temp_path, 'rlhf_feedback.csv')
            os.makedirs(os.path.dirname(csv_file), exist_ok=True)
            
            # Check if file exists to determine if we need to write headers
            file_exists = os.path.isfile(csv_file)
            
            # Open the file in append mode
            with open(csv_file, 'a', newline='', encoding='utf-8') as f:
                fieldnames = ['sr_no', 'question', 'answer', 'rating', 'vectorDB']
                writer = csv.DictWriter(f, fieldnames=fieldnames)
                
                # Write header if file doesn't exist
                if not file_exists:
                    writer.writeheader()
                
                # Get the next sr_no
                sr_no = 1
                if file_exists:
                    with open(csv_file, 'r', encoding='utf-8') as read_f:
                        reader = csv.reader(read_f)
                        # Skip header
                        next(reader, None)
                        # Count rows
                        sr_no = sum(1 for row in reader) + 1
                
                # Write the data
                writer.writerow({
                    'sr_no': sr_no,
                    'question': question,
                    'answer': answer,
                    'rating': rating,
                    'vectorDB': vectorDB
                })
            
            return {"status": "success", "message": "RLHF data saved successfully"}
        
        except Exception as e:
            # logger.error(f"Error saving RLHF data: {str(e)}")
            return {"status": "error", "message": str(e)}
