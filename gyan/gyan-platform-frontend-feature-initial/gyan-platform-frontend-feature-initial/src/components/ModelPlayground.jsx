////////////////////////////////////////////////////////
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { 
 PlayCircle, ArrowUp, BarChart2, Database, MessageSquarePlus, RotateCcw,
 ChevronDown, ChevronUp, Send, Paperclip, Image as ImageIcon, Search, Mic , ShieldCheck, Star, Edit
} from 'lucide-react';
import { 
 CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, 
 ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';

import axios from 'axios';
import endpoints from '../endpoints.json';

import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { useProject } from '../context/ProjectContext';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
 baseURL: BASE_URL,
 withCredentials: true,
 headers: {
   'Content-Type': 'application/json',
   'Accept': 'application/json',
 }
});

const MOCK_RAG_OPTIONS = [
   { id: 1, name: "Wikipedia Dataset" },
   { id: 2, name: "Medical Records" },
   { id: 3, name: "Legal Documents" },
   { id: 4, name: "Customer Support Data" }
];

const Modal = ({ isOpen, onClose, title, children }) => {
 if (!isOpen) return null;
 
 return (
   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
     <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
       <div className="flex justify-between items-center mb-4">
         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
         <button onClick={onClose} className="text-gray-500 hover:text-gray-700">✕</button>
       </div>
       {children}
     </div>
   </div>
 );
};



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

const PromptSuggestions = ({ onSelect, onClose }) => {
 const [searchQuery, setSearchQuery] = useState('');
 const [selectedPromptLib, setSelectedPromptLib] = useState('');
 const [sections, setSections] = useState([]);
 const [prompts, setPrompts] = useState([]);
 const [uniqueLibraries, setUniqueLibraries] = useState([]);

 useEffect(() => {
   const fetchLibraries = async () => {
     const response = await api.get(`${endpoints.prompts.prefix}/list`);
     const libraries = [...new Set(response.data.map(item => item.prompt_library_name))];
     setUniqueLibraries(libraries);
   };
   fetchLibraries();
 }, []);

 useEffect(() => {
   if (selectedPromptLib) {
     const fetchSections = async () => {
       const response = await api.get(`${endpoints.prompts.prefix}/list`);
       const libraryPrompts = response.data.filter(
         item => item.prompt_library_name === selectedPromptLib
       );
       setSections([...new Set(libraryPrompts.map(item => item.prompt_subsection_name))]);
       setPrompts(libraryPrompts);
     };
     fetchSections();
   }
 }, [selectedPromptLib]);

 return (
   <div className="absolute bottom-full left-0 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 mb-2">
     <div className="p-3 border-b border-gray-200 dark:border-gray-700">
       <select
         value={selectedPromptLib}
         onChange={(e) => setSelectedPromptLib(e.target.value)}
         className="w-full p-2 mb-2 rounded-md border border-gray-300 dark:border-gray-600"
       >
         <option value="">Select Library</option>
         {uniqueLibraries.map((lib) => (
           <option key={lib} value={lib}>{lib}</option>
         ))}
       </select>
       
       <div className="relative">
         <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
         <input
           type="text"
           placeholder="Search sections..."
           value={searchQuery}
           onChange={(e) => setSearchQuery(e.target.value)}
           className="w-full pl-8 pr-2 py-1 text-sm rounded-md"
         />
       </div>
     </div>

     <div className="max-h-64 overflow-y-auto">
       {selectedPromptLib && sections
         .filter(section => section.toLowerCase().includes(searchQuery.toLowerCase()))
         .map((section) => (
           <div key={section} className="p-2">
             <div className="text-sm font-medium p-2 bg-gray-50 dark:bg-gray-700/50">
               {section}
             </div>
             {prompts
               .filter(p => p.prompt_subsection_name === section)
               .map((prompt) => (
                 <button
                   key={prompt.prompt}
                   onClick={() => onSelect(prompt.prompt)}
                   className="w-full p-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md"
                 >
                   <div className="text-xs">{prompt.prompt}</div>
                   <div className="text-xs text-gray-500">{prompt.prompt_description}</div>
                 </button>
               ))}
           </div>
         ))}
     </div>
   </div>
 );
};


