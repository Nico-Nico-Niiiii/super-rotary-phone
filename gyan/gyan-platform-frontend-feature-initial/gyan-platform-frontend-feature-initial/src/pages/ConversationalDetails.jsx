// import React, { useState, useEffect } from 'react';
// import { 
//   MessageSquarePlus, Database, 
//   ChevronDown, ChevronUp, Check, 
//   PlayCircle, ArrowUp, RotateCcw, X,
//   Book, Settings, Loader 
// } from 'lucide-react';
// import ChatInterface from '../components/ChatInterface';
// import axios from 'axios';

// const MOCK_MODEL_DATA = {
//   name: "Conversational",
//   description: "An advanced language model optimized for natural conversations and dialogue.",
//   metrics: {
//     coherence: 0.94,
//     relevance: 0.92,
//     engagement: 0.89,
//     safety: 0.95
//   }
// };

// const MOCK_RAG_OPTIONS = [
//   { id: 1, name: "Customer Support Knowledge Base" },
//   { id: 2, name: "Product Documentation" },
//   { id: 3, name: "Company Guidelines" },
//   { id: 4, name: "FAQ Database" }
// ];

// const MOCK_PROMPT_OPTIONS = [
//   { id: 1, name: "General Chat Template" },
//   { id: 2, name: "Technical Support Template" },
//   { id: 3, name: "Product Inquiry Template" },
//   { id: 4, name: "Customer Service Template" }
// ];

// const MOCK_PROMPT_LIBRARY = [
//   { id: 1, name: "Common Responses Library" },
//   { id: 2, name: "Technical Solutions Library" },
//   { id: 3, name: "Product Information Library" },
//   { id: 4, name: "FAQ Library" }
// ];

// const Modal = ({ isOpen, onClose, title, children }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
//           <button 
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// };

// const ConversationalDetails = () => {
//   const [models, setModels] = useState([]);
//   const [selectedModel, setSelectedModel] = useState('');
//   const [isModelInfoOpen, setIsModelInfoOpen] = useState(true);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isLoadingModel, setIsLoadingModel] = useState(false);

//   const [showRagPopup, setShowRagPopup] = useState(false);
//   const [showPromptPopup, setShowPromptPopup] = useState(false);
//   const [showLibraryPopup, setShowLibraryPopup] = useState(false);

//   const [selectedRag, setSelectedRag] = useState(null);
//   const [selectedPrompt, setSelectedPrompt] = useState(null);
//   const [selectedLibrary, setSelectedLibrary] = useState(null);

//   const [tempRagSelection, setTempRagSelection] = useState(null);
//   const [tempPromptSelection, setTempPromptSelection] = useState(null);
//   const [tempLibrarySelection, setTempLibrarySelection] = useState(null);

//   const fetchData = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await axios.get('http://10.155.1.236:8006/gyan/api/usecases/chatbot/get_projects?model=ID_GYAN_AIR_PURIFIER');
//       console.log("Response from backend:", response.data);
      
//       if (response.data && Array.isArray(response.data.projects)) {
//         setModels(response.data.projects);
        
//         // Get the previously selected model from localStorage
//         const previousModel = localStorage.getItem('selectedModel');
        
//         // If there's a previously selected model and it exists in the current projects list
//         if (previousModel && response.data.projects.includes(previousModel)) {
//           setSelectedModel(previousModel);
//           await handleProjectClick(previousModel);
//         } else {
//           // If no previous model or it's not in the list, use the last model
//           const lastModel = response.data.projects[response.data.projects.length - 1];
//           if (lastModel) {
//             setSelectedModel(lastModel);
//             await handleProjectClick(lastModel);
//           }
//         }
//       } else {
//         throw new Error("Invalid data format received from server");
//       }
//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setError(err.message || 'Failed to fetch models');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const handleRetry = () => {
//     fetchData();
//   };

//   const handleProjectClick = async (project) => {
//     try {
//       setIsLoadingModel(true);
//       console.log("Loading model:", project);
      
//       try {
//         const response = await axios.post('http://10.155.1.236:8006/gyan/api/usecases/chatbot/load_model?model=ID_GYAN_AIR_PURIFIER', {
//           model: 'ID_GYAN_AIR_PURIFIER',
//           project: project
//         });
//       } catch (err) {
//         // We'll ignore the 500 error since the model still loads
//         console.log("Expected error during model loading:", err);
//       }
      
//       // Update the selected model and save to localStorage
//       setSelectedModel(project);
//       localStorage.setItem('selectedModel', project);
//       setError(null);
      
