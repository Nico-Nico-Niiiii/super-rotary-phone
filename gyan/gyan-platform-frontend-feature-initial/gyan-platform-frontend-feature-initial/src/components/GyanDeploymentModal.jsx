// //////////////////////////////////////////

// import { useState, useEffect } from 'react';
// import { X, Copy, Check } from 'lucide-react';
// import axios from 'axios';
// import endpoints from '../endpoints.json';

// const BASE_URL = import.meta.env.VITE_APP_API_URL

// // Create axios instance with default config
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// const GyanDeploymentModal = ({ isOpen, onClose, onSubmit, editData = null, projectData }) => {
//   const [step, setStep] = useState(1);
//   const [copied, setCopied] = useState(false);
//   const [jobs, setJobs] = useState([]);
//   const [selectedJob, setSelectedJob] = useState('');
//   const [systemResources, setSystemResources] = useState(null);
//   const [resourceErrors, setResourceErrors] = useState({});

//   const [formData, setFormData] = useState({
//     name: '',
//     modelType: '',
//     selectedJobName: '',
//     namespace: '',
//     cpu: '',
//     gpu: '0',
//     memory: ''
//   });

//   useEffect(() => {
//     if (isOpen) {
//       fetchSystemResources();
//     }
//   }, [isOpen]);

//   useEffect(() => {
//     if (editData) {
//       setFormData({
//         name: editData.jobName,
//         modelType: editData.modelType || '',
//         namespace: editData.namespace || 'default',
//         cpu: editData.cpu || '0',
//         gpu: editData.gpu || '0',
//         memory: editData.memory || '0'
//       });
//     }
//   }, [editData]);

//   useEffect(() => {
//     if (isOpen && projectData?.id) {
//       fetchJobs();
//     }
//   }, [isOpen, projectData]);

//   useEffect(() => {
//     validateResources();
//   }, [systemResources]);

//   useEffect(() => {
//     if (systemResources && !editData) {
//       setFormData(prev => ({
//         ...prev,
//         cpu: '0',
//         gpu: '0',
//         memory: '0',
//       }));
//     }
//   }, [systemResources, editData]);

//   const validateResources = () => {
//     if (!systemResources) return;

//     const errors = {};

//     if (systemResources.available_cpus === 0) {
//       errors.cpu = 'No CPU resources available';
//     }
//     if (systemResources.available_gpus === 0) {
//       errors.gpu = 'No GPU resources available';
//     }
//     if (systemResources.available_memory_gb === 0) {
//       errors.memory = 'No memory resources available';
//     }

//     setResourceErrors(errors);
//   };

//   const fetchSystemResources = async () => {
//     try {
//       const response = await api.get(
//         `${endpoints.deployment.prefix}${endpoints.deployment.routes.check_system_resourses}`
//       );
//       setSystemResources(response.data);
//     } catch (error) {
//       console.error("Error checking available system resources", error);
//       setResourceErrors({
//         general: 'Failed to fetch system resources'
//       });
//     }
//   };

//   const fetchJobs = async () => {
//     try {
//       const response = await api.get(
//         `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', projectData.id)}`
//       );
//       const formattedJobs = response.data.map(job => ({
//         id: job.id,
//         jobName: job.name,
//         status: job.queue_status,
//         startedOn: new Date(job.started_on).toLocaleDateString(),
//         modelType: job.model_name
//       }));
//       setJobs(formattedJobs);
//     } catch (error) {
//       console.error('Error fetching jobs:', error);
//     }
//   };

//   const generateDeploymentName = (jobName) => {
//     const projectName = projectData?.name?.toLowerCase()?.replace(/\s+/g, '-') || 'dep';
//     const timestamp = Date.now().toString().slice(-4);
//     const randomStr = Math.random().toString(36).substring(2, 5);
//     return `${projectName}-${jobName}-${timestamp}-${randomStr}`;
//   };

