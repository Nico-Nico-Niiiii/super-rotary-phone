from langchain_core.tools import tool
from langgraph.graph import StateGraph, END
from langchain_openai import AzureChatOpenAI

import re
import os
import subprocess
import tempfile
import pandas as pd
from typing import TypedDict, Optional, Annotated

from app.usecases.agent_code_review.prompts import reviewer_start, coder_start, rating_start, code_comparison, classify_feedback

model = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
)

def llm(x):
    return model.invoke(x).content


class GraphState(TypedDict):
    feedback: Optional[str] = None
    history: Optional[str] = None
    code: Optional[str] = None
    specialization: Optional[str]=None
    rating: Optional[str] = None
    iterations: Optional[int]=None
    code_compare: Optional[str]=None
    actual_code: Optional[str]=None
    tool_output: Optional[str]= None
    style_guide: Optional[str]=None

workflow = StateGraph(GraphState)


@tool
def execute_code(
    language: Annotated[str, "Programming language to execute the code"],
    code: Annotated[str, "Code snippet to be executed"],
) -> str:
    """Executes code in the given programming language and returns the output or error message.
    If you want to see the output of a value, you should print it out using `print(...)`.
    """

    # Language configurations for file extension and execution commands
    lang_config = {
        "python": {"ext": ".py", "run": ["python3"]},
        "c": {"ext": ".c", "compile": ["gcc"], "run": ["./a.out"]},
        "cpp": {"ext": ".cpp", "compile": ["g++"], "run": ["./a.out"]},
        "java": {"ext": ".java", "compile": ["javac"], "run": ["java"]},
        "javascript": {"ext": ".js", "run": ["node"]},
        "bash": {"ext": ".sh", "run": ["bash"]},
        "go": {"ext": ".go", "run": ["go", "run"]},
        "rust": {"ext": ".rs", "compile": ["rustc"], "run": ["./temp_exec"]},
    }

    if language not in lang_config:
        return f"Unsupported language: {language}"
    
    config = lang_config[language]
    
    # Create a temporary file with the correct extension
    with tempfile.NamedTemporaryFile(delete=False, suffix=config["ext"]) as temp_file:
        temp_file.write(code.encode())
        temp_file_name = temp_file.name

    try:
        # Compilation Step (if required)
        if "compile" in config:
            compile_cmd = config["compile"] + [temp_file_name]
            compile_process = subprocess.run(compile_cmd, capture_output=True, text=True)
            if compile_process.returncode != 0:
                return f"Compilation Error:\n{compile_process.stderr}"

        # Execution Step
        run_cmd = config["run"]
        if language == "java":
            run_cmd.append(temp_file_name.replace(".java", ""))
        
        exec_process = subprocess.run(run_cmd + [temp_file_name], capture_output=True, text=True)
        
        return exec_process.stdout if exec_process.returncode == 0 else f"Execution Error:\n{exec_process.stderr}"
    
    finally:
        # Cleanup: Delete temporary files
        os.remove(temp_file_name)
        if language in ["c", "cpp", "rust"]:
            os.remove("./a.out") if os.path.exists("./a.out") else None
            os.remove("./temp_exec") if os.path.exists("./temp_exec") else None


def clean_code_block(code):
    # Remove first and last triple backticks along with the language specifier
    print("code cleaning")
    cleaned_code = re.sub(r"^```[a-zA-Z]*\n|\n```$", "", code, flags=re.MULTILINE)
    return cleaned_code


def handle_reviewer(state):
    history = state.get('history', '').strip()
    code = state.get('code', '').strip()
    specialization = state.get('specialization','').strip()
    style_guide = state.get('style_guide','').strip()
    iterations = state.get('iterations')
    clean_code = clean_code_block(code)
    print("cleancode: ",clean_code)
    tool_output = execute_code.invoke({"language": specialization, "code": clean_code})
    print("Using Tool...") 
    print(tool_output)
    # print(code)
    print("Reviewer working...")
    
    feedback = llm(reviewer_start.format(specialization,style_guide,code,tool_output))
    print(feedback)
    return {'history':history+"\n REVIEWER:\n"+feedback,'feedback':feedback,'iterations':iterations+1}

def handle_coder(state):
    history = state.get('history', '').strip()
    feedback = state.get('feedback', '').strip()
    code =  state.get('code','').strip()
    specialization = state.get('specialization','').strip()
    style_guide = state.get('style_guide','').strip()

    
    print("CODER rewriting...")
    
    code = llm(coder_start.format(specialization,style_guide,feedback,code))
    print(code)
    return {'history':history+'\n CODER:\n'+code,'code':code}

def handle_result(state):
    history = state.get('history', '').strip()
    code1 = state.get('code', '').strip()
    code2 = state.get('actual_code', '').strip()
    specialization = state.get('specialization','').strip()
    style_guide = state.get('style_guide','').strip()

    first_tool_output = execute_code.invoke({"language": specialization, "code": code2})
    print(first_tool_output)
      
    print(code2,style_guide)
    rating  = llm(rating_start.format(code2,style_guide,first_tool_output))
    print(code1)
    code_compare = llm(code_comparison.format(code1,code2,style_guide))
    print("Review done...")

    return {
        'rating': rating,
        'code_compare': code_compare
    }


workflow.add_node("handle_reviewer",handle_reviewer)
workflow.add_node("handle_coder",handle_coder)
workflow.add_node("handle_result",handle_result)

def deployment_ready(state):
    deployment_ready = 1 if 'yes' in llm(classify_feedback.format(state.get('code'),state.get('feedback'))) else 0
    total_iterations = 1 if state.get('iterations')>2 else 0
    return "handle_result" if  deployment_ready or total_iterations else "handle_coder" 


workflow.add_conditional_edges(
    "handle_reviewer",
    deployment_ready,
    {
        "handle_result": "handle_result",
        "handle_coder": "handle_coder"
    }
)

workflow.set_entry_point("handle_reviewer")
workflow.add_edge('handle_coder', "handle_reviewer")
workflow.add_edge('handle_result', END)