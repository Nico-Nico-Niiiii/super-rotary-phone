"""
Inference Module for Test Scenario Generator

This module handles all AI model inference operations, including:
1. Azure OpenAI configuration and initialization
2. Model calls for code analysis and test scenario generation
3. Response parsing and extraction

The module is designed to be imported and used by the main TestScenarioGenerator class.
"""

import os
import logging
import json
import re
from langchain_core.messages import SystemMessage
from langchain_openai import AzureChatOpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# Prompt templates
CODE_ANALYZER_PROMPT = """
Role: Python Code Analyst
Task: Generate a detailed description of the provided Python code.

Instructions:
1. Analyze the provided code and create a comprehensive description of its functionality, components, and architecture.
2. Focus on the following aspects:
   - Overall purpose and functionality
   - Key classes and their responsibilities
   - Main functions and their roles
   - Data structures used
   - Input/output handling
   - Error handling mechanisms
   - Any notable algorithms or patterns
   - Dependencies and external libraries
   - Configuration and settings

3. Organize your analysis in a structured manner, with clear sections for each major component.

Code to analyze:
```python
{code}
```

## Output Format
Your response must be a valid JSON object with the following structure:

```json
{{
  "module_name": "{module_name}",
  "overall_purpose": "A concise description of what this code does",
  "architecture": {{
    "description": "Overall architectural approach",
    "patterns_used": ["pattern1", "pattern2"]
  }},
  "key_components": [
    {{
      "name": "ComponentName",
      "type": "class/function",
      "purpose": "What this component does",
      "functionality": "Detailed description of how it works"
    }}
  ],
  "data_flow": "Description of how data moves through the system",
  "input_handling": "How inputs are processed",
  "output_handling": "How outputs are generated",
  "error_handling": "Error handling approach",
  "dependencies": ["dependency1", "dependency2"],
  "notable_algorithms": [
    {{
      "name": "Algorithm name",
      "purpose": "What it accomplishes",
      "description": "How it works"
    }}
  ],
  "configuration": "How the code is configured",
  "assumptions": ["assumption1", "assumption2"],
  "limitations": ["limitation1", "limitation2"]
}}
```

Remember to make your JSON valid. Escape quotes within strings and ensure the structure matches exactly what is requested.
"""

TEST_SCENARIO_GENERATOR_PROMPT = """
Role: Test Scenario Designer
Task: Generate test scenarios for a software module based on its description, technical specifications, and user story.

Provided Information:
- Code Description: A detailed analysis of the module's functionality and components
- Technical Specification: The original technical requirements that guided development
- User Story: The business need that the code addresses

Instructions:
1. Analyze all provided information to understand the module's purpose, functionality, and requirements.
2. Design test scenarios that cover:
   - Main functionality (core features and capabilities)
   - Alternative flows (different ways to achieve the same goal)
   - Edge cases (extreme or unusual situations)
   - Error handling (how the system should respond to invalid inputs)
   - Integration points (how it connects with other components)

3. For each test scenario, provide:
   - A unique identifier
   - A descriptive name
   - A brief description of the scenario context
   - What should be tested
   - The expected outcome
   - Test category (e.g., functional, edge case, error, integration)

Code Description:
{code_description}

Technical Specification:
{tech_spec}

User Story:
{user_story}

## Output Format
Your response must be a valid JSON object with the following structure:

```json
{{
  "module_id": "{user_story_id}",
  "test_suite_name": "Test Scenarios for {user_story_id}",
  "summary": "A brief overview of the test approach",
  "test_scenarios": [
    {{
      "id": "TS-{user_story_id}-001",
      "name": "Scenario descriptive name",
      "category": "functional|edge_case|error|integration|performance",
      "description": "A description of the scenario context and what is being tested",
      "test_objective": "What specific aspect or functionality is being verified",
      "expected_outcome": "What should happen if the system works correctly",
      "relevant_requirements": "References to specific requirements or user story elements"
    }},
    {{
      "id": "TS-{user_story_id}-002",
      "name": "Another test scenario",
      ...
    }}
  ],
  "coverage": {{
    "functional_areas": ["area1", "area2"],
    "edge_cases": ["case1", "case2"],
    "not_covered": ["limitation1"]
  }}
}}
```

Generate at least 5-8 test scenarios that together provide good coverage of the module's functionality. Focus on capturing the essence of what needs to be tested rather than detailed test steps.
"""

