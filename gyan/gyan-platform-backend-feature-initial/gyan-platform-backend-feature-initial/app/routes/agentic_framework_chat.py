#  ppt part # new changes testing code
import os
from dotenv import load_dotenv
import time
import re

# Load from .env file
load_dotenv()
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME")

TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Body
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional, Tuple
import asyncio
import uuid
from datetime import datetime
import json
import traceback
from starlette.responses import FileResponse
from starlette.background import BackgroundTask
import shutil

# Additional Imports Needed
from sqlalchemy import func
from datetime import timedelta

from app.core.config import settings
from app.database.connection import get_db

# LangChain and LangGraph imports
from langgraph.graph import StateGraph, END
from typing import TypedDict, Annotated
import operator
from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage, AIMessage
from langchain_openai import AzureChatOpenAI
from langchain_community.tools.tavily_search import TavilySearchResults
from langgraph.checkpoint.memory import MemorySaver

# Pydantic models
from pydantic import BaseModel

# SQLAlchemy models
from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from app.database.connection import Base

# Import LangGraph PowerPoint Tool
from app.tools.langgraph_ppt_tool import LangGraphPPTGenerator

# Create directories for presentations and temporary downloads
presentations_dir = os.path.join(os.getcwd(), "presentations")
os.makedirs(presentations_dir, exist_ok=True)

temp_downloads_dir = os.path.join(os.getcwd(), "temp_downloads")
os.makedirs(temp_downloads_dir, exist_ok=True)

# Custom JSON Encoder
class LangChainJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (HumanMessage, AIMessage, ToolMessage, SystemMessage)):
            return {
                "type": obj.__class__.__name__,
                "content": obj.content,
                "additional_kwargs": obj.additional_kwargs
            }
        return super().default(obj)

# Database Models
class AgenticConversation(Base):
    __tablename__ = "agentic_conversations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    title = Column(String, nullable=True)
    
    def __repr__(self):
        return f"<AgenticConversation(id={self.id}, created_at={self.created_at})>"

class AgenticMessage(Base):
    __tablename__ = "agentic_messages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("agentic_conversations.id"))
    content = Column(Text)
    sender = Column(String)  # 'user', 'ai', 'tool', 'system'
    created_at = Column(DateTime, default=datetime.utcnow)
    message_metadata = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<AgenticMessage(id={self.id}, sender={self.sender})>"

class AgenticToolCall(Base):
    __tablename__ = "agentic_tool_calls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id = Column(UUID(as_uuid=True), ForeignKey("agentic_conversations.id"))
    tool_name = Column(String)
    input_data = Column(JSON, nullable=True)
    output_data = Column(JSON, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    def __repr__(self):
        return f"<AgenticToolCall(id={self.id}, tool_name={self.tool_name})>"

# Define the agent state
class AgentState(TypedDict):
    messages: Annotated[list[AnyMessage], operator.add]

# Agent class implementation
class Agent:
    def __init__(self, model, tools, checkpointer, system=""):
        self.system = system
        graph = StateGraph(AgentState)
        graph.add_node("llm", self.call_openai)
        graph.add_node("action", self.take_action)
        graph.add_conditional_edges("llm", self.exists_action, {True: "action", False: END})
        graph.add_edge("action", "llm")
        graph.set_entry_point("llm")
        self.graph = graph.compile(checkpointer=checkpointer)
        self.tools = {t.name: t for t in tools}
        self.model = model.bind_tools(tools)

    async def call_openai(self, state: AgentState):
        messages = state['messages']
        if self.system:
            messages = [SystemMessage(content=self.system)] + messages
        message = await self.model.ainvoke(messages)
        return {'messages': [message]}

    def exists_action(self, state: AgentState):
        result = state['messages'][-1]
        return len(result.tool_calls) > 0

    async def take_action(self, state: AgentState):
        tool_calls = state['messages'][-1].tool_calls
        results = []
        for t in tool_calls:
            result = await self.tools[t['name']].ainvoke(t['args'])
            results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))
        return {'messages': results}

# System Prompt for the Agent
SYSTEM_PROMPT = """You are a smart research assistant. 
- Use the search engine to look up information accurately.
- Provide clear, concise, and helpful responses.
- If you're unsure about something, acknowledge it.
- Always prioritize giving the most relevant and useful information.
"""

# Initialize tools and model
memory = MemorySaver()
search_tool = TavilySearchResults(max_results=3)

model = AzureChatOpenAI(
    openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
    azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
    azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
    api_key=os.environ["AZURE_OPENAI_API_KEY"],
    # Add these parameters for more robust configuration
    max_tokens=1000,
    temperature=0.7,
    max_retries=3
)

# Initialize PowerPoint generator with existing model and search tool
ppt_generator = LangGraphPPTGenerator(
    model=model,
    search_tool=search_tool,
    presentations_dir=presentations_dir
)

# Initialize the agent with tools
agent = Agent(model, [search_tool], checkpointer=memory, system=SYSTEM_PROMPT)

# Global storage for active streaming tasks
active_streams = {}

PPT_KEYWORDS = ["ppt", "powerpoint", "presentation", "slides", "slide deck", "microsoft powerpoint"]


def detect_ppt_request(text: str) -> bool:
    """
    Detect if the user is requesting a PowerPoint presentation.
    
    Args:
        text (str): The user's input message
        
    Returns:
        bool: True if the input appears to be a PowerPoint request
    """
    text_lower = text.lower()
    return any(keyword in text_lower for keyword in PPT_KEYWORDS)


def extract_ppt_topic(text: str) -> str:
    """
    Extract the presentation topic from the request.
    
    Args:
        text (str): The user's input message
        
    Returns:
        str: The extracted topic or a default message
    """
    # Regex pattern for extracting the topic
    topic_pattern = re.compile(r"(?i)(?:about|on|for) (.+)$")
    
    # Check if any PPT keyword is in the text
    if detect_ppt_request(text):
        match = topic_pattern.search(text)
        if match:
            return match.group(1).strip()
    
    # Default if no specific topic found
    return "the requested topic"
# Pydantic Models for Request/Response
class QueryRequest(BaseModel):
    query: str
    conversation_id: Optional[str] = None
    image_url: Optional[str] = None
    skip_greeting: Optional[bool] = False  # Added parameter to control greeting behavior

class QueryResponse(BaseModel):
    conversation_id: str
    message_id: str

class MessageResponse(BaseModel):
    id: str
    content: str
    sender: str
    created_at: datetime
    metadata: Optional[Dict[str, Any]] = None

class StreamEvent(BaseModel):
    event: str
    data: Dict[str, Any]

class StreamResponse(BaseModel):
    events: List[StreamEvent]
    is_active: bool

class ConversationListItem(BaseModel):
    id: str
    created_at: datetime
    updated_at: datetime
    title: Optional[str] = None
    preview: Optional[str] = None

class ConversationList(BaseModel):
    conversations: List[ConversationListItem]

class ConversationDetail(BaseModel):
    conversation_id: str
    messages: List[MessageResponse]

async def process_stream(query: str, conversation_id: str, thread: Dict, db: Session, skip_greeting: bool = False):
    """
    Enhanced stream processing that shows intermediate thoughts and tool calls step by step,
    with forced delays to ensure sequential display and prevent duplicate responses
    """
    start_time = datetime.utcnow()
    full_content = ""
    current_thinking = ""
    message_id_tracker = {}  # Track message IDs to avoid duplication
    response_segments = []   # Collect different segments of the response
    
    # Add a set to track sent message IDs within this streaming session
    sent_message_ids = set()

    try:
        print(f"Starting stream processing for conversation {conversation_id}")
        print(f"Input Query: {query}")
        print(f"Skip greeting: {skip_greeting}")
        
        # Initialize stream storage with timestamps
        active_streams[conversation_id] = []
        
        # Prepare messages
        messages = []
        
        # Only add standard system message if this isn't a continuing conversation
        if not skip_greeting:
            messages.append(SystemMessage(content="You are a helpful assistant that provides concise answers."))
        else:
            # Use a system message that doesn't trigger a greeting for continuing conversations
            messages.append(SystemMessage(content="Continue the conversation naturally without introducing yourself again."))
        
        messages.append(HumanMessage(content=query))
        
        # Track if final answer has been processed to prevent duplicates
        final_answer_processed = False
        
        # Process stream events
        async for event in agent.graph.astream_events({"messages": messages}, thread, version="v1"):
            # Add timestamp to event
            event_with_timestamp = {
                "event": event.get("event"),
                "data": event.get("data", {}),
                "timestamp": int(time.time() * 1000)  # Current time in milliseconds
            }
            
            kind = event.get("event")
            print(f"Detailed Event: {kind} - Full Event Data: {event}")
            
            # Chat Model Streaming (intermediate thinking)
            if kind == "on_chat_model_stream":
                try:
                    chunk = event.get("data", {}).get("chunk")
                    chunk_content = ""
                    if hasattr(chunk, "content") and chunk.content:
                        chunk_content = chunk.content
                    elif isinstance(chunk, str):
                        chunk_content = chunk
                    
                    if chunk_content:
                        current_thinking += chunk_content
                        
                        # Create thinking update event with timestamp
                        thinking_event = {
                            "event": "thinking_update",
                            "data": {
                                "content": current_thinking,
                                "is_complete": False,
                                "segment_type": "thinking"
                            },
                            "timestamp": int(time.time() * 1000)
                        }
                        
                        # Immediately send thinking update as streaming
                        active_streams[conversation_id].append(thinking_event)
                        
                        # Add short delay to ensure frontend has time to process
                        await asyncio.sleep(0.05)
                except Exception as chunk_error:
                    print(f"Error processing stream chunk: {chunk_error}")
            
            # Rest of the existing code remains the same...
            
            # Modify the final AI message processing to prevent duplicates
            elif kind == "on_chain_end" and "output" in event.get("data", {}):
                if final_answer_processed:
                    continue  # Skip if final answer has already been processed
                
                data = event.get("data", {})
                output = data.get("output", {})
                
                if isinstance(output, dict) and "messages" in output:
                    for msg in output["messages"]:
                        if isinstance(msg, AIMessage) and msg.content:
                            final_content = msg.content
                            
                            # Ensure only one response
                            if final_answer_processed:
                                break
                            
                            # Replace any double newlines with a space to ensure it's a single paragraph
                            # final_content = final_content.replace('\n\n', ' ').replace('\n', ' ').strip()

                            # Only replace excessive newlines (more than 2) with double newlines
                            import re
                            final_content = re.sub(r'\n{3,}', '\n\n', final_content.strip())
                            
                            # final_content = re.sub(r'\n+', '\n', final_content.strip())
                            final_content = re.sub(r'\r?\n+', '\n', final_content.strip())
                            # final_content = re.sub(r'\*\*(.*?)\*\*', r'**\1**', final_content)
                            # final_content = re.sub(r'(?<=\S)\n(?=\S)', ' ', final_content)
                            
                            final_content = re.sub(r'([^\n])(\d+[\.\)])', r'\1\n\2', final_content)
                    
                            answer_id = str(uuid.uuid4())
                            
                            # Skip if this answer ID has already been sent
                            if answer_id in sent_message_ids:
                                print(f"Skipping duplicate answer: {answer_id}")
                                continue
                            
                            sent_message_ids.add(answer_id)
                            message_id_tracker['answer'] = answer_id
                            
                            # Collect this as a segment
                            response_segments.append({
                                "type": "answer",
                                "content": final_content,
                                "id": answer_id
                            })
                            
                            # Send final answer as a complete message
                            active_streams[conversation_id].append({
                                "event": "message_complete",
                                "data": {
                                    "content": final_content,
                                    "message_id": answer_id,
                                    "segment_type": "answer"
                                },
                                "timestamp": int(time.time() * 1000)
                            })
                            
                            # Save to database
                            ai_message = AgenticMessage(
                                id=answer_id,
                                conversation_id=conversation_id,
                                content=final_content,
                                sender="ai",
                                message_metadata={"type": "answer"}
                            )
                            db.add(ai_message)
                            db.commit()
                            
                            full_content = final_content
                            final_answer_processed = True
                            break
        
        # Mark stream as complete
        active_streams[conversation_id].append({
            "event": "stream_complete",
            "data": {
                "content": full_content,
                "message_id": message_id_tracker.get('answer', None),
                "segments": response_segments
            },
            "timestamp": int(time.time() * 1000)
        })
        
        print(f"Stream processing completed for {conversation_id}")
        print(f"Final Full Content: {full_content}")
        print(f"Response Segments: {response_segments}")

    except Exception as e:
        print(f"Error in stream processing: {e}")
        traceback.print_exc()
        
        # Log error to database
        error_message = AgenticMessage(
            conversation_id=conversation_id,
            content=f"Processing Error: {str(e)}",
            sender="system",
            message_metadata={
                "error": str(e),
                "traceback": traceback.format_exc()
            }
        )
        db.add(error_message)
        db.commit()
        
        active_streams[conversation_id].append({
            "event": "error",
            "data": {
                "message": str(e),
                "traceback": traceback.format_exc()
            },
            "timestamp": int(time.time() * 1000)
        })

    return full_content