//   const handleJobSelection = (e) => {
//     const selectedJobName = e.target.value;
//     const selectedJob = jobs.find(j => j.jobName === selectedJobName);
//     if (selectedJob) {
//       const deploymentName = generateDeploymentName(selectedJob.jobName);
//       setSelectedJob(selectedJobName);
//       setFormData(prev => ({
//         ...prev,
//         name: deploymentName,
//         modelType: selectedJob.modelType,
//         selectedJobName: selectedJob.jobName
//       }));
//     }
//   };

//   const generateYAML = () => {
//     return `apiVersion: v1
// kind: Deployment
// metadata:
//   name: ${formData.name}
//   namespace: ${formData.namespace}
// spec:
//   replicas: 1
//   template:
//     spec:
//       containers:
//       - name: ${formData.name}
//         image: gyan/${formData.modelType.toLowerCase()}
//         resources:
//           requests:
//             cpu: "${formData.cpu}"
//             memory: "${formData.memory}Gi"
//             nvidia.com/gpu: "${formData.gpu}"
//           limits:
//             cpu: "${systemResources?.available_cpus || formData.cpu}"
//             memory: "${systemResources?.available_memory_gb || formData.memory}Gi"
//             nvidia.com/gpu: "${systemResources?.available_gpus || formData.gpu}"`;
//   };

