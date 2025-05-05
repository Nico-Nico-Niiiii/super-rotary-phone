import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Play, 
  ArrowRight,
  X,
  FileSpreadsheet,
  Users,
  Briefcase 
} from 'lucide-react';

const ProjectManager = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    projectName: '',
    inputType: 'text',
    projectDescription: '',
    descriptionFile: null,
    teamFile: null
  });
  const [createdProjects, setCreatedProjects] = useState([]);

  const handleCreateClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      projectName: '',
      inputType: 'text',
      projectDescription: '',
      descriptionFile: null,
      teamFile: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleRadioChange = (e) => {
    setFormData({ 
      ...formData, 
      inputType: e.target.value,
      projectDescription: '',
      descriptionFile: null
    });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleSubmit = () => {
    // Create a new project object
    const newProject = {
      id: Date.now(),
      projectName: formData.projectName,
      inputType: formData.inputType,
      projectDescription: formData.projectDescription,
      descriptionFile: formData.descriptionFile,
      teamFile: formData.teamFile,
      status: 'pending',
      timestamp: new Date().toLocaleString()
    };
    
    setCreatedProjects([newProject, ...createdProjects]);
    handleCloseModal();
  };

  const renderModalContent = () => {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Name
          </label>
          <input
            type="text"
            name="projectName"
            value={formData.projectName}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm"
            placeholder="Enter a name for your project"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Project Description Input Type
          </label>
          <div className="flex space-x-4 mt-1">
            <div className="flex items-center">
              <input
                type="radio"
                id="textInput"
                name="inputType"
                value="text"
                checked={formData.inputType === 'text'}
                onChange={handleRadioChange}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <label htmlFor="textInput" className="text-sm text-gray-700 dark:text-gray-300">
                Text Input
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="radio"
                id="fileUpload"
                name="inputType"
                value="file"
                checked={formData.inputType === 'file'}
                onChange={handleRadioChange}
                className="mr-2 h-4 w-4 text-blue-600"
              />
              <label htmlFor="fileUpload" className="text-sm text-gray-700 dark:text-gray-300">
                File Upload (.txt)
              </label>
            </div>
          </div>
        </div>

        {formData.inputType === 'text' ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Description
            </label>
            <textarea
              name="projectDescription"
              value={formData.projectDescription}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm"
              placeholder="Enter a detailed description of your project"
            />
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload Description File (.txt)
            </label>
            <input
              type="file"
              name="descriptionFile"
              accept=".txt"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm"
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Team Details (.csv, .xlsx)
          </label>
          <input
            type="file"
            name="teamFile"
            accept=".csv,.xlsx"
            onChange={handleFileChange}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 text-sm"
          />
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Management Dashboard</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered project management and team coordination
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={handleCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
            >
              <Play size={16} />
              Create Project
            </button>
          </div>
        </div>
      </div>

      {/* Created Projects Grid */}
      {createdProjects.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {createdProjects.map((project) => (
            <div 
              key={project.id} 
              className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                navigate('/dashboard/use-cases/project-manager/details', { 
                  state: { projectData: project } 
                });
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Briefcase size={20} className="text-blue-500" />
                    <span className="text-sm font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                      Project
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  {project.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{project.projectName}</h3>
              
              <div className="mt-2 space-y-2">
                <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                  <p className="text-xs font-medium mb-1">Description:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                    {project.inputType === 'text' 
                      ? project.projectDescription || 'No description provided' 
                      : project.descriptionFile ? project.descriptionFile.name : 'No file uploaded'}
                  </p>
                </div>
                
                <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                  <p className="text-xs font-medium mb-1">Team File:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    {project.teamFile ? project.teamFile.name : 'None'}
                  </p>
                </div>
                
                <div className="mt-2 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-end">
                  <span>Click to view details</span>
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {project.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal - Reduced size */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-md w-full m-4">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                  Create Project
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
              
              {renderModalContent()}

              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCloseModal}
                  className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors mr-2"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectManager;
