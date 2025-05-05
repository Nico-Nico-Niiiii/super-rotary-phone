import { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useProject } from '../../context/ProjectContext';

import axios from 'axios';
import endpoints from '../../endpoints.json';

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
  ChevronDown,
  Loader,
  AlertCircle,
  Settings
} from 'lucide-react';
import AgentProjectModal from './AgentProjectModal';

import { useAuth } from '../../context/AuthContext';

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

// SearchBar Component
const SearchBar = ({ value, onChange }) => (
  <div className="w-48">
    <div className="relative">
      <input
        type="text"
        placeholder="Search Projects..."
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

const AgentProjectDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const projectData = location.state?.projectData;
  const [searchTerm, setSearchTerm] = useState('');
  const [agentProjects, setAgentProjects] = useState([]);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [showErrorPopup, setShowErrorPopup] = useState(false);
  const [selectedProjectError, setSelectedProjectError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const projectsPerPage = 10;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const {selectedProject} = useProject();

  const inputStyles = "w-4/5 p-1.5 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light text-sm";
  const readOnlyStyles = "w-4/5 p-1.5 border rounded-md bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed";

  

  useEffect(() => {
    fetchAgentProjects();
    return () => {
      setAgentProjects([]);
      setError(null);
      setLoading(false);
    };
  }, []);

  // Fetch agent projects
  const fetchAgentProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${endpoints.agentProjects.prefix}${endpoints.agentProjects.routes.list}`,
        { params: { project_name: projectData.name } }
      );
      
      if (response.data) {
        setAgentProjects(response.data);
      }
    } catch (error) {
      console.error('Error fetching agent projects:', error);
      setError('Failed to load agent projects');
    } finally {
      setLoading(false);
    }
  };

  // Handle creating a new agent project
  const handleAgentProjectSubmit = async (projectData) => {
    try {
      const response = await api.post(
        `${endpoints.agentProjects.prefix}${endpoints.agentProjects.routes.create}`,
        projectData
      );
      
      if (response.data) {
        fetchAgentProjects();
        setIsAgentModalOpen(false);
      }
    } catch (error) {
      console.error('Error creating agent project:', error.response?.data || error);
      setSelectedProjectError(error.response?.data?.detail || 'Failed to create agent project');
      setShowErrorPopup(true);
    }
  };

  // Handle deleting an agent project
  const handleDeleteProject = async (projectId) => {
    try {
      await api.delete(
        `${endpoints.agentProjects.prefix}${endpoints.agentProjects.routes.delete.replace('{project_id}', projectId)}`
      );
      
      fetchAgentProjects();
    } catch (error) {
      console.error('Error deleting project:', error);
      setSelectedProjectError(error.response?.data?.detail || 'Failed to delete agent project');
      setShowErrorPopup(true);
    }
  };

  // Filter projects based on search term
  const filteredProjects = agentProjects.filter(project => {
    const matchesSearch = 
      (project?.project_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (project?.agent_project_name?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
      (project?.framework?.toLowerCase().includes(searchTerm.toLowerCase()) || false);
    
    return matchesSearch;
  });

  const indexOfLastProject = currentPage * projectsPerPage;
  const indexOfFirstProject = indexOfLastProject - projectsPerPage;
  const currentProjects = filteredProjects.slice(indexOfFirstProject, indexOfLastProject);
  const totalPages = Math.max(1, Math.ceil(filteredProjects.length / projectsPerPage));

  return (
    <div className="p-8 flex flex-col min-h-screen">
      {/* Project Header */}
      <div className="bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Agent Projects
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Manage your agent projects and workflows
            </p>
          </div>
          
          {/* Back Link */}
          <span 
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer transition-colors duration-200"
          >
            <ChevronLeft className="mr-1" size={18} />
            Back to Dashboard
          </span>
        </div>
      </div>

      {/* Table Content Area */}
      <div className="flex-grow bg-white dark:bg-[#1B2B3A] p-6 rounded-xl shadow-sm mb-6">
        <div className="flex justify-between items-center mb-6">
          <SearchBar 
            value={searchTerm}
            onChange={setSearchTerm}
          />
          <button 
            onClick={() => setIsAgentModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-light text-white hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New Agent Project
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
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Agent Project Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Framework
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Agent Flow
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {currentProjects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {project.project_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {project.agent_project_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      <span className="px-2 py-1 text-xs rounded-md bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                        {project.framework}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      <span className="px-2 py-1 text-xs rounded-md bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400">
                        {project.agent_flow}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center space-x-4">
                        {/* <button
                          className="p-1.5 rounded-md text-primary-light hover:text-primary-dark transition-colors"
                          onClick={() => navigate(`/dashboard/agent-project/${project.project_id}/flow`, { 
                            state: { projectData: project } 
                          })}
                          title="Configure agent flow"
                        >
                          <Settings size={18} />
                        </button> */}
                        <button
  className="p-1.5 rounded-md text-primary-light hover:text-primary-dark transition-colors"
  onClick={() => navigate(`/dashboard/agent-project/${project.project_id}/flow`, { 
    state: { 
      projectData: project,
      agentProId: project.agent_pro_id 
    } 
  })}
  title="Configure agent flow"
>
  <Settings size={18} />
</button>
                        <button
                          onClick={() => handleDeleteProject(project.project_id)}
                          className="p-1.5 rounded-md text-gray-400 hover:text-red-500 transition-colors"
                          title="Delete project"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Empty state */}
            {filteredProjects.length === 0 && !loading && (
              <div className="text-center py-8">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-gray-100 dark:bg-gray-700/50 text-gray-400 mb-4">
                  <Settings size={24} />
                </div>
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">No agent projects found</h3>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Get started by creating a new agent project.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsAgentModalOpen(true)}
                    className="inline-flex items-center px-4 py-2 bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors"
                  >
                    <Plus size={18} className="mr-2" />
                    Create New Project
                  </button>
                </div>
              </div>
            )}
            
            {/* Pagination */}
            {filteredProjects.length > 0 && (
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
          error={selectedProjectError} 
          onClose={() => {
            setShowErrorPopup(false);
            setSelectedProjectError(null);
          }} 
        />
      )}

      {/* Agent Project Modal */}
      <AgentProjectModal
      projectData={projectData}
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
        onSubmit={handleAgentProjectSubmit}
      />
    </div>
  );
};

export default AgentProjectDetails;