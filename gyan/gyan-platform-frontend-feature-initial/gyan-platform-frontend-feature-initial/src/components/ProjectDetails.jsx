import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';


import axios from 'axios';
import endpoints from '../endpoints.json';


import { 
  ChevronLeft, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Pause, 
  Play, 
  Trash2, 
  LayoutDashboard, 
  PlayCircle, 
  Eye, 
  X,
  ChevronDown ,
  Loader,
  AlertCircle
} from 'lucide-react';
import GyanTrainingModal from '../components/GyanTrainingJobModal';
import ModelPlayground from './ModelPlayground';
import { useAuth } from '../context/AuthContext';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});



// Pagination Component
const Pagination = ({ currentPage, totalPages, onPageChange }) => {
  return (
    <div className="flex justify-end space-x-2 mt-4 px-6">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Previous
      </button>
      <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
        Page {currentPage} of {totalPages}
      </span>
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );
};


// Error Popup Component
const ErrorPopup = ({ error, onClose }) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
    <div 
      className="bg-white dark:bg-[#1B2B3A] rounded-lg p-6 max-w-md w-full m-4 shadow-xl" 
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

// Status Filter Component
const StatusFilter = ({ onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['All', 'Completed', 'In-Progress', 'Failed', 'Queued', 'Terminated','Waiting'];

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-1 focus:outline-none text-gray-900 dark:text-white bg-white dark:bg-[#1B2B3A] rounded-md px-2 py-1"
      >
        <span>Status</span>
        <ChevronDown size={14} className="ml-1" />
      </button>
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 h-full w-full z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 py-2 w-48 bg-white dark:bg-[#1B2B3A] rounded-md shadow-lg z-20 border border-gray-200 dark:border-gray-700">
            {statuses.map((status) => (
              <button
                key={status}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                onClick={() => {
                  onStatusChange(status === 'All' ? null : status);
                  setIsOpen(false);
                }}
              >
                {status}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

// Status Icon component
const StatusIcon = ({ status }) => {
  switch (status) {
    case 'Completed':
      return <CheckCircle size={18} className="text-green-500" />;
    case 'Running':
      return <Clock size={18} className="text-blue-500 animate-spin" />;
    case 'Failed':
      return <XCircle size={18} className="text-red-500" />;
    case 'Queued':
      return <Pause size={18} className="text-yellow-500" />;
    case 'Terminated':
      return <Play size={18} className="text-gray-500" />;
    case 'Waiting':
      return <Loader size={18} className='text-gray-500'/>;
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
        className="w-full px-4 py-2 pl-10 bg-white dark:bg-[#1B2B3A] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-900 dark:text-gray-300"
      />
      <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
    </div>
  </div>
);


const ProjectDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projectData = location.state?.projectData;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [selectedJobError, setSelectedJobError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [count,setCount]= useState(0);
const MAX_JOBS_LIMIT = 25;
const {selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();
const [pid,setPID] = useState(null);
const[jobInfo,setJobInfo] = useState([]);


useEffect(() => {
  if (id) {
    fetchJobs();
  }
  return () => {
    setJobs([]);
    setError(null);
    setLoading(false);
  };
}, [id, selectedProjectId]);


useEffect(() => {
  const intervalId = setInterval(() => {
    fetchJobs();
  }, 2000); 


  return () => clearInterval(intervalId);
}, [selectedProjectId]); 

// useEffect(() => {
//   setPID(selectedProject.id);
// },[selectedProject])

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
    
      
      const response = await api.get(
        `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', selectedProjectId)}`
      );
      console.log("response",response.data);
      setJobInfo(response.data);
      
      setCount(response.data.length);
      
      // Map response data to match component structure
      const formattedJobs = response.data.map(job => ({
        id: job.id,
        jobName: job.name,
        status: job.queue_status,
        startedOn: new Date(job.started_on).toLocaleDateString(),
        started_on: response.data.started_on,
        modelType: job.model_name
      }));
      setJobs(formattedJobs);
     
      setError(null);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setError('Failed to load training jobs');
    } finally {
      setLoading(false);
    }
  };


  const handleDeleteJob = async (jobId) => {
    try {
      await api.delete(
        `${endpoints.training.prefix}${endpoints.training.routes.delete.replace('{job_id}', jobId)}`
      );
      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
    } catch (error) {
      console.error('Error deleting job:', error);
    }
  };

  // update job status for trigger
  const handleJobStatus = async (jobId) => {
    try {
      await api.put(
        `${endpoints.training.prefix}${endpoints.training.routes.update_job_status.replace('{job_id}',jobId)}`
      );
    } catch(error){
      console.log('Error updating job', error);
      
    }
  };

  const handleGyanTraining = async (formData, action) => {
    try {
      // Create FormData to handle file upload
      console.log("Hi from handleGyanTraining");
      console.log(formData);
      
      
      const form = new FormData();
      if (formData.dataset) {
        form.append('dataset', formData.dataset);
      }
      console.log("file data");
      
      console.log(formData.dataset);
      
      
      // Log the formData values
      console.log('Form values:', {
        name: formData.name,
        epochs: formData.epochs,
        batch_size: formData.batch_size,
        learning_rate: formData.learning_rate,
        token_length: formData.token_length,
        quantization: formData.quantization,
        rank: formData.rank,
        lora_optimized: formData.lora_optimized
      });


      var trainingData = {}
      if(action == 'train'){
      // Append other data
       trainingData = {
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

    }else{
      trainingData = {
        name: formData.name,
        epochs: parseInt(formData.epochs || 0),
        batch_size: parseInt(formData.batch_size || 0),
        learning_rate: parseFloat(formData.learning_rate || 0),
        token_length: parseInt(formData.token_length || 0),
        quantization: formData.quantization || '',
        rank: parseInt(formData.rank || 0),
        lora_optimized: Boolean(formData.lora_optimized),
        status: action === 'save' ? 'Waiting' : 'Queued'
      };
    }
  
      form.append('data', JSON.stringify(trainingData));
  
      // Log the final form data
    
  
      const response = await api.post(
        `${endpoints.training.prefix}${endpoints.training.routes.create}?project_id=${id}`,
        form,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          }
        }
      );
  
      // Log the response
      console.log('Response:', response.data);
  
      if (response.data) {
        const newJob = {
          id: response.data.id,
          jobName: response.data.name,
          status: response.data.status,
          startedOn: new Date(response.data.started_on).toLocaleDateString(),
          
          modelType: response.data.model_name,
          error: response.data.error
        };
        setJobs(prevJobs => [newJob, ...prevJobs]);
        setIsGyanModalOpen(false);
        setCurrentPage(1);
      }
    
    } catch (error) {
      console.error('Error creating training job:', error.response?.data || error);
    }
  };

  // Filter jobs based on search term and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = 
      (job?.jobName?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (job?.modelType?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (job?.status?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    const matchesStatus = selectedStatus ? job?.status === selectedStatus : true;
  
    return matchesSearch && matchesStatus;
  });

  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);


   // Convert the timestamps to Date objects
   const startDate = new Date(jobInfo.enqueued_at);
   const endDate = new Date(jobInfo.completed_at);
 
   // Calculate the difference in milliseconds
   const timeDifferenceMs = endDate - startDate;
 
   // Convert milliseconds to minutes
   const timeDifferenceMinutes = timeDifferenceMs / (1000 * 60);

  return (
    <div className="p-8 flex flex-col min-h-screen">
      {/* Project Header */}
      <div className="bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectData?.name || `Project ${selectedProject.id}`}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {projectData?.model_type || 'Model Type'}
            </p>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {projectData?.model_name || 'Model Name'}
            </p>
          </div>
          
          {/* Back Link */}
          <span 
            onClick={() => navigate('/dashboard/studio/training')}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer transition-colors duration-200"
          >
            <ChevronLeft className="mr-1" size={18} />
            Back to Projects
          </span>
        </div>
      </div>

      {count >= MAX_JOBS_LIMIT && (
        <div className="mb-6 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 dark:text-red-400 mr-3" />
            <div className="text-red-600 dark:text-red-400">
              You have reached the maximum limit of 25 jobs. Please delete some existing jobs to create new ones.
            </div>
          </div>
        </div>
      )}

      {/* Search and New Training Section */}
      {/* <div className="bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <button 
            onClick={() => setIsGyanModalOpen(true)}
            disabled={count >= MAX_JOBS_LIMIT}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              count >= MAX_JOBS_LIMIT 
                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                : 'bg-primary-light text-white hover:bg-primary-dark'
            }`}
          >
            <Plus size={20} />
            New Training Job
          </button>
        </div>
      </div> */}
   

      {/* Table Content Area */}
      {/* Table Content Area */}
<div className="flex-grow bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
<div className="flex justify-between items-center mb-6">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <button 
            onClick={() => setIsGyanModalOpen(true)}
            disabled={count >= MAX_JOBS_LIMIT}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors duration-200 ${
              count >= MAX_JOBS_LIMIT 
                ? 'bg-gray-400 cursor-not-allowed text-gray-200'
                : 'bg-primary-light text-white hover:bg-primary-dark'
            }`}
          >
            <Plus size={20} />
            New Training Job
          </button>
        </div>
  {loading ? (
    <div className="flex justify-center items-center h-40">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
    </div>
  ) : error ? (
    <div className="text-red-500 text-center py-4">{error}</div>
  ) : (
    <div className="overflow-x-auto">
      <table className="min-w-full">
        <thead>
          <tr className="border-b dark:border-gray-700">
            <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Job Name
            </th>
            <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              <div className="flex items-center space-x-2">
                <StatusFilter onStatusChange={setSelectedStatus} />
              </div>
            </th>
            <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Started on
            </th>
            <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
              Completed on
            </th>
            <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
             Duration
            </th>
            <th className="w-1/6 px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {currentJobs.map((job) => (
            <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <td className="w-1/6 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                {job.jobName}
              </td>
              <td className="w-1/6 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                <div className="flex items-center space-x-2">
                  <StatusIcon status={job.status} />
                  <span>{job.status}</span>
                </div>
              </td>
              <td className="w-1/6 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                {job.startedOn}
              </td>
              <td className="w-1/6 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                {job.completed_at}
              </td>
              <td className="w-1/6 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
               {timeDifferenceMinutes}
              </td>
              <td className="w-1/6 px-6 py-2">
                <div className="flex items-center justify-center space-x-4">
                  {job.status == 'Waiting' ?  <button
                    className={`p-1.5 rounded-md transition-colors bg-primary-light text-white`}
                    // disabled={job.status !== 'Running' || job.status !== 'Completed'}
                    onClick={() => handleJobStatus(job.id)}
                  >
                    Trigger
                  </button> : <>
                  <button
                    className={`p-1 rounded-md transition-colors ${
                      (job.status === 'Running' || job.status === 'Completed')
                        ? 'text-primary-light hover:text-primary-dark dark:hover:bg-gray-700/50' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:bg-gray-700/50'
                    }`}
                    // disabled={job.status !== 'Running' || job.status !== 'Completed'}
                    // onClick={() => (job.status === 'Running' || job.status === 'Completed') && navigate(`/dashboard/job/${job.id}`,{state : jobInfo})}
                    onClick={() => {
                      if (job.status === 'Running' || job.status === 'Completed') {
                        // Find the job object in jobInfo array with the matching id
                        const jobDetails = jobInfo.find(item => item.id === job.id);
                    
                        // If matching job is found, navigate and pass the state
                        if (jobDetails) {
                          navigate(`/dashboard/job/${job.id}`, { state: jobDetails });
                        }
                      }
                    }}
                  >
                    <LayoutDashboard size={15} />
                  </button>
                  <button
                    className={`p-1.5 rounded-md transition-colors ${
                      job.status === 'Completed' 
                        ? 'text-primary-light hover:text-primary-dark dark:hover:bg-gray-700/50' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:bg-gray-700/50'
                    }`}
                    disabled={job.status !== 'Completed'}
                    onClick={() => {
                      if (job.status === 'Completed') {
                        // Find the job object in jobInfo array with the matching id
                        const jobDetails = jobInfo.find(item => item.id === job.id);
                    
                        // If matching job is found, navigate and pass the state
                        if (jobDetails) {
                          navigate(`/dashboard/project/${id}/playground`, { state: jobDetails });
                        }
                      }
                    }}
                  >
                    <PlayCircle size={15} />
                  </button>
                  <button
                    className={`p-1.5 rounded-md transition-colors ${
                      job.status === 'Failed' 
                        ? 'text-primary-light hover:text-primary-dark dark:hover:bg-gray-700/50' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:bg-gray-700/50'
                    }`}
                    disabled={job.status === 'Completed' || job.status === 'Queued'}
                    onClick={() => {
                      const jobDetails = jobInfo.find(item => item.id === job.id);
                      console.log(jobDetails);
                      
                      if (job.status === 'Failed') {
                        setSelectedJobError(jobDetails.error);
                        setShowErrorPopup(true);
                      }
                    }}  
                  >
                    <Eye size={15} />
                  </button></>}
                  <button
                  //  disabled={job.status === 'Completed' || job.status === 'Queued' || job.status == 'Running'}
                    onClick={() => handleDeleteJob(job.id)}
                    className="p-1.5 rounded-md text-gray-400 hover:text-red-500 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button> 
                </div> 
                  
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Pagination */}
      {filteredJobs.length > 0 && (
        <Pagination 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )}
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

      {/* Gyan Training Modal */}
      <GyanTrainingModal
        isOpen={isGyanModalOpen}
        onClose={() => setIsGyanModalOpen(false)}
        onSubmit={handleGyanTraining}
      />
    </div>
  );
};

export default ProjectDetails;