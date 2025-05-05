# from IPython.display import Image, display
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import time
import operator
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage


class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]

class Reqs_Agent:
    def __init__(self, model, checkpointer, system_developer="", system_validator="", system_corrector=""):
        self.system_developer = system_developer
        self.system_validator = system_validator
        self.system_corrector = system_corrector

        # Initialize a list to store logs
        self.execution_trace = []

        graph = StateGraph(AgentState)
        
        graph.add_node("developer", self.developer)
        graph.add_node("validator", self.validator)  
        graph.add_node("correction", self.correction)

        graph.add_edge("developer", "validator")

     
        graph.add_conditional_edges("validator", lambda state: state["is_valid"], {
        True: END,
        False: "correction"
        })

        graph.add_edge("correction", END)

        graph.set_entry_point("developer")
        self.graph = graph.compile(checkpointer = checkpointer)
        self.model = model

    # def log_steps(self, step_name, state):
    #     timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
    #     self.execution_trace.append({
    #         "step": step_name,
    #         "timestamp": timestamp,
    #         "messages": [msg.content for msg in state.get("messages", [])],
    #         "is_valid": state.get("is_valid", None)
    #     })

    #     print(f"[{timestamp}] Step: {step_name}, Messages: {self.execution_trace[-1]['messages']}, Is Valid: {state.get('is_valid')}")

    def log_steps(self, step_name, state):
        timestamp = time.strftime("%Y-%m-%d %H:%M:%S", time.localtime())
        self.execution_trace.append({
        "step": step_name,
        "timestamp": timestamp,
        "messages": state.get("messages", []),  # Store the full message objects
        "is_valid": state.get("is_valid", None)
    })

    def developer(self, state: AgentState):
        self.log_steps("Developing...", state)
        messages = state['messages']
        print(messages)
        print("developer","*" * 50)
        if self.system_developer:
            messages = [SystemMessage(content=self.system_developer)] + messages
        message = self.model.invoke(messages)
        print("developer: ",message)
        return {'messages': [message]}
    
    def validator(self, state: AgentState):
        self.log_steps("Validating...", state)
        messages = state.get("messages", [])
        print(messages)
        print("validate","*" * 50)

        if self.system_validator:
            messages = [SystemMessage(content=self.system_validator)] + messages

        message = self.model.invoke(messages)
        response_text = getattr(message, "content", "").lower()

        is_valid = "correctly reflects" in response_text and "no contradictions" in response_text
        res = {"is_valid": is_valid, "messages": [message]}  
        return res


    def correction(self, state: AgentState):
        self.log_steps("Correcting...", state)
        messages = state['messages']
        print(messages)
        print("correction","*" * 50)

        if self.system_corrector:
            messages = [SystemMessage(content=self.system_corrector)] + messages
        message = self.model.invoke(messages)
        return {'messages': [message]}

    def get_exection_trace(self):
        return self.execution_trace