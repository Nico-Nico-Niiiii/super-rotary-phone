// import React, { useState } from 'react';
// import {
//   ChevronRight,
//   ChevronLeft,
//   X,
//   Upload,
//   Settings,
//   Database,
//   Check
// } from 'lucide-react';

// const steps = [
//   { title: "Dataset Details", icon: Upload },
//   { title: "Chunking Settings", icon: Settings },
//   { title: "Vector Settings", icon: Database }
// ];

// const chunkingOptions = [
//   "Agentic", "Semantic", "Recursive", "Sentence", "Token", "Fixed Size"
// ];

// const embeddingModels = [
//   "E5", "BGE", "GTE", "MiniLM"
// ];

// const vectorSearchOptions = [
//   "Faiss", "HNSW", "Brute Force", "Annoy"
// ];

// const vectorStoreOptions = [
//   "Weaviate", "Chroma", "Faiss", "Pinecone"
// ];

// const ragTypes = [
//   "Standard", "Graph", "Adaptive", "Raptor", "Corrective", "Iterative"
// ];

// const NewRAGDatasetModal = ({ isOpen, onClose }) => {
//   const [currentStep, setCurrentStep] = useState(0);
//   const [formData, setFormData] = useState({
//     name: '',
//     description: '',
//     chunkingTechnique: '',
//     embeddingModel: '',
//     vectorSearch: '',
//     vectorStore: '',
//     ragType: ''
//   });

