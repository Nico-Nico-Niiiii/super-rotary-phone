import { useState, useEffect } from 'react';
import { X, Check, Upload } from 'lucide-react';

const AgentProjectModal = ({ projectData,isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const initialFormState = {
    project_id: '',
    project_name: projectData.name,
    agent_project_name: '',
    agent_pro_id: '',
    framework: '',
    system_prompt: '',
    agent_flow: ''
  };
  const [formData, setFormData] = useState(initialFormState);
  const [projectNameError, setProjectNameError] = useState('');
  const [stepsValidation, setStepsValidation] = useState({
    1: false,
    2: false
  });

  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
 
  const readOnlyStyles = "w-4/5 p-1.5 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed";

  useEffect(() => {
    if (currentStep === 2) {
      validateStep2();
    }
  }, [currentStep]);

  // Add this useEffect to reset the form when modal opens/closes
useEffect(() => {
    if (isOpen) {
      // Reset form data and errors when modal opens
      setFormData(initialFormState);
      setProjectNameError('');
      setFormError(null);
      setCurrentStep(1);
      setStepsValidation({
        1: false,
        2: false
      });
    }
  }, [isOpen]);

  const validateProjectName = (name) => {
    // Check for minimum length
    if (name.length < 3) {
      return 'Project name must be at least 3 characters long';
    }
    
    // Check for maximum length
    if (name.length > 10) {
      return 'Project name must not exceed 10 characters';
    }
  
    // Check if first character is a letter
    if (!/^[A-Za-z]/.test(name)) {
      return 'Project name must start with a letter';
    }
  
    // Check for spaces
    if (/\s/.test(name)) {
      return 'Project name cannot contain spaces';
    }
  
    // Check for allowed characters (letters, numbers, hyphen, and underscore only)
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
      return 'Project name can only contain letters, numbers, hyphens (-) and underscores (_)';
    }
  
    return '';
  };

  const validateStep1 = () => {
    const isValid = !projectNameError && formData.agent_project_name;
    setStepsValidation(prev => ({...prev, 1: isValid}));
    return isValid;
  };
  
  const validateStep2 = () => {
    const isValid = formData.framework && formData.system_prompt && formData.agent_flow;
    setStepsValidation(prev => ({...prev, 2: isValid}));
    return isValid;
  };

  const handleProjectNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, project_name: newName });
    setProjectNameError(validateProjectName(newName));
    validateStep1();
  };

  const ProgressSteps = () => (
    <div className="mb-4">
      <div className="flex justify-between items-center">
        {[1, 2].map((step, index) => (
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
            {index < 1 && (
              <div className={`h-0.5 w-full mx-3 ${
                stepsValidation[step] ? 'bg-green-500' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const SidebarTabs = ({ currentStep, stepsValidation, setCurrentStep }) => {
    const tabs = [
      { id: 1, label: 'Project Details' },
      { id: 2, label: 'Agent Configuration' }
    ];
  
    return (
      <div className="w-48 border-r border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            onClick={() => {
              // Only allow navigation to completed steps or current step
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
                Project Name
              </label>
              <input
                type="text"
                required
                value={formData.project_name}
                className={readOnlyStyles}
                readOnly
              />
              {projectNameError && (
                <p className="text-red-500 text-xs mt-1">{projectNameError}</p>
              )}
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Agent Project Name
              </label>
              <input
                type="text"
                required
                value={formData.agent_project_name}
                onChange={(e) => {
                  setFormData({ ...formData, agent_project_name: e.target.value });
                  validateStep1();
                }}
                className={inputStyles}
                placeholder="Enter agent project name"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Framework
              </label>
              <select
                required
                value={formData.framework}
                onChange={(e) => {
                  setFormData({ ...formData, framework: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select framework</option>
                <option value="Crew AI">Crew AI</option>
                {/* <option value="Langchain">Langchain</option> */}
               
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Agent Flow
              </label>
              <select
                required
                value={formData.agent_flow}
                onChange={(e) => {
                  setFormData({ ...formData, agent_flow: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
              >
                <option value="">Select agent flow</option>
                <option value="Single Agent">Single Agent</option>
                <option value="Sequential Multiple Agent">Sequential Multiple Agent</option>
                {/* <option value="Parallel Agent">Parallel Agent</option> */}
              </select>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                System Prompt
              </label>
              <textarea
                required
                value={formData.system_prompt}
                onChange={(e) => {
                  setFormData({ ...formData, system_prompt: e.target.value });
                  validateStep2();
                }}
                className={`${inputStyles} h-32`}
                placeholder="Enter system prompt"
              />
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
      default:
        break;
    }

    if (isValid && currentStep < 2) {
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

  const handleSubmit = async () => {
    try {
      setFormError(null);
      const error = validateProjectName(projectData.name);
      if (error) {
        setProjectNameError(error);
        return;
      }

      // Validate all steps
      const step1Valid = validateStep1();
      const step2Valid = validateStep2();

      if (!step1Valid || !step2Valid) {
        setFormError('Please complete all required fields in each step');
        return;
      }

      // Generate a unique agent_pro_id (you might want to use a more sophisticated method)
      const agentProId = `${formData.project_name.toLowerCase()}-${Date.now()}`;
      
      // Format data according to backend schema
      const projectData1 = {
        project_name: formData.project_name,
        agent_project_name: formData.agent_project_name,
        agent_pro_id: agentProId,
        framework: formData.framework,
        system_prompt: formData.system_prompt,
        agent_flow: formData.agent_flow
      };
      
      await onSubmit(projectData1);
      onClose();
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create agent project');
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
          Create New Agent Project
        </h2>

        <div className="flex min-h-[400px]">
          {/* Sidebar Tabs */}
          <SidebarTabs 
            currentStep={currentStep}
            stepsValidation={stepsValidation}
            setCurrentStep={setCurrentStep}
          />

          {/* Main Content */}
          <div className="flex-1 pl-6">
            <div className="w-full">
              {renderStepContent()}
            </div>

            {/* Footer Buttons */}
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
                {currentStep === 2 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={!Object.values(stepsValidation).every(v => v)}
                    className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
                      !Object.values(stepsValidation).every(v => v) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-primary-dark'
                    }`}
                  >
                    Create Project
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

export default AgentProjectModal;