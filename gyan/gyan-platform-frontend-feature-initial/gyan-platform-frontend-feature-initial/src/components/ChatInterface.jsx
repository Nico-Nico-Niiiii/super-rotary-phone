

// import React, { useState, useRef, useEffect } from 'react';
// import {   
//   PlayCircle, ArrowUp, BarChart2, Database, MessageSquarePlus, RotateCcw,
//   ChevronDown, ChevronUp, Send, Paperclip, Image as ImageIcon, Search, Mic, Plus, History,
//   Star, Edit, Check, X
//  } from 'lucide-react';
// import axios from 'axios';





// // Rating Modal Component
// const RatingModal = ({ isOpen, onClose, onSave, initialRating = 0 }) => {
//   const [rating, setRating] = useState(initialRating);
  
//   if (!isOpen) return null;
  
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[750px] max-w-[90vw]">
//         <div className="flex justify-between items-center mb-5">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Response</h3>
//           <button 
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
//           >
//             ✕
//           </button>
//         </div>
        
//         <div className="flex justify-center space-x-3 mb-6">
//           {[...Array(10)].map((_, index) => (
//             <button
//               key={index}
//               onClick={() => setRating(index + 1)}
//               className="focus:outline-none"
//             >
//               <Star
//                 size={22}
//                 className={`${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} 
//                   transition-colors hover:text-yellow-400`}
//               />
//             </button>
//           ))}
//         </div>
        
//         <div className="text-center mb-5">
//           <span className="text-lg font-medium">{rating}/10</span>
//         </div>
        
//         <div className="flex justify-end gap-3">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={() => {
//               onSave(rating);
//               onClose();
//             }}
//             className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//           >
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };



// const PromptSuggestions = ({ onSelect, onClose,selectedPrompt }) => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [sections, setSections] = useState([]);
//   const [prompts, setPrompts] = useState([]);
  
//   useEffect(() => {
//     const fetchPrompts = async () => {
//       try {
//         // If a prompt library is already selected, fetch its prompts
//         if (selectedPrompt) {
//           const response = await api.get(`${endpoints.prompts.prefix}/list`);
//           const libraryPrompts = response.data.filter(
//             item => item.prompt_library_name === selectedPrompt
//           );
//           setSections([...new Set(libraryPrompts.map(item => item.prompt_subsection_name))]);
//           setPrompts(libraryPrompts);
//         } else {
//           // Use mock prompts if no library is selected
//           const mockPrompts = [
//             { prompt: "Write a to-do list for a personal project", prompt_subsection_name: "General" },
//             { prompt: "Generate an email to reply to a job offer", prompt_subsection_name: "Email" },
//             { prompt: "Summarize this article or text in one paragraph", prompt_subsection_name: "Content" },
//             { prompt: "How does AI work in a technical capacity", prompt_subsection_name: "Technical" },
//             { prompt: "Create a marketing strategy for a new product", prompt_subsection_name: "Business" },
//           ];
//           setSections([...new Set(mockPrompts.map(item => item.prompt_subsection_name))]);
//           setPrompts(mockPrompts);
//         }
//       } catch (error) {
//         console.error("Error fetching prompts:", error);
//         // Fallback to mock prompts on error
//         const mockPrompts = [
//           { prompt: "Write a to-do list for a personal project", prompt_subsection_name: "General" },
//           { prompt: "Generate an email to reply to a job offer", prompt_subsection_name: "Email" },
//           { prompt: "Summarize this article or text in one paragraph", prompt_subsection_name: "Content" },
//         ];
//         setSections([...new Set(mockPrompts.map(item => item.prompt_subsection_name))]);
//         setPrompts(mockPrompts);
//       }
//     };

//     fetchPrompts();
//   }, [selectedPrompt]);
  
//   return (
//     <div className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-2">
//       {/* Search input */}
//       <div className="p-3 border-b border-gray-200 dark:border-gray-700">
//         <div className="relative">
//           <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
//           <input
//             type="text"
//             placeholder="Search prompts..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-8 pr-2 py-1 text-sm rounded-md"
//           />
//         </div>
        
