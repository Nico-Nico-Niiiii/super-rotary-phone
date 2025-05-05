import React, { useState } from 'react';

const DatasetSelector = ({ onDatasetChange, initialValues = {} }) => {
  const [selectedType, setSelectedType] = useState(initialValues.datasetType || '');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedDataset, setSelectedDataset] = useState(initialValues.dataset || '');
  
  // Add option for open source datasets
  const openSourceOptions = [
    { id: 'c4', name: 'C4-Type' },
    { id: 'oscar', name: 'Oscar-Unshuffled-en' }
  ];

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setIsDropdownOpen(false);
    
    // Reset selected dataset when type changes
    setSelectedDataset('');
    
    // Notify parent component of changes
    onDatasetChange({ 
      type, 
      dataset: '',
    });
  };

  const handleOpenSourceOptionSelect = (optionId) => {
    setSelectedDataset(optionId);
    onDatasetChange({ 
      type: selectedType, 
      dataset: optionId
    });
  };

  const handleFileChange = (param, file) => {
    onDatasetChange({ 
      type: selectedType, 
      dataset: selectedDataset,
      [param]: file
    });
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Dataset Details</h3>
      
      {/* Dataset Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dataset Type *
        </label>
        <div className="space-y-2">
          <div className="flex items-center">
            <input 
              type="radio" 
              id="openSource" 
              name="datasetType" 
              value="Open-Source Dataset"
              checked={selectedType === 'Open-Source Dataset'} 
              onChange={() => handleTypeSelect('Open-Source Dataset')} 
              className="h-4 w-4 text-primary-light focus:ring-primary-light" 
            />
            <label htmlFor="openSource" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Open-Source Dataset
            </label>
          </div>
          <div className="flex items-center">
            <input 
              type="radio" 
              id="chooseDataset" 
              name="datasetType" 
              value="Choose a Dataset"
              checked={selectedType === 'Choose a Dataset'} 
              onChange={() => handleTypeSelect('Choose a Dataset')} 
              className="h-4 w-4 text-primary-light focus:ring-primary-light" 
            />
            <label htmlFor="chooseDataset" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              Choose a Dataset
            </label>
          </div>
        </div>
      </div>
      
      {/* Dynamic Fields based on Dataset Type Selection */}
      {selectedType === 'Open-Source Dataset' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Dataset Source
            </label>
            <select 
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              value={selectedDataset}
              onChange={(e) => handleOpenSourceOptionSelect(e.target.value)}
            >
              <option value="">Select dataset source</option>
              {openSourceOptions.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dataset Config Name
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              placeholder="Enter dataset config name"
              onChange={(e) => onDatasetChange({
                type: selectedType,
                dataset: selectedDataset,
                datasetConfigName: e.target.value
              })}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Dataset Name
            </label>
            <input 
              type="text" 
              className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
              placeholder="Enter dataset name"
              onChange={(e) => onDatasetChange({
                type: selectedType,
                dataset: selectedDataset,
                datasetName: e.target.value
              })}
            />
          </div>
        </div>
      )}

      {selectedType === 'Choose a Dataset' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Training File
            </label>
            <div className="flex items-center w-full">
              <label className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light cursor-pointer text-center">
                <span className="text-gray-500">
                  {initialValues.trainingFile ? 
                    initialValues.trainingFile.name : 'Upload CSV or JSONL file'}
                </span>
                <input 
                  type="file"
                  accept=".csv,.jsonl"
                  className="hidden"
                  onChange={(e) => handleFileChange('trainingFile', e.target.files[0])}
                />
              </label>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Validation File
            </label>
            <div className="flex items-center w-full">
              <label className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light cursor-pointer text-center">
                <span className="text-gray-500">
                  {initialValues.validationFile ? 
                    initialValues.validationFile.name : 'Upload CSV or JSONL file'}
                </span>
                <input 
                  type="file"
                  accept=".csv,.jsonl"
                  className="hidden"
                  onChange={(e) => handleFileChange('validationFile', e.target.files[0])}
                />
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetSelector;