// import React, { useState, useEffect } from 'react';
// import { X } from 'lucide-react';

// const AgentInfoModal = ({ 
//   isOpen, 
//   onClose, 
//   onSubmit, 
//   initialData 
// }) => {
//   // Initialize state with either initial data or default values
//   const [formData, setFormData] = useState({
//     agent_name: initialData?.agent_name || '',
//     selected_llm: initialData?.selected_llm || '',
//     selected_tool: initialData?.selected_tool || '',
//     role: initialData?.role || '',
//     goal: initialData?.goal || '',
//     backstory: initialData?.backstory || '',
//     tasks: initialData?.tasks || '',
//     task_description: initialData?.task_description || '',
//     expected_output: initialData?.expected_output || '',
//   });

//   // Reset form when initial data changes
//   useEffect(() => {
//     setFormData({
//       agent_name: initialData?.agent_name || '',
//       selected_llm: initialData?.selected_llm || '',
//       selected_tool: initialData?.selected_tool || '',
//       role: initialData?.role || '',
//       goal: initialData?.goal || '',
//       backstory: initialData?.backstory || '',
//       tasks: initialData?.tasks || '',
//       task_description: initialData?.task_description || '',
//       expected_output: initialData?.expected_output || '',
//     });
//   }, [initialData]);

//   // Validation function
//   const validateForm = () => {
//     // Basic validation for required fields
//     return !!(
//       formData.agent_name && 
//       formData.selected_llm && 
//       formData.selected_tool
//     );
//   };

//   // Handle form submission
//   const handleSubmit = () => {
//     // Validate form before submission
//     if (!validateForm()) {
//       alert('Please fill in required fields (Agent Name, LLM, and Tool)');
//       return;
//     }

//     // Call parent component's submit handler
//     onSubmit(formData);
//   };

//   // If modal is not open, return null
//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg w-full max-w-2xl p-6 relative">
//         {/* Close Button */}
//         <button 
//           onClick={onClose}
//           className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
//         >
//           <X size={24} />
//         </button>

//         {/* Modal Title */}
//         <h2 className="text-xl font-semibold mb-4">
//           Configure Agent
//         </h2>

//         {/* Form Grid */}
//         <div className="grid grid-cols-2 gap-4">
//           {/* Agent Name */}
//           <div className="col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Agent Name *
//             </label>
//             <input
//               type="text"
//               value={formData.agent_name}
//               onChange={(e) => setFormData({
//                 ...formData, 
//                 agent_name: e.target.value
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               placeholder="Enter agent name"
//               required
//             />
//           </div>

//           {/* LLM Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Selected LLM *
//             </label>
//             <select
//               value={formData.selected_llm}
//               onChange={(e) => setFormData({
//                 ...formData, 
//                 selected_llm: e.target.value
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               required
//             >
//               <option value="">Select LLM</option>
//               <option value="GPT-4">GPT-4</option>
//               <option value="Claude 3 Opus">Claude 3 Opus</option>
//               <option value="Llama 3">Llama 3</option>
//               <option value="Mistral Large">Mistral Large</option>
//               <option value="PaLM 2">PaLM 2</option>
//             </select>
//           </div>

//           {/* Tool Selection */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Selected Tool *
//             </label>
//             <select
//               value={formData.selected_tool}
//               onChange={(e) => setFormData({
//                 ...formData, 
//                 selected_tool: e.target.value
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               required
//             >
//               <option value="">Select Tool</option>
//               <option value="Web Search">Web Search</option>
//               <option value="Database Query">Database Query</option>
//               <option value="PDF Reader">PDF Reader</option>
//               <option value="Calculator">Calculator</option>
//               <option value="Code Interpreter">Code Interpreter</option>
//             </select>
//           </div>

//           {/* Role */}
//           <div className="col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Role
//             </label>
//             <input
//               type="text"
//               value={formData.role}
//               onChange={(e) => setFormData({
//                 ...formData, 
//                 role: e.target.value
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               placeholder="Enter agent's role"
//             />
//           </div>

//           {/* Goal */}
//           <div className="col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Goal
//             </label>
//             <textarea
//               value={formData.goal}
//               onChange={(e) => setFormData({
//                 ...formData, 
//                 goal: e.target.value
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               placeholder="Define the agent's goal"
//               rows={3}
//             />
//           </div>

//           {/* Backstory */}
//           <div className="col-span-2">
//             <label className="block text-sm font-medium text-gray-700 mb-1">
//               Backstory
//             </label>
//             <textarea
//               value={formData.backstory}
//               onChange={(e) => setFormData({
//                 ...formData, 
//                 backstory: e.target.value
//               })}
//               className="w-full px-3 py-2 border border-gray-300 rounded-md"
//               placeholder="Provide agent's backstory/context"
//               rows={4}
//             />
//           </div>
//         </div>

//         {/* Action Buttons */}
//         <div className="flex justify-end space-x-3 mt-6">
//           <button
//             onClick={onClose}
//             className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
//           >
//             Cancel
//           </button>
//           <button
//             onClick={handleSubmit}
//             className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
//           >
//             Save
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AgentInfoModal;






















import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';

