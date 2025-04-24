from typing import Dict, List, Optional, Union, Any
import json

from openai import AzureOpenAI
from tenacity import retry, stop_after_attempt, wait_exponential, retry_if_exception_type

from utils.logger import logger
from config.settings import (
    AZURE_OPENAI_API_KEY,
    AZURE_OPENAI_ENDPOINT,
    AZURE_OPENAI_API_VERSION,
    AZURE_OPENAI_CHAT_DEPLOYMENT_NAME,
)


class Generator:
    """
    Response generator using Azure OpenAI with retrieved context.
    """
    
    def __init__(self):
        """Initialize the Generator with Azure OpenAI client."""
        self.client = AzureOpenAI(
            api_key=AZURE_OPENAI_API_KEY,
            api_version=AZURE_OPENAI_API_VERSION,
            azure_endpoint=AZURE_OPENAI_ENDPOINT
        )
        self.model = AZURE_OPENAI_CHAT_DEPLOYMENT_NAME
        logger.info(f"Generator initialized with model: {self.model}")
    
    @retry(
        retry=retry_if_exception_type((TimeoutError, ConnectionError)),
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=1, min=2, max=10),
        reraise=True
    )
    def generate_response(self, query: str, context: str, 
                          temperature: float = 0.7, max_tokens: int = 1000) -> str:
        """
        Generate a response based on the query and retrieved context.
        
        Args:
            query: User query
            context: Retrieved context from the vector store
            temperature: Temperature for generation (higher = more creative)
            max_tokens: Maximum number of tokens to generate
            
        Returns:
            Generated response text
        """
        try:
            # Create system message with context
            system_message = f"""You are a vision-based assistant that answers questions about images.
            Use the following context retrieved from a visual database to answer the user's question.
            If the context doesn't contain relevant information, say so.
            
            CONTEXT:
            {context}
            """
            
            # Create messages for the API call
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": query}
            ]
            
            # Call the Azure OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            # Extract the response text
            response_text = response.choices[0].message.content
            
            logger.info(f"Generated response for query: {query}")
            return response_text
        
        except Exception as e:
            logger.error(f"Error generating response: {e}")
            return f"I encountered an error while generating a response. Please try again. Error: {str(e)}"
    
    def generate_with_image(self, query: str, context: str, image_base64: str,
                           temperature: float = 0.7, max_tokens: int = 1000) -> str:
        """
        Generate a response based on the query, context, and a new image.
        
        Args:
            query: User query
            context: Retrieved context from the vector store
            image_base64: Base64-encoded image to analyze
            temperature: Temperature for generation
            max_tokens: Maximum number of tokens to generate
            
        Returns:
            Generated response text
        """
        try:
            # Create system message with context
            system_message = f"""You are a vision-based assistant that answers questions about images.
            Use the following context retrieved from a visual database to answer the user's question
            about the uploaded image. Compare the uploaded image with the context when relevant.
            If the context doesn't contain relevant information, focus on analyzing the uploaded image.
            
            CONTEXT:
            {context}
            """
            
            # Create messages for the API call
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": [
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{image_base64}"
                        }
                    },
                    {
                        "type": "text",
                        "text": query
                    }
                ]}
            ]
            
            # Call the Azure OpenAI API
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            
            # Extract the response text
            response_text = response.choices[0].message.content
            
            logger.info(f"Generated response for query with image: {query}")
            return response_text
        
        except Exception as e:
            logger.error(f"Error generating response with image: {e}")
            return f"I encountered an error while generating a response. Please try again. Error: {str(e)}"