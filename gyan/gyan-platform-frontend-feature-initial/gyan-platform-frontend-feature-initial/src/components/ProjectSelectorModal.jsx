// ProjectSelectorModal.js
import React, { useState, useEffect } from 'react';
import { X, Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useProject } from '../context/ProjectContext';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_APP_API_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    }
});

const ProjectSelectorModal = ({ isOpen, onClose, onNewProject }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('RECENT');
  const { selectedProject, setSelectedProject, setSelectedProjectId, selectedProjectId } = useProject();
  const [pro, setPro] = useState([]);
  const navigate = useNavigate();
  const {user} = useAuth();

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
      console.log("Selected project", selectedProject);

      if (selectedProject) {
        setSelectedProjectId(selectedProject.id);
      }
      // setSelectedProjectId(selectedProject.id)
      
    }
  }, [user, selectedProject]);

  // const fetchProjects = async () => {
  //   try {
  //     const response = await axios.get(`http://localhost:8000/project/user/${user.id}`, {
  //       withCredentials: true
  //     });
  //     setPro(response.data);
  //   } catch (error) {
  //     console.error('Error fetching projects:', error);
  //   }
  // };


  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/project/user/${user.id}`, {
        withCredentials: true
      });
      setPro(response.data);
      console.log("Response data", response.data[0]);
      
      // Set the first project as default if there's no selected project yet
      if (response.data.length > 0 && !selectedProject) {
        setSelectedProject(response.data[0]);
        setSelectedProjectId(response.data[0].id);
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };


  const handleNewProject = () => {
    onClose();
    onNewProject();
  };

  const handleDashboard = (e) => {
   
    onClose();
    navigate('/dashboard/projects');
  };

  const handleProjectSelect = (project) => {
    onClose();
    setSelectedProject(project);
    setSelectedProjectId(project.id); 
  };

  const handleSubmit = () => {
    onClose();
  };
  
  const handleClose = () => {
    onClose();
  }
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-2xl shadow-xl">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
          <h2 className="text-lg font-medium">Select Project</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDashboard}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              Dashboard
            </button>
            <button
              onClick={handleNewProject}
              className="px-3 py-1.5 text-sm bg-primary-light text-white rounded hover:bg-primary-dark flex items-center gap-1"
            >
              <Plus size={16} />
              New Project
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search projects and folders"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-10 py-2 border dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 border-b dark:border-gray-700">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('RECENT')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'RECENT'
                  ? 'border-primary-light text-primary-light'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              RECENT
            </button>
            <button
              onClick={() => setActiveTab('ALL')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'ALL'
                  ? 'border-primary-light text-primary-light'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              ALL
            </button>
          </div>
        </div>

      

<div className="overflow-hidden">
  <table className="w-full">
    <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0 z-10">
      <tr>
        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Name</th>
        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Type</th>
        <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Modal name</th>
      </tr>
    </thead>
  </table>
</div>
<div className="h-[288px] overflow-y-auto">
  <table className="w-full">
    <tbody>
      {pro.filter(project => 
        project.name.toLowerCase().includes(searchTerm.toLowerCase())
      ).map((project) => (
        <tr
          key={project.id}
          onClick={() => handleProjectSelect(project)}
          className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 `}
        >
          <td className="px-4 py-3 text-sm">{project.name}</td>
          <td className="px-4 py-3 text-sm">{project.status}</td>
          {/* <td className="px-4 py-3 text-sm">{project.model_type}</td> */}
          <td className="px-4 py-3 text-sm">
  {project.model_type === 'Large Language Model' ? 'LLM' : project.model_type}
</td>
          {/* <td className="px-4 py-3 text-sm">{project.model_name}</td> */}
          <td className="px-4 py-3 text-sm flex items-center justify-between">
  {project.model_name}
  {selectedProject?.id === project.id && (
    <svg 
      className="w-5 h-5 text-green-500" 
      fill="none" 
      stroke="currentColor" 
      viewBox="0 0 24 24" 
      xmlns="http://www.w3.org/2000/svg"
    >
      <path 
        strokeLinecap="round" 
        strokeLinejoin="round" 
        strokeWidth="2" 
        d="M5 13l4 4L19 7"
      />
    </svg>
  )}
</td>
        </tr>
      ))}
    </tbody>
  </table>
</div>

        {/* Footer */}
        <div className="p-4 border-t dark:border-gray-700 flex justify-end gap-2">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 rounded"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 text-sm bg-primary-light text-white rounded hover:bg-primary-dark"
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectSelectorModal;