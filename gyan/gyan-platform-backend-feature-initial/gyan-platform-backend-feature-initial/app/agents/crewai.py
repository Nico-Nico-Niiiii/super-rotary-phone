from fastapi import FastAPI, HTTPException
from crewai import Agent, Task, Crew, Process
from crewai.tools import BaseTool
import json
import os
from typing import List, Optional
from langchain_community.utilities import GoogleSerperAPIWrapper, SearxSearchWrapper, OpenWeatherMapAPIWrapper, WikipediaAPIWrapper, ArxivAPIWrapper
from langchain_community.tools import DuckDuckGoSearchRun
from langchain_community.tools.tavily_search import TavilySearchResults
from langchain_community.tools import WikipediaQueryRun
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field
import re
from app.models.agent_workflow import AgentWorkflow

os.environ["SERPER_API_KEY"] = "eb026bae3f757ddfb9be8023a07de95612602500"
os.environ["HUGGINGFACE_API_KEY"] = "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"
os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4"
os.environ["AZURE_API_VERSION"] = "2024-08-01-preview"
os.environ["AZURE_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
os.environ["AZURE_API_BASE"] = "https://openaisk123.openai.azure.com/"
os.environ["TAVILY_API_KEY"] = "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"
os.environ["OPENWEATHERMAP_API_KEY"] = "abcd2d55295fa073145656eba3e85c8b"

def fetch_workflow_from_db(db: Session, agent_pro_id: str):
    """Simulate fetching workflow data from a database."""
    workflow = db.query(AgentWorkflow).filter(AgentWorkflow.agent_pro_id == agent_pro_id).first()
    return workflow.workflow_data

class AgentInfo(BaseModel):
    agent_name: str
    role: str
    goal: str
    backstory: str
    selected_llm: str
    selected_tool: str
    predecessor: Optional[str] = None
    successor: List[str] = []

class TaskInfo(BaseModel):
    description: str
    expected_output: str
    agent_name: str

class WorkflowRequest(BaseModel):
    agent_pro_id: str

class DynamicTool(BaseTool):
    """A flexible tool class that can wrap any tool selected by the user."""
    name: str
    description: str
    tool: object  
 
    def _run(self, query: str) -> str:
        """Execute the selected tool with the given query"""
        try:
            # Simplify input handling - extract string from any format
            actual_query = query
            if isinstance(query, dict):
                if 'query' in query:
                    if isinstance(query['query'], dict) and 'description' in query['query']:
                        actual_query = query['query']['description']
                    else:
                        actual_query = query['query']
            elif isinstance(query, str):
                # Try to parse JSON string
                try:
                    parsed = json.loads(query)
                    if isinstance(parsed, dict) and 'query' in parsed:
                        if isinstance(parsed['query'], dict) and 'description' in parsed['query']:
                            actual_query = parsed['query']['description']
                        else:
                            actual_query = parsed['query']
                except:
                    # If not JSON, use the string directly
                    actual_query = query
                   
            # Run the tool with the extracted query
            if hasattr(self.tool, 'run'):
                return self.tool.run(actual_query)
            return self.tool(actual_query)
        except Exception as e:
            return f"Error: {str(e)}"

class CrewAIService:
    def __init__(self):
        """Initialize the CrewAI service with model and tool mappings."""
        self.tool_map = {
            "google_search": {
                "name": "Google Search",
                "tool": GoogleSerperAPIWrapper(),
                "description": "Useful for search-based queries about markets, companies, and trends."
            },
            "duckduckgo": {
                "name": "Duck Duck Go Search",
                "tool": DuckDuckGoSearchRun(),
                "description": "Useful for search-based queries"
            },
            "searx": {
                "name": "SearxSearch",
                "tool": SearxSearchWrapper(searx_host="http://127.0.0.1:8888"),
                "description": "Search the web using Searx."
            },
            "tavily_search": {
                "name": "Tavily Search",
                "tool": TavilySearchResults(max_results=5, search_depth="advanced"),
                "description": "Useful for better search results."
            },
            "weather_app": {
                "name": "Weather App",
                "tool": OpenWeatherMapAPIWrapper(),
                "description": "Searches for weather information."
            },
            "wikipedia": {
                "name": "Wikipedia Search",
                "tool": WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper()),
                "description": "Useful for Wikipedia-based searches."
            },
            "arxiv": {
                "name": "Arxiv Search",
                "tool": ArxivAPIWrapper(),
                "description": "Search for academic papers and research."
            }
        }

        self.model_map = {
            "llama3": "huggingface/meta-llama/Meta-Llama-3-8B-Instruct",
            "gpt-4": "azure/gpt-4o",
            "palm2": "google/palm-2"
        }

        self.process_map = {
            "sequential": Process.sequential,
            "hierarchical": Process.hierarchical,
        }
    
    def get_tools(self, tool_names: str):
        """Convert tool names to tool implementations"""
        tool_names = [tool_names]
        tools = []
        for tool_name in tool_names:
            if tool_name in self.tool_map:
                tool_info = self.tool_map[tool_name]
                tools.append(DynamicTool(
                    name=tool_info["name"],
                    description=tool_info["description"],
                    tool=tool_info["tool"]
                ))
            else:
                raise ValueError(f"Unknown tool: {tool_name}")
        return tools
    

    def get_model(self, model_name: str) -> str:
        """Convert model name into a valid model string."""
        if model_name.lower() in self.model_map:
            return self.model_map[model_name.lower()]
        raise ValueError(f"Unknown model: {model_name}")

    def create_agent(self, agent_info: AgentInfo) -> Agent:
        """Create a CrewAI Agent with tools and model."""
        print("1")
        print(agent_info.selected_tool)
        tools = self.get_tools(agent_info.selected_tool)
        print("2")
        model = self.get_model(agent_info.selected_llm)

        print("tools", tools)
        print("model", model)

        return Agent(
            llm=model,
            name=agent_info.agent_name,
            role=agent_info.role,
            goal=agent_info.goal,
            backstory=agent_info.backstory,
            verbose=True,
            tools=tools
        )


    def run_workflow(self,db :Session, agent_pro_id: str, message: Optional[str]) -> str:
        """Fetch workflow data, format it, and execute it using CrewAI."""
        try:
            # Fetch workflow from database
            workflow_data = fetch_workflow_from_db(db, agent_pro_id)
            print("Getting workflow", workflow_data)
            # Process nodes & connections to update predecessor & successor
            node_map = {node["id"]: node for node in workflow_data["nodes"]}
            print("Node map" , node_map)
            for connection in workflow_data["connections"]:
                source = connection["source"]
                target = connection["target"]
                node_map[source]["agentInfo"]["successor"].append(target)
                node_map[target]["agentInfo"]["predecessor"] = source


            first_node = next((node for node in node_map.values() if node["agentInfo"]["predecessor"] is None), None)

            if first_node and message:
                node_map[first_node["id"]]["agentInfo"]["task_description"] = message
                print(f"Updated first node `{first_node['id']}` task_description with user message: {message}")

       
            formatted_nodes = list(node_map.values())
            print("-------------------------")
            print("Getting fomatted node", formatted_nodes)
            # Convert agents & tasks
            agents_dict = {}
            all_agents = []

            for node in formatted_nodes:
                agent_info = AgentInfo(**node["agentInfo"])
                agent = self.create_agent(agent_info)
                agents_dict[agent_info.agent_name] = agent
                all_agents.append(agent)
            
            print("All agents", all_agents)

            tasks = []
            for node in formatted_nodes:
                task_info = TaskInfo(
                    description=node["agentInfo"]["task_description"],
                    expected_output=node["agentInfo"].get("expected_output", "Task completed successfully"),
                    agent_name=node["agentInfo"]["agent_name"],
                )
                if task_info.agent_name in agents_dict:
                    task = Task(
                        description=task_info.description,
                        expected_output=task_info.expected_output,
                        agent=agents_dict[task_info.agent_name]
                    )
                    tasks.append(task)

            print("-----------------------------------")
            print("Tasks", tasks)
            print("-----------------------------------")
            print("Agent dict", agents_dict)

            process = self.process_map.get(workflow_data.get("process_type", "sequential"), Process.sequential)
            print("#######################################")
            print("Process", process)
            # Create & execute CrewAI workflow
            crew = Crew(
                agents=all_agents,
                tasks=tasks,
                process=process,
                memory= True,
                verbose=True,
                telemetry=False,
            )
            print("***********************************")
            print("Getting crew", crew)

            result = crew.kickoff()
            result = str(result).strip()

            return result

        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error executing workflow: {str(e)}")











