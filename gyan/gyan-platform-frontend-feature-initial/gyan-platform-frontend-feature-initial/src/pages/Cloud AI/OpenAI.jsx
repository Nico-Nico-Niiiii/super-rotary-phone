import React, { useState, useRef, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Copy, Volume2, MessageSquare, Search, PlusCircle, MoreHorizontal, Share, ChevronDown, Mic } from 'lucide-react';

const OpenAI = () => {
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
        content: "Hey! How's it going?" 
      }]);
    }, 1000);
  };

  return (
    <div className="flex h-screen bg-white"> 
      {/* Header */}
      <div className="fixed top-0 w-full bg-white z-10 flex items-center p-2 border-b">
        <div className="flex items-center">
          <MessageSquare className="w-4 h-4 text-gray-500 mr-1" />
          <div className="font-medium text-sm">ChatGPT 4o</div>
          <ChevronDown className="w-3 h-3 ml-1 text-gray-500" />
        </div>
        <div className="ml-auto">
          <Share className="w-4 h-4 text-gray-500" />
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col pt-12 pb-16"> {/* Reduced pb-20 to pb-16 */}
        {/* Chat area */}
        <div className="flex-1 overflow-auto flex flex-col p-3">
          {isFirstMessage ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <h1 className="text-xl font-semibold mb-3">What can I help with?</h1> {/* Reduced mb-4 to mb-3 */}
              {/* Input box in center for initial state */}
              <div className="w-full max-w-2xl px-4">
                <form onSubmit={handleSubmit} className="flex items-center relative">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="Ask anything"
                      className="w-full p-3 pl-12 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm"
                    />
                    <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                      <PlusCircle className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  
                  <button
                    type="submit"
                    className="ml-2 bg-black text-white rounded-full p-2"
                    disabled={!inputValue.trim()}
                  >
                    <Mic className="w-5 h-5" />
                  </button>
                </form>
              </div>
            </div>
          ) : (
            <div className="w-full">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={`mb-5 ${message.role === 'user' ? 'text-right' : 'text-left'}`} 
                >
                  {message.role === 'user' ? (
                    <div className="inline-block bg-gray-100 px-4 py-2 rounded-lg max-w-md text-sm mr-2">
                      {message.content}
                    </div>
                  ) : (
                    <div>
                      <div className="inline-block px-4 py-2 max-w-md text-sm text-left">
                        {message.content}
                      </div>
                      
                      <div className="flex mt-1 space-x-3">
                        <button className="text-gray-500 hover:text-gray-700">
                          <Copy className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <ThumbsUp className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <ThumbsDown className="w-4 h-4" />
                        </button>
                        <button className="text-gray-500 hover:text-gray-700">
                          <Volume2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>
        
        {/* Input area - fixed at bottom - only shown when not in first message mode */}
        {!isFirstMessage && (
          <div className="fixed bottom-0 left-0 right-0 p-3 bg-white border-t"> {/* Reduced p-4 to p-3 */}
            <form onSubmit={handleSubmit} className="flex items-center relative max-w-3xl mx-auto">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ask anything"
                  className="w-full p-3 pl-12 pr-10 rounded-xl border border-gray-300 focus:outline-none focus:ring-1 focus:ring-gray-300 text-sm"
                />
                <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                  <PlusCircle className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              
              <button
                type="submit"
                className="ml-2 bg-black text-white rounded-full p-2"
                disabled={!inputValue.trim()}
              >
                <Mic className="w-5 h-5" />
              </button>
            </form>
            
            <div className="text-center text-xs text-gray-500 mt-1 max-w-3xl mx-auto"> {/* Reduced mt-2 to mt-1 */}
              Gyan can make mistakes. Check important info.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OpenAI;