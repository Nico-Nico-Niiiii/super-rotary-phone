import React from 'react';

const ProjectCard = ({ project, onProjectClick }) => {
  if (!project) return null; // Add safety check

  const handleProjectClick = () => {
    onProjectClick(project.id);
  };

  // Map project type to display name
  const modelTypeDisplay = {
    'LLM': 'Large Language Model',
    'Vision': 'Vision Model',
    'Vision LLM': 'Vision LLM'
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <h3 
          onClick={handleProjectClick}
          className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-light dark:hover:text-primary-light transition-colors"
        >
          {project.projectName}
        </h3>
        <span className={`text-sm ${
          project.tokenizerParams?.status === 'Queued' ? 'text-yellow-500' :
          project.tokenizerParams?.status === 'Success' && project.trainingParams?.status === 'Queued' ? 'text-yellow-500' :
          project.tokenizerParams?.status === 'Success' && project.trainingParams?.status === 'Success' ? 'text-green-500' :
          'text-blue-500'
        }`}>
          {project.tokenizerParams?.status === 'Queued' ? 'Tokenizer: Queued' :
           project.tokenizerParams?.status === 'Success' && !project.trainingParams?.status ? 'Tokenizer: Success' :
           project.tokenizerParams?.status === 'Success' && project.trainingParams?.status === 'Queued' ? 'Unsupervised Training: Queued' :
           project.tokenizerParams?.status === 'Success' && project.trainingParams?.status === 'Success' ? 'Training Complete' :
           'Active'}
        </span>
      </div>
      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
        project.projectType === 'LLM' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
        project.projectType === 'Vision LLM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
        {modelTypeDisplay[project.projectType] || project.projectType}
      </span>
      <div className='mt-2'>{project.selectedModel}</div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date().toLocaleDateString()}
        </p>
        <button 
          onClick={handleProjectClick}
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

export default ProjectCard;