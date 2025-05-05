import os
import re
import sys
import spacy
import torch
import zipfile
import logging
import tempfile
import json
import numpy as np
import subprocess
from bs4 import BeautifulSoup
from collections import defaultdict

from transformers import AutoModelForCausalLM, AutoTokenizer
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

from llama_index.core import VectorStoreIndex, SimpleDirectoryReader
from llama_index.llms.huggingface import HuggingFaceLLM
from llama_index.core import Settings

from llama_index.embeddings.fastembed import FastEmbedEmbedding
from llama_index.core import PromptTemplate
# from huggingface_hub.hf_api import HfFolder

from src.cori_device_test.PDF_ops import PDF
# from jira import JIRA, JIRAError

logging.basicConfig(stream=sys.stdout, level=logging.INFO)
logging.getLogger().addHandler(logging.StreamHandler(stream=sys.stdout))


class CORI_DeviceTest:
    def __init__(self):
        self.pdf = PDF()
        # Save Hugging Face token
        # HfFolder.save_token('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')

        # Add Path Config
        with open('config/path/path_config.json', 'r') as file:
                self.data = json.load(file)      
        
        self.model_path = self.data["use_case"]["cori_device_logs"]["model_path"]
        self.pdf_path = self.data["use_case"]["cori_device_logs"]["pdfs_path"]
        self.zip_path = self.data["use_case"]["cori_device_logs"]["zip_path"]

        # # Directory to save attachments
        # self.attachment_dir = "static/jira_attachments"
        # os.makedirs(self.attachment_dir, exist_ok=True)

        # Load documents
        self.documents = SimpleDirectoryReader(self.pdf_path).load_data()

        # Set up prompt templates
        self.system_prompt = "You are a Q&A assistant. Your goal is to answer questions as accurately as possible based on the instructions and context provided."
        self.query_wrapper_prompt = PromptTemplate("{query_str}")

    def load_model(self):
        print("In load model function")

        model = AutoModelForCausalLM.from_pretrained(
            self.model_path,
            device_map="auto",
            torch_dtype=torch.float16,
            load_in_8bit=True
        )

        tokenizer = AutoTokenizer.from_pretrained(self.model_path)
        
        # Set up Hugging Face LLM
        llm = HuggingFaceLLM(
            context_window=8192,
            max_new_tokens=256,
            generate_kwargs={"temperature": 0.7, "do_sample": False},
            system_prompt=self.system_prompt,
            query_wrapper_prompt=self.query_wrapper_prompt,
            tokenizer_name=tokenizer,
            model_name=model,
        )

        print("llm set ############################")
        Settings.llm = llm
        Settings.chunk_size = 512

        # Set up embedding model
        self.embed_model = FastEmbedEmbedding(model_name="BAAI/bge-small-en-v1.5")
        Settings.embed_model = self.embed_model
        Settings.chunk_size = 512

        # Load models once globally to avoid reloading in every function call
        self.nlp = spacy.load("en_core_web_sm")
        self.cleaning_model = SentenceTransformer('paraphrase-MiniLM-L6-v2')

        # Create index and query engine
        self.index = VectorStoreIndex.from_documents(self.documents)
        self.query_engine = self.index.as_query_engine()


    def infer_from_zip(self, zip_file): 
        self.load_model()
        description_text=""
        crc_id=""

        # dir_path='static/jira_attachments/'
        zip_file = self.zip_path + zip_file.filename
        zip_file.save(zip_file)
        extraction_dir = self.extract_zip(zip_file)
        print(f"Files extracted to: {extraction_dir}")

        # Replace 'file_path' with the path to your Word document file (.doc)
        doc_file_path = self.zip_path + ((zip_file.filename).split('.zip'))[0]+".doc"
        find_doc = self.find_doc_file(self.zip_path, ((zip_file.filename).split('.zip'))[0]+".doc")
        document_text = self.read_doc_file(find_doc)

        if document_text:
            cleaned_text = self.clean_text(document_text)
            soup = BeautifulSoup(cleaned_text, 'html.parser')

            crc_id = self.find_crc_id(soup)
            description_text = self.find_description(soup)

            if crc_id:
                print(crc_id)
            else:
                print("CRC ID not found.")

            if description_text:
                print(description_text)
            else:
                print("Description content not found.")
        else:
            print("No text extracted from the document.")



        # Step 2: Search for xsession.log file inside the extracted folder and its subdirectories
        xsession_file = self.find_xsession_file(extraction_dir)
        if xsession_file:
            print(f"xsession file found at: {xsession_file}")
            # Step 3: Use the xsession file found to count occurrences of each error code
            error_codes = [
                "BAD_INPUT_ARGUMENT",
                "BAD_LIBRARY_USE",
                "BAD_CONFIGURATION_FILE",
                "BAD_CHECKSUM_CONFIGURATION_FILE",
                "UNEXPECTED_LIBRARY_ERROR",
                "UNEXPECTED_FIRMWARE_ERROR",
                "ILLEGAL_CONTROLLER_STATE_TRANSITION",
                "NETWORK_TIMEOUT",
                "BAD_NETWORK_CHECKSUM",
                "BAD_NETWORK_SOCKET",
                "BAD_NETWORK_FORMAT",
                "BAD_NETWORK_SYNC",
                "BOARD_SUPPLY_UNDERVOLTAGE",
                "BOARD_SUPPLY_OVERVOLTAGE",
                "DRILL_DRIVER_FAULT",
                "EXPOSURE_DRIVER_FAULT",
                "DRILL_CURRENT_SENSE_ERROR",
                "EXPOSURE_CURRENT_SENSE_ERROR",
                "DRILL_COMMUNICATION_DRIVER_ERROR",
                "MCU_SYSTEM_ERROR",
                "DRILL_DRIVER_OVERHEAT",
                "DRILL_DRIVER_OVERCURRENT",
                "EXPOSURE_DRIVER_OVERHEAT",
                "TOOL_OVERHEAT",
                "EXPOSURE_MOTOR_STALL",
                "DRILL_MOTOR_STALL",
                "TOOL_DISCONNECTED",
                "TOOL_IDENTIFICATION_FAILURE",
                "TOOL_NOT_SUPPORTED",
                "TOOL_HOMING_FAILURE",
                "BAD_EXPOSURE_SENSOR_SUPPLY",
                "BAD_EXPOSURE_POSITION_SENSOR",
                "BAD_EXPOSURE_SENSOR_COMBINATION",
                "EXPOSURE_POSITION_OUT_OF_RANGE",
                "EXPOSURE_MOTOR_INDEXING_FAILURE",
                "BAD_TOOL_TEMPERATURE_SENSOR",
                "TOOL_PROGRAMMING_FAILURE",
                "BAD_FOOT_CONTROL_SUPPLY",
                "FOOT_CONTROL_DISCONNECTED",
                "BAD_SPEED_CONTROL_PEDAL",
                "NETWORK_WATCHDOG_TIMEOUT",
                "NO_TOOL_CONTROLLER_ERROR"
                # Add more error codes as needed
            ]

            error_occurrences = self.count_error_occurrences(xsession_file, error_codes)

            # Step 4: Determine the error code with the highest occurrence
            if error_occurrences:
                most_common_error = max(error_occurrences, key=error_occurrences.get)
                print(f"Most common error code: {most_common_error}")

                # Step 5: Use the print_lines_from_keyword function with the most common error code
                output_file = os.path.join(extraction_dir, "pfs_info_and_error_log.txt")

                extracted_logs = self.print_lines_from_keyword(xsession_file, most_common_error, output_file, error_codes)
                # error_logs = extracted_logs.split('\n')
            else:
                extracted_logs = "No error codes found in the xsession log."
                print("No error codes found in the xsession log.")
        else:
            print("xsession file not found. Please ensure the ZIP file contains the necessary files.")

        log_file_path = self.zip_path + crc_id.split(': ')[1]+ '/pfs_info_and_error_log.txt'
        output_path = 'pdfs/xsession.pdf'
        self.log_to_pdf(log_file_path, output_path)

        infer_response = self.query_engine.query(str(description_text))

        infer_response = self.trim_output(str(infer_response))
        print("Dessss",infer_response)
        navio_path = self.find_navio_file(root_folder=extraction_dir)
        print("Navio path",navio_path)
        cori_version, case_date, case_id, tool_info = self.get_data(xsession_file, navio_path, doc_file_path)

        cleaned_second_paragraph = self.clean_paragraph(description_text, infer_response)

        dup_cleaned = self.remove_repeated_sentences(cleaned_second_paragraph)

        cleaned_output = self.detect_and_correct_sentence_repetitions(dup_cleaned, threshold=0.8)
        output = " ".join(cleaned_output)

        return description_text, crc_id, extracted_logs, output, cori_version, case_date, case_id, tool_info


    def remove_repeated_sentences(self, paragraph):
        # Split the paragraph into sentences
        sentences = paragraph.split('.')

        # Use a set to track unique sentences
        unique_sentences = set()
        result = []

        for sentence in sentences:
            if sentence not in unique_sentences:
                unique_sentences.add(sentence)
                result.append(sentence)

        # Join the unique sentences back into a paragraph
        return '. '.join(result) + '.'

    def normalize_text(self, text):
        """Normalize the text by removing extra spaces and ensuring uniform formatting."""
        # Remove leading and trailing spaces
        text = text.strip()
        # Replace multiple spaces with a single space
        text = re.sub(r'\s+', ' ', text)
        # Remove spaces before and after punctuation marks
        text = re.sub(r'\s*([.,;!?])\s*', r'\1', text)
        return text

    def clean_paragraph(self, description, result):
        # Normalize both description and result
        normalized_description = self.normalize_text(description)
        normalized_result = self.normalize_text(result)

        # Split normalized texts into words
        desc_words = re.split(r'(\W)', normalized_description)
        result_words = re.split(r'(\W)', normalized_result)

        # Remove matching words from result
        cleaned_result = []
        desc_index = 0
        while desc_index < len(desc_words) and result_words:
            if desc_words[desc_index] == result_words[0]:
                desc_index += 1
                result_words.pop(0)
            else:
                cleaned_result.append(result_words.pop(0))

        # Join cleaned words back into a string
        cleaned_result_text = ''.join(cleaned_result)

        return cleaned_result_text

    def trim_output(self, output):
        if not output.endswith('.'):
            index = output.rfind('.')
            if index != -1:
                output = output[:index+1]
        return output

    def count_error_occurrences(self, file_path, error_codes):
        occurrences = defaultdict(int)

        with open(file_path, 'r',encoding='utf-8', errors='ignore') as file:

            lines = file.readlines()

        for line in lines:
            for error_code in error_codes:
                if error_code in line:
                    occurrences[error_code] += 1

        return occurrences

    def save_lines_to_file(self, output_file, lines):
        with open(output_file, 'w') as file:
            for line in lines:
                file.write(line + '\n')

    def print_lines_from_keyword(self, file_path, keyword, output_file, error_codes):
        with open(file_path, 'r',encoding='utf-8', errors='ignore') as file:

            lines = file.readlines()

        keyword_found = False
        output_lines = []

        for i, line in enumerate(lines):
            if keyword in line:
                keyword_found = True
                output_lines.append(line.strip())  # Add the line with the keyword

                # Search for "PFS INFO" and "PFS ERROR" immediately after the keyword
                for j in range(i + 7, len(lines)):
                    if "[PFS INFO]" in lines[j] or "[PFS ERROR]" in lines[j]:
                        output_lines.append(lines[j].strip())
                    elif any(code in lines[j] for code in error_codes):
                        # If another error code is found, continue collecting "PFS INFO" and "PFS ERROR"
                        continue
                    else:
                        # If no relevant line is found, break the loop
                        break

        if not keyword_found:
            output_lines.append(f"\nKeyword '{keyword}' not found in the file.")

        # Save the collected lines to the output file
        self.save_lines_to_file(output_file, output_lines)
        return output_lines


    def log_to_pdf(self, log_file_path, output_path):
        self.pdf.add_page()

        with open(log_file_path, 'r') as log_file:
            lines = log_file.readlines()

        for i, line in enumerate(lines, 1):
            formatted_line = f'{i}: {line.strip()}'
            self.pdf.chapter_body(formatted_line)

        self.pdf.output(output_path)


    def extract_zip(self, zip_file):
        # Extract files from zip_file to a temporary directory
        extraction_dir = os.path.splitext(zip_file)[0]  # Use zip file name without extension as extraction directory
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(extraction_dir)

        return extraction_dir

    def find_xsession_file(self, root_folder):
        print("ROOOOOOOT", root_folder)
        # Traverse through all directories within root_folder to find xsession.log file
        for dirpath, _, filenames in os.walk(root_folder):
            for filename in filenames:
                if filename == 'xsession.log':
                    return os.path.join(dirpath, filename)
                elif filename == 'NAVIO.log':
                    return os.path.join(dirpath, filename)
        return None

    def find_navio_file(self, root_folder):
        print("ROOOOOOOT",root_folder)
        # Traverse through all directories within root_folder to find xsession.log file
        for dirpath, _, filenames in os.walk(root_folder):
            for filename in filenames:
                if filename == 'naviosystem.log':
                    return os.path.join(dirpath, filename)
                # elif filename == 'NAVIO.log':
                #     return os.path.join(dirpath, filename)
        return None

    def find_doc_file(self,root_folder,doc_file_name):
        # Traverse through all directories within root_folder to find xsession.log file
        for dirpath, _, filenames in os.walk(root_folder):
            for filename in filenames:
                if filename == doc_file_name:
                    return os.path.join(dirpath, filename)

        return None

    def clean_text(self, text):
        # Remove non-printable characters
        cleaned_text = ''.join(char for char in text if char.isprintable() or char in '\n\t\r')
        return cleaned_text

    def find_description(self, soup):
        # Find the description text within the specific <td id="descriptionArea">
        description_tag = soup.find('td', id='descriptionArea')
        if description_tag:
            return description_tag.get_text(strip=True)
        else:
            return None

    def find_crc_id(self, soup):
        # Find the CRC ID from the document title or header
        title_tag = soup.find('h3', class_='formtitle')
        if title_tag:
            match = re.search(r'\[CRC-(\d+)\]', title_tag.text)
            if match:
                return f"CRC ID: CRC-{match.group(1)}"

        return None

    def detect_and_correct_sentence_repetitions(self, text, threshold=0.8):
        """Detect and remove repetitive sentences, then paraphrase cleaned sentences."""
        # Tokenize text into sentences
        sentences = [sent.text.strip() for sent in self.nlp(text).sents if sent.text.strip()]

        # Generate sentence embeddings
        sentence_embeddings = self.cleaning_model.encode(sentences)

        # Compute similarity matrix
        similarity_matrix = cosine_similarity(sentence_embeddings)

        # Detect redundant sentences
        repetitive_sentences = set()
        for i in range(len(sentences)):
            for j in range(i + 1, len(sentences)):
                if similarity_matrix[i][j] > threshold:
                    repetitive_sentences.add(sentences[j])

        # Remove redundant sentences
        unique_sentences = [sent for sent in sentences if sent not in repetitive_sentences]

        # Paraphrase cleaned sentences
        """corrected_output = []
        for sentence in unique_sentences:
            corrected_sentence = paraphrase_sentence(sentence)
            corrected_output.append(corrected_sentence)"""

        return unique_sentences  # List of cleaned and paraphrased sentences


    def read_doc_file(self, file_path):
        if not os.path.exists(file_path):
            print("File not found.")
            return ""

        try:
            # Create a temporary file to store the text extracted from .doc
            temp_file = tempfile.NamedTemporaryFile(delete=False, mode='w', encoding='utf-8')
            subprocess.run(['catdoc', '-w', file_path], stdout=temp_file)
            temp_file.close()

            # Read the extracted text from temporary file
            with open(temp_file.name, 'r', encoding='utf-8') as f:
                doc_text = f.read()

            # Delete the temporary file
            os.remove(temp_file.name)

            return doc_text
        except Exception as e:
            print("An error occurred:", e)
            return ""


    def extract_cori_info(log_file):
        cori_version_pattern = r"CORI-v[\d.]+"
        case_date_pattern = r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}"
        case_id_pattern = r'caseid\s*"([A-F0-9]{32}|[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12})"'
        tool_info_pattern = r"--------------- Start Tool Info --------------(.*?)--------------- End Tool Info --------------"

        cori_version = None
        case_date = None
        case_id = None
        tool_info = None

        with open(log_file, 'r') as file:

            try:
                content = file.read()
            except UnicodeDecodeError as e:
                return cori_version, case_date, case_id, tool_info

            # Extracting CORI Version if not already found
            if not cori_version:
                cori_version_match = re.search(cori_version_pattern, content)
                if cori_version_match:
                    cori_version = cori_version_match.group()

            # Extracting Case Date if not already found
            if not case_date:
                case_date_match = re.search(case_date_pattern, content)
                if case_date_match:
                    case_date = case_date_match.group()

            # Extracting Case ID if not already found
            if not case_id:
                case_id_match = re.search(case_id_pattern, content)
                if case_id_match:
                    case_id = case_id_match.group()

            # Extracting Tool Info if not already found
            if not tool_info:
                tool_info_match = re.search(tool_info_pattern, content, re.DOTALL)
                if tool_info_match:
                    tool_info = tool_info_match.group(1).strip()

            if tool_info:
                # tool_info = tool_info.group(1).strip()
                tool_info_normalized = re.sub(r'\s{2,}', ' ', tool_info.replace('\n', ' '))
                # Splitting based on "Handpiece" keyword to ensure each line is separated properly
                tool_info_lines = re.split(r'(?<=\d)\s+(?=\w)|(?<=\d)(?=Handpiece)', tool_info_normalized)
                formatted_tool_info = [line.strip() for line in tool_info_lines if line.strip()]
                tool_info_result = '\n'.join(formatted_tool_info)
            else:
                tool_info_result = "Handpiece information is not available"

        return cori_version, case_date, case_id, tool_info_result

    
    def display_handpiece_info(self, tool_info):
        # Function to handle "Handpiece is not available" message
        if tool_info:
            print(tool_info)
        else:
            print("Handpiece is not available")

    def extract_complaint_id_from_html(html_content):
        soup = BeautifulSoup(html_content, 'html.parser')

        # Initialize complaint ID and CRC ID
        complaint_id = ""
        crc_id = ""

        # Extracting from <title> tag
        title_tag = soup.title
        if title_tag:
            title_text = title_tag.get_text(strip=True)
            match = re.search(r"\[#CRC-(\d+)\]", title_text)
            if match:
                crc_id = match.group(1)

        # Find all <b> tags
        b_tags = soup.find_all('b')

        # Iterate through <b> tags to find "Complaints ID:"
        for b_tag in b_tags:
            if b_tag.text.strip().lower() == "complaints id:":
                # Look for the next <td> tag which contains the complaint ID
                next_td_tag = b_tag.find_next('td', class_='value')
                if next_td_tag:
                    # Extract the complaint ID using a regex that allows for variable length
                    text = next_td_tag.get_text(strip=True)
                    match = re.search(r"(?i)case-\d{4,}-\d{8}-?\d?", text)  # (?i) makes it case-insensitive
                    if match:
                        complaint_id = match.group()
                    break

        return f"{crc_id} - {complaint_id}".strip()

    # Main script execution
    def get_data(self, xsession_log_file, naviosystem_log_file, doc_file):
        # Define log file paths
        # xsession_log_file = "CRC-138/xsession.log"
        # naviosystem_log_file = "CRC-138/naviosystem.log"
        # doc_file = "CRC-138/CRC-138.doc"

        # Extract information from log files
        cori_version, case_date, case_id, tool_info = self.extract_cori_info(xsession_log_file)

        # If not all information is found in xsession.log, search in naviosystem.log for missing information
        if not all([cori_version, case_date, case_id, tool_info]):
            cori_version_nav, case_date_nav, case_id_nav, tool_info_nav = self.extract_cori_info(naviosystem_log_file)

            # Preserve values found in xsession.log if not found in naviosystem.log
            cori_version = cori_version or cori_version_nav
            case_date = case_date or case_date_nav
            case_id = case_id or case_id_nav
            tool_info = tool_info or tool_info_nav

        # Print extracted information from log files
        print("CORI Version:", cori_version)
        print("Case Date:", case_date)
        if case_id:
            parts = case_id.split()
            if len(parts) > 1:
                print("Case ID:", parts[1])  # Extracting just the ID part without "caseid"
            else:
                print("Case ID:", parts[0])  # Fallback if no split occurred correctly
        else:
            print("Case ID:", case_id)

        # Display Tool Info or "Handpiece is not available"
        print("Handpiece Information:")
        self.display_handpiece_info(tool_info)

        # Extract information from .doc file
        document_text = self.read_doc_file(doc_file)
        if document_text:
            complaint_id = self.extract_complaint_id_from_html(document_text)

            if complaint_id:
                print("Complaint ID from DOC file:", complaint_id)
            else:
                print("Complaint ID not found in DOC file.")
        else:
            print("No text extracted from the DOC file.")

        return cori_version, case_date, case_id, tool_info