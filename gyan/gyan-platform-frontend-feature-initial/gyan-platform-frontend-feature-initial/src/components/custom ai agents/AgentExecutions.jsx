import React, { useState, useEffect, useRef } from 'react';
import { Send, User, Bot, Copy, Check, Clock, RefreshCw, X, Trash } from 'lucide-react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
const BASE_URL = import.meta.env.VITE_APP_API_URL;
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const AgentExecutions = ({ agentProId }) => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoadingExecution, setIsLoadingExecution] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [executionId, setExecutionId] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const chatEndRef = useRef(null);


  const markdownStyles = {
    '& h1, & h2, & h3, & h4, & h5, & h6': {
      fontWeight: 'bold',
      marginTop: '1em',
      marginBottom: '0.5em'
    },
    '& p': {
      marginBottom: '0.75em'
    },
    '& ul, & ol': {
      paddingLeft: '1.5em',
      marginBottom: '0.75em'
    },
    '& li': {
      marginBottom: '0.25em'
    },
    '& strong': {
      fontWeight: 'bold'
    },
    '& em': {
      fontStyle: 'italic'
    },
    '& code': {
      fontFamily: 'monospace',
      backgroundColor: '#f0f0f0',
      padding: '0.2em 0.4em',
      borderRadius: '3px',
      fontSize: '85%'
    }
  }

  // Fetch execution history on mount
  useEffect(() => {
    if (agentProId) {
      fetchExecutionHistory();
    }
  }, [agentProId]);

  // Auto-scroll chat
  useEffect(() => {
    if (messages.length > 0) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Fetch past execution history from the backend
  const fetchExecutionHistory = async () => {
    try {
      const response = await api.get(`/api/agent-workflows/executions/history`);
      setExecutionHistory(response.data);
    } catch (error) {
      console.error('Error fetching execution history:', error);
    }
  };

  // Start a new execution session
  // const handleNewExecution = async () => {
  //   if (!agentProId) {
  //     console.error("Agent Pro ID is missing");
  //     return;
  //   }

  //   try {
  //     setIsLoadingExecution(true);
  //     const response = await api.post(`/api/agent-workflows/executions/start`, { agent_pro_id: agentProId });
  //     setExecutionId(response.data.execution_id);
  //     setMessages([]);
  //     console.log("New Execution Started:", response.data.execution_id);
  //   } catch (error) {
  //     console.error("Error starting execution:", error);
  //   } finally {
  //     setIsLoadingExecution(false);
  //   }
  // };

  
  const handleDeleteExecution = async (executionId) => {
    if (!executionId) return;
  
    try {
      await api.delete(`/api/agent-workflows/executions/${executionId}`);
      setExecutionHistory(prev => prev.filter(execution => execution.execution_id !== executionId));
      if (executionId === executionId) {
        setExecutionId(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('Error deleting execution:', error);
    }
  };

  const handleNewExecution = async () => {
    if (!agentProId) {
      console.error("Agent Pro ID is missing");
      return;
    }
  
    try {
      setIsLoadingExecution(true);
      const response = await api.post(`/api/agent-workflows/executions/start`, { agent_pro_id: agentProId });
  
      const newExecutionId = response.data.execution_id;
      setExecutionId(newExecutionId);
      setMessages([]);
  
      console.log("New Execution Started:", newExecutionId);
  
      // Fetch updated execution history and select the new execution
      await fetchExecutionHistory();
      setTimeout(() => {
        setExecutionId(newExecutionId); // Ensure the new execution is selected
      }, 100);
    } catch (error) {
      console.error("Error starting execution:", error);
    } finally {
      setIsLoadingExecution(false);
    }
  };
  


  const handleExecuteWorkflow = async () => {
        if (!agentProId) {
          console.error("Agent Pro ID is missing");
          return;
        }
      
        try {
          setIsLoading(true);
      
          // Add system message for better UX
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now().toString(),
              sender: 'system',
              content: "Executing workflow, please wait...",
              timestamp: new Date().toISOString(),
            }
          ]);
      
          // Call API
          const response = await api.post(`/api/agent-workflows/execute`, {
            agent_pro_id: agentProId,
          });
      
          console.log("Execution Result:", response.data);
      
          // Add agent response to chat
          setMessages(prev => [
            ...prev,
            { 
              id: Date.now().toString(),
              sender: 'assistant',
              content: response.data.result.raw || "Workflow executed successfully.",
              timestamp: new Date().toISOString(),
            }
          ]);
      
        } catch (error) {
          console.error("Error executing workflow:", error);
          setMessages(prev => [
            ...prev, 
            { 
              id: Date.now().toString(),
              sender: 'system',
              content: "Execution failed. Please try again.",
              timestamp: new Date().toISOString(),
            }
          ]);
        } finally {
          setIsLoading(false);
        }
      };

  // Send message and execute workflow
  const handleSendMessage = async () => {
    if (!input.trim() || !executionId) return;

    const userMessage = {
      id: Date.now().toString(),
      sender: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await api.post(`/api/agent-workflows/executions/${executionId}/send-message`, {
        
        execution_id: executionId,
        agent_pro_id: agentProId,
        message: input
        
      });

      console.log("Response from send message", response.data);

      let final_content = response.data.response || "";
      final_content = final_content.trim().replace(/\r?\n+/g, '\n');
      

      // Append agent response
      const agentMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'agent',
        content: final_content,
        timestamp: new Date().toISOString()
      };

      setMessages(prev => [...prev, agentMessage]);
      setMessages([...messages, agentMessage]);

      // setTimeout(() => {
      //   chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      // }, 100);

    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        sender: 'system',
        content: 'There was an error processing your request.',
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load a past execution's messages
  const loadExecution = async (executionId) => {
    try {
      const response = await api.get(`/api/agent-workflows/executions/${executionId}/history`);
      console.log("Response from loadExecution", response.data);
      
      setExecutionId(executionId);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Error loading execution:', error);
    }
  };

  // Format timestamps
  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="flex h-full overflow-hidden">
      {/* Execution History Sidebar */}
      <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-medium">Execution History</h2>
          <p className="text-sm text-gray-500 mt-1">Agent ID: {agentProId || 'Unknown'}</p>
        </div>

        <div className="p-4">
          <button 
            className="w-full py-2 px-4 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={handleNewExecution}
            disabled={isLoadingExecution}
          >
            {isLoadingExecution ? "Starting..." : "New Execution"}
          </button>

          <button 
    className="w-full py-2 px-4 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 mt-2"
    onClick={handleExecuteWorkflow}
    disabled={isLoading}
  >
    {isLoading ? "Executing..." : "Execute Workflow"}
  </button>
        </div>

        <div className="p-4 space-y-2">
          {executionHistory.map(execution => (
            <div 
              key={execution.execution_id}
              className={`p-3 border rounded-md cursor-pointer hover:bg-gray-100 ${
                executionId === execution.execution_id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
              }`}
              onClick={() => loadExecution(execution.execution_id)}
            >
              <div className="flex justify-between items-center">
                <span className="text-xs font-medium">Execution #{execution.execution_id}</span>
                <span className={`text-xs px-2 py-0.5 rounded ${
                  execution.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {execution.status}
                </span>
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {formatDate(execution.timestamp)}
                <button
        onClick={() => handleDeleteExecution(execution.execution_id)}
        className="text-red-500 hover:text-red-700"
      >
        <Trash size={12} />
      </button>
              </div>
              
            </div>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-500">
              <Bot size={48} className="mb-4" />
              <h3 className="text-lg font-medium mb-2">No Messages</h3>
              <p className="text-sm text-center max-w-md">
                Start a new conversation with the agent or select an execution from history.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map(message => (
                <div key={message.id} className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {message.sender === 'user' ? <User size={16} className="text-blue-500" /> : <Bot size={16} className="text-green-500" />}
                  </div>
                  <div className="flex-1">
                    <span className="font-medium text-sm whitespace-pre-line">{message.sender === 'user' ? 'You' : 'Agent'}</span>
                    <span className="text-xs text-gray-400 ml-2">{formatTimestamp(message.timestamp)}</span>
                    {/* <div className="mt-1 text-sm">{message.content}</div> */}
                    <div className="mt-1 text-sm markdown-content" style={markdownStyles}>
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Chat Input */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2 border rounded-md"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              disabled={isLoading}
            />
            <button className="p-2 bg-blue-500 text-white rounded hover:bg-blue-600" onClick={handleSendMessage} disabled={!input.trim() || isLoading}>
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AgentExecutions;
















// import React, { useState, useEffect, useRef } from 'react';
// import { Send, User, Bot, Copy, Check, Clock, RefreshCw } from 'lucide-react';
// import axios from 'axios';
// const BASE_URL = import.meta.env.VITE_APP_API_URL
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// const AgentExecutions = ({ agentProId }) => {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [copied, setCopied] = useState(false);
//   const [executionId, setExecutionId] = useState(null);
//   const [executionHistory, setExecutionHistory] = useState([]);
//   const chatEndRef = useRef(null);

//   // Mock responses for demo purposes
//   const mockResponses = [
//     "I've analyzed the data you provided and found several interesting patterns.",
//     "Based on the information, I'd recommend focusing on the key areas highlighted in the report.",
//     "After searching the web, I found some relevant resources that might help with your question.",
//     "I've executed the query and retrieved the results. There are 27 matching records that meet your criteria.",
//     "The calculation has been completed. The estimated ROI for this project would be approximately 15.8% over 3 years."
//   ];

//   useEffect(() => {
//     // Load execution history when component mounts
//     if (agentProId) {
//       fetchExecutionHistory();
//     }
//   }, [agentProId]);

//   useEffect(() => {
//     // Scroll to bottom whenever messages change
//     chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);




//   const handleExecuteWorkflow = async () => {
//     if (!agentProId) {
//       console.error("Agent Pro ID is missing");
//       return;
//     }
  
//     try {
//       setIsLoading(true);
  
//       // Add system message for better UX
//       setMessages(prev => [
//         ...prev, 
//         { 
//           id: Date.now().toString(),
//           role: 'system',
//           content: "Executing workflow, please wait...",
//           timestamp: new Date().toISOString(),
//         }
//       ]);
  
//       // Call API
//       const response = await api.post(`/api/agent-workflows/execute`, {
//         agent_pro_id: agentProId,
//       });
  
//       console.log("Execution Result:", response.data);
  
//       // Add agent response to chat
//       setMessages(prev => [
//         ...prev,
//         { 
//           id: Date.now().toString(),
//           role: 'assistant',
//           content: response.data.result.raw || "Workflow executed successfully.",
//           timestamp: new Date().toISOString(),
//         }
//       ]);
  
//     } catch (error) {
//       console.error("Error executing workflow:", error);
//       setMessages(prev => [
//         ...prev, 
//         { 
//           id: Date.now().toString(),
//           role: 'system',
//           content: "Execution failed. Please try again.",
//           timestamp: new Date().toISOString(),
//         }
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };
  


//   const fetchExecutionHistory = async () => {
//     // Mock API call to fetch execution history
//     try {
//       // In a real app, you'd fetch from your API
//       // const response = await axios.get(`/api/agent-executions/${agentProId}/history`);
//       // setExecutionHistory(response.data);
      
//       // Mock execution history
//       const mockHistory = [
//         { id: '1', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'completed', messageCount: 4 },
//         { id: '2', timestamp: new Date(Date.now() - 86400000).toISOString(), status: 'completed', messageCount: 7 },
//         { id: '3', timestamp: new Date(Date.now() - 172800000).toISOString(), status: 'failed', messageCount: 2 }
//       ];
//       setExecutionHistory(mockHistory);
//     } catch (error) {
//       console.error('Error fetching execution history:', error);
//     }
//   };

//   const handleSend = async () => {
//     if (!input.trim()) return;
    
//     // Add user message
//     const userMessage = {
//       id: Date.now().toString(),
//       role: 'user',
//       content: input,
//       timestamp: new Date().toISOString()
//     };
    
//     setMessages(prev => [...prev, userMessage]);
//     setInput('');
//     setIsLoading(true);
    
//     try {
//       // Mock API call to send message to agent
//       // In a real app, you'd send to your API
//       // const response = await axios.post(`/api/agent-executions/${agentProId}/message`, {
//       //   message: input
//       // });
      
//       // Create a random execution ID if none exists
//       if (!executionId) {
//         setExecutionId(`exec-${Date.now()}`);
//       }
      
//       // Simulate API delay
//       await new Promise(resolve => setTimeout(resolve, 1500));
      
//       // Get a random mock response
//       const responseText = mockResponses[Math.floor(Math.random() * mockResponses.length)];
      
//       // Add agent response
//       const agentMessage = {
//         id: (Date.now() + 1).toString(),
//         role: 'assistant',
//         content: responseText,
//         timestamp: new Date().toISOString()
//       };
      
//       setMessages(prev => [...prev, agentMessage]);
//     } catch (error) {
//       console.error('Error sending message:', error);
//       // Add error message
//       setMessages(prev => [...prev, {
//         id: (Date.now() + 1).toString(),
//         role: 'system',
//         content: 'There was an error processing your request.',
//         timestamp: new Date().toISOString()
//       }]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const handleNewChat = () => {


//     setMessages([]);
//     setExecutionId(null);
//   };

//   const formatTimestamp = (timestamp) => {
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   const formatDate = (timestamp) => {
//     const date = new Date(timestamp);
//     return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
//   };

//   const copyToClipboard = (text) => {
//     navigator.clipboard.writeText(text);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const loadExecution = (executionId) => {
//     // Mock loading an execution
//     const mockMessages = [
//       {
//         id: '1',
//         role: 'user',
//         content: 'How can I improve customer retention?',
//         timestamp: new Date(Date.now() - 3500000).toISOString()
//       },
//       {
//         id: '2',
//         role: 'assistant',
//         content: mockResponses[0],
//         timestamp: new Date(Date.now() - 3400000).toISOString()
//       }
//     ];
    
//     setMessages(mockMessages);
//     setExecutionId(executionId);
//   };

//   return (
//     <div className="flex h-full overflow-hidden">
//       {/* Execution History Sidebar */}
//       <div className="w-64 border-r border-gray-200 overflow-y-auto bg-gray-50">
//         <div className="p-4 border-b border-gray-200">
//           <h2 className="text-lg font-medium">Execution History</h2>
//           <p className="text-sm text-gray-500 mt-1">Agent ID: {agentProId || 'Unknown'}</p>
//         </div>
        
//         <div className="p-4">
//           <button 
//             className="w-full py-2 px-4 bg-blue-500 text-white rounded flex items-center justify-center hover:bg-blue-600"
//             onClick={handleNewChat}
//           >
//             New Execution
//           </button>
//           <button 
//     className="w-full py-2 px-4 bg-green-500 text-white rounded flex items-center justify-center hover:bg-green-600 mt-2"
//     onClick={handleExecuteWorkflow}
//     disabled={isLoading}
//   >
//     {isLoading ? "Executing..." : "Execute Workflow"}
//   </button>
//         </div>
        
//         <div className="p-4 space-y-2">
//           {executionHistory.map(execution => (
//             <div 
//               key={execution.id}
//               className={`p-3 border rounded-md cursor-pointer hover:bg-gray-100 ${
//                 executionId === execution.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
//               }`}
//               onClick={() => loadExecution(execution.id)}
//             >
//               <div className="flex justify-between items-center">
//                 <span className="text-xs font-medium">Execution #{execution.id}</span>
//                 <span className={`text-xs px-2 py-0.5 rounded ${
//                   execution.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
//                 }`}>
//                   {execution.status}
//                 </span>
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {formatDate(execution.timestamp)}
//               </div>
//               <div className="text-xs text-gray-500 mt-1">
//                 {execution.messageCount} messages
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
      
//       {/* Chat Area */}
//       <div className="flex-1 flex flex-col h-full overflow-hidden">
//         {/* Chat Messages */}
//         <div className="flex-1 overflow-y-auto p-4">
//           {messages.length === 0 ? (
//             <div className="h-full flex flex-col items-center justify-center text-gray-500">
//               <Bot size={48} className="mb-4" />
//               <h3 className="text-lg font-medium mb-2">No Messages</h3>
//               <p className="text-sm text-center max-w-md">
//                 Start a new conversation with the agent or select an execution from history.
//               </p>
//             </div>
//           ) : (
//             <div className="space-y-4">
//               {messages.map(message => (
//                 <div key={message.id} className="flex items-start gap-3">
//                   <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                     message.role === 'user' ? 'bg-blue-100' : message.role === 'assistant' ? 'bg-green-100' : 'bg-gray-100'
//                   }`}>
//                     {message.role === 'user' ? (
//                       <User size={16} className="text-blue-500" />
//                     ) : message.role === 'assistant' ? (
//                       <Bot size={16} className="text-green-500" />
//                     ) : (
//                       <RefreshCw size={16} className="text-gray-500" />
//                     )}
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2">
//                       <span className="font-medium text-sm">
//                         {message.role === 'user' ? 'You' : message.role === 'assistant' ? 'Agent' : 'System'}
//                       </span>
//                       <span className="text-xs text-gray-400">
//                         {formatTimestamp(message.timestamp)}
//                       </span>
//                     </div>
//                     <div className="mt-1 text-sm whitespace-pre-wrap">{message.content}</div>
//                     {message.role === 'assistant' && (
//                       <div className="mt-2">
//                         <button 
//                           className="text-xs text-gray-500 flex items-center gap-1 hover:text-gray-700"
//                           onClick={() => copyToClipboard(message.content)}
//                         >
//                           {copied ? <Check size={12} /> : <Copy size={12} />}
//                           {copied ? 'Copied' : 'Copy'}
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
//               ))}
//               {isLoading && (
//                 <div className="flex items-start gap-3">
//                   <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
//                     <Bot size={16} className="text-green-500" />
//                   </div>
//                   <div className="flex-1">
//                     <div className="flex items-center gap-2">
//                       <span className="font-medium text-sm">Agent</span>
//                       <span className="text-xs text-gray-400 flex items-center gap-1">
//                         <Clock size={12} />
//                         Thinking...
//                       </span>
//                     </div>
//                     <div className="mt-2 flex space-x-1">
//                       <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
//                       <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
//                       <div className="w-2 h-2 bg-gray-300 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
//                     </div>
//                   </div>
//                 </div>
//               )}
//               <div ref={chatEndRef} />
//             </div>
//           )}
//         </div>
        
//         {/* Chat Input */}
//         <div className="p-4 border-t border-gray-200">
//           <div className="flex items-center gap-2">
//             <input
//               type="text"
//               value={input}
//               onChange={(e) => setInput(e.target.value)}
//               placeholder="Type your message..."
//               className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
//               onKeyDown={(e) => e.key === 'Enter' && handleSend()}
//               disabled={isLoading}
//             />
//             <button
//               className="p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300"
//               onClick={handleSend}
//               disabled={!input.trim() || isLoading}
//             >
//               <Send size={18} />
//             </button>
//           </div>
//           <div className="text-xs text-gray-500 mt-2">
//             {executionId ? (
//               <span>Execution ID: {executionId}</span>
//             ) : (
//               <span>Starting a new execution</span>
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AgentExecutions;