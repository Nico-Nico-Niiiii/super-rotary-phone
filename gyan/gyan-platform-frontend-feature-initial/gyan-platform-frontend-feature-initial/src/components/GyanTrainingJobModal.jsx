import { useState , useEffect} from 'react';
import { X, Check, Upload } from 'lucide-react';
import Papa from "papaparse";

const GyanTrainingModal = ({ isOpen, onClose, onSubmit }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formError, setFormError] = useState(null);
  const initialFormState = {
    name: '',
    dataset: null,
    epochs: '',
    batch_size: '',  
    learning_rate: '',  
    token_length: '', 
    quantization: '',
    rank: '',
    lora_optimized: false,  
  };
  const [formData, setFormData] = useState(initialFormState);
  const [nameError, setNameError] = useState('');
  const [stepsValidation, setStepsValidation] = useState({
    1: false,
    2: false,
    3: false,
    4: false
  });

  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
  const datasetUploadStyles = "w-4/5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center";
  useEffect(() => {
    if (currentStep === 4) {
      validateStep4();
    }
  }, [currentStep]); 

  const validateProjectName = (name) => {
    // Check for minimum length
    if (name.length < 3) {
      return 'Job name must be at least 3 characters long';
    }
    
    // Check for maximum length
    if (name.length > 10) {
      return 'Job name must not exceed 10 characters';
    }
  
    // Check if first character is a letter
    if (!/^[A-Za-z]/.test(name)) {
      return 'Job name must start with a letter';
    }
  
    // Check for spaces
    if (/\s/.test(name)) {
      return 'Job name cannot contain spaces';
    }
  
    // Check for allowed characters (letters, numbers, hyphen, and underscore only)
    if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(name)) {
      return 'Job name can only contain letters, numbers, hyphens (-) and underscores (_)';
    }
  
    return '';
  };

  /// new changes 
  const validateStep1 = () => {
    const isValid = formData.name && !nameError && formData.dataset &&  !formError;
    setStepsValidation(prev => ({...prev, 1: isValid}));
    return isValid;
  };
  
  const validateStep2 = () => {
    const isValid = formData.epochs && 
                    formData.batch_size && 
                    formData.learning_rate &&
                    // formData.eval_steps && 
                    formData.token_length ;
    setStepsValidation(prev => ({...prev, 2: isValid}));
    return isValid;
  };
  
  const validateStep3 = () => {
    const isValid = formData.quantization && formData.rank;
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
    setNameError(validateProjectName(newName));
    validateStep1(); 
  };

  // const ProgressSteps = () => (
  //   <div className="mb-4">
  //     <div className="flex justify-between items-center">
  //       {[1, 2, 3, 4].map((step, index) => (
  //         <div key={step} className="flex items-center w-full">
  //           <div className="flex flex-col items-center">
  //             <div 
  //               onClick={() => setCurrentStep(step)}
  //               className={`w-6 h-6 rounded-full border-2 flex items-center justify-center cursor-pointer hover:border-primary-light ${
  //                 index + 1 < currentStep 
  //                   ? 'bg-primary-light border-primary-light' 
  //                   : index + 1 === currentStep
  //                   ? 'border-primary-light text-primary-light'
  //                   : 'border-gray-300 text-gray-300'
  //               }`}
  //             >
  //               {index + 1 < currentStep ? (
  //                 <Check size={12} className="text-white" />
  //               ) : (
  //                 <span className="text-xs">{step}</span>
  //               )}
  //             </div>
  //           </div>
  //           {index < 3 && (
  //             <div className={`h-0.5 w-full mx-3 ${
  //               index + 1 < currentStep ? 'bg-primary-light' : 'bg-gray-300'
  //             }`} />
  //           )}
  //         </div>
  //       ))}
  //     </div>
  //   </div>
  // );

  // new changes
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

  const SidebarTabs = ({ currentStep, stepsValidation, setCurrentStep }) => {
    const tabs = [
      { id: 1, label: 'Basic Details' },
      { id: 2, label: 'Training Parameters' },
      { id: 3, label: 'Advanced Settings' },
      { id: 4, label: 'Review' }
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
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Training Job Name
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={handleNameChange}
                className={`${inputStyles} ${nameError ? 'border-red-500' : ''}`}
                placeholder="Enter Job name"
              />
              {nameError && (
                <p className="text-red-500 text-xs mt-1">{nameError}</p>
              )}
            </div>
            <div className="w-full flex flex-col items-center">
  <label className="text-sm font-medium self-start pl-[10%] items-start text-gray-700 dark:text-gray-300 mb-1">
    Select Dataset
  </label>
  <div className={datasetUploadStyles}>
    <input
      type="file"
      id="dataset"
      className="hidden"
      // onChange={(e) => {
      //   const file = e.target.files[0];
      //   if (file) {
      //     console.log('Selected file:', file);
      //     setFormData({ ...formData, dataset: file });
      //     validateStep1();
      //   }
      // }}
      onChange={(e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (!file.name.endsWith('.csv')) {
          setFormError('Please upload a CSV file');
          return;
        }

        Papa.parse(file, {
          header: true,
          complete: (results) => {
            const headers = results.meta.fields || [];
            
            // Check for required columns
            const requiredColumns = [ 'id','question', 'answer'];
            const missingColumns = requiredColumns.filter(col => !headers.includes(col));
            
            if (missingColumns.length > 0) {
              setFormError(`CSV must contain columns: ${missingColumns.join(', ')}`);
              return;
            }
            
            // Validate all rows have data
            const invalidRows = results.data.filter(row => 
              !row.id || !row.question || !row.answer
            );
            
            if (invalidRows.length > 1) {
              setFormError(`Found ${invalidRows.length} rows with missing data`);
              return;
            }
            
            setFormError(null);
            setFormData({ ...formData, dataset: file });
            validateStep1();
          },
          error: (error) => {
            setFormError('Error parsing CSV: ' + error.message);
          }
        });
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
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Epochs
              </label>
              <input
                type="number"
                required
                value={formData.epochs}
                onChange={(e) => {
                  setFormData({ ...formData, epochs: e.target.value });
                  validateStep2();
                }}
                className={inputStyles}
                placeholder="No. of Epochs"
              />
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Batch Size
              </label>
              <input
  type="number"
  required
  value={formData.batch_size}
  onChange={(e) => {
    setFormData({ ...formData, batch_size: e.target.value });
    validateStep2();
  }}
  className={inputStyles}
  placeholder="Enter the Batch Size"
/>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Learning Rate
              </label>
              <input
  type="number"
  step="0.0001"
  required
  value={formData.learning_rate}
  onChange={(e) => {
    setFormData({ ...formData, learning_rate: e.target.value });
    validateStep2();
  }}
  className={inputStyles}
  placeholder="Enter the Learning Rate"
/>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Token Length
              </label>
              <input
  type="number"
  required
  value={formData.token_length}
  onChange={(e) => {
    setFormData({ ...formData, token_length: e.target.value });
    validateStep2();
  }}
  className={inputStyles}
  placeholder="Enter the Token Length"
/>
            </div>
            {/* <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Evaluation Steps
              </label>
              <input
  type="number"
  step="1"
  required
  value={formData.eval_steps}
  onChange={(e) => {
    setFormData({ ...formData, eval_steps: e.target.value });
    validateStep2();
  }}
  className={inputStyles}
  placeholder="Enter the Evaluation Steps"
/>
            </div> */}
          </div>
        );

      case 3:
        return (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Quantization
              </label>
              <div className="grid grid-cols-2 gap-3 w-1/2">
                {['INT 4', 'INT 8', 'FP16', 'BF16'].map((option) => (
                  <label key={option} className="flex items-center justify-center space-x-2">
                    <input
                      type="radio"
                      name="quantization"
                      value={option.toLowerCase().replace(' ', '')}
                      checked={formData.quantization === option.toLowerCase().replace(' ', '')}
                      onChange={(e) => {
                        setFormData({ ...formData, quantization: e.target.value });
                      validateStep3();
                      }}
                      className="w-4 h-4 text-primary-light border-gray-300 focus:ring-primary-light"
                    />
                    <span className="text-sm text-gray-900 dark:text-gray-300">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="w-full flex flex-col items-center">
              <label className="text-sm font-medium text-gray-700 self-start  pl-[10%] dark:text-gray-300 mb-1">
                Select Rank
              </label>
              <select
                required
                value={formData.rank}
                onChange={(e) => {
                  setFormData({ ...formData, rank: e.target.value });
                  validateStep3();
                }}
                className={inputStyles}
              >
                <option value="">Select rank</option>
                <option value="8">8</option>
                <option value="16">16</option>
                <option value="32">32</option>
              </select>
            </div>
            <div className="w-1/2 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">LoRA Optimized?</span>
              <div
  onClick={() => {setFormData(prev => ({ ...prev, lora_optimized: !prev.lora_optimized }))
  validateStep3();
}}
  className={`w-12 h-6 rounded-full relative transition-colors duration-200 cursor-pointer ${
    formData.lora_optimized ? 'bg-primary-light' : 'bg-gray-200'
  }`}
>
                <div
                  className={`absolute w-5 h-5 rounded-full bg-white top-0.5 left-0.5 transition-transform duration-200 ${
                    formData.lora_optimized ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </div>
            </div>
          </div>
        );

      case 4:
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
                <span className="text-gray-600 dark:text-gray-400">Epochs:</span>
                <span className="font-medium">{formData.epochs || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Batch Size:</span>
                <span className="font-medium">{formData.batch_size || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Learning Rate:</span>
                <span className="font-medium">{formData.learning_rate || '-'}</span>
              </div>
              {/* <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Evaluation Steps:</span>
                <span className="font-medium">{formData.eval_steps || '-'}</span>
              </div> */}
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Token Length:</span>
                <span className="font-medium">{formData.token_length || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Quantization:</span>
                <span className="font-medium">{formData.quantization || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">Rank:</span>
                <span className="font-medium">{formData.rank || '-'}</span>
              </div>
              <div className="flex justify-between py-1 border-b dark:border-gray-700">
                <span className="text-gray-600 dark:text-gray-400">LoRA Optimized:</span>
                <span className="font-medium">{formData.lora_optimized ? 'Yes' : 'No'}</span>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // const handleNext = () => {
  //   if (currentStep < 4) {
  //     setCurrentStep(prev => prev + 1);
  //   }
  // };

  // Replace your existing handleNext
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
    // case 4:
    //   isValid = validateStep4();
    //   break;
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

  const handleSubmit = async (action) => {
    try {
      setFormError(null);
      const error = validateProjectName(formData.name);
      if (error) {
        setNameError(error);
        return;
      }

         // Validate all steps
    const step1Valid = validateStep1();
    const step2Valid = validateStep2();
    const step3Valid = validateStep3();
    // const step4Valid = validateStep4();

    if (!step1Valid || !step2Valid || !step3Valid ) {
      setFormError('Please complete all required fields in each step');
      return;
    }
      var trainingData = {};

      if(action === 'save'){
         trainingData = {
          name: formData.name,
          dataset: formData.dataset,
          dataset_path: formData.dataset?.name || null,
          epochs: parseInt(formData.epochs),
          batch_size: parseInt(formData.batch_size),
          learning_rate: parseFloat(formData.learning_rate),
          // eval_steps: parseInt(formData.eval_steps),
          token_length: parseInt(formData.token_length),
          quantization: formData.quantization,
          rank: parseInt(formData.rank),
          lora_optimized: formData.lora_optimized,
          status: 'Waiting' 
        };
        
       

      }else{
      // Format data according to backend schema
       trainingData = {
        name: formData.name,
        dataset: formData.dataset,
        dataset_path: formData.dataset?.name || null,
        epochs: parseInt(formData.epochs),
        batch_size: parseInt(formData.batch_size),
        learning_rate: parseFloat(formData.learning_rate),
        // eval_steps: parseInt(formData.eval_steps),
        token_length: parseInt(formData.token_length),
        quantization: formData.quantization,
        rank: parseInt(formData.rank),
        lora_optimized: formData.lora_optimized,
        status: action === 'train' ? 'In-Progress' : 'Queued'
      };
      
    }
      await onSubmit(trainingData, action);
      // setCurrentStep(1);
      // setFormData(initialFormState);
      onClose();
    } catch (error) {
      setFormError(error.response?.data?.detail || 'Failed to create training job');
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
        Create New Job
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
              {currentStep === 4 ? (
                <>
                  <button
                    type="button"
                    onClick={() => handleSubmit('save')}
                    disabled={!Object.values(stepsValidation).every(v => v)}
                    className={`px-3 py-1.5 bg-white text-primary-light border border-primary-light rounded-md transition-colors duration-200 text-sm ${
                      !Object.values(stepsValidation).every(v => v) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-primary-light hover:text-white'
                    }`}
                  >
                    Save Job
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSubmit('train')}
                    disabled={!Object.values(stepsValidation).every(v => v)}
                    className={`px-3 py-1.5 bg-primary-light text-white rounded-md transition-colors duration-200 text-sm ${
                      !Object.values(stepsValidation).every(v => v) 
                        ? 'opacity-50 cursor-not-allowed' 
                        : 'hover:bg-primary-dark'
                    }`}
                  >
                    Save & Start Training
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

export default GyanTrainingModal;