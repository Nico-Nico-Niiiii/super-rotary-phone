// import { useState, useEffect } from 'react';
// import { X, Check, Upload } from 'lucide-react';

// const GyanRagModal = ({ isOpen, onClose, onSubmit }) => {



//     const initialStepsValidation = {
//         1: false,
//         2: false,
//         3: false,
//         4: false
//       };

//   const [currentStep, setCurrentStep] = useState(1);
//   const [formError, setFormError] = useState(null);
//   const initialFormState = {
//     name: '',
//     dataset: null,
//     ragType: '',
//     llmModel: '',
//     embeddingModel: '',
//     chunkingOption: '',
//     vectorDb: '',
//     searchOption: ''
//   };
//   const [formData, setFormData] = useState(initialFormState);
//   const [nameError, setNameError] = useState('');


//   const [stepsValidation, setStepsValidation] = useState(initialStepsValidation);

//   const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
//   const fileUploadStyles = "w-4/5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center";

//   const validateRagName = (name) => {
//     if (name.length < 3) {
//       return 'RAG name must be at least 3 characters long';
//     }
//     if (name.length > 10) {
//       return 'RAG name must not exceed 10 characters';
//     }
//     if (!/^[A-Za-z]/.test(name)) {
//       return 'RAG name must start with a letter';
//     }
//     if (/\s/.test(name)) {
//       return 'RAG name cannot contain spaces';
//     }
//     if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
//       return 'RAG name can only contain letters, numbers, hyphens (-) and underscores (_)';
//     }
//     return '';
//   };

//   const validateStep1 = () => {
//     const isValid = formData.name && !nameError && formData.dataset && !formError;
//     setStepsValidation(prev => ({...prev, 1: isValid}));
//     return isValid;
//   };

//   const validateStep2 = () => {
//     const isValid = formData.ragType && formData.llmModel && formData.embeddingModel;
//     setStepsValidation(prev => ({...prev, 2: isValid}));
//     return isValid;
//   };

//   const validateStep3 = () => {
//     const isValid = formData.chunkingOption && formData.vectorDb && formData.searchOption;
//     setStepsValidation(prev => ({...prev, 3: isValid}));
//     return isValid;
//   };

//   const validateStep4 = () => {
//     const isValid = validateStep1() && validateStep2() && validateStep3();
//     setStepsValidation(prev => ({...prev, 4: isValid}));
//     return isValid;
//   };

//   const handleNameChange = (e) => {
//     const newName = e.target.value;
//     setFormData({ ...formData, name: newName });
//     setNameError(validateRagName(newName));
//     validateStep1();
//   };

//   useEffect(() => {
//     if (!isOpen) {
//       setFormData(initialFormState);
//       setCurrentStep(1);
//       setFormError(null);
//       setNameError('');
//       setStepsValidation(initialStepsValidation);
//     }
//   }, [isOpen]);

//   const SidebarTabs = () => {
//     const tabs = [
//       { id: 1, label: 'Basic Details' },
//       { id: 2, label: 'Model Selection' },
//       { id: 3, label: 'Configuration' },
//       { id: 4, label: 'Review' }
//     ];

//     return (
//       <div className="w-48 border-r border-gray-200 dark:border-gray-700">
//         {tabs.map((tab) => (
//           <div
//             key={tab.id}
//             onClick={() => {
//               if (tab.id <= currentStep || stepsValidation[tab.id - 1]) {
//                 setCurrentStep(tab.id);
//               }
//             }}
//             className={`flex items-center justify-between px-4 py-3 cursor-pointer 
//               ${currentStep === tab.id 
//                 ? 'bg-gray-100 dark:bg-gray-700/50 border-l-2 border-primary-light' 
//                 : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
//           >
//             <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//               {tab.label}
//             </span>
//             {stepsValidation[tab.id] && (
//               <Check size={16} className="text-green-500" />
//             )}
//           </div>
//         ))}
//       </div>
//     );
//   };

