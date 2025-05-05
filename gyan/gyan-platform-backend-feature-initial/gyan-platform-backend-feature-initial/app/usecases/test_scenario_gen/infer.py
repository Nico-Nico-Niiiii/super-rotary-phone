import os
import io
import re
import numpy as np
import torch
from PIL import Image
import warnings

from transformers import AutoModelForCausalLM, AutoProcessor

# Set environment variables to suppress warnings
os.environ["TRANSFORMERS_VERBOSITY"] = "error"
os.environ["TRANSFORMERS_NO_ADVISORY_WARNINGS"] = "True"
warnings.filterwarnings("ignore", category=DeprecationWarning)


class TestScenarioGenerator:
    def __init__(self):
        """
        Initialize the ImagePromptProcessor class with the model and processor.
        """
        self.model_id = "microsoft/Phi-3-vision-128k-instruct"
        self.device = "cuda"
        
    def load_model(self):
        self.model = AutoModelForCausalLM.from_pretrained(
            self.model_id, 
            device_map=self.device, 
            trust_remote_code=True, 
            torch_dtype="auto", 
            _attn_implementation='eager'  # Disable flash attention
        )

        self.processor = AutoProcessor.from_pretrained(self.model_id, trust_remote_code=True)

    def unload_model(self):
        print("Unloading GPU")
        del self.model
        torch.cuda.empty_cache()
        print("GPU unloaded")
        

    def process_image_and_prompt(self, image_bytes, choice):
        """
        Process the image and prompt, save the image, and generate a response.
        """
        self.load_model()

        if choice == "sequence":
            system_prompt = self.get_sequence_prompt()

        elif choice == "state" :
            system_prompt = self.get_state_prompt()

        else:
            return "Error: Incorrect diagram choice"

        # Get Recd Image
        image = Image.open(io.BytesIO(image_bytes))

        # Prepare messages for the prompt
        messages = [
            {"role": "user", "content": "<|image_1|>\nWhat is shown in this image?"}, 
            {"role": "assistant", "content": "The chart displays..."},
            {"role": "user", "content": system_prompt}
        ]

        # Generate the prompt using the chat template
        prompt = self.processor.tokenizer.apply_chat_template(
            messages, 
            tokenize=False, 
            add_generation_prompt=True
        )
        
        # Process the inputs (image and prompt)
        inputs = self.processor(prompt, [image], return_tensors="pt").to("cuda:0")

        # Set generation arguments
        generation_args = {
            "max_new_tokens": 1024,
            "temperature": 0.0,
            "do_sample": False
        }

        # Generate response
        generate_ids = self.model.generate(
            **inputs, 
            eos_token_id=self.processor.tokenizer.eos_token_id, 
            **generation_args
        )
        generate_ids = generate_ids[:, inputs['input_ids'].shape[1]:]
        
        # Decode the generated response
        response = self.processor.batch_decode(
            generate_ids, 
            skip_special_tokens=True, 
            clean_up_tokenization_spaces=False
        )[0]

        self.unload_model()

        # print("##############Test Cases - ", response)
        # if choice == "state":
        #     response = self.process_output_state(response)
        # else:
        #     response = self.process_output_seq(response)

        # print("##############Parsed Cases - ", response)
        return response

    def process_output_seq(self, output):
        parsed_data = {
            "description": "",
            "test_cases": []
        }

        # Extract description
        description_match = re.search(r"\*\*\[DESCRIPTION\]\*\*\n\n(.+?)\n\n", output, re.DOTALL)
    
        if description_match:
            parsed_data["description"] = description_match.group(1).strip()

        # Extract test cases
        test_case_pattern = r"\*\*Test Case ID:\*\*\s*(TC-(\d+))\n\n\s*\*\*Description:\*\*\s*(.*?)\n\n\s*\*\*Preconditions:\*\*\s*(.*?)\n\n\s*\*\*Steps:\*\*\n\n\s*((?:\d+\..*?\n?)+)\n\n\s*\*\*Expected Result:\*\*\s*(.*?)\n\n\s*\*\*Pass/Fail Criteria:\*\*\s*(.*?)\n\n"
        matches = re.findall(test_case_pattern, output, re.DOTALL)

        for match in matches:
            test_case_id = int(match[1])  # Extract numeric ID
            test_case_name = f"Test Case {test_case_id}"
            steps = [step.strip().split(". ", 1)[-1] for step in match[4].strip().split("\n") if step.strip()]
            expected_result = match[5].strip()
            pass_fail_criteria = match[6].strip()

            test_case = {
                "id": test_case_id,
                "name": test_case_name,
                "steps": steps,
                "expectedResult": expected_result, 
                "passFailCriteria" : pass_fail_criteria
            }

            parsed_data["test_cases"].append(test_case)

        return parsed_data

    
    def process_output_state(self, output):
        # parsed_data = {
        #     "description": "",
        #     "test_cases": []
        # }

        # # Extract description
        # description_match = re.search(r'\*\*\[DESCRIPTION\]\*\*\s*([\s\S]+?)(?=\*\*\[)', output)
        # if description_match:
        #     parsed_data["description"] = description_match.group(1).strip()

        # # Extract the test cases section
        # test_cases_match = re.search(r'\*\*\[TEST CASES\]\*\*\s*([\s\S]+?)(?=\*\*\[INSTRUCT\]|$)', output)
        # if test_cases_match:
        #     print("Test cases found")
        #     test_cases_section = test_cases_match.group(1).strip()
            
        #     # Split test cases using the "**Test Case ID:**" as a delimiter
        #     test_case_blocks = re.split(r'\n\s*\*\*Test Case ID:\*\*', test_cases_section)
        #     test_case_blocks = [block.strip() for block in test_case_blocks if block.strip()]  # Remove empty blocks

        #     for block in test_case_blocks:
        #         print("################### BLOCK -\n", block)  # Debugging

        #         # Ensure we properly re-add the "**Test Case ID:**" tag since split removed it
        #         block = "**Test Case ID:** " + block

        #         # Extract test case details
        #         id_match = re.search(r'\*\*Test Case ID:\*\*\s*(TC-\d+)', block)
        #         description_match = re.search(r'\*\*Description:\*\*\s*(.*?)\n', block)
        #         preconditions_match = re.search(r'\*\*Preconditions:\*\*\s*(.*?)\n', block)
        #         steps_section_match = re.search(r'\*\*Steps:\*\*\s*([\s\S]*?)(?=\n\s*\*\*Expected)', block)
        #         expected_result_match = re.search(r'\*\*Expected Result:\*\*\s*(.*?)\n', block)
        #         pass_fail_match = re.search(r'\*\*Pass/Fail Criteria:\*\*\s*(.*?)\n', block)

        #         print("id_match:", id_match)
        #         print("description:", description_match)
        #         print("preconditions:", preconditions_match)
        #         print("Steps:", steps_section_match)
        #         print("Expected:", expected_result_match)
        #         print("Pass/Fail:", pass_fail_match)

        #         # Process steps correctly
        #         steps = []
        #         if steps_section_match:
        #             steps_text = steps_section_match.group(1).strip()
        #             steps = [step.strip().split(". ", 1)[-1] for step in steps_text.split("\n") if step.strip()]

        #         # Only add test case if we have at least ID and description
        #         if id_match and description_match:
        #             parsed_test_case = {
        #                 "id": id_match.group(1),
        #                 "name": description_match.group(1),
        #                 "preconditions": preconditions_match.group(1) if preconditions_match else "",
        #                 "steps": steps,
        #                 "expectedResult": expected_result_match.group(1) if expected_result_match else "",
        #                 "passFailCriteria": pass_fail_match.group(1) if pass_fail_match else ""
        #             }
        #             parsed_data["test_cases"].append(parsed_test_case)

        # return parsed_data

        parsed_data = {
            "description": "",
            "test_cases": []
        }

        # Extract description
        description_match = re.search(r'\*\*\[DESCRIPTION\]\*\*\s*([\s\S]+?)(?=\*\*\[)', output)
        if description_match:
            parsed_data["description"] = description_match.group(1).strip()

        # Extract test cases section
        test_cases_match = re.search(r'\*\*\[TEST CASES\]\*\*\s*([\s\S]+?)(?=\*\*\[INSTRUCT\]|$)', output)
        if test_cases_match:
            print("Test cases found")
            test_cases_section = test_cases_match.group(1).strip()

            # Split test cases using "**Test Case ID:**" as a delimiter
            test_case_blocks = re.split(r'\n\s*\*\*Test Case ID:\*\*', test_cases_section)
            test_case_blocks = [block.strip() for block in test_case_blocks if block.strip()]  # Remove empty blocks

            for block in test_case_blocks:
                print("################### BLOCK -\n", block)  # Debugging

                # Ensure we properly re-add the "**Test Case ID:**" tag since split removed it
                block = "**Test Case ID:** " + block

                # Extract test case details
                id_match = re.search(r'\*\*Test Case ID:\*\*\s*(TC-\d+)', block)
                description_match = re.search(r'\*\*Description:\*\*\s*(.*?)\n', block)
                preconditions_match = re.search(r'\*\*Preconditions:\*\*\s*(.*?)\n', block)
                steps_section_match = re.search(r'\*\*Steps:\*\*\s*([\s\S]+?)(?=\n\s*\*\*Expected)', block)
                expected_result_match = re.search(r'\*\*Expected Result:\*\*\s*(.*?)\n', block)
                pass_fail_match = re.search(r'\*\*Pass/Fail Criteria:\*\*\s*(.*?)\n', block)

                print("id_match:", id_match)
                print("description:", description_match)
                print("preconditions:", preconditions_match)
                print("Steps section:", steps_section_match)
                print("Expected:", expected_result_match)
                print("Pass/Fail:", pass_fail_match)

                # Process steps correctly
                steps = []
                if steps_section_match:
                    steps_text = steps_section_match.group(1).strip()
                    steps = re.findall(r'^\s*\d+\.\s*(.*)', steps_text, re.MULTILINE)  # Extract steps

                # Add the test case only if ID and description exist
                if id_match and description_match:
                    parsed_test_case = {
                        "id": id_match.group(1),
                        "name": description_match.group(1),
                        "preconditions": preconditions_match.group(1) if preconditions_match else "",
                        "steps": steps,  # Now capturing steps correctly!
                        "expectedResult": expected_result_match.group(1) if expected_result_match else "",
                        "passFailCriteria": pass_fail_match.group(1) if pass_fail_match else ""
                    }
                    parsed_data["test_cases"].append(parsed_test_case)

        return parsed_data

        



    def get_sequence_prompt(self):
        prompt = """USER: <image>\n\n**INSTRUCT [START][INSTRUCT]**

        **[DESCRIPTION]**
        The provided sequence diagram depicts the interaction between various components in a system. Here's a detailed breakdown:

        * **Components:**
            * List all actors and systems involved
            * Briefly explain their roles in the scenario.
        * **Interactions:**
            * Describe the message flow between components, aligning with the sequence of messages in the diagram.
            * Highlight any conditional branches or loops.

        **[TEST CASES]**

        Generate at least 4 well-structured test cases in the following format, ensuring at least 4-5 steps per test case:

        * **Test Case ID:** TC-XX (replace XX with a unique number)
        * **Description:** A clear statement of what the test verifies
        * **Preconditions:** Initial state or conditions before the test
        * **Steps:** Specific actions taken during the test, aligned with the diagram's message flow, with at least 4-5 steps per test case.
        * **Expected Result:** The anticipated outcome of the test.
        * **Pass/Fail Criteria:** How to determine success .

        **[INSTRUCT] END [INSTRUCT]**.\n\nASSISTANT:"""

        return prompt


    def get_state_prompt(self):
        prompt = """USER: <image>\n\n**INSTRUCT [START][INSTRUCT]**

        **[DESCRIPTION]**
        The provided state diagram depicts the interaction between various components in a system. Here's a detailed breakdown:

        * **Components:**
            * List all actors and systems involved
            * Briefly explain their roles in the scenario.
        * **Interactions:**
            * Describe the message flow between components, aligning with the sequence of messages in the diagram.
            * Highlight any conditional branches or loops.

        **[TEST CASES]**

        Generate at least 4 well-structured test cases in the following format, ensuring at least 4-5 steps per test case:

        * **Test Case ID:** TC-XX (replace XX with a unique number)
        * **Description:** A clear statement of what the test verifies
        * **Preconditions:** Initial state or conditions before the test
        * **Steps:** Specific actions taken during the test, aligned with the diagram's message flow, with at least 4-5 steps per test case.
        * **Expected Result:** The anticipated outcome of the test.
        * **Pass/Fail Criteria:** How to determine success .

        **[INSTRUCT] END [INSTRUCT]**.\n\nASSISTANT:"""

        return prompt