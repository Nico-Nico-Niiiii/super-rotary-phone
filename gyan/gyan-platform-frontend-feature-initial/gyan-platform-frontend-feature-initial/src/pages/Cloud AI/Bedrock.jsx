import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Volume2, MessageSquare, Search, PlusCircle, MoreHorizontal, Share, ChevronDown, Mic } from 'lucide-react';

const Bedrock = () => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isFirstMessage, setIsFirstMessage] = useState(true);
  const messagesEndRef = useRef(null);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() === '') return;
    
    // Add user message
    const newMessages = [...messages, { role: 'user', content: inputValue }];
    setMessages(newMessages);
    setInputValue('');
    setIsFirstMessage(false);
    
    // Simulate AI response after a short delay
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: "I'm feeling great! Thanks for asking. How about you?" 
      }]);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="flex items-center p-3 border-b">
        <div className="flex-1 flex items-center">
          <MessageSquare className="w-5 h-5 text-gray-500 mr-2" />
          <div className="font-medium">ChatGPT 4o</div>
          <ChevronDown className="w-4 h-4 ml-1 text-gray-500" />
        </div>
        <div>
          {!isFirstMessage && <Share className="w-5 h-5 text-gray-500 mr-2" />}
          <span className="text-gray-700 text-sm">User</span>
        </div>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 overflow-auto">
        {isFirstMessage ? (
          <div className="flex flex-col items-center justify-center h-full">
            <h1 className="text-3xl font-semibold mb-8">What can I help with?</h1>
            <div className="w-full max-w-md px-4">
              <div className="rounded-md border p-1 flex items-center">
                <div className="px-3 py-2 text-gray-500">Ask anything</div>
                <div className="flex-grow"></div>
                <Mic className="w-5 h-5 text-gray-700 mr-2" />
              </div>
              
              <div className="flex mt-5 space-x-2 justify-center">
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2">
                  <PlusCircle className="w-4 h-4" />
                  <span></span>
                </button>
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2">
                  <Search className="w-4 h-4" />
                  <span>Search</span>
                </button>
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2">
                  <span>Deep research</span>
                </button>
                <button className="flex items-center space-x-2 bg-gray-100 hover:bg-gray-200 rounded-md px-3 py-2">
                  <MoreHorizontal className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4">
            {messages.map((message, index) => (
              <div 
                key={index} 
                className={`mb-6 ${message.role === 'user' ? 'text-right' : 'text-left'}`}
              >
                <div 
                  className={`inline-block px-4 py-2 rounded-lg max-w-md ${
                    message.role === 'user' 
                      ? 'bg-gray-100 rounded-tr-none' 
                      : 'bg-white border'
                  }`}
                >
                  {message.content}
                </div>
                
                {message.role === 'assistant' && (
                  <div className="flex mt-2 space-x-2">
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <ThumbsUp className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <ThumbsDown className="w-4 h-4" />
                    </button>
                    <button className="p-1 text-gray-500 hover:bg-gray-100 rounded">
                      <Volume2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      {/* Input area */}
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex items-center relative">
          <div className="relative flex-1">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask anything"
              className="w-full p-3 pl-10 pr-10 rounded-md border focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <PlusCircle className="w-5 h-5 text-gray-400" />
            </div>
          </div>
          
          <div className="absolute right-3 flex space-x-2">
            <button type="button" className="text-gray-400">
              <Search className="w-5 h-5" />
            </button>
            <button type="button" className="text-gray-400">
              <span className="text-sm">Deep research</span>
            </button>
            <button type="button" className="text-gray-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>
          
          <button
            type="submit"
            className="ml-2 bg-black text-white rounded-full p-2"
            disabled={!inputValue.trim()}
          >
            <Mic className="w-5 h-5" />
          </button>
        </form>
        
        <div className="text-center text-xs text-gray-500 mt-2">
          ChatGPT can make mistakes. Check important info.
        </div>
      </div>
    </div>
  );
};

export default Bedrock;