//         {selectedPrompt && (
//           <div className="mt-2 flex items-center justify-between">
//             <span className="text-xs text-gray-500">Using: {selectedPrompt}</span>
//             <button 
//               onClick={() => setShowPromptPopup(true)}
//               className="text-xs text-blue-500 hover:text-blue-600"
//             >
//               Change
//             </button>
//           </div>
//         )}
//       </div>
   
//       <div className="max-h-64 overflow-y-auto">
//         {sections
//           .filter(section => section.toLowerCase().includes(searchQuery.toLowerCase()))
//           .map((section) => (
//             <div key={section} className="p-2">
//               <div className="text-sm font-medium p-2 bg-gray-50 dark:bg-gray-700/50">
//                 {section}
//               </div>
//               {prompts
//                 .filter(p => p.prompt_subsection_name === section &&
//                   p.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
//                 .map((prompt) => (
//                   <button
//                     key={prompt.prompt}
//                     onClick={() => onSelect(prompt.prompt)}
//                     className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
//                   >
//                     <div className="text-xs">{prompt.prompt}</div>
//                     {prompt.prompt_description && (
//                       <div className="text-xs text-gray-500">{prompt.prompt_description}</div>
//                     )}
//                   </button>
//                 ))}
//             </div>
//           ))}
          
//         {sections.length === 0 && (
//           <div className="p-4 text-center text-gray-500">
//             No prompts found. Try a different search or select a prompt library.
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };


// const ChatInterface = ({ selectedModel }) => {
//   const [input, setInput] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [recognition, setRecognition] = useState(null);
//   const inputRef = useRef(null);
//   const [charCount, setCharCount] = useState(0);


//   useEffect(() => {
//     setMessages([]);
//     setInput('');
//     setCharCount(0);
//     setShowPromptSuggestions(false);
//     if (isListening) {
//       recognition?.stop();
//       setIsListening(false);
//     }
//   }, [selectedModel]);

//   useEffect(() => {
//     if ('webkitSpeechRecognition' in window) {
//       const recognition = new webkitSpeechRecognition();
//       recognition.continuous = true;
//       recognition.interimResults = true;
      
//       recognition.onresult = (event) => {
//         const transcript = Array.from(event.results)
//           .map(result => result[0])
//           .map(result => result.transcript)
//           .join('');
        
//         setInput(transcript);
//         setCharCount(transcript.length);
//       };

//       recognition.onerror = (event) => {
//         console.error('Speech recognition error:', event.error);
//         setIsListening(false);
//       };

//       recognition.onend = () => {
//         setIsListening(false);
//       };

//       setRecognition(recognition);
//     }
//   }, []);

//   const toggleListening = () => {
//     if (!recognition) return;

//     if (isListening) {
//       recognition.stop();
//       setIsListening(false);
//     } else {
//       recognition.start();
//       setIsListening(true);
//     }
//   };

//   const handleInputChange = (e) => {
//     const value = e.target.value;
//     setInput(value);
//     setCharCount(value.length);
    
//     if (value.toLowerCase() === '/prompt') {
//       setShowPromptSuggestions(true);
//     } else if (!value.toLowerCase().startsWith('/prompt')) {
//       setShowPromptSuggestions(false);
//     }
//   };

//   const handleClickOutside = (e) => {
//     if (!e.target.closest('.prompt-suggestions') && !e.target.closest('.chat-input')) {
//       setShowPromptSuggestions(false);
//     }
//   };

//   useEffect(() => {
//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   const handlePromptSelect = (promptText) => {
//     setInput(promptText);
//     setCharCount(promptText.length);
//     setShowPromptSuggestions(false);
//     inputRef.current?.focus();
//   };

//   const handleSendMessage = async () => {
//     if (!input.trim()) return;

//     // Add user message to chat
//     setMessages([...messages, { type: 'user', content: input }]);
//     setInput('');
//     setCharCount(0);

//     try {
//       // Send the message to the backend API
//       const response = await axios.post('http://localhost:8000/chatbot/infer', {
//         message: input,
//       });
//       console.log("Model Response", response.data);
//       // console.log(response);
      