# from fastapi import FastAPI, HTTPException
# from crewai import Agent, Task, Crew, Process
# from crewai.tools import BaseTool
# import json
# import os
# from typing import List, Optional
# from langchain_community.utilities import GoogleSerperAPIWrapper, SearxSearchWrapper, OpenWeatherMapAPIWrapper, WikipediaAPIWrapper,  ArxivAPIWrapper
# from langchain_community.tools import DuckDuckGoSearchRun
# from langchain_community.tools.tavily_search import TavilySearchResults
# from langchain_community.tools import WikipediaQueryRun
# from sqlalchemy.orm import Session
# from pydantic import BaseModel, Field


# from app.models.agent_workflow import AgentWorkflow


# os.environ["SERPER_API_KEY"] = "eb026bae3f757ddfb9be8023a07de95612602500"
# # os.environ["HUGGINGFACE_API_KEY"] = "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" #paid token
# os.environ["HUGGINGFACE_API_KEY"]= "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"
# os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"] = "gpt-4"
# os.environ["AZURE_API_VERSION"] = "2024-08-01-preview"
# os.environ["AZURE_API_KEY"] = "0bf3daeba1814d03b5d62e1da4077478"
# os.environ["AZURE_API_BASE"] = "https://openaisk123.openai.azure.com/"
# os.environ["TAVILY_API_KEY"] = "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"
# os.environ["OPENWEATHERMAP_API_KEY"] = "abcd2d55295fa073145656eba3e85c8b"