//   const renderStepContent = () => {
//     switch (currentStep) {
//       case 1:
//         return (
//           <div className="flex flex-col items-start space-y-4">
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 RAG Database Name
//               </label>
//               <input
//                 type="text"
//                 required
//                 value={formData.name}
//                 onChange={handleNameChange}
//                 className={`${inputStyles} ${nameError ? 'border-red-500' : ''}`}
//                 placeholder="Enter RAG DB name"
//               />
//               {nameError && (
//                 <p className="text-red-500 text-xs mt-1">{nameError}</p>
//               )}
//             </div>
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium self-start pl-[10%] text-gray-700 dark:text-gray-300 mb-1">
//                 Upload Dataset (ZIP only)
//               </label>
//               <div className={fileUploadStyles}>
//                 <input
//                   type="file"
//                   id="dataset"
//                   className="hidden"
//                   onChange={(e) => {
//                     const file = e.target.files[0];
//                     if (!file) return;
                    
//                     if (!file.name.endsWith('.zip')) {
//                       setFormError('Please upload a ZIP file');
//                       return;
//                     }

//                     setFormError(null);
//                     setFormData({ ...formData, dataset: file });
//                     validateStep1();
//                   }}
//                   accept=".zip"
//                 />
//                 <label htmlFor="dataset" className="cursor-pointer flex flex-col items-center">
//                   <Upload className="h-6 w-6 text-gray-400 mb-1" />
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     {formData.dataset ? formData.dataset.name : 'Drag ZIP file here or'}
//                   </span>
//                   <button className="text-primary-light hover:text-primary-dark mt-1 text-sm">
//                     Browse
//                   </button>
//                 </label>
//               </div>
//             </div>
//           </div>
//         );

//       case 2:
//         return (
//           <div className="flex flex-col items-center space-y-4">
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 RAG Type
//               </label>
//               <select
//                 required
//                 value={formData.ragType}
//                 onChange={(e) => {
//                   setFormData({ ...formData, ragType: e.target.value });
//                   validateStep2();
//                 }}
//                 className={inputStyles}
//               >
//                 <option value="">Select RAG type</option>
//                 {['standard', 'graph', 'adaptive', 'raptor', 'iterative', 'corrective'].map(type => (
//                   <option key={type} value={type}>{type}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 LLM Model
//               </label>
//               <select
//                 required
//                 value={formData.llmModel}
//                 onChange={(e) => {
//                   setFormData({ ...formData, llmModel: e.target.value });
//                   validateStep2();
//                 }}
//                 className={inputStyles}
//               >
//                 <option value="">Select LLM model</option>
//                 {["google/flan-t5-large", "google/flan-t5-base", "t5-small"].map(model => (
//                   <option key={model} value={model}>{model}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 Embedding Model
//               </label>
//               <select
//                 required
//                 value={formData.embeddingModel}
//                 onChange={(e) => {
//                   setFormData({ ...formData, embeddingModel: e.target.value });
//                   validateStep2();
//                 }}
//                 className={inputStyles}
//               >
//                 <option value="">Select embedding model</option>
//                 {[
//                   "sentence-transformers/all-MiniLM-L6-v2",
//                   "Alibaba-NLP/gte-large-en-v1.5",
//                   "intfloat/e5-large-v2",
//                   "BAAI/bge-large-en-v1.5"
//                 ].map(model => (
//                   <option key={model} value={model}>{model}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         );

//       case 3:
//         return (
//           <div className="flex flex-col items-center space-y-4">
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 Chunking Option
//               </label>
//               <select
//                 required
//                 value={formData.chunkingOption}
//                 onChange={(e) => {
//                   setFormData({ ...formData, chunkingOption: e.target.value });
//                   validateStep3();
//                 }}
//                 className={inputStyles}
//               >
//                 <option value="">Select chunking option</option>
//                 {["recursive", "semantic", "sentence", "token", "fixed", "agentic"].map(option => (
//                   <option key={option} value={option}>{option}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 Vector Database
//               </label>
//               <select
//                 required
//                 value={formData.vectorDb}
//                 onChange={(e) => {
//                   setFormData({ ...formData, vectorDb: e.target.value });
//                   validateStep3();
//                 }}
//                 className={inputStyles}
//               >
//                 <option value="">Select vector database</option>
//                 {["weaviate", "chromadb", "faiss", "pinecone"].map(db => (
//                   <option key={db} value={db}>{db}</option>
//                 ))}
//               </select>
//             </div>
//             <div className="w-full flex flex-col items-center">
//               <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
//                 Search Option
//               </label>
//               <select
//                 required
//                 value={formData.searchOption}
//                 onChange={(e) => {
//                   setFormData({ ...formData, searchOption: e.target.value });
//                   validateStep3();
//                 }}
//                 className={inputStyles}
//               >
//                 <option value="">Select search option</option>
//                 {["hnsw", "faiss", "brute_force", "annoy"].map(option => (
//                   <option key={option} value={option}>{option}</option>
//                 ))}
//               </select>
//             </div>
//           </div>
//         );

