import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { 
  ChevronLeft, 
  Plus, 
  CheckCircle, 
  Clock, 
  XCircle, 
  Pause, 
  Play, 
  Trash2, 
  Server,
  PencilIcon,
  X,
  ChevronDown 
} from 'lucide-react';
import GyanDeploymentModal from '../components/GyanDeploymentModal';
import axios from 'axios';
import endpoints from '../endpoints.json';
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


// Mock deployment jobs
const mockDeploymentJobs = [
  {
    id: "DEP-001",
    jobName: "Deployment 1",
    status: "Completed",
    startedOn: "22 Jan 2024",
    environment: "Production",
    error: null
  },
  {
    id: "DEP-002",
    jobName: "Deployment 2",
    status: "Completed",
    startedOn: "22 Jan 2024",
    environment: "Production",
    error: null
  },
 
];

// Status Filter Component
const StatusFilter = ({ onStatusChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const statuses = ['All', 'Completed', 'In-Progress', 'Failed', 'Queued', 'Terminated'];

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
    case 'Ready':
      return <CheckCircle size={18} className="text-green-500" />;
    case 'Unknown':
      return <Clock size={18} className="text-blue-500 animate-spin" />;
    case 'False':
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
  <div className="relative flex-1 max-w-md">
    <input
      type="text"
      placeholder="Search Training..."
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-72 pl-10 pr-4 py-2 bg-white dark:bg-[#1B2B3A] border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light text-gray-900 dark:text-gray-300"
    />
    <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    </div>
  </div>
);

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

const DeploymentDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const projectData = location.state?.projectData;
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [jobs, setJobs] = useState(mockDeploymentJobs);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
  const [selectedDeployment, setSelectedDeployment] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 10;
  const {selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();
  // deployment jobs
  const [deployJobs, setDeployJobs] = useState([]);
  const [deletingPod, setDeletingPod] = useState(null);

  console.log("Project data", projectData);

//  fetch deployu jobs
useEffect(() => {
    
    const intervalId = setInterval(() => {
      fetchDeploymentJobs();
    }, 2000); 
  
  
    return () => clearInterval(intervalId);
},[])
  


  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedStatus]);

  const handleEdit = (job) => {
    setSelectedDeployment({
      jobName: job.jobName,
      modelType: job.modelType || '',
      namespace: job.namespace || 'default',
      cpu: job.cpu || '0',
      gpu: job.gpu || '0',
      memory: job.memory || '0'
    });
    setIsGyanModalOpen(true);
  };


  const fetchDeploymentJobs = async() => {
      const response = await api.post(`${endpoints.deployment.prefix}${endpoints.deployment.routes.get_pods}`,{
        "namespace": "default"
      })
      setDeployJobs(response.data);
      console.log("deployment jobs data",response.data);
      
  }

  const handleDeleteJob = async (podName, namespace) => {
    if (!confirm('Are you sure you want to delete this deployment?')) {
      return;
    }
  
    setDeletingPod(podName);
    try {
      const response = await api.post(
        `${endpoints.deployment.prefix}${endpoints.deployment.routes.del_pods}`,
        {
          pod_name: podName,
          namespace: namespace || 'default'
        }
      );
  
      if (response.data) {
        await fetchDeploymentJobs();
        console.log("Successfully deleted deployment");
      }
    } catch (error) {
      console.error("Error deleting deployment:", error);
      alert(error.response?.data?.detail || 'Failed to delete deployment');
    } finally {
      setDeletingPod(null);
    }
  };

  // Update handleGyanDeployment function to include model_type
const handleGyanDeployment = (formData) => {
  if (selectedDeployment) {
    // Handle edit case
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.jobName === selectedDeployment.jobName
          ? {
              ...job,
              jobName: formData.name,
              modelType: formData.modelType, // This will come from the selected training job
              namespace: formData.namespace,
              cpu: formData.cpu,
              gpu: formData.gpu,
              memory: formData.memory
            }
          : job
      )
    );
  } else {
    // Handle create case
    const newId = `DEP-${String(jobs.length + 1).padStart(3, '0')}`;
    const newJob = {
      id: newId,
      jobName: formData.name,
      status: 'In-Progress',
      startedOn: new Date().toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      }),
      modelType: formData.modelType, // This will now be populated from training job
      namespace: formData.namespace,
      cpu: formData.cpu,
      gpu: formData.gpu,
      memory: formData.memory,
      environment: 'Production',
      error: null
    };
    setJobs(prevJobs => [newJob, ...prevJobs]);
  }
  
  setSelectedDeployment(null);
  setIsGyanModalOpen(false);
  setCurrentPage(1);
};

  // Filter jobs based on search term and status
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.jobName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.environment.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.status.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = selectedStatus ? job.status === selectedStatus : true;

    return matchesSearch && matchesStatus;
  });

  // Pagination calculations
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentJobs = filteredJobs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredJobs.length / jobsPerPage);

  return (
    <div className="p-8 flex flex-col min-h-screen">
      {/* Project Header */}
      <div className=" bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {projectData?.name || `Project ${id}`}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              {projectData?.type || 'Deployment Type'}
            </p>
          </div>
          
          <span 
            onClick={() => navigate('/dashboard/studio/deployment')}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer transition-colors duration-200"
          >
            <ChevronLeft className="mr-1" size={18} />
            Back to Projects
          </span>
        </div>
      </div>

      {/* Search and New Deployment Section */}
      <div className="flex-grow bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center gap-4 mb-6">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <button 
            onClick={() => {
              setSelectedDeployment(null);
              setIsGyanModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New Deployment
          </button>
        </div>
      {/* </div> */}

      {/* Table Content Area */}
      {/* <div className="flex-grow bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6"> */}
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead>
              <tr className="border-b dark:border-gray-700">
                <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Pod Name
                </th>
                <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Namespace
                </th>
                <th className="w-1/6 px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                 Host Url
                </th>
                <th className="w-1/6 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  Endpoint
                </th>
                <th className="w-1/6 px-4 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                  {/* <div className="flex items-center space-x-2"> */}
                    <StatusFilter onStatusChange={setSelectedStatus} />
                  {/* </div> */}
                </th>
                
                <th className="w-1/6 px-4 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {deployJobs.map((job) => (
                <tr key={job.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="w-1/4 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                    {job.pod_name}
                  </td>
                  <td className="w-1/4 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                    {job.namespace}
                  </td>
                  <td className="w-1/4 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                    {job.host_url}
                  </td>
                  <td className="w-1/4 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                    {job.endpoint}
                  </td>
                  <td className="w-1/4 px-6 py-2 text-sm text-gray-900 dark:text-gray-300">
                    <div className="flex items-center space-x-2">
                      <StatusIcon status={job.status} />
                      <span>{job.status}</span>
                    </div>
                  </td>
                 
                  <td className="w-1/4 px-6 py-2">
                    <div className="flex items-center justify-center space-x-4">
                   
                      <button
  onClick={() => handleDeleteJob(job.pod_name, job.namespace)}
  disabled={deletingPod === job.pod_name}
  className={`p-1.5 rounded-md text-gray-400 hover:text-red-500 dark:hover:bg-gray-700/50 transition-colors ${
    deletingPod === job.pod_name ? 'opacity-50 cursor-not-allowed' : ''
  }`}
>
  {deletingPod === job.pod_name ? (
    <div className="animate-spin h-4 w-4 border-2 border-red-500 border-t-transparent rounded-full" />
  ) : (
    <Trash2 size={15} />
  )}
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
      </div>

      {/* Gyan Deployment Modal */}
      <GyanDeploymentModal
        isOpen={isGyanModalOpen}
        onClose={() => {
          setIsGyanModalOpen(false);
          setSelectedDeployment(null);
        }}
        onSubmit={handleGyanDeployment}
        editData={selectedDeployment}
        projectData={location.state?.projectData}
      />
    </div>
  );
};

export default DeploymentDetails;