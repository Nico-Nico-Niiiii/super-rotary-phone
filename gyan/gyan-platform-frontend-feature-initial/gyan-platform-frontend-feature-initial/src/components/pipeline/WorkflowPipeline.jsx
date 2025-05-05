import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, MoreHorizontal, MessageSquare, X, Brain, BarChart2, Rocket, GripHorizontal, AlertCircle, Database, MessageCircleMore, ChevronRight, ChevronLeft } from 'lucide-react';
import GyanTrainingModal from '../GyanTrainingJobModal'; 
import axios from 'axios';
import endpoints from '../../endpoints.json';
import { useLocation } from 'react-router-dom';
const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const WorkflowPipeline = () => {
  const [draggedItem, setDraggedItem] = useState(null);
  const [steps, setSteps] = useState([]);
  const [error, setError] = useState('');
  const [draggedStep, setDraggedStep] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const canvasRef = useRef(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
const [selectedTrainingType, setSelectedTrainingType] = useState(null);

// completed jobs state
const [completedJobs, setCompletedJobs] = useState([]);

const location = useLocation();
const projectId = location.state?.projectId;
const projectName = location.state?.projectName || 'New Pipeline';
const workflowId = location.state?.workflowId;
const [workflowName, setWorkflowName] = useState('');
const [saveSuccess, setSaveSuccess] = useState(false);
const [saveError, setSaveError] = useState('');
const [isLoading, setIsLoading] = useState(false);


useEffect(() => {
  // If a workflowId is provided, fetch the existing workflow
  if (workflowId) {
    fetchExistingWorkflow(workflowId);
  }
}, [workflowId]);


const fetchExistingWorkflow = async (id) => {
  setIsLoading(true);
  setError('');
  
  try {
    const response = await api.get(
      `${endpoints.workflow.prefix}${endpoints.workflow.routes.get.replace('{workflow_id}', id)}`
    );
    
    if (response.data) {
      setWorkflowName(response.data.name);
      
      // Transform the steps from the API response to match our local state structure
      const fetchedSteps = response.data.steps.map((step, index) => ({
        id: Date.now() + index, // Generate unique IDs for each step
        type: step.type,
        name: step.name,
        status: step.status || 'pending',
        order: step.order || index,
        position: step.position || { 
          x: 100 + (index * 300), 
          y: 200 
        },
        selectedJob: step.selected_job
      }));
      
      setSteps(fetchedSteps);
    }
  } catch (error) {
    console.error('Error fetching workflow:', error.response?.data || error);
    setError('Failed to load workflow: ' + (error.response?.data?.detail || error.message));
  } finally {
    setIsLoading(false);
  }
};

const saveWorkflow = async () => {
  if (!workflowName.trim()) {
    setSaveError('Please provide a workflow name');
    return;
  }
  
  if (steps.length === 0) {
    setSaveError('Cannot save an empty workflow');
    return;
  }
  
  setIsLoading(true);
  setSaveError('');
  
  try {
    const workflowData = {
      name: workflowName,
      project_id: projectId,
      steps: steps.map(step => ({
        type: step.type,
        name: step.name,
        status: step.status,
        order: step.order,
        position: step.position,
        selected_job: step.selectedJob || null,
      }))
    };
    
    let response;
    
    if (workflowId) {
      // Update existing workflow
      response = await api.put(
        `${endpoints.workflow.prefix}${endpoints.workflow.routes.update.replace('{workflow_id}', workflowId)}`,
        workflowData
      );
    } else {
      // Create new workflow
      response = await api.post(
        `${endpoints.workflow.prefix}${endpoints.workflow.routes.save}`,
        workflowData
      );
    }
    
    if (response.data) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  } catch (error) {
    console.error('Error saving workflow:', error.response?.data || error);
    setSaveError('Failed to save workflow: ' + (error.response?.data?.detail || error.message));
  } finally {
    setIsLoading(false);
  }
};

// // Add these functions before the return statement
// const saveWorkflow = async () => {
//   if (!workflowName.trim()) {
//     setSaveError('Please provide a workflow name');
//     return;
//   }
  
//   if (steps.length === 0) {
//     setSaveError('Cannot save an empty workflow');
//     return;
//   }
  
//   setIsLoading(true);
//   setSaveError('');
  
//   try {
//     const workflowData = {
//       name: workflowName,
//       project_id: projectId,
//       steps: steps.map(step => ({
//         type: step.type,
//         name: step.name,
//         status: step.status,
//         order: step.order,
//         position: step.position,
//         selected_job: step.selectedJob || null,
//       }))
//     };
    
//     const response = await api.post(
//       `${endpoints.workflow.prefix}${endpoints.workflow.routes.save}`,
//       workflowData
//     );
    
//     if (response.data) {
//       setSaveSuccess(true);
//       setTimeout(() => setSaveSuccess(false), 3000);
//     }
//   } catch (error) {
//     console.error('Error saving workflow:', error.response?.data || error);
//     setSaveError('Failed to save workflow: ' + (error.response?.data?.detail || error.message));
//   } finally {
//     setIsLoading(false);
//   }
// };

const triggerWorkflow = async () => {
  if (steps.length === 0) {
    setError('Cannot trigger an empty workflow');
    return;
  }
  
  setIsLoading(true);
  setError('');
  
  try {
    const response = await api.post(
      `${endpoints.workflow.prefix}${endpoints.workflow.routes.trigger}`,
      { steps: steps.map(step => ({ type: step.type, order: step.order, selected_job: step.selectedJob || null })) }
    );
    
    if (response.data) {
      // Update steps with new status
      const updatedSteps = [...steps];
      updatedSteps[0].status = 'running';
      setSteps(updatedSteps);
    }
  } catch (error) {
    console.error('Error triggering workflow:', error.response?.data || error);
    setError('Failed to trigger workflow: ' + (error.response?.data?.detail || error.message));
  } finally {
    setIsLoading(false);
  }
};

// function to fetch jobs
const fetchJobs = async () => {
  try{
    const response = await api.get(
      `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}',)}`
    )

  }catch(error){
    console.log("Error occur during fetching completed jobs", error);
    
  }
}


// function to handle form submission
const handleGyanTraining = async (formData, action) => {
  try {
    console.log("Hi from handleGyanTraining");
    console.log(formData);
    
    const form = new FormData();
    if (formData.dataset) {
      form.append('dataset', formData.dataset);
    }
    
    const trainingData = {
      name: formData.name,
      epochs: parseInt(formData.epochs || 0),
      batch_size: parseInt(formData.batch_size || 0),
      learning_rate: parseFloat(formData.learning_rate || 0),
      token_length: parseInt(formData.token_length || 0),
      quantization: formData.quantization || '',
      rank: parseInt(formData.rank || 0),
      lora_optimized: Boolean(formData.lora_optimized),
      status: action === 'train' ? 'Queued' : 'Queued'
    };

    form.append('data', JSON.stringify(trainingData));

    const response = await api.post(
      `${endpoints.training.prefix}${endpoints.training.routes.create}?project_id=${id}`,
      form,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    if (response.data) {
      const newJob = {
        id: response.data.id,
        jobName: response.data.name,
        status: response.data.status,
        startedOn: new Date(response.data.started_on).toLocaleDateString(),
        modelType: response.data.model_name,
        error: response.data.error
      };
      setIsGyanModalOpen(false);
    }
  } catch (error) {
    console.error('Error creating training job:', error.response?.data || error);
  }
};

 
  // Define valid sequences
  const validSequences = {
    'start': ['train'],
    'train': ['evaluate'],
    'evaluate': ['deploy', 'rag', 'prompt'],
    'rag': ['deploy', 'prompt'],
    'prompt': ['deploy'],
    'deploy': []
  };

  const availableComponents = [
    {
      category: 'Model Pipeline',
      items: [
        {
          type: 'train',
          name: 'Train Model',
          icon: <Brain className="w-6 h-6" />,
          description: 'Train machine learning model',
          sequence: 1,
          required: true
        },
        {
          type: 'evaluate',
          name: 'Model Evaluation',
          icon: <BarChart2 className="w-6 h-6" />,
          description: 'Evaluate model performance',
          sequence: 2,
          required: true
        },
        {
          type: 'rag',
          name: 'RAG Pipeline',
          icon: <Database className="w-6 h-6" />,
          description: 'Retrieval Augmented Generation',
          sequence: 3,
          required: false
        },
        {
          type: 'prompt',
          name: 'Prompt Engineering',
          icon: <MessageCircleMore className="w-6 h-6" />,
          description: 'Configure model prompts',
          sequence: 4,
          required: false
        },
        {
          type: 'deploy',
          name: 'Deploy Model',
          icon: <Rocket className="w-6 h-6" />,
          description: 'Deploy model to production',
          sequence: 5,
          required: true
        }
      ]
    }
  ];

 

  const isValidNextStep = (componentType) => {
    if (steps.length === 0 && componentType === 'train') return true;
    if (steps.length === 0 && componentType !== 'train') {
      setError('Pipeline must start with Train Model step');
      return false;
    }

    const lastStep = steps[steps.length - 1];
    const validNextSteps = validSequences[lastStep.type];
    
    if (!validNextSteps.includes(componentType)) {
      setError(`Cannot add ${componentType} after ${lastStep.type}`);
      return false;
    }
    return true;
  };

  const handleDragStart = (e, component) => {
    setDraggedItem(component);
    e.dataTransfer.setData('text/plain', '');
    e.target.style.opacity = '0.5';
  };

  const handleStepDragStart = (e, step) => {
    setDraggedStep(step);
    e.target.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedItem(null);
    setDraggedStep(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const canvasRect = canvasRef.current.getBoundingClientRect();
    const dropX = e.clientX - canvasRect.left;
    const dropY = e.clientY - canvasRect.top;

    if (draggedStep) {
      setSteps(prev => prev.map(step => 
        step.id === draggedStep.id 
          ? { ...step, position: { x: dropX - 100, y: dropY - 40 } }
          : step
      ));
    } else if (draggedItem) {
      if (!isValidNextStep(draggedItem.type)) return;

      const newStep = {
        id: Date.now(),
        type: draggedItem.type,
        name: draggedItem.name,
        status: 'pending',
        order: steps.length,
        position: {
          x: dropX - 100,
          y: dropY - 40
        }
      };

      setSteps(prev => [...prev, newStep]);
      setError('');
    }

    setDraggedItem(null);
    setDraggedStep(null);
  };

  const handleComponentClick = (component) => {
    if (!isValidNextStep(component.type)) return;

    const lastStep = steps[steps.length - 1];
    const newStep = {
      id: Date.now(),
      type: component.type,
      name: component.name,
      status: 'pending',
      order: steps.length,
      position: {
        x: lastStep ? lastStep.position.x + 300 : 100,
        y: lastStep ? lastStep.position.y : 200
      }
    };

    setSteps(prev => [...prev, newStep]);
    setError('');
  };

  const getStepIcon = (type) => {
    switch (type) {
      case 'train':
        return <Brain className="w-6 h-6 text-purple-600 dark:text-purple-400" />;
      case 'evaluate':
        return <BarChart2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />;
      case 'rag':
        return <Database className="w-6 h-6 text-amber-600 dark:text-amber-400" />;
      case 'prompt':
        return <MessageCircleMore className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />;
      case 'deploy':
        return <Rocket className="w-6 h-6 text-green-600 dark:text-green-400" />;
      default:
        return null;
    }
  };

  const getStepColor = (type) => {
    switch (type) {
      case 'train':
        return 'border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-900/30';
      case 'evaluate':
        return 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/30';
      case 'rag':
        return 'border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-900/30';
      case 'prompt':
        return 'border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-900/30';
      case 'deploy':
        return 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/30';
      default:
        return 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/30';
    }
  };

  const deleteStep = (stepId) => {
    setSteps(prevSteps => {
      const stepIndex = prevSteps.findIndex(step => step.id === stepId);
      if (stepIndex !== prevSteps.length - 1) {
        setError('Can only remove the last step in the sequence');
        return prevSteps;
      }
      return prevSteps.filter(step => step.id !== stepId);
    });
  };

   // Close dropdown when clicking outside
   useEffect(() => {
    const handleClickOutside = (event) => {
      if (openDropdownId && !event.target.closest('.dropdown-container')) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openDropdownId]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Main Canvas */}
      <div className="flex-1 flex flex-col">
        {error && (
          <div className="mx-4 mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center space-x-2 text-red-800 dark:text-red-200">
            <AlertCircle className="h-5 w-5 text-red-500" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden p-8"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >

          {/* Connection Lines with better visibility */}
<svg className="absolute inset-0" style={{ zIndex: 1, pointerEvents: 'none', overflow: 'visible' }}>
  <defs>
    <marker
      id="arrowhead"
      markerWidth="12"
      markerHeight="8"
      refX="9"
      refY="4"
      orient="auto"
    >
      <path
        d="M0,0 L12,4 L0,8 L2,4 Z"
        className="fill-gray-400 dark:fill-gray-500"
      />
    </marker>
  </defs>
  {steps.map((step, index) => {
    if (index < steps.length - 1) {
      const nextStep = steps[index + 1];
      const startX = step.position.x + 288; // Adjusted for card width
      const startY = step.position.y + 40;  // Center of the card
      const endX = nextStep.position.x;
      const endY = nextStep.position.y + 40;

      return (
        <g key={`connection-${step.id}`}>
          {/* Main connection line */}
          <path
            d={`M ${startX} ${startY} C ${startX + 60} ${startY}, ${endX - 60} ${endY}, ${endX} ${endY}`}
            className="stroke-gray-300 dark:stroke-gray-600"
            strokeWidth="2"
            fill="none"
            markerEnd="url(#arrowhead)"
            style={{
              strokeDasharray: '0',
              strokeLinecap: 'round',
              filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
            }}
          />
          {/* Connection point */}
          <circle 
            cx={startX} 
            cy={startY} 
            r="3.5"
            className="fill-gray-300 dark:fill-gray-600"
            style={{
              filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
            }}
          />
        </g>
      );
    }
    return null;
  })}
</svg>

          {/* Steps */}
          {steps.map((step) => (
            <div
              key={step.id}
              className={`absolute bg-white dark:bg-gray-800 rounded-lg border-2 ${getStepColor(step.type)} p-6 shadow-sm hover:shadow-md transition-shadow w-72 cursor-move`}
              style={{
                left: `${step.position.x}px`,
                top: `${step.position.y}px`,
                touchAction: 'none',
                zIndex: 20
              }}
              draggable="true"
              onDragStart={(e) => handleStepDragStart(e, step)}
              onDragEnd={handleDragEnd}
            >
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 flex items-center justify-center bg-white dark:bg-gray-700 rounded-lg">
                    {/* {getStepIcon(step.type)} */}
                    <div className="scale-125">{getStepIcon(step.type)}</div>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-green-500 absolute -top-1 -right-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {step.name}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Step {step.order + 1} of {steps.length}
                  </p>
                  {step.type === 'train' && step.selectedJob && (
    <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">
      {trainJobs.find(job => job.id === step.selectedJob)?.name}
    </p>
  )}
                </div>
              </div>

              <div className="absolute top-2 right-2 flex space-x-1">
                
                {/* <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                  <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button> */}
                {step.type === 'train' && (
  <div className="dropdown-container relative">
    <button
      onClick={() => setOpenDropdownId(openDropdownId === step.id ? null : step.id)}
      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
    >
      <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
    </button>
    {openDropdownId === step.id && (
      <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
        <div className="py-1">
          <button
            onClick={() => {
              setSelectedTrainingType('new');
              setIsGyanModalOpen(true);
              setOpenDropdownId(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            New Training Job
          </button>
          <button
            onClick={() => {
              setSelectedTrainingType('existing');
              setIsGyanModalOpen(true);
              setOpenDropdownId(null);
            }}
            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            Existing Training Job
          </button>
        </div>
      </div>
    )}
  </div>
)}

 {!step.type === 'train' && (
                  <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
                    <MoreHorizontal className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  </button>
                )}
                <button 
                  onClick={() => deleteStep(step.id)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
                >
                  <X className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
              </div>
            </div>
          ))}
          
        </div>
      </div>

      {/* Toggle Sidebar Button */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="fixed right-0 top-1/2 transform -translate-y-1/2 z-20 bg-white dark:bg-gray-800 p-2 rounded-l-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isSidebarOpen ? (
          <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        ) : (
          <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        )}
      </button>

      {/* Components Sidebar */}
      <div 
        className={`transition-all duration-300 ease-in-out ${
          isSidebarOpen ? 'w-80 opacity-100' : 'w-0 opacity-0'
        } bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 overflow-y-auto shadow-lg`}
      >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Components</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Drag or click components to add to pipeline</p>
        </div>

        <div className="p-4">
          {availableComponents.map((category) => (
            <div key={category.category} className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
                {category.category}
              </h4>
              <div className="space-y-2">
                {category.items.map((component) => (
                  <div
                    key={component.type}
                    className="flex items-center p-3 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-sm transition-all"
                    draggable="true"
                    onDragStart={(e) => handleDragStart(e, component)}
                    onDragEnd={handleDragEnd}
                    onClick={() => handleComponentClick(component)}
                  >
                    <GripHorizontal className="w-4 h-4 text-gray-400 mr-3" />
                    <div className="mr-3 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                      {component.icon}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {component.name}
                      </p>
                      <div className="flex items-center space-x-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {component.description}
                        </p>
                        {component.required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            Required
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 mt-auto">
    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">Workflow Controls</h3>
    
    {/* Workflow Name Input */}
    <div className="mb-3">
      <label htmlFor="workflow-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Workflow Name
      </label>
      <input
        id="workflow-name"
        type="text"
        placeholder="Enter workflow name"
        value={workflowName}
        onChange={(e) => setWorkflowName(e.target.value)}
        className="w-full border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm dark:bg-gray-700 dark:text-gray-100"
      />
    </div>
    
    {/* Save Button */}
    <button
      onClick={saveWorkflow}
      disabled={isLoading}
      className="w-full mb-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center justify-center"
    >
      {isLoading ? 'Saving...' : 'Save Workflow'}
    </button>
    
    {/* Trigger Button */}
    <button
      onClick={triggerWorkflow}
      disabled={isLoading || steps.length === 0}
      className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium flex items-center justify-center"
    >
      {isLoading ? 'Processing...' : 'Trigger Workflow'}
    </button>
    
    {/* Notifications */}
    {saveSuccess && (
      <div className="mt-3 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200 rounded-lg text-sm">
        Workflow saved successfully!
      </div>
    )}
    
    {saveError && (
      <div className="mt-3 p-2 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 rounded-lg text-sm">
        {saveError}
      </div>
    )}
     {projectId && (
      <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-lg text-sm">
        Project: {projectName}
      </div>
    )}

</div>
      </div>
      {/* Add this just before the final closing div of your return statement */}
{isGyanModalOpen && (
  <GyanTrainingModal
    isOpen={isGyanModalOpen}
    onClose={() => setIsGyanModalOpen(false)}
    onSubmit={handleGyanTraining}
  />
)}
     
    </div>
  );
}
export default WorkflowPipeline;