//       case 4:
//         return (
//           <div className="flex flex-col items-center space-y-3">
//             <h3 className="font-medium text-base mb-4">Review Configuration</h3>
//             <div className="space-y-2 text-sm w-4/5">
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">Database Name:</span>
//                 <span className="font-medium">{formData.name}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">Dataset:</span>
//                 <span className="font-medium">{formData.dataset?.name || 'No file selected'}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">RAG Type:</span>
//                 <span className="font-medium">{formData.ragType || '-'}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">LLM Model:</span>
//                 <span className="font-medium">{formData.llmModel || '-'}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">Embedding Model:</span>
//                 <span className="font-medium">{formData.embeddingModel || '-'}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">Chunking Option:</span>
//                 <span className="font-medium">{formData.chunkingOption || '-'}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">Vector Database:</span>
//                 <span className="font-medium">{formData.vectorDb || '-'}</span>
//               </div>
//               <div className="flex justify-between py-1 border-b dark:border-gray-700">
//                 <span className="text-gray-600 dark:text-gray-400">Search Option:</span>
//                 <span className="font-medium">{formData.searchOption || '-'}</span>
//               </div>
//             </div>
//           </div>
//         );

//       default:
//         return null;
//     }
//   };

//   const handleNext = () => {
//     let isValid = false;
//     switch (currentStep) {
//       case 1:
//         isValid = validateStep1();
//         break;
//       case 2:
//         isValid = validateStep2();
//         break;
//       case 3:
//         isValid = validateStep3();
//         break;
//       default:
//         break;
//     }

//     if (isValid && currentStep < 4) {
//       setCurrentStep(prev => prev + 1);
//     } else if (!isValid) {
//       setFormError('Please fill all required fields before proceeding');
//     }
//   };

//   const handleBack = () => {
//     if (currentStep > 1) {
//       setCurrentStep(prev => prev - 1);
//     }
//   };

//   const handleSubmit = async () => {
//     try {
//       setFormError(null);
//       const error = validateRagName(formData.name);
//       if (error) {
//         setNameError(error);
//         return;
//       }

//       // Validate all steps
//       const step1Valid = validateStep1();
//       const step2Valid = validateStep2();
//       const step3Valid = validateStep3();

//       if (!step1Valid || !step2Valid || !step3Valid) {
//         setFormError('Please complete all required fields in each step');
//         return;
//       }

//       // Format data for submission
//       const ragData = {
//         name: formData.name,
//         dataset: formData.dataset,
//         dataset_path: formData.dataset?.name || null,
//         rag_type: formData.ragType,
//         llm_model: formData.llmModel,
//         embedding_model: formData.embeddingModel,
//         chunking_option: formData.chunkingOption,
//         vector_db: formData.vectorDb,
//         search_option: formData.searchOption,
//         status: 'Created'
//       };

//       await onSubmit(ragData);
//       onClose();
//     } catch (error) {
//       setFormError(error.response?.data?.detail || 'Failed to create RAG configuration');
//     }
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl p-5 relative">
//         <button 
//           onClick={onClose}
//           className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//         >
//           <X size={18} />
//         </button>

//         {formError && (
//           <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//             {formError}
//           </div>
//         )}

//         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//           Create New RAG Configuration
//         </h2>

//         <div className="flex min-h-[400px]">
//           <SidebarTabs />

//           <div className="flex-1 pl-6">
//             <div className="w-full">
//               {renderStepContent()}
//             </div>