//   if (!isOpen) return null;

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => ({
//       ...prev,
//       [name]: value
//     }));
//   };

//   const handleNext = () => {
//     setCurrentStep(prev => Math.min(prev + 1, steps.length - 1));
//   };

//   const handleBack = () => {
//     setCurrentStep(prev => Math.max(prev - 1, 0));
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log('Form submitted:', formData);
//     onClose();
//   };

//   const SelectField = ({ label, name, options, value, onChange }) => (
//     <div className="space-y-2">
//       <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//         {label}
//       </label>
//       <select
//         name={name}
//         value={value}
//         onChange={onChange}
//         className="w-full p-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
//       >
//         <option value="">Select {label}</option>
//         {options.map(option => (
//           <option key={option} value={option}>{option}</option>
//         ))}
//       </select>
//     </div>
//   );

//   const renderStep = () => {
//     switch (currentStep) {
//       case 0:
//         return (
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Dataset Name
//               </label>
//               <input
//                 type="text"
//                 name="name"
//                 value={formData.name}
//                 onChange={handleInputChange}
//                 className="mt-1 w-full p-2 border rounded-lg"
//                 placeholder="Enter name"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
//                 Description
//               </label>
//               <textarea
//                 name="description"
//                 value={formData.description}
//                 onChange={handleInputChange}
//                 className="mt-1 w-full p-2 border rounded-lg"
//                 rows={3}
//                 placeholder="Enter description"
//               />
//             </div>
//           </div>
//         );
//       case 1:
//         return (
//           <div className="space-y-4">
//             <SelectField
//               label="Chunking Technique"
//               name="chunkingTechnique"
//               options={chunkingOptions}
//               value={formData.chunkingTechnique}
//               onChange={handleInputChange}
//             />
//             <SelectField
//               label="RAG Type"
//               name="ragType"
//               options={ragTypes}
//               value={formData.ragType}
//               onChange={handleInputChange}
//             />
//           </div>
//         );
//       case 2:
//         return (
//           <div className="space-y-4">
//             <SelectField
//               label="Embedding Model"
//               name="embeddingModel"
//               options={embeddingModels}
//               value={formData.embeddingModel}
//               onChange={handleInputChange}
//             />
//             <SelectField
//               label="Vector Search"
//               name="vectorSearch"
//               options={vectorSearchOptions}
//               value={formData.vectorSearch}
//               onChange={handleInputChange}
//             />
//             <SelectField
//               label="Vector Store"
//               name="vectorStore"
//               options={vectorStoreOptions}
//               value={formData.vectorStore}
//               onChange={handleInputChange}
//             />
//           </div>
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
//       <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl mx-4">
//         {/* Header */}
//         <div className="p-6 border-b dark:border-gray-700">
//           <div className="flex justify-between items-center">
//             <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
//               Create New RAG Dataset
//             </h2>
//             <button
//               onClick={onClose}
//               className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//             >
//               <X size={20} />
//             </button>
//           </div>
          
//           {/* Progress Steps */}
//           <div className="flex justify-between items-center mt-6">
//             {steps.map((step, index) => (
//               <div key={index} className="flex items-center">
//                 <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
//                   index <= currentStep 
//                     ? 'bg-blue-500 text-white' 
//                     : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
//                 }`}>
//                   {index < currentStep ? (
//                     <Check size={16} />
//                   ) : (
//                     <step.icon size={16} />
//                   )}
//                 </div>
//                 <span className={`ml-2 text-sm ${
//                   index <= currentStep 
//                     ? 'text-gray-900 dark:text-white' 
//                     : 'text-gray-500'
//                 }`}>
//                   {step.title}
//                 </span>
//                 {index < steps.length - 1 && (
//                   <div className={`w-12 h-1 mx-2 ${
//                     index < currentStep 
//                       ? 'bg-blue-500' 
//                       : 'bg-gray-200 dark:bg-gray-700'
//                   }`} />
//                 )}
//               </div>
//             ))}
//           </div>
//         </div>

//         {/* Form Content */}
//         <form onSubmit={handleSubmit}>
//           <div className="p-6">
//             {renderStep()}
//           </div>

//           {/* Footer */}
//           <div className="p-6 border-t dark:border-gray-700 flex justify-between">
//             <button
//               type="button"
//               onClick={handleBack}
//               disabled={currentStep === 0}
//               className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
//                 currentStep === 0
//                   ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
//                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
//               }`}
//             >
//               <ChevronLeft size={16} />
//               Back
//             </button>
            
//             {currentStep === steps.length - 1 ? (
//               <button
//                 type="submit"
//                 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
//               >
//                 Create Dataset
//                 <Check size={16} />
//               </button>
//             ) : (
//               <button
//                 type="button"
//                 onClick={handleNext}
//                 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
//               >
//                 Next
//                 <ChevronRight size={16} />
//               </button>
//             )}
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default NewRAGDatasetModal;


















import React, { useState } from 'react';
import { X, Check, Upload, Settings, Database } from 'lucide-react';

const NewRAGDatasetModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    chunkingTechnique: '',
    embeddingModel: '',
    vectorSearch: '',
    vectorStore: '',
    ragType: ''
  });
  const [stepsValidation, setStepsValidation] = useState({
    1: false,
    2: false,
    3: false,
    4: false
  });

  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
  
  const validateStep1 = () => {
    const isValid = formData.name && formData.description;
    setStepsValidation(prev => ({...prev, 1: isValid}));
    return isValid;
  };
  
  const validateStep2 = () => {
    const isValid = formData.chunkingTechnique && formData.ragType;
    setStepsValidation(prev => ({...prev, 2: isValid}));
    return isValid;
  };
  
  const validateStep3 = () => {
    const isValid = formData.embeddingModel && formData.vectorSearch && formData.vectorStore;
    setStepsValidation(prev => ({...prev, 3: isValid}));
    return isValid;
  };

  const validateStep4 = () => {
    const isValid = validateStep1() && validateStep2() && validateStep3();
    setStepsValidation(prev => ({...prev, 4: isValid}));
    return isValid;
  };

  const SidebarTabs = () => {
    const tabs = [
      { id: 1, label: 'Dataset Details' },
      { id: 2, label: 'Chunking Settings' },
      { id: 3, label: 'Vector Settings' },
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
                Dataset Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  validateStep1();
                }}
                className={inputStyles}
                placeholder="Enter dataset name"
              />
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => {
                  setFormData({ ...formData, description: e.target.value });
                  validateStep1();
                }}
                className={inputStyles}
                rows={3}
                placeholder="Enter description"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Chunking Technique
              </label>
              <select
                value={formData.chunkingTechnique}
                onChange={(e) => {
                  setFormData({ ...formData, chunkingTechnique: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select Technique</option>
                {["Agentic", "Semantic", "Recursive", "Sentence", "Token", "Fixed Size"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                RAG Type
              </label>
              <select
                value={formData.ragType}
                onChange={(e) => {
                  setFormData({ ...formData, ragType: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select Type</option>
                {["Standard", "Graph", "Adaptive", "Raptor", "Corrective", "Iterative"].map(option => (
                  <option key={option} value={option}>{option}</option>
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
                Embedding Model
              </label>
              <select
                value={formData.embeddingModel}
                onChange={(e) => {
                  setFormData({ ...formData, embeddingModel: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select Model</option>
                {["E5", "BGE", "GTE", "MiniLM"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Vector Search
              </label>
              <select
                value={formData.vectorSearch}
                onChange={(e) => {
                  setFormData({ ...formData, vectorSearch: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select Search Method</option>
                {["Faiss", "HNSW", "Brute Force", "Annoy"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Vector Store
              </label>
              <select
                value={formData.vectorStore}
                onChange={(e) => {
                  setFormData({ ...formData, vectorStore: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select Store</option>
                {["Weaviate", "Chroma", "Faiss", "Pinecone"].map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="flex flex-col items-center space-y-3">
            <h3 className="font-medium text-base mb-4">Review your settings</h3>
            <div className="space-y-2 text-sm w-4/5">
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Dataset Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Description:</span>
                <span className="font-medium">{formData.description}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Chunking Technique:</span>
                <span className="font-medium">{formData.chunkingTechnique || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">RAG Type:</span>
                <span className="font-medium">{formData.ragType || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Embedding Model:</span>
                <span className="font-medium">{formData.embeddingModel || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Vector Search:</span>
                <span className="font-medium">{formData.vectorSearch || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Vector Store:</span>
                <span className="font-medium">{formData.vectorStore || '-'}</span>
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
      default:
        break;
    }

    if (isValid && currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    } else if (!isValid) {
      setFormError('Please fill all required fields before proceeding');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = (action) => {
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    const step3Valid = validateStep3();

    if (!step1Valid || !step2Valid || !step3Valid) {
      setFormError('Please complete all required fields in each step');
      return;
    }

    console.log('Form submitted:', { ...formData, action });
    onClose();
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
          Create New RAG Dataset
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
                  <>
                    <button
                      type="button"
                      onClick={() => handleSubmit('create')}
                      disabled={!Object.values(stepsValidation).every(v => v)}
                      className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
                        !Object.values(stepsValidation).every(v => v) 
                          ? 'opacity-50 cursor-not-allowed' 
                          : 'hover:bg-primary-dark'
                      }`}
                    >
                      Create & Process Dataset
                    </button>
                  </>
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

export default NewRAGDatasetModal;