//       // Assuming the response data is in `response.data.reply`
//       const botResponse = response.data || 'No response from bot';

//       // Add the bot's response to the chat
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { type: 'model', content: botResponse },
//       ]);
//     } catch (error) {
//       console.error("Error sending message to API:", error);
//       setMessages((prevMessages) => [
//         ...prevMessages,
//         { type: 'model', content: 'Error processing your message.' },
//       ]);
//     }
//   };

//   const handleQuickPrompt = (promptText) => {
//     setInput(promptText);
//     setCharCount(promptText.length);
//     inputRef.current?.focus();
//   };

//   return (
//     <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
//       {/* Messages area */}
//       <div className="flex-1 overflow-y-auto p-3 space-y-3">
//         {messages.length === 0 ? (
//           <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
//             <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
//               What would you like to know?
//             </h1>
//             <p className="text-xs text-gray-500 dark:text-gray-400">
//               Use one of the most common prompts below or use your own to begin
//             </p>
            
//             {/* Quick prompt suggestions */}
//             <div className="grid grid-cols-2 gap-2 w-full max-w-xl">
//               <button 
//                 onClick={() => handleQuickPrompt("Write a to-do list for a personal project or task")}
//                 className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
//                 <span className="text-xs text-gray-700 dark:text-gray-200">Write a to-do list for a personal project or task</span>
//               </button>
//               <button 
//                 onClick={() => handleQuickPrompt("Generate an email to reply to a job offer")}
//                 className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
//                 <span className="text-xs text-gray-700 dark:text-gray-200">Generate an email to reply to a job offer</span>
//               </button>
//               <button 
//                 onClick={() => handleQuickPrompt("Summarise this article or text for me in one paragraph")}
//                 className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
//                 <span className="text-xs text-gray-700 dark:text-gray-200">Summarise this article or text for me in one paragraph</span>
//               </button>
//               <button 
//                 onClick={() => handleQuickPrompt("How does AI work in a technical capacity")}
//                 className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
//                 <span className="text-xs text-gray-700 dark:text-gray-200">How does AI work in a technical capacity</span>
//               </button>
//             </div>
//           </div>
//         ) : (
//           messages.map((message, index) => (
//             <div
//               key={index}
//               className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
//             >
//               <div
//                 className={`inline-block max-w-[80%] px-3 py-1.5 rounded-md ${
//                   message.type === 'user'
//                     ? 'bg-blue-500 text-white'
//                     : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
//                 }`}
//               >
//                 <span className="text-xs">{message.content}</span>
//               </div>
//             </div>
//           ))
//         )}
//       </div>

//       {/* Input area */}
//       <div className="border-t border-gray-200 dark:border-gray-700 p-3">
//         <div className="relative">
//           {showPromptSuggestions && (
//             <div className="prompt-suggestions">
//               <PromptSuggestions
//                 onSelect={handlePromptSelect}
//                 onClose={() => setShowPromptSuggestions(false)}
//               />
//             </div>
//           )}
//           <div className="chat-input flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-md p-1.5">
//             <div className="flex gap-1.5">
//               <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors">
//                 <Paperclip size={16} className="text-gray-500 dark:text-gray-400" />
//               </button>
//               <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors">
//                 <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
//               </button>
//             </div>
//             <input
//               ref={inputRef}
//               type="text"
//               value={input}
//               onChange={handleInputChange}
//               onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
//               placeholder="Type /prompt for suggestions or ask anything..."
//               className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
//             />
//             <div className="flex items-center gap-1.5">
//               <span className="text-[10px] text-gray-400">{charCount}/1000</span>
//               <button
//                 onClick={toggleListening}
//                 className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors ${
//                   isListening ? 'bg-red-100 dark:bg-red-900/20' : ''
//                 }`}
//               >
//                 <Mic 
//                   size={16} 
//                   className={`${
//                     isListening 
//                       ? 'text-red-500 dark:text-red-400' 
//                       : 'text-gray-500 dark:text-gray-400'
//                   }`} 
//                 />
//               </button>
//               <button
//                 onClick={handleSendMessage}
//                 disabled={!input.trim()}
//                 className={`p-1 rounded-sm transition-colors ${
//                   input.trim()
//                     ? 'bg-blue-500 hover:bg-blue-600'
//                     : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//                 }`}
//               >
//                 <Send size={16} className="text-white" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default ChatInterface;











