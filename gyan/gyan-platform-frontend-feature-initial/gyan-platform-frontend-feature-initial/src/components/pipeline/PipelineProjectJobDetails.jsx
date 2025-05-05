import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, CheckCircle, Clock, XCircle, Pause, Play, Trash2, LayoutDashboard, PlayCircle, Eye, X, BarChart, BarChart2 } from 'lucide-react';
import { useProject } from '../../context/ProjectContext';
import axios from 'axios';
import endpoints from '../../endpoints.json';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Error Popup Component
const ErrorPopup = ({ error, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
    <div 
      className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4 shadow-xl" 
      onClick={e => e.stopPropagation()}
    >
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Details</h3>
        <button 
          onClick={onClose} 
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={18} />
        </button>
      </div>
      <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md">
        <div className="text-sm text-red-500 dark:text-red-400">
          {error}
        </div>
      </div>
    </div>
  </div>
);

// Status Icon component
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'completed':
    case 'Completed':
      return <CheckCircle size={18} className="text-green-500" />;
    case 'in-progress':
    case 'running':
    case 'In-Progress':
      return <Clock size={18} className="text-blue-500 animate-spin" />;
    case 'failed':
    case 'Failed':
      return <XCircle size={18} className="text-red-500" />;
    case 'queued':
    case 'Queued':
      return <Pause size={18} className="text-yellow-500" />;
    case 'draft':
    case 'Draft':
      return <Play size={18} className="text-gray-500" />;
    case 'terminated':
    case 'Terminated':
      return <Play size={18} className="text-gray-500" />;
    default:
      return null;
  }
};

// SearchBar Component
const SearchBar = ({ value, onChange }) => (
  <div className="w-48">
    <div className="relative">
      <input
        type="text"
        placeholder="Search Workflows..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
      />
      <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
    </div>
  </div>
);

const PipelineProjectJobDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const projectData = location.state?.projectData;
  const [searchTerm, setSearchTerm] = useState('');
  const [workflows, setWorkflows] = useState([]);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [selectedError, setSelectedError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const {selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();
  // Function to fetch workflows
    // console.log("Project name", selectedProject);
    
  // Fetch workflows on component mount and when id changes
  useEffect(() => {
   if(id){
    fetchWorkflows();
   }
  
  return () => {
    setWorkflows([]);
    setError(null);
    setLoading(false);
  };
}, [id ,selectedProjectId]);

useEffect(() => {
  const intervalId = setInterval(() => {
    fetchWorkflows();
  }, 2000); 


  return () => clearInterval(intervalId);
}, [selectedProjectId]); 

useEffect(() => {
  fetchWorkflows();
},[selectedProjectId])


  const fetchWorkflows = async () => {
    // if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Assuming you store user email in localStorage, adjust as needed  
      const response = await api.get(
        `${endpoints.workflow.prefix}${endpoints.workflow.routes.list}`,
        { params: { project_id: selectedProjectId } }
      );

      console.log("Repsonse pipeline", response.data);
      
      if (response.data && response.data.workflows) {
        setWorkflows(response.data.workflows);
      } else {
        setWorkflows([]);
      }
    } catch (err) {
      console.error('Error fetching workflows:', err);
      setError('Failed to load workflows. Please try again later.');
      setWorkflows([]);
    } finally {
      setLoading(false);
    }
  };



  // Handle workflow deletion
  const handleDeleteWorkflow = async (workflowId) => {
    try {
      await api.delete(
        `${endpoints.workflow.prefix}${endpoints.workflow.routes.delete.replace('{workflow_id}', workflowId)}`
      );
      
      // Update the local state to remove the deleted workflow
      setWorkflows(prevWorkflows => prevWorkflows.filter(workflow => workflow.id !== workflowId));
      
      // Clear confirmation dialog
      setDeleteConfirmation(null);
    } catch (err) {
      console.error('Error deleting workflow:', err);
      setError('Failed to delete workflow. Please try again later.');
    }
  };

  // Handle workflow trigger
  const handleTriggerWorkflow = async (workflowId) => {
    try {
      await api.post(
        `${endpoints.workflow.prefix}${endpoints.workflow.routes.triggerSaved.replace('{workflow_id}', workflowId)}`
      );
      
      // Refresh the workflows list to show updated status
      fetchWorkflows();
    } catch (err) {
      console.error('Error triggering workflow:', err);
      setError('Failed to trigger workflow. Please try again later.');
    }
  };

  // Filter workflows based on search term
  const filteredWorkflows = workflows.filter(workflow => 
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-8 flex flex-col min-h-screen">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedProject?.name || `Project ${id}`}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedProject?.model_name || 'Model Type'}</p>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{selectedProject?.model_type || 'Model Type'}</p>
        </div>
      </div>

      {/* Search and New Pipeline Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <div className="flex gap-4">
            <button 
              onClick={() => navigate('/dashboard/test', {
                state: {
                  projectId: id,
                  projectName: projectData?.name || `Project ${id}`
                }
              })}
              className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <Plus size={20} />
              New Pipeline
            </button>
          </div>
        </div>
      </div>
     
      {/* Error Message */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 p-4 rounded-lg mb-6">
          {error}
        </div>
      )}

      {/* Table Content Area */}
      <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-light"></div>
          </div>
        ) : filteredWorkflows.length === 0 ? (
          <div className="text-center py-10 text-gray-500 dark:text-gray-400">
            {searchTerm ? 'No workflows match your search.' : 'No workflows found. Create a new pipeline to get started.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Workflow Name
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Created On
                  </th>
                  <th className="w-1/4 px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredWorkflows.map((workflow) => (
                  <tr key={workflow.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {workflow.name}
                    </td>
                    <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      <div className="flex items-center space-x-2">
                        <StatusIcon status={workflow.status} />
                        <span>{workflow.status}</span>
                      </div>
                    </td>
                    <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {formatDate(workflow.created_at)}
                    </td>
                    <td className="w-1/4 px-6 py-4">
                      <div className="flex items-center justify-center space-x-4">
                        {/* View/Edit Workflow */}
                        <button
  className={`text-gray-400 transition-colors hover:text-blue-600`}
  onClick={() => navigate(`/dashboard/test`, {
    state: {
      workflowId: workflow.id,
      projectId: id,
      projectName: projectData?.name || `Project ${id}`
    }
  })}
  title="View/Edit Workflow"
>
  <LayoutDashboard size={14} />
</button>
                        
                        {/* Trigger Workflow */}
                        <button
                          className={`text-gray-400 transition-colors ${
                            workflow.status !== 'running' 
                              ? 'text-primary-light hover:text-primary-dark' 
                              : 'hover:text-gray-600'
                          }`}
                          disabled={workflow.status === 'running'}
                          onClick={() => handleTriggerWorkflow(workflow.id)}
                          title={workflow.status === 'running' ? 'Workflow is already running' : 'Trigger Workflow'}
                        >
                          <PlayCircle size={14} />
                        </button>
                        
                        {/* View Error Details */}
                        {workflow.status === 'failed' && (
                          <button
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            onClick={() => {
                              // Assuming errors are stored in the steps array or in a separate field
                              const errorDetails = workflow.error || 
                                (workflow.steps && workflow.steps.find(step => step.error)?.error) || 
                                'No detailed error information available.';
                              
                              setSelectedError(errorDetails);
                              setShowErrorPopup(true);
                            }}
                            title="View Error Details"
                          >
                            <Eye size={14} />
                          </button>
                        )}
                        
                        {/* Delete Workflow */}
                        <button
                          onClick={() => setDeleteConfirmation(workflow.id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete Workflow"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Back Button */}
      <div className="flex justify-start">
        <button 
          onClick={() => navigate('/dashboard/studio/training')}
          className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white-400 dark:hover:text-black"
        >
          <ChevronLeft className="mr-1" size={20} />
          Back to Projects
        </button>
      </div>

      {/* Error Popup */}
      {showErrorPopup && (
        <ErrorPopup 
          error={selectedError} 
          onClose={() => {
            setShowErrorPopup(false);
            setSelectedError(null);
          }} 
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Confirm Deletion
            </h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete this workflow? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmation(null)}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteWorkflow(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineProjectJobDetails;


// import { useState, useEffect } from 'react';
// import { useParams, useLocation, useNavigate } from 'react-router-dom';
// import { ChevronLeft, Plus, CheckCircle, Clock, XCircle, Pause, Play, Trash2, LayoutDashboard, PlayCircle, Eye, X, BarChart, BarChart2 } from 'lucide-react';

// import axios from 'axios';
// import endpoints from '../../endpoints.json';

// const BASE_URL = import.meta.env.VITE_APP_API_URL

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// // Mock training jobs with more variety
// const mockTrainingJobs = [
//   {
//     id: "TRN-001",
//     jobName: "PIPE_JOB1_2024-12-24",
//     status: "Completed",
//     startedOn: "22 Jan 2024",
//     modelType: "BERT-Base",
//     error: null
//   },
//   {
//     id: "TRN-002",
//     jobName: "PIPE_JOB2_2024-12-24",
//     status: "In-Progress",
//     startedOn: "23 Jan 2024",
//     modelType: "GPT-2",
//     error: null
//   },
//   {
//     id: "TRN-003",
//     jobName: "PIPE_JOB3_2024-12-24",
//     status: "Failed",
//     startedOn: "21 Jan 2024",
//     modelType: "RoBERTa",
//     error: "type the error"
//   }
// ];

// // Error Popup Component
// const ErrorPopup = ({ error, onClose }) => (
//   <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
//     <div 
//       className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full m-4 shadow-xl" 
//       onClick={e => e.stopPropagation()}
//     >
//       <div className="flex justify-between items-start mb-4">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Error Details</h3>
//         <button 
//           onClick={onClose} 
//           className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
//         >
//           <X size={18} />
//         </button>
//       </div>
//       <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-md">
//         <div className="text-sm text-red-500 dark:text-red-400">
//           {error}
//         </div>
//       </div>
//     </div>
//   </div>
// );

// // Status Icon component
// const StatusIcon = ({ status }) => {
//   switch (status) {
//     case 'Completed':
//       return <CheckCircle size={18} className="text-green-500" />;
//     case 'In-Progress':
//       return <Clock size={18} className="text-blue-500 animate-spin" />;
//     case 'Failed':
//       return <XCircle size={18} className="text-red-500" />;
//     case 'Queued':
//       return <Pause size={18} className="text-yellow-500" />;
//     case 'Terminated':
//       return <Play size={18} className="text-gray-500" />;
//     default:
//       return null;
//   }
// };

// // SearchBar Component
// const SearchBar = ({ value, onChange }) => (
//   <div className="w-48">
//     <div className="relative">
//       <input
//         type="text"
//         placeholder="Search Training..."
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//       />
//       <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
//         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//           <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
//         </svg>
//       </div>
//     </div>
//   </div>
// );

// const PipelineProjectJobDetails = () => {
//   const { id } = useParams();
//   const location = useLocation();
//   const navigate = useNavigate();
//   const projectData = location.state?.projectData;
//   const [searchTerm, setSearchTerm] = useState('');
//   const [jobs, setJobs] = useState(mockTrainingJobs);
//   const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
//   const [showErrorPopup, setShowErrorPopup] = useState(false);
//   const [selectedJobError, setSelectedJobError] = useState(null);
//   const [isComparisonOpen, setIsComparisonOpen] = useState(false);
//   const [loading, setLoading] = useState(true);
// const [error, setError] = useState(null);

//   useEffect(() => {
//     if (id) {
//       // fetchJobs();
//     }
//     return () => {
//       setJobs([]);
//       setError(null);
//       setLoading(false);
//     };
//   }, [id]);



  


//   const handleDeleteJob = async(jobId) => {
//     try {
//       await api.delete(
//         `${endpoints.training.prefix}${endpoints.training.routes.delete.replace('{job_id}', jobId)}`
//       );
//       setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
//     } catch (error) {
//       console.error('Error deleting job:', error);
//     }
//   };

 

//   return (
//     <div className="p-8 flex flex-col min-h-screen">
//       {/* Project Header */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
//         <div className="flex flex-col">
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{projectData?.name || `Project ${id}`}</h1>
//           <p className="text-gray-500 dark:text-gray-400 mt-1">{projectData?.type || 'Model Type'}</p>
//         </div>
//       </div>

//       {/* Search and New Training Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
//         <div className="flex justify-between items-center">
//           <SearchBar 
//             value={searchTerm}
//             onChange={setSearchTerm}
//           />
//            <div className="flex gap-4">
           
//           <button 
//             // onClick={() => setIsGyanModalOpen(true)}
//             onClick={() => navigate('/dashboard/test', {
//               state: {
//                 projectId: id,
//                 projectName: projectData?.name || `Project ${id}`
//               }
//             })}
//             className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//           >
//             <Plus size={20} />
//             New Pipeline
//           </button>
//           </div>
//         </div>
//       </div>
     

//       {/* Table Content Area */}
//       <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
//         <div className="overflow-x-auto">
//           <table className="min-w-full">
//             <thead>
//               <tr className="border-b dark:border-gray-700">
//                 <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                   Workflow Name
//                 </th>
//                 <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                   Status
//                 </th>
//                 <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                   Started on
//                 </th>
//                 <th className="w-1/4 px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//               {jobs.map((job) => (
//                 <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
//                   <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
//                     {job.jobName}
//                   </td>
//                   <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
//                     <div className="flex items-center space-x-2">
//                       <StatusIcon status={job.status} />
//                       <span>{job.status}</span>
//                     </div>
//                   </td>
//                   <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
//                     {job.startedOn}
//                   </td>
//                   <td className="w-1/4 px-6 py-4">
//                     <div className="flex items-center justify-center space-x-4">
//                       <button
//                         className={`text-gray-400 transition-colors ${
//                           job.status === 'In-Progress' 
//                             ? 'text-primary-light hover:text-primary-dark' 
//                             : 'hover:text-gray-600'
//                         }`}
//                         disabled={job.status !== 'In-Progress'}
//                         onClick={() => job.status === 'In-Progress' && navigate(`/dashboard/test`)}
//                       >
//                         <LayoutDashboard size={14} />
//                       </button>
//                       <button
//                         className={`text-gray-400 transition-colors ${
//                           job.status === 'Completed' 
//                             ? 'text-primary-light hover:text-primary-dark' 
//                             : 'hover:text-gray-600'
//                         }`}
//                         disabled={job.status !== 'Completed'}
//                         onClick={() => job.status === 'Completed' && navigate(`/dashboard/test`)}
                        
//                       >
//                         <PlayCircle size={14} />
//                       </button>
//                       <button
//                         className={`text-gray-400 transition-colors ${
//                           job.status === 'Failed' 
//                             ? 'text-primary-light hover:text-primary-dark' 
//                             : 'hover:text-gray-600'
//                         }`}
//                         disabled={job.status === 'Completed' || job.status === 'In-Progress'}
//                         onClick={() => {
//                           if (job.status === 'Failed' && job.error) {
//                             setSelectedJobError(job.error);
//                             setShowErrorPopup(true);
//                           }
//                         }}
//                       >
//                         <Eye size={14} />
//                       </button>
//                       <button
//                         onClick={() => handleDeleteJob(job.id)}
//                         className="text-gray-400 hover:text-red-500 transition-colors"
//                       >
//                         <Trash2 size={14} />
//                       </button>
//                     </div>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       {/* Back Button */}
//       <div className="flex justify-start">
//         <button 
//           onClick={() => navigate('/dashboard/studio/training')}
//           className="flex items-center text-gray-600 hover:text-gray-900 dark:text-white-400 dark:hover:text-black"
//         >
//           <ChevronLeft className="mr-1" size={20} />
//           Back to Projects
//         </button>
//       </div>

//       {/* Error Popup */}
//       {showErrorPopup && (
//         <ErrorPopup 
//           error={selectedJobError} 
//           onClose={() => {
//             setShowErrorPopup(false);
//             setSelectedJobError(null);
//           }} 
//         />
//       )}

     

     
//     </div>
//   );
// };

// export default PipelineProjectJobDetails;