class InferenceEngine:
    """Handles all model inference operations for the test scenario generator"""
    
    def __init__(self, api_key=None, endpoint=None, api_version=None, deployment_name=None):
        """
        Initialize the inference engine
        
        Args:
            api_key (str, optional): Azure OpenAI API key
            endpoint (str, optional): Azure OpenAI endpoint
            api_version (str, optional): Azure OpenAI API version
            deployment_name (str, optional): Deployment name for the model
        """
        self.api_key = api_key
        self.endpoint = endpoint
        self.api_version = api_version
        self.deployment_name = deployment_name
        self.model = None
        
        # Check if config is set
        self._check_openai_config()
        
        # Initialize model
        self._initialize_model()
    
    def _check_openai_config(self):
        """Check and set Azure OpenAI configuration."""
        required_vars = [
            "AZURE_OPENAI_API_KEY",
            "AZURE_OPENAI_ENDPOINT",
            "AZURE_OPENAI_API_VERSION",
            "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
        ]
        
        # If explicit values are provided, use them
        if self.api_key:
            os.environ["AZURE_OPENAI_API_KEY"] = self.api_key
            
        if self.endpoint:
            os.environ["AZURE_OPENAI_ENDPOINT"] = self.endpoint
            
        if self.api_version:
            os.environ["AZURE_OPENAI_API_VERSION"] = self.api_version
            
        if self.deployment_name:
            os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = self.deployment_name
        
        # Check for missing values
        missing = [var for var in required_vars if not os.environ.get(var)]
        if missing:
            # Try to set default values for missing variables
            logger.info("Looking for OpenAI configuration in current environment...")
            
            if "AZURE_OPENAI_API_KEY" not in os.environ:
                os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
            
            if "AZURE_OPENAI_ENDPOINT" not in os.environ:
                os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
            
            if "AZURE_OPENAI_API_VERSION" not in os.environ:
                os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
            
            if "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME" not in os.environ:
                os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"
        
        # Final check
        missing = [var for var in required_vars if not os.environ.get(var)]
        if missing:
            raise EnvironmentError(f"Missing Azure OpenAI configuration: {', '.join(missing)}")
        
        logger.info("Azure OpenAI configuration verified")
    
    def _initialize_model(self):
        """Initialize the Azure OpenAI model."""
        self.model = AzureChatOpenAI(
            azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
            api_key=os.environ["AZURE_OPENAI_API_KEY"],
            api_version=os.environ["AZURE_OPENAI_API_VERSION"],
            deployment_name=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"]
        )
        logger.info("Model initialized successfully")
    
    def analyze_code(self, code_content, module_name):
        """
        Analyze code and generate a description
        
        Args:
            code_content (str): The code to analyze
            module_name (str): Name of the module
            
        Returns:
            dict: JSON description of the code
        """
        # Format the prompt
        formatted_prompt = CODE_ANALYZER_PROMPT.format(
            code=code_content,
            module_name=module_name
        )
        
        # Call the model
        logger.info(f"Analyzing code for {module_name}")
        messages = [SystemMessage(content=formatted_prompt)]
        response = self.model.invoke(messages)
        response_text = getattr(response, "content", "")
        
        # Extract JSON from the response
        return self._extract_json_from_response(response_text, module_name)
    
    def generate_test_scenarios(self, code_description, tech_spec, user_story, user_story_id):
        """
        Generate test scenarios based on code description, tech spec, and user story
        
        Args:
            code_description (dict): Code description JSON
            tech_spec (str): Technical specification text
            user_story (str): User story text
            user_story_id (str): ID of the user story
            
        Returns:
            dict: Test scenarios JSON
        """
        # Format the prompt
        formatted_prompt = TEST_SCENARIO_GENERATOR_PROMPT.format(
            code_description=json.dumps(code_description, indent=2),
            tech_spec=tech_spec,
            user_story=user_story,
            user_story_id=user_story_id
        )
        
        # Call the model
        logger.info(f"Generating test scenarios for {user_story_id}")
        messages = [SystemMessage(content=formatted_prompt)]
        response = self.model.invoke(messages)
        response_text = getattr(response, "content", "")
        
        # Extract JSON from the response
        return self._extract_json_from_response(response_text, user_story_id)
    
    def _extract_json_from_response(self, response_text, identifier):
        """
        Extract JSON from LLM response
        
        Args:
            response_text (str): The raw response text
            identifier (str): Identifier for logging (e.g., module name or user story ID)
            
        Returns:
            dict: Extracted JSON data
        """
        try:
            # Try to find JSON block first
            json_pattern = r"```json\s*(.*?)\s*```"
            match = re.search(json_pattern, response_text, re.DOTALL)
            if match:
                json_str = match.group(1)
                return json.loads(json_str)
            
            # If no JSON block, try to parse the whole response
            return json.loads(response_text)
        except Exception as e:
            logger.error(f"Failed to extract JSON for {identifier}: {e}")
            
            # Create a fallback structure
            return {
                "error": str(e),
                "raw_response": response_text,
                "identifier": identifier
            }