# def fetch_workflow_from_db(db:Session, agent_pro_id: str):
#     """Simulate fetching workflow data from a database."""
#     # Replace with real database fetch (e.g., SQLAlchemy, Firebase, MongoDB)
#     return db.query(AgentWorkflow).filter(AgentWorkflow.agent_pro_id == agent_pro_id).first()

# class AgentInfo(BaseModel):
#     agent_name: str
#     role: str
#     goal: str
#     backstory: str
#     model_name: str
#     tools: List[str]
#     predecessor: Optional[str] = None
#     successor: List[str] = []


# class TaskInfo(BaseModel):
#     description: str
#     expected_output: str
#     agent_name: str


# class WorkflowRequest(BaseModel):
#     agent_pro_id: str

  


# class CrewAIService:
#     def __init__(self):
#         """Initialize the CrewAI service with model and tool mappings."""
#         self.tool_map = {
#             "google_search": {
#                 "name": "Google Search",
#                 "tool": GoogleSerperAPIWrapper(),
#                 "description": "Useful for search-based queries about markets, companies, and trends."
#             },
#             "duckduckgo": {
#                 "name": "Duck Duck Go Search",
#                 "tool": DuckDuckGoSearchRun(),
#                 "description": "Useful for search-based queries"
#             },
#             "searx": {
#                 "name": "SearxSearch",
#                 "tool": SearxSearchWrapper(searx_host="http://127.0.0.1:8888"),
#                 "description": "Search the web using Searx."
#             },
#             "tavily_search": {
#                 "name": "Tavily Search",
#                 "tool": TavilySearchResults(max_results=5, search_depth="advanced"),
#                 "description": "Useful for better search results."
#             },
#             "weather_app": {
#                 "name": "Weather App",
#                 "tool": OpenWeatherMapAPIWrapper(),
#                 "description": "Searches for weather information."
#             },
#             "wikipedia": {
#                 "name": "Wikipedia Search",
#                 "tool": WikipediaQueryRun(api_wrapper=WikipediaAPIWrapper()),
#                 "description": "Useful for Wikipedia-based searches."
#             },
#             "arxiv": {
#                 "name": "Arxiv Search",
#                 "tool": ArxivAPIWrapper(),
#                 "description": "Search for academic papers and research."
#             }
#         }

