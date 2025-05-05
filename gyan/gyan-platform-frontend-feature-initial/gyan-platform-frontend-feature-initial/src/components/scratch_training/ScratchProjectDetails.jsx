import React from 'react';

const ScratchProjectDetails = ({ projectForm, handleInputChange, handleCancel, handleCreateProject }) => {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project Name *
        </label>
        <div className="text-xs text-gray-500 mb-1">
          (Max 10 characters, start with capital letter, no special characters)
        </div>
        <input 
          type="text" 
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          placeholder="Enter project name"
          value={projectForm.projectName}
          onChange={(e) => handleInputChange('projectName', e.target.value)}
          maxLength={10}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Project Type *
        </label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input 
              type="radio" 
              id="llm" 
              name="projectType" 
              value="LLM"
              checked={projectForm.projectType === 'LLM'} 
              onChange={() => handleInputChange('projectType', 'LLM')} 
              className="h-4 w-4 text-primary-light focus:ring-primary-light" 
            />
            <label htmlFor="llm" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              LLM
            </label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              id="vision" 
              name="projectType" 
              value="Vision"
              checked={projectForm.projectType === 'Vision'} 
              onChange={() => handleInputChange('projectType', 'Vision')} 
              className="h-4 w-4 text-primary-light focus:ring-primary-light" 
            />
            <label htmlFor="vision" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Vision
            </label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              id="visionLLM" 
              name="projectType" 
              value="Vision LLM"
              checked={projectForm.projectType === 'Vision LLM'} 
              onChange={() => handleInputChange('projectType', 'Vision LLM')} 
              className="h-4 w-4 text-primary-light focus:ring-primary-light" 
            />
            <label htmlFor="visionLLM" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Vision LLM
            </label>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Select Model *
        </label>
        <select 
          className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
          value={projectForm.selectedModel}
          onChange={(e) => handleInputChange('selectedModel', e.target.value)}
        >
          <option value="">Select model</option>
          <option value="ID_GYAN_T5">ID_GYAN_T5</option>
          <option value="ID_GYAN_LLAMA">ID_GYAN_LLAMA</option>
        </select>
      </div>

      <div className="pt-4 flex justify-end space-x-2">
        <button 
          onClick={handleCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors duration-200"
        >
          Cancel
        </button>
        <button 
          onClick={handleCreateProject}
          className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          disabled={!projectForm.projectName || !projectForm.projectType || !projectForm.selectedModel}
        >
          Create Project
        </button>
      </div>
    </div>
  );
};

export default ScratchProjectDetails;