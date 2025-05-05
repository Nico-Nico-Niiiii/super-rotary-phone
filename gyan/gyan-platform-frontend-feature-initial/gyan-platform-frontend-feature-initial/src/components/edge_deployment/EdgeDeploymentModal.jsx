import React, { useState, useEffect } from 'react';
import { X, Plus, ChevronDown, Loader } from 'lucide-react';
import { CompilationApiService } from '../../services/CompilationApiService';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';

const EdgeDeploymentModal = ({ isOpen, onClose, onOptimize }) => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [trainingJobs, setTrainingJobs] = useState([]);
  const [formData, setFormData] = useState({
    modelType: '',
    modelName: '',
    projectName: '',
    trainingJob: '',
    framework: '',
    precisionType: '',
  });

  const [dropdowns, setDropdowns] = useState({
    isModelTypeDropdownOpen: false,
    isModelNameDropdownOpen: false,
    isProjectNameDropdownOpen: false,
    isTrainingJobDropdownOpen: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [optimizationLogs, setOptimizationLogs] = useState([]);

  // Fetch projects when component mounts
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await axios.get(`http://localhost:8000/project/user/${user.id}`, {
          withCredentials: true
        });
        console.log("Repsosne", response.data);
        
        setProjects(response.data);
      } catch (error) {
        console.error('Error fetching projects:', error);
      }
    };

    fetchProjects();
  }, [user.id]);

  // Fetch training jobs when project is selected
  useEffect(() => {
    const fetchTrainingJobs = async () => {
      if (formData.projectName) {
        try {
          const selectedProject = projects.find(p => p.name === formData.projectName);
          console.log("Selected project", selectedProject);
          
          if (selectedProject) {
            const response = await axios.get(`http://localhost:8000/training/list/${selectedProject.id}`, {
              withCredentials: true
            });
            setTrainingJobs(response.data);
          }
        } catch (error) {
          console.error('Error fetching training jobs:', error);
        }
      }
    };

    fetchTrainingJobs();
  }, [formData.projectName, projects]);

  // Frameworks 
  const frameworks = [
    { value: 'onnx', label: 'ONNX', precisionTypes: ['fp32', 'fp16'] },
    { value: 'openvino', label: 'OpenVINO', precisionTypes: ['int4', 'int8', 'fp16', 'fp32'] }
  ];

  // Get unique model types
  const modelTypes = [...new Set(projects.map(p => p.model_type))];

  // Get model names based on selected model type
  const modelNames = formData.modelType 
    ? [...new Set(projects.filter(p => p.model_type === formData.modelType).map(p => p.model_name))]
    : [];

  // Get project names based on selected model name
  // const projectNames = formData.modelName
  //   ? [...new Set(projects.filter(p => p.model_name === formData.modelName).map(p => p.name))]
  //   : ['Shree'];


  const projectNames = formData.modelName
  ? (() => {
      const filtered = projects.filter(p => p.model_name === formData.modelName);
      console.log('Filtered projects for model_name:', formData.modelName, filtered);
      return [...new Set(filtered.map(p => p.name))];
    })()
  : [];




  const handleChange = (field, value) => {
    setFormData(prev => {
      // Reset dependent fields when certain fields change
      const resetFields = {
        modelType: { modelName: '', projectName: '', trainingJob: '', framework: '', precisionType: '' },
        modelName: { projectName: '', trainingJob: '', framework: '', precisionType: '' },
        projectName: { trainingJob: '', framework: '', precisionType: '' },
        framework: { precisionType: '' }
      };

      return {
        ...prev,
        [field]: value,
        ...(resetFields[field] || {})
      };
    });

    // Close dropdowns
    setDropdowns(prev => ({
      ...prev,
      [`is${field.charAt(0).toUpperCase() + field.slice(1)}DropdownOpen`]: false
    }));
  };

  const toggleDropdown = (field) => {
    setDropdowns(prev => ({
      ...prev,
      [`is${field.charAt(0).toUpperCase() + field.slice(1)}DropdownOpen`]: 
        !prev[`is${field.charAt(0).toUpperCase() + field.slice(1)}DropdownOpen`]
    }));
  };

  const handleOptimize = async () => {
    // Basic validation
    if (!formData.framework || !formData.precisionType) {
      alert('Please complete all selections');
      return;
    }

    setIsSubmitting(true);
    setOptimizationLogs([
      { 
        stage: 'Initialization', 
        status: 'Started', 
        timestamp: new Date().toISOString(),
        details: 'Starting optimization process...'
      }
    ]);

    // Declare optimizedProject outside the try block
    let optimizedProject = null;

    try {
      // Call API to optimize model
      const reader = await CompilationApiService.optimizeModel({
        framework: formData.framework,
        precisionType: formData.precisionType
      });

      // Create project object to update UI
      const optimizedProject = {
        id: Date.now(),
        name: formData.projectName,
        trainingJob: formData.trainingJob,
        deploymentType: formData.modelType,
        model: formData.modelName,
        framework: formData.framework,
        precisionType: formData.precisionType,
        status: 'Optimizing',
        created_date: new Date().toISOString(),
        optimizationLogs: [...optimizationLogs]
      };

      // Call onOptimize to update projects list
      onOptimize(optimizedProject);
      
      // Process the streaming response from the optimization API
      await CompilationApiService.processOptimizationStream(reader, (data) => {
        // Update logs with new data
        const newLog = {
          stage: data.stage || 'Processing',
          status: data.status || 'Running',
          timestamp: new Date().toISOString(),
          details: data.details || data.message || 'Processing...'
        };
        
        setOptimizationLogs(prev => [...prev, newLog]);
        
        // Update project status if complete
        if (data.status === 'Success' && data.stage === 'Completion') {
          const updatedProject = {
            ...optimizedProject,
            status: 'Completed',
            optimizationLogs: [...optimizationLogs, newLog]
          };
          onOptimize(updatedProject);
        }
      });
      
      // Reset form after successful submission
      setFormData({
        modelType: '',
        modelName: '',
        projectName: '',
        trainingJob: '',
        framework: '',
        precisionType: '',
      });
      
      onClose();
    } catch (error) {
      console.error('Error during optimization:', error);
      
      // Add error log
      setOptimizationLogs(prev => [
        ...prev,
        {
          stage: 'Error',
          status: 'Error',
          timestamp: new Date().toISOString(),
          details: `Optimization failed: ${error.message}`
        }
      ]);
      
      // Update project with error status
      onOptimize({
        ...optimizedProject,
        status: 'Failed',
        optimizationLogs: [...optimizationLogs]
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get available precision types based on selected framework
  const availablePrecisionTypes = 
    frameworks.find(f => f.value === formData.framework)?.precisionTypes || [];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Edge Deployment Project</h2>
          <button 
            onClick={onClose}
            disabled={isSubmitting}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Model Type Dropdown */}
          <div className="relative">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Model Type
            </label>
            <div 
              onClick={() => toggleDropdown('ModelType')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                         flex justify-between items-center cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-primary-light"
            >
              <span>{formData.modelType || 'Select Model Type'}</span>
              <ChevronDown size={20} />
            </div>
            {dropdowns.isModelTypeDropdownOpen && (
              <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 
                             border border-gray-300 dark:border-gray-600 
                             rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                {modelTypes.map(type => (
                  <li 
                    key={type}
                    onClick={() => handleChange('modelType', type)}
                    className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                  >
                    {type}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Model Name Dropdown */}
          {formData.modelType && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Model Name
              </label>
              <div 
                onClick={() => toggleDropdown('ModelName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                           flex justify-between items-center cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <span>{formData.modelName || 'Select Model Name'}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.isModelNameDropdownOpen && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 
                               border border-gray-300 dark:border-gray-600 
                               rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {modelNames.map(name => (
                    <li 
                      key={name}
                      onClick={() => handleChange('modelName', name)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Project Name Dropdown */}
          {formData.modelName && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project Name
              </label>
              <div 
                onClick={() => toggleDropdown('ProjectName')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                           flex justify-between items-center cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <span>{formData.projectName || 'Select Project Name'}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.isProjectNameDropdownOpen && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 
                               border border-gray-300 dark:border-gray-600 
                               rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {projectNames.map(name => (
                    <li 
                      key={name}
                      onClick={() => handleChange('projectName', name)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      {name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Training Job Dropdown */}
          {formData.projectName && trainingJobs.length > 0 && (
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Training Job
              </label>
              <div 
                onClick={() => toggleDropdown('TrainingJob')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
                           flex justify-between items-center cursor-pointer
                           focus:outline-none focus:ring-2 focus:ring-primary-light"
              >
                <span>{formData.trainingJob || 'Select Training Job'}</span>
                <ChevronDown size={20} />
              </div>
              {dropdowns.isTrainingJobDropdownOpen && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 
                               border border-gray-300 dark:border-gray-600 
                               rounded-lg mt-1 shadow-lg max-h-60 overflow-y-auto">
                  {trainingJobs.map(job => (
                    <li 
                      key={job.id}
                      onClick={() => handleChange('trainingJob', job.name)}
                      className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                    >
                      {job.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Framework and Precision Type */}
          {formData.trainingJob && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Framework
                </label>
                <select
                  value={formData.framework}
                  onChange={(e) => handleChange('framework', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                >
                  <option value="">Select Framework</option>
                  {frameworks.map(framework => (
                    <option key={framework.value} value={framework.value}>
                      {framework.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Precision Type
                </label>
                <select
                  value={formData.precisionType}
                  onChange={(e) => handleChange('precisionType', e.target.value)}
                  disabled={!formData.framework}
                  className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light 
                    ${!formData.framework ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
                >
                  <option value="">Select Precision</option>
                  {availablePrecisionTypes.map(precision => (
                    <option key={precision} value={precision}>
                      {precision.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Optimize Button */}
          {formData.precisionType && (
            <div className="pt-4">
              <button
                onClick={handleOptimize}
                disabled={isSubmitting}
                className={`w-full px-4 py-2 bg-primary-light text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2
                  ${isSubmitting ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-dark'}`}
              >
                {isSubmitting ? (
                  <>
                    <Loader size={20} className="animate-spin" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Plus size={20} />
                    Optimize Project
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EdgeDeploymentModal;


// import React, { useState, useEffect } from 'react';
// import { X, Plus, ChevronDown, Loader } from 'lucide-react';
// import { CompilationApiService } from '../../services/CompilationApiService';

// const EdgeDeploymentModal = ({ isOpen, onClose, onOptimize }) => {
//   const [formData, setFormData] = useState({
//     projectName: 'Project-A',
//     trainingJob: 'job1',
//     projectType: 'llm',
//     model: 'ID_GYAN_LLAMA3',
//     framework: '',
//     precisionType: '',
//   });

//   const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [optimizationLogs, setOptimizationLogs] = useState([]);

//   // Fixed project name and training job
//   const projectNames = [
//     { value: 'Project-A', trainingJob: 'job1' }
//   ];

//   // Project type is now fixed to LLM
//   const projectTypes = [
//     { value: 'llm', label: 'Large Language Model' }
//   ];

//   // Fixed model name
//   const models = [
//     { value: 'ID_GYAN_LLAMA3', label: 'ID_GYAN_LLAMA3' }
//   ];

//   // Updated frameworks
//   const frameworks = [
//     { value: 'onnx', label: 'ONNX', precisionTypes: ['fp32', 'fp16'] },
//     { value: 'openvino', label: 'OpenVINO', precisionTypes: ['int4', 'int8', 'fp16', 'fp32'] }
//   ];

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData(prev => {
//       // If framework changes, reset precision type
//       if (name === 'framework') {
//         return {
//           ...prev,
//           [name]: value,
//           precisionType: '' // Reset precision type when framework changes
//         };
//       }
//       return {
//         ...prev,
//         [name]: value
//       };
//     });
//   };

//   const handleOptimize = async () => {
//     // Basic validation
//     if (!formData.framework || !formData.precisionType) {
//       alert('Please select Framework and Precision Type');
//       return;
//     }

//     setIsSubmitting(true);
//     setOptimizationLogs([
//       { 
//         stage: 'Initialization', 
//         status: 'Started', 
//         timestamp: new Date().toISOString(),
//         details: 'Starting optimization process...'
//       }
//     ]);

//     // Declare optimizedProject outside the try block
//     let optimizedProject = null;

//     try {
//       // Call API to optimize model
//       const reader = await CompilationApiService.optimizeModel({
//         framework: formData.framework,
//         precisionType: formData.precisionType
//       });

//       // Create project object to update UI
//       const optimizedProject = {
//         id: Date.now(),
//         name: formData.projectName,
//         trainingJob: formData.trainingJob,
//         deploymentType: formData.projectType,
//         model: formData.model,
//         framework: formData.framework,
//         precisionType: formData.precisionType,
//         status: 'Optimizing',
//         created_date: new Date().toISOString(),
//         optimizationLogs: [...optimizationLogs]
//       };

//       // Call onOptimize to update projects list
//       onOptimize(optimizedProject);
      
//       // Process the streaming response from the optimization API
//       await CompilationApiService.processOptimizationStream(reader, (data) => {
//         // Update logs with new data
//         const newLog = {
//           stage: data.stage || 'Processing',
//           status: data.status || 'Running',
//           timestamp: new Date().toISOString(),
//           details: data.details || data.message || 'Processing...'
//         };
        
//         setOptimizationLogs(prev => [...prev, newLog]);
        
//         // Update project status if complete
//         if (data.status === 'Success' && data.stage === 'Completion') {
//           const updatedProject = {
//             ...optimizedProject,
//             status: 'Completed',
//             optimizationLogs: [...optimizationLogs, newLog]
//           };
//           onOptimize(updatedProject);
//         }
//       });
      
//       // Reset form after successful submission
//       setFormData({
//         projectName: 'Project-A',
//         trainingJob: 'job1',
//         projectType: 'llm',
//         model: 'ID_GYAN_LLAMA3',
//         framework: '',
//         precisionType: '',
//       });
      
//       onClose();
//     } catch (error) {
//       console.error('Error during optimization:', error);
      
//       // Add error log
//       setOptimizationLogs(prev => [
//         ...prev,
//         {
//           stage: 'Error',
//           status: 'Error',
//           timestamp: new Date().toISOString(),
//           details: `Optimization failed: ${error.message}`
//         }
//       ]);
      
//       // Update project with error status
//       onOptimize({
//         ...optimizedProject,
//         status: 'Failed',
//         optimizationLogs: [...optimizationLogs]
//       });
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   // Get available precision types based on selected framework
//   const availablePrecisionTypes = 
//     frameworks.find(f => f.value === formData.framework)?.precisionTypes || [];

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg mx-4">
//         <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
//           <h2 className="text-xl font-bold text-gray-900 dark:text-white">New Edge Deployment Project</h2>
//           <button 
//             onClick={onClose}
//             disabled={isSubmitting}
//             className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//           >
//             <X size={24} />
//           </button>
//         </div>

//         <div className="p-6 space-y-4">
//           {/* Project Name Dropdown */}
//           <div className="relative">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Project-A
//             </label>
//             <div 
//               onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
//               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg 
//                          flex justify-between items-center cursor-pointer
//                          focus:outline-none focus:ring-2 focus:ring-primary-light"
//             >
//               <span>{formData.projectName} - {formData.trainingJob}</span>
//               <ChevronDown size={20} />
//             </div>
//             {isProjectDropdownOpen && (
//               <ul className="absolute z-10 w-full bg-white dark:bg-gray-700 
//                              border border-gray-300 dark:border-gray-600 
//                              rounded-lg mt-1 shadow-lg">
//                 {projectNames.map(project => (
//                   <li 
//                     key={project.value}
//                     onClick={() => {
//                       setFormData(prev => ({
//                         ...prev,
//                         projectName: project.value,
//                         trainingJob: project.trainingJob
//                       }));
//                       setIsProjectDropdownOpen(false);
//                     }}
//                     className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
//                   >
//                     {project.value} - {project.trainingJob}
//                   </li>
//                 ))}
//               </ul>
//             )}
//           </div>

//           {/* Project Type (Fixed to LLM) */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Project Type
//             </label>
//             <input
//               type="text"
//               value="Large Language Model"
//               disabled
//               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
//             />
//           </div>

//           {/* Model (Fixed to ID_GYAN_LLAMA) */}
//           <div>
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Model
//             </label>
//             <input
//               type="text"
//               value="ID_GYAN_LLAMA3"
//               disabled
//               className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
//             />
//           </div>

//           {/* Framework and Precision Type in a single row */}
//           <div className="grid grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Framework
//               </label>
//               <select
//                 name="framework"
//                 value={formData.framework}
//                 onChange={handleChange}
//                 disabled={isSubmitting}
//                 className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//               >
//                 <option value="">Select Framework</option>
//                 {frameworks.map(framework => (
//                   <option key={framework.value} value={framework.value}>
//                     {framework.label}
//                   </option>
//                 ))}
//               </select>
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                 Precision Type
//               </label>
//               <select
//                 name="precisionType"
//                 value={formData.precisionType}
//                 onChange={handleChange}
//                 disabled={!formData.framework || isSubmitting}
//                 className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light 
//                   ${!formData.framework ? 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed' : ''}`}
//               >
//                 <option value="">Select Precision</option>
//                 {availablePrecisionTypes.map(precision => (
//                   <option key={precision} value={precision}>
//                     {precision.toUpperCase()}
//                   </option>
//                 ))}
//               </select>
//             </div>
//           </div>

//           <div className="pt-4">
//             <button
//               onClick={handleOptimize}
//               disabled={isSubmitting || !formData.framework || !formData.precisionType}
//               className={`w-full px-4 py-2 bg-primary-light text-white rounded-lg transition-colors duration-200 flex items-center justify-center gap-2
//                 ${(isSubmitting || !formData.framework || !formData.precisionType) 
//                   ? 'opacity-50 cursor-not-allowed' 
//                   : 'hover:bg-primary-dark'}`}
//             >
//               {isSubmitting ? (
//                 <>
//                   <Loader size={20} className="animate-spin" />
//                   Optimizing...
//                 </>
//               ) : (
//                 <>
//                   <Plus size={20} />
//                   Optimize Project
//                 </>
//               )}
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EdgeDeploymentModal;