//     } catch (err) {
//       console.error("Unexpected error loading model:", err);
//       setError('Failed to load model');
//     } finally {
//       setIsLoadingModel(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F7F8FC] dark:bg-gray-900">
//       <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl border-b border-gray-200 dark:border-gray-700">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold text-gray-900 dark:text-white">
//               {MOCK_MODEL_DATA.name}
//             </h1>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Ask your queries</p>
//             {selectedModel && (
//               <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
//                 <strong>Selected Model Version:</strong> {selectedModel}
//               </div>
//             )}
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={() => setShowRagPopup(true)}
//               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
//             >
//               <Database className="w-4 h-4 mr-2" />
//               RAG
//             </button>
//             <button
//               onClick={() => setShowPromptPopup(true)}
//               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
//             >
//               <MessageSquarePlus className="w-4 h-4 mr-2" />
//               Prompts
//             </button>
//             <button
//               onClick={() => setShowLibraryPopup(true)}
//               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
//             >
//               <Book className="w-4 h-4 mr-2" />
//               Library
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="p-4">
//         <div className="grid grid-cols-12 gap-4">
//           <div className="col-span-8 h-[calc(100vh-13rem)]">
//             <div className="h-full">
//               <ChatInterface selectedModel={selectedModel} />
//             </div>
//           </div>

//           <div className="col-span-4 space-y-4">
//             <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
//               <button 
//                 onClick={() => setIsModelInfoOpen(!isModelInfoOpen)}
//                 className="w-full flex justify-between items-center text-base font-semibold text-gray-900 dark:text-white mb-3"
//               >
//                 <span>Select Model</span>
//                 {isModelInfoOpen ? (
//                   <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                 ) : (
//                   <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                 )}
//               </button>

//               {isModelInfoOpen && (
//                 <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
//                   {isLoading ? (
//                     <div className="flex items-center justify-center py-4">
//                       <Loader className="h-6 w-6 text-blue-500 animate-spin" />
//                       <span className="ml-2 text-gray-600 dark:text-gray-400">Loading models...</span>
//                     </div>
//                   ) : error ? (
//                     <div className="text-center py-4">
//                       <p className="text-red-500 mb-2">{error}</p>
//                       <button
//                         onClick={handleRetry}
//                         className="flex items-center justify-center px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg mx-auto"
//                       >
//                         <RotateCcw className="h-4 w-4 mr-2" />
//                         Retry
//                       </button>
//                     </div>
//                   ) : models.length === 0 ? (
//                     <p className="text-center py-4 text-gray-500 dark:text-gray-400">
//                       No models available
//                     </p>
//                   ) : (
//                     <div className="space-y-2">
//                       {models.map((model, index) => (
//                         <button
//                           key={index}
//                           onClick={() => handleProjectClick(model)}
//                           disabled={isLoadingModel}
//                           className={`w-full p-2 text-left rounded-md transition-colors ${
//                             isLoadingModel ? 'cursor-not-allowed opacity-50' :
//                             selectedModel === model
//                               ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
//                               : 'hover:bg-gray-50 dark:hover:bg-gray-700'
//                           }`}
//                         >
//                           <div className="flex items-center justify-between">
//                             <div>
//                               <p className="text-sm font-medium text-gray-900 dark:text-white">
//                                 {model}
//                               </p>
//                             </div>
//                             {selectedModel === model && (
//                               <div className="flex-shrink-0 text-blue-500">
//                                 {isLoadingModel ? (
//                                   <Loader className="h-4 w-4 animate-spin" />
//                                 ) : (
//                                   <Check size={16} />
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
//               <h3 className="font-semibold text-gray-900 dark:text-white">Selected Options</h3>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">RAG Dataset:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {selectedRag?.name || 'None selected'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Prompt Template:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {selectedPrompt?.name || 'None selected'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Prompt Library:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {selectedLibrary?.name || 'None selected'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal components */}
//       <Modal 
//         isOpen={showRagPopup}
//         onClose={() => {
//           setShowRagPopup(false);
//           setTempRagSelection(null);
//         }}
//         title="Select RAG Dataset"
//       >
//         <div className="space-y-4">
//           <select
//             value={tempRagSelection?.id || ''}
//             onChange={(e) => {
//               const selected = MOCK_RAG_OPTIONS.find(opt => opt.id === Number(e.target.value));
//               setTempRagSelection(selected);
//             }}
//             className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select a dataset</option>
//             {MOCK_RAG_OPTIONS.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => {
//                 setShowRagPopup(false);
//                 setTempRagSelection(null);
//               }}
//               className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => {
//                 setSelectedRag(tempRagSelection);
//                 setShowRagPopup(false);
//                 setTempRagSelection(null);
//               }}
//               disabled={!tempRagSelection}
//               className={`px-4 py-2 text-white rounded-lg ${
//                 tempRagSelection 
//                   ? 'bg-blue-500 hover:bg-blue-600' 
//                   : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//               }`}
//             >
//               Confirm
//             </button>
//           </div>
//         </div>
//       </Modal>