#         self.model_map = {
#             "llama3": "huggingface/meta-llama/Meta-Llama-3-8B-Instruct",
#             "gpt-4": "azure/gpt-4o"
#         }

#         self.process_map = {
#             "sequential": Process.sequential,
#             "hierarchical": Process.hierarchical,
#         }

#     def get_tools(self, tool_names: List[str]) -> List[BaseTool]:
#         """Convert tool names from the workflow into actual tool objects."""
#         tools = []
#         for tool_name in tool_names:
#             if tool_name in self.tool_map:
#                 tool_info = self.tool_map[tool_name]
#                 tools.append(BaseTool(
#                     name=tool_info["name"],
#                     description=tool_info["description"],
#                     tool=tool_info["tool"]
#                 ))
#             else:
#                 raise ValueError(f"Unknown tool: {tool_name}")
#         return tools

#     def get_model(self, model_name: str) -> str:
#         """Convert model name into a valid model string."""
#         if model_name.lower() in self.model_map:
#             return self.model_map[model_name.lower()]
#         raise ValueError(f"Unknown model: {model_name}")

#     def create_agent(self, agent_info: AgentInfo) -> Agent:
#         """Create a CrewAI Agent with tools and model."""
#         tools = self.get_tools(agent_info.selected_tool)
#         model = self.get_model(agent_info.selected_llm)

#         return Agent(
#             llm=model,
#             name=agent_info.agent_name,
#             role=agent_info.role,
#             goal=agent_info.goal,
#             backstory=agent_info.backstory,
#             verbose=True,
#             tools=tools
#         )

#     def run_workflow(self, agent_pro_id: str) -> str:
#         """Fetch workflow data, format it, and execute it using CrewAI."""
#         try:
#             # Fetch workflow from database
#             workflow_data = fetch_workflow_from_db(agent_pro_id)

#             # Process nodes & connections to update predecessor & successor
#             node_map = {node["id"]: node for node in workflow_data["nodes"]}

#             for connection in workflow_data["connections"]:
#                 source = connection["source"]
#                 target = connection["target"]
#                 node_map[source]["agentInfo"]["successor"].append(target)
#                 node_map[target]["agentInfo"]["predecessor"] = source

#             formatted_nodes = list(node_map.values())

#             # Convert agents & tasks
#             agents_dict = {}
#             all_agents = []

#             for node in formatted_nodes:
#                 agent_info = AgentInfo(**node["agentInfo"])
#                 agent = self.create_agent(agent_info)
#                 agents_dict[agent_info.agent_name] = agent
#                 all_agents.append(agent)

#             tasks = []
#             for node in formatted_nodes:
#                 task_info = TaskInfo(
#                     description=node["agentInfo"]["goal"],
#                     expected_output="Task completed successfully",
#                     agent_name=node["agentInfo"]["agent_name"],
#                 )
#                 if task_info.agent_name in agents_dict:
#                     task = Task(
#                         description=task_info.description,
#                         expected_output=task_info.expected_output,
#                         agent=agents_dict[task_info.agent_name],
#                     )
#                     tasks.append(task)

#             process = self.process_map.get(workflow_data.get("process_type", "sequential"), Process.sequential)

#             # Create & execute CrewAI workflow
#             crew = Crew(
#                 agents=all_agents,
#                 tasks=tasks,
#                 process=process,
#                 verbose=True,
#                 telemetry=False,
#             )

#             result = crew.kickoff()
#             return result

#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Error executing workflow: {str(e)}")
