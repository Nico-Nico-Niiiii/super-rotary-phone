// ScratchTraining.jsx//../components/scratch_training/
import React, { useState } from 'react';
import DatasetSelector from '../components/scratch_training/DatasetSelector';
import TokenizerTraining from '../components/scratch_training/TokenizerTraining';
import UnsupervisedTraining from '../components/scratch_training/UnsupervisedTraining';
import ProjectCard from '../components/scratch_training/ProjectCard';
import ScratchProjectDetails from '../components/scratch_training/ScratchProjectDetails';

const ScratchTraining = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [detailModalStep, setDetailModalStep] = useState(1); // 1 for dataset, 2 for tokenizer, 3 for training
  const [projects, setProjects] = useState([]);
  const [projectForm, setProjectForm] = useState({
    projectName: '',
    projectType: '',
    selectedModel: '',
    datasetInfo: {
      datasetType: '',
      dataset: '',
      datasetConfigName: '',
      datasetName: '',
      trainingFile: null,
      validationFile: null
    },
    tokenizerParams: {
      batchSize: '',
      vocabSize: '',
      trained: false
    },
    trainingParams: {
      epochs: '',
      batchSize: '',
      learningRate: '',
      sequenceLength: '',
      modelType: '',
      trained: false
    }
  });

  // Handle form input changes for project details
  const handleInputChange = (field, value) => {
    setProjectForm({
      ...projectForm,
      [field]: value
    });
  };

  // Handle dataset changes from DatasetSelector
  const handleDatasetChange = (data) => {
    if (selectedProject) {
      // Update existing project
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProject) {
          return {
            ...project,
            datasetInfo: {
              ...project.datasetInfo,
              datasetType: data.type,
              dataset: data.dataset,
              datasetConfigName: data.datasetConfigName || project.datasetInfo.datasetConfigName,
              datasetName: data.datasetName || project.datasetInfo.datasetName,
              trainingFile: data.trainingFile || project.datasetInfo.trainingFile,
              validationFile: data.validationFile || project.datasetInfo.validationFile
            }
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);
    } else {
      // Update form
      setProjectForm({
        ...projectForm,
        datasetInfo: {
          ...projectForm.datasetInfo,
          datasetType: data.type,
          dataset: data.dataset,
          datasetConfigName: data.datasetConfigName || projectForm.datasetInfo.datasetConfigName,
          datasetName: data.datasetName || projectForm.datasetInfo.datasetName,
          trainingFile: data.trainingFile || projectForm.datasetInfo.trainingFile,
          validationFile: data.validationFile || projectForm.datasetInfo.validationFile
        }
      });
    }
  };

  // Handle tokenizer parameter changes
  const handleTokenizerChange = (tokenizerParams) => {
    if (selectedProject) {
      // Update existing project
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProject) {
          return {
            ...project,
            tokenizerParams
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);

      // If the tokenizer was trained, automatically advance to the next step
      if (tokenizerParams.trained && !getCurrentProject()?.tokenizerParams?.trained) {
        // Close the modal after the tokenizer training is complete
        handleCancel();
      }
    } else {
      // Update form
      setProjectForm({
        ...projectForm,
        tokenizerParams
      });
    }
  };

  // Handle training parameter changes
  const handleTrainingChange = (trainingParams) => {
    if (selectedProject) {
      // Update existing project
      const updatedProjects = projects.map(project => {
        if (project.id === selectedProject) {
          return {
            ...project,
            trainingParams
          };
        }
        return project;
      });
      
      setProjects(updatedProjects);

      // If the training was completed, automatically close the modal
      if (trainingParams.trained && !getCurrentProject()?.trainingParams?.trained) {
        handleCancel();
      }
    } else {
      // Update form
      setProjectForm({
        ...projectForm,
        trainingParams
      });
    }
  };

  // Create a new project
  const handleCreateProject = () => {
    const newProject = {
      ...projectForm,
      id: Date.now().toString(),
      created_date: new Date().toISOString()
    };
    
    setProjects([...projects, newProject]);
    setIsModalOpen(false);
    setProjectForm({
      projectName: '',
      projectType: '',
      selectedModel: '',
      datasetInfo: {
        datasetType: '',
        dataset: '',
        datasetConfigName: '',
        datasetName: '',
        trainingFile: null,
        validationFile: null
      },
      tokenizerParams: {
        batchSize: '',
        vocabSize: '',
        trained: false
      },
      trainingParams: {
        epochs: '',
        batchSize: '',
        learningRate: '',
        sequenceLength: '',
        modelType: '',
        trained: false
      }
    });
  };

  // Handle project card click
  const handleProjectClick = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    setSelectedProject(projectId);
    
    // Check the training status
    if (project.tokenizerParams?.trained) {
      // If tokenizer training is complete, go directly to unsupervised training
      setDetailModalStep(3);
    } else {
      // Otherwise start with dataset selection
      setDetailModalStep(1);
    }
    
    // Open modal
    setIsModalOpen(true);
  };

  // Close modal and reset state
  const handleCancel = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
    setDetailModalStep(1);
  };

  // Handle Next button in dataset selection
  const handleNextFromDataset = () => {
    setDetailModalStep(2); // Go to tokenizer parameters
  };

  // Get the current project data
  const getCurrentProject = () => {
    if (selectedProject) {
      return projects.find(project => project.id === selectedProject);
    }
    return null;
  };

  // Filter projects based on search term
  const filteredProjects = projects.filter(project => 
    project.projectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    project.selectedModel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Scratch Training Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Create your new project to scratch train the model.</p>
          </div>
          <button 
            onClick={() => {
              setIsModalOpen(true);
              setSelectedProject(null);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Project
          </button>
        </div>
      </div>
      
      {/* Search Bar */}
      <div className="flex justify-end px-8">
        <div className="relative w-64">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <input
            type="search"
            className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            placeholder="Search ..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Project List */}
      <div className="px-8">
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onProjectClick={handleProjectClick} 
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-gray-500">
            No projects found. Click "New Project" to create one.
          </div>
        )}
      </div>

      {/* Modal for creating a new project or editing existing project */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                {selectedProject ? 'Edit Project' : 'Create New Project'}
              </h3>
              <button 
                onClick={handleCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* New Project Form */}
            {!selectedProject && (
              <ScratchProjectDetails 
                projectForm={projectForm}
                handleInputChange={handleInputChange}
                handleCancel={handleCancel}
                handleCreateProject={handleCreateProject}
              />
            )}

            {/* Edit Project Forms - Dataset Selection */}
            {selectedProject && detailModalStep === 1 && (
              <div>
                <DatasetSelector 
                  onDatasetChange={handleDatasetChange}
                  initialValues={getCurrentProject()?.datasetInfo || {}}
                />

                <div className="pt-6 flex justify-end space-x-2">
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleNextFromDataset}
                    className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
                    disabled={!getCurrentProject()?.datasetInfo?.datasetType}
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

            {/* Edit Project Forms - Tokenizer Parameters */}
            {selectedProject && detailModalStep === 2 && (
              <div>
                <TokenizerTraining 
                  onTokenizerChange={handleTokenizerChange}
                  initialValues={getCurrentProject()?.tokenizerParams || {}}
                />

                <div className="pt-6 flex justify-end space-x-2">
                  <button 
                    onClick={() => setDetailModalStep(1)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Edit Project Forms - Training Parameters */}
            {selectedProject && detailModalStep === 3 && (
              <div>
                <UnsupervisedTraining 
                  onTrainingChange={handleTrainingChange}
                  initialValues={getCurrentProject()?.trainingParams || {}}
                />

                <div className="pt-6 flex justify-end space-x-2">
                  <button 
                    onClick={() => setDetailModalStep(2)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleCancel}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ScratchTraining;