//       <Modal 
//         isOpen={showPromptPopup}
//         onClose={() => {
//           setShowPromptPopup(false);
//           setTempPromptSelection(null);
//         }}
//         title="Select Prompt Template"
//       >
//         <div className="space-y-4">
//           <select
//             value={tempPromptSelection?.id || ''}
//             onChange={(e) => {
//               const selected = MOCK_PROMPT_OPTIONS.find(opt => opt.id === Number(e.target.value));
//               setTempPromptSelection(selected);
//             }}
//             className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select a template</option>
//             {MOCK_PROMPT_OPTIONS.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => {
//                 setShowPromptPopup(false);
//                 setTempPromptSelection(null);
//               }}
//               className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => {
//                 setSelectedPrompt(tempPromptSelection);
//                 setShowPromptPopup(false);
//                 setTempPromptSelection(null);
//               }}
//               disabled={!tempPromptSelection}
//               className={`px-4 py-2 text-white rounded-lg ${
//                 tempPromptSelection 
//                   ? 'bg-blue-500 hover:bg-blue-600' 
//                   : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//               }`}
//             >
//               Confirm
//             </button>
//           </div>
//         </div>
//       </Modal>

//       <Modal 
//         isOpen={showLibraryPopup}
//         onClose={() => {
//           setShowLibraryPopup(false);
//           setTempLibrarySelection(null);
//         }}
//         title="Select Prompt Library"
//       >
//         <div className="space-y-4">
//           <select
//             value={tempLibrarySelection?.id || ''}
//             onChange={(e) => {
//               const selected = MOCK_PROMPT_LIBRARY.find(opt => opt.id === Number(e.target.value));
//               setTempLibrarySelection(selected);
//             }}
//             className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select a library</option>
//             {MOCK_PROMPT_LIBRARY.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => {
//                 setShowLibraryPopup(false);
//                 setTempLibrarySelection(null);
//               }}
//               className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => {
//                 setSelectedLibrary(tempLibrarySelection);
//                 setShowLibraryPopup(false);
//                 setTempLibrarySelection(null);
//               }}
//               disabled={!tempLibrarySelection}
//               className={`px-4 py-2 text-white rounded-lg ${
//                 tempLibrarySelection 
//                   ? 'bg-blue-500 hover:bg-blue-600' 
//                   : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//               }`}
//             >
//               Confirm
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ConversationalDetails;

// import React, { useState, useEffect } from 'react';
// import { 
//   MessageSquarePlus, Database, 
//   ChevronDown, ChevronUp, Check, 
//   PlayCircle, ArrowUp, RotateCcw, X,
//   Book, Settings, Loader, Circle
// } from 'lucide-react';
// import ChatInterface from '../components/ChatInterface';
// import axios from 'axios';

// const MOCK_MODEL_DATA = {
//   name: "Conversational",
//   description: "An advanced language model optimized for natural conversations and dialogue.",
//   metrics: {
//     coherence: 0.94,
//     relevance: 0.92,
//     engagement: 0.89,
//     safety: 0.95
//   }
// };

// const MOCK_RAG_OPTIONS = [
//   { id: 1, name: "Customer Support Knowledge Base" },
//   { id: 2, name: "Product Documentation" },
//   { id: 3, name: "Company Guidelines" },
//   { id: 4, name: "FAQ Database" }
// ];

// const MOCK_PROMPT_OPTIONS = [
//   { id: 1, name: "General Chat Template" },
//   { id: 2, name: "Technical Support Template" },
//   { id: 3, name: "Product Inquiry Template" },
//   { id: 4, name: "Customer Service Template" }
// ];

// const MOCK_PROMPT_LIBRARY = [
//   { id: 1, name: "Common Responses Library" },
//   { id: 2, name: "Technical Solutions Library" },
//   { id: 3, name: "Product Information Library" },
//   { id: 4, name: "FAQ Library" }
// ];

// const Modal = ({ isOpen, onClose, title, children }) => {
//   if (!isOpen) return null;
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
//           <button 
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
//           >
//             <X className="h-5 w-5" />
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
// };

// const ConversationalDetails = () => {
//   const [models, setModels] = useState([]);
//   const [selectedModel, setSelectedModel] = useState('');
//   const [isModelInfoOpen, setIsModelInfoOpen] = useState(true);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState(null);
//   const [isLoadingModel, setIsLoadingModel] = useState(false);

//   const [showRagPopup, setShowRagPopup] = useState(false);
//   const [showPromptPopup, setShowPromptPopup] = useState(false);
//   const [showLibraryPopup, setShowLibraryPopup] = useState(false);

//   const [selectedRag, setSelectedRag] = useState(null);
//   const [selectedPrompt, setSelectedPrompt] = useState(null);
//   const [selectedLibrary, setSelectedLibrary] = useState(null);

//   const [tempRagSelection, setTempRagSelection] = useState(null);
//   const [tempPromptSelection, setTempPromptSelection] = useState(null);
//   const [tempLibrarySelection, setTempLibrarySelection] = useState(null);

//   const [loadedModels, setLoadedModels] = useState({});

//   const fetchData = async () => {
//     setIsLoading(true);
//     setError(null);
//     try {
//       const response = await axios.post('http://localhost:8000/chatbot/get_models');
//       console.log("Response from backend:", response.data);
      
//       if (response.data) {
//         setModels(response.data);
        
