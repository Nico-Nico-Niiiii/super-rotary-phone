import os
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "True"
import warnings
warnings.filterwarnings("ignore", category=DeprecationWarning) 

from datetime import datetime
from .llama_class import Llama3_8B_gen, Langchain_RAG
import pandas as pd
import json
from io import BytesIO 
import torch
import re

class CORI_TestCases:
    def __init__(self):
        with open('/media/sahil/data1/gyan_backend/app/cfg/path/path_config.json', 'r') as file:
                self.data = json.load(file)        
        
        self.model_path = self.data["use_case"]["cori"]["model_path"]
        # self.dataset_path = self.data["use_case"]["cori"]["dataset_path"]
        self.documents_path = self.data["use_case"]["cori"]["document_path"]
        self.logs_path = self.data["use_case"]["cori"]["logs_path"]

        # Set the history filename to save in logs_path
        self.history_filename = os.path.join(self.logs_path, 'chat_history.xlsx')
        # Ensure the logs path exists
        os.makedirs(self.logs_path, exist_ok=True)

    def extract_information_from_excel(self, data):
        # df = pd.read_excel(excel_file_path)
        
        # Check if all required columns are present
        required_columns = ['Requirement']
        for col in required_columns:
            if col not in data.columns:
                raise KeyError(f"Column '{col}' not found in the Excel file.")
        
        # Extract information from columns
        requirements = data['Requirement'].tolist()
       
        descriptions = data['Description'].tolist() if 'Description' in data.columns else ["Description is not available" for _ in range(len(data))]
        rationale = data['Rationale'].tolist() if 'Rationale' in data.columns else ["Rationale is not available" for _ in range(len(data))]
        user_story = data['User Story'].tolist() if 'User Story' in data.columns else ["User-Story is not available" for _ in range(len(data))]

        return requirements, descriptions, rationale, user_story

    def rag_qa(self, system_prompt, query, text_gen):
        retriever = Langchain_RAG(pdf_file_path=self.documents_path)  
        print("Retriver created")
        retriever_context = retriever(query)
        result = text_gen.generate(system_prompt, query, retriever_context)
        
        # print("Result from RAGQA", result)
        return result

    def infer_cori(self, excel_contents):
        df = pd.read_excel(BytesIO(excel_contents))

        # Extract relevant information from file1 (Excel)
        requirements, descriptions, rationale, userstory = self.extract_information_from_excel(df)

        system_prompt = self.get_system_prompt()

        text_gen = Llama3_8B_gen(self.model_path)
        results = {}
        num_items = len(requirements)
        
        for i in range(num_items):
            req = requirements[i]
            desc = descriptions[i]
            ration = rationale[i]
            user= userstory[i]
            
            query = f"""
            Requirement: {req}
            Description: {desc}
            Rationale: {ration}
            User Story: {user}
            """
            response = self.rag_qa(system_prompt, query, text_gen)

            # Format the response
            results[req] = response.replace("\n", "<br>").replace("\t", "&nbsp;" * 4)  # Previous call
            # results[req] = self.parse_output_to_json(response)

            print("Result from infer_Cori", results)

            print("#### Excel file check")

            # Use self.history_filename instead of local variable
            if os.path.exists(self.history_filename):
                history_df = pd.read_excel(self.history_filename)
            else:
                # Create a new DataFrame if the file doesn't exist
                history_df = pd.DataFrame(columns=['Timestamp', 'Requirement', 'Description', 'User Story', 'Response'])
                print("#### Excel file created")

            current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            # print(f"### Current time: {current_time}")

            new_entries = []

            # Check if the requirement exists in results before accessing it
            if requirements[i] in results:
                # print(f"Result: {results[requirements[i]]}")

                # Append a new entry to new_entries
                new_entries.append({
                    'Timestamp': current_time,
                    'Requirement': requirements[i],
                    'Description': descriptions[i],
                    'User Story': userstory[i],
                    'Response': results[requirements[i]]
                })
            else:
                print(f"Result for {requirements[i]} not found in results.")

            # print("#### Added to history")

            # Convert new_entries to DataFrame and concatenate with history_df
            new_df = pd.DataFrame(new_entries)
            history_df = pd.concat([history_df, new_df], ignore_index=True)

            # Write the updated DataFrame to Excel file
            history_df.to_excel(self.history_filename, index=False)
            # print("#### Saved to file")

        text_gen.pipeline = None
        torch.cuda.empty_cache()
        
        return {
            "results": results,
            "requirements": requirements,
            "descriptions": descriptions,
            "rationales": rationale,
            "userstory": userstory,
            "num_items": num_items
        }

    # def parse_output_to_json(self, response_text):
    #     test_cases = []
        
    #     # Split response into individual test scenarios
    #     scenarios = re.split(r"\n\d+\. \*\*Test Scenario ID:\*\*", response_text)[1:]
        
    #     for i, scenario in enumerate(scenarios, start=1):
    #         # Extract title
    #         title_match = re.search(r'\*\*Title:\*\* (.*?)\n', scenario)
    #         title = title_match.group(1) if title_match else f"Test Case {i}"
            
    #         # Extract steps
    #         steps_match = re.search(r'\*\*Steps:\*\*(.*?)\n\*\*Expected Result:', scenario, re.S)
    #         if steps_match:
    #             steps = [re.sub(r'^\d+\.\s*', '', step.strip()) for step in steps_match.group(1).split('\n') if step.strip()]
    #         else:
    #             steps = []
            
    #         # Extract expected result
    #         expected_result_match = re.search(r'\*\*Expected Result:\*\* (.*?)\n', scenario)
    #         expected_result = expected_result_match.group(1) if expected_result_match else ""
            
    #         # Append structured data
    #         test_cases.append({
    #             "id": i,
    #             "name": title,
    #             "steps": steps,
    #             "expectedResult": expected_result
    #         })
        
    #     # print("Created JSON - ", test_cases)
    #     return test_cases
    #     # return json.dumps(test_cases, separators=(',', ':'))


    def get_system_prompt(self):
        prompt = "Instructions for Generating Test Scenarios:\n\nYou are interacting with the Orca device, a platform featuring a flexible architecture designed to support the development of future tools, connectivity options, and upgrades while maintaining existing functionality. The Orca Platform Software subsystem assists users in performing various tasks and is built to ensure continuous innovation.You are tasked with generating comprehensive and relevant test scenarios for a given software requirement. Your input is crucial to verifying the system's functionality and robustness through both positive and negative test scenarios.\n\nUnderstand the Requirement:Please carefully review the requirement and use user story, description, and rationale if available. This information outlines what the system should do and why it should do it.\nPositive Test Scenarios:\nVerify that the system behaves as expected under normal, valid conditions.\nFocus on typical use cases and ensure the scenarios cover all main functionalities.\nConsider various valid inputs, user actions, and expected system responses.\nProvide detailed steps for each positive test scenario.\n\nNegative Test Scenarios:\nTest how the system handles invalid, unexpected, or extreme conditions.\nInclude edge cases, error conditions, and scenarios that might cause the system to fail.\nEnsure the system responds appropriately to invalid inputs and errors.\nProvide detailed steps for each negative test scenario.\n\nOutput Format:\nTest Scenario ID: Assign a unique identifier to each test scenario.\nTitle: Briefly summarize each test scenario.\nSteps: Detail the steps to execute the test scenario.\nExpected Result: Specify the expected outcome for each test scenario.\nTask:Please use the provided requirement and use user story, description, and rationale if available to create comprehensive and relevant test scenarios. Your insights will ensure that the system meets its requirements effectively.\n\n\nBelow is the context in which the requirement, user story, description, and rationale are described.\n\nContext:\n{}\n\nBegin generating the test scenarios now.\n"

        return prompt

    def save_to_history(self, requirement, description, user_story, response):
        print("#### Excel file check")

        # Use self.history_filename instead of the local variable
        if os.path.exists(self.history_filename):
            history_df = pd.read_excel(self.history_filename)
        else:
            # Create a new DataFrame if the file doesn't exist
            history_df = pd.DataFrame(columns=['Timestamp', 'Requirement', 'Description', 'User Story', 'Response'])
            print("#### Excel file created")

        current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # print(f"### Current time: {current_time}")

        new_entry = {
            'Timestamp': current_time,
            'Requirement': requirement,
            'Description': description,
            'User Story': user_story,
            'Response': response
        }

        # Append the new entry to the DataFrame
        history_df = pd.concat([history_df, pd.DataFrame([new_entry])], ignore_index=True)

        # Write the updated DataFrame to the Excel file
        history_df.to_excel(self.history_filename, index=False)
        print("#### Saved to file")

    def load_history_data(self):
        if os.path.exists(self.history_filename):
            history_df = pd.read_excel(self.history_filename)
            history_df['Timestamp'] = pd.to_datetime(history_df['Timestamp'])
            history_df = history_df.sort_values(by='Timestamp', ascending=False)
            return history_df
        return None

    def clear_history_data(self):
        if os.path.exists(self.history_filename):
            os.remove(self.history_filename)

    def generate_history_html(self, history_df, history_option):
        if history_option == 'latest_5':
            history_df = history_df.head(5)
        elif history_option == 'latest_3':
            history_df = history_df.head(3)

        # Manually construct HTML for each row
        history_html = ""
        for _, row in history_df.iterrows():
            history_html += "<tr>"
            history_html += f"<td>{row['Timestamp']}</td>"
            history_html += f"<td>{row['Requirement']}</td>"
            history_html += f"<td>{row['Description']}</td>"
            history_html += f"<td>{row['User Story']}</td>"
            history_html += f"<td>{row['Response']}</td>"
            history_html += "</tr>"

        return history_html