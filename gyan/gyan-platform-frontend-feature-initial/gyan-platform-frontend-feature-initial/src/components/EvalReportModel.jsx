import React, { useState, useEffect } from 'react';
import { X, Check, Upload } from 'lucide-react';
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

const EvalReportModel = ({ isOpen, onClose, onSubmit, projectData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const[jobs,setJobs] = useState([]);
  const initialFormState = {
    name: '',
    dataset: null,
    searchStrategy: 'greedy',
    topK: '0',
    topP: '1',
    temperature: '0',
  };
  const [formData, setFormData] = useState(initialFormState);
  const [nameError, setNameError] = useState('');
  const [stepsValidation, setStepsValidation] = useState({
    1: false,
    2: false,
    3: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

// console.log("ProjectData",projectData);

  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
  const datasetUploadStyles = "w-4/5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center";

  useEffect(() => {
    fetchJobs();
  },[])

  useEffect(() => {
    if (currentStep === 3) {
      validateStep3();
    }
  }, [currentStep]);

  const validateProjectName = (name) => {
    if (name.length < 3) {
      return 'Job name must be at least 3 characters long';
    }
    if (name.length > 10) {
      return 'Job name must not exceed 10 characters';
    }
    if (!/^[A-Za-z]/.test(name)) {
      return 'Job name must start with a letter';
    }
    if (/\s/.test(name)) {
      return 'Job name cannot contain spaces';
    }
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
      return 'Job name can only contain letters, numbers, hyphens (-) and underscores (_)';
    }
    return '';
  };

  const handleJobDropdownFocus = async() => {
    if (jobs.length === 0) {  // Fetch jobs only if not already fetched
      await fetchJobs();
    }
  };


  const fetchJobs = async () => {
    try {
      // setLoading(true);
      const response = await api.get(
        `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', projectData.id)}`
      );
      console.log("data",response.data);
      
     
      
      // Map response data to match component structure
      const formattedJobs = response.data.map(job => ({
        id: job.id,
        jobName: job.name,
        status: job.queue_status,
        startedOn: new Date(job.started_on).toLocaleDateString(),
        modelType: job.model_name
      }));
      setJobs(formattedJobs);
    
    } catch (error) {
      // console.error('Error fetching jobs:', error);
      // setError('Failed to load training jobs');
    } finally {
      // setLoading(false);
    }
  };

  
  const validateStep1 = () => {
    const isValid = formData.name && !nameError && formData.dataset;
    setStepsValidation(prev => ({...prev, 1: isValid}));
    return isValid;
  };

  const validateStep2 = () => {
    const isValid = formData.searchStrategy && 
      (formData.searchStrategy === 'greedy' || 
       (formData.searchStrategy === 'topk' && formData.topK) ||
       (formData.searchStrategy === 'topp' && formData.topP)) &&
      formData.temperature;
    setStepsValidation(prev => ({...prev, 2: isValid}));
    return isValid;
  };

  const validateStep3 = () => {
    const isValid = validateStep1() && validateStep2();
    setStepsValidation(prev => ({...prev, 3: isValid}));
    return isValid;
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    setNameError(validateProjectName(newName));
    validateStep1();
  };

  const SidebarTabs = () => {
    const tabs = [
      { id: 1, label: 'Basic Details' },
      { id: 2, label: 'Search Parameters' },
      { id: 3, label: 'Review' }
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
                Evaluation Job Name
              </label>
              <div className="relative w-4/5">
              
              <select
  value={formData.name}
  onChange={(e) => {
    setFormData({ ...formData, name: e.target.value });
    validateStep1();
  }}
  onFocus={handleJobDropdownFocus}  // Trigger the fetch when dropdown is clicked/focused
  className={`${inputStyles} ${nameError ? 'border-red-500' : ''}`}
>
  <option value="">Select a job</option>
  {jobs.map((job) => (
    <option key={job.id} value={job.jobName}>
      {job.jobName}
    </option>
  ))}
</select>
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>
              {/* <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`${inputStyles} ${nameError ? 'border-red-500' : ''}`}
                placeholder="Enter Job name"
              />
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )} */}
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium self-start pl-[10%] text-gray-700 dark:text-gray-300 mb-1">
                Select Dataset
              </label>
              <div className={datasetUploadStyles}>
                <input
                  type="file"
                  id="dataset"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file) {
                      setFormData({ ...formData, dataset: file });
                      validateStep1();
                    }
                  }}
                  accept=".csv,.jsonl"
                />
                <label htmlFor="dataset" className="cursor-pointer flex flex-col items-center">
                  <Upload className="h-6 w-6 text-gray-400 mb-1" />
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {formData.dataset ? formData.dataset.name : 'Drag CSV/JSONL files here or'}
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
          <div className="flex flex-col items-center space-y-6 w-full">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-3">
                Search Strategy
              </label>
              <div className="grid grid-cols-3 gap-4 w-4/5">
                {['Greedy', 'Top-K', 'Top-P'].map((strategy) => (
                  <label key={strategy} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="searchStrategy"
                      value={strategy.toLowerCase().replace('-', '')}
                      checked={formData.searchStrategy === strategy.toLowerCase().replace('-', '')}
                      onChange={(e) => {
                        setFormData({ ...formData, searchStrategy: e.target.value });
                        validateStep2();
                      }}
                      className="w-4 h-4 text-primary-light border-gray-300 focus:ring-primary-light"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-300">{strategy}</span>
                  </label>
                ))}
              </div>
            </div>

            {formData.searchStrategy === 'topp' && (
              <div className="w-full flex flex-col items-center">
                <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                  Top-P Value (0-1)
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={formData.topP}
                  onChange={(e) => {
                    setFormData({ ...formData, topP: e.target.value });
                    validateStep2();
                  }}
                  className="w-4/5"
                />
                <span className="text-sm text-gray-600">{formData.topP}</span>
              </div>
            )}

            {formData.searchStrategy === 'topk' && (
              <div className="w-full flex flex-col items-center">
                <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                  Top-K Value (1-100)
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={formData.topK}
                  onChange={(e) => {
                    setFormData({ ...formData, topK: e.target.value });
                    validateStep2();
                  }}
                  className="w-4/5"
                />
                <span className="text-sm text-gray-600">{formData.topK}</span>
              </div>
            )}

            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start pl-[10%] dark:text-gray-300 mb-1">
                Temperature (0-1)
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={formData.temperature}
                onChange={(e) => {
                  setFormData({ ...formData, temperature: e.target.value });
                  validateStep2();
                }}
                className="w-4/5"
              />
              <span className="text-sm text-gray-600">{formData.temperature}</span>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center space-y-3">
            <h3 className="font-medium text-base mb-4">Review your settings</h3>
            <div className="space-y-2 text-sm w-4/5">
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Job Name:</span>
                <span className="font-medium">{formData.name}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Dataset:</span>
                <span className="font-medium">{formData.dataset?.name || 'No file selected'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Search Strategy:</span>
                <span className="font-medium">{formData.searchStrategy}</span>
              </div>
              {formData.searchStrategy === 'topk' && (
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Top-K Value:</span>
                  <span className="font-medium">{formData.topK}</span>
                </div>
              )}
              {formData.searchStrategy === 'topp' && (
                <div className="flex justify-between py-1 border-b dark:border-gray-700">
                  <span className="text-gray-600 dark:text-gray-400">Top-P Value:</span>
                  <span className="font-medium">{formData.topP}</span>
                </div>
              )}
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Temperature:</span>
                <span className="font-medium">{formData.temperature}</span>
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
      default:
        break;
    }

    if (isValid && currentStep < 3) {
      setCurrentStep(prev => prev + 1);
    } else if (!isValid) {
      setFormError('Please fill all required fields before proceeding');
      setIsSubmitting(false); 
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
      setIsSubmitting(true); 
      const error = validateProjectName(formData.name);
      if (error) {
        setNameError(error);
        setIsSubmitting(false); 
        return;
      }

      const allStepsValid = validateStep1() && validateStep2();
      if (!allStepsValid) {
        setFormError('Please complete all required fields in each step');
        return;
      }
      console.log("Handle submit",formData);
      

      const evaluationData = {
        name: formData.name,
        dataset: formData.dataset,
        dataset_path: formData.dataset?.name || null,
        search_strategy: formData.searchStrategy,
        top_k: formData.searchStrategy === 'topk' ? parseFloat(formData.topK) : null,
        top_p: formData.searchStrategy === 'topp' ? parseFloat(formData.topP) : null,
        temperature: parseFloat(formData.temperature),
        status: 'Pending'
      };

      await onSubmit(evaluationData);
      setIsSubmitting(false); 
      onClose();
    } catch (error) {
      console.log(error);
      setIsSubmitting(false); 
      setFormError(error.response?.data?.detail || 'Failed to create evaluation job');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl p-5 relative overflow-hidden">
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
          Create New Evaluation Job
        </h2>

        <div className="flex min-h-[400px]">
          {/* Sidebar Tabs */}
          <SidebarTabs />

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
                {currentStep === 3 ? (
                  // <button
                  //   type="button"
                  //   onClick={handleSubmit}
                  //   disabled={!Object.values(stepsValidation).every(v => v)}
                  //   className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
                  //     !Object.values(stepsValidation).every(v => v) 
                  //       ? 'opacity-50 cursor-not-allowed' 
                  //       : 'hover:bg-primary-dark'
                  //   }`}
                  // >
                  //   Start Evaluation
                  // </button>
                  <button
  type="button"
  onClick={handleSubmit}
  disabled={!Object.values(stepsValidation).every(v => v) || isSubmitting}
  className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
    !Object.values(stepsValidation).every(v => v) || isSubmitting
      ? 'opacity-50 cursor-not-allowed' 
      : 'hover:bg-primary-dark'
  }`}
>
  {isSubmitting ? (
    <div className="flex items-center">
      <div className="w-4 h-4 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
      Processing...
    </div>
  ) : (
    'Start Evaluation'
  )}
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
        {isSubmitting && (
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-200">
          <div className="h-full bg-primary-light animate-progress-bar"></div>
        </div>
      )}
      </div>
    </div>
  );
};

export default EvalReportModel;