//         // Get the previously selected model from localStorage
//         // const previousModel = localStorage.getItem('selectedModel');
        
//         // If there's a previously selected model and it exists in the current projects list
//         // if (previousModel && response.data.projects.includes(previousModel)) {
//         //   setSelectedModel(previousModel);
//         //   await handleProjectClick(previousModel);
//         // } 
//         // else {
//         //   // If no previous model or it's not in the list, use the last model
//         //   const lastModel = response.data.projects[response.data.projects.length - 1];
//         //   if (lastModel) {
//         //     setSelectedModel(lastModel);
//         //     await handleProjectClick(lastModel);
//         //   }
//         // }
//       } else {
//         throw new Error("Invalid data format received from server");
//       }
//     } catch (err) {
//       console.error('Error fetching data:', err);
//       setError(err.message || 'Failed to fetch models');
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

//   const handleRetry = () => {
//     fetchData();
//   };

//   const handleModelClick = async (model) => {
//     try {
//       setIsLoadingModel(true);
//       console.log("Loading model:", model);
      
//       // try {
//       //   const response = await axios.post('http://localhost:8000/chatbot/load_model', {
//       //     model: model
//       //   });
//       //   console.log("Loading response", response)

//       // } catch (err) {
//       //   // We'll ignore the 500 error since the model still loads
//       //   console.log("Expected error during model loading:", err);
//       // }
      

//       try {
//         const response = await axios.post('http://localhost:8000/chatbot/load_model', {
//           model: model
//         });
//         console.log("Loading response", response);
        
//         // Set the model as successfully loaded
//         setLoadedModels(prevState => ({
//           ...prevState,
//           [model]: true
//         }));
        
//       } catch (err) {
//         console.log("Error during model loading:", err);
//         // Set the model as failed to load
//         setLoadedModels(prevState => ({
//           ...prevState,
//           [model]: false
//         }));
//       }

//       // Update the selected model and save to localStorage
//       // setSelectedModel(model);
//       // localStorage.setItem('selectedModel', project);
//       setError(null);
      
//     } catch (err) {
//       console.error("Unexpected error loading model:", err);
//       setError('Failed to load model');
//     } finally {
//       setIsLoadingModel(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-[#F7F8FC] dark:bg-gray-900">
//       <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl border-b border-gray-200 dark:border-gray-700">
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-xl font-bold text-gray-900 dark:text-white">
//               {MOCK_MODEL_DATA.name}
//             </h1>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Ask your queries</p>
//             {selectedModel && (
//               <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
//                 <strong>Selected Model Version:</strong> {selectedModel}
//               </div>
//             )}
//           </div>
//           <div className="flex space-x-2">
//             <button
//               onClick={() => setShowRagPopup(true)}
//               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
//             >
//               <Database className="w-4 h-4 mr-2" />
//               RAG
//             </button>
//             <button
//               onClick={() => setShowPromptPopup(true)}
//               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
//             >
//               <MessageSquarePlus className="w-4 h-4 mr-2" />
//               Prompts
//             </button>
//             <button
//               onClick={() => setShowLibraryPopup(true)}
//               className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
//             >
//               <Book className="w-4 h-4 mr-2" />
//               Library
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="p-4">
//         <div className="grid grid-cols-12 gap-4">
//           <div className="col-span-8 h-[calc(100vh-13rem)]">
//             <div className="h-full">
//               <ChatInterface selectedModel={selectedModel} />
//             </div>
//           </div>

//           <div className="col-span-4 space-y-4">
//             <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
//               <button 
//                 onClick={() => setIsModelInfoOpen(!isModelInfoOpen)}
//                 className="w-full flex justify-between items-center text-base font-semibold text-gray-900 dark:text-white mb-3"
//               >
//                 <span>Select Model</span>
//                 {isModelInfoOpen ? (
//                   <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                 ) : (
//                   <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
//                 )}
//               </button>

//               {isModelInfoOpen && (
//                 <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
//                   {isLoading ? (
//                     <div className="flex items-center justify-center py-4">
//                       <Loader className="h-6 w-6 text-blue-500 animate-spin" />
//                       <span className="ml-2 text-gray-600 dark:text-gray-400">Loading models...</span>
//                     </div>
//                   ) : error ? (
//                     <div className="text-center py-4">
//                       <p className="text-red-500 mb-2">{error}</p>
//                       <button
//                         onClick={handleRetry}
//                         className="flex items-center justify-center px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg mx-auto"
//                       >
//                         <RotateCcw className="h-4 w-4 mr-2" />
//                         Retry
//                       </button>
//                     </div>
//                   ) : models.length === 0 ? (
//                     <p className="text-center py-4 text-gray-500 dark:text-gray-400">
//                       No models available
//                     </p>
//                   ) : (
//                     <div className="space-y-2">
//                       {models.map((model, index) => (
//                         <button
//                           key={index}
//                           onClick={() => handleModelClick(model)}
//                           disabled={isLoadingModel}
//                           className={`w-full p-2 text-left rounded-md transition-colors ${
//                             isLoadingModel ? 'cursor-not-allowed opacity-50' :
//                             selectedModel === model
//                               ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
//                               : 'hover:bg-gray-50 dark:hover:bg-gray-700'
//                           }`}
//                         >
//                           <div className="flex items-center justify-between">
//                             <div>
//                               <p className="text-sm font-medium text-gray-900 dark:text-white">
//                                 {model}
//                               </p>
//                             </div>
//                             {selectedModel === model && (
//                               <div className="flex-shrink-0 text-blue-500">
//                                 {isLoadingModel ? (
//                                   <Loader className="h-4 w-4 animate-spin" />
//                                 ) : (
//                                   <Check size={16} />
//                                 )}
//                               </div>
//                             )}
//                           </div>
//                         </button>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>

