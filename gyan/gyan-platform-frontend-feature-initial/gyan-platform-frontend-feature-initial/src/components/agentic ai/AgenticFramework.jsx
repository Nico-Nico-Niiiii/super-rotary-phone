// ppt ui also
import React, { useState, useRef, useEffect, memo } from 'react';
import { Plus, Search, MoreHorizontal, Mic, Image, Lightbulb, Pencil, 
  BarChart2, Gift, FileText, X, AlertTriangle, Download } from 'lucide-react';
import axios from 'axios';
import './agenticframework.css';

// API base URL - update this to match your FastAPI server
const API_URL = 'http://localhost:8000/api/agentic';

import ReactMarkdown from 'react-markdown';  

const markdownStyles = {
  // Headings
  '& h1, & h2, & h3, & h4, & h5, & h6': {
    fontWeight: 'bold',
    marginTop: '1em',
    marginBottom: '0.5em',
    lineHeight: '1.25',
  },
  '& h1': {
    fontSize: '2em',
    borderBottom: '2px solid #ddd',
    paddingBottom: '0.2em',
  },
  '& h2': {
    fontSize: '1.75em',
    borderBottom: '1px solid #ddd',
    paddingBottom: '0.2em',
  },
  '& h3': {
    fontSize: '1.5em',
  },
  '& h4': {
    fontSize: '1.25em',
  },
  '& h5': {
    fontSize: '1.1em',
  },
  '& h6': {
    fontSize: '1em',
  },

  // Paragraphs and text
  '& p': {
    marginBottom: '0.75em',
    lineHeight: '1.6',
  },
  '& strong': {
    fontWeight: 'bold',
  },
  '& em': {
    fontStyle: 'italic',
  },
  '& u': {
    textDecoration: 'underline',
  },
  '& del': {
    textDecoration: 'line-through',
  },
  '& blockquote': {
    borderLeft: '4px solid #ccc',
    paddingLeft: '1em',
    color: '#555',
    margin: '1em 0',
    fontStyle: 'italic',
  },

  // Lists
  '& ul, & ol': {
    paddingLeft: '1.5em',
    marginBottom: '0.75em',
  },
  '& li': {
    marginBottom: '0.25em',
  },

  // Code
  '& code': {
    fontFamily: 'monospace',
    backgroundColor: '#f0f0f0',
    padding: '0.2em 0.4em',
    borderRadius: '3px',
    fontSize: '85%',
  },
  '& pre': {
    backgroundColor: '#f4f4f4',
    padding: '1em',
    borderRadius: '5px',
    overflowX: 'auto',
  },
  '& pre code': {
    backgroundColor: 'transparent',
    padding: '0',
    fontSize: '100%',
  },

  // Links
  '& a': {
    color: '#0366d6',
    textDecoration: 'none',
    '&:hover': {
      textDecoration: 'underline',
    },
  },

  // Horizontal Rule
  '& hr': {
    border: 'none',
    borderTop: '1px solid #ddd',
    margin: '1.5em 0',
  },

  // Tables
  '& table': {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '1em',
  },
  '& th, & td': {
    border: '1px solid #ddd',
    padding: '0.5em',
  },
  '& th': {
    backgroundColor: '#f4f4f4',
    fontWeight: 'bold',
  },

  // Images
  '& img': {
    maxWidth: '100%',
    display: 'block',
    margin: '0.5em auto',
  },
};


// Add this utility function to filter duplicate messages
const getUniqueMessages = (messages) => {
  const uniqueMessages = [];
  const seenIds = new Set();
  
  for (const message of messages) {
    if (!message.id || !seenIds.has(message.id)) {
      if (message.id) seenIds.add(message.id);
      uniqueMessages.push(message);
    }
  }
  
  return uniqueMessages;
};

// Utility function to identify PowerPoint requests
const isPowerPointRequest = (text) => {
  const pptPatterns = [
    /create.*ppt/i,
    /make.*presentation/i,
    /create.*presentation/i,
    /make.*ppt/i,
    /generate.*powerpoint/i,
    /design.*slides/i
  ];
  
  return pptPatterns.some(pattern => pattern.test(text));
};

