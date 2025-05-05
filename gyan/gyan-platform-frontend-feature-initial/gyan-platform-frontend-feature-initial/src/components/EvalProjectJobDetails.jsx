import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Plus, CheckCircle, Clock, XCircle, Pause, Play, Trash2, LayoutDashboard, PlayCircle, Eye, X, BarChart, BarChart2 } from 'lucide-react';
import GyanTrainingModal from '../components/GyanTrainingJobModal';
import EvalReportModel from './EvalReportModel';
import ModelPlayground from './ModelPlayground';
import endpoints from '../endpoints.json'
import ModelCompareEval from './ModelCompareEval';
import axios from 'axios';
import { useProject } from '../context/ProjectContext';
const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Mock training jobs with more variety
const mockTrainingJobs = [
  {
    id: "TRN-001",
    jobName: "EVAL_JOB1_2024-12-24",
    status: "Completed",
    startedOn: "22 Jan 2024",
    modelType: "BERT-Base",
    error: null
  },
  {
    id: "TRN-002",
    jobName: "EVAL_JOB2_2024-12-24",
    status: "In-Progress",
    startedOn: "23 Jan 2024",
    modelType: "GPT-2",
    error: null
  },
  {
    id: "TRN-003",
    jobName: "EVAL_JOB2_2024-12-24",
    status: "Failed",
    startedOn: "21 Jan 2024",
    modelType: "RoBERTa",
    error: "type the error"
  }
];

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
    case 'Completed':
      return <CheckCircle size={18} className="text-green-500" />;
    case 'In-Progress':
      return <Clock size={18} className="text-blue-500 animate-spin" />;
    case 'Failed':
      return <XCircle size={18} className="text-red-500" />;
    case 'Queued':
      return <Pause size={18} className="text-yellow-500" />;
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
        placeholder="Search Training..."
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

const EvalProjectJobDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const projectData = location.state?.projectData;
  const [searchTerm, setSearchTerm] = useState('');
  const [jobs, setJobs] = useState(mockTrainingJobs);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [selectedJobError, setSelectedJobError] = useState(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState(false);
  const {selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();

  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [count,setCount]= useState(0);
const MAX_JOBS_LIMIT = 25;
  const [evalJob,setEvalJob] = useState([]);


const [jobList, setJobList] = useState(null);

useEffect(() => {
  if (id) {
    fetchEvalJobs();
  }
  return () => {
    setEvalJob([]);
    setError(null);
    setLoading(false);
  };
}, [id, selectedProjectId]);

useEffect(() => {
  const intervalId = setInterval(() => {
    fetchEvalJobs()
  }, 2000);

  return () => clearInterval(intervalId)
},[selectedProjectId])


useEffect(() => {
  fetchJobs();
},[selectedProjectId])

useEffect(() => {
  setCurrentPage(1);
}, [searchTerm]);


const fetchEvalJobs = async () => {
  try{
    const response = await api.get(
      `${endpoints.evaluation.prefix}${endpoints.evaluation.routes.list.replace(`{project_id}`, selectedProjectId)}`
    );
    console.log("Eval jobs list",evalJob);
    setEvalJob(response.data);
    
  }catch(error){
       console.error('Error fetching eval jobs:', error);
      setError('Failed to load training jobs');
  }finally{
setLoading(false);
  }
}


  const fetchJobs = async () => {
    try {
      // setLoading(true);
      const response = await api.get(
        `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', projectData.id)}`
      );
      console.log("data",response.data);
      
     setJobList(response.data);
      
      // Map response data to match component structure
      // const formattedJobs = response.data.map(job => ({
      //   id: job.id,
      //   jobName: job.name,
      //   status: job.queue_status,
      //   startedOn: new Date(job.started_on).toLocaleDateString(),
      //   modelType: job.model_name
      // }));
      // setJobs(formattedJobs);
    
    } catch (error) {
      // console.error('Error fetching jobs:', error);
      // setError('Failed to load training jobs');
    } finally {
      // setLoading(false);
    }
  };
  // console.log("Check project data",projectData);
  
  const handleDeleteJob = async(evalId) => {
    try {
      await api.delete(
        `${endpoints.evaluation.prefix}${endpoints.evaluation.routes.delete.replace('{evaluation_id}',evalId)}`
      );
    }catch(error){
      console.error('Error deleting', error);
      
    }
  };



// create a unique name
const generateUniqueName = (baseName) => {
  const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
  const randomId = Math.random().toString(36).substring(2, 6);
  return `${baseName}_${timestamp}_${randomId}`;
};

  const handleGyanTraining = async (formData, action) => {

    const filteredJobs1 = jobList?.filter(job => job.name === formData.name) || [];
    console.log("Filtered jobs:", filteredJobs1);
    console.log(filteredJobs1[0].model_name);
    const selectedJob = filteredJobs1[0];
    console.log("Selectedjob", selectedJob);
    
    
    const uniqueJobName = generateUniqueName(formData.name);


    const form = new FormData();
    if(formData.dataset) {
      form.append('file', formData.dataset);
    }

    const data = {
        name: uniqueJobName,
        training_job_name: formData.name,
        decode: formData.search_strategy,
        top_k: formData.top_k,
        top_p: formData.top_p,
        temperature: formData.temperature,
        status: formData.status,
        job_id: selectedJob.id,
        model_name: selectedJob.model_name,
        project_name: selectedJob.project_name,
        model_type: selectedJob.model_type,
        project_id: selectedJob.project_id,
        user_id: selectedJob.user_id,
        user_email: selectedJob.user_email,
        

        epochs: selectedJob.epochs,
        batch_size: selectedJob.batch_size,
        learning_rate: selectedJob.learning_rate,
        lora_optimized: selectedJob.lora_optimized,
        rank: selectedJob.rank,
        token_length: selectedJob.token_length,
        quantization: selectedJob.quantization,


    }

    form.append('data', JSON.stringify(data));

    const response = await api.post(`${endpoints.evaluation.prefix}${endpoints.evaluation.routes.evaluate}`,
      form,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        }
      }
    )

    console.log('Response of post evaluation:', response.data);

    // const newId = `TRN-${String(jobs.length + 1).padStart(3, '0')}`;
  //   if(response.data){
  //   const newJob = {
  //     id: response.data.id,
  //     jobName: response.data.name,
  //     status: response.data.status,
  //     startedOn: new Date(response.data.started_on).toLocaleDateString(),
      
  //     modelType: response.data.model_name,
  //     error: response.data.error
  //   };
  //   setEvalJob(prevJobs => [newJob, ...prevJobs]);
  //   setCurrentPage(1);
  // }

  };

  // Filter jobs based on search term
  // const filteredJobs = evalJob.filter(job => 
  //   job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   job.modelType.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //   job.status.toLowerCase().includes(searchTerm.toLowerCase())
  // );

  return (
    <div className="p-8 flex flex-col min-h-screen">
      {/* Project Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{projectData?.name || `Project ${id}`}</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">{projectData?.type || 'Model Type'}</p>
        </div>
      </div>

      {/* Search and New Training Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
           <div className="flex gap-4">
           {/* <button 
              onClick={() => setIsComparisonOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
            >
              <BarChart size={20} />
              Compare Jobs
            </button> */}
          <button 
            onClick={() => setIsGyanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New Evaluation Job
          </button>
          </div>
        </div>
      </div>
      <ModelCompareEval
        isOpen={isComparisonOpen}
        onClose={() => setIsComparisonOpen(false)}
      
      />

      {/* Table Content Area */}
      <div className="flex-grow bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-6">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Job Name
                </th>
                <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Status
                </th>
                <th className="w-1/4 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Started on
                </th>
                <th className="w-1/4 px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {evalJob.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {job.name}
                  </td>
                  <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <StatusIcon status={job.status} />
                      <span>{job.status}</span>
                    </div>
                  </td>
                  <td className="w-1/4 px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {Date(job.created_at)}
                  </td>
                  <td className="w-1/4 px-6 py-4">
                    <div className="flex items-center justify-center space-x-4">
                      <button
                        className={`text-gray-400 transition-colors ${
                          job.status === 'In-Progress' 
                            ? 'text-primary-light hover:text-primary-dark' 
                            : 'hover:text-gray-600'
                        }`}
                        disabled={job.status !== 'In-Progress'}
                        onClick={() => job.status === 'In-Progress' && navigate(`/dashboard/job/${job.id}`)}
                      >
                        <LayoutDashboard size={14} />
                      </button>
                      <button
                        className={`text-gray-400 transition-colors ${
                          job.status === 'Completed' 
                            ? 'text-primary-light hover:text-primary-dark' 
                            : 'hover:text-gray-600'
                        }`}
                        disabled={job.status !== 'Completed'}
                        onClick={() => job.status === 'Completed' && navigate(`/dashboard/job/${job.id}/evaluation_report`, {state: job})}
                        
                      >
                        <PlayCircle size={14} />
                      </button>
                      <button
                        className={`text-gray-400 transition-colors ${
                          job.status === 'Failed' 
                            ? 'text-primary-light hover:text-primary-dark' 
                            : 'hover:text-gray-600'
                        }`}
                        disabled={job.status === 'Completed' || job.status === 'In-Progress'}
                        onClick={() => {
                          if (job.status === 'Failed' && job.error) {
                            setSelectedJobError(job.error);
                            setShowErrorPopup(true);
                          }
                        }}
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteJob(job.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
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
          error={selectedJobError} 
          onClose={() => {
            setShowErrorPopup(false);
            setSelectedJobError(null);
          }} 
        />
      )}


      <EvalReportModel
      isOpen={isGyanModalOpen}
      onClose={() => setIsGyanModalOpen(false)}
      onSubmit={handleGyanTraining}
      projectData={projectData}
      />
    </div>
  );
};

export default EvalProjectJobDetails;