//             <div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
//               <h3 className="font-semibold text-gray-900 dark:text-white">Selected Options</h3>
//               <div className="space-y-2">
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">RAG Dataset:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {selectedRag?.name || 'None selected'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Prompt Template:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {selectedPrompt?.name || 'None selected'}
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-600 dark:text-gray-400">Prompt Library:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     {selectedLibrary?.name || 'None selected'}
//                   </span>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal components */}
//       <Modal 
//         isOpen={showRagPopup}
//         onClose={() => {
//           setShowRagPopup(false);
//           setTempRagSelection(null);
//         }}
//         title="Select RAG Dataset"
//       >
//         <div className="space-y-4">
//           <select
//             value={tempRagSelection?.id || ''}
//             onChange={(e) => {
//               const selected = MOCK_RAG_OPTIONS.find(opt => opt.id === Number(e.target.value));
//               setTempRagSelection(selected);
//             }}
//             className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select a dataset</option>
//             {MOCK_RAG_OPTIONS.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => {
//                 setShowRagPopup(false);
//                 setTempRagSelection(null);
//               }}
//               className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => {
//                 setSelectedRag(tempRagSelection);
//                 setShowRagPopup(false);
//                 setTempRagSelection(null);
//               }}
//               disabled={!tempRagSelection}
//               className={`px-4 py-2 text-white rounded-lg ${
//                 tempRagSelection 
//                   ? 'bg-blue-500 hover:bg-blue-600' 
//                   : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//               }`}
//             >
//               Confirm
//             </button>
//           </div>
//         </div>
//       </Modal>

//       <Modal 
//         isOpen={showPromptPopup}
//         onClose={() => {
//           setShowPromptPopup(false);
//           setTempPromptSelection(null);
//         }}
//         title="Select Prompt Template"
//       >
//         <div className="space-y-4">
//           <select
//             value={tempPromptSelection?.id || ''}
//             onChange={(e) => {
//               const selected = MOCK_PROMPT_OPTIONS.find(opt => opt.id === Number(e.target.value));
//               setTempPromptSelection(selected);
//             }}
//             className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select a template</option>
//             {MOCK_PROMPT_OPTIONS.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => {
//                 setShowPromptPopup(false);
//                 setTempPromptSelection(null);
//               }}
//               className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => {
//                 setSelectedPrompt(tempPromptSelection);
//                 setShowPromptPopup(false);
//                 setTempPromptSelection(null);
//               }}
//               disabled={!tempPromptSelection}
//               className={`px-4 py-2 text-white rounded-lg ${
//                 tempPromptSelection 
//                   ? 'bg-blue-500 hover:bg-blue-600' 
//                   : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//               }`}
//             >
//               Confirm
//             </button>
//           </div>
//         </div>
//       </Modal>

//       <Modal 
//         isOpen={showLibraryPopup}
//         onClose={() => {
//           setShowLibraryPopup(false);
//           setTempLibrarySelection(null);
//         }}
//         title="Select Prompt Library"
//       >
//         <div className="space-y-4">
//           <select
//             value={tempLibrarySelection?.id || ''}
//             onChange={(e) => {
//               const selected = MOCK_PROMPT_LIBRARY.find(opt => opt.id === Number(e.target.value));
//               setTempLibrarySelection(selected);
//             }}
//             className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
//           >
//             <option value="">Select a library</option>
//             {MOCK_PROMPT_LIBRARY.map((option) => (
//               <option key={option.id} value={option.id}>
//                 {option.name}
//               </option>
//             ))}
//           </select>
//           <div className="flex justify-end gap-2">
//             <button
//               onClick={() => {
//                 setShowLibraryPopup(false);
//                 setTempLibrarySelection(null);
//               }}
//               className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={() => {
//                 setSelectedLibrary(tempLibrarySelection);
//                 setShowLibraryPopup(false);
//                 setTempLibrarySelection(null);
//               }}
//               disabled={!tempLibrarySelection}
//               className={`px-4 py-2 text-white rounded-lg ${
//                 tempLibrarySelection 
//                   ? 'bg-blue-500 hover:bg-blue-600' 
//                   : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
//               }`}
//             >
//               Confirm
//             </button>
//           </div>
//         </div>
//       </Modal>
//     </div>
//   );
// };