# PPT Generation process function
async def process_ppt_generation(topic: str, conversation_id: str, db: Session):
    """Process PowerPoint generation using LangGraph."""
    try:
        # Add thinking message to stream
        active_streams[conversation_id].append({
            "event": "thinking_update",
            "data": {
                "content": f"I'll create a PowerPoint presentation about '{topic}' for you. Let me gather some information...",
                "is_complete": False,
                "segment_type": "thinking"
            },
            "timestamp": int(time.time() * 1000)
        })
        
        # Add the tool usage message for search
        search_tool_id = str(uuid.uuid4())
        active_streams[conversation_id].append({
            "event": "tool_usage",
            "data": {
                "tool_name": "tavily_search_results",
                "message": f"Searching for information about '{topic}'...",
                "message_id": search_tool_id
            },
            "timestamp": int(time.time() * 1000)
        })
        
        # Run the LangGraph PPT generator
        result = await ppt_generator.generate_presentation(topic)
        
        # Mark the search as complete
        active_streams[conversation_id].append({
            "event": "tool_complete",
            "data": {
                "tool_name": "tavily_search_results",
                "message": f"Found information about '{topic}'",
                "message_id": search_tool_id
            },
            "timestamp": int(time.time() * 1000)
        })
        
        # Add PPT generation message
        ppt_tool_id = str(uuid.uuid4())
        active_streams[conversation_id].append({
            "event": "tool_usage",
            "data": {
                "tool_name": "powerpoint_generator",
                "message": f"Creating PowerPoint presentation about '{topic}'...",
                "message_id": ppt_tool_id
            },
            "timestamp": int(time.time() * 1000)
        })
        
        # Extract file information
        file_path = result.get("ppt_path", "")
        filename = os.path.basename(file_path)
        
        # Mark PPT generation as complete
        active_streams[conversation_id].append({
            "event": "tool_complete",
            "data": {
                "tool_name": "powerpoint_generator",
                "message": f"PowerPoint presentation created successfully!",
                "message_id": ppt_tool_id
            },
            "timestamp": int(time.time() * 1000)
        })
        
        # Record the search tool call in database
        search_tool_call = AgenticToolCall(
            conversation_id=conversation_id,
            tool_name="tavily_search_results",
            input_data=topic,
            output_data=result.get("search_results", []),
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(search_tool_call)
        
        # Record the PPT generation tool call
        ppt_tool_call = AgenticToolCall(
            conversation_id=conversation_id,
            tool_name="powerpoint_generator",
            input_data=topic,
            output_data={"filename": filename, "path": file_path},
            started_at=datetime.utcnow(),
            completed_at=datetime.utcnow()
        )
        db.add(ppt_tool_call)
        
        # Add final AI message
        ai_message_id = str(uuid.uuid4())
        ai_message = AgenticMessage(
            id=ai_message_id,
            conversation_id=conversation_id,
            content=f"I've created a PowerPoint presentation about '{topic}'. You can download it using the button below.",
            sender="ai",
            message_metadata={"ppt_filename": filename, "ppt_path": file_path}
        )
        db.add(ai_message)
        db.commit()
        
        # Add message to the stream
        active_streams[conversation_id].append({
            "event": "message_complete",
            "data": {
                "content": ai_message.content,
                "message_id": ai_message_id,
                "segment_type": "answer",
                "ppt_filename": filename
            },
            "timestamp": int(time.time() * 1000)
        })
        
        # Mark stream as complete
        active_streams[conversation_id].append({
            "event": "stream_complete",
            "data": {
                "content": ai_message.content,
                "message_id": ai_message_id,
                "ppt_filename": filename
            },
            "timestamp": int(time.time() * 1000)
        })
        
        print(f"PowerPoint generation completed for {conversation_id}: {filename}")
        
    except Exception as e:
        print(f"Error in PPT generation process: {e}")
        traceback.print_exc()
        
        # Add error message to the stream
        error_message = f"Error generating PowerPoint: {str(e)}"
        
        # Record error in database
        error_message_obj = AgenticMessage(
            conversation_id=conversation_id,
            content=error_message,
            sender="system",
            message_metadata={
                "error": str(e),
                "traceback": traceback.format_exc()
            }
        )
        db.add(error_message_obj)
        db.commit()
        
        # Add error to stream
        active_streams[conversation_id].append({
            "event": "error",
            "data": {
                "message": error_message,
                "traceback": traceback.format_exc()
            },
            "timestamp": int(time.time() * 1000)
        })

# FastAPI Routes
router = APIRouter(
    prefix="/api/agentic",
    tags=["agentic-framework"],
    responses={404: {"description": "Not found"}}
)

@router.post("/query", response_model=QueryResponse)
async def process_query(
    query_request: QueryRequest, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """Process user query and initiate streaming"""
    try:
        # Get the trimmed query string
        trimmed_query = query_request.query.strip()
        
        # Check if this is a PowerPoint request
        if detect_ppt_request(trimmed_query):
            print(f"Detected PowerPoint request: {trimmed_query}")
            # Extract the presentation topic
            topic = extract_ppt_topic(trimmed_query)
            print(f"Extracted topic: {topic}")
            
            # Create a new conversation or use existing one
            conversation_id = query_request.conversation_id or str(uuid.uuid4())
            
            # Ensure conversation exists
            conversation = db.query(AgenticConversation).filter(
                AgenticConversation.id == conversation_id
            ).first()
            
            if not conversation:
                conversation = AgenticConversation(
                    id=conversation_id,
                    title=f"PPT: {topic[:50]}"
                )
                db.add(conversation)
                db.commit()
            
            # Save user message
            user_message = AgenticMessage(
                id=uuid.uuid4(),
                conversation_id=conversation_id,
                content=trimmed_query,
                sender="user",
                message_metadata={
                    "image_url": query_request.image_url,
                    "is_ppt_request": True
                } if query_request.image_url else {"is_ppt_request": True}
            )
            db.add(user_message)
            db.commit()
            
            # Initialize stream storage with initial message
            active_streams[conversation_id] = []
            
            # Start background processing for PowerPoint generation
            background_tasks.add_task(
                process_ppt_generation,
                topic,
                conversation_id,
                db
            )
            
            return {
                "conversation_id": conversation_id,
                "message_id": str(user_message.id)
            }
            
        # Continue with normal query processing if not a PPT request
        # Determine conversation ID
        conversation_id = query_request.conversation_id or str(uuid.uuid4())
        
        # Ensure conversation exists
        conversation = db.query(AgenticConversation).filter(
            AgenticConversation.id == conversation_id
        ).first()
        
        # Check if this is a new conversation or continuing one
        is_new_conversation = False
        if not conversation:
            conversation = AgenticConversation(id=conversation_id)
            db.add(conversation)
            db.commit()
            is_new_conversation = True
        
        # Save user message
        user_message = AgenticMessage(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            content=query_request.query,
            sender="user",
            message_metadata={
                "image_url": query_request.image_url
            } if query_request.image_url else None
        )
        db.add(user_message)
        db.commit()
        
        # Prepare thread for agent
        thread = {"configurable": {"thread_id": conversation_id}}
        
        # Determine if we should skip greeting
        # Skip if explicitly requested or if this is not a new conversation
        should_skip_greeting = query_request.skip_greeting or not is_new_conversation
        
        # Start background stream processing
        background_tasks.add_task(
            process_stream, 
            query_request.query, 
            conversation_id, 
            thread,
            db,
            should_skip_greeting
        )
        
        return {
            "conversation_id": conversation_id, 
            "message_id": str(user_message.id)
        }
    
    except Exception as e:
        print(f"Error in query processing: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/stream/{conversation_id}", response_model=StreamResponse)
async def get_stream_events(
    conversation_id: str,
    since: Optional[int] = Query(None, description="Timestamp to get only events since this time")
):
    """Retrieve streaming events for a conversation"""
    try:
        # Check if conversation stream exists
        if conversation_id not in active_streams:
            return {"events": [], "is_active": False}
        
        # Get a copy of events
        all_events = active_streams.get(conversation_id, []).copy()
        
        # Filter events by timestamp if provided
        if since is not None:
            filtered_events = [event for event in all_events if event.get("timestamp", 0) > since]
        else:
            filtered_events = all_events.copy()
        
        # Get event IDs we're about to send
        event_timestamps = {event.get("timestamp") for event in filtered_events if "timestamp" in event}
        
        # Remove only the events we're sending from active_streams
        if event_timestamps:
            active_streams[conversation_id] = [
                event for event in all_events
                if event.get("timestamp") not in event_timestamps
            ]
        
        # Determine if stream is still active
        is_active = not any(
            event.get("event") in ["stream_complete", "error"] 
            for event in filtered_events
        )
        
        # Convert to StreamEvent model and remove timestamp field
        stream_events = []
        for e in filtered_events:
            event_data = {
                "event": e["event"],
                "data": e["data"]
            }
            stream_events.append(StreamEvent(**event_data))
        
        return {
            "events": stream_events, 
            "is_active": is_active
        }
    
    except Exception as e:
        print(f"Error retrieving stream events: {e}")
        traceback.print_exc()
        return {"events": [], "is_active": False}

# Download presentation endpoint
@router.get("/download/presentation/{filename}")
async def download_presentation(filename: str):
    """
    Download a generated PowerPoint presentation
    
    Args:
        filename (str): Name of the presentation file
        
    Returns:
        FileResponse: The presentation file for download
    """
    try:
        file_path = os.path.join(presentations_dir, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="Presentation not found")
        
        # Create a temp directory for copied files to handle concurrent access
        os.makedirs(temp_downloads_dir, exist_ok=True)
        
        # Copy the file to a temporary location
        temp_file_path = os.path.join(temp_downloads_dir, filename)
        shutil.copy2(file_path, temp_file_path)
        
        # Define cleanup task
        def remove_file():
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                print(f"Error removing temporary file: {e}")
        
        # Return file response with cleanup task
        return FileResponse(
            path=temp_file_path,
            filename=filename,
            media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
            background=BackgroundTask(remove_file)
        )
    
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        print(f"Error downloading presentation: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """
    Retrieve all messages for a specific conversation
    
    Args:
        conversation_id (str): Unique identifier for the conversation
        db (Session): Database session
    
    Returns:
        ConversationDetail: Conversation messages
    """
    try:
        # Verify conversation exists
        conversation = db.query(AgenticConversation).filter(
            AgenticConversation.id == conversation_id
        ).first()
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Retrieve messages, ordered by creation time
        messages = (
            db.query(AgenticMessage)
            .filter(AgenticMessage.conversation_id == conversation_id)
            .order_by(AgenticMessage.created_at)
            .all()
        )
        
        # Convert to response model
        message_responses = [
            MessageResponse(
                id=str(message.id),
                content=message.content,
                sender=message.sender,
                created_at=message.created_at,
                metadata=message.message_metadata
            )
            for message in messages
        ]
        
        return {
            "conversation_id": conversation_id, 
            "messages": message_responses
        }
    
    except Exception as e:
        print(f"Error retrieving conversation: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/conversation/{conversation_id}")
def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
    """
    Delete a conversation and all associated messages and tool calls
    
    Args:
        conversation_id (str): Unique identifier for the conversation
        db (Session): Database session
    
    Returns:
        dict: Confirmation message
    """
    try:
        # Verify conversation exists
        conversation = (
            db.query(AgenticConversation)
            .filter(AgenticConversation.id == conversation_id)
            .first()
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Delete associated tool calls
        tool_calls_deleted = (
            db.query(AgenticToolCall)
            .filter(AgenticToolCall.conversation_id == conversation_id)
            .delete(synchronize_session=False)
        )
        
        # Delete associated messages
        messages_deleted = (
            db.query(AgenticMessage)
            .filter(AgenticMessage.conversation_id == conversation_id)
            .delete(synchronize_session=False)
        )
        
        # Delete the conversation
        db.delete(conversation)
        
        # Commit changes
        db.commit()
        
        return {
            "message": "Conversation deleted successfully",
            "deleted_messages": messages_deleted,
            "deleted_tool_calls": tool_calls_deleted
        }
    
    except Exception as e:
        # Rollback in case of error
        db.rollback()
        print(f"Error deleting conversation: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/conversation/{conversation_id}/title")
def update_conversation_title(
    conversation_id: str, 
    title: str = Body(..., min_length=1, max_length=100),
    db: Session = Depends(get_db)
):
    """
    Update the title of a conversation
    
    Args:
        conversation_id (str): Unique identifier for the conversation
        title (str): New title for the conversation
        db (Session): Database session
    
    Returns:
        dict: Updated conversation details
    """
    try:
        # Find the conversation
        conversation = (
            db.query(AgenticConversation)
            .filter(AgenticConversation.id == conversation_id)
            .first()
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Update title
        conversation.title = title
        db.commit()
        
        return {
            "id": str(conversation.id),
            "title": conversation.title,
            "updated_at": conversation.updated_at
        }
    
    except Exception as e:
        db.rollback()
        print(f"Error updating conversation title: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/conversation/{conversation_id}/tools")
def get_conversation_tool_calls(
    conversation_id: str, 
    db: Session = Depends(get_db),
    limit: int = Query(default=50, le=100),
    offset: int = Query(default=0, ge=0)
):
    """
    Retrieve tool calls for a specific conversation
    
    Args:
        conversation_id (str): Unique identifier for the conversation
        db (Session): Database session
        limit (int): Maximum number of tool calls to return
        offset (int): Number of tool calls to skip
    
    Returns:
        dict: List of tool calls
    """
    try:
        # Verify conversation exists
        conversation = (
            db.query(AgenticConversation)
            .filter(AgenticConversation.id == conversation_id)
            .first()
        )
        
        if not conversation:
            raise HTTPException(status_code=404, detail="Conversation not found")
        
        # Retrieve tool calls with pagination
        tool_calls = (
            db.query(AgenticToolCall)
            .filter(AgenticToolCall.conversation_id == conversation_id)
            .order_by(AgenticToolCall.started_at.desc())
            .limit(limit)
            .offset(offset)
            .all()
        )
        
        # Convert to a format suitable for response
        tool_call_list = [
            {
                "id": str(tc.id),
                "tool_name": tc.tool_name,
                "input_data": tc.input_data,
                "output_data": tc.output_data,
                "started_at": tc.started_at,
                "completed_at": tc.completed_at
            }
            for tc in tool_calls
        ]
        
        return {
            "conversation_id": conversation_id,
            "tool_calls": tool_call_list,
            "total_tool_calls": len(tool_calls)
        }
    
    except Exception as e:
        print(f"Error retrieving tool calls: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")

# Additional Utility Function for Analytics
@router.get("/analytics")
def get_conversation_analytics(db: Session = Depends(get_db)):
    """
    Retrieve basic analytics about conversations and tool usage
    
    Args:
        db (Session): Database session
    
    Returns:
        dict: Conversation and tool usage analytics
    """
    try:
        # Total conversations
        total_conversations = db.query(AgenticConversation).count()
        
        # Conversations in last 7 days
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        recent_conversations = (
            db.query(AgenticConversation)
            .filter(AgenticConversation.created_at >= seven_days_ago)
            .count()
        )
        
        # Total tool calls
        total_tool_calls = db.query(AgenticToolCall).count()
        
        # Most used tools
        tool_usage = (
            db.query(AgenticToolCall.tool_name, func.count(AgenticToolCall.id))
            .group_by(AgenticToolCall.tool_name)
            .order_by(func.count(AgenticToolCall.id).desc())
            .limit(5)
            .all()
        )
        
        return {
            "total_conversations": total_conversations,
            "recent_conversations": recent_conversations,
            "total_tool_calls": total_tool_calls,
            "top_tools": [
                {"name": tool, "count": count} 
                for tool, count in tool_usage
            ]
        }
    
    except Exception as e:
        print(f"Error retrieving analytics: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Internal server error")













# #  ppt part # new changes testing code
# import os
# from dotenv import load_dotenv
# import time
# import re

# # Load from .env file
# load_dotenv()
# AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
# AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
# AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
# AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME")

# TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Body
# from sqlalchemy.orm import Session
# from typing import Dict, Any, List, Optional, Tuple
# import asyncio
# import uuid
# from datetime import datetime
# import json
# import traceback
# from starlette.responses import FileResponse
# from starlette.background import BackgroundTask
# import shutil

# # Additional Imports Needed
# from sqlalchemy import func
# from datetime import timedelta

# from app.core.config import settings
# from app.database.connection import get_db

# # LangChain and LangGraph imports
# from langgraph.graph import StateGraph, END
# from typing import TypedDict, Annotated
# import operator
# from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage, AIMessage
# from langchain_openai import AzureChatOpenAI
# from langchain_community.tools.tavily_search import TavilySearchResults
# from langgraph.checkpoint.memory import MemorySaver

# # Pydantic models
# from pydantic import BaseModel

# # SQLAlchemy models
# from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
# from sqlalchemy.dialects.postgresql import UUID
# from app.database.connection import Base

# # Import LangGraph PowerPoint Tool
# from app.tools.langgraph_ppt_tool import LangGraphPPTGenerator

# # Create directories for presentations and temporary downloads
# presentations_dir = os.path.join(os.getcwd(), "presentations")
# os.makedirs(presentations_dir, exist_ok=True)

# temp_downloads_dir = os.path.join(os.getcwd(), "temp_downloads")
# os.makedirs(temp_downloads_dir, exist_ok=True)

# # Custom JSON Encoder
# class LangChainJSONEncoder(json.JSONEncoder):
#     def default(self, obj):
#         if isinstance(obj, (HumanMessage, AIMessage, ToolMessage, SystemMessage)):
#             return {
#                 "type": obj.__class__.__name__,
#                 "content": obj.content,
#                 "additional_kwargs": obj.additional_kwargs
#             }
#         return super().default(obj)

# # Database Models
# class AgenticConversation(Base):
#     __tablename__ = "agentic_conversations"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
#     title = Column(String, nullable=True)
    
#     def __repr__(self):
#         return f"<AgenticConversation(id={self.id}, created_at={self.created_at})>"

# class AgenticMessage(Base):
#     __tablename__ = "agentic_messages"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     conversation_id = Column(UUID(as_uuid=True), ForeignKey("agentic_conversations.id"))
#     content = Column(Text)
#     sender = Column(String)  # 'user', 'ai', 'tool', 'system'
#     created_at = Column(DateTime, default=datetime.utcnow)
#     message_metadata = Column(JSON, nullable=True)
    
#     def __repr__(self):
#         return f"<AgenticMessage(id={self.id}, sender={self.sender})>"

# class AgenticToolCall(Base):
#     __tablename__ = "agentic_tool_calls"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     conversation_id = Column(UUID(as_uuid=True), ForeignKey("agentic_conversations.id"))
#     tool_name = Column(String)
#     input_data = Column(JSON, nullable=True)
#     output_data = Column(JSON, nullable=True)
#     started_at = Column(DateTime, default=datetime.utcnow)
#     completed_at = Column(DateTime, nullable=True)
    
#     def __repr__(self):
#         return f"<AgenticToolCall(id={self.id}, tool_name={self.tool_name})>"

# # Define the agent state
# class AgentState(TypedDict):
#     messages: Annotated[list[AnyMessage], operator.add]

# # Agent class implementation
# class Agent:
#     def __init__(self, model, tools, checkpointer, system=""):
#         self.system = system
#         graph = StateGraph(AgentState)
#         graph.add_node("llm", self.call_openai)
#         graph.add_node("action", self.take_action)
#         graph.add_conditional_edges("llm", self.exists_action, {True: "action", False: END})
#         graph.add_edge("action", "llm")
#         graph.set_entry_point("llm")
#         self.graph = graph.compile(checkpointer=checkpointer)
#         self.tools = {t.name: t for t in tools}
#         self.model = model.bind_tools(tools)

#     async def call_openai(self, state: AgentState):
#         messages = state['messages']
#         if self.system:
#             messages = [SystemMessage(content=self.system)] + messages
#         message = await self.model.ainvoke(messages)
#         return {'messages': [message]}

#     def exists_action(self, state: AgentState):
#         result = state['messages'][-1]
#         return len(result.tool_calls) > 0

#     async def take_action(self, state: AgentState):
#         tool_calls = state['messages'][-1].tool_calls
#         results = []
#         for t in tool_calls:
#             result = await self.tools[t['name']].ainvoke(t['args'])
#             results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))
#         return {'messages': results}

# # System Prompt for the Agent
# SYSTEM_PROMPT = """You are a smart research assistant. 
# - Use the search engine to look up information accurately.
# - Provide clear, concise, and helpful responses.
# - If you're unsure about something, acknowledge it.
# - Always prioritize giving the most relevant and useful information.
# """

# # Initialize tools and model
# memory = MemorySaver()
# search_tool = TavilySearchResults(max_results=3)

# model = AzureChatOpenAI(
#     openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
#     azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
#     azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
#     api_key=os.environ["AZURE_OPENAI_API_KEY"],
#     # Add these parameters for more robust configuration
#     max_tokens=1000,
#     temperature=0.7,
#     max_retries=3
# )

# # Initialize PowerPoint generator with existing model and search tool
# ppt_generator = LangGraphPPTGenerator(
#     model=model,
#     search_tool=search_tool,
#     presentations_dir=presentations_dir
# )

# # Initialize the agent with tools
# agent = Agent(model, [search_tool], checkpointer=memory, system=SYSTEM_PROMPT)

# # Global storage for active streaming tasks
# active_streams = {}

# # PowerPoint detection functions
# def detect_ppt_request(text: str) -> bool:
#     """
#     Detect if the user is requesting a PowerPoint presentation.
    
#     Args:
#         text (str): The user's input message
        
#     Returns:
#         bool: True if the input appears to be a PowerPoint request
#     """
#     # Common patterns for presentation requests
#     ppt_patterns = [
#         r"(?i)create a (powerpoint|ppt|presentation|slide deck) (about|on)",
#         r"(?i)make a (powerpoint|ppt|presentation|slides) (about|on)",
#         r"(?i)generate a (powerpoint|ppt|presentation) (about|on)",
#         r"(?i)prepare (a|some) (powerpoint|ppt|slides|presentation) (about|on)",
#         r"(?i)can you (create|make|build) a (powerpoint|ppt|presentation)",
#         r"(?i)i need a (powerpoint|ppt|presentation) (about|on|for)"
#     ]
    
#     # Check if any pattern matches
#     for pattern in ppt_patterns:
#         if re.search(pattern, text):
#             return True
    
#     return False

# def extract_ppt_topic(text: str) -> str:
#     """
#     Extract the presentation topic from the request.
    
#     Args:
#         text (str): The user's input message
        
#     Returns:
#         str: The extracted topic or a default message
#     """
#     # Patterns to extract topics from different phrasings
#     topic_patterns = [
#         r"(?i)create a (?:powerpoint|ppt|presentation|slide deck) (?:about|on) (.+)$",
#         r"(?i)make a (?:powerpoint|ppt|presentation|slides) (?:about|on) (.+)$",
#         r"(?i)generate a (?:powerpoint|ppt|presentation) (?:about|on) (.+)$",
#         r"(?i)prepare (?:a|some) (?:powerpoint|ppt|slides|presentation) (?:about|on) (.+)$",
#         r"(?i)can you (?:create|make|build) a (?:powerpoint|ppt|presentation) (?:about|on) (.+)$",
#         r"(?i)i need a (?:powerpoint|ppt|presentation) (?:about|on|for) (.+)$"
#     ]
    
#     # Try each pattern
#     for pattern in topic_patterns:
#         match = re.search(pattern, text)
#         if match:
#             return match.group(1).strip()
    
#     # Default if no specific topic found
#     return "the requested topic"

# # Pydantic Models for Request/Response
# class QueryRequest(BaseModel):
#     query: str
#     conversation_id: Optional[str] = None
#     image_url: Optional[str] = None
#     skip_greeting: Optional[bool] = False  # Added parameter to control greeting behavior

# class QueryResponse(BaseModel):
#     conversation_id: str
#     message_id: str

# class MessageResponse(BaseModel):
#     id: str
#     content: str
#     sender: str
#     created_at: datetime
#     metadata: Optional[Dict[str, Any]] = None

# class StreamEvent(BaseModel):
#     event: str
#     data: Dict[str, Any]

# class StreamResponse(BaseModel):
#     events: List[StreamEvent]
#     is_active: bool

# class ConversationListItem(BaseModel):
#     id: str
#     created_at: datetime
#     updated_at: datetime
#     title: Optional[str] = None
#     preview: Optional[str] = None

# class ConversationList(BaseModel):
#     conversations: List[ConversationListItem]

# class ConversationDetail(BaseModel):
#     conversation_id: str
#     messages: List[MessageResponse]

# async def process_stream(query: str, conversation_id: str, thread: Dict, db: Session, skip_greeting: bool = False):
#     """
#     Enhanced stream processing that shows intermediate thoughts and tool calls step by step,
#     with forced delays to ensure sequential display and prevent duplicate responses
#     """
#     start_time = datetime.utcnow()
#     full_content = ""
#     current_thinking = ""
#     message_id_tracker = {}  # Track message IDs to avoid duplication
#     response_segments = []   # Collect different segments of the response
    
#     # Add a set to track sent message IDs within this streaming session
#     sent_message_ids = set()

#     try:
#         print(f"Starting stream processing for conversation {conversation_id}")
#         print(f"Input Query: {query}")
#         print(f"Skip greeting: {skip_greeting}")
        
#         # Initialize stream storage with timestamps
#         active_streams[conversation_id] = []
        
#         # Prepare messages
#         messages = []
        
#         # Only add standard system message if this isn't a continuing conversation
#         if not skip_greeting:
#             messages.append(SystemMessage(content="You are a helpful assistant that provides concise answers."))
#         else:
#             # Use a system message that doesn't trigger a greeting for continuing conversations
#             messages.append(SystemMessage(content="Continue the conversation naturally without introducing yourself again."))
        
#         messages.append(HumanMessage(content=query))
        
#         # Track if final answer has been processed to prevent duplicates
#         final_answer_processed = False
        
#         # Process stream events
#         async for event in agent.graph.astream_events({"messages": messages}, thread, version="v1"):
#             # Add timestamp to event
#             event_with_timestamp = {
#                 "event": event.get("event"),
#                 "data": event.get("data", {}),
#                 "timestamp": int(time.time() * 1000)  # Current time in milliseconds
#             }
            
#             kind = event.get("event")
#             print(f"Detailed Event: {kind} - Full Event Data: {event}")
            
#             # Chat Model Streaming (intermediate thinking)
#             if kind == "on_chat_model_stream":
#                 try:
#                     chunk = event.get("data", {}).get("chunk")
#                     chunk_content = ""
#                     if hasattr(chunk, "content") and chunk.content:
#                         chunk_content = chunk.content
#                     elif isinstance(chunk, str):
#                         chunk_content = chunk
                    
#                     if chunk_content:
#                         current_thinking += chunk_content
                        
#                         # Create thinking update event with timestamp
#                         thinking_event = {
#                             "event": "thinking_update",
#                             "data": {
#                                 "content": current_thinking,
#                                 "is_complete": False,
#                                 "segment_type": "thinking"
#                             },
#                             "timestamp": int(time.time() * 1000)
#                         }
                        
#                         # Immediately send thinking update as streaming
#                         active_streams[conversation_id].append(thinking_event)
                        
#                         # Add short delay to ensure frontend has time to process
#                         await asyncio.sleep(0.05)
#                 except Exception as chunk_error:
#                     print(f"Error processing stream chunk: {chunk_error}")
            
#             # Rest of the existing code remains the same...
            
#             # Modify the final AI message processing to prevent duplicates
#             elif kind == "on_chain_end" and "output" in event.get("data", {}):
#                 if final_answer_processed:
#                     continue  # Skip if final answer has already been processed
                
#                 data = event.get("data", {})
#                 output = data.get("output", {})
                
#                 if isinstance(output, dict) and "messages" in output:
#                     for msg in output["messages"]:
#                         if isinstance(msg, AIMessage) and msg.content:
#                             final_content = msg.content
                            
#                             # Ensure only one response
#                             if final_answer_processed:
#                                 break
                            
#                             # Replace any double newlines with a space to ensure it's a single paragraph
#                             # final_content = final_content.replace('\n\n', ' ').replace('\n', ' ').strip()

#                             # Only replace excessive newlines (more than 2) with double newlines
#                             import re
#                             # final_content = re.sub(r'\n{3,}', '\n\n', final_content.strip())
                            
#                             # final_content = re.sub(r'\n+', '\n', final_content.strip())
#                             final_content = re.sub(r'\r?\n+', '\n', final_content.strip())
#                             # final_content = re.sub(r'(?<=\S)\n(?=\S)', ' ', final_content)
                            
#                             final_content = re.sub(r'([^\n])(\d+[\.\)])', r'\1\n\2', final_content)
                    
#                             answer_id = str(uuid.uuid4())
                            
#                             # Skip if this answer ID has already been sent
#                             if answer_id in sent_message_ids:
#                                 print(f"Skipping duplicate answer: {answer_id}")
#                                 continue
                            
#                             sent_message_ids.add(answer_id)
#                             message_id_tracker['answer'] = answer_id
                            
#                             # Collect this as a segment
#                             response_segments.append({
#                                 "type": "answer",
#                                 "content": final_content,
#                                 "id": answer_id
#                             })
                            
#                             # Send final answer as a complete message
#                             active_streams[conversation_id].append({
#                                 "event": "message_complete",
#                                 "data": {
#                                     "content": final_content,
#                                     "message_id": answer_id,
#                                     "segment_type": "answer"
#                                 },
#                                 "timestamp": int(time.time() * 1000)
#                             })
                            
#                             # Save to database
#                             ai_message = AgenticMessage(
#                                 id=answer_id,
#                                 conversation_id=conversation_id,
#                                 content=final_content,
#                                 sender="ai",
#                                 message_metadata={"type": "answer"}
#                             )
#                             db.add(ai_message)
#                             db.commit()
                            
#                             full_content = final_content
#                             final_answer_processed = True
#                             break
        
#         # Mark stream as complete
#         active_streams[conversation_id].append({
#             "event": "stream_complete",
#             "data": {
#                 "content": full_content,
#                 "message_id": message_id_tracker.get('answer', None),
#                 "segments": response_segments
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         print(f"Stream processing completed for {conversation_id}")
#         print(f"Final Full Content: {full_content}")
#         print(f"Response Segments: {response_segments}")

#     except Exception as e:
#         print(f"Error in stream processing: {e}")
#         traceback.print_exc()
        
#         # Log error to database
#         error_message = AgenticMessage(
#             conversation_id=conversation_id,
#             content=f"Processing Error: {str(e)}",
#             sender="system",
#             message_metadata={
#                 "error": str(e),
#                 "traceback": traceback.format_exc()
#             }
#         )
#         db.add(error_message)
#         db.commit()
        
#         active_streams[conversation_id].append({
#             "event": "error",
#             "data": {
#                 "message": str(e),
#                 "traceback": traceback.format_exc()
#             },
#             "timestamp": int(time.time() * 1000)
#         })

#     return full_content

# # PPT Generation process function
# async def process_ppt_generation(topic: str, conversation_id: str, db: Session):
#     """Process PowerPoint generation using LangGraph."""
#     try:
#         # Add thinking message to stream
#         active_streams[conversation_id].append({
#             "event": "thinking_update",
#             "data": {
#                 "content": f"I'll create a PowerPoint presentation about '{topic}' for you. Let me gather some information...",
#                 "is_complete": False,
#                 "segment_type": "thinking"
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Add the tool usage message for search
#         search_tool_id = str(uuid.uuid4())
#         active_streams[conversation_id].append({
#             "event": "tool_usage",
#             "data": {
#                 "tool_name": "tavily_search_results",
#                 "message": f"Searching for information about '{topic}'...",
#                 "message_id": search_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Run the LangGraph PPT generator
#         result = await ppt_generator.generate_presentation(topic)
        
#         # Mark the search as complete
#         active_streams[conversation_id].append({
#             "event": "tool_complete",
#             "data": {
#                 "tool_name": "tavily_search_results",
#                 "message": f"Found information about '{topic}'",
#                 "message_id": search_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Add PPT generation message
#         ppt_tool_id = str(uuid.uuid4())
#         active_streams[conversation_id].append({
#             "event": "tool_usage",
#             "data": {
#                 "tool_name": "powerpoint_generator",
#                 "message": f"Creating PowerPoint presentation about '{topic}'...",
#                 "message_id": ppt_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Extract file information
#         file_path = result.get("ppt_path", "")
#         filename = os.path.basename(file_path)
        
#         # Mark PPT generation as complete
#         active_streams[conversation_id].append({
#             "event": "tool_complete",
#             "data": {
#                 "tool_name": "powerpoint_generator",
#                 "message": f"PowerPoint presentation created successfully!",
#                 "message_id": ppt_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Record the search tool call in database
#         search_tool_call = AgenticToolCall(
#             conversation_id=conversation_id,
#             tool_name="tavily_search_results",
#             input_data=topic,
#             output_data=result.get("search_results", []),
#             started_at=datetime.utcnow(),
#             completed_at=datetime.utcnow()
#         )
#         db.add(search_tool_call)
        
#         # Record the PPT generation tool call
#         ppt_tool_call = AgenticToolCall(
#             conversation_id=conversation_id,
#             tool_name="powerpoint_generator",
#             input_data=topic,
#             output_data={"filename": filename, "path": file_path},
#             started_at=datetime.utcnow(),
#             completed_at=datetime.utcnow()
#         )
#         db.add(ppt_tool_call)
        
#         # Add final AI message
#         ai_message_id = str(uuid.uuid4())
#         ai_message = AgenticMessage(
#             id=ai_message_id,
#             conversation_id=conversation_id,
#             content=f"I've created a PowerPoint presentation about '{topic}'. You can download it using the button below.",
#             sender="ai",
#             message_metadata={"ppt_filename": filename, "ppt_path": file_path}
#         )
#         db.add(ai_message)
#         db.commit()
        
#         # Add message to the stream
#         active_streams[conversation_id].append({
#             "event": "message_complete",
#             "data": {
#                 "content": ai_message.content,
#                 "message_id": ai_message_id,
#                 "segment_type": "answer",
#                 "ppt_filename": filename
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Mark stream as complete
#         active_streams[conversation_id].append({
#             "event": "stream_complete",
#             "data": {
#                 "content": ai_message.content,
#                 "message_id": ai_message_id,
#                 "ppt_filename": filename
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         print(f"PowerPoint generation completed for {conversation_id}: {filename}")
        
#     except Exception as e:
#         print(f"Error in PPT generation process: {e}")
#         traceback.print_exc()
        
#         # Add error message to the stream
#         error_message = f"Error generating PowerPoint: {str(e)}"
        
#         # Record error in database
#         error_message_obj = AgenticMessage(
#             conversation_id=conversation_id,
#             content=error_message,
#             sender="system",
#             message_metadata={
#                 "error": str(e),
#                 "traceback": traceback.format_exc()
#             }
#         )
#         db.add(error_message_obj)
#         db.commit()
        
#         # Add error to stream
#         active_streams[conversation_id].append({
#             "event": "error",
#             "data": {
#                 "message": error_message,
#                 "traceback": traceback.format_exc()
#             },
#             "timestamp": int(time.time() * 1000)
#         })

# # FastAPI Routes
# router = APIRouter(
#     prefix="/api/agentic",
#     tags=["agentic-framework"],
#     responses={404: {"description": "Not found"}}
# )

# @router.post("/query", response_model=QueryResponse)
# async def process_query(
#     query_request: QueryRequest, 
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db)
# ):
#     """Process user query and initiate streaming"""
#     try:
#         # Get the trimmed query string
#         trimmed_query = query_request.query.strip()
        
#         # Check if this is a PowerPoint request
#         if detect_ppt_request(trimmed_query):
#             print(f"Detected PowerPoint request: {trimmed_query}")
#             # Extract the presentation topic
#             topic = extract_ppt_topic(trimmed_query)
#             print(f"Extracted topic: {topic}")
            
#             # Create a new conversation or use existing one
#             conversation_id = query_request.conversation_id or str(uuid.uuid4())
            
#             # Ensure conversation exists
#             conversation = db.query(AgenticConversation).filter(
#                 AgenticConversation.id == conversation_id
#             ).first()
            
#             if not conversation:
#                 conversation = AgenticConversation(
#                     id=conversation_id,
#                     title=f"PPT: {topic[:50]}"
#                 )
#                 db.add(conversation)
#                 db.commit()
            
#             # Save user message
#             user_message = AgenticMessage(
#                 id=uuid.uuid4(),
#                 conversation_id=conversation_id,
#                 content=trimmed_query,
#                 sender="user",
#                 message_metadata={
#                     "image_url": query_request.image_url,
#                     "is_ppt_request": True
#                 } if query_request.image_url else {"is_ppt_request": True}
#             )
#             db.add(user_message)
#             db.commit()
            
#             # Initialize stream storage with initial message
#             active_streams[conversation_id] = []
            
#             # Start background processing for PowerPoint generation
#             background_tasks.add_task(
#                 process_ppt_generation,
#                 topic,
#                 conversation_id,
#                 db
#             )
            
#             return {
#                 "conversation_id": conversation_id,
#                 "message_id": str(user_message.id)
#             }
            
#         # Continue with normal query processing if not a PPT request
#         # Determine conversation ID
#         conversation_id = query_request.conversation_id or str(uuid.uuid4())
        
#         # Ensure conversation exists
#         conversation = db.query(AgenticConversation).filter(
#             AgenticConversation.id == conversation_id
#         ).first()
        
#         # Check if this is a new conversation or continuing one
#         is_new_conversation = False
#         if not conversation:
#             conversation = AgenticConversation(id=conversation_id)
#             db.add(conversation)
#             db.commit()
#             is_new_conversation = True
        
#         # Save user message
#         user_message = AgenticMessage(
#             id=uuid.uuid4(),
#             conversation_id=conversation_id,
#             content=query_request.query,
#             sender="user",
#             message_metadata={
#                 "image_url": query_request.image_url
#             } if query_request.image_url else None
#         )
#         db.add(user_message)
#         db.commit()
        
#         # Prepare thread for agent
#         thread = {"configurable": {"thread_id": conversation_id}}
        
#         # Determine if we should skip greeting
#         # Skip if explicitly requested or if this is not a new conversation
#         should_skip_greeting = query_request.skip_greeting or not is_new_conversation
        
#         # Start background stream processing
#         background_tasks.add_task(
#             process_stream, 
#             query_request.query, 
#             conversation_id, 
#             thread,
#             db,
#             should_skip_greeting
#         )
        
#         return {
#             "conversation_id": conversation_id, 
#             "message_id": str(user_message.id)
#         }
    
#     except Exception as e:
#         print(f"Error in query processing: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/stream/{conversation_id}", response_model=StreamResponse)
# async def get_stream_events(
#     conversation_id: str,
#     since: Optional[int] = Query(None, description="Timestamp to get only events since this time")
# ):
#     """Retrieve streaming events for a conversation"""
#     try:
#         # Check if conversation stream exists
#         if conversation_id not in active_streams:
#             return {"events": [], "is_active": False}
        
#         # Get a copy of events
#         all_events = active_streams.get(conversation_id, []).copy()
        
#         # Filter events by timestamp if provided
#         if since is not None:
#             filtered_events = [event for event in all_events if event.get("timestamp", 0) > since]
#         else:
#             filtered_events = all_events.copy()
        
#         # Get event IDs we're about to send
#         event_timestamps = {event.get("timestamp") for event in filtered_events if "timestamp" in event}
        
#         # Remove only the events we're sending from active_streams
#         if event_timestamps:
#             active_streams[conversation_id] = [
#                 event for event in all_events
#                 if event.get("timestamp") not in event_timestamps
#             ]
        
#         # Determine if stream is still active
#         is_active = not any(
#             event.get("event") in ["stream_complete", "error"] 
#             for event in filtered_events
#         )
        
#         # Convert to StreamEvent model and remove timestamp field
#         stream_events = []
#         for e in filtered_events:
#             event_data = {
#                 "event": e["event"],
#                 "data": e["data"]
#             }
#             stream_events.append(StreamEvent(**event_data))
        
#         return {
#             "events": stream_events, 
#             "is_active": is_active
#         }
    
#     except Exception as e:
#         print(f"Error retrieving stream events: {e}")
#         traceback.print_exc()
#         return {"events": [], "is_active": False}

# # Download presentation endpoint
# @router.get("/download/presentation/{filename}")
# async def download_presentation(filename: str):
#     """
#     Download a generated PowerPoint presentation
    
#     Args:
#         filename (str): Name of the presentation file
        
#     Returns:
#         FileResponse: The presentation file for download
#     """
#     try:
#         file_path = os.path.join(presentations_dir, filename)
        
#         if not os.path.exists(file_path):
#             raise HTTPException(status_code=404, detail="Presentation not found")
        
#         # Create a temp directory for copied files to handle concurrent access
#         os.makedirs(temp_downloads_dir, exist_ok=True)
        
#         # Copy the file to a temporary location
#         temp_file_path = os.path.join(temp_downloads_dir, filename)
#         shutil.copy2(file_path, temp_file_path)
        
#         # Define cleanup task
#         def remove_file():
#             try:
#                 os.unlink(temp_file_path)
#             except Exception as e:
#                 print(f"Error removing temporary file: {e}")
        
#         # Return file response with cleanup task
#         return FileResponse(
#             path=temp_file_path,
#             filename=filename,
#             media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
#             background=BackgroundTask(remove_file)
#         )
    
#     except Exception as e:
#         if isinstance(e, HTTPException):
#             raise e
#         print(f"Error downloading presentation: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
# def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
#     """
#     Retrieve all messages for a specific conversation
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         db (Session): Database session
    
#     Returns:
#         ConversationDetail: Conversation messages
#     """
#     try:
#         # Verify conversation exists
#         conversation = db.query(AgenticConversation).filter(
#             AgenticConversation.id == conversation_id
#         ).first()
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Retrieve messages, ordered by creation time
#         messages = (
#             db.query(AgenticMessage)
#             .filter(AgenticMessage.conversation_id == conversation_id)
#             .order_by(AgenticMessage.created_at)
#             .all()
#         )
        
#         # Convert to response model
#         message_responses = [
#             MessageResponse(
#                 id=str(message.id),
#                 content=message.content,
#                 sender=message.sender,
#                 created_at=message.created_at,
#                 metadata=message.message_metadata
#             )
#             for message in messages
#         ]
        
#         return {
#             "conversation_id": conversation_id, 
#             "messages": message_responses
#         }
    
#     except Exception as e:
#         print(f"Error retrieving conversation: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.delete("/conversation/{conversation_id}")
# def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
#     """
#     Delete a conversation and all associated messages and tool calls
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         db (Session): Database session
    
#     Returns:
#         dict: Confirmation message
#     """
#     try:
#         # Verify conversation exists
#         conversation = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.id == conversation_id)
#             .first()
#         )
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Delete associated tool calls
#         tool_calls_deleted = (
#             db.query(AgenticToolCall)
#             .filter(AgenticToolCall.conversation_id == conversation_id)
#             .delete(synchronize_session=False)
#         )
        
#         # Delete associated messages
#         messages_deleted = (
#             db.query(AgenticMessage)
#             .filter(AgenticMessage.conversation_id == conversation_id)
#             .delete(synchronize_session=False)
#         )
        
#         # Delete the conversation
#         db.delete(conversation)
        
#         # Commit changes
#         db.commit()
        
#         return {
#             "message": "Conversation deleted successfully",
#             "deleted_messages": messages_deleted,
#             "deleted_tool_calls": tool_calls_deleted
#         }
    
#     except Exception as e:
#         # Rollback in case of error
#         db.rollback()
#         print(f"Error deleting conversation: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.put("/conversation/{conversation_id}/title")
# def update_conversation_title(
#     conversation_id: str, 
#     title: str = Body(..., min_length=1, max_length=100),
#     db: Session = Depends(get_db)
# ):
#     """
#     Update the title of a conversation
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         title (str): New title for the conversation
#         db (Session): Database session
    
#     Returns:
#         dict: Updated conversation details
#     """
#     try:
#         # Find the conversation
#         conversation = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.id == conversation_id)
#             .first()
#         )
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Update title
#         conversation.title = title
#         db.commit()
        
#         return {
#             "id": str(conversation.id),
#             "title": conversation.title,
#             "updated_at": conversation.updated_at
#         }
    
#     except Exception as e:
#         db.rollback()
#         print(f"Error updating conversation title: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.get("/conversation/{conversation_id}/tools")
# def get_conversation_tool_calls(
#     conversation_id: str, 
#     db: Session = Depends(get_db),
#     limit: int = Query(default=50, le=100),
#     offset: int = Query(default=0, ge=0)
# ):
#     """
#     Retrieve tool calls for a specific conversation
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         db (Session): Database session
#         limit (int): Maximum number of tool calls to return
#         offset (int): Number of tool calls to skip
    
#     Returns:
#         dict: List of tool calls
#     """
#     try:
#         # Verify conversation exists
#         conversation = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.id == conversation_id)
#             .first()
#         )
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Retrieve tool calls with pagination
#         tool_calls = (
#             db.query(AgenticToolCall)
#             .filter(AgenticToolCall.conversation_id == conversation_id)
#             .order_by(AgenticToolCall.started_at.desc())
#             .limit(limit)
#             .offset(offset)
#             .all()
#         )
        
#         # Convert to a format suitable for response
#         tool_call_list = [
#             {
#                 "id": str(tc.id),
#                 "tool_name": tc.tool_name,
#                 "input_data": tc.input_data,
#                 "output_data": tc.output_data,
#                 "started_at": tc.started_at,
#                 "completed_at": tc.completed_at
#             }
#             for tc in tool_calls
#         ]
        
#         return {
#             "conversation_id": conversation_id,
#             "tool_calls": tool_call_list,
#             "total_tool_calls": len(tool_calls)
#         }
    
#     except Exception as e:
#         print(f"Error retrieving tool calls: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# # Additional Utility Function for Analytics
# @router.get("/analytics")
# def get_conversation_analytics(db: Session = Depends(get_db)):
#     """
#     Retrieve basic analytics about conversations and tool usage
    
#     Args:
#         db (Session): Database session
    
#     Returns:
#         dict: Conversation and tool usage analytics
#     """
#     try:
#         # Total conversations
#         total_conversations = db.query(AgenticConversation).count()
        
#         # Conversations in last 7 days
#         seven_days_ago = datetime.utcnow() - timedelta(days=7)
#         recent_conversations = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.created_at >= seven_days_ago)
#             .count()
#         )
        
#         # Total tool calls
#         total_tool_calls = db.query(AgenticToolCall).count()
        
#         # Most used tools
#         tool_usage = (
#             db.query(AgenticToolCall.tool_name, func.count(AgenticToolCall.id))
#             .group_by(AgenticToolCall.tool_name)
#             .order_by(func.count(AgenticToolCall.id).desc())
#             .limit(5)
#             .all()
#         )
        
#         return {
#             "total_conversations": total_conversations,
#             "recent_conversations": recent_conversations,
#             "total_tool_calls": total_tool_calls,
#             "top_tools": [
#                 {"name": tool, "count": count} 
#                 for tool, count in tool_usage
#             ]
#         }
    
#     except Exception as e:
#         print(f"Error retrieving analytics: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")



















# #  ppt part # new changes testing code
# import os
# from dotenv import load_dotenv
# import time
# import re

# # Load from .env file
# load_dotenv()
# AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
# AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
# AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION")
# AZURE_OPENAI_CHAT_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_CHAT_DEPLOYMENT_NAME")

# TAVILY_API_KEY = os.getenv("TAVILY_API_KEY")

# from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, Query, Body
# from sqlalchemy.orm import Session
# from typing import Dict, Any, List, Optional, Tuple
# import asyncio
# import uuid
# from datetime import datetime
# import json
# import traceback
# from starlette.responses import FileResponse
# from starlette.background import BackgroundTask
# import shutil

# # Additional Imports Needed
# from sqlalchemy import func
# from datetime import timedelta

# from app.core.config import settings
# from app.database.connection import get_db

# # LangChain and LangGraph imports
# from langgraph.graph import StateGraph, END
# from typing import TypedDict, Annotated
# import operator
# from langchain_core.messages import AnyMessage, SystemMessage, HumanMessage, ToolMessage, AIMessage
# from langchain_openai import AzureChatOpenAI
# from langchain_community.tools.tavily_search import TavilySearchResults
# from langgraph.checkpoint.memory import MemorySaver

# # Pydantic models
# from pydantic import BaseModel

# # SQLAlchemy models
# from sqlalchemy import Column, String, DateTime, Text, JSON, ForeignKey
# from sqlalchemy.dialects.postgresql import UUID
# from app.database.connection import Base

# # Import LangGraph PowerPoint Tool
# from app.tools.langgraph_ppt_tool import LangGraphPPTGenerator

# # Create directories for presentations and temporary downloads
# presentations_dir = os.path.join(os.getcwd(), "presentations")
# os.makedirs(presentations_dir, exist_ok=True)

# temp_downloads_dir = os.path.join(os.getcwd(), "temp_downloads")
# os.makedirs(temp_downloads_dir, exist_ok=True)

# # Custom JSON Encoder
# class LangChainJSONEncoder(json.JSONEncoder):
#     def default(self, obj):
#         if isinstance(obj, (HumanMessage, AIMessage, ToolMessage, SystemMessage)):
#             return {
#                 "type": obj.__class__.__name__,
#                 "content": obj.content,
#                 "additional_kwargs": obj.additional_kwargs
#             }
#         return super().default(obj)

# # Database Models
# class AgenticConversation(Base):
#     __tablename__ = "agentic_conversations"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     created_at = Column(DateTime, default=datetime.utcnow)
#     updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
#     title = Column(String, nullable=True)
    
#     def __repr__(self):
#         return f"<AgenticConversation(id={self.id}, created_at={self.created_at})>"

# class AgenticMessage(Base):
#     __tablename__ = "agentic_messages"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     conversation_id = Column(UUID(as_uuid=True), ForeignKey("agentic_conversations.id"))
#     content = Column(Text)
#     sender = Column(String)  # 'user', 'ai', 'tool', 'system'
#     created_at = Column(DateTime, default=datetime.utcnow)
#     message_metadata = Column(JSON, nullable=True)
    
#     def __repr__(self):
#         return f"<AgenticMessage(id={self.id}, sender={self.sender})>"

# class AgenticToolCall(Base):
#     __tablename__ = "agentic_tool_calls"
    
#     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     conversation_id = Column(UUID(as_uuid=True), ForeignKey("agentic_conversations.id"))
#     tool_name = Column(String)
#     input_data = Column(JSON, nullable=True)
#     output_data = Column(JSON, nullable=True)
#     started_at = Column(DateTime, default=datetime.utcnow)
#     completed_at = Column(DateTime, nullable=True)
    
#     def __repr__(self):
#         return f"<AgenticToolCall(id={self.id}, tool_name={self.tool_name})>"

# # Define the agent state
# class AgentState(TypedDict):
#     messages: Annotated[list[AnyMessage], operator.add]

# # Agent class implementation
# class Agent:
#     def __init__(self, model, tools, checkpointer, system=""):
#         self.system = system
#         graph = StateGraph(AgentState)
#         graph.add_node("llm", self.call_openai)
#         graph.add_node("action", self.take_action)
#         graph.add_conditional_edges("llm", self.exists_action, {True: "action", False: END})
#         graph.add_edge("action", "llm")
#         graph.set_entry_point("llm")
#         self.graph = graph.compile(checkpointer=checkpointer)
#         self.tools = {t.name: t for t in tools}
#         self.model = model.bind_tools(tools)

#     async def call_openai(self, state: AgentState):
#         messages = state['messages']
#         if self.system:
#             messages = [SystemMessage(content=self.system)] + messages
#         message = await self.model.ainvoke(messages)
#         return {'messages': [message]}

#     def exists_action(self, state: AgentState):
#         result = state['messages'][-1]
#         return len(result.tool_calls) > 0

#     async def take_action(self, state: AgentState):
#         tool_calls = state['messages'][-1].tool_calls
#         results = []
#         for t in tool_calls:
#             result = await self.tools[t['name']].ainvoke(t['args'])
#             results.append(ToolMessage(tool_call_id=t['id'], name=t['name'], content=str(result)))
#         return {'messages': results}

# # System Prompt for the Agent
# SYSTEM_PROMPT = """You are a smart research assistant. 
# - Use the search engine to look up information accurately.
# - Provide clear, concise, and helpful responses.
# - If you're unsure about something, acknowledge it.
# - Always prioritize giving the most relevant and useful information.
# """

# # Initialize tools and model
# memory = MemorySaver()
# search_tool = TavilySearchResults(max_results=3)

# model = AzureChatOpenAI(
#     openai_api_version=os.environ["AZURE_OPENAI_API_VERSION"],
#     azure_deployment=os.environ["AZURE_OPENAI_CHAT_DEPLOYMENT_NAME"],
#     azure_endpoint=os.environ["AZURE_OPENAI_ENDPOINT"],
#     api_key=os.environ["AZURE_OPENAI_API_KEY"],
#     # Add these parameters for more robust configuration
#     max_tokens=1000,
#     temperature=0.7,
#     max_retries=3
# )

# # Initialize PowerPoint generator with existing model and search tool
# ppt_generator = LangGraphPPTGenerator(
#     model=model,
#     search_tool=search_tool,
#     presentations_dir=presentations_dir
# )

# # Initialize the agent with tools
# agent = Agent(model, [search_tool], checkpointer=memory, system=SYSTEM_PROMPT)

# # Global storage for active streaming tasks
# active_streams = {}

# # PowerPoint detection functions
# def detect_ppt_request(text: str) -> bool:
#     """
#     Detect if the user is requesting a PowerPoint presentation.
    
#     Args:
#         text (str): The user's input message
        
#     Returns:
#         bool: True if the input appears to be a PowerPoint request
#     """
#     # Common patterns for presentation requests
#     ppt_patterns = [
#         r"(?i)create a (powerpoint|ppt|presentation|slide deck) (about|on)",
#         r"(?i)make a (powerpoint|ppt|presentation|slides) (about|on)",
#         r"(?i)generate a (powerpoint|ppt|presentation) (about|on)",
#         r"(?i)prepare (a|some) (powerpoint|ppt|slides|presentation) (about|on)",
#         r"(?i)can you (create|make|build) a (powerpoint|ppt|presentation)",
#         r"(?i)i need a (powerpoint|ppt|presentation) (about|on|for)"
#     ]
    
#     # Check if any pattern matches
#     for pattern in ppt_patterns:
#         if re.search(pattern, text):
#             return True
    
#     return False

# def extract_ppt_topic(text: str) -> str:
#     """
#     Extract the presentation topic from the request.
    
#     Args:
#         text (str): The user's input message
        
#     Returns:
#         str: The extracted topic or a default message
#     """
#     # Patterns to extract topics from different phrasings
#     topic_patterns = [
#         r"(?i)create a (?:powerpoint|ppt|presentation|slide deck) (?:about|on) (.+)$",
#         r"(?i)make a (?:powerpoint|ppt|presentation|slides) (?:about|on) (.+)$",
#         r"(?i)generate a (?:powerpoint|ppt|presentation) (?:about|on) (.+)$",
#         r"(?i)prepare (?:a|some) (?:powerpoint|ppt|slides|presentation) (?:about|on) (.+)$",
#         r"(?i)can you (?:create|make|build) a (?:powerpoint|ppt|presentation) (?:about|on) (.+)$",
#         r"(?i)i need a (?:powerpoint|ppt|presentation) (?:about|on|for) (.+)$"
#     ]
    
#     # Try each pattern
#     for pattern in topic_patterns:
#         match = re.search(pattern, text)
#         if match:
#             return match.group(1).strip()
    
#     # Default if no specific topic found
#     return "the requested topic"

# # Pydantic Models for Request/Response
# class QueryRequest(BaseModel):
#     query: str
#     conversation_id: Optional[str] = None
#     image_url: Optional[str] = None
#     skip_greeting: Optional[bool] = False  # Added parameter to control greeting behavior

# class QueryResponse(BaseModel):
#     conversation_id: str
#     message_id: str

# class MessageResponse(BaseModel):
#     id: str
#     content: str
#     sender: str
#     created_at: datetime
#     metadata: Optional[Dict[str, Any]] = None

# class StreamEvent(BaseModel):
#     event: str
#     data: Dict[str, Any]

# class StreamResponse(BaseModel):
#     events: List[StreamEvent]
#     is_active: bool

# class ConversationListItem(BaseModel):
#     id: str
#     created_at: datetime
#     updated_at: datetime
#     title: Optional[str] = None
#     preview: Optional[str] = None

# class ConversationList(BaseModel):
#     conversations: List[ConversationListItem]

# class ConversationDetail(BaseModel):
#     conversation_id: str
#     messages: List[MessageResponse]

# async def process_stream(query: str, conversation_id: str, thread: Dict, db: Session, skip_greeting: bool = False):
#     """
#     Enhanced stream processing that shows intermediate thoughts and tool calls step by step,
#     with forced delays to ensure sequential display
#     """
#     start_time = datetime.utcnow()
#     full_content = ""
#     current_thinking = ""
#     message_id_tracker = {}  # Track message IDs to avoid duplication
#     response_segments = []   # Collect different segments of the response
    
#     # Add a set to track sent message IDs within this streaming session
#     sent_message_ids = set()

#     try:
#         print(f"Starting stream processing for conversation {conversation_id}")
#         print(f"Input Query: {query}")
#         print(f"Skip greeting: {skip_greeting}")
        
#         # Initialize stream storage with timestamps
#         active_streams[conversation_id] = []
        
#         # Prepare messages
#         messages = []
        
#         # Only add standard system message if this isn't a continuing conversation
#         if not skip_greeting:
#             messages.append(SystemMessage(content="You are a helpful assistant that provides concise answers."))
#         else:
#             # Use a system message that doesn't trigger a greeting for continuing conversations
#             messages.append(SystemMessage(content="Continue the conversation naturally without introducing yourself again."))
        
#         messages.append(HumanMessage(content=query))
        
#         # Process stream events
#         async for event in agent.graph.astream_events({"messages": messages}, thread, version="v1"):
#             # Add timestamp to event
#             event_with_timestamp = {
#                 "event": event.get("event"),
#                 "data": event.get("data", {}),
#                 "timestamp": int(time.time() * 1000)  # Current time in milliseconds
#             }
            
#             kind = event.get("event")
#             print(f"Detailed Event: {kind} - Full Event Data: {event}")
            
#             # Chat Model Streaming (intermediate thinking)
#             if kind == "on_chat_model_stream":
#                 try:
#                     chunk = event.get("data", {}).get("chunk")
#                     chunk_content = ""
#                     if hasattr(chunk, "content") and chunk.content:
#                         chunk_content = chunk.content
#                     elif isinstance(chunk, str):
#                         chunk_content = chunk
                    
#                     if chunk_content:
#                         current_thinking += chunk_content
                        
#                         # Create thinking update event with timestamp
#                         thinking_event = {
#                             "event": "thinking_update",
#                             "data": {
#                                 "content": current_thinking,
#                                 "is_complete": False,
#                                 "segment_type": "thinking"
#                             },
#                             "timestamp": int(time.time() * 1000)
#                         }
                        
#                         # Immediately send thinking update as streaming
#                         active_streams[conversation_id].append(thinking_event)
                        
#                         # Add short delay to ensure frontend has time to process
#                         await asyncio.sleep(0.05)
#                 except Exception as chunk_error:
#                     print(f"Error processing stream chunk: {chunk_error}")
            
#             # Tool Start Event - Show tool being used
#             elif kind == "on_tool_start":
#                 tool_data = event.get("data", {})
#                 tool_name = tool_data.get("name", "unknown")
#                 tool_input = tool_data.get("input")
                
#                 print(f"Tool started: {tool_name}")
                
#                 # If we have thinking content, finalize it as a message
#                 if current_thinking:
#                     message_id = str(uuid.uuid4())
                    
#                     # Skip if this message ID has already been sent
#                     if message_id in sent_message_ids:
#                         print(f"Skipping duplicate thinking message: {message_id}")
#                     else:
#                         sent_message_ids.add(message_id)
#                         message_id_tracker['thinking'] = message_id
                        
#                         # Collect this as a segment
#                         response_segments.append({
#                             "type": "thinking",
#                             "content": current_thinking,
#                             "id": message_id
#                         })
                        
#                         # Add thinking as a complete message with a delay
#                         active_streams[conversation_id].append({
#                             "event": "message_complete",
#                             "data": {
#                                 "content": current_thinking,
#                                 "message_id": message_id,
#                                 "segment_type": "thinking"
#                             },
#                             "timestamp": int(time.time() * 1000)
#                         })
                        
#                         # Save thinking message to database
#                         thinking_message = AgenticMessage(
#                             id=message_id,
#                             conversation_id=conversation_id,
#                             content=current_thinking,
#                             sender="ai",
#                             message_metadata={"type": "thinking"}
#                         )
#                         db.add(thinking_message)
#                         db.commit()
                        
#                         full_content += current_thinking
                    
#                     current_thinking = ""
                    
#                     # Force a small delay to ensure frontend processing
#                     await asyncio.sleep(0.5)
                
#                 # Add tool usage notification
#                 tool_message_id = str(uuid.uuid4())
                
#                 # Skip if this tool message ID has already been sent
#                 if tool_message_id in sent_message_ids:
#                     print(f"Skipping duplicate tool message: {tool_message_id}")
#                 else:
#                     sent_message_ids.add(tool_message_id)
#                     message_id_tracker['tool'] = tool_message_id
                    
#                     # Collect this as a segment
#                     response_segments.append({
#                         "type": "tool_start",
#                         "tool_name": tool_name,
#                         "input": tool_input,
#                         "id": tool_message_id
#                     })
                    
#                     active_streams[conversation_id].append({
#                         "event": "tool_usage",
#                         "data": {
#                             "tool_name": tool_name,
#                             "message": f"Searching for information about: {tool_input}...",
#                             "message_id": tool_message_id
#                         },
#                         "timestamp": int(time.time() * 1000)
#                     })
                    
#                     # Record tool call in database
#                     tool_call = AgenticToolCall(
#                         conversation_id=conversation_id,
#                         tool_name=tool_name,
#                         input_data=tool_input
#                     )
#                     db.add(tool_call)
#                     db.commit()
                
#                 # Force delay to ensure processing
#                 await asyncio.sleep(0.5)
            
#             # Tool End Event - Show tool results
#             elif kind == "on_tool_end":
#                 tool_data = event.get("data", {})
#                 tool_name = tool_data.get("name", "unknown")
#                 tool_output = tool_data.get("output")
                
#                 print(f"Tool completed: {tool_name}")
                
#                 # Update tool call in database
#                 tool_call = db.query(AgenticToolCall).filter(
#                     AgenticToolCall.conversation_id == conversation_id,
#                     AgenticToolCall.tool_name == tool_name
#                 ).order_by(AgenticToolCall.started_at.desc()).first()
                
#                 if tool_call:
#                     tool_call.output_data = tool_output
#                     tool_call.completed_at = datetime.utcnow()
#                     db.commit()
                
#                 # Use the same message ID as the tool start event
#                 tool_complete_id = message_id_tracker.get('tool', str(uuid.uuid4()))
                
#                 # Skip if this tool complete message has already been sent
#                 if tool_complete_id in sent_message_ids:
#                     print(f"Tool already completed, skipping duplicate: {tool_complete_id}")
#                 else:
#                     # Mark as sent
#                     sent_message_ids.add(tool_complete_id)
                    
#                     # Collect this as a segment
#                     response_segments.append({
#                         "type": "tool_end",
#                         "tool_name": tool_name,
#                         "output": str(tool_output),
#                         "id": tool_complete_id
#                     })
                    
#                     # Add tool completion event (updates the existing tool message)
#                     active_streams[conversation_id].append({
#                         "event": "tool_complete",
#                         "data": {
#                             "tool_name": tool_name,
#                             "message": "Found relevant information!",
#                             "message_id": tool_complete_id
#                         },
#                         "timestamp": int(time.time() * 1000)
#                     })
                
#                 # Force delay to ensure processing
#                 await asyncio.sleep(0.5)
            
#             # Final AI message or completion from LLM
#             elif kind == "on_chain_end" and "output" in event.get("data", {}):
#                 data = event.get("data", {})
#                 output = data.get("output", {})
                
#                 if isinstance(output, dict) and "messages" in output:
#                     for msg in output["messages"]:
#                         if isinstance(msg, AIMessage) and msg.content:
#                             final_content = msg.content
                            
#                             # If content is long, split it into paragraphs and send them one by one
#                             paragraphs = final_content.split('\n\n')
                            
#                             # If there's only one paragraph or very short content, don't split
#                             if len(paragraphs) <= 1 or len(final_content) < 100:
#                                 answer_id = str(uuid.uuid4())
                                
#                                 # Skip if this answer ID has already been sent
#                                 if answer_id in sent_message_ids:
#                                     print(f"Skipping duplicate answer: {answer_id}")
#                                 else:
#                                     sent_message_ids.add(answer_id)
#                                     message_id_tracker['answer'] = answer_id
                                    
#                                     # Collect this as a segment
#                                     response_segments.append({
#                                         "type": "answer",
#                                         "content": final_content,
#                                         "id": answer_id
#                                     })
                                    
#                                     # Send final answer as a complete message
#                                     active_streams[conversation_id].append({
#                                         "event": "message_complete",
#                                         "data": {
#                                             "content": final_content,
#                                             "message_id": answer_id,
#                                             "segment_type": "answer"
#                                         },
#                                         "timestamp": int(time.time() * 1000)
#                                     })
                                    
#                                     # Save to database
#                                     ai_message = AgenticMessage(
#                                         id=answer_id,
#                                         conversation_id=conversation_id,
#                                         content=final_content,
#                                         sender="ai",
#                                         message_metadata={"type": "answer"}
#                                     )
#                                     db.add(ai_message)
#                                     db.commit()
                                
#                                 full_content = final_content
                                
#                             else:
#                                 # Send paragraphs one by one with delays
#                                 full_answer = ""
#                                 for i, paragraph in enumerate(paragraphs):
#                                     if not paragraph.strip():
#                                         continue
                                        
#                                     paragraph_id = str(uuid.uuid4())
                                    
#                                     # Skip if this paragraph ID has already been sent
#                                     if paragraph_id in sent_message_ids:
#                                         print(f"Skipping duplicate paragraph: {paragraph_id}")
#                                         continue
                                        
#                                     # Mark as sent
#                                     sent_message_ids.add(paragraph_id)
                                    
#                                     # First paragraph
#                                     if i == 0:
#                                         answer_id = paragraph_id
#                                         message_id_tracker['answer'] = answer_id
                                        
#                                         # Collect this as a segment
#                                         response_segments.append({
#                                             "type": "answer_part",
#                                             "content": paragraph,
#                                             "part": i+1,
#                                             "total_parts": len(paragraphs),
#                                             "id": paragraph_id
#                                         })
                                        
#                                         # Send as a partial answer
#                                         active_streams[conversation_id].append({
#                                             "event": "partial_answer",
#                                             "data": {
#                                                 "content": paragraph,
#                                                 "message_id": paragraph_id,
#                                                 "is_first": True
#                                             },
#                                             "timestamp": int(time.time() * 1000)
#                                         })
                                        
#                                         # Save to database as first part
#                                         ai_message_part = AgenticMessage(
#                                             id=paragraph_id,
#                                             conversation_id=conversation_id,
#                                             content=paragraph,
#                                             sender="ai",
#                                             message_metadata={"type": "answer_part", "part": i+1}
#                                         )
#                                         db.add(ai_message_part)
#                                         db.commit()
                                        
#                                     # Middle paragraphs
#                                     elif i < len(paragraphs) - 1:
#                                         # Collect this as a segment
#                                         response_segments.append({
#                                             "type": "answer_part",
#                                             "content": paragraph,
#                                             "part": i+1,
#                                             "total_parts": len(paragraphs),
#                                             "id": paragraph_id
#                                         })
                                        
#                                         # Update the answer with new paragraph
#                                         active_streams[conversation_id].append({
#                                             "event": "partial_answer",
#                                             "data": {
#                                                 "content": paragraph,
#                                                 "message_id": paragraph_id,
#                                                 "is_first": False
#                                             },
#                                             "timestamp": int(time.time() * 1000)
#                                         })
                                    
#                                     # Last paragraph
#                                     else:
#                                         # Collect this as a segment
#                                         response_segments.append({
#                                             "type": "answer_part",
#                                             "content": paragraph,
#                                             "part": i+1,
#                                             "total_parts": len(paragraphs),
#                                             "id": paragraph_id
#                                         })
                                        
#                                         # Send as final part
#                                         active_streams[conversation_id].append({
#                                             "event": "partial_answer",
#                                             "data": {
#                                                 "content": paragraph,
#                                                 "message_id": paragraph_id,
#                                                 "is_last": True
#                                             },
#                                             "timestamp": int(time.time() * 1000)
#                                         })
                                    
#                                     full_answer += paragraph + "\n\n"
                                    
#                                     # Force delay between paragraphs
#                                     await asyncio.sleep(0.7)
                                
#                                 # Save the full answer to database
#                                 final_id = str(uuid.uuid4())
                                
#                                 # Skip if this final ID has already been sent
#                                 if final_id not in sent_message_ids:
#                                     sent_message_ids.add(final_id)
                                    
#                                     full_ai_message = AgenticMessage(
#                                         id=final_id,
#                                         conversation_id=conversation_id,
#                                         content=full_answer.strip(),
#                                         sender="ai",
#                                         message_metadata={"type": "complete_answer"}
#                                     )
#                                     db.add(full_ai_message)
#                                     db.commit()
                                
#                                 full_content = full_answer.strip()
                            
#                             break
        
#         # Mark stream as complete
#         active_streams[conversation_id].append({
#             "event": "stream_complete",
#             "data": {
#                 "content": full_content,
#                 "message_id": message_id_tracker.get('answer', None),
#                 "segments": response_segments
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         print(f"Stream processing completed for {conversation_id}")
#         print(f"Final Full Content: {full_content}")
#         print(f"Response Segments: {response_segments}")
    
#     except Exception as e:
#         print(f"Error in stream processing: {e}")
#         traceback.print_exc()
        
#         # Log error to database
#         error_message = AgenticMessage(
#             conversation_id=conversation_id,
#             content=f"Processing Error: {str(e)}",
#             sender="system",
#             message_metadata={
#                 "error": str(e),
#                 "traceback": traceback.format_exc()
#             }
#         )
#         db.add(error_message)
#         db.commit()
        
#         active_streams[conversation_id].append({
#             "event": "error",
#             "data": {
#                 "message": str(e),
#                 "traceback": traceback.format_exc()
#             },
#             "timestamp": int(time.time() * 1000)
#         })

#     return full_content

# # PPT Generation process function
# async def process_ppt_generation(topic: str, conversation_id: str, db: Session):
#     """Process PowerPoint generation using LangGraph."""
#     try:
#         # Add thinking message to stream
#         active_streams[conversation_id].append({
#             "event": "thinking_update",
#             "data": {
#                 "content": f"I'll create a PowerPoint presentation about '{topic}' for you. Let me gather some information...",
#                 "is_complete": False,
#                 "segment_type": "thinking"
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Add the tool usage message for search
#         search_tool_id = str(uuid.uuid4())
#         active_streams[conversation_id].append({
#             "event": "tool_usage",
#             "data": {
#                 "tool_name": "tavily_search_results",
#                 "message": f"Searching for information about '{topic}'...",
#                 "message_id": search_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Run the LangGraph PPT generator
#         result = await ppt_generator.generate_presentation(topic)
        
#         # Mark the search as complete
#         active_streams[conversation_id].append({
#             "event": "tool_complete",
#             "data": {
#                 "tool_name": "tavily_search_results",
#                 "message": f"Found information about '{topic}'",
#                 "message_id": search_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Add PPT generation message
#         ppt_tool_id = str(uuid.uuid4())
#         active_streams[conversation_id].append({
#             "event": "tool_usage",
#             "data": {
#                 "tool_name": "powerpoint_generator",
#                 "message": f"Creating PowerPoint presentation about '{topic}'...",
#                 "message_id": ppt_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Extract file information
#         file_path = result.get("ppt_path", "")
#         filename = os.path.basename(file_path)
        
#         # Mark PPT generation as complete
#         active_streams[conversation_id].append({
#             "event": "tool_complete",
#             "data": {
#                 "tool_name": "powerpoint_generator",
#                 "message": f"PowerPoint presentation created successfully!",
#                 "message_id": ppt_tool_id
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Record the search tool call in database
#         search_tool_call = AgenticToolCall(
#             conversation_id=conversation_id,
#             tool_name="tavily_search_results",
#             input_data=topic,
#             output_data=result.get("search_results", []),
#             started_at=datetime.utcnow(),
#             completed_at=datetime.utcnow()
#         )
#         db.add(search_tool_call)
        
#         # Record the PPT generation tool call
#         ppt_tool_call = AgenticToolCall(
#             conversation_id=conversation_id,
#             tool_name="powerpoint_generator",
#             input_data=topic,
#             output_data={"filename": filename, "path": file_path},
#             started_at=datetime.utcnow(),
#             completed_at=datetime.utcnow()
#         )
#         db.add(ppt_tool_call)
        
#         # Add final AI message
#         ai_message_id = str(uuid.uuid4())
#         ai_message = AgenticMessage(
#             id=ai_message_id,
#             conversation_id=conversation_id,
#             content=f"I've created a PowerPoint presentation about '{topic}'. You can download it using the button below.",
#             sender="ai",
#             message_metadata={"ppt_filename": filename, "ppt_path": file_path}
#         )
#         db.add(ai_message)
#         db.commit()
        
#         # Add message to the stream
#         active_streams[conversation_id].append({
#             "event": "message_complete",
#             "data": {
#                 "content": ai_message.content,
#                 "message_id": ai_message_id,
#                 "segment_type": "answer",
#                 "ppt_filename": filename
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         # Mark stream as complete
#         active_streams[conversation_id].append({
#             "event": "stream_complete",
#             "data": {
#                 "content": ai_message.content,
#                 "message_id": ai_message_id,
#                 "ppt_filename": filename
#             },
#             "timestamp": int(time.time() * 1000)
#         })
        
#         print(f"PowerPoint generation completed for {conversation_id}: {filename}")
        
#     except Exception as e:
#         print(f"Error in PPT generation process: {e}")
#         traceback.print_exc()
        
#         # Add error message to the stream
#         error_message = f"Error generating PowerPoint: {str(e)}"
        
#         # Record error in database
#         error_message_obj = AgenticMessage(
#             conversation_id=conversation_id,
#             content=error_message,
#             sender="system",
#             message_metadata={
#                 "error": str(e),
#                 "traceback": traceback.format_exc()
#             }
#         )
#         db.add(error_message_obj)
#         db.commit()
        
#         # Add error to stream
#         active_streams[conversation_id].append({
#             "event": "error",
#             "data": {
#                 "message": error_message,
#                 "traceback": traceback.format_exc()
#             },
#             "timestamp": int(time.time() * 1000)
#         })

# # FastAPI Routes
# router = APIRouter(
#     prefix="/api/agentic",
#     tags=["agentic-framework"],
#     responses={404: {"description": "Not found"}}
# )

# @router.post("/query", response_model=QueryResponse)
# async def process_query(
#     query_request: QueryRequest, 
#     background_tasks: BackgroundTasks,
#     db: Session = Depends(get_db)
# ):
#     """Process user query and initiate streaming"""
#     try:
#         # Get the trimmed query string
#         trimmed_query = query_request.query.strip()
        
#         # Check if this is a PowerPoint request
#         if detect_ppt_request(trimmed_query):
#             print(f"Detected PowerPoint request: {trimmed_query}")
#             # Extract the presentation topic
#             topic = extract_ppt_topic(trimmed_query)
#             print(f"Extracted topic: {topic}")
            
#             # Create a new conversation or use existing one
#             conversation_id = query_request.conversation_id or str(uuid.uuid4())
            
#             # Ensure conversation exists
#             conversation = db.query(AgenticConversation).filter(
#                 AgenticConversation.id == conversation_id
#             ).first()
            
#             if not conversation:
#                 conversation = AgenticConversation(
#                     id=conversation_id,
#                     title=f"PPT: {topic[:50]}"
#                 )
#                 db.add(conversation)
#                 db.commit()
            
#             # Save user message
#             user_message = AgenticMessage(
#                 id=uuid.uuid4(),
#                 conversation_id=conversation_id,
#                 content=trimmed_query,
#                 sender="user",
#                 message_metadata={
#                     "image_url": query_request.image_url,
#                     "is_ppt_request": True
#                 } if query_request.image_url else {"is_ppt_request": True}
#             )
#             db.add(user_message)
#             db.commit()
            
#             # Initialize stream storage with initial message
#             active_streams[conversation_id] = []
            
#             # Start background processing for PowerPoint generation
#             background_tasks.add_task(
#                 process_ppt_generation,
#                 topic,
#                 conversation_id,
#                 db
#             )
            
#             return {
#                 "conversation_id": conversation_id,
#                 "message_id": str(user_message.id)
#             }
            
#         # Continue with normal query processing if not a PPT request
#         # Determine conversation ID
#         conversation_id = query_request.conversation_id or str(uuid.uuid4())
        
#         # Ensure conversation exists
#         conversation = db.query(AgenticConversation).filter(
#             AgenticConversation.id == conversation_id
#         ).first()
        
#         # Check if this is a new conversation or continuing one
#         is_new_conversation = False
#         if not conversation:
#             conversation = AgenticConversation(id=conversation_id)
#             db.add(conversation)
#             db.commit()
#             is_new_conversation = True
        
#         # Save user message
#         user_message = AgenticMessage(
#             id=uuid.uuid4(),
#             conversation_id=conversation_id,
#             content=query_request.query,
#             sender="user",
#             message_metadata={
#                 "image_url": query_request.image_url
#             } if query_request.image_url else None
#         )
#         db.add(user_message)
#         db.commit()
        
#         # Prepare thread for agent
#         thread = {"configurable": {"thread_id": conversation_id}}
        
#         # Determine if we should skip greeting
#         # Skip if explicitly requested or if this is not a new conversation
#         should_skip_greeting = query_request.skip_greeting or not is_new_conversation
        
#         # Start background stream processing
#         background_tasks.add_task(
#             process_stream, 
#             query_request.query, 
#             conversation_id, 
#             thread,
#             db,
#             should_skip_greeting
#         )
        
#         return {
#             "conversation_id": conversation_id, 
#             "message_id": str(user_message.id)
#         }
    
#     except Exception as e:
#         print(f"Error in query processing: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail=str(e))

# @router.get("/stream/{conversation_id}", response_model=StreamResponse)
# async def get_stream_events(
#     conversation_id: str,
#     since: Optional[int] = Query(None, description="Timestamp to get only events since this time")
# ):
#     """Retrieve streaming events for a conversation"""
#     try:
#         # Check if conversation stream exists
#         if conversation_id not in active_streams:
#             return {"events": [], "is_active": False}
        
#         # Get a copy of events
#         all_events = active_streams.get(conversation_id, []).copy()
        
#         # Filter events by timestamp if provided
#         if since is not None:
#             filtered_events = [event for event in all_events if event.get("timestamp", 0) > since]
#         else:
#             filtered_events = all_events.copy()
        
#         # Get event IDs we're about to send
#         event_timestamps = {event.get("timestamp") for event in filtered_events if "timestamp" in event}
        
#         # Remove only the events we're sending from active_streams
#         if event_timestamps:
#             active_streams[conversation_id] = [
#                 event for event in all_events
#                 if event.get("timestamp") not in event_timestamps
#             ]
        
#         # Determine if stream is still active
#         is_active = not any(
#             event.get("event") in ["stream_complete", "error"] 
#             for event in filtered_events
#         )
        
#         # Convert to StreamEvent model and remove timestamp field
#         stream_events = []
#         for e in filtered_events:
#             event_data = {
#                 "event": e["event"],
#                 "data": e["data"]
#             }
#             stream_events.append(StreamEvent(**event_data))
        
#         return {
#             "events": stream_events, 
#             "is_active": is_active
#         }
    
#     except Exception as e:
#         print(f"Error retrieving stream events: {e}")
#         traceback.print_exc()
#         return {"events": [], "is_active": False}

# # Download presentation endpoint
# @router.get("/download/presentation/{filename}")
# async def download_presentation(filename: str):
#     """
#     Download a generated PowerPoint presentation
    
#     Args:
#         filename (str): Name of the presentation file
        
#     Returns:
#         FileResponse: The presentation file for download
#     """
#     try:
#         file_path = os.path.join(presentations_dir, filename)
        
#         if not os.path.exists(file_path):
#             raise HTTPException(status_code=404, detail="Presentation not found")
        
#         # Create a temp directory for copied files to handle concurrent access
#         os.makedirs(temp_downloads_dir, exist_ok=True)
        
#         # Copy the file to a temporary location
#         temp_file_path = os.path.join(temp_downloads_dir, filename)
#         shutil.copy2(file_path, temp_file_path)
        
#         # Define cleanup task
#         def remove_file():
#             try:
#                 os.unlink(temp_file_path)
#             except Exception as e:
#                 print(f"Error removing temporary file: {e}")
        
#         # Return file response with cleanup task
#         return FileResponse(
#             path=temp_file_path,
#             filename=filename,
#             media_type="application/vnd.openxmlformats-officedocument.presentationml.presentation",
#             background=BackgroundTask(remove_file)
#         )
    
#     except Exception as e:
#         if isinstance(e, HTTPException):
#             raise e
#         print(f"Error downloading presentation: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.get("/conversation/{conversation_id}", response_model=ConversationDetail)
# def get_conversation(conversation_id: str, db: Session = Depends(get_db)):
#     """
#     Retrieve all messages for a specific conversation
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         db (Session): Database session
    
#     Returns:
#         ConversationDetail: Conversation messages
#     """
#     try:
#         # Verify conversation exists
#         conversation = db.query(AgenticConversation).filter(
#             AgenticConversation.id == conversation_id
#         ).first()
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Retrieve messages, ordered by creation time
#         messages = (
#             db.query(AgenticMessage)
#             .filter(AgenticMessage.conversation_id == conversation_id)
#             .order_by(AgenticMessage.created_at)
#             .all()
#         )
        
#         # Convert to response model
#         message_responses = [
#             MessageResponse(
#                 id=str(message.id),
#                 content=message.content,
#                 sender=message.sender,
#                 created_at=message.created_at,
#                 metadata=message.message_metadata
#             )
#             for message in messages
#         ]
        
#         return {
#             "conversation_id": conversation_id, 
#             "messages": message_responses
#         }
    
#     except Exception as e:
#         print(f"Error retrieving conversation: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.delete("/conversation/{conversation_id}")
# def delete_conversation(conversation_id: str, db: Session = Depends(get_db)):
#     """
#     Delete a conversation and all associated messages and tool calls
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         db (Session): Database session
    
#     Returns:
#         dict: Confirmation message
#     """
#     try:
#         # Verify conversation exists
#         conversation = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.id == conversation_id)
#             .first()
#         )
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Delete associated tool calls
#         tool_calls_deleted = (
#             db.query(AgenticToolCall)
#             .filter(AgenticToolCall.conversation_id == conversation_id)
#             .delete(synchronize_session=False)
#         )
        
#         # Delete associated messages
#         messages_deleted = (
#             db.query(AgenticMessage)
#             .filter(AgenticMessage.conversation_id == conversation_id)
#             .delete(synchronize_session=False)
#         )
        
#         # Delete the conversation
#         db.delete(conversation)
        
#         # Commit changes
#         db.commit()
        
#         return {
#             "message": "Conversation deleted successfully",
#             "deleted_messages": messages_deleted,
#             "deleted_tool_calls": tool_calls_deleted
#         }
    
#     except Exception as e:
#         # Rollback in case of error
#         db.rollback()
#         print(f"Error deleting conversation: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.put("/conversation/{conversation_id}/title")
# def update_conversation_title(
#     conversation_id: str, 
#     title: str = Body(..., min_length=1, max_length=100),
#     db: Session = Depends(get_db)
# ):
#     """
#     Update the title of a conversation
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         title (str): New title for the conversation
#         db (Session): Database session
    
#     Returns:
#         dict: Updated conversation details
#     """
#     try:
#         # Find the conversation
#         conversation = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.id == conversation_id)
#             .first()
#         )
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Update title
#         conversation.title = title
#         db.commit()
        
#         return {
#             "id": str(conversation.id),
#             "title": conversation.title,
#             "updated_at": conversation.updated_at
#         }
    
#     except Exception as e:
#         db.rollback()
#         print(f"Error updating conversation title: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# @router.get("/conversation/{conversation_id}/tools")
# def get_conversation_tool_calls(
#     conversation_id: str, 
#     db: Session = Depends(get_db),
#     limit: int = Query(default=50, le=100),
#     offset: int = Query(default=0, ge=0)
# ):
#     """
#     Retrieve tool calls for a specific conversation
    
#     Args:
#         conversation_id (str): Unique identifier for the conversation
#         db (Session): Database session
#         limit (int): Maximum number of tool calls to return
#         offset (int): Number of tool calls to skip
    
#     Returns:
#         dict: List of tool calls
#     """
#     try:
#         # Verify conversation exists
#         conversation = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.id == conversation_id)
#             .first()
#         )
        
#         if not conversation:
#             raise HTTPException(status_code=404, detail="Conversation not found")
        
#         # Retrieve tool calls with pagination
#         tool_calls = (
#             db.query(AgenticToolCall)
#             .filter(AgenticToolCall.conversation_id == conversation_id)
#             .order_by(AgenticToolCall.started_at.desc())
#             .limit(limit)
#             .offset(offset)
#             .all()
#         )
        
#         # Convert to a format suitable for response
#         tool_call_list = [
#             {
#                 "id": str(tc.id),
#                 "tool_name": tc.tool_name,
#                 "input_data": tc.input_data,
#                 "output_data": tc.output_data,
#                 "started_at": tc.started_at,
#                 "completed_at": tc.completed_at
#             }
#             for tc in tool_calls
#         ]
        
#         return {
#             "conversation_id": conversation_id,
#             "tool_calls": tool_call_list,
#             "total_tool_calls": len(tool_calls)
#         }
    
#     except Exception as e:
#         print(f"Error retrieving tool calls: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")

# # Additional Utility Function for Analytics
# @router.get("/analytics")
# def get_conversation_analytics(db: Session = Depends(get_db)):
#     """
#     Retrieve basic analytics about conversations and tool usage
    
#     Args:
#         db (Session): Database session
    
#     Returns:
#         dict: Conversation and tool usage analytics
#     """
#     try:
#         # Total conversations
#         total_conversations = db.query(AgenticConversation).count()
        
#         # Conversations in last 7 days
#         seven_days_ago = datetime.utcnow() - timedelta(days=7)
#         recent_conversations = (
#             db.query(AgenticConversation)
#             .filter(AgenticConversation.created_at >= seven_days_ago)
#             .count()
#         )
        
#         # Total tool calls
#         total_tool_calls = db.query(AgenticToolCall).count()
        
#         # Most used tools
#         tool_usage = (
#             db.query(AgenticToolCall.tool_name, func.count(AgenticToolCall.id))
#             .group_by(AgenticToolCall.tool_name)
#             .order_by(func.count(AgenticToolCall.id).desc())
#             .limit(5)
#             .all()
#         )
        
#         return {
#             "total_conversations": total_conversations,
#             "recent_conversations": recent_conversations,
#             "total_tool_calls": total_tool_calls,
#             "top_tools": [
#                 {"name": tool, "count": count} 
#                 for tool, count in tool_usage
#             ]
#         }
    
#     except Exception as e:
#         print(f"Error retrieving analytics: {e}")
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Internal server error")