import React, { useState, useRef, useEffect } from 'react';
import {   
  PlayCircle, ArrowUp, BarChart2, Database, MessageSquarePlus, RotateCcw,
  ChevronDown, ChevronUp, Send, Paperclip, Image as ImageIcon, Search, Mic, Plus, History,
  Star, Edit, Check, X
 } from 'lucide-react';
import axios from 'axios';
import endpoints from '../endpoints.json';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});
// Rating Modal Component
const RatingModal = ({ isOpen, onClose, onSave, initialRating = 0 }) => {
  const [rating, setRating] = useState(initialRating);
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[750px] max-w-[90vw]">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Rate Response</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>
        
        <div className="flex justify-center space-x-3 mb-6">
          {[...Array(10)].map((_, index) => (
            <button
              key={index}
              onClick={() => setRating(index + 1)}
              className="focus:outline-none"
            >
              <Star
                size={22}
                className={`${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300 dark:text-gray-600'} 
                  transition-colors hover:text-yellow-400`}
              />
            </button>
          ))}
        </div>
        
        <div className="text-center mb-5">
          <span className="text-lg font-medium">{rating}/10</span>
        </div>
        
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(rating);
              onClose();
            }}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const PromptSuggestions = ({ onSelect, onClose, selectedPrompt, onChangeLibrary }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sections, setSections] = useState([]);
  const [prompts, setPrompts] = useState([]);
  
  useEffect(() => {
    const fetchPrompts = async () => {
      try {
        // If a prompt library is already selected, fetch its prompts
        if (selectedPrompt) {
          const response = await api.get(`${endpoints.prompts.prefix}/list`);
          const libraryPrompts = response.data.filter(
            item => item.prompt_library_name === selectedPrompt
          );
          setSections([...new Set(libraryPrompts.map(item => item.prompt_subsection_name))]);
          setPrompts(libraryPrompts);
        } else {
          // Use mock prompts if no library is selected
          const mockPrompts = [
            { prompt: "Write a to-do list for a personal project", prompt_subsection_name: "General" },
            { prompt: "Generate an email to reply to a job offer", prompt_subsection_name: "Email" },
            { prompt: "Summarize this article or text in one paragraph", prompt_subsection_name: "Content" },
            { prompt: "How does AI work in a technical capacity", prompt_subsection_name: "Technical" },
            { prompt: "Create a marketing strategy for a new product", prompt_subsection_name: "Business" },
          ];
          setSections([...new Set(mockPrompts.map(item => item.prompt_subsection_name))]);
          setPrompts(mockPrompts);
        }
      } catch (error) {
        console.error("Error fetching prompts:", error);
        // Fallback to mock prompts on error
        const mockPrompts = [
          { prompt: "Write a to-do list for a personal project", prompt_subsection_name: "General" },
          { prompt: "Generate an email to reply to a job offer", prompt_subsection_name: "Email" },
          { prompt: "Summarize this article or text in one paragraph", prompt_subsection_name: "Content" },
        ];
        setSections([...new Set(mockPrompts.map(item => item.prompt_subsection_name))]);
        setPrompts(mockPrompts);
      }
    };

    fetchPrompts();
  }, [selectedPrompt]);
  
  return (
    <div className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-2">
      {/* Search input */}
      <div className="p-3 border-b border-gray-200 dark:border-gray-700">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-2 py-1 text-sm rounded-md"
          />
        </div>
        
        {selectedPrompt && (
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-gray-500">Using: {selectedPrompt}</span>
            <button 
              onClick={onChangeLibrary}
              className="text-xs text-blue-500 hover:text-blue-600"
            >
              Change
            </button>
          </div>
        )}
      </div>
   
      <div className="max-h-64 overflow-y-auto">
        {sections
          .filter(section => section.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((section) => (
            <div key={section} className="p-2">
              <div className="text-sm font-medium p-2 bg-gray-50 dark:bg-gray-700/50">
                {section}
              </div>
              {prompts
                .filter(p => p.prompt_subsection_name === section &&
                  p.prompt.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((prompt) => (
                  <button
                    key={prompt.prompt}
                    onClick={() => onSelect(prompt.prompt)}
                    className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                  >
                    <div className="text-xs">{prompt.prompt}</div>
                    {prompt.prompt_description && (
                      <div className="text-xs text-gray-500">{prompt.prompt_description}</div>
                    )}
                  </button>
                ))}
            </div>
          ))}
          
        {sections.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            No prompts found. Try a different search or select a prompt library.
          </div>
        )}
      </div>
    </div>
  );
};
const ChatInterface = ({ selectedModel, selectedLibrary, enableRHLF, onChangeLibrary, selectedPrompt, selectedRagRLHF, selectedRag, ragDb }) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const inputRef = useRef(null);
  const [charCount, setCharCount] = useState(0);


 
  