const ModelPlayground = () => {
 const { id } = useParams();
 const [isProcessing, setIsProcessing] = useState(false);
 const [selectedJob, setSelectedJob] = useState(null);
 const [isParamsOpen, setIsParamsOpen] = useState(false);
 const [isProgressOpen, setIsProgressOpen] = useState(false);
 const [isConfigurationOpen, setIsConfigurationOpen] = useState(false);
 const [isLoadModelParaOpen, setIsLoadModelParaOpen] = useState(false);
 const [searchStrategy, setSearchStrategy] = useState('topK');
 const [topK, setTopK] = useState(50);
 const [topP, setTopP] = useState(0.5);
 const [temperature, setTemperature] = useState(0.5);
 const [jobs, setJobs] = useState([]);
 const [showRagPopup, setShowRagPopup] = useState(false);
 const [showPromptPopup, setShowPromptPopup] = useState(false);
 const [selectedRag, setSelectedRag] = useState(null);
 const [selectedPrompt, setSelectedPrompt] = useState(null);
 const [tempRagSelection, setTempRagSelection] = useState(null);
 const [tempPromptSelection, setTempPromptSelection] = useState(null);
 const [loading, setLoading] = useState(true);
 const [selectedJobDetails, setSelectedJobDetails] = useState(null);
 const [showPromptSuggestions, setShowPromptSuggestions] = useState(false);
 const [modelLoaded, setModelLoaded] = useState(false);
 const [modelLoading, setModelLoading] = useState(false);
 const [modelError, setModelError] = useState(null);
 const [messages, setMessages] = useState([]);
 const [input, setInput] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [logsData, setLogsData] = useState([]);
 const [uniqueLib, setUniqueLib] = useState([]);
 const {selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();
// rlhf
const [showRatingModal, setShowRatingModal] = useState(false);
const [currentRatingIndex, setCurrentRatingIndex] = useState(null);


 // rag
 const [ragDb, setRagDb] = useState([]);
 const [error, setError] = useState(null);
 const [enableRHLF, setEnableRHLF] = useState(false);

 const [guardCounter, setGuardCounter] = useState(0);

  
    const [isDisabled, setIsDisabled] = useState(false);

    const [countdown, setCountdown] = useState(0);
    // Add this after your existing state declarations in the ModelPlayground component
const [isListening, setIsListening] = useState(false);

// Add this function to handle speech recognition
const handleSpeechRecognition = () => {
  // Check if speech recognition is supported
  if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
    toast.error("Speech recognition is not supported in your browser.");
    return;
  }

  // Create speech recognition instance
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();
  
  // Configure settings
  recognition.continuous = false;
  recognition.interimResults = true;
  recognition.lang = 'en-US'; // You can make this configurable later
  
  // Start listening
  setIsListening(true);
  recognition.start();
  
  // While user is speaking (interim results)
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map(result => result[0])
      .map(result => result.transcript)
      .join('');
      
    setInput(transcript);
  };
  
  // When user stops speaking
  recognition.onend = () => {
    setIsListening(false);
  };
  
  // Handle errors
  recognition.onerror = (event) => {
    console.error('Speech recognition error', event.error);
    setIsListening(false);
    toast.error(`Error: ${event.error}`);
  };
};

    useEffect(() => {
      fetchGuardCount();
    },[])
    
    useEffect(() => {
      let interval;
    
      if (countdown > 0) {
        interval = setInterval(() => {
          setCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(interval);
              setIsDisabled(false);
              toast.info("UI has been re-enabled.", {
                position: "top-right",
              });
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    
      return () => clearInterval(interval); // Cleanup on unmount
    }, [countdown]);
    
    
    useEffect(() => {
      const intervalId = setInterval(() => {
        
        fetchGuardCount();
      }, 20000); 
    
      return () => clearInterval(intervalId);
    },[])


   

    // off loading model
    const handleUnloadModel = useCallback(async () => {
      if (!selectedJobDetails || !modelLoaded) return;
      
      try {
        setModelLoading(true);
        
        const requestData = {
          model_type: selectedJobDetails.model_type,
          model_name: selectedJobDetails.model_name,
          project_name: selectedJobDetails.project_name,
          job_name: selectedJobDetails.name
        };
        
        const response = await api.post(
          `${endpoints.playground.prefix}${endpoints.playground.routes.unloaded_model}`, 
          requestData
        );
        
        if (response.data.status === 'success') {
          setModelLoaded(false);
          setModelError(null);
          // toast.success('Model unloaded successfully', {
          //   position: 'top-right',
          //   autoClose: 3000
          // });
        } else {
          setModelError('Failed to unload model');
          // toast.error('Failed to unload model', {
          //   position: 'top-right',
          //   autoClose: 3000
          // });
        }
      } catch (error) {
        console.error('Error unloading model:', error);
        setModelError(error.message || 'Failed to unload model');
        // toast.error(`Error: ${error.message || 'Failed to unload model'}`, {
        //   position: 'top-right',
        //   autoClose: 3000
        // });
      } finally {
        setModelLoading(false);
      }
    },[modelLoaded]);


    useEffect(() => {
      return () => {
        if (modelLoaded ) {
          console.log(`Unloading model ${modelLoaded} on component unmount`);
          handleUnloadModel();
        }
      };
    }, [modelLoaded, handleUnloadModel]); 


const fetchGuardCount = async () => {
  try {
    const response = await api.get(
      `${endpoints.foundation_models.prefix}${endpoints.foundation_models.routes.guard_check}`
    );
    console.log("Guard count response:", response.data);
    setGuardCounter(response.data.max_counter);

    // If guardCounter exceeds 15 and countdown hasn't started yet
    if (response.data.max_counter > 15 && countdown === 0) {
      setIsDisabled(true);
      setCountdown(300); // 5 minutes (300 seconds)

      toast.warning("Too many restricted requests! UI disabled for 5 minutes.", {
        position: "top-right",
        autoClose: 5000,
      });
    }
  } catch (error) {
    console.error("Error fetching guard count:", error.response ? error.response.data : error.message);
  }
};



 useEffect(() => {
   fetchPromptsLibrary();
   fetchRagLibrary();
 }, []);

 const fetchPromptsLibrary = async () => {
   const response = await api.get(`${endpoints.prompts.prefix}/list`);
   setUniqueLib([...new Set(response.data.map(item => item.prompt_library_name))]);
 };

 const fetchRagLibrary = async () => {
  const response = await api.get(`${endpoints.rag.prefix}/list`);
  console.log("Response form rag database", response.data);
  setRagDb(response.data);
  
 }

 const chartData = useMemo(() => {
   if (!logsData.length) return [];
   const firstTimestamp = new Date(logsData[0].timestamp).getTime();
   return logsData.map(log => ({
     time: Math.floor((new Date(log.timestamp).getTime() - firstTimestamp) / 1000),
     timeLabel: `${Math.floor((new Date(log.timestamp).getTime() - firstTimestamp) / 1000)}s`,
     trainLoss: log.train_loss,
     validationLoss: log.eval_loss,
     epoch: log.epoch,
     step: log.step
   }));
 }, [logsData]);

 useEffect(() => {
   fetchJobs();
 }, [selectedProjectId]); 

 const fetchJobs = async () => {
   try {
     setLoading(true);
     const response = await api.get(
       `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', selectedProjectId)}`
     );
     const completedJobs = response.data.filter(job => job.queue_status === 'Completed');
     setJobs(completedJobs);
     
     if (!selectedJob && completedJobs.length > 0) {
       setSelectedJob(completedJobs[0]);
       setSelectedJobDetails(response.data[0]);
     }
   } catch (error) {
     console.error('Error fetching jobs:', error);
   } finally {
     setLoading(false);
   }
 };

 const fetchAllLogs = async () => {
   try {
     if(selectedJob !== null){
       const response = await api.get(
         `${endpoints.training_logs.prefix}${endpoints.training_logs.routes.get_logs.replace('{job_id}', selectedJob.id)}`
       );
       if (response.data && Array.isArray(response.data)) {
         setLogsData(response.data);
       }
     }
   } catch (error) {
     console.error('Error fetching logs:', error);
   }
 };

 const handleLoadModel = async () => {
   setModelLoading(true);
   setModelLoaded(false);
   setModelError(null);
   
   try {
     const requestData = {
       model_type: selectedJobDetails.model_type,
       model_name: selectedJobDetails.model_name,
       project_name: selectedJobDetails.project_name,
       job_name: selectedJobDetails.name,
       parameters: {
         search_strategy: searchStrategy,
         [searchStrategy === 'topK' ? 'top_k' : 'top_p']: searchStrategy === 'topK' ? topK : topP,
         temperature: temperature
       }
     };
     
     const response = await api.post(`${endpoints.playground.prefix}${endpoints.playground.routes.load_model}`, requestData);
     
     if (response.data.status === 'success') {
       setModelLoaded(true);
     } else {
       setModelError('Failed to load model');
     }
   } catch (error) {
     setModelError(error.message || 'Failed to load model');
   } finally {
     setModelLoading(false);
   }
 };

 const handleJobSelect = async(job) => {
   setSelectedJob(job);
   fetchAllLogs();
   
   const jobDetails = jobs.find(j => j.id === job.id);
   setSelectedJobDetails(jobDetails);

   setSearchStrategy('topK');
   setTopK(40);
   setTopP(0.8);
   setTemperature(0.1);

   setModelLoading(true);
   setModelLoaded(false);
   setModelError(null);

   try {
     const requestData = {
       model_type: jobDetails.model_type,
       model_name: jobDetails.model_name,
       project_name: jobDetails.project_name,
       job_name: jobDetails.name,
       parameters: {
         search_strategy: 'topK',
         top_k: 40,
         temperature: 0.1
       }
     };
     
     const response = await api.post(`http://localhost:8000/playground/model/load`, requestData);
     
     if (response.data.status === 'success') {
       setModelLoaded(true);
     } else {
       setModelError('Failed to load model');
     }
   } catch (error) {
     setModelError(error.message || 'Failed to load model');
   } finally {
     setModelLoading(false);
   }
 };

  // Handle message rating
  const handleRateMessage = (index) => {
    setCurrentRatingIndex(index);
    setShowRatingModal(true);
  };

  // Save rating for a message
  const saveRating = (rating) => {
    if (currentRatingIndex !== null) {
      setMessages(messages.map((msg, idx) => 
        idx === currentRatingIndex ? { ...msg, rating } : msg
      ));
    }
  };

  // Edit existing rating
  const handleEditRating = (index) => {
    setCurrentRatingIndex(index);
    setShowRatingModal(true);
  };


 const handleSendMessage = async () => {
   if (!input.trim() || !modelLoaded || isGenerating) return;

   setMessages([...messages, { type: 'user', content: input }]);
   setInput('');

   try {
     const formatMessage = {
       message: input,
       model_type: selectedJobDetails.model_type,
       model_name: selectedJobDetails.model_name,
       project_name: selectedJobDetails.project_name,
       job_name: selectedJobDetails.name
     };

     setIsGenerating(true);

     const response = await api.post(
       `${endpoints.playground.prefix}${endpoints.playground.routes.infer}`,
       formatMessage
     );

    //  setMessages((prevMessages) => [
    //    ...prevMessages,
    //    { type: 'model', content: response.data.response },
    //  ]);
    setMessages((prevMessages) => [
      ...prevMessages,
      { type: 'model', content: response.data.response, rating: null },
    ]);
   } catch (error) {
     console.error('Inference error:', error);
     setMessages((prevMessages) => [
       ...prevMessages,
       { type: 'model', content: 'Sorry, I encountered an error generating a response.' },
     ]);
   } finally {
     setIsGenerating(false);
     setShowPromptSuggestions(false);
   }
 };


 return (
   <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
     {/* Project header */}
     <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
       <div className="flex flex-col space-y-1 mb-4">
         <span className="text-sm text-gray-500 dark:text-gray-400">Project</span>
         <h1 className="text-xl font-bold text-gray-900 dark:text-white">
           {/* {selectedJob.project_name} */}
         </h1>
       </div>
       <div className="flex items-center mt-1 text-green-600">
    <ShieldCheck size={14} className="mr-1" />
    <span className="text-xs font-medium">GuardRL Protected</span>
   
  {isDisabled && countdown > 0 && (
    <div className="text-red-500 text-xs font-semibold bg-red-100 px-2 py-1 rounded-lg ml-2">
      UI Unlocked in {Math.floor(countdown / 60)}:{String(countdown % 60).padStart(2, '0')}
    </div>
  )}
  </div>
       <div className="flex justify-end gap-3">
         <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
           <RotateCcw size={16} />
           Re-train
         </button>
         <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
           <ArrowUp size={16} />
           Deploy
         </button>
         <button className="flex items-center gap-2 px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 text-sm">
           <BarChart2 size={16} />
           Evaluate
         </button>
         <button 
           onClick={() => setShowRagPopup(true)} 
           className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
         >
           <Database size={16} />
           Add RAG
         </button>
         <button 
          onClick={() => setShowPromptPopup(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 text-sm"
        >
          <MessageSquarePlus size={16} />
          Add Prompt
        </button>
      </div>
    </div>

    {/* Main content */}
    <div className="p-6">
      <div className="grid grid-cols-12 gap-6">
        {/* Left section - Training Jobs */}
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)]">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Training Jobs
          </h2>
          <div className="space-y-0 overflow-y-auto scrollbar-hide">
            {jobs.map((job, index) => (
              <div key={job.id}>
                <div
                  onClick={() => handleJobSelect(job)}
                  className={`p-3 cursor-pointer transition-colors flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    selectedJob?.id === job.id
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : ''
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <h3 className={`font-medium ${
                      selectedJob?.id === job.id
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-gray-900 dark:text-white'
                    }`}>
                      {job.name}
                    </h3>
                    {selectedJob?.id === job.id && (
                      <div className="flex items-center space-x-2">
                        {modelLoading && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" 
                                 title="Loading model..." />
                            <span className="ml-2 text-xs text-yellow-400">Loading...</span>
                          </div>
                        )}
                        {modelLoaded && !modelLoading && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-green-400 rounded-full" 
                                 title="Model loaded successfully" />
                            <span className="ml-2 text-xs text-green-400">Ready</span>
                          </div>
                        )}
                        {modelError && !modelLoading && (
                          <div className="flex items-center">
                            <div className="w-2 h-2 bg-red-400 rounded-full" 
                                 title={modelError} />
                            <span className="ml-2 text-xs text-red-400">Error</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(job.started_on).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Middle section - Chat */}
        <div className="col-span-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)] flex flex-col">
            <div className="min-h-0 flex-1">
              <div className="h-full overflow-y-auto space-y-4 scrollbar-hide">
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
                        onClick={() => setInput("Write a to-do list for a personal project or task")}
                        className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <span className="text-xs text-gray-700 dark:text-gray-200">Write a to-do list for a personal project or task</span>
                      </button>
                      <button 
                        onClick={() => setInput("Generate an email to reply to a job offer")}
                        className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <span className="text-xs text-gray-700 dark:text-gray-200">Generate an email to reply to a job offer</span>
                      </button>
                      <button 
                        onClick={() => setInput("Summarise this article or text for me in one paragraph")}
                        className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <span className="text-xs text-gray-700 dark:text-gray-200">Summarise this article or text for me in one paragraph</span>
                      </button>
                      <button 
                        onClick={() => setInput("How does AI work in a technical capacity")}
                        className="p-3 text-left bg-gray-50 dark:bg-gray-700 rounded-sm hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                        <span className="text-xs text-gray-700 dark:text-gray-200">How does AI work in a technical capacity</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-4 py-2 ${
                          message.type === 'user'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                        }`}
                      >
                        {message.content}
                        {/* Rating display for model messages */}
                {message.type === 'model' && enableRHLF && (
                  <div className="mt-2 flex items-center gap-2">
                    {message.rating === null ? (
                      <button 
                        onClick={() => handleRateMessage(index)}
                        className="text-gray-500 dark:text-gray-400 hover:text-yellow-500 dark:hover:text-yellow-400 text-xs flex items-center gap-1"
                      >
                        <Star size={14} />
                        Rate response
                      </button>
                    ) : (
                      <div className="flex items-center">
                        <span className="text-yellow-500 font-medium text-xs flex items-center mr-2">
                          {message.rating}/10
                          <Star size={12} className="ml-1 fill-yellow-500 text-yellow-500" />
                        </span>
                        <button
                          onClick={() => handleEditRating(index)}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                        >
                          <Edit size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
                      </div>
                    </div>
                  ))
                )}
                {isGenerating && (
                  <div className="flex justify-start">
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg px-4 py-2">
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="relative">
                {showPromptSuggestions && (
                  <PromptSuggestions
                    onSelect={(promptText) => {
                      setInput(promptText);
                      setShowPromptSuggestions(false);
                    }}
                    onClose={() => setShowPromptSuggestions(false)}
                  />
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
                    type="text"
                    value={input}
                    onChange={(e) => {
                      const value = e.target.value;
                      setInput(value);
                      if (value === '/prompt') {
                        setShowPromptSuggestions(true);
                      } else if (!value.startsWith('/prompt')) {
                        setShowPromptSuggestions(false);
                      }
                    }}
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    disabled={!modelLoaded || isGenerating}
                    placeholder={!modelLoaded ? "Please select a model..." : "Type /prompt for suggestions or ask anything..."}
                    className="flex-1 bg-transparent border-none outline-none focus:ring-0 text-xs text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                  />
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-gray-400">{input.length}/1000</span>
                    {/* <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-sm transition-colors">
                      <Mic size={16} className="text-gray-500 dark:text-gray-400" />
                    </button> */}
                    {/* Replace the existing mic button with this updated version */}
<button 
  onClick={handleSpeechRecognition}
  disabled={isListening || !modelLoaded}
  className={`p-1 rounded-sm transition-colors ${
    isListening 
      ? 'bg-red-500 text-white' 
      : 'hover:bg-gray-200 dark:hover:bg-gray-600'
  }`}
>
  <Mic size={16} className={isListening ? "text-white animate-pulse" : "text-gray-500 dark:text-gray-400"} />
</button>
                    <button
                      onClick={handleSendMessage}
                      disabled={!modelLoaded || isGenerating || !input.trim()}
                      className={`p-1 rounded-sm transition-colors ${
                        !modelLoaded || isGenerating || !input.trim()
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          : 'bg-blue-500 text-white hover:bg-blue-600'
                      }`}
                    >
                      <Send size={16} className="text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right section - Parameters */}
        <div className="col-span-3 bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)] overflow-y-auto scrollbar-hide">
          {/* Training Parameters Section */}
          <div className="mb-4">
            <button 
              onClick={() => setIsParamsOpen(!isParamsOpen)}
              className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <span>Training Parameters</span>
              {isParamsOpen ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>
            
            <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg ${
              isParamsOpen ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}`}>
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold mb-4">Training Details</h3>
                <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide pr-4">
                  <div className="flex justify-between items-center py-2 border-b gap-4">
                    <span className="text-sm text-gray-500 min-w-[100px]">Job ID</span>
                    <span className="text-sm font-medium text-right">{selectedJob?.id || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Model Type</span>
                    <span className="text-sm font-medium">{selectedJob?.model_type === "Large Language Model" ? "LLM" : selectedJob?.model_type || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">HF ID</span>
                    <span className="text-sm font-medium">{selectedJob?.hf_id || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b gap-4">
                    <span className="text-sm text-gray-500 min-w-[100px]">Dataset Path</span>
                    <span className="text-sm font-medium text-right truncate max-w-[200px]" title={selectedJob?.dataset_path}>
                      {selectedJobDetails?.dataset_path || "-"}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Batch Size</span>
                    <span className="text-sm font-medium">{selectedJob?.batch_size || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Learning Rate</span>
                    <span className="text-sm font-medium">{selectedJob?.learning_rate || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Token Length</span>
                    <span className="text-sm font-medium">{selectedJob?.token_length || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-gray-500">Rank</span>
                    <span className="text-sm font-medium">{selectedJob?.rank || "-"}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                  <span className="text-sm text-gray-500">Quantization</span>
                     <span className="text-sm font-medium">{selectedJob?.quantization || "-"}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b">
                     <span className="text-sm text-gray-500">LoRA Optimized</span>
                     <span className="text-sm font-medium">{selectedJob?.lora_optimized ? 'Yes' : 'No'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b">
                     <span className="text-sm text-gray-500">Started On</span>
                     <span className="text-sm font-medium">{new Date(selectedJob?.started_on).toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between items-center py-2 border-b">
                     <span className="text-sm text-gray-500">Completed At</span>
                     <span className="text-sm font-medium">{selectedJob?.completed_at ? new Date(selectedJob.completed_at).toLocaleString() : '-'}</span>
                   </div>
                   <div className="flex justify-between items-center py-2">
                     <span className="text-sm text-gray-500">User Email</span>
                     <span className="text-sm font-medium">{selectedJob?.user_email}</span>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Configurations Section */}
           <div className="mt-4 mb-4">
             <button 
               onClick={() => setIsConfigurationOpen(!isConfigurationOpen)}
               className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
             >
               <span>Configurations</span>
               {isConfigurationOpen ? (
                 <ChevronUp className="h-5 w-5 text-slate-400" />
               ) : (
                 <ChevronDown className="h-5 w-5 text-slate-400" />
               )}
             </button>
             
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
               isConfigurationOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
             }`}>
               <div className="space-y-4">
                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
                   <div className="flex justify-between items-center">
                     <label className="text-sm text-gray-500 dark:text-gray-400">RAG Dataset</label>
                     <span className="text-base font-medium text-gray-900 dark:text-white">
                     {tempRagSelection !== null ? tempRagSelection : 'None'}
                     </span>
                   </div>
                 
                   <div className="flex justify-between items-center">
                     <label className="text-sm text-gray-500 dark:text-gray-400">Prompt Template</label>
                     <span className="text-base font-medium text-gray-900 dark:text-white">
                       {tempPromptSelection !== null ? tempPromptSelection : 'None'}
                     </span>
                   </div>
                 </div>
               </div>
             </div>
           </div>

           {/* Model Parameters Section */}
           <div className="mt-4 mb-4">
             <button 
               onClick={() => setIsLoadModelParaOpen(!isLoadModelParaOpen)}
               className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
             >
               <span>Parameters</span>
               {isLoadModelParaOpen ? (
                 <ChevronUp className="h-5 w-5 text-slate-400" />
               ) : (
                 <ChevronDown className="h-5 w-5 text-slate-400" />
               )}
             </button>
             
             <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
               isLoadModelParaOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
             }`}>
               <div className="space-y-4 p-4">
                 {/* Search Strategy */}
                 <div className="mb-4">
                   <div className="flex justify-between items-center mb-2">
                     <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                       Search Strategy
                     </label>
                     <div className="flex items-center">
                       <div className={`w-2 h-2 rounded-full mr-2 ${
                         modelLoaded ? 'bg-green-500' : 'bg-gray-400'
                       }`} />
                       <span className="text-sm text-gray-500 dark:text-gray-400">
                         {modelLoaded ? searchStrategy === 'topK' ? 'Top-K' : 'Top-P' : 'Not Set'}
                       </span>
                     </div>
                   </div>
                   <div className="flex space-x-4">
                     <label className="inline-flex items-center">
                       <input
                         type="radio"
                         className="form-radio text-blue-600"
                         name="searchStrategy"
                         value="topK"
                         checked={searchStrategy === 'topK'}
                         onChange={() => setSearchStrategy('topK')}
                       />
                       <span className="ml-2 text-gray-700 dark:text-gray-300">Top-K</span>
                     </label>
                     <label className="inline-flex items-center">
                       <input
                         type="radio"
                         className="form-radio text-blue-600"
                         name="searchStrategy"
                         value="topP"
                         checked={searchStrategy === 'topP'}
                         onChange={() => setSearchStrategy('topP')}
                       />
                       <span className="ml-2 text-gray-700 dark:text-gray-300">Top-P</span>
                     </label>
                   </div>
                 </div>

                 {/* Top-K Slider */}
                 {searchStrategy === 'topK' && (
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Top-K Value (0-100): {topK}
                     </label>
                     <input
                       type="range"
                       min="0"
                       max="100"
                       value={topK}
                       onChange={(e) => setTopK(Number(e.target.value))}
                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                     />
                   </div>
                 )}

                 {/* Top-P Slider */}
                 {searchStrategy === 'topP' && (
                   <div className="mb-4">
                     <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                       Top-P Value (0-1): {topP.toFixed(2)}
                     </label>
                     <input
                       type="range"
                       min="0"
                       max="1"
                       step="0.01"
                       value={topP}
                       onChange={(e) => setTopP(Number(e.target.value))}
                       className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                     />
                   </div>
                 )}

                 {/* Temperature Slider */}
                 <div className="mb-4">
                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                     Temperature (0-1): {temperature.toFixed(2)}
                   </label>
                   <input
                     type="range"
                     min="0"
                     max="1"
                     step="0.01"
                     value={temperature}
                     onChange={(e) => setTemperature(Number(e.target.value))}
                     className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
                   />
                 </div>

                 {/* RHLF toggle that matches the UI in the screenshot */}
<div className="mb-6">
  <div className="flex justify-between items-center mb-1">
    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
    Reinforcement Learning from Human-Feedback (RHLF)
    </label>
    
    <div className="flex items-center">
      <div className="relative inline-block w-10 mr-2 align-middle select-none">
        <input 
          type="checkbox" 
          name="toggle" 
          id="rhlf-toggle" 
          checked={enableRHLF}
          onChange={() => setEnableRHLF(!enableRHLF)}
          className="sr-only"
        />
        <label 
          htmlFor="rhlf-toggle" 
          className={`block overflow-hidden h-6 rounded-full cursor-pointer transition-colors ${
            enableRHLF ? 'bg-blue-500' : 'bg-gray-300'
          }`}
        >
          <span 
            className={`block h-6 w-6 rounded-full bg-white transform transition-transform ${
              enableRHLF ? 'translate-x-4' : 'translate-x-0'
            }`}
          ></span>
        </label>
      </div>
      <span className="text-sm text-gray-500 dark:text-gray-400 min-w-[80px] text-right">
        {enableRHLF ? 'Enabled' : 'Disabled'}
      </span>
    </div>
  </div>
  
  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
    When enabled, allows rating and feedback on model responses
  </p>
</div>

                 {/* Model Status and Load Button */}
                 <div className="mt-4 flex items-center justify-between">
                   <div className="flex items-center space-x-2">
                     <div className={`w-2 h-2 rounded-full ${
                       modelLoaded ? 'bg-green-500' : 
                       modelLoading ? 'bg-yellow-500 animate-pulse' : 
                       modelError ? 'bg-red-500' : 'bg-gray-400'
                     }`} />
                     <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                       {modelLoaded ? 'Ready' : 
                        modelLoading ? 'Loading...' : 
                        modelError ? 'Error' : 'Not Loaded'}
                     </span>
                   </div>
                 
                            <button
  onClick={handleLoadModel}
  disabled={isDisabled || modelLoading}
  className={`px-4 py-2 rounded-lg text-white ${
    isDisabled || modelLoading 
      ? 'bg-gray-400 cursor-not-allowed'
      : 'bg-blue-500 hover:bg-blue-600'
  }`}
>
  Load Model
</button>
                 </div>
               </div>
             </div>
           </div>

           {/* Progress Graph Section */}
           <div className="mt-4">
             <button 
               onClick={() => setIsProgressOpen(!isProgressOpen)}
               className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
             >
               <span>Progress Graph</span>
               {isProgressOpen ? (
                 <ChevronUp className="h-5 w-5 text-gray-500" />
               ) : (
                 <ChevronDown className="h-5 w-5 text-gray-500" />
               )}
             </button>
             
             <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg ${
               isProgressOpen ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
             }`}>
               <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                 <h3 className="text-lg font-semibold mb-4">Training Progress</h3>
                 <div className="flex items-center justify-center mb-4">
                   <div className="flex items-center space-x-8">
                     <div className="flex items-center space-x-2">
                       <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                       <span className="text-sm text-gray-500">Train Loss</span>
                     </div>
                     <div className="flex items-center space-x-2">
                       <div className="w-3 h-3 rounded-full bg-red-500"></div>
                       <span className="text-sm text-gray-500">Validation Loss</span>
                     </div>
                   </div>
                 </div>
                 <div className="w-full h-[300px]">
                   <ResponsiveContainer width="100%" height="100%">
                     <LineChart 
                       data={chartData}
                       margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                     >
                       <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
                       <XAxis 
                         dataKey="timeLabel"
                         className="text-gray-500 dark:text-gray-400"
                         tickLine={false}
                         axisLine={false}
                         tick={{ fontSize: 12 }}
                         label={{ value: 'Time (seconds)', position: 'bottom', offset: 0 }}
                       />
                       <YAxis 
                         className="text-gray-500 dark:text-gray-400"
                         tickLine={false}
                         axisLine={false}
                         tick={{ fontSize: 12 }}
                       />
                       <Tooltip 
                         contentStyle={{ 
                           backgroundColor: 'rgba(255, 255, 255, 0.95)',
                           borderRadius: '8px',
                           border: 'none',
                           boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                         }}
                         cursor={{ strokeWidth: 1 }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="trainLoss" 
                         stroke="#3B82F6"
                         strokeWidth={2.5}
                         dot={true}
                         activeDot={{ r: 8 }}
                       />
                       <Line 
                         type="monotone" 
                         dataKey="validationLoss" 
                         stroke="#EF4444"
                         strokeWidth={2.5}
                         dot={true}
                         activeDot={{ r: 8 }}
                       />
                     </LineChart>
                   </ResponsiveContainer>
                 </div>
               </div>
             </div>
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

     {/* Modals */}
     <Modal 
       isOpen={showRagPopup} 
       onClose={() => {
         setShowRagPopup(false);
         setTempRagSelection(selectedRag);
       }}
       title="Select RAG Dataset"
     >
       <div className="space-y-4">
         <select
           value={tempRagSelection || selectedRag || ''}
           onChange={(e) => setTempRagSelection(e.target.value)}
           className="w-full p-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
         >
           <option value="">Select a dataset</option>
           {ragDb.map((db) => (
        <option key={db.name} value={db.name}>
          {db.name}{ `{${db.vector_db}}`}
        </option>
      ))}
         </select>
         
         <div className="flex justify-end gap-2 mt-4">
           <button
           onClick={() => {
            setShowRagPopup(false);
            setTempRagSelection(null);
          }}
          className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            setSelectedRag(tempRagSelection);
            setShowRagPopup(false);
            // setTempRagSelection(null);
            setIsConfigurationOpen(true);
          }}
          disabled={!tempRagSelection}
          className={`px-4 py-2 text-white rounded-lg ${
            tempRagSelection 
              ? 'bg-blue-500 hover:bg-blue-600' 
              : 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'
          }`}
        >
          Submit
        </button>
      </div>
    </div>
  </Modal>

  <Modal 
  isOpen={showPromptPopup} 
  onClose={() => {
    setShowPromptPopup(false);
    setTempPromptSelection(selectedPrompt);
  }}
  title="Select Prompt Template"
>
  <div className="space-y-4">
    <select
      value={tempPromptSelection || selectedPrompt || ''}
      onChange={(e) => setTempPromptSelection(e.target.value)}
      className="w-full p-2 rounded-md border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
    >
      <option value="">Select a template</option>
      {uniqueLib.map((library) => (
        <option key={library} value={library}>
          {library}
        </option>
      ))}
    </select>
    
    <div className="flex justify-end gap-2 mt-4">
      <button
        onClick={() => {
          setShowPromptPopup(false);
          setTempPromptSelection(null);
        }}
        className="px-4 py-2 text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg"
      >
        Cancel
      </button>
      <button
        onClick={() => {
          setSelectedPrompt(tempPromptSelection);
          setShowPromptPopup(false);
          // setTempPromptSelection(null);
          setIsConfigurationOpen(true);
        }}
        disabled={!tempPromptSelection}
        className={`px-4 py-2 text-white rounded-lg ${
          tempPromptSelection 
            ? 'bg-blue-500 hover:bg-blue-600' 
            : 'bg-gray-300 dark:bg-slate-600 cursor-not-allowed'
        }`}
      >
        Submit
      </button>
    </div>
  </div>
</Modal>
</div>
);
};

export default ModelPlayground;