import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import GyanTrainingModal from '../components/GyanTrainingModal';
import axios from 'axios';  
import { useAuth } from '../context/AuthContext'; 
import endpoints from '../endpoints.json';
import { useProject } from '../context/ProjectContext';



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

// Search Bar Component
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




const ProjectCard = ({ project }) => {
  const navigate = useNavigate();
  const { selectedProject, setSelectedProject } = useProject();
 

  if (!project) return null;

  const isSelected = selectedProject?.id === project.id;

  const handleProjectClick = (projectId) => {
    // navigate(`/dashboard/project/${projectId}`, {
    //   state: { projectData: project }
    // });

    setSelectedProject(isSelected ? null : project); 
  };

  return (
    <div className={`bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200
        ${isSelected ? 'ring-2 ring-primary-light' : ''}`}  onClick={() => handleProjectClick(project.id)}>
      <div className="flex justify-between items-start">
        <h3 
         
          className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-light dark:hover:text-primary-light transition-colors"
        >
          {project.name}
        </h3>
        <div className="flex items-center gap-2">
          {isSelected && (
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
          <span className={`text-sm ${
            project.status === 'Active' ? 'text-green-500' :
            project.status === 'Completed' ? 'text-blue-500' :
            'text-yellow-500'
          }`}>
            {project.status}
          </span>
        </div>
        {/* <span className={`text-sm ${
          project.status === 'Active' ? 'text-green-500' :
          project.status === 'Completed' ? 'text-blue-500' :
          'text-yellow-500'
        }`}>
          {project.status}
        </span> */}
      </div>
      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
        project.model_type === 'Large Language Model' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
        project.model_type === 'Vision LLM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
        {project.model_type}
      </span>
        <div className='mt-2'>{project.model_name}</div>

      {/* <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
        project.model_name === 'BERT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
        project.model_name === 'GPT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }`}>
        {project.model_name}
      </span> */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date(project.created_date).toLocaleDateString()}
        </p>
        <button 
          onClick={() => handleProjectClick(project.id)}
          className="p-2 text-primary-light hover:text-primary-dark flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};



const ProjectPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [projects, setProjects] = useState([]);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const projectsPerPage = 8;
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/project/user/${user.id}`, {
        withCredentials: true
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleGyanTraining = async(formData) => {
    // Create a new project
    try{
    const projectData = {
      name: formData.name,
      type: formData.type === 'llm' ? 'Large Language Model' 
            : formData.type === 'vision' ? 'Vision'
            : 'Vision LLM',
      model: formData.model 
    };
  

    console.log("Project data");
    console.log(projectData);
    
    

    const response = await api.post(`${endpoints.project.prefix}${endpoints.project.routes.create}`, 
      projectData
    );

    console.log(response.data);
    

    if (response.data.project) {  // Changed from new_project to project
      setProjects(prevProjects => [response.data.project, ...prevProjects]);  // Add the new project
      setIsGyanModalOpen(false);
      setCurrentPage(0);
    }
    } catch(error){
        if (error.response?.data?.detail?.includes('already exists')) {
            setNameError('A project with this name already exists');
        } else {
            setNameError('Failed to create project. Please try again.');
        }
        // Don't close the modal on error
        return;
    }
  
  };

 

  // Fixed filter function
const filteredProjects = projects.filter(project =>
  project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  project?.model_type?.toLowerCase().includes(searchTerm.toLowerCase())
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Training Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Create your new project to train the model.</p>
          </div>
          <button 
            onClick={() => setIsGyanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>
      </div>
      
      {/* Search and Projects Section */}
      <div className="px-8">
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
        />

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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
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

      {/* Gyan Training Modal */}
      <GyanTrainingModal
        isOpen={isGyanModalOpen}
        onClose={() => setIsGyanModalOpen(false)}
        onSubmit={handleGyanTraining}
      />
    </div>
  );
};

export default ProjectPage;