// message save
  const [ratedMessages, setRatedMessages] = useState([]);

  // States for rating functionality
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [currentRatingIndex, setCurrentRatingIndex] = useState(null);

  useEffect(() => {
    setMessages([]);
    setInput('');
    setCharCount(0);
    setShowPromptSuggestions(false);
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new webkitSpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results)
          .map(result => result[0])
          .map(result => result.transcript)
          .join('');
        
        setInput(transcript);
        setCharCount(transcript.length);
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      setRecognition(recognition);
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInput(value);
    setCharCount(value.length);
    
    if (value.toLowerCase() === '/prompt') {
      setShowPromptSuggestions(true);
    } else if (!value.toLowerCase().startsWith('/prompt')) {
      setShowPromptSuggestions(false);
    }
  };

  const handleClickOutside = (e) => {
    if (!e.target.closest('.prompt-suggestions') && !e.target.closest('.chat-input')) {
      setShowPromptSuggestions(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handlePromptSelect = (promptText) => {
    setInput(promptText);
    setCharCount(promptText.length);
    setShowPromptSuggestions(false);
    inputRef.current?.focus();
  };

  // Rating handlers
  const handleRateMessage = (index) => {
    setCurrentRatingIndex(index);
    setShowRatingModal(true);
  };

  // const saveRating = (rating) => {
  //   if (currentRatingIndex !== null) {
  //     setMessages(messages.map((msg, idx) => 
  //       idx === currentRatingIndex ? { ...msg, rating } : msg
  //     ));
  //   }
  // };

  // Modify the saveRating function to call the API
const saveRating = async (rating) => {
  if (currentRatingIndex !== null) {
    const updatedMessages = messages.map((msg, idx) => 
      idx === currentRatingIndex ? { ...msg, rating } : msg
    );
    
    setMessages(updatedMessages);
    
    // If this is a model message that received a rating, save it to backend
    if (currentRatingIndex > 0 && 
        messages[currentRatingIndex].type === 'model' && 
        messages[currentRatingIndex-1].type === 'user') {
      
      const rlhfData = {
        question: messages[currentRatingIndex-1].content,
        answer: messages[currentRatingIndex].content,
        rating: rating,
        vector_db: selectedRagRLHF
      };  
      
      try {
        const response = await api.post(`http://localhost:8000/chatbot/add_rlhf`, rlhfData,{
          headers: {
            'Content-Type': 'application/json'
          }
        });
        console.log("RLHF data saved:", response.data);
      } catch (error) {
        console.error("Error saving RLHF data:", error);
      }
    }
  }   
};

  // const handleSendMessage = async () => {
  //   if (!input.trim()) return;

  //   // Add user message to chat
  //   setMessages([...messages, { type: 'user', content: input }]);
  //   setInput('');
  //   setCharCount(0);
  //   setIsGenerating(true);

  //   try {
  //     // Send the message to the backend API
  //     const response = await axios.post('http://localhost:8000/chatbot/infer', {
  //       message: input,
  //     });
  //     console.log("Model Response", response.data);
      
  //     // Add the bot's response to the chat with rating initialized to null
  //     setMessages((prevMessages) => [
  //       ...prevMessages,
  //       { type: 'model', content: response.data || 'No response from bot', rating: null },
  //     ]);
  //   } catch (error) {
  //     console.error("Error sending message to API:", error);
  //     setMessages((prevMessages) => [
  //       ...prevMessages,
  //       { type: 'model', content: 'Error processing your message.', rating: null },
  //     ]);
  //   } finally {
  //     setIsGenerating(false);
  //   }
  // };


  const handleSendMessage = async () => {
    if (!input.trim()) return;

    // Add user message to chat
    setMessages([...messages, { type: 'user', content: input }]);
    setInput('');
    setCharCount(0);
    setIsGenerating(true);

    try {
      const filterRag = ragDb.filter(rag => rag.name == selectedRag)
        // Send the message to the backend API with RAG name
        const response = await axios.post('http://localhost:8000/chatbot/infer', {
            message: input,
            model: selectedModel,
            rag_name: selectedRag  // Add this line to send the RAG name
        });
        
        // Add the bot's response to the chat with rating and metadata
        setMessages((prevMessages) => [
            ...prevMessages,
            { 
                type: 'model', 
                content: response.data.response || 'No response from bot', 
                rating: null,
                metadata: {
                    rag_used: response.data.rag_used,
                    context_length: response.data.context_length
                }
            },
        ]);
    } catch (error) {
        console.error("Error sending message to API:", error);
        setMessages((prevMessages) => [
            ...prevMessages,
            { type: 'model', content: 'Error processing your message.', rating: null },
        ]);
    } finally {
        setIsGenerating(false);
    }
};



  const handleQuickPrompt = (promptText) => {
    setInput(promptText);
    setCharCount(promptText.length);
    inputRef.current?.focus();
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <h1 className="text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              What would you like to know?
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Use one of the most common prompts below or use your own to begin
            </p>
            
            {/* Quick prompt suggestions */}
            <div className="grid grid-cols-2 gap-2 w-full max-w-xl">
              <button 
                onClick={() => handleQuickPrompt("Write a to-do list for a personal project or task")}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <span className="text-xs text-gray-700 dark:text-gray-200">Write a to-do list for a personal project or task</span>
              </button>
              <button 
                onClick={() => handleQuickPrompt("Generate an email to reply to a job offer")}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <span className="text-xs text-gray-700 dark:text-gray-200">Generate an email to reply to a job offer</span>
              </button>
              <button 
                onClick={() => handleQuickPrompt("Summarise this article or text for me in one paragraph")}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <span className="text-xs text-gray-700 dark:text-gray-200">Summarise this article or text for me in one paragraph</span>
              </button>
              <button 
                onClick={() => handleQuickPrompt("How does AI work in a technical capacity")}
                className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <span className="text-xs text-gray-700 dark:text-gray-200">How does AI work in a technical capacity</span>
              </button>
            </div>
          </div>
        ) : (

          messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} w-full`}
            >
              <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                {message.type === 'user' ? (
                  // User message
                  <div className="px-4 py-2 rounded-lg bg-blue-500 text-white rounded-br-none">
                    <span className="text-sm leading-relaxed">{message.content}</span>
                  </div>
                ) : (
                  // Model message with RAG badge and rating
                  <div className="flex flex-col gap-1">
                    <div className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none">
                      <span className="text-sm leading-relaxed">{message.content}</span>
                      
                      {/* Show RAG badge if used */}
                      {message.metadata?.rag_used && (
                        <div className="mt-1 flex items-center gap-1">
                          <span className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 rounded-full flex items-center gap-1">
                            <Database size={12} />
                            RAG Enhanced
                            {message.metadata?.context_length && (
                              <span className="ml-1 text-xs opacity-75">
                                ({message.metadata.context_length} chars)
                              </span>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                    
                    {/* Rating UI */}
                    {enableRHLF && (
                      <div className="mt-1.5 ml-2">
                        {message.rating === null ? (
                          <button 
                            onClick={() => handleRateMessage(index)}
                            className="text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 text-xs flex items-center gap-1.5"
                          >
                            <Star size={14} />
                            <span>Rate response</span>
                          </button>
                        ) : (
                          <div className="flex items-center">
                            <span className="text-yellow-500 font-medium text-xs flex items-center">
                              {message.rating}/10
                              <Star size={12} className="ml-1.5 fill-yellow-500 text-yellow-500" />
                            </span>
                            <button
                              onClick={() => handleRateMessage(index)}
                              className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                            >
                              <Edit size={12} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
         


//           messages.map((message, index) => (
//             <div
//               key={index}
//               className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} w-full`}
//             >
//               <div className={`flex flex-col ${message.type === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
//                 <div
//                   className={`px-4 py-2 rounded-lg ${
//                     message.type === 'user'
//                       ? 'bg-blue-500 text-white rounded-br-none'
//                       : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white rounded-bl-none'
//                   }`}
//                 >
//                   <span className="text-sm leading-relaxed">{message.content}</span>
//                 {/* </div> */}
               
                
            

// {message.type === 'model' && enableRHLF && (
//   <div className="mt-1.5 ml-2"> {/* Changed from mt-1 ml-1 */}
//     {message.rating === null ? (
//       <button 
//         onClick={() => handleRateMessage(index)}
//         className="text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 text-xs flex items-center gap-1.5" /* Added more gap */
//       >
//         <Star size={14} /> {/* Increased from 12 */}
//         <span>Rate response</span>
//       </button>
//     ) : (
//       <div className="flex items-center">
//         <span className="text-yellow-500 font-medium text-xs flex items-center">
//           {message.rating}/10
//           <Star size={12} className="ml-1.5 fill-yellow-500 text-yellow-500" /> {/* Increased from ml-1 */}
//         </span>
//         <button
//           onClick={() => handleRateMessage(index)}
//           className="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" /* Increased from ml-1 */
//         >
//           <Edit size={12} />
//         </button>
//       </div>
//     )}
//   </div>
// )}
//               </div>
//               </div>
//             </div>
          // ))
        )}
        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-1.5">
              <div className="flex space-x-1">
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75" />
                <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-3">
        <div className="relative">
          {/* {showPromptSuggestions && (
            <div className="prompt-suggestions">
              <PromptSuggestions
                onSelect={handlePromptSelect}
                onClose={() => setShowPromptSuggestions(false)}
                selectedLibrary={selectedLibrary}
                onChangeLibrary={onChangeLibrary}
              />
            </div>
          )} */}

