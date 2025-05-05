import React, { useState, useEffect } from 'react';
import { Plus, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import EdgeDeploymentModal from '../components/edge_deployment/EdgeDeploymentModal';
import EdgeDeploymentCard from '../components/edge_deployment/EdgeDeploymentCard';
import { CompilationApiService } from '../services/CompilationApiService';
import { useAuth } from '../context/AuthContext'; 
import endpoints from '../endpoints.json';
import axios from 'axios';


const BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const SearchBar = ({ value, onChange }) => (
  <div className="w-48 mb-8 ml-auto">
    <div className="relative">
      <input
        type="text"
        placeholder="Search ..."
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

const Compilation = () => {
  const { user } = useAuth(); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [projects, setProjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const projectsPerPage = 8;
  const [projectName, setProjectName] = useState([]);

  useEffect(() => {
    fetchProjectsName();
  }, [])

  useEffect(() => {
    fetchJobs();
  }, [projectName])


  const fetchProjectsName = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/project/user/${user.id}`, {
        withCredentials: true
      });
      console.log("Response from project", response.data);
      
      setProjectName(response.data[4].id);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };


  const fetchJobs = async () => {
    try {
      // setLoading(true);
      const response = await api.get(
        `${endpoints.training.prefix}${endpoints.training.routes.list.replace('{project_id}', projectName)}`
      );
      console.log("Response of training jobs", response.data);
      
      const completedJobs = response.data.filter(job => job.queue_status === 'Completed');
      // setJobs(completedJobs);
      
      // if (!selectedJob && completedJobs.length > 0) {
      //   setSelectedJob(completedJobs[0]);
      //   setSelectedJobDetails(response.data[0]);
      // }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      // setLoading(false);
    }
  };

  // Fetch projects from API
  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const data = await CompilationApiService.getOptimizedModels();
      
      // Transform API data to match our frontend model
      const transformedProjects = data.map(item => ({
        id: `${item.project_name}-${item.model_name}-${item.framework}-${item.precision_type}`,
        name: item.project_name,
        model: item.model_name,
        deploymentType: item.model_type,
        framework: item.framework,
        precisionType: item.precision_type,
        status: 'Completed', // API only returns completed models
        created_date: new Date().toISOString(), // API doesn't provide creation date
        optimizationLogs: [
          { 
            stage: 'Completion', 
            status: 'Success', 
            timestamp: new Date().toISOString(),
            details: 'Model successfully optimized.'
          }
        ]
      }));
      
      setProjects(transformedProjects);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
      setError('Failed to load projects. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch projects on component mount
  useEffect(() => {
    fetchProjects();
  }, []);

  const handleOptimize = (projectData) => {
    // Check if project already exists
    const existingProjectIndex = projects.findIndex(p => 
      p.name === projectData.name && 
      p.model === projectData.model && 
      p.framework === projectData.framework &&
      p.precisionType === projectData.precisionType
    );

    if (existingProjectIndex >= 0) {
      // Update existing project
      setProjects(prevProjects => 
        prevProjects.map((project, index) => 
          index === existingProjectIndex ? projectData : project
        )
      );
    } else {
      // Add new project
      setProjects(prevProjects => [projectData, ...prevProjects]);
    }
    
    setIsModalOpen(false);
    setCurrentPage(0);
  };

  const handleDeleteProject = async (projectId) => {
    const projectToDelete = projects.find(project => project.id === projectId);
    
    if (projectToDelete) {
      try {
        // Remove from UI first for better UX
        setProjects(prevProjects => prevProjects.filter(project => project.id !== projectId));
        
        // If the project was created via the API (has a status of 'Completed')
        if (projectToDelete.status === 'Completed') {
          // Make the API call to delete the project on the backend
          await CompilationApiService.deleteModel(projectToDelete);
        }
      } catch (error) {
        console.error('Error deleting project:', error);
        // Add project back if deletion fails
        setProjects(prevProjects => [projectToDelete, ...prevProjects]);
        alert(`Failed to delete project: ${error.message}`);
      }
    }
  };

  // Filtering and Pagination Logic
  const filteredProjects = projects.filter(project =>
    project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project?.deploymentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project?.model?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project?.framework?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const displayedProjects = searchTerm 
    ? filteredProjects 
    : filteredProjects.slice(currentPage * projectsPerPage, (currentPage + 1) * projectsPerPage);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Edge Deployment Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Optimize and deploy your machine learning models.</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={fetchProjects}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors duration-200"
              title="Refresh Projects"
            >
              <RefreshCw size={20} className={isLoading ? "animate-spin" : ""} />
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <Plus size={20} />
              New Project
            </button>
          </div>
        </div>
      </div>
      
      {/* Search and Projects Section */}
      <div className="px-8">
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
        />

        {/* Error message */}
        {error && (
          <div className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Loading indicator */}
        {isLoading && displayedProjects.length === 0 && (
          <div className="text-center py-16">
            <RefreshCw size={32} className="animate-spin mx-auto mb-4 text-primary-light" />
            <p className="text-gray-500 dark:text-gray-400">Loading projects...</p>
          </div>
        )}

        {/* Projects Grid with Navigation */}
        <div className="relative mb-16">
          {!searchTerm && currentPage > 0 && (
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Empty state message */}
          {!isLoading && displayedProjects.length === 0 && (
            <div className="text-center py-16 text-gray-500 dark:text-gray-400">
              {searchTerm 
                ? "No projects match your search criteria." 
                : "No projects yet. Click 'New Project' to create one."}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedProjects.map(project => (
              <EdgeDeploymentCard 
                key={project.id} 
                project={project}
                onDelete={handleDeleteProject}
              />
            ))}
          </div>

          {!searchTerm && currentPage < maxPages - 1 && (
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Edge Deployment Modal */}
      <EdgeDeploymentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onOptimize={handleOptimize}
      />
    </div>
  );
};

export default Compilation;