//   const handleCopy = async () => {
//     const yaml = generateYAML();
//     await navigator.clipboard.writeText(yaml);
//     setCopied(true);
//     setTimeout(() => setCopied(false), 2000);
//   };

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (step === 1) {
//       if (!editData) {
//         const deploymentName = generateDeploymentName(selectedJob);
//         setFormData(prev => ({ ...prev, name: deploymentName }));
//       }
//       setStep(2);
//     } else {
//       onSubmit({
//         ...formData,
//         selectedJobName: selectedJob
//       });
//       setStep(1);
//       setFormData({
//         name: '',
//         modelType: '',
//         selectedJobName: '',
//         namespace: 'default',
//         cpu: '0',
//         gpu: '0',
//         memory: '0'
//       });
//       setSelectedJob('');
//       onClose();
//     }
//   };

//   const isDeploymentPossible = () => {
//     return Object.keys(resourceErrors).length === 0 &&
//            systemResources &&
//            systemResources.available_cpus > 0 &&
//            systemResources.available_memory_gb > 0;
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 relative">
//         <button 
//           onClick={onClose}
//           className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//         >
//           <X size={18} />
//         </button>

//         <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//           {editData ? 'Edit Deployment' : (step === 1 ? 'New Deployment' : 'Generated YAML')}
//         </h2>

//         {resourceErrors.general && (
//           <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
//             {resourceErrors.general}
//           </div>
//         )}

//         {systemResources && (
//           <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-700 rounded">
//             <h3 className="text-sm font-medium mb-2 dark:text-white">Available Resources:</h3>
//             <div className="text-xs space-y-1 dark:text-gray-300">
//               <p>CPU: {systemResources.available_cpus} cores (Usage: {systemResources.cpu_usage_percent}%)</p>
//               <p>GPU: {systemResources.available_gpus} devices</p>
//               <p>Memory: {systemResources.available_memory_gb.toFixed(2)} GB (Usage: {systemResources.memory_usage_percent}%)</p>
//             </div>
//           </div>
//         )}

//         <form onSubmit={handleSubmit} className="max-h-[70vh] overflow-y-auto">
//           {step === 1 ? (
//             <div className="space-y-3">
//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                   Select Training Job *
//                 </label>
//                 <select
//                   required
//                   value={selectedJob}
//                   onChange={handleJobSelection}
//                   className="w-full p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//                 >
//                   <option value="">Select a job</option>
//                   {jobs.map((job) => (
//                     <option key={job.id} value={job.jobName}>
//                       {job.jobName}
//                     </option>
//                   ))}
//                 </select>
//               </div>

//               <div>
//   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//     Namespace *
//   </label>
//   <div className="flex gap-2">
//     <select
//       value={formData.namespace === 'default' ? 'default' : 'custom'}
//       onChange={(e) => {
//         if (e.target.value === 'default') {
//           setFormData({ ...formData, namespace: 'default' });
//         } else {
//           setFormData({ ...formData, namespace: '' });
//         }
//       }}
//       className="w-1/3 p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//     >
//       <option value="default">default</option>
//       <option value="custom">custom</option>
//     </select>
//     {formData.namespace !== 'default' && (
//       <input
//         type="text"
//         required
//         value={formData.namespace}
//         onChange={(e) => {
//           const value = e.target.value.toLowerCase().replace(/\s+/g, '-');
//           setFormData({ ...formData, namespace: value });
//         }}
//         placeholder="Enter namespace"
//         className="w-2/3 p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
//       />
//     )}
//   </div>
// </div>

//               <div>
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Resources *
//                 </label>
//                 <div className="flex gap-2">
//                   {/* CPU Input */}
//                   <div className="flex-1">
//                     <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
//                       CPU
//                       {resourceErrors.cpu && (
//                         <span className="text-red-500 ml-1">({resourceErrors.cpu})</span>
//                       )}
//                     </label>
//                     <input
//                       type="number"
//                       min="0"
//                       max={systemResources?.available_cpus || 0}
//                       required
//                       disabled={!!resourceErrors.cpu}
//                       value={formData.cpu}
//                       onChange={(e) => setFormData({ 
//                         ...formData, 
//                         cpu: e.target.value === '' ? '' : Math.min(e.target.value, systemResources?.available_cpus || 0)
//                       })}
//                       className={`w-full p-1.5 text-center bg-gray-50 dark:bg-gray-700 border 
//                         ${resourceErrors.cpu ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
//                         rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
//                         ${resourceErrors.cpu ? 'cursor-not-allowed' : ''}`}
//                     />
//                   </div>

//                   {/* GPU Input */}
//                   <div className="flex-1">
//                     <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
//                       GPU
//                       {resourceErrors.gpu && (
//                         <span className="text-red-500 ml-1">({resourceErrors.gpu})</span>
//                       )}
//                     </label>
//                     <select
//                       required
//                       disabled={!!resourceErrors.gpu}
//                       value={formData.gpu}
//                       onChange={(e) => setFormData({ ...formData, gpu: e.target.value })}
//                       className={`w-full p-1.5 text-center bg-gray-50 dark:bg-gray-700 border
//                         ${resourceErrors.gpu ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
//                         rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
//                         ${resourceErrors.gpu ? 'cursor-not-allowed' : ''}`}
//                     >
//                       {[...Array(systemResources?.available_gpus + 1 || 1)].map((_, i) => (
//                         <option key={i} value={i}>{i}</option>
//                       ))}
//                     </select>
//                   </div>

//                   {/* Memory Input */}
//                   <div className="flex-1">
//                     <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
//                       Memory
//                       {resourceErrors.memory && (
//                         <span className="text-red-500 ml-1">({resourceErrors.memory})</span>
//                       )}
//                     </label>
//                     <input
//                       type="number"
//                       min="0"
//                       max={Math.floor(systemResources?.available_memory_gb || 0)}
//                       required
//                       disabled={!!resourceErrors.memory}
//                       value={formData.memory}
//                       onChange={(e) => setFormData({ 
//                         ...formData, 
//                         memory: e.target.value === '' ? '' : Math.min(e.target.value, systemResources?.available_memory_gb || 0)
//                       })}
//                       className={`w-full p-1.5 text-center bg-gray-50 dark:bg-gray-700 border
//                         ${resourceErrors.memory ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
//                         rounded text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm
//                         ${resourceErrors.memory ? 'cursor-not-allowed' : ''}`}
//                     />
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ) : (
//             <div className="relative">
//               <div className="bg-gray-50 dark:bg-gray-700 rounded p-3">
//                 <button
//                   type="button"
//                   onClick={handleCopy}
//                   className="absolute right-6 top-6 p-1.5 rounded bg-white dark:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600 transition-colors duration-200"
//                 >
//                   {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
//                 </button>
//                 <div className="h-64 overflow-y-auto pr-8">
//                   <pre className="text-xs font-mono text-gray-900 dark:text-gray-300 whitespace-pre">
//                     {generateYAML()}
//                   </pre>
//                 </div>
//               </div>
//             </div>
//           )}

//           <div className="flex justify-end gap-3 mt-4 pt-2 border-t border-gray-200 dark:border-gray-700">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               disabled={step === 1 && (!selectedJob || !isDeploymentPossible())}
//               className={`px-3 py-1.5 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm ${
//                 (step === 1 && (!selectedJob || !isDeploymentPossible())) ? 'opacity-50 cursor-not-allowed' : ''
//               }`}
//             >
//               {step === 1 ? 'Generate YAML' : 'Deploy'}
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default GyanDeploymentModal;






// latest code
import { useState, useEffect } from 'react';
import { X, Copy, Check } from 'lucide-react';
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

const GyanDeploymentModal = ({ isOpen, onClose, onSubmit, editData = null, projectData }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [ jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState('');
  const [systemResources, setSystemResources] = useState(null);
  const [resourceErrors, setResourceErrors] = useState({});
  const [yamlContent, setYamlContent] = useState('');
  const [stepsValidation, setStepsValidation] = useState({
    1: false,
    2: false,
    3: false,
    4: false
  });

  const [completeJob, setCompleteJob] = useState([]);

  const [isGeneratingYaml, setIsGeneratingYaml] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    modelType: '',
    selectedJobName: '',
    namespace: 'default',
    dockerImage: '',
    cpu: '',
    gpu: '0',
    memory: ''
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchSystemResources();
    }, 2000); 
  
  
    return () => clearInterval(intervalId);
  }, []); 

  // console.log("RESOURSES",systemResources);
  
  

  useEffect(() => {
    if (isOpen) {
      fetchSystemResources();
      if (projectData?.id) {
        fetchJobs();
      }
    }
  }, [isOpen, projectData]);

  

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.jobName,
        modelType: editData.modelType || '',
        namespace: 'default',
        dockerImage: editData.dockerImage || '',
        cpu: editData.cpu || '',
        gpu: editData.gpu || '0',
        memory: editData.memory || ''
      });
    }
  }, [editData]);

  useEffect(() => {
    const updateStepValidation = () => {
      setStepsValidation(prev => ({
        ...prev,
        1: validateStep1(),
        2: validateStep2(),
        3: validateStep3(),
        4: validateStep4()
      }));
    };
    updateStepValidation();
  }, [formData, yamlContent]);

  useEffect(() => {
    if (currentStep === 3 && !yamlContent) {
      const initialYaml = generateYAML();
      setYamlContent(initialYaml);
    }
  }, [currentStep]);

  useEffect(() => {
    if (!isOpen) {
      resetForm();
    }
  }, [isOpen]);


  // reset form
  const resetForm = () => {
    setFormData({
      name: '',
      modelType: '',
      selectedJobName: '',
      namespace: 'default',
      dockerImage: '',
      cpu: '',
      gpu: '0',
      memory: ''
    });
    setSelectedJob('');
    setYamlContent('');
    setCurrentStep(1);
    setStepsValidation({
      1: false,
      2: false,
      3: false,
      4: false
    });
  };


  const fetchJobs = async () => {
    try {
      const response = await api.get(
        `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', projectData.id)}`
      );
      console.log("Jobs data", response.data);
      setCompleteJob(response.data);



      
      const formattedJobs = response.data.map(job => ({
        id: job.id,
        jobName: job.name,
        status: job.queue_status,
        startedOn: new Date(job.started_on).toLocaleDateString(),
        modelType: job.model_name
      }));
      setJobs(formattedJobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const deployService = async (yamlContent) => {
    try {
      const response = await api.post(
        `${endpoints.deployment.prefix}${endpoints.deployment.routes.deploy_service}`,
        {
          yaml_file: yamlContent
        }
      );
      return response.data;
    } catch (error) {
      throw error;
    }
  };

  const fetchSystemResources = async () => {
    try {
      const response = await api.get(
        `${endpoints.deployment.prefix}${endpoints.deployment.routes.check_system_resourses}`
      );
      setSystemResources(response.data);
    } catch (error) {
      console.error("Error checking available system resources", error);
      setResourceErrors({
        general: 'Failed to fetch system resources'
      });
    }
  };

  const generateYAMLFromServer = async () => {
    try {
      const endpoint = formData.dockerImage.includes('vllm-server') 
        ? `${endpoints.deployment.prefix}${endpoints.deployment.routes.generate_yaml}`
        : `${endpoints.deployment.prefix}${endpoints.deployment.routes.generate_yaml_custom}`;
        console.log("Form data yaml", formData);

        
      const response = await api.post(endpoint, {
        job_name: formData.name,
        project_name: "Project1",
        model_name: "Gyan/OPT-350M",
        model_type: "Large Language Model",
        namespace: formData.namespace,
        docker_image: formData.dockerImage == 'vllm-server' ? 'docker.io/kserve/vllmserver:latest' : 'sahilbandar/custom-container:latest',
        cpu_limit: parseInt(systemResources.available_cpus),
        memory_limit: parseInt(systemResources.available_memory_gb),
        gpu_limit: parseInt(systemResources.available_gpus),
        cpu_request: parseInt(formData.cpu),
        memory_request: parseInt(formData.memory),
        gpu_request: parseInt(formData.gpu)
      });
  
      if (response.data) {
        setYamlContent(response.data.yaml);
        setStepsValidation(prev => ({...prev, 3: true}));
      }
    } catch (error) {
      console.error('Error generating YAML:', error);
    
    }
  };



const validateStep1 = () => {
  const isValid = formData.name && formData.namespace && formData.dockerImage;
  return isValid;
};

const validateStep2 = () => {
  const isValid = formData.cpu && 
                 formData.memory && 
                 Number(formData.cpu) <= systemResources?.available_cpus &&
                 Number(formData.memory) <= systemResources?.available_memory_gb;
  return isValid;
};

const validateStep3 = () => {
  return yamlContent.length > 0;
};

const validateStep4 = () => {
  return validateStep1() && validateStep2() && validateStep3();
};

  const generateYAML = () => {
    const yaml = `apiVersion: v1
kind: Deployment
metadata:
  name: ${formData.name}
  namespace: ${formData.namespace}
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: ${formData.name}
        image: ${formData.dockerImage}
        resources:
          requests:
            cpu: "${formData.cpu}"
            memory: "${formData.memory}Gi"
            nvidia.com/gpu: "${formData.gpu}"
          limits:
            cpu: "${systemResources?.available_cpus || formData.cpu}"
            memory: "${systemResources?.available_memory_gb || formData.memory}Gi"
            nvidia.com/gpu: "${systemResources?.available_gpus || formData.gpu}"`;
    
    return yaml;
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(yamlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const SidebarTabs = () => {
    const tabs = [
      { id: 1, label: 'Basic Details' },
      { id: 2, label: 'Resources' },
      { id: 3, label: 'Generate YAML' },
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
                ? 'bg-gray-100 dark:bg-gray-700/50 border-l-2 border-blue-500' 
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
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Job Name *
              </label>
              <select
                value={selectedJob}
                onChange={(e) => {
                  const selected = jobs.find(j => j.jobName === e.target.value);
                  if (selected) {
                    setSelectedJob(e.target.value);
                    setFormData(prev => ({
                      ...prev,
                      name: selected.jobName,
                      modelType: selected.modelType,
                      selectedJobName: selected.jobName
                    }));
                    validateStep1();
                  }
                }}
                className="w-full p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select a job</option>
                {jobs.map((job) => (
                  <option key={job.id} value={job.jobName}>
                    {job.jobName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Namespace *
              </label>
              <div className="flex gap-2">
                <select
                  value={formData.namespace === 'default' ? 'default' : 'custom'}
                  onChange={(e) => {
                    if (e.target.value === 'default') {
                      setFormData({ ...formData, namespace: 'default' });
                    } else {
                      setFormData({ ...formData, namespace: '' });
                    }
                    validateStep1();
                  }}
                  className="w-1/3 p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  <option value="default">default</option>
                  <option value="custom">custom</option>
                </select>
                {formData.namespace !== 'default' && (
                  <input
                    type="text"
                    required
                    value={formData.namespace}
                    onChange={(e) => {
                      setFormData({ ...formData, namespace: e.target.value.toLowerCase().replace(/\s+/g, '-') });
                      validateStep1();
                    }}
                    placeholder="Enter namespace"
                    className="w-2/3 p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Docker Image *
              </label>
              <select
                value={formData.dockerImage}
                onChange={(e) => {
                
                  setFormData({ ...formData, dockerImage: e.target.value });
                  validateStep1();
                }}
                className="w-full p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">Select Docker Image</option>
                {/* <option value="vllm-server">VLLM Server</option> */}
                <option value="custom-server">Custom Server VLLM</option>
              </select>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {systemResources && (
              <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg mb-4">
                <h3 className="text-sm font-medium mb-2">Available Resources:</h3>
                <div className="space-y-2 text-sm">
                  <p>CPU: {systemResources.available_cpus} cores (Usage: {systemResources.cpu_usage_percent}%)</p>
                  <p>GPU: {systemResources.available_gpus} devices</p>
                  <p>Memory: {systemResources.available_memory_gb.toFixed(2)} GB (Usage: {systemResources.memory_usage_percent}%)</p>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  CPU Cores * (Max: {systemResources?.available_cpus || 0})
                </label>
                <input
                  type="number"
                  min="0"
                  max={systemResources?.available_cpus || 0}
                  value={formData.cpu}
                  onChange={(e) => {
                    const value = Math.min(e.target.value, systemResources?.available_cpus || 0);
                    setFormData({ ...formData, cpu: value });
                    validateStep2();
                  }}
                  className="w-full p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  GPU Units * (Max: {systemResources?.available_gpus || 0})
                </label>
                <select
                  value={formData.gpu}
                  onChange={(e) => {
                    setFormData({ ...formData, gpu: e.target.value });
                    validateStep2();
                  }}
                  className="w-full p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                >
                  {[...Array(systemResources?.available_gpus + 1 || 1)].map((_, i) => (
                    <option key={i} value={i}>{i}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Memory (GB) * (Max: {Math.floor(systemResources?.available_memory_gb || 0)})
                </label>
                <input
                  type="number"
                  min="0"
                  max={Math.floor(systemResources?.available_memory_gb || 0)}
                  value={formData.memory}
                  onChange={(e) => {
                    const value = Math.min(e.target.value, systemResources?.available_memory_gb || 0);
                    setFormData({ ...formData, memory: value });
                    validateStep2();
                  }}
                  className="w-full p-1.5 border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </div>
        );

        // case 3:
        //   return (
        //     <div className="space-y-4">
        //       <div className="relative">
        //         <button
        //           onClick={handleCopy}
        //           className="absolute right-2 top-2 p-1.5 rounded bg-white dark:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600"
        //         >
        //           {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
        //         </button>
        //         <textarea
        //           value={yamlContent}
        //           onChange={(e) => {
        //             setYamlContent(e.target.value);
        //           }}
        //           className="w-full h-64 p-4 font-mono text-sm border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        //         />
        //       </div>
        //     </div>
        //   );
        case 3:
  return (
    <div className="space-y-4">
      {isGeneratingYaml ? (
        <div className="h-64 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">Generating YAML...</p>
          </div>
        </div>
      ) : (
        <div className="relative">
          <button
            onClick={handleCopy}
            className="absolute right-2 top-2 p-1.5 rounded bg-white dark:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600"
          >
            {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
          </button>
          <textarea
            value={yamlContent}
            onChange={(e) => {
              setYamlContent(e.target.value);
            }}
            className="w-full h-64 p-4 font-mono text-sm border rounded bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}
    </div>
  );

      case 4:
       
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium mb-3">Configuration Review</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Job Name:</span>
                    <span>{formData.name}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Namespace:</span>
                    <span>{formData.namespace}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Docker Image:</span>
                    <span>{formData.dockerImage}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">CPU Cores:</span>
                    <span>{formData.cpu}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">GPU Units:</span>
                    <span>{formData.gpu}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b dark:border-gray-700">
                    <span className="text-gray-600 dark:text-gray-400">Memory (GB):</span>
                    <span>{formData.memory}</span>
                  </div>
                </div>
              </div>
              <div>
          <h3 className="font-medium mb-3">Generated YAML</h3>
          <div className="relative">
            <button
              onClick={handleCopy}
              className="absolute right-2 top-2 p-1.5 rounded bg-white dark:bg-gray-600 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 shadow-sm border border-gray-200 dark:border-gray-600"
            >
              {copied ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
            </button>
            <pre className="p-4 bg-gray-50 dark:bg-gray-700 rounded text-sm font-mono overflow-auto h-64">
              {yamlContent}
            </pre>
          </div>
        </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

const handleNext = async() => {
  const isValid = currentStep === 1 ? validateStep1() :
                 currentStep === 2 ? validateStep2() :
                 currentStep === 3 ? validateStep3() : false;

                 if (isValid) {
                  if (currentStep === 2) {
                    setIsGeneratingYaml(true);
                    try {
                      await generateYAMLFromServer();
                      setCurrentStep(prev => prev + 1);
                    } catch (error) {
                      console.error('Error generating YAML:', error);
                    } finally {
                      setIsGeneratingYaml(false);
                    }
                  } else if (currentStep < 4) {
                    setCurrentStep(prev => prev + 1);
                  }
                }

  // if (isValid && currentStep < 4) {
  //   setCurrentStep(prev => prev + 1);
  // }
};

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

 // Modify handleSubmit to be simpler
const handleSubmit = async() => {
  // if (validateStep4()) {
  //   onSubmit({
  //     ...formData,
  //     yamlContent: yamlContent
  //   });

  //   resetForm();  
  //   onClose();


  if (validateStep4()) {
    try {
      setIsGeneratingYaml(true); // Reuse the loading state
      const response = await deployService(yamlContent);
      alert('Service deployed successfully!'); // You can replace this with a better UI notification
      resetForm();
      onClose();
    } catch (error) {
      console.error('Deployment failed:', error);
      alert(error.response?.data?.detail || 'Failed to deploy service. Please try again.'); // You can replace this with a better UI notification
    } finally {
      setIsGeneratingYaml(false);
    }
  }
  
};

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-3xl h-[600px] p-6 relative">
        <button 
          onClick={() => {
            resetForm();
            onClose();
          }}
          className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>

        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
          {editData ? 'Edit Deployment' : 'New Deployment'}
        </h2>

        <div className="flex h-[calc(100%-8rem)]">
          <SidebarTabs />
          
          <div className="flex-1 pl-6">
            <div className="h-[calc(100%-4rem)] overflow-y-auto px-2">
              {renderStepContent()}
            </div>

            {/* <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                >
                  Back
                </button>
              )}
              
              {currentStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm"
                >
                  Next
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!validateStep4()}
                  className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm ${
                    !validateStep4() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  Deploy
                </button>
              )}
            </div> */}

<div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
  {currentStep > 1 && (
    <button
      type="button"
      onClick={handleBack}
      disabled={isGeneratingYaml}
      className={`px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 ${
        isGeneratingYaml ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      Back
    </button>
  )}
  
  {currentStep < 4 ? (
    <button
      type="button"
      onClick={handleNext}
      disabled={isGeneratingYaml}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm ${
        isGeneratingYaml ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
      {currentStep === 2 && isGeneratingYaml ? 'Generating...' : 'Next'}
    </button>
  ) : (
    <button
      type="button"
      onClick={handleSubmit}
      disabled={!validateStep4() || isGeneratingYaml}
      className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors duration-200 text-sm ${
        (!validateStep4() || isGeneratingYaml) ? 'opacity-50 cursor-not-allowed' : ''
      }`}
    >
     {isGeneratingYaml ? 'Deploying...' : 'Deploy'}
    </button>
  )}
</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GyanDeploymentModal;