const AgentInfoModal = ({ 
  isOpen, 
  initialData,
  onClose, 
  onSubmit 
}) => {
  // State for form management
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Styling constants
  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
  const readOnlyStyles = "w-4/5 p-1.5 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed";

  // Initial form state with existing node data or default values
  const [formData, setFormData] = useState({
    agent_pro_id: initialData?.agent_pro_id ||  '',
    agent_project_name: initialData?.agent_project_name|| '',
    framework: initialData?.framework|| '',
    agent_type: initialData?.agent_flow || '',
    system_prompt: initialData?.system_prompt || '',
    agent_name:  '',
    selected_llm:'',
    selected_tool:  '',
    role:  '',
    goal: '',
    backstory:'',
    tasks: '',
    task_description:'',
    expected_output: '',
    predecessor: '',
    successor: '',
  });

  // Steps validation state
  const [stepsValidation, setStepsValidation] = useState({
    1: true,
    2: false,
    3: false,
    4: false
  });

  // Reset form when initial data changes
  useEffect(() => {
    setFormData({
      agent_pro_id: initialData?.agent_pro_id ||  '',
      agent_project_name: initialData?.agent_project_name|| '',
      framework: initialData?.framework|| '',
      agent_type: initialData?.agent_flow || '',
      system_prompt: initialData?.system_prompt || '',
      agent_name:  '',
      selected_llm:'',
      selected_tool:  '',
      role:  '',
      goal: '',
      backstory:'',
      tasks: '',
      task_description:'',
      expected_output: '',
      predecessor: '',
      successor: '',
    });
    
    // Reset steps
    setCurrentStep(1);
    setStepsValidation({
      1: true,
      2: false,
      3: false,
      4: false
    });
  }, [initialData, isOpen]);

  // Validation functions for each step
  const validateStep2 = () => {
    const isValid = !!formData.agent_name && 
                    !!formData.selected_llm && 
                    !!formData.selected_tool;
    setStepsValidation(prev => ({...prev, 2: isValid}));
    return isValid;
  };
  
  const validateStep3 = () => {
    const isValid = !!formData.role && 
                    !!formData.goal && 
                    !!formData.backstory;
    setStepsValidation(prev => ({...prev, 3: isValid}));
    return isValid;
  };
  
  const validateStep4 = () => {
    const isValid = !!formData.tasks && 
                    !!formData.task_description && 
                    !!formData.expected_output;
    setStepsValidation(prev => ({...prev, 4: isValid}));
    return isValid;
  };

  // Handle form submission
  const handleSubmit = () => {
    try {
      setFormError(null);
      setIsSubmitting(true);
      
      // Validate all steps
      const step2Valid = validateStep2();
      const step3Valid = validateStep3();
      const step4Valid = validateStep4();

      if (!step2Valid || !step3Valid || !step4Valid) {
        setFormError('Please complete all required fields in each step');
        setIsSubmitting(false);
        return;
      }
      
      // Call submit handler with form data
      onSubmit(formData);
      
      // Reset submitting state
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error submitting form:', error);
      setFormError('Failed to submit agent information');
      setIsSubmitting(false);
    }
  };

  // Navigation methods
  const handleNext = () => {
    let isValid = false;
    switch (currentStep) {
      case 1:
        isValid = true;
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
    } else if (!isValid) {
      setFormError('Please fill all required fields before proceeding');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  // Progress Steps Component
  const ProgressSteps = () => (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        {[1, 2, 3, 4].map((step, index) => (
          <div key={step} className="flex items-center w-full">
            <div className="flex flex-col items-center">
              <div 
                onClick={() => {
                  // Allow clicking only on completed steps or current step
                  if (step <= currentStep || stepsValidation[step - 1]) {
                    setCurrentStep(step);
                  }
                }}
                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer hover:border-primary-light ${
                  stepsValidation[step]
                    ? 'bg-green-500 border-green-500' 
                    : index + 1 === currentStep
                    ? 'border-primary-light text-primary-light'
                    : 'border-gray-300 text-gray-300'
                }`}
              >
                {stepsValidation[step] ? (
                  <Check size={12} className="text-white" />
                ) : (
                  <span className="text-xs">{step}</span>
                )}
              </div>
            </div>
            {index < 3 && (
              <div className={`h-0.5 w-full mx-3 ${
                stepsValidation[step] ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  // If modal is not open, return null
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
          Configure Agent
        </h2>

        {/* Progress Steps */}
        <ProgressSteps />

        <div className="flex min-h-[400px]">
          {/* Sidebar Tabs */}
          <div className="w-48 border-r border-gray-200 dark:border-gray-700">
            {['Agent Setup', 'Agent Profile', 'Task Configuration', 'Review'].map((label, index) => (
              <div
                key={label}
                onClick={() => {
                  // Only allow navigation to completed steps or current step
                  if (index + 1 <= currentStep || stepsValidation[index + 1 - 1]) {
                    setCurrentStep(index + 1);
                  }
                }}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer 
                  ${currentStep === index + 1 
                    ? 'bg-gray-100 dark:bg-gray-700/50 border-l-2 border-primary-light' 
                    : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'}`}
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                </span>
                {stepsValidation[index + 1] && (
                  <Check size={16} className="text-green-500" />
                )}
              </div>
            ))}
          </div>

          {/* Main Content */}
          <div className="flex-1 pl-6">
            <div className="w-full">
              {/* Step 1: Project Information */}
              {currentStep === 1 && (
                <div className="flex flex-col items-start space-y-4">
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Agent Project ID
                    </label>
                    <input
                      type="text"
                      value={formData.agent_pro_id}
                      readOnly
                      className={readOnlyStyles}
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Agent Project Name
                    </label>
                    <input
                      type="text"
                      value={formData.agent_project_name}
                      readOnly
                      className={readOnlyStyles}
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Framework
                    </label>
                    <input
                      type="text"
                      value={formData.framework}
                      readOnly
                      className={readOnlyStyles}
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Agent Type
                    </label>
                    <input
                      type="text"
                      value={formData.agent_type}
                      readOnly
                      className={readOnlyStyles}
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      System Prompt
                    </label>
                    <textarea
                      value={formData.system_prompt}
                      readOnly
                      className={`${readOnlyStyles} h-32`}
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Agent Setup */}
              {currentStep === 2 && (
                <div className="flex flex-col items-start space-y-4">
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.agent_name}
                      onChange={(e) => {
                        setFormData({ ...formData, agent_name: e.target.value });
                        validateStep2();
                      }}
                      className={inputStyles}
                      placeholder="Enter agent name"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Selected LLM
                    </label>
                    <select
                      required
                      value={formData.selected_llm}
                      onChange={(e) => {
                        setFormData({ ...formData, selected_llm: e.target.value });
                        validateStep2();
                      }}
                      className={inputStyles}
                    >
                      <option value="">Select LLM</option>
                      <option value="gpt-4">GPT-4</option>
                      <option value="Claude 3 Opus">Claude 3 Opus</option>
                      <option value="Llama 3">Llama 3</option>
                      <option value="Mistral Large">Mistral Large</option>
                      <option value="PaLM 2">PaLM 2</option>
                    </select>
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Selected Tool
                    </label>
                    <select
                      required
                      value={formData.selected_tool}
                      onChange={(e) => {
                        setFormData({ ...formData, selected_tool: e.target.value });
                        validateStep2();
                      }}
                      className={inputStyles}
                    >
                      <option value="">Select Tool</option>
                      <option value="tavily_search">Tavily Search</option>
                      <option value="Database Query">Database Query</option>
                      <option value="PDF Reader">PDF Reader</option>
                      <option value="Calculator">Calculator</option>
                      <option value="Code Interpreter">Code Interpreter</option>
                    </select>
                  </div>
                </div>
              )}

              {/* Step 3: Agent Profile */}
              {currentStep === 3 && (
                <div className="flex flex-col items-start space-y-4">
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Role
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.role}
                      onChange={(e) => {
                        setFormData({ ...formData, role: e.target.value });
                        validateStep3();
                      }}
                      className={inputStyles}
                      placeholder="Enter agent's role"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Goal
                    </label>
                    <textarea
                      required
                      value={formData.goal}
                      onChange={(e) => {
                        setFormData({ ...formData, goal: e.target.value });
                        validateStep3();
                      }}
                      className={`${inputStyles} h-24`}
                      placeholder="Define the agent's goal"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Backstory
                    </label>
                    <textarea
                      required
                      value={formData.backstory}
                      onChange={(e) => {
                        setFormData({ ...formData, backstory: e.target.value });
                        validateStep3();
                      }}
                      className={`${inputStyles} h-32`}
                      placeholder="Provide agent's backstory/context"
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Task Configuration */}
              {currentStep === 4 && (
                <div className="flex flex-col items-start space-y-4">
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Tasks
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.tasks}
                      onChange={(e) => {
                        setFormData({ ...formData, tasks: e.target.value });
                        validateStep4();
                      }}
                      className={inputStyles}
                      placeholder="Enter task name or identifier"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Task Description
                    </label>
                    <textarea
                      required
                      value={formData.task_description}
                      onChange={(e) => {
                        setFormData({ ...formData, task_description: e.target.value });
                        validateStep4();
                      }}
                      className={`${inputStyles} h-24`}
                      placeholder="Describe the task in detail"
                    />
                  </div>
                  <div className="w-full flex flex-col items-center">
                    <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                      Expected Output
                    </label>
                    <textarea
                      required
                      value={formData.expected_output}
                      onChange={(e) => {
                        setFormData({ ...formData, expected_output: e.target.value });
                        validateStep4();
                      }}
                      className={`${inputStyles} h-24`}
                      placeholder="Describe the expected output from this task"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex justify-end mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 w-full">
              <div className="flex space-x-3">
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                  >
                    Back
                  </button>
                )}
                {currentStep === 4 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!stepsValidation[4] || isSubmitting}
                    className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
                      !stepsValidation[4] || isSubmitting
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-primary-dark'
                    }`}
                  >
                    Save
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={isSubmitting}
                    className="px-3 py-1.5 bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors duration-200 text-sm disabled:opacity-50"
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

export default AgentInfoModal;