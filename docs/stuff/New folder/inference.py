"""
Inference Module for Code Generation and Integration

This module handles all interactions with the language model (Azure OpenAI),
including code generation, validation, correction, and integration.
"""

import os
import logging
import json
import re
from typing import List, Dict, Any, Optional, Union
from langchain_core.messages import SystemMessage, HumanMessage, AIMessage
from langchain_openai import AzureChatOpenAI

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - [%(filename)s:%(lineno)d] - %(message)s'
)
logger = logging.getLogger(__name__)

# Azure OpenAI configuration
def configure_openai():
    """Check and configure Azure OpenAI settings in environment variables."""
    required_vars = [
        "AZURE_OPENAI_API_KEY",
        "AZURE_OPENAI_ENDPOINT",
        "AZURE_OPENAI_API_VERSION",
        "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"
    ]
    
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        # Set default values if not found
        logger.info("Looking for OpenAI configuration in current environment...")
        
        if "AZURE_OPENAI_API_KEY" not in os.environ:
            os.environ["AZURE_OPENAI_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
        
        if "AZURE_OPENAI_ENDPOINT" not in os.environ:
            os.environ["AZURE_OPENAI_ENDPOINT"] = "https://openaisk123.openai.azure.com/"
        
        if "AZURE_OPENAI_API_VERSION" not in os.environ:
            os.environ["AZURE_OPENAI_API_VERSION"] = "2024-08-01-preview"
        
        if "AZURE_OPENAI_CHAT_DEPLOYMENT_NAME" not in os.environ:
            os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4o"
    
    # Verify all variables are set
    missing = [var for var in required_vars if not os.environ.get(var)]
    if missing:
        raise EnvironmentError(f"Missing Azure OpenAI configuration: {', '.join(missing)}")
    
    logger.info("Azure OpenAI configuration verified")

def get_openai_model():
    """Initialize and return the Azure OpenAI model."""
    # Configure OpenAI if not already done
    configure_openai()
    
    # Create the model
    model = AzureChatOpenAI(
        azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
        api_key=os.environ["AZURE_OPENAI_API_KEY"],
        api_version=os.environ["AZURE_OPENAI_API_VERSION"],
        deployment_name=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
        temperature=0.1  # Low temperature for more deterministic output
    )
    
    return model

# Prompt templates
DEVELOPER_PROMPT = """
Role: Python Developer
Task: Generate complete, production-ready Python code based on the requirements specification.

Requirements:
{requirements}

Your code must include:
1. All necessary imports and dependencies
2. Complete implementation with:
   - Well-structured classes and functions
   - Configuration management (using dataclasses or similar)
   - Comprehensive error handling and validation
   - Type hints throughout
   - Logging with appropriate levels
   - Unit tests where applicable
3. Clear documentation:
   - Module docstrings
   - Function/method docstrings with parameters and return values
   - Inline comments for complex logic

Focus on implementing EVERY aspect mentioned in the requirements. Do not leave any required functionality unimplemented.

## Output Format
Your response should be the complete, production-ready Python code without surrounding explanations.
DO NOT enclose your code in triple backticks (``` or ''').
Simply output the pure Python code directly:

# Your Python code here
"""

VALIDATOR_PROMPT = """
Role: Senior Code Reviewer
Task: Perform a thorough validation of the provided Python code against the requirements.

Requirements:
{Requirements}

Validation Process:
1. Carefully compare the code against EACH requirement in the specification
2. For each requirement, determine if it has been fully, partially, or not implemented
3. Identify any missing functionality, edge cases, or requirements
4. Evaluate code quality, error handling, security, and performance

Validation Checklist:
1. Code Completeness:
   - All imports and dependencies present
   - Full implementation of required functionality (check EACH requirement)
   - No placeholder code or TODOs

2. Code Quality:
   - Follows PEP 8 standards
   - Clear variable/function naming
   - Appropriate modularization
   - Avoids code duplication
   - Maintainable architecture

   
3. Technical Implementation:
   - Proper error handling with specific exceptions
   - Complete type annotations
   - Correct algorithm implementation
   - Efficient resource usage
   - Security considerations addressed

4. Documentation:
   - Comprehensive docstrings
   - Clear inline comments where needed

## Output Format
Return your validation report as a structured JSON object with the following format:

```json
{{
  "validation_report": {{
    "overall_assessment": "Pass/Fail",
    "issues_found": [
      "Issue 1 description",
      "Issue 2 description",
      "..."
    ],
    "suggested_improvements": [
      {{
        "description": "Improvement 1",
        "priority": "high/medium/low"
      }},
      "..."
    ],
    "implementation_vs_requirements": {{
      "match": true/false,
      "details": [
        {{
          "requirement_section": "Requirement name/section",
          "status": "Implemented/Partially Implemented/Not Implemented",
          "notes": "Notes about implementation"
        }},
        "..."
      ]
    }}
  }}
}}

Be strict in your assessment. If ANY requirement is not fully implemented, the overall assessment should be "Fail".
"""

CORRECTOR_PROMPT = """
Role: Senior Python Developer
Task: Refactor and fix the code based on the validation feedback.
Original Requirements:
{requirements}
Validation Feedback:
{ValidationFeedback}
Correction Instructions:

Address ALL issues identified in the validation feedback
Pay particular attention to any requirements marked as "Not Implemented" or "Partially Implemented"
Maintain the original architectural approach unless fundamentally flawed
Ensure complete implementation of ALL requirements from the original specification
Add or improve:

Error handling for all edge cases
Type hints throughout the codebase
Documentation (docstrings and comments)
Logging for important operations
Performance optimizations where possible

Important: Make sure you implement EVERY feature mentioned in the requirements that was flagged as missing or incomplete in the validation feedback.
Output Format
Your response should be the complete, corrected, production-ready Python code without explanations.
DO NOT enclose your code in triple backticks (``` or ''').
Simply output the pure Python code directly:
Your corrected Python code here
"""

def extract_code_from_response(response_text: str) -> str:
    """Extract code from between triple backticks or triple single quotes in a response."""
    pattern = r"```(?:python)?\\s*(.*?)```"
    matches = re.findall(pattern, response_text, re.DOTALL)
    if matches:
        return matches[0].strip()
        
    # Try with triple single quotes
    pattern = r"'''(?:python)?\\s*(.*?)'''"
    matches = re.findall(pattern, response_text, re.DOTALL)
    if matches:
        return matches[0].strip()
        
    return response_text  # Return original if no code blocks found

def generate_initial_code(model, tech_spec: str, user_story_id: str) -> Dict[str, Any]:
    """Generate initial code from a technical specification."""
    logger.info(f"Generating code for user story ID: {user_story_id}")
    
    # Format prompt
    formatted_prompt = DEVELOPER_PROMPT.format(
        requirements=tech_spec,
        TechnicalSpecifications=tech_spec
    )
    
    # Create messages
    messages = [
        SystemMessage(content=formatted_prompt),
        HumanMessage(content=tech_spec)
    ]
    
    # Invoke model
    message = model.invoke(messages)
    
    # Extract code from response
    response_text = getattr(message, "content", "")
    code_only = extract_code_from_response(response_text)
    
    return {
        'messages': [message],
        'current_code': code_only,
        'validation_status': None,
        'error_messages': [],
        'is_valid': False,
        'user_story_id': user_story_id
    }

def validate_code(model, state: Dict[str, Any]) -> Dict[str, Any]:
    """Validate the generated code using the model."""
    messages = state.get('messages', [])
    current_code = state.get('current_code', '')
    user_story_id = state.get('user_story_id', 'default_id')
    
    logger.info(f"Validating code for user story ID: {user_story_id}")
    
    # Get original requirements
    original_message = state["messages"][0].content if state["messages"] else ""
    
    # Format the prompt
    formatted_prompt = VALIDATOR_PROMPT.format(
        Requirements=original_message,
        TechnicalSpecifications=original_message
    )
    
    # Create messages
    prompt_messages = [
        SystemMessage(content=formatted_prompt),
        *messages
    ]
    
    # Invoke model
    message = model.invoke(prompt_messages)
    response_text = getattr(message, "content", "").lower()
    
    # Determine if validation passed
    is_valid = False
    try:
        # Try to extract JSON from the message
        json_pattern = r"```json\s*(.*?)\s*```"
        match = re.search(json_pattern, message.content, re.DOTALL)
        if match:
            validation_json = json.loads(match.group(1))
            is_valid = (validation_json.get("validation_report", {}).get("overall_assessment", "").lower() == "pass")
    except:
        # Fallback to simple text analysis
        is_valid = "pass" in response_text and "correctly implements" in response_text
    
    return {
        'messages': [message],
        'current_code': current_code,
        'is_valid': is_valid,
        'error_messages': [] if is_valid else ["Validation failed"],
        'user_story_id': user_story_id
    }

def correct_code(model, state: Dict[str, Any]) -> Dict[str, Any]:
    """Correct code based on validation feedback."""
    messages = state['messages']
    user_story_id = state.get('user_story_id', 'default_id')
    
    logger.info(f"Correcting code for user story ID: {user_story_id}")
    
    # Get original requirements
    original_requirements = ""
    for msg in state['messages']:
        if isinstance(msg, HumanMessage) and msg.content:
            original_requirements = msg.content
            break
    
    # Get validation feedback
    validation_feedback = messages[0].content if messages else ""
    
    # Format the prompt
    formatted_prompt = CORRECTOR_PROMPT.format(
        requirements=original_requirements,
        ValidationFeedback=validation_feedback
    )
    
    # Create messages
    prompt_messages = [
        SystemMessage(content=formatted_prompt),
        *messages
    ]
    
    # Invoke model
    message = model.invoke(prompt_messages)
    response_text = getattr(message, "content", "")
    code_only = extract_code_from_response(response_text)
    
    return {
        'messages': [message],
        'current_code': code_only,
        'is_valid': False,
        'error_messages': [],
        'user_story_id': user_story_id
    }

def generate_module_api_doc(model, module_name: str, code: str) -> Dict[str, Any]:
    """Generate API documentation for a module using the model."""
    logger.info(f"Generating API documentation for module: {module_name}")
    
    prompt = f"""
Generate a detailed API documentation for the following Python code module.
Extract all functions, classes, methods, and their parameters, return types, and docstrings.
MOST IMPORTANTLY, also extract the relationships between functions and classes:
- What functions call other functions
- What functions instantiate classes
- What classes inherit from other classes
- What functions are entry points (not called by others)

Format the response as a JSON object with the structure shown in the example.

Example structure:
```json
{{
  "name": "module_name",
  "docstring": "Module docstring",
  "imports": [
    {{"module": "os", "alias": null}},
    {{"module": "pandas", "alias": "pd"}}
  ],
  "global_vars": [
    {{"name": "logger", "value": "logging.getLogger(__name__)"}}
  ],
  "functions": [
    {{
      "name": "function_name",
      "docstring": "Function docstring",
      "parameters": [
        {{"name": "param1", "type": "str", "description": "Description of param1"}}
      ],
      "returns": "str",
      "relationships": {{
        "calls_functions": ["other_function", "third_function"],
        "instantiates_classes": ["SomeClass"],
        "accesses_attributes": ["object.attribute"],
        "called_by": ["main"]
      }}
    }}
  ],
  "classes": [
    {{
      "name": "ClassName",
      "docstring": "Class docstring",
      "bases": ["BaseClass"],
      "methods": [
        {{
          "name": "method_name",
          "docstring": "Method docstring",
          "parameters": [
            {{"name": "self", "type": null, "description": "Instance reference"}},
            {{"name": "param1", "type": "str", "description": "Description of param1"}}
          ],
          "returns": "bool",
          "relationships": {{
            "calls_functions": ["some_function"],
            "instantiates_classes": [],
            "accesses_attributes": ["self.attribute"],
            "called_by": []
          }}
        }}
      ],
      "relationships": {{
        "inherits_from": ["BaseClass"],
        "used_by_functions": ["function_name"],
        "instantiated_by": ["function_name"]
      }}
    }}
  ],
  "relationships": {{
    "dependencies": {{
      "imports": ["os", "pandas"],
      "from_imports": ["logging.getLogger"]
    }},
    "entry_points": ["main"]
  }}
}}
```

Here's the code to document:

```python
{code}
```

Focus especially on capturing the relationships between functions and classes to help understand how the code works together.
"""

    system_message = SystemMessage(content="You are a Python expert who specializes in extracting API documentation and code relationships from code.")
    human_message = HumanMessage(content=prompt)
    
    try:
        response = model.invoke([system_message, human_message])
        content = response.content
        
        # Extract JSON from response
        json_match = re.search(r'```json\s*(.*?)\s*```', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            # If no JSON code block, try to find any JSON object
            json_match = re.search(r'({[\s\S]*})', content)
            if json_match:
                json_str = json_match.group(1)
            else:
                json_str = content
        
        return json.loads(json_str)
    
    except Exception as e:
        logger.error(f"Error getting API doc from model for {module_name}: {e}")
        # Return minimal structure
        return {
            "name": module_name,
            "docstring": "Documentation extraction failed.",
            "imports": [],
            "global_vars": [],
            "functions": [],
            "classes": [],
            "relationships": {
                "dependencies": {"imports": [], "from_imports": []},
                "entry_points": []
            }
        }

def generate_integrated_code(model, module_docs: Dict[str, Any]) -> str:
    """Generate integrated code using the model based on module documentation."""
    logger.info("Generating integrated code from module documentation")
    
    # Create a formatted representation of the module docs for the prompt
    api_docs_text = format_api_docs_for_llm(module_docs)
    
    prompt = f"""
I have multiple Python modules that need to be integrated into a cohesive solution.
Below is the ENHANCED API documentation for each module, which includes detailed relationship information
showing which functions call other functions, which classes are instantiated, and other dependencies.
Each module is stored in a separate file with the naming pattern of "US_XXX_code.py" where XXX is the user story ID.

{api_docs_text}

Your task is to:

1. Create a single integrated Python file that coordinates functionality from all these modules
2. Design the integrated solution to import modules correctly using their filenames (e.g., "import US_142_code" NOT "import US_142")
3. Create proper references to functions and classes from each module with correct module prefixes
4. Make sure to import all necessary standard and third-party libraries needed by the solution
5. Ensure proper sequencing based on the function call relationships documented above
6. Include a main execution block that coordinates the overall flow
7. Write clear comments to explain how the integration works, especially noting important function relationships
8. Add detailed documentation explaining which functions call which other functions and their dependencies

IMPORTANT: Each module should be imported using its full filename (e.g., "import US_142_code" not "import US_142").
When referring to functions, classes, or variables from these modules, use the proper module prefix
(e.g., "US_142_code.process_file()" not "US_142.process_file()").

Your integrated solution should include:
1. A detailed module docstring explaining the overall architecture and how the modules interact
2. Comments for each section explaining which components depend on each other
3. A function relationship map in comments to help developers understand the code flow
4. A main execution function that coordinates the execution flow based on the identified relationships

Format your response as a single Python file with all necessary imports, functions, 
and a main execution block. Add helpful comments to explain your integration strategy.

Return only the final integrated Python code without explanation or other text.
"""

    system_message = SystemMessage(content="""You are a Python expert who specializes in integrating multiple code modules 
into cohesive solutions. You excel at understanding module dependencies and creating orchestration code.""")
    human_message = HumanMessage(content=prompt)
    
    response = model.invoke([system_message, human_message])
    content = response.content
    
    # Extract code from response
    if "```python" in content and "```" in content.split("```python", 1)[1]:
        # Extract code between markers
        code = content.split("```python", 1)[1].split("```", 1)[0].strip()
    elif "```" in content and content.count("```") >= 2:
        # Alternative extraction
        parts = content.split("```", 2)
        code = parts[1]
        if code.startswith("python"):
            code = code[6:]
        code = code.strip()
    else:
        # If not wrapped in code blocks, return as is
        code = content
    
    return code

def format_api_docs_for_llm(module_docs: Dict[str, Any]) -> str:
    """Format API documentation for use in LLM prompt, including relationship information."""
    formatted_docs = []
    
    for module_name, doc in module_docs.items():
        module_text = [f"MODULE: {module_name}_code.py"]
        
        # Add module docstring
        module_text.append(f"Description: {doc['docstring']}")
        module_text.append("")
        
        # Add imports
        if doc["imports"]:
            module_text.append("Imports:")
            for imp in doc["imports"]:
                if "name" in imp:
                    from_txt = f"from {imp['module']} " if imp['module'] else "from "
                    as_txt = f" as {imp['alias']}" if imp['alias'] else ""
                    module_text.append(f"  {from_txt}import {imp['name']}{as_txt}")
                else:
                    as_txt = f" as {imp['alias']}" if imp['alias'] else ""
                    module_text.append(f"  import {imp['module']}{as_txt}")
            module_text.append("")
        
        # Add global variables
        if doc["global_vars"]:
            module_text.append("Global Variables:")
            for var in doc["global_vars"]:
                module_text.append(f"  {var['name']} = {var['value']}")
            module_text.append("")
        
        # Add classes
        if doc["classes"]:
            module_text.append("Classes:")
            for cls in doc["classes"]:
                bases = f"({', '.join(cls['bases'])})" if cls['bases'] else ""
                module_text.append(f"  class {cls['name']}{bases}:")
                module_text.append(f"    \"{cls['docstring']}\"")
                
                # Add class relationships
                if cls.get("relationships"):
                    module_text.append("    Relationships:")
                    inherits = cls["relationships"].get("inherits_from", [])
                    if inherits:
                        module_text.append(f"      Inherits from: {', '.join(inherits)}")
                    
                    used_by = cls["relationships"].get("used_by_functions", [])
                    if used_by:
                        module_text.append(f"      Used by functions: {', '.join(used_by)}")
                    
                    inst_by = cls["relationships"].get("instantiated_by", [])
                    if inst_by:
                        module_text.append(f"      Instantiated by: {', '.join(inst_by)}")
                    
                    module_text.append("")
                
                if cls["methods"]:
                    module_text.append("    Methods:")
                    for method in cls["methods"]:
                        params = []
                        for p in method["parameters"]:
                            param_type = f": {p['type']}" if p['type'] else ""
                            params.append(f"{p['name']}{param_type}")
                        
                        returns = f" -> {method['returns']}" if method['returns'] else ""
                        module_text.append(f"      def {method['name']}({', '.join(params)}){returns}:")
                        module_text.append(f"        \"{method['docstring']}\"")
                        
                        # Add method relationships
                        if method.get("relationships"):
                            module_text.append("        Relationships:")
                            calls = method["relationships"].get("calls_functions", [])
                            if calls:
                                module_text.append(f"          Calls functions: {', '.join(calls)}")
                            
                            instantiates = method["relationships"].get("instantiates_classes", [])
                            if instantiates:
                                module_text.append(f"          Instantiates classes: {', '.join(instantiates)}")
                            
                            accesses = method["relationships"].get("accesses_attributes", [])
                            if accesses:
                                module_text.append(f"          Accesses attributes: {', '.join(accesses)}")
                            
                            called_by = method["relationships"].get("called_by", [])
                            if called_by:
                                module_text.append(f"          Called by: {', '.join(called_by)}")
                            
                            module_text.append("")
                        
                module_text.append("")
        
        # Add functions
        if doc["functions"]:
            module_text.append("Functions:")
            for func in doc["functions"]:
                params = []
                for p in func["parameters"]:
                    param_type = f": {p['type']}" if p['type'] else ""
                    params.append(f"{p['name']}{param_type}")
                
                returns = f" -> {func['returns']}" if func['returns'] else ""
                module_text.append(f"  def {func['name']}({', '.join(params)}){returns}:")
                module_text.append(f"    \"{func['docstring']}\"")
                
                # Add function relationships
                if func.get("relationships"):
                    module_text.append("    Relationships:")
                    calls = func["relationships"].get("calls_functions", [])
                    if calls:
                        module_text.append(f"      Calls functions: {', '.join(calls)}")
                    
                    instantiates = func["relationships"].get("instantiates_classes", [])
                    if instantiates:
                        module_text.append(f"      Instantiates classes: {', '.join(instantiates)}")
                    
                    accesses = func["relationships"].get("accesses_attributes", [])
                    if accesses:
                        module_text.append(f"      Accesses attributes: {', '.join(accesses)}")
                    
                    called_by = func["relationships"].get("called_by", [])
                    if called_by:
                        module_text.append(f"      Called by: {', '.join(called_by)}")
                    
                    module_text.append("")
                
                module_text.append("")
        
        # Add module-level relationships
        if doc.get("relationships"):
            module_text.append("Module Relationships:")
            
            # Dependencies
            deps = doc["relationships"].get("dependencies", {})
            imports = deps.get("imports", [])
            if imports:
                module_text.append(f"  Imports modules: {', '.join(imports)}")
            
            from_imports = deps.get("from_imports", [])
            if from_imports:
                module_text.append(f"  Imports from: {', '.join(from_imports)}")
            
            # Entry points
            entry_points = doc["relationships"].get("entry_points", [])
            if entry_points:
                module_text.append(f"  Entry points: {', '.join(entry_points)}")
            
            module_text.append("")
        
        formatted_docs.append("\n".join(module_text))
    
    return "\n\n" + "\n\n".join(formatted_docs) + "\n"