//             <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 w-full">
//               <div className="flex space-x-3">
//                 {currentStep > 1 && (
//                   <button
//                     type="button"
//                     onClick={handleBack}
//                     className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
//                   >
//                     Back
//                   </button>
//                 )}
//                 {currentStep === 4 ? (
//                   <button
//                     type="button"
//                     onClick={handleSubmit}
//                     disabled={!Object.values(stepsValidation).every(v => v)}
//                     className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
//                       !Object.values(stepsValidation).every(v => v) 
//                         ? 'opacity-50 cursor-not-allowed' 
//                         : 'hover:bg-primary-dark'
//                     }`}
//                   >
//                     Create RAG Configuration
//                   </button>
//                 ) : (
//                   <button
//                     type="button"
//                     onClick={handleNext}
//                     className="px-3 py-1.5 bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors duration-200 text-sm"
//                   >
//                     Next
//                   </button>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default GyanRagModal;








// latest code
import { useState, useEffect } from 'react';
import { X, Check, Upload } from 'lucide-react';
import endpoints from "../endpoints.json"
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});
// delete api.defaults.headers.common['Content-Type'];

const GyanRagModal = ({ isOpen, onClose, onSubmit }) => {

    const [uploadProgress, setUploadProgress] = useState(0);
  const initialStepsValidation = {
    1: false,
    2: false,
    3: false,
    4: false
  };

  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const initialFormState = {
    name: '',
    dataset: null,
    ragType: '',
    llmModel: '',
    embeddingModel: '',
    chunkingOption: '',
    vectorDb: '',
    searchOption: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [nameError, setNameError] = useState('');
  const [stepsValidation, setStepsValidation] = useState(initialStepsValidation);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
  const fileUploadStyles = "w-4/5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center";

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setCurrentStep(1);
      setFormError(null);
      setNameError('');
      setStepsValidation(initialStepsValidation);
      setIsSubmitting(false);
    }
  }, [isOpen]);


  // Add this to your handleSubmit function's axios config
const config = {
    onUploadProgress: (progressEvent) => {
      const percentCompleted = Math.round(
        (progressEvent.loaded * 100) / progressEvent.total
      );
      setUploadProgress(percentCompleted);
    }
  };

  const validateRagName = (name) => {
    if (name.length < 3) {
      return 'RAG name must be at least 3 characters long';
    }
    if (name.length > 10) {
      return 'RAG name must not exceed 10 characters';
    }
    if (!/^[A-Za-z]/.test(name)) {
      return 'RAG name must start with a letter';
    }
    if (/\s/.test(name)) {
      return 'RAG name cannot contain spaces';
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
      return 'RAG name can only contain letters, numbers, hyphens (-) and underscores (_)';
    }
    return '';
  };

  const validateStep1 = () => {
    const isValid = formData.name && !nameError && formData.dataset && !formError;
    setStepsValidation(prev => ({...prev, 1: isValid}));
    return isValid;
  };

  const validateStep2 = () => {
    const isValid = formData.ragType && formData.llmModel && formData.embeddingModel;
    setStepsValidation(prev => ({...prev, 2: isValid}));
    return isValid;
  };

  const validateStep3 = () => {
    const isValid = formData.chunkingOption && formData.vectorDb && formData.searchOption;
    setStepsValidation(prev => ({...prev, 3: isValid}));
    return isValid;
  };

  const validateStep4 = () => {
    const isValid = validateStep1() && validateStep2() && validateStep3();
    setStepsValidation(prev => ({...prev, 4: isValid}));
    return isValid;
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    setNameError(validateRagName(newName));
    validateStep1();
  };

  const SidebarTabs = () => {
    const tabs = [
      { id: 1, label: 'Basic Details' },
      { id: 2, label: 'Model Selection' },
      { id: 3, label: 'Configuration' },
      { id: 4, label: 'Review' }
    ];

    return (
      <div className="w-48 border-r border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              if (tab.id <= currentStep || stepsValidation[tab.id - 1]) {
                setCurrentStep(tab.id);
              }
            }}
            className={`flex items-center justify-between px-4 py-3 cursor-pointer 
              ${currentStep === tab.id 
                ? 'bg-gray-100 dark:bg-gray-700/50 border-l-2 border-primary-light' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {tab.label}
            </span>
            {stepsValidation[tab.id] && (
              <Check size={16} className="text-green-500" />
            )}
          </div>
        ))}
      </div>
    );
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="flex flex-col items-start space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                RAG Database Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`${inputStyles} ${nameError ? 'border-red-500' : ''}`}
                placeholder="Enter RAG DB name"
              />
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium self-start pl-[10%] text-gray-700 dark:text-gray-300 mb-1">
                Upload Dataset (ZIP only)
              </label>
              <div className={fileUploadStyles}>
                {/* <input
                  type="file"
                  id="dataset"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    
                    if (!file.name.endsWith('.zip')) {
                      setFormError('Please upload a ZIP file');
                      return;
                    }

                    setFormError(null);
                    setFormData({ ...formData, dataset: file });
                    validateStep1();
                  }}
                  accept=".zip"
                /> */}
                <input
  type="file"
  id="dataset"
  className="hidden"
  onChange={(e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.name.endsWith('.zip')) {
      setFormError('Please upload a ZIP file');
      return;
    }

    // Validate file size (example: 100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      setFormError('File size must be less than 100MB');
      return;
    }

    setFormError(null);
    setFormData({ ...formData, dataset: file });
    validateStep1();
  }}
  accept=".zip"
/>
                <label htmlFor="dataset" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.dataset ? formData.dataset.name : 'Drag ZIP file here or'}
                  </span>
                  <button className="text-primary-light hover:text-primary-dark mt-1 text-sm">
                    Browse
                  </button>
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                RAG Type
              </label>
              <select
                required
                value={formData.ragType}
                onChange={(e) => {
                  setFormData({ ...formData, ragType: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select RAG type</option>
                {['standard', 'graph', 'adaptive', 'raptor', 'iterative', 'corrective'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                LLM Model
              </label>
              <select
                required
                value={formData.llmModel}
                onChange={(e) => {
                  setFormData({ ...formData, llmModel: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select LLM model</option>
                {["google/flan-t5-large", "google/flan-t5-base", "t5-small"].map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Embedding Model
              </label>
              <select
                required
                value={formData.embeddingModel}
                onChange={(e) => {
                  setFormData({ ...formData, embeddingModel: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select embedding model</option>
                {[
                  "sentence-transformers/all-MiniLM-L6-v2",
                  "Alibaba-NLP/gte-large-en-v1.5",
                  "intfloat/e5-large-v2",
                  "BAAI/bge-large-en-v1.5"
                ].map(model => (
                  <option key={model} value={model}>{model}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Chunking Option
              </label>
              <select
                required
                value={formData.chunkingOption}
                onChange={(e) => {
                  setFormData({ ...formData, chunkingOption: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select chunking option</option>
                {["recursive", "semantic", "sentence", "token", "fixed", "agentic"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Vector Database
              </label>
              <select
                required
                value={formData.vectorDb}
                onChange={(e) => {
                  setFormData({ ...formData, vectorDb: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select vector database</option>
                {["weaviate", "chromadb", "faiss", "pinecone"].map(db => (
                  <option key={db} value={db}>{db}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Search Option
              </label>
              <select
                required
                value={formData.searchOption}
                onChange={(e) => {
                  setFormData({ ...formData, searchOption: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select search option</option>
                {["hnsw", "faiss", "brute_force", "annoy"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center space-y-3">
            <h3 className="font-medium text-base mb-4">Review Configuration</h3>
            {isSubmitting && (
        <div className="w-4/5 mb-4">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Uploading: {uploadProgress}%
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div 
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
            <div className="space-y-2 text-sm w-4/5">
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Database Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Dataset:</span>
                <span className="font-medium">{formData.dataset?.name || 'No file selected'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">RAG Type:</span>
                <span className="font-medium">{formData.ragType || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">LLM Model:</span>
                <span className="font-medium">{formData.llmModel || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Embedding Model:</span>
                <span className="font-medium">{formData.embeddingModel || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Chunking Option:</span>
                <span className="font-medium">{formData.chunkingOption || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Vector Database:</span>
                <span className="font-medium">{formData.vectorDb || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Search Option:</span>
                <span className="font-medium">{formData.searchOption || '-'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = validateStep1();
        break;
      case 2:
        isValid = validateStep2();
        break;
      case 3:
        isValid = validateStep3();
        break;
      case 4:
        isValid = validateStep4();
        break;
      default:
        break;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
      setTimeout(() => {
        switch (currentStep + 1) {
          case 4:
            validateStep4();
            break;
          default:
            break;
        }
      }, 0);
    } else if (!isValid) {
      setFormError('Please fill all required fields before proceeding');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };


// const handleSubmit = async () => {
//   try {
//     setIsSubmitting(true);
//     setFormError(null);
    
//     // Validate form data
//     const error = validateRagName(formData.name);
//     if (error) {
//       setNameError(error);
//       return;
//     }

//     if (!validateStep1() || !validateStep2() || !validateStep3()) {
//       setFormError('Please complete all required fields in each step');
//       return;
//     }

//     // Create FormData object
//     const formDataToSend = new FormData();
    
//     // Append file with the correct field name 'dataset'
//     if (formData.dataset) {
//       formDataToSend.append('dataset', formData.dataset);
//     }
    
//     // Append other fields as Form data with correct field names
//     const fieldMappings = {
//       name: formData.name,
//       rag_type: formData.ragType,
//       llm_model: formData.llmModel,
//       embedding_model: formData.embeddingModel,
//       chunking_option: formData.chunkingOption,
//       vector_db: formData.vectorDb,
//       search_option: formData.searchOption
//     };

//     Object.entries(fieldMappings).forEach(([key, value]) => {
//       if (value) {
//         formDataToSend.append(key, value);
//       }
//     });

//     const response = await axios.post(
//       'http://localhost:8000/rag/create',
//       formDataToSend,
//       {
//         headers: {
//           'Accept': 'application/json',
//         },
//         onUploadProgress: (progressEvent) => {
//           const percentCompleted = Math.round(
//             (progressEvent.loaded * 100) / progressEvent.total
//           );
//           setUploadProgress(percentCompleted);
//         },
//         withCredentials: true
//       }
//     );

//     if (response.data) {
//       // Reset form and close modal
//       setFormData(initialFormState);
//       setCurrentStep(1);
//       setFormError(null);
//       setNameError('');
//       setStepsValidation(initialStepsValidation);
//       await onSubmit(response.data);
//       onClose();
//     }

//   } catch (error) {
//     console.error('Error creating RAG:', error);
//     let errorMessage = 'Failed to create RAG configuration';
    
//     if (error.response?.data?.detail) {
//       if (Array.isArray(error.response.data.detail)) {
//         errorMessage = error.response.data.detail
//           .map(err => `${err.loc[1]}: ${err.msg}`)
//           .join('\n');
//       } else {
//         errorMessage = error.response.data.detail;
//       }
//     }
    
//     setFormError(errorMessage);
//   } finally {
//     setIsSubmitting(false);
//   }
// };


const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      setFormError(null);
      
      // Validate form data
      const error = validateRagName(formData.name);
      if (error) {
        setNameError(error);
        setIsSubmitting(false);
        return;
      }
  
      if (!validateStep1() || !validateStep2() || !validateStep3()) {
        setFormError('Please complete all required fields in each step');
        setIsSubmitting(false);
        return;
      }
  
      // Call onSubmit with the form data
      await onSubmit(formData);
      
      // Reset form and close modal
      setFormData(initialFormState);
      setCurrentStep(1);
      setFormError(null);
      setNameError('');
      setStepsValidation(initialStepsValidation);
      onClose();
  
    } catch (error) {
      console.error('Error creating RAG:', error);
      let errorMessage = 'Failed to create RAG configuration';
      
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail
            .map(err => `${err.loc[1]}: ${err.msg}`)
            .join('\n');
        } else {
          errorMessage = error.response.data.detail;
        }
      }
      
      setFormError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl p-5 relative">
        <button 
          onClick={onClose}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>

        {formError && (
          <div className="w-full mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {formError}
          </div>
        )}

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Create New RAG Configuration
        </h2>

        <div className="flex min-h-[400px]">
          <SidebarTabs />

          <div className="flex-1 pl-6">
            <div className="w-full">
              {renderStepContent()}
            </div>

            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 w-full">
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700"
                  >
                    Back
                  </button>
                )}
                {currentStep === 4 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!Object.values(stepsValidation).every(v => v) || isSubmitting}
                    className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
                        (!Object.values(stepsValidation).every(v => v) || isSubmitting)
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-primary-dark'
                      }`}
                    >
                      {isSubmitting ? 'Creating...' : 'Create RAG Configuration'}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="px-3 py-1.5 bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors duration-200 text-sm"
                    >
                      Next
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  export default GyanRagModal;