{showPromptSuggestions && (
  <div className="prompt-suggestions">
    <PromptSuggestions
      onSelect={handlePromptSelect}
      onClose={() => setShowPromptSuggestions(false)}
      selectedPrompt={selectedPrompt}
      onChangeLibrary={onChangeLibrary}
    />
  </div>
)}
          <div className="chat-input flex items-center gap-1.5 bg-gray-50 dark:bg-gray-700 rounded-md p-1.5">
            <div className="flex gap-1.5">
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors">
                <Paperclip size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
              <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors">
                <ImageIcon size={16} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type /prompt for suggestions or ask anything..."
              className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-gray-400">{charCount}/1000</span>
              <button
                onClick={toggleListening}
                className={`p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors ${
                  isListening ? 'bg-red-100 dark:bg-red-900/20' : ''
                }`}
              >
                <Mic 
                  size={16} 
                  className={`${
                    isListening 
                      ? 'text-red-500 dark:text-red-400' 
                      : 'text-gray-500 dark:text-gray-400'
                  }`} 
                />
              </button>
              <button
                onClick={handleSendMessage}
                disabled={!input.trim() || isGenerating}
                className={`p-1 rounded-sm transition-colors ${
                  input.trim() && !isGenerating
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                }`}
              >
                <Send size={16} className="text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Rating Modal */}
      <RatingModal
        isOpen={showRatingModal}
        onClose={() => setShowRatingModal(false)}
        onSave={saveRating}
        initialRating={currentRatingIndex !== null ? messages[currentRatingIndex]?.rating || 0 : 0}
      />
    </div>
  );
};

export default ChatInterface;