// export default ConversationalDetails;





import React, { useState, useEffect, useCallback } from 'react';
import { 
  MessageSquarePlus, Database, 
  ChevronDown, ChevronUp, Check, 
  PlayCircle, ArrowUp, RotateCcw, X,
  Book, Settings, Loader, Circle
} from 'lucide-react';
import ChatInterface from '../components/ChatInterface';
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

const MOCK_MODEL_DATA = {
  name: "Conversational",
  description: "An advanced language model optimized for natural conversations and dialogue.",
  metrics: {
    coherence: 0.94,
    relevance: 0.92,
    engagement: 0.89,
    safety: 0.95
  }
};

const MOCK_RAG_OPTIONS = [
  { id: 1, name: "Customer Support Knowledge Base" },
  { id: 2, name: "Product Documentation" },
  { id: 3, name: "Company Guidelines" },
  { id: 4, name: "FAQ Database" }
];

const MOCK_PROMPT_OPTIONS = [
  { id: 1, name: "General Chat Template" },
  { id: 2, name: "Technical Support Template" },
  { id: 3, name: "Product Inquiry Template" },
  { id: 4, name: "Customer Service Template" }
];

const MOCK_PROMPT_LIBRARY = [
  { id: 1, name: "Common Responses Library" },
  { id: 2, name: "Technical Solutions Library" },
  { id: 3, name: "Product Information Library" },
  { id: 4, name: "FAQ Library" }
];

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};


 // Update the PromptSuggestions component
 const PromptSuggestions = ({ onSelect, onClose,selectedPrompt }) => {
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
              onClick={() => setShowPromptPopup(true)}
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




const ConversationalDetails = () => {
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [loadedModels, setLoadedModels] = useState({});

  const [showRagPopup, setShowRagPopup] = useState(false);
  const [showPromptPopup, setShowPromptPopup] = useState(false);
  const [showLibraryPopup, setShowLibraryPopup] = useState(false);

  const [selectedRag, setSelectedRag] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedLibrary, setSelectedLibrary] = useState(null);

  const [tempRagSelection, setTempRagSelection] = useState(null);
  const [tempPromptSelection, setTempPromptSelection] = useState(null);
  const [tempLibrarySelection, setTempLibrarySelection] = useState(null);

  const [enableRHLF, setEnableRHLF] = useState(false);
  const [uniqueLib, setUniqueLib] = useState([]);
  const [ragDb, setRagDb] = useState([]);

  const [ragRLFH, setRagRLHF] = useState([]);
  const [selectedRagRLHF, setSelectedRagRLHF] = useState(null);


  // rag loading
  // Add state variables
const [loadedRags, setLoadedRags] = useState({});
const [isLoadingRag, setIsLoadingRag] = useState(false);

// Add function to load RAG database
const handleLoadRagDatabase = async (ragName) => {
  if (!ragName) return;
  
  try {
    setIsLoadingRag(true);
    
    // Call the backend endpoint
    const response = await api.post(`http://localhost:8000/rag/test/load`, {
      rag_name: ragName
    });
    
    if (response.data && response.data.success) {
      setLoadedRags(prevState => ({
        ...prevState,
        [ragName]: true
      }));
    } else {
      setLoadedRags(prevState => ({
        ...prevState,
        [ragName]: false
      }));
    }
  } catch (err) {
    console.error("Error loading RAG database:", err);
    setLoadedRags(prevState => ({
      ...prevState,
      [ragName]: false
    }));
  } finally {
    setIsLoadingRag(false);
  }
};

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://localhost:8000/chatbot/get_models');
      console.log("Response from backend:", response.data);
      
      if (response.data) {
        const filteredModels = response.data.filter(model => model === "AP-V1.2");
        setModels(filteredModels);
        // setModels(response.data);
      } else {
        throw new Error("Invalid data format received from server");
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message || 'Failed to fetch models');
    } finally {
      setIsLoading(false);
    }
  };

 

  // useEffect(() => {
  //   fetchData();
  //   return () => {
  //     if (selectedModel && loadedModels[selectedModel]) {
  //       console.log(`Unloading model ${selectedModel} on component unmount`);
  //       unloadModel();
  //     }
  //   };
  // }, []);  


  

  // useEffect(() => {
  //   return () => {
  //     if (selectedModel) {
  //       unloadModel();
  //       console.log(`Unloading model ${selectedModel} on component unmount`);
  //     }
  //   };
  // }, []);  

  const handleRetry = () => {
    fetchData();
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
    setRagRLHF(response.data);
    
   }


  //  const unloadModel = async () => {
  //   if (!selectedModel) return;
    
  //   try {
  //     setIsLoadingModel(true);
      
  //     // Call the backend endpoint to unload the model
  //     const response = await axios.post('http://localhost:8000/chatbot/unload_model');
  //     console.log("response", response.data);
      
  //     if (response.data && response.data.success) {
  //       // Update the loaded models state to reflect the unloaded model
  //       setLoadedModels(prevState => ({
  //         ...prevState,
  //         [selectedModel]: false
  //       }));
  //       console.log(`Model ${selectedModel} successfully unloaded`);
  //     } else {
  //       console.error("Failed to unload model:", response.data?.error || "Unknown error");
  //     }
  //   } catch (err) {
  //     console.error("Error unloading model:", err);
  //   } finally {
  //     setIsLoadingModel(false);
  //   }
  // };

  const unloadModel = useCallback(async () => {
    if (!selectedModel) return;
    
    try {
      setIsLoadingModel(true);
      
      // Call the backend endpoint to unload the model
      const response = await axios.post('http://localhost:8000/chatbot/unload_model');
      console.log("Unload response:", response.data);
      
      if (response.data && response.data.success) {
        // Update the loaded models state
        setLoadedModels(prevState => ({
          ...prevState,
          [selectedModel]: false
        }));
        console.log(`Model ${selectedModel} successfully unloaded`);
      } else {
        console.error("Failed to unload model:", response.data?.error || "Unknown error");
      }
    } catch (err) {
      console.error("Error unloading model:", err);
    } finally {
      setIsLoadingModel(false);
    }
  }, [selectedModel]);

  useEffect(() => {
    fetchData();
    
   
    return () => {
      if (selectedModel && loadedModels[selectedModel]) {
        console.log(`Unloading model ${selectedModel} on component unmount`);
        unloadModel();
      }
    };
  }, [selectedModel, loadedModels, unloadModel]); 

  const handleModelClick = async (model) => {
    try {
      setIsLoadingModel(true);
      setSelectedModel(model);
      console.log("Loading model:", model);
      
      try {
        const response = await axios.post('http://localhost:8000/chatbot/load_model', {
          model: model
        });
        console.log("Loading response", response);
        
        // Set the model as successfully loaded
        setLoadedModels(prevState => ({
          ...prevState,
          [model]: true
        }));
        
      } catch (err) {
        console.log("Error during model loading:", err);
        // Set the model as failed to load
        setLoadedModels(prevState => ({
          ...prevState,
          [model]: false
        }));
      }
      
      setError(null);
      
    } catch (err) {
      console.error("Unexpected error loading model:", err);
      setError('Failed to load model');
      // Set the model as failed to load
      setLoadedModels(prevState => ({
        ...prevState,
        [model]: false
      }));
    } finally {
      setIsLoadingModel(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 px-4 py-3 rounded-xl border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {MOCK_MODEL_DATA.name}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Ask your queries</p>
            {selectedModel && (
              <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                <strong>Selected Model Version:</strong> {selectedModel}
              </div>
            )}
          </div>
          <div className="flex space-x-2">
          <button 
              onClick={() => setShowRagPopup(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 text-sm"
            >
              <Database size={16} />
              Add RAG
            </button>
            <button 
  onClick={unloadModel}
  className="px-4 py-2 text-white bg-red-500 hover:bg-red-600 rounded-lg"
>
  Unload Model
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
      </div>

      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
       
          <div className="col-span-8 h-[calc(100vh-13rem)]">
  <div className="h-full">
    <ChatInterface
      selectedModel={selectedModel}
      enableRHLF={enableRHLF}
      selectedPrompt={selectedPrompt}
      onChangeLibrary={() => setShowPromptPopup(true)}
      selectedRagRLHF = {selectedRagRLHF}
      selectedRag = {selectedRag}
      ragDb = {ragDb}
      
    />
  </div>
</div>

          <div className="col-span-4 space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-3">
              <button 
                onClick={() => setIsModelInfoOpen(!isModelInfoOpen)}
                className="w-full flex justify-between items-center text-base font-semibold text-gray-900 dark:text-white mb-3"
              >
                <span>Select Model</span>
                {isModelInfoOpen ? (
                  <ChevronUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                )}
              </button>

              {isModelInfoOpen && (
                <div className="max-h-[260px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader className="h-6 w-6 text-blue-500 animate-spin" />
                      <span className="ml-2 text-gray-600 dark:text-gray-400">Loading models...</span>
                    </div>
                  ) : error ? (
                    <div className="text-center py-4">
                      <p className="text-red-500 mb-2">{error}</p>
                      <button
                        onClick={handleRetry}
                        className="flex items-center justify-center px-4 py-2 text-sm text-white bg-blue-500 hover:bg-blue-600 rounded-lg mx-auto"
                      >
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Retry
                      </button>
                    </div>
                  ) : models.length === 0 ? (
                    <p className="text-center py-4 text-gray-500 dark:text-gray-400">
                      No models available
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {models.map((model, index) => (
                        <button
                          key={index}
                          onClick={() => handleModelClick(model)}
                          disabled={isLoadingModel && selectedModel === model}
                          className={`w-full p-2 text-left rounded-md transition-colors ${
                            isLoadingModel && selectedModel === model ? 'cursor-not-allowed opacity-50' :
                            selectedModel === model
                              ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800'
                              : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center">
                              {/* Status indicator dot */}
                              {loadedModels[model] !== undefined && (
                                <Circle 
                                  className={`h-3 w-3 mr-2 fill-current ${
                                    loadedModels[model] ? 'text-green-500' : 'text-red-500'
                                  }`} 
                                />
                              )}
                              <p className="text-sm font-medium text-gray-900 dark:text-white">
                                {model}
                              </p>
                            </div>
                            {selectedModel === model && (
                              <div className="flex-shrink-0 text-blue-500">
                                {isLoadingModel ? (
                                  <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check size={16} />
                                )}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>


<div className="bg-white dark:bg-gray-800 rounded-xl p-4 space-y-3">
  <h3 className="font-semibold text-gray-900 dark:text-white">Selected Options</h3>
  <div className="space-y-2">
   
    <div className="flex justify-between items-center">
  <span className="text-sm text-gray-600 dark:text-gray-400">RAG Dataset:</span>
  <div className="flex items-center">
    {isLoadingRag && selectedRag ? (
      <Loader className="h-3 w-3 mr-2 text-blue-500 animate-spin" />
    ) : selectedRag && loadedRags[selectedRag] !== undefined ? (
      <Circle 
        className={`h-3 w-3 mr-2 fill-current ${
          loadedRags[selectedRag] ? 'text-green-500' : 'text-red-500'
        }`} 
      />
    ) : null}
    <span className="text-sm font-medium text-gray-900 dark:text-white">
      {selectedRag || 'None selected'}
    </span>
  </div>
</div>
    <div className="flex justify-between items-center">
      <span className="text-sm text-gray-600 dark:text-gray-400">Prompt Template:</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">
        {selectedPrompt || 'None selected'}
      </span>
    </div>
   

{/* RHLF toggle that matches the UI in the screenshot */}
<div className="mb-6 pt-6">
  <div className="flex justify-between items-center mb-1 ">
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

  {/* Enhanced RLHF with RAG section */}
  {enableRHLF && (
    <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-2">
        Enhance your RLHF with RAG
      </p>
      
      <select
        value={selectedRagRLHF || ''}
        onChange={(e) => setSelectedRagRLHF(e.target.value)}
        className="w-full p-2 text-sm rounded-md border border-gray-300 dark:border-gray-600 
                  bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
      >
        <option value="">Select a RAG dataset</option>
        {ragRLFH.map((option) => (
          <option key={option.name} value={option.name}>
            {option.name}
          </option>
        ))}
      </select>
      
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        RAG integration improves response quality by providing relevant context
      </p>
    </div>
  )}
</div>




  </div>
</div>
          </div>
        </div>
      </div>

      {/* Modal components */}
      {/* Rag modal */}
      <Modal 
        isOpen={showRagPopup}
        onClose={() => {
          setShowRagPopup(false);
          setTempRagSelection(null);
        }}
        title="Select RAG Dataset"
      >
        <div className="space-y-4">
          <select
            value={tempRagSelection || selectedRag || ''}
            onChange={(e) => setTempRagSelection(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a dataset</option>
            {ragDb.map((option) => (
              <option key={option.name} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRagPopup(false);
                setTempRagSelection(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            {/* <button
              onClick={() => {
                setSelectedRag(tempRagSelection);
                setShowRagPopup(false);
                setTempRagSelection(null);
              }}
              disabled={!tempRagSelection}
              className={`px-4 py-2 text-white rounded-lg ${
                tempRagSelection 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Confirm
            </button> */}
            <button
  onClick={() => {
    setSelectedRag(tempRagSelection);
    if (tempRagSelection) {
      handleLoadRagDatabase(tempRagSelection);
    }
    setShowRagPopup(false);
    setTempRagSelection(null);
  }}
  disabled={!tempRagSelection}
  className={`px-4 py-2 text-white rounded-lg ${
    tempRagSelection 
      ? 'bg-blue-500 hover:bg-blue-600' 
      : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
  }`}
>
  Confirm
</button>
          </div>
        </div>
      </Modal>

      
 {/* prompt modal */}
      <Modal 
        isOpen={showPromptPopup}
        onClose={() => {
          setShowPromptPopup(false);
          setTempPromptSelection(null);
          setSelectedPrompt(null);
        }}
        title="Select Prompt Template"
      >
        <div className="space-y-4">
          <select
            value={tempPromptSelection || selectedPrompt  || ''}
            onChange={(e) => setTempPromptSelection(e.target.value)}
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a template</option>
            {uniqueLib.map((library) => (
              <option key={library} value={library}>
                {library}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowPromptPopup(false);
                setTempPromptSelection(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSelectedPrompt(tempPromptSelection);
                setShowPromptPopup(false);
                setTempPromptSelection(null);
              }}
              // disabled={!tempPromptSelection}
              className={`px-4 py-2 text-white rounded-lg ${
                tempPromptSelection 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

     
    </div>
  );
};

export default ConversationalDetails;