const AgenticFramework = () => {
  // State variables
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentConversationId, setCurrentConversationId] = useState(null);
  const [streamingMessage, setStreamingMessage] = useState('');
  const [toolOutput, setToolOutput] = useState(null);
  const [pollingInterval, setPollingInterval] = useState(null);
  
  // UI state variables for step-by-step display
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingContent, setThinkingContent] = useState('');
  const [toolStatus, setToolStatus] = useState(null);
  
  // Track processed message IDs
  const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  
  // New state for PowerPoint generation tracking
  const [isPptGenerating, setIsPptGenerating] = useState(false);
  const [pptFilename, setPptFilename] = useState(null);
  
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setSelectedImage(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startListening = () => {
    if (isListening) return; // Prevent starting if already listening
    
    if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
        // Stop recording after 3 seconds
        setTimeout(() => {
          recognition.stop();
        }, 3000);
      };
      
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        // Submit the form after getting the transcript
        setTimeout(() => {
          const submitEvent = new Event('submit', { cancelable: true });
          document.querySelector('form')?.dispatchEvent(submitEvent);
        }, 100);
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
      
      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.start();
    } else {
      alert('Speech recognition is not supported in this browser.');
    }
  };

  // Add the addMessage function here
  const addMessage = (newMessage) => {
    // For debugging
    console.log('Adding/updating message:', newMessage);
    
    setMessages(prevMessages => {
      // Check if this message ID already exists
      if (newMessage.id && prevMessages.some(msg => msg.id === newMessage.id)) {
        console.log(`Message with ID ${newMessage.id} already exists, updating instead`);
        // Update existing message (including any metadata)
        const updatedMessages = prevMessages.map(msg => 
          msg.id === newMessage.id ? { ...msg, ...newMessage } : msg
        );
        console.log('Updated messages:', updatedMessages);
        return updatedMessages;
      }
      
      // Debug log for PowerPoint metadata
      if (newMessage.metadata && newMessage.metadata.ppt_filename) {
        console.log("PowerPoint metadata detected:", newMessage.metadata);
        setPptFilename(newMessage.metadata.ppt_filename);
      }
      
      // Add new message
      const newMessages = [...prevMessages, newMessage];
      console.log('New messages array:', newMessages);
      return newMessages;
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Clear any existing messages when component first mounts
    setMessages([]);
    
    // Clear any existing processed IDs
    setProcessedMessageIds(new Set());
  }, []);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    console.log('Messages changed, scrolling to bottom. Current messages:', messages);
    scrollToBottom();
  }, [messages, streamingMessage, isThinking, thinkingContent]);
  
  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [pollingInterval]);

  const processStreamEvents = (events) => {
    console.log('Processing stream events:', events);
    console.log('Current messages state before processing:', messages);
    
    // Process events in order to ensure proper sequencing
    events.forEach((event) => {
      const { event: eventType, data } = event;
      console.log(`Event Type: ${eventType}`, data);
      
      // Handle thinking updates (stream in real-time)
      if (eventType === 'thinking_update') {
        console.log('Thinking update received:', data.content);
        setIsThinking(true);
        setThinkingContent(data.content);
      }
      
      // Handle completed thinking message
      else if (eventType === 'message_complete' && data.segment_type === 'thinking') {
        console.log('Thinking message complete');
        setIsThinking(false); // Turn off thinking indicator
        
        // Update processed IDs to avoid duplication
        setProcessedMessageIds(prev => {
          const newSet = new Set(prev);
          if (data.message_id) newSet.add(data.message_id);
          return newSet;
        });
        
        setThinkingContent('');
      }
      
      // Handle tool usage start
      else if (eventType === 'tool_usage') {
        console.log('Tool usage start:', data.tool_name);
        // Special handling for PowerPoint generation
        if (data.tool_name === 'powerpoint_generator') {
          setIsPptGenerating(true);
        }
        
        setToolStatus({
          toolName: data.tool_name,
          message: data.message,
          messageId: data.message_id,
          status: 'searching'
        });
        
        // Check if message already exists before adding
        if (data.message_id) {
          const messageExists = messages.some(msg => msg.id === data.message_id);
          
          if (!messageExists) {
            addMessage({
              id: data.message_id,
              text: data.message,
              sender: 'tool',
              status: 'searching'
            });
            
            // Track processed ID
            setProcessedMessageIds(prev => {
              const newSet = new Set(prev);
              newSet.add(data.message_id);
              return newSet;
            });
          }
        }
      }
      
      // Handle tool completion - update existing message instead of creating new
      else if (eventType === 'tool_complete') {
        console.log('Tool completion:', data.tool_name);
        // Special handling for PowerPoint completion
        if (data.tool_name === 'powerpoint_generator') {
          setIsPptGenerating(false);
        }
        
        setToolStatus({
          toolName: data.tool_name,
          message: data.message,
          messageId: data.message_id,
          status: 'complete'
        });
        
        // Update existing tool message - don't create a new one
        addMessage({
          id: data.message_id,
          text: data.message,
          status: 'complete',
          sender: 'tool'
        });
        
        // Track processed ID
        setProcessedMessageIds(prev => {
          const newSet = new Set(prev);
          if (data.message_id) newSet.add(data.message_id);
          return newSet;
        });
      }
      
      // Handle partial answer (paragraphs coming in sequence)
      else if (eventType === 'partial_answer') {
        console.log('Partial answer received:', data);
        const isFirst = data.is_first;
        const isLast = data.is_last;
        
        if (data.message_id) {
          // Skip if already processed
          if (processedMessageIds.has(data.message_id)) {
            console.log('Skipping already processed message ID:', data.message_id);
            return;
          }
          
          // Track processed ID
          setProcessedMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(data.message_id);
            return newSet;
          });
          
          if (isFirst) {
            console.log('First part of answer, creating new message');
            // First part - create new message
            addMessage({
              id: data.message_id,
              text: data.content,
              sender: 'ai',
              type: 'answer',
              isActive: true
            });
          } else {
            console.log('Additional part of answer, updating existing message');
            // Find active AI message to append to
            const activeMessage = messages.find(msg => 
              msg.sender === 'ai' && msg.type === 'answer' && msg.isActive
            );

            if (activeMessage) {
              console.log('Found active message to update:', activeMessage);
              addMessage({
                id: activeMessage.id,
                text: activeMessage.text + '\n\n' + data.content,
                sender: 'ai',
                type: 'answer',
                isActive: !isLast
              });
            } else {
              console.log('No active message found, creating new one for partial answer');
              addMessage({
                id: data.message_id,
                text: data.content,
                sender: 'ai',
                type: 'answer',
                isActive: !isLast
              });
            }
          }
        }
      }
      
      // Handle complete answer (for short, non-split answers)
      else if (eventType === 'message_complete' && data.segment_type === 'answer') {
        console.log('Complete message received:', data);
        if (data.message_id) {
          // Skip if already processed
          if (processedMessageIds.has(data.message_id)) {
            console.log('Skipping already processed message ID:', data.message_id);
            return;
          }
          
          // Track processed ID
          setProcessedMessageIds(prev => {
            const newSet = new Set(prev);
            newSet.add(data.message_id);
            return newSet;
          });
          
          // Add PowerPoint metadata if available
          if (data.ppt_filename) {
            console.log("PowerPoint file detected in message:", data.ppt_filename);
            setPptFilename(data.ppt_filename);
            
            // Create/update the message with PowerPoint metadata
            addMessage({
              id: data.message_id,
              text: data.content,
              sender: 'ai',
              type: 'answer',
              isActive: false,
              metadata: {
                ppt_filename: data.ppt_filename
              }
            });
          } else {
            // Find if there's an active AI message
            const activeMessageIndex = messages.findIndex(msg => 
              msg.sender === 'ai' && msg.type === 'answer' && msg.isActive
            );
            
            if (activeMessageIndex >= 0) {
              console.log('Updating existing active message');
              // Update existing message
              addMessage({
                id: data.message_id,
                text: data.content,
                sender: 'ai',
                type: 'answer',
                isActive: false
              });
            } else {
              console.log('Creating new message for complete answer');
              // Create new message
              addMessage({
                id: data.message_id,
                text: data.content,
                sender: 'ai',
                type: 'answer',
                isActive: false
              });
            }
          }
        }
        
        // Clear thinking content
        setThinkingContent('');
      }
      
      // Handle stream complete event
      else if (eventType === 'stream_complete') {
        console.log('Stream complete event:', data);
        console.log('Messages before marking inactive:', messages);
        
        // If we have PowerPoint filename in the completion event
        if (data.ppt_filename) {
          console.log("PowerPoint file in stream complete:", data.ppt_filename);
          setPptFilename(data.ppt_filename);
          
          // Make sure to update the message with this metadata
          addMessage({
            id: data.message_id,
            text: data.content,
            sender: 'ai',
            type: 'answer',
            isActive: false,
            metadata: {
              ppt_filename: data.ppt_filename
            }
          });
        }
        
        // Mark all active messages as inactive
        messages.forEach(msg => {
          if (msg.isActive) {
            console.log('Marking message as inactive:', msg);
            addMessage({
              ...msg,
              isActive: false
            });
          }
        });
        
        // Clear all streaming states
        setIsProcessing(false);
        setIsPptGenerating(false);
        setToolStatus(null);
        setIsThinking(false);
        setThinkingContent('');
        setStreamingMessage('');
        
        console.log('After stream complete, thinking state is:', isThinking);
      }
      
      // Handle error events
      else if (eventType === 'error') {
        console.error('Stream error:', data);
        
        addMessage({
          id: `error-${Date.now()}`,
          text: data.message || 'An error occurred',
          sender: 'system'
        });
        
        setIsProcessing(false);
        setIsPptGenerating(false);
        setToolStatus(null);
        setIsThinking(false);
        setThinkingContent('');
      }
    });
  };

  const startPolling = (conversationId) => {
    // Clear any existing polling interval
    if (pollingInterval) {
      clearInterval(pollingInterval);
    }
    
    let pollingAttempts = 0;
    const MAX_POLLING_ATTEMPTS = 50;
    
    // Track the last event timestamp
    let lastEventTimestamp = Date.now();
    
    // Flag to prevent overlapping processing
    let isProcessingBatch = false;
    
    const intervalId = setInterval(async () => {
      // Skip this cycle if we're still processing
      if (isProcessingBatch) return;
      
      try {
        isProcessingBatch = true;
        pollingAttempts++;
        
        // Stop polling after max attempts
        if (pollingAttempts > MAX_POLLING_ATTEMPTS) {
          clearInterval(intervalId);
          setPollingInterval(null);
          setIsProcessing(false);
          isProcessingBatch = false;
          return;
        }
        
        const response = await axios.get(
          `${API_URL}/stream/${conversationId}?since=${lastEventTimestamp}`
        );
        
        const { events, is_active } = response.data;
        
        // Only process if we have events
        if (events && events.length > 0) {
          console.log("Received events:", events);
          // Process events
          processStreamEvents(events);
          
          // Only update timestamp AFTER successful processing
          lastEventTimestamp = Date.now();
          
          // Reset polling attempts if events received
          pollingAttempts = 0;
        }
        
        // Check for stream completion
        const isStreamComplete = events.some(event => 
          event.event === 'stream_complete' || 
          event.event === 'error'
        );
        
        // Stop polling if complete or inactive
        if (isStreamComplete || !is_active) {
          clearInterval(intervalId);
          setPollingInterval(null);
          setIsProcessing(false);
        }
        
        isProcessingBatch = false;
      } catch (error) {
        console.error('Error polling stream:', error);
        isProcessingBatch = false;
        
        addMessage({ 
          id: `error-${Date.now()}`, 
          text: 'Sorry, there was an error retrieving the response.', 
          sender: 'system' 
        });
      }
    }, 300);
    
    setPollingInterval(intervalId);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmedInput = inputValue.trim();
    
    if (trimmedInput || selectedImage) {
      setIsProcessing(true);
      setStreamingMessage(''); // Clear any previous streaming message
      
      // Reset processed IDs for a new conversation
      setProcessedMessageIds(new Set());
      
      // Reset PowerPoint state
      setPptFilename(null);
      setIsPptGenerating(false);
      
      // Check if this is a PowerPoint request
      const isPptRequest = isPowerPointRequest(trimmedInput);
      if (isPptRequest) {
        console.log("PowerPoint request detected");
      }
      
      // Prepare image data if exists
      let imageData = null;
      if (selectedImage) {
        imageData = selectedImage;
      }
      
      // Add user message to UI immediately
      addMessage({
        id: `user-${Date.now()}`,
        text: trimmedInput,
        sender: 'user',
        image: imageData
      });
      
      try {
        const response = await axios.post(`${API_URL}/query`, {
          query: trimmedInput,
          conversation_id: currentConversationId,
          image_url: imageData,
          skip_greeting: true  // Add this flag to tell backend not to send greeting
        });
        
        console.log("Query response:", response.data);
        
        // Update conversation ID if new
        if (!currentConversationId) {
          setCurrentConversationId(response.data.conversation_id);
        }
        
        // Start polling for streaming updates
        startPolling(response.data.conversation_id);
      } catch (error) {
        // Reset processing state
        setIsProcessing(false);
        
        // Add error message to chat
        addMessage({
          id: `error-${Date.now()}`,
          text: error.response?.data?.detail || 'Sorry, there was an error processing your request. Please try again.',
          sender: 'system'
        });
      }
      
      // Clear input
      setInputValue('');
      setSelectedImage(null);
    }
  };

  // Add PowerPoint Preview Component
  const PresentationPreview = memo(({ filename }) => {
    console.log("Rendering presentation preview for:", filename);
    
    // Simplified preview - shows placeholder slides
    return (
      <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-100 p-2 border-b font-medium text-sm flex items-center">
          <FileText className="w-4 h-4 mr-2 text-blue-600" />
          PowerPoint Preview: {filename}
        </div>
        <div className="p-4 bg-white">
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((slideNum) => (
              <div key={slideNum} className="aspect-video bg-gray-50 rounded border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
                <div className="text-center p-2">
                  <div className="font-bold text-xs mb-1 text-gray-700">Slide {slideNum}</div>
                  <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
                  <div className="w-3/4 h-2 bg-gray-200 rounded mb-2"></div>
                  <div className="w-full h-1 bg-gray-200 rounded mb-1"></div>
                  <div className="w-full h-1 bg-gray-200 rounded mb-1"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  });

  const ActionButton = memo(({ icon: Icon, text }) => (
    <button className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">
      <Icon className="w-4 h-4" />
      <span>{text}</span>
    </button>
  ));

  const ThinkingIndicator = memo(({ content }) => {
    // Find an active AI message if any
    const activeAIMessage = messages.find(msg => 
      msg.sender === 'ai' && msg.type === 'answer' && msg.isActive
    );
    
    return (
      <div className="flex items-start gap-4 my-4">
        <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200"></div> 
        <div className="flex flex-col items-start">
          <div className="font-medium mb-1 flex items-center">
            <span className="mr-2">Assistant</span>
            <span className="text-sm text-gray-500 italic">(typing...)</span>
          </div>
          <div className="rounded-2xl px-4 py-2 max-w-xl text-gray-800 ">
            {activeAIMessage ? (
              <>
                {/* Show accumulated content first */}
                <div dangerouslySetInnerHTML={{ 
                  __html: activeAIMessage.text
                    .split('\n\n')
                    .map(para => `<p>${para}</p>`)
                    .join('')
                }} />
                
                {/* Show current typing content with cursor */}
                {content && (
                  <p className="mt-2 new-content">
                    {content}
                    <span className="typing-cursor"></span>
                  </p>
                )}
              </>
            ) : (
              <>
                {/* Only show typing content if no active message */}
                {content}
                <span className="typing-cursor"></span>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if content changed substantially (> 5 chars)
    return Math.abs((prevProps.content?.length || 0) - (nextProps.content?.length || 0)) < 5;
  });

  const MessageBubble = memo(({ message }) => {
    const isUser = message.sender === 'user';
    const isTool = message.sender === 'tool';
    const isThinking = message.sender === 'ai' && message.type === 'thinking';
    const isAnswer = message.sender === 'ai' && message.type === 'answer';
    const isSystemMessage = message.sender === 'system';
    
    const [isCopied, setIsCopied] = useState(false);
    const [isLiked, setIsLiked] = useState(false);
    const [isDisliked, setIsDisliked] = useState(false);
    const [isReading, setIsReading] = useState(false);
    
    // Add this ref for tracking previous content length
    const prevTextLength = useRef(message.text?.length || 0);
    const messageRef = useRef(null);
    
    // Check if message contains PowerPoint metadata
    const hasPptMetadata = message.metadata && message.metadata.ppt_filename;
    
    // Track which parts of the message are new for animations
    useEffect(() => {
      if (isAnswer && message.text) {
        // Only track if text has grown
        if (message.text.length > prevTextLength.current && messageRef.current) {
          // Update the reference for next comparison
          prevTextLength.current = message.text.length;
        }
      }
      
      // Debug logging for PowerPoint metadata
      if (hasPptMetadata) {
        console.log("Message has PowerPoint metadata:", message.metadata);
      }
    }, [message.text, isAnswer, hasPptMetadata]);
    
    // Format message text to properly handle paragraphs and markdown
    const formatMessageText = (text) => {
      if (!text) return '';
      
      // For debugging
      console.log('Formatting message text:', text);
      
      try {
        // First handle horizontal lines
        const processedText = text.replace(/\r?\n+/g, '\n\n').trim();
        // const processedText = text
        //   .replace(/\r?\n+/g, '\n\n') // Wrap inline code in <strong> tags
        //   .trim();
                
        // Split paragraphs
        const paragraphs = processedText.split('\n\n');
        return paragraphs.map((paragraph, index) => {
          if (!paragraph.trim()) return null;
          
          // Determine if this paragraph might be new
          const isNewParagraph = paragraphs.length > 1 && 
                               index >= paragraphs.length - 2 && 
                               message.isActive;
          
          // Handle headings
          if (paragraph.trim().startsWith('### ')) {
            return (
              <h3 
                key={index} 
                className={`${index > 0 ? "mt-3" : ""} ${isNewParagraph ? "new-content" : ""} text-lg font-bold`}
              >
                {paragraph.replace(/^### /, '')}
              </h3>
            );
          }
          
          // Handle bullet points
          if (paragraph.includes('\n-')) {
            const parts = paragraph.split('\n- ');
            const title = parts[0];
            const listItems = parts.slice(1);
            
            return (
              <div key={index} className={`${index > 0 ? "mt-2" : ""} ${isNewParagraph ? "new-content" : ""}`}>
                {title && title.trim() && <p className="mb-1">{title}</p>}
                <ul className="list-disc list-inside pl-2 space-y-1">
                  {listItems.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            );
          }
          
          // Regular paragraph
          return (
            <p 
              key={index} 
              className={`${index > 0 ? "mt-2" : ""} ${isNewParagraph ? "new-content" : ""}`}
            >
              {paragraph}
            </p>
          );
        });
      } catch (error) {
        console.error('Error formatting message:', error);
        // Fallback rendering if error occurs
        return (
          <div className="text-red-500">
            <p>Error formatting message. Raw content:</p>
            <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
              {text}
            </pre>
          </div>
        );
      }
    };
    
    const handleCopy = () => {
      navigator.clipboard.writeText(message.text)
        .then(() => {
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000);
        })
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    };
    
    const handleLike = () => {
      if (isDisliked) setIsDisliked(false);
      setIsLiked(!isLiked);
    };
    
    const handleDislike = () => {
      if (isLiked) setIsLiked(false);
      setIsDisliked(!isDisliked);
    };
    
    const handleReadAloud = () => {
      if ('speechSynthesis' in window) {
        // If already reading, stop
        if (isReading) {
          window.speechSynthesis.cancel();
          setIsReading(false);
          return;
        }
        
        // Start reading
        window.speechSynthesis.cancel(); // Cancel any ongoing speech
        const utterance = new SpeechSynthesisUtterance(message.text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        
        utterance.onend = () => {
          setIsReading(false);
        };
        
        utterance.onerror = () => {
          setIsReading(false);
        };
        
        setIsReading(true);
        window.speechSynthesis.speak(utterance);
      } else {
        alert('Speech synthesis is not supported in this browser.');
      }
    };


    // Rendering for tool status messages
    if (isTool) {
      const isSearching = message.status === 'searching';
      
      return (
        <div className="flex items-start gap-4 my-2">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-green-200 flex items-center justify-center">
            <Search className="w-4 h-4 text-green-700" />
          </div>
          <div className="flex flex-col items-start">
            <div className="font-medium mb-1 text-green-700">Research Tool</div>
            <div className="rounded-2xl px-4 py-2 max-w-xl bg-green-50 text-gray-800 flex items-center">
              {message.text}

              {isSearching && (
                <div className="ml-2 searching-dots">
                  <span className="dot"></span>
                  <span className="dot"></span>
                  <span className="dot"></span>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }
    
    // Rendering for system messages
    if (isSystemMessage) {
      return (
        <div className="flex items-start gap-4 my-2">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-yellow-200 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-yellow-700" />
          </div>
          <div className="flex flex-col items-start">
            <div className="font-medium mb-1 text-yellow-700">System</div>
            <div className="rounded-2xl px-4 py-2 max-w-xl bg-yellow-50 text-gray-800">
              {message.text}
            </div>
          </div>
        </div>
      );
    }
    
    // Rendering for AI thinking
    if (isThinking) {
      return (
        <div className="flex items-start gap-4">
          <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200"></div>
          <div className="flex flex-col items-start">
            <div className="font-medium mb-1 flex items-center">
              <span className="mr-2">Assistant</span>
              <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Thinking</span>
            </div>
            <div className="rounded-2xl px-4 py-2 max-w-xl bg-blue-50 text-gray-800 border border-blue-100">
              {formatMessageText(message.text)}
            </div>
          </div>
        </div>
      );
    }
    
    // Rendering for final answer or normal messages
    return (
      <div className={`flex items-start gap-4 mt-12 ${isUser ? 'flex-row-reverse' : ''}`}>
        {!isUser && <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200"></div>}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          {!isUser && <div className="font-medium mb-1">
            {isAnswer ? (
              <span className="flex items-center">
                Assistant 
                {message.isActive && (
                  <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">Typing...</span>
                )}
                {!message.isActive && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Answer</span>
                )}
              </span>
            ) : (
              "Assistant"
            )}
          </div>}
          
          <div 
            ref={messageRef}
            className={`rounded-2xl px-4 py-3 max-w-xl ${
              isUser ? 'bg-blue-500 text-white' : isAnswer ? ' text-gray-800' : ' text-gray-800'
            }`}
          >
            
            {message.image && (
              <img 
                src={message.image} 
                alt="Uploaded" 
                className="max-h-60 rounded-lg mb-2"
              />
            )}
            {/* <div className="prose prose-sm">
              {formatMessageText(message.text)}
            </div> */}
             <div className="mt-1 text-sm markdown-content" style={markdownStyles}>
                        <ReactMarkdown>{message.text}</ReactMarkdown>
              </div>
            {message.isActive && (
              <span className="typing-cursor"></span>
            )}
          </div>
          
          {/* Add PowerPoint preview if this message has a PPT file */}
          {!isUser && message.metadata && message.metadata.ppt_filename && (
            <PresentationPreview filename={message.metadata.ppt_filename} />
          )}
          
          {/* PowerPoint download button - only show when message has a PPT file */}
          {!isUser && message.metadata && message.metadata.ppt_filename && (
            <div className="mt-2 mb-1">
              <a 
                href={`${API_URL}/download/presentation/${message.metadata.ppt_filename}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                download
              >
                <Download className="w-4 h-4 mr-2" />
                Download PowerPoint
              </a>
            </div>
          )}
          
          {/* Feedback buttons - only show for assistant final answer messages */}
          {!isUser && isAnswer && !message.isActive && (
            <div className="flex items-center mt-1 space-x-2 text-gray-500">
             <button 
                className={`p-1.5 rounded-full transition-all duration-200 transform ${
                  isCopied 
                    ? 'bg-green-100 text-green-600 scale-110' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={handleCopy}
                title={isCopied ? "Copied!" : "Copy to clipboard"}
              >
                {isCopied ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 6L9 17l-5-5"></path>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                  </svg>
                )}
              </button>
              <button 
                className={`p-1.5 rounded-full transition-all duration-200 transform ${
                  isLiked 
                    ? 'bg-blue-100 text-blue-600 scale-110' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={handleLike}
                title="Like"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                </svg>
              </button>
              <button 
                className={`p-1.5 rounded-full transition-all duration-200 transform ${
                  isDisliked 
                    ? 'bg-red-100 text-red-600 scale-110' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={handleDislike}
                title="Dislike"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isDisliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm10-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
                </svg>
              </button>
              <button 
                className={`p-1.5 rounded-full transition-all duration-200 transform ${
                  isReading 
                    ? 'bg-purple-100 text-purple-600 scale-110 animate-pulse' 
                    : 'hover:bg-gray-100'
                }`}
                onClick={handleReadAloud}
                title={isReading ? "Stop reading" : "Read aloud"}
              >
                {isReading ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="6" y="4" width="4" height="16"></rect>
                    <rect x="14" y="4" width="4" height="16"></rect>
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                    <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                    <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                  </svg>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison for memoization to prevent unnecessary re-renders
    
    // Always re-render if the message ID changes
    if (prevProps.message.id !== nextProps.message.id) return false;
    
    // Re-render if text changes
    if (prevProps.message.text !== nextProps.message.text) return false;
    
    // Re-render if status changes
    if (prevProps.message.status !== nextProps.message.status) return false;
    
    // Re-render if active state changes
    if (prevProps.message.isActive !== nextProps.message.isActive) return false;
    
    // Re-render if metadata changes (e.g., PowerPoint filename)
    if (JSON.stringify(prevProps.message.metadata) !== JSON.stringify(nextProps.message.metadata)) return false;
    
    // Otherwise, don't re-render
    return true;
  });

  const MessageList = memo(({ messages, isThinking, thinkingContent }) => {
    const messagesEndRef = useRef(null);
    
    // Filter out duplicate messages before rendering
    const uniqueMessages = getUniqueMessages(messages);
    
    // For debugging
    console.log('MessageList rendering with messages:', uniqueMessages);
    console.log('Thinking state:', isThinking, 'Content:', thinkingContent);
    
    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [uniqueMessages, thinkingContent]);
    
    return (
      <div className="space-y-6">
        {uniqueMessages.map((message, index) => (
          <MessageBubble key={message.id || `msg-${index}`} message={message} />
        ))}
        
        {isThinking && thinkingContent && (
          <ThinkingIndicator content={thinkingContent} />
        )}
        
        <div ref={messagesEndRef} />
      </div>
    );
  }, (prevProps, nextProps) => {
    // Only re-render if messages array changes length
    if (prevProps.messages.length !== nextProps.messages.length) return false;
    
    // Or if thinking state changes
    if (prevProps.isThinking !== nextProps.isThinking) return false;
    
    // Or if thinking content has changed substantially
    if (Math.abs((prevProps.thinkingContent?.length || 0) - 
                (nextProps.thinkingContent?.length || 0)) > 10) {
      return false;
    }
    
    // Otherwise don't re-render
    return true;
  });

  return (
    <div className="fixed inset-0 bg-white">
      <div className="flex flex-col h-full">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <h1 className="text-4xl font-semibold mb-8">What can I help with?</h1>
            <div className="w-full max-w-2xl">
              <form onSubmit={handleSubmit} className="relative">
                <div className="relative flex flex-col">
                  {selectedImage && (
                    <div className="mb-2 relative inline-block">
                      <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="max-h-40 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-70"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      className="w-full pl-4 pr-20 py-3.5 rounded-2xl border border-gray-300 shadow-sm focus:outline-none focus:border-gray-400 focus:ring-0"
                      placeholder="Ask anything"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                      <button 
                        type="button" 
                        className="p-2 hover:bg-gray-100 rounded-lg"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Plus className="w-4 h-4 text-gray-400" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                        <Search className="w-4 h-4 text-gray-400" />
                      </button>
                      <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
                        <MoreHorizontal className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
              <div className="mt-6 flex flex-col gap-4">
                <div className="flex justify-center gap-3 flex-wrap">
                  <ActionButton icon={Image} text="Create image" />
                  <ActionButton icon={FileText} text="Summarize text" />
                  <ActionButton icon={Pencil} text="Make a plan" />
                  <ActionButton icon={Lightbulb} text="Help me write" />
                  <ActionButton icon={BarChart2} text="Analyze images" />
                </div>
                <div className="flex justify-center gap-3 flex-wrap">
                  <ActionButton icon={Gift} text="Surprise me" />
                  <ActionButton icon={FileText} text="Create presentation" />
                  <ActionButton icon={Lightbulb} text="Get advice" />
                </div>
              </div>
            </div>
          </div>
        ) : (

          <div className="h-full flex flex-col">
            <div className="flex-1 overflow-y-auto min-h-0 py-6">
              <div className="max-w-3xl mx-auto px-4">
                <MessageList 
                  messages={messages}
                  isThinking={isThinking}
                  thinkingContent={thinkingContent}
                />
                <div className="h-4"></div> {/* Extra padding at the bottom */}
              </div>
            </div>

            <div className="border-t bg-white relative">
              <div className="absolute bottom-full left-0 right-0 text-center text-xs text-gray-500 py-2">
                AI can make mistakes. Verify important information.
              </div>
              <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
                <div className="relative flex flex-col p-2">
                  {selectedImage && (
                    <div className="mb-2 relative inline-block">
                      <img 
                        src={selectedImage} 
                        alt="Preview" 
                        className="max-h-40 rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => setSelectedImage(null)}
                        className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-70"
                      >
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                  <div className="relative flex items-end border border-gray-200 rounded-xl bg-white shadow-sm">
                    <div className="flex-1 relative">
                      <textarea
                        rows="1"
                        className="w-full pl-4 pr-20 py-3 max-h-48 rounded-xl focus:outline-none resize-none overflow-y-auto"
                        style={{ minHeight: '44px' }}
                        placeholder="Ask anything"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (inputValue.trim() || selectedImage) {
                              handleSubmit(e);
                            }
                          }
                        }}
                        disabled={isProcessing}
                      />
                    </div>
                    <div className="flex items-center px-2 py-2 gap-2">
                      <button 
                        type="button"
                        className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isProcessing}
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                      <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={isProcessing}
                      />
                      <button 
                        type="button"
                        className={`p-1 hover:bg-gray-100 rounded-lg relative ${isListening ? 'text-blue-500' : 'text-gray-500'}`}
                        onClick={startListening}
                        disabled={isProcessing}
                      >
                        <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
                        {isListening && (
                          <span className="absolute inset-0 border-2 border-blue-500 rounded-lg scale-50 animate-ping" />
                        )}
                      </button>
                      <button 
                        type="submit"
                        className={`p-1 hover:bg-gray-100 rounded-lg text-gray-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                        disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
                      >
                        {isProcessing ? (
                          <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M20.3 12.04l1.01 3a1 1 0 01-1.26 1.27l-3.01-1v7a1 1 0 01-1 1H7.96a1 1 0 01-1-1v-7l-3.01 1A1 1 0 012.7 15l1-3H20.3z"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgenticFramework;


  


  








// // ppt ui also
// import React, { useState, useRef, useEffect, memo } from 'react';
// import { Plus, Search, MoreHorizontal, Mic, Image, Lightbulb, Pencil, 
//   BarChart2, Gift, FileText, X, AlertTriangle, Download } from 'lucide-react';
// import axios from 'axios';
// import './agenticframework.css';

// // API base URL - update this to match your FastAPI server
// const API_URL = 'http://localhost:8000/api/agentic';

// // Add this utility function to filter duplicate messages
// const getUniqueMessages = (messages) => {
//   const uniqueMessages = [];
//   const seenIds = new Set();
  
//   for (const message of messages) {
//     if (!message.id || !seenIds.has(message.id)) {
//       if (message.id) seenIds.add(message.id);
//       uniqueMessages.push(message);
//     }
//   }
  
//   return uniqueMessages;
// };

// // Utility function to identify PowerPoint requests
// const isPowerPointRequest = (text) => {
//   const pptPatterns = [
//     /create.*ppt/i,
//     /make.*presentation/i,
//     /create.*presentation/i,
//     /make.*ppt/i,
//     /generate.*powerpoint/i,
//     /design.*slides/i
//   ];
  
//   return pptPatterns.some(pattern => pattern.test(text));
// };

// const AgenticFramework = () => {
//   // State variables
//   const [messages, setMessages] = useState([]);
//   const [inputValue, setInputValue] = useState('');
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [isListening, setIsListening] = useState(false);
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [currentConversationId, setCurrentConversationId] = useState(null);
//   const [streamingMessage, setStreamingMessage] = useState('');
//   const [toolOutput, setToolOutput] = useState(null);
//   const [pollingInterval, setPollingInterval] = useState(null);
  
//   // UI state variables for step-by-step display
//   const [isThinking, setIsThinking] = useState(false);
//   const [thinkingContent, setThinkingContent] = useState('');
//   const [toolStatus, setToolStatus] = useState(null);
  
//   // Track processed message IDs
//   const [processedMessageIds, setProcessedMessageIds] = useState(new Set());
  
//   // New state for PowerPoint generation tracking
//   const [isPptGenerating, setIsPptGenerating] = useState(false);
//   const [pptFilename, setPptFilename] = useState(null);
  
//   const fileInputRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   const handleImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (file && file.type.startsWith('image/')) {
//       const reader = new FileReader();
//       reader.onload = (e) => {
//         setSelectedImage(e.target.result);
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const startListening = () => {
//     if (isListening) return; // Prevent starting if already listening
    
//     if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
//       const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
//       const recognition = new SpeechRecognition();
      
//       recognition.continuous = false;
//       recognition.interimResults = false;
//       recognition.lang = 'en-US';
      
//       recognition.onstart = () => {
//         setIsListening(true);
//         // Stop recording after 3 seconds
//         setTimeout(() => {
//           recognition.stop();
//         }, 3000);
//       };
      
//       recognition.onresult = (event) => {
//         const transcript = event.results[0][0].transcript;
//         setInputValue(transcript);
//         // Submit the form after getting the transcript
//         setTimeout(() => {
//           const submitEvent = new Event('submit', { cancelable: true });
//           document.querySelector('form')?.dispatchEvent(submitEvent);
//         }, 100);
//       };
      
//       recognition.onerror = (event) => {
//         console.error('Speech recognition error:', event.error);
//         setIsListening(false);
//       };
      
//       recognition.onend = () => {
//         setIsListening(false);
//       };
      
//       recognition.start();
//     } else {
//       alert('Speech recognition is not supported in this browser.');
//     }
//   };

//   // Add the addMessage function here
//   const addMessage = (newMessage) => {
//     // For debugging
//     console.log('Adding/updating message:', newMessage);
    
//     setMessages(prevMessages => {
//       // Check if this message ID already exists
//       if (newMessage.id && prevMessages.some(msg => msg.id === newMessage.id)) {
//         console.log(`Message with ID ${newMessage.id} already exists, updating instead`);
//         // Update existing message (including any metadata)
//         const updatedMessages = prevMessages.map(msg => 
//           msg.id === newMessage.id ? { ...msg, ...newMessage } : msg
//         );
//         console.log('Updated messages:', updatedMessages);
//         return updatedMessages;
//       }
      
//       // Debug log for PowerPoint metadata
//       if (newMessage.metadata && newMessage.metadata.ppt_filename) {
//         console.log("PowerPoint metadata detected:", newMessage.metadata);
//         setPptFilename(newMessage.metadata.ppt_filename);
//       }
      
//       // Add new message
//       const newMessages = [...prevMessages, newMessage];
//       console.log('New messages array:', newMessages);
//       return newMessages;
//     });
//   };

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   };

//   useEffect(() => {
//     // Clear any existing messages when component first mounts
//     setMessages([]);
    
//     // Clear any existing processed IDs
//     setProcessedMessageIds(new Set());
//   }, []);

//   // Auto-scroll to bottom when messages change
//   useEffect(() => {
//     console.log('Messages changed, scrolling to bottom. Current messages:', messages);
//     scrollToBottom();
//   }, [messages, streamingMessage, isThinking, thinkingContent]);
  
//   // Cleanup polling on unmount
//   useEffect(() => {
//     return () => {
//       if (pollingInterval) {
//         clearInterval(pollingInterval);
//       }
//     };
//   }, [pollingInterval]);

//   const processStreamEvents = (events) => {
//     console.log('Processing stream events:', events);
//     console.log('Current messages state before processing:', messages);
    
//     // Process events in order to ensure proper sequencing
//     events.forEach((event) => {
//       const { event: eventType, data } = event;
//       console.log(`Event Type: ${eventType}`, data);
      
//       // Handle thinking updates (stream in real-time)
//       if (eventType === 'thinking_update') {
//         console.log('Thinking update received:', data.content);
//         setIsThinking(true);
//         setThinkingContent(data.content);
//       }
      
//       // Handle completed thinking message
//       else if (eventType === 'message_complete' && data.segment_type === 'thinking') {
//         console.log('Thinking message complete');
//         setIsThinking(false); // Turn off thinking indicator
        
//         // Update processed IDs to avoid duplication
//         setProcessedMessageIds(prev => {
//           const newSet = new Set(prev);
//           if (data.message_id) newSet.add(data.message_id);
//           return newSet;
//         });
        
//         setThinkingContent('');
//       }
      
//       // Handle tool usage start
//       else if (eventType === 'tool_usage') {
//         console.log('Tool usage start:', data.tool_name);
//         // Special handling for PowerPoint generation
//         if (data.tool_name === 'powerpoint_generator') {
//           setIsPptGenerating(true);
//         }
        
//         setToolStatus({
//           toolName: data.tool_name,
//           message: data.message,
//           messageId: data.message_id,
//           status: 'searching'
//         });
        
//         // Check if message already exists before adding
//         if (data.message_id) {
//           const messageExists = messages.some(msg => msg.id === data.message_id);
          
//           if (!messageExists) {
//             addMessage({
//               id: data.message_id,
//               text: data.message,
//               sender: 'tool',
//               status: 'searching'
//             });
            
//             // Track processed ID
//             setProcessedMessageIds(prev => {
//               const newSet = new Set(prev);
//               newSet.add(data.message_id);
//               return newSet;
//             });
//           }
//         }
//       }
      
//       // Handle tool completion - update existing message instead of creating new
//       else if (eventType === 'tool_complete') {
//         console.log('Tool completion:', data.tool_name);
//         // Special handling for PowerPoint completion
//         if (data.tool_name === 'powerpoint_generator') {
//           setIsPptGenerating(false);
//         }
        
//         setToolStatus({
//           toolName: data.tool_name,
//           message: data.message,
//           messageId: data.message_id,
//           status: 'complete'
//         });
        
//         // Update existing tool message - don't create a new one
//         addMessage({
//           id: data.message_id,
//           text: data.message,
//           status: 'complete',
//           sender: 'tool'
//         });
        
//         // Track processed ID
//         setProcessedMessageIds(prev => {
//           const newSet = new Set(prev);
//           if (data.message_id) newSet.add(data.message_id);
//           return newSet;
//         });
//       }
      
//       // Handle partial answer (paragraphs coming in sequence)
//       else if (eventType === 'partial_answer') {
//         console.log('Partial answer received:', data);
//         const isFirst = data.is_first;
//         const isLast = data.is_last;
        
//         if (data.message_id) {
//           // Skip if already processed
//           if (processedMessageIds.has(data.message_id)) {
//             console.log('Skipping already processed message ID:', data.message_id);
//             return;
//           }
          
//           // Track processed ID
//           setProcessedMessageIds(prev => {
//             const newSet = new Set(prev);
//             newSet.add(data.message_id);
//             return newSet;
//           });
          
//           if (isFirst) {
//             console.log('First part of answer, creating new message');
//             // First part - create new message
//             addMessage({
//               id: data.message_id,
//               text: data.content,
//               sender: 'ai',
//               type: 'answer',
//               isActive: true
//             });
//           } else {
//             console.log('Additional part of answer, updating existing message');
//             // Find active AI message to append to
//             const activeMessage = messages.find(msg => 
//               msg.sender === 'ai' && msg.type === 'answer' && msg.isActive
//             );

//             if (activeMessage) {
//               console.log('Found active message to update:', activeMessage);
//               addMessage({
//                 id: activeMessage.id,
//                 text: activeMessage.text + '\n\n' + data.content,
//                 sender: 'ai',
//                 type: 'answer',
//                 isActive: !isLast
//               });
//             } else {
//               console.log('No active message found, creating new one for partial answer');
//               addMessage({
//                 id: data.message_id,
//                 text: data.content,
//                 sender: 'ai',
//                 type: 'answer',
//                 isActive: !isLast
//               });
//             }
//           }
//         }
//       }
      
//       // Handle complete answer (for short, non-split answers)
//       else if (eventType === 'message_complete' && data.segment_type === 'answer') {
//         console.log('Complete message received:', data);
//         if (data.message_id) {
//           // Skip if already processed
//           if (processedMessageIds.has(data.message_id)) {
//             console.log('Skipping already processed message ID:', data.message_id);
//             return;
//           }
          
//           // Track processed ID
//           setProcessedMessageIds(prev => {
//             const newSet = new Set(prev);
//             newSet.add(data.message_id);
//             return newSet;
//           });
          
//           // Add PowerPoint metadata if available
//           if (data.ppt_filename) {
//             console.log("PowerPoint file detected in message:", data.ppt_filename);
//             setPptFilename(data.ppt_filename);
            
//             // Create/update the message with PowerPoint metadata
//             addMessage({
//               id: data.message_id,
//               text: data.content,
//               sender: 'ai',
//               type: 'answer',
//               isActive: false,
//               metadata: {
//                 ppt_filename: data.ppt_filename
//               }
//             });
//           } else {
//             // Find if there's an active AI message
//             const activeMessageIndex = messages.findIndex(msg => 
//               msg.sender === 'ai' && msg.type === 'answer' && msg.isActive
//             );
            
//             if (activeMessageIndex >= 0) {
//               console.log('Updating existing active message');
//               // Update existing message
//               addMessage({
//                 id: data.message_id,
//                 text: data.content,
//                 sender: 'ai',
//                 type: 'answer',
//                 isActive: false
//               });
//             } else {
//               console.log('Creating new message for complete answer');
//               // Create new message
//               addMessage({
//                 id: data.message_id,
//                 text: data.content,
//                 sender: 'ai',
//                 type: 'answer',
//                 isActive: false
//               });
//             }
//           }
//         }
        
//         // Clear thinking content
//         setThinkingContent('');
//       }
      
//       // Handle stream complete event
//       else if (eventType === 'stream_complete') {
//         console.log('Stream complete event:', data);
//         console.log('Messages before marking inactive:', messages);
        
//         // If we have PowerPoint filename in the completion event
//         if (data.ppt_filename) {
//           console.log("PowerPoint file in stream complete:", data.ppt_filename);
//           setPptFilename(data.ppt_filename);
          
//           // Make sure to update the message with this metadata
//           addMessage({
//             id: data.message_id,
//             text: data.content,
//             sender: 'ai',
//             type: 'answer',
//             isActive: false,
//             metadata: {
//               ppt_filename: data.ppt_filename
//             }
//           });
//         }
        
//         // Mark all active messages as inactive
//         messages.forEach(msg => {
//           if (msg.isActive) {
//             console.log('Marking message as inactive:', msg);
//             addMessage({
//               ...msg,
//               isActive: false
//             });
//           }
//         });
        
//         // Clear all streaming states
//         setIsProcessing(false);
//         setIsPptGenerating(false);
//         setToolStatus(null);
//         setIsThinking(false);
//         setThinkingContent('');
//         setStreamingMessage('');
        
//         console.log('After stream complete, thinking state is:', isThinking);
//       }
      
//       // Handle error events
//       else if (eventType === 'error') {
//         console.error('Stream error:', data);
        
//         addMessage({
//           id: `error-${Date.now()}`,
//           text: data.message || 'An error occurred',
//           sender: 'system'
//         });
        
//         setIsProcessing(false);
//         setIsPptGenerating(false);
//         setToolStatus(null);
//         setIsThinking(false);
//         setThinkingContent('');
//       }
//     });
//   };

//   const startPolling = (conversationId) => {
//     // Clear any existing polling interval
//     if (pollingInterval) {
//       clearInterval(pollingInterval);
//     }
    
//     let pollingAttempts = 0;
//     const MAX_POLLING_ATTEMPTS = 50;
    
//     // Track the last event timestamp
//     let lastEventTimestamp = Date.now();
    
//     // Flag to prevent overlapping processing
//     let isProcessingBatch = false;
    
//     const intervalId = setInterval(async () => {
//       // Skip this cycle if we're still processing
//       if (isProcessingBatch) return;
      
//       try {
//         isProcessingBatch = true;
//         pollingAttempts++;
        
//         // Stop polling after max attempts
//         if (pollingAttempts > MAX_POLLING_ATTEMPTS) {
//           clearInterval(intervalId);
//           setPollingInterval(null);
//           setIsProcessing(false);
//           isProcessingBatch = false;
//           return;
//         }
        
//         const response = await axios.get(
//           `${API_URL}/stream/${conversationId}?since=${lastEventTimestamp}`
//         );
        
//         const { events, is_active } = response.data;
        
//         // Only process if we have events
//         if (events && events.length > 0) {
//           console.log("Received events:", events);
//           // Process events
//           processStreamEvents(events);
          
//           // Only update timestamp AFTER successful processing
//           lastEventTimestamp = Date.now();
          
//           // Reset polling attempts if events received
//           pollingAttempts = 0;
//         }
        
//         // Check for stream completion
//         const isStreamComplete = events.some(event => 
//           event.event === 'stream_complete' || 
//           event.event === 'error'
//         );
        
//         // Stop polling if complete or inactive
//         if (isStreamComplete || !is_active) {
//           clearInterval(intervalId);
//           setPollingInterval(null);
//           setIsProcessing(false);
//         }
        
//         isProcessingBatch = false;
//       } catch (error) {
//         console.error('Error polling stream:', error);
//         isProcessingBatch = false;
        
//         addMessage({ 
//           id: `error-${Date.now()}`, 
//           text: 'Sorry, there was an error retrieving the response.', 
//           sender: 'system' 
//         });
//       }
//     }, 300);
    
//     setPollingInterval(intervalId);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const trimmedInput = inputValue.trim();
    
//     if (trimmedInput || selectedImage) {
//       setIsProcessing(true);
//       setStreamingMessage(''); // Clear any previous streaming message
      
//       // Reset processed IDs for a new conversation
//       setProcessedMessageIds(new Set());
      
//       // Reset PowerPoint state
//       setPptFilename(null);
//       setIsPptGenerating(false);
      
//       // Check if this is a PowerPoint request
//       const isPptRequest = isPowerPointRequest(trimmedInput);
//       if (isPptRequest) {
//         console.log("PowerPoint request detected");
//       }
      
//       // Prepare image data if exists
//       let imageData = null;
//       if (selectedImage) {
//         imageData = selectedImage;
//       }
      
//       // Add user message to UI immediately
//       addMessage({
//         id: `user-${Date.now()}`,
//         text: trimmedInput,
//         sender: 'user',
//         image: imageData
//       });
      
//       try {
//         const response = await axios.post(`${API_URL}/query`, {
//           query: trimmedInput,
//           conversation_id: currentConversationId,
//           image_url: imageData,
//           skip_greeting: true  // Add this flag to tell backend not to send greeting
//         });
        
//         console.log("Query response:", response.data);
        
//         // Update conversation ID if new
//         if (!currentConversationId) {
//           setCurrentConversationId(response.data.conversation_id);
//         }
        
//         // Start polling for streaming updates
//         startPolling(response.data.conversation_id);
//       } catch (error) {
//         // Reset processing state
//         setIsProcessing(false);
        
//         // Add error message to chat
//         addMessage({
//           id: `error-${Date.now()}`,
//           text: error.response?.data?.detail || 'Sorry, there was an error processing your request. Please try again.',
//           sender: 'system'
//         });
//       }
      
//       // Clear input
//       setInputValue('');
//       setSelectedImage(null);
//     }
//   };

//   // Add PowerPoint Preview Component
//   const PresentationPreview = memo(({ filename }) => {
//     console.log("Rendering presentation preview for:", filename);
    
//     // Simplified preview - shows placeholder slides
//     return (
//       <div className="mt-4 border border-gray-200 rounded-lg overflow-hidden">
//         <div className="bg-gray-100 p-2 border-b font-medium text-sm flex items-center">
//           <FileText className="w-4 h-4 mr-2 text-blue-600" />
//           PowerPoint Preview: {filename}
//         </div>
//         <div className="p-4 bg-white">
//           <div className="grid grid-cols-3 gap-3">
//             {[1, 2, 3].map((slideNum) => (
//               <div key={slideNum} className="aspect-video bg-gray-50 rounded border border-gray-200 flex items-center justify-center shadow-sm hover:shadow-md transition-shadow">
//                 <div className="text-center p-2">
//                   <div className="font-bold text-xs mb-1 text-gray-700">Slide {slideNum}</div>
//                   <div className="w-full h-2 bg-gray-200 rounded mb-1"></div>
//                   <div className="w-3/4 h-2 bg-gray-200 rounded mb-2"></div>
//                   <div className="w-full h-1 bg-gray-200 rounded mb-1"></div>
//                   <div className="w-full h-1 bg-gray-200 rounded mb-1"></div>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     );
//   });

//   const ActionButton = memo(({ icon: Icon, text }) => (
//     <button className="px-4 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg flex items-center gap-2 text-sm">
//       <Icon className="w-4 h-4" />
//       <span>{text}</span>
//     </button>
//   ));

//   const ThinkingIndicator = memo(({ content }) => {
//     // Find an active AI message if any
//     const activeAIMessage = messages.find(msg => 
//       msg.sender === 'ai' && msg.type === 'answer' && msg.isActive
//     );
    
//     return (
//       <div className="flex items-start gap-4 my-4">
//         <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200"></div>
//         <div className="flex flex-col items-start">
//           <div className="font-medium mb-1 flex items-center">
//             <span className="mr-2">Assistant</span>
//             <span className="text-sm text-gray-500 italic">(typing...)</span>
//           </div>
//           <div className="rounded-2xl px-4 py-2 max-w-xl bg-blue-50 text-gray-800 border border-blue-100">
//             {activeAIMessage ? (
//               <>
//                 {/* Show accumulated content first */}
//                 <div dangerouslySetInnerHTML={{ 
//                   __html: activeAIMessage.text
//                     .split('\n\n')
//                     .map(para => `<p>${para}</p>`)
//                     .join('')
//                 }} />
                
//                 {/* Show current typing content with cursor */}
//                 {content && (
//                   <p className="mt-2 new-content">
//                     {content}
//                     <span className="typing-cursor"></span>
//                   </p>
//                 )}
//               </>
//             ) : (
//               <>
//                 {/* Only show typing content if no active message */}
//                 {content}
//                 <span className="typing-cursor"></span>
//               </>
//             )}
//           </div>
//         </div>
//       </div>
//     );
//   }, (prevProps, nextProps) => {
//     // Only re-render if content changed substantially (> 5 chars)
//     return Math.abs((prevProps.content?.length || 0) - (nextProps.content?.length || 0)) < 5;
//   });

//   const MessageBubble = memo(({ message }) => {
//     const isUser = message.sender === 'user';
//     const isTool = message.sender === 'tool';
//     const isThinking = message.sender === 'ai' && message.type === 'thinking';
//     const isAnswer = message.sender === 'ai' && message.type === 'answer';
//     const isSystemMessage = message.sender === 'system';
    
//     const [isCopied, setIsCopied] = useState(false);
//     const [isLiked, setIsLiked] = useState(false);
//     const [isDisliked, setIsDisliked] = useState(false);
//     const [isReading, setIsReading] = useState(false);
    
//     // Add this ref for tracking previous content length
//     const prevTextLength = useRef(message.text?.length || 0);
//     const messageRef = useRef(null);
    
//     // Check if message contains PowerPoint metadata
//     const hasPptMetadata = message.metadata && message.metadata.ppt_filename;
    
//     // Track which parts of the message are new for animations
//     useEffect(() => {
//       if (isAnswer && message.text) {
//         // Only track if text has grown
//         if (message.text.length > prevTextLength.current && messageRef.current) {
//           // Update the reference for next comparison
//           prevTextLength.current = message.text.length;
//         }
//       }
      
//       // Debug logging for PowerPoint metadata
//       if (hasPptMetadata) {
//         console.log("Message has PowerPoint metadata:", message.metadata);
//       }
//     }, [message.text, isAnswer, hasPptMetadata]);
    
//     // Format message text to properly handle paragraphs and markdown
//     const formatMessageText = (text) => {
//       if (!text) return '';
      
//       // For debugging
//       console.log('Formatting message text:', text);
      
//       try {
//         // First handle horizontal lines
//         const processedText = text.replace(/\n---\n/g, '<hr />');
        
//         // Split paragraphs
//         const paragraphs = processedText.split('\n\n');
//         return paragraphs.map((paragraph, index) => {
//           if (!paragraph.trim()) return null;
          
//           // Determine if this paragraph might be new
//           const isNewParagraph = paragraphs.length > 1 && 
//                                index >= paragraphs.length - 2 && 
//                                message.isActive;
          
//           // Handle headings
//           if (paragraph.trim().startsWith('### ')) {
//             return (
//               <h3 
//                 key={index} 
//                 className={`${index > 0 ? "mt-3" : ""} ${isNewParagraph ? "new-content" : ""} text-lg font-bold`}
//               >
//                 {paragraph.replace(/^### /, '')}
//               </h3>
//             );
//           }
          
//           // Handle bullet points
//           if (paragraph.includes('\n- ')) {
//             const parts = paragraph.split('\n- ');
//             const title = parts[0];
//             const listItems = parts.slice(1);
            
//             return (
//               <div key={index} className={`${index > 0 ? "mt-2" : ""} ${isNewParagraph ? "new-content" : ""}`}>
//                 {title && title.trim() && <p className="mb-1">{title}</p>}
//                 <ul className="list-disc list-inside pl-2 space-y-1">
//                   {listItems.map((item, i) => (
//                     <li key={i}>{item}</li>
//                   ))}
//                 </ul>
//               </div>
//             );
//           }
          
//           // Regular paragraph
//           return (
//             <p 
//               key={index} 
//               className={`${index > 0 ? "mt-2" : ""} ${isNewParagraph ? "new-content" : ""}`}
//             >
//               {paragraph}
//             </p>
//           );
//         });
//       } catch (error) {
//         console.error('Error formatting message:', error);
//         // Fallback rendering if error occurs
//         return (
//           <div className="text-red-500">
//             <p>Error formatting message. Raw content:</p>
//             <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto text-xs">
//               {text}
//             </pre>
//           </div>
//         );
//       }
//     };
    
//     const handleCopy = () => {
//       navigator.clipboard.writeText(message.text)
//         .then(() => {
//           setIsCopied(true);
//           setTimeout(() => setIsCopied(false), 2000);
//         })
//         .catch(err => {
//           console.error('Failed to copy: ', err);
//         });
//     };
    
//     const handleLike = () => {
//       if (isDisliked) setIsDisliked(false);
//       setIsLiked(!isLiked);
//     };
    
//     const handleDislike = () => {
//       if (isLiked) setIsLiked(false);
//       setIsDisliked(!isDisliked);
//     };
    
//     const handleReadAloud = () => {
//       if ('speechSynthesis' in window) {
//         // If already reading, stop
//         if (isReading) {
//           window.speechSynthesis.cancel();
//           setIsReading(false);
//           return;
//         }
        
//         // Start reading
//         window.speechSynthesis.cancel(); // Cancel any ongoing speech
//         const utterance = new SpeechSynthesisUtterance(message.text);
//         utterance.rate = 1.0;
//         utterance.pitch = 1.0;
        
//         utterance.onend = () => {
//           setIsReading(false);
//         };
        
//         utterance.onerror = () => {
//           setIsReading(false);
//         };
        
//         setIsReading(true);
//         window.speechSynthesis.speak(utterance);
//       } else {
//         alert('Speech synthesis is not supported in this browser.');
//       }
//     };


//     // Rendering for tool status messages
//     if (isTool) {
//       const isSearching = message.status === 'searching';
      
//       return (
//         <div className="flex items-start gap-4 my-2">
//           <div className="w-8 h-8 rounded-full flex-shrink-0 bg-green-200 flex items-center justify-center">
//             <Search className="w-4 h-4 text-green-700" />
//           </div>
//           <div className="flex flex-col items-start">
//             <div className="font-medium mb-1 text-green-700">Research Tool</div>
//             <div className="rounded-2xl px-4 py-2 max-w-xl bg-green-50 text-gray-800 flex items-center">
//               {message.text}

//               {isSearching && (
//                 <div className="ml-2 searching-dots">
//                   <span className="dot"></span>
//                   <span className="dot"></span>
//                   <span className="dot"></span>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     // Rendering for system messages
//     if (isSystemMessage) {
//       return (
//         <div className="flex items-start gap-4 my-2">
//           <div className="w-8 h-8 rounded-full flex-shrink-0 bg-yellow-200 flex items-center justify-center">
//             <AlertTriangle className="w-4 h-4 text-yellow-700" />
//           </div>
//           <div className="flex flex-col items-start">
//             <div className="font-medium mb-1 text-yellow-700">System</div>
//             <div className="rounded-2xl px-4 py-2 max-w-xl bg-yellow-50 text-gray-800">
//               {message.text}
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     // Rendering for AI thinking
//     if (isThinking) {
//       return (
//         <div className="flex items-start gap-4">
//           <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200"></div>
//           <div className="flex flex-col items-start">
//             <div className="font-medium mb-1 flex items-center">
//               <span className="mr-2">Assistant</span>
//               <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">Thinking</span>
//             </div>
//             <div className="rounded-2xl px-4 py-2 max-w-xl bg-blue-50 text-gray-800 border border-blue-100">
//               {formatMessageText(message.text)}
//             </div>
//           </div>
//         </div>
//       );
//     }
    
//     // Rendering for final answer or normal messages
//     return (
//       <div className={`flex items-start gap-4 mt-8 ${isUser ? 'flex-row-reverse' : ''}`}>
//         {!isUser && <div className="w-8 h-8 rounded-full flex-shrink-0 bg-gray-200"></div>}
//         <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
//           {!isUser && <div className="font-medium mb-1">
//             {isAnswer ? (
//               <span className="flex items-center">
//                 Assistant 
//                 {message.isActive && (
//                   <span className="ml-2 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full animate-pulse">Typing...</span>
//                 )}
//                 {!message.isActive && (
//                   <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded-full">Answer</span>
//                 )}
//               </span>
//             ) : (
//               "Assistant"
//             )}
//           </div>}
//           <div 
//             ref={messageRef}
//             className={`rounded-2xl px-4 py-3 max-w-xl ${
//               isUser ? 'bg-blue-500 text-white' : isAnswer ? 'bg-gray-100 text-gray-800' : 'bg-gray-100 text-gray-800'
//             }`}
//           >
//             {message.image && (
//               <img 
//                 src={message.image} 
//                 alt="Uploaded" 
//                 className="max-h-60 rounded-lg mb-2"
//               />
//             )}
//             <div className="prose prose-sm">
//               {formatMessageText(message.text)}
//             </div>
//             {message.isActive && (
//               <span className="typing-cursor"></span>
//             )}
//           </div>
          
//           {/* Add PowerPoint preview if this message has a PPT file */}
//           {!isUser && message.metadata && message.metadata.ppt_filename && (
//             <PresentationPreview filename={message.metadata.ppt_filename} />
//           )}
          
//           {/* PowerPoint download button - only show when message has a PPT file */}
//           {!isUser && message.metadata && message.metadata.ppt_filename && (
//             <div className="mt-2 mb-1">
//               <a 
//                 href={`${API_URL}/download/presentation/${message.metadata.ppt_filename}`}
//                 target="_blank"
//                 rel="noopener noreferrer"
//                 className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//                 download
//               >
//                 <Download className="w-4 h-4 mr-2" />
//                 Download PowerPoint
//               </a>
//             </div>
//           )}
          
//           {/* Feedback buttons - only show for assistant final answer messages */}
//           {!isUser && isAnswer && !message.isActive && (
//             <div className="flex items-center mt-1 space-x-2 text-gray-500">
//              <button 
//                 className={`p-1.5 rounded-full transition-all duration-200 transform ${
//                   isCopied 
//                     ? 'bg-green-100 text-green-600 scale-110' 
//                     : 'hover:bg-gray-100'
//                 }`}
//                 onClick={handleCopy}
//                 title={isCopied ? "Copied!" : "Copy to clipboard"}
//               >
//                 {isCopied ? (
//                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <path d="M20 6L9 17l-5-5"></path>
//                   </svg>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
//                     <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
//                   </svg>
//                 )}
//               </button>
//               <button 
//                 className={`p-1.5 rounded-full transition-all duration-200 transform ${
//                   isLiked 
//                     ? 'bg-blue-100 text-blue-600 scale-110' 
//                     : 'hover:bg-gray-100'
//                 }`}
//                 onClick={handleLike}
//                 title="Like"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
//                 </svg>
//               </button>
//               <button 
//                 className={`p-1.5 rounded-full transition-all duration-200 transform ${
//                   isDisliked 
//                     ? 'bg-red-100 text-red-600 scale-110' 
//                     : 'hover:bg-gray-100'
//                 }`}
//                 onClick={handleDislike}
//                 title="Dislike"
//               >
//                 <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={isDisliked ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                   <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm10-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"></path>
//                 </svg>
//               </button>
//               <button 
//                 className={`p-1.5 rounded-full transition-all duration-200 transform ${
//                   isReading 
//                     ? 'bg-purple-100 text-purple-600 scale-110 animate-pulse' 
//                     : 'hover:bg-gray-100'
//                 }`}
//                 onClick={handleReadAloud}
//                 title={isReading ? "Stop reading" : "Read aloud"}
//               >
//                 {isReading ? (
//                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <rect x="6" y="4" width="4" height="16"></rect>
//                     <rect x="14" y="4" width="4" height="16"></rect>
//                   </svg>
//                 ) : (
//                   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                     <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
//                     <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
//                     <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
//                   </svg>
//                 )}
//               </button>
//             </div>
//           )}
//         </div>
//       </div>
//     );
//   }, (prevProps, nextProps) => {
//     // Custom comparison for memoization to prevent unnecessary re-renders
    
//     // Always re-render if the message ID changes
//     if (prevProps.message.id !== nextProps.message.id) return false;
    
//     // Re-render if text changes
//     if (prevProps.message.text !== nextProps.message.text) return false;
    
//     // Re-render if status changes
//     if (prevProps.message.status !== nextProps.message.status) return false;
    
//     // Re-render if active state changes
//     if (prevProps.message.isActive !== nextProps.message.isActive) return false;
    
//     // Re-render if metadata changes (e.g., PowerPoint filename)
//     if (JSON.stringify(prevProps.message.metadata) !== JSON.stringify(nextProps.message.metadata)) return false;
    
//     // Otherwise, don't re-render
//     return true;
//   });

//   const MessageList = memo(({ messages, isThinking, thinkingContent }) => {
//     const messagesEndRef = useRef(null);
    
//     // Filter out duplicate messages before rendering
//     const uniqueMessages = getUniqueMessages(messages);
    
//     // For debugging
//     console.log('MessageList rendering with messages:', uniqueMessages);
//     console.log('Thinking state:', isThinking, 'Content:', thinkingContent);
    
//     useEffect(() => {
//       messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//     }, [uniqueMessages, thinkingContent]);
    
//     return (
//       <div className="space-y-6">
//         {uniqueMessages.map((message, index) => (
//           <MessageBubble key={message.id || `msg-${index}`} message={message} />
//         ))}
        
//         {isThinking && thinkingContent && (
//           <ThinkingIndicator content={thinkingContent} />
//         )}
        
//         <div ref={messagesEndRef} />
//       </div>
//     );
//   }, (prevProps, nextProps) => {
//     // Only re-render if messages array changes length
//     if (prevProps.messages.length !== nextProps.messages.length) return false;
    
//     // Or if thinking state changes
//     if (prevProps.isThinking !== nextProps.isThinking) return false;
    
//     // Or if thinking content has changed substantially
//     if (Math.abs((prevProps.thinkingContent?.length || 0) - 
//                 (nextProps.thinkingContent?.length || 0)) > 10) {
//       return false;
//     }
    
//     // Otherwise don't re-render
//     return true;
//   });

//   return (
//     <div className="fixed inset-0 bg-white">
//       <div className="flex flex-col h-full">
//         {messages.length === 0 ? (
//           <div className="h-full flex flex-col items-center justify-center px-4">
//             <h1 className="text-4xl font-semibold mb-8">What can I help with?</h1>
//             <div className="w-full max-w-2xl">
//               <form onSubmit={handleSubmit} className="relative">
//                 <div className="relative flex flex-col">
//                   {selectedImage && (
//                     <div className="mb-2 relative inline-block">
//                       <img 
//                         src={selectedImage} 
//                         alt="Preview" 
//                         className="max-h-40 rounded-lg"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setSelectedImage(null)}
//                         className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-70"
//                       >
//                         <X className="w-4 h-4 text-white" />
//                       </button>
//                     </div>
//                   )}
//                   <div className="relative flex items-center">
//                     <input
//                       type="text"
//                       className="w-full pl-4 pr-20 py-3.5 rounded-2xl border border-gray-300 shadow-sm focus:outline-none focus:border-gray-400 focus:ring-0"
//                       placeholder="Ask anything"
//                       value={inputValue}
//                       onChange={(e) => setInputValue(e.target.value)}
//                     />
//                     <div className="absolute right-2 flex items-center gap-1">
//                       <button 
//                         type="button" 
//                         className="p-2 hover:bg-gray-100 rounded-lg"
//                         onClick={() => fileInputRef.current?.click()}
//                       >
//                         <Plus className="w-4 h-4 text-gray-400" />
//                       </button>
//                       <input
//                         type="file"
//                         ref={fileInputRef}
//                         className="hidden"
//                         accept="image/*"
//                         onChange={handleImageUpload}
//                       />
//                       <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
//                         <Search className="w-4 h-4 text-gray-400" />
//                       </button>
//                       <button type="button" className="p-2 hover:bg-gray-100 rounded-lg">
//                         <MoreHorizontal className="w-4 h-4 text-gray-400" />
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </form>
//               <div className="mt-6 flex flex-col gap-4">
//                 <div className="flex justify-center gap-3 flex-wrap">
//                   <ActionButton icon={Image} text="Create image" />
//                   <ActionButton icon={FileText} text="Summarize text" />
//                   <ActionButton icon={Pencil} text="Make a plan" />
//                   <ActionButton icon={Lightbulb} text="Help me write" />
//                   <ActionButton icon={BarChart2} text="Analyze images" />
//                 </div>
//                 <div className="flex justify-center gap-3 flex-wrap">
//                   <ActionButton icon={Gift} text="Surprise me" />
//                   <ActionButton icon={FileText} text="Create presentation" />
//                   <ActionButton icon={Lightbulb} text="Get advice" />
//                 </div>
//               </div>
//             </div>
//           </div>
//         ) : (

//           <div className="h-full flex flex-col">
//             <div className="flex-1 overflow-y-auto min-h-0 py-6">
//               <div className="max-w-3xl mx-auto px-4">
//                 <MessageList 
//                   messages={messages}
//                   isThinking={isThinking}
//                   thinkingContent={thinkingContent}
//                 />
//                 <div className="h-4"></div> {/* Extra padding at the bottom */}
//               </div>
//             </div>

//             <div className="border-t bg-white relative">
//               <div className="absolute bottom-full left-0 right-0 text-center text-xs text-gray-500 py-2">
//                 AI can make mistakes. Verify important information.
//               </div>
//               <form onSubmit={handleSubmit} className="max-w-3xl mx-auto relative">
//                 <div className="relative flex flex-col p-2">
//                   {selectedImage && (
//                     <div className="mb-2 relative inline-block">
//                       <img 
//                         src={selectedImage} 
//                         alt="Preview" 
//                         className="max-h-40 rounded-lg"
//                       />
//                       <button
//                         type="button"
//                         onClick={() => setSelectedImage(null)}
//                         className="absolute top-1 right-1 p-1 bg-gray-800 bg-opacity-50 rounded-full hover:bg-opacity-70"
//                       >
//                         <X className="w-4 h-4 text-white" />
//                       </button>
//                     </div>
//                   )}
//                   <div className="relative flex items-end border border-gray-200 rounded-xl bg-white shadow-sm">
//                     <div className="flex-1 relative">
//                       <textarea
//                         rows="1"
//                         className="w-full pl-4 pr-20 py-3 max-h-48 rounded-xl focus:outline-none resize-none overflow-y-auto"
//                         style={{ minHeight: '44px' }}
//                         placeholder="Ask anything"
//                         value={inputValue}
//                         onChange={(e) => setInputValue(e.target.value)}
//                         onKeyDown={(e) => {
//                           if (e.key === 'Enter' && !e.shiftKey) {
//                             e.preventDefault();
//                             if (inputValue.trim() || selectedImage) {
//                               handleSubmit(e);
//                             }
//                           }
//                         }}
//                         disabled={isProcessing}
//                       />
//                     </div>
//                     <div className="flex items-center px-2 py-2 gap-2">
//                       <button 
//                         type="button"
//                         className="p-1 hover:bg-gray-100 rounded-lg text-gray-500"
//                         onClick={() => fileInputRef.current?.click()}
//                         disabled={isProcessing}
//                       >
//                         <Plus className="w-5 h-5" />
//                       </button>
//                       <input
//                         type="file"
//                         ref={fileInputRef}
//                         className="hidden"
//                         accept="image/*"
//                         onChange={handleImageUpload}
//                         disabled={isProcessing}
//                       />
//                       <button 
//                         type="button"
//                         className={`p-1 hover:bg-gray-100 rounded-lg relative ${isListening ? 'text-blue-500' : 'text-gray-500'}`}
//                         onClick={startListening}
//                         disabled={isProcessing}
//                       >
//                         <Mic className={`w-5 h-5 ${isListening ? 'animate-pulse' : ''}`} />
//                         {isListening && (
//                           <span className="absolute inset-0 border-2 border-blue-500 rounded-lg scale-50 animate-ping" />
//                         )}
//                       </button>
//                       <button 
//                         type="submit"
//                         className={`p-1 hover:bg-gray-100 rounded-lg text-gray-500 ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
//                         disabled={(!inputValue.trim() && !selectedImage) || isProcessing}
//                       >
//                         {isProcessing ? (
//                           <svg className="animate-spin w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
//                             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
//                             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
//                           </svg>
//                         ) : (
//                           <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
//                             <path d="M20.3 12.04l1.01 3a1 1 0 01-1.26 1.27l-3.01-1v7a1 1 0 01-1 1H7.96a1 1 0 01-1-1v-7l-3.01 1A1 1 0 012.7 15l1-3H20.3z"/>
//                           </svg>
//                         )}
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//               </form>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default AgenticFramework;


  