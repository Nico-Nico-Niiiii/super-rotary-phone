import React, { useState } from 'react';

const UnsupervisedTraining = ({ onTrainingChange, initialValues = {} }) => {
  const [isTraining, setIsTraining] = useState(false);

  const [errors, setErrors] = useState({
    epochs: '',
    batchSize: '',
    learningRate: '',
    sequenceLength: ''
  });

  const validateEpochs = (value) => {
    if (!value) return 'Epochs is required';
    if (value <= 0) return 'Epochs must be positive';
    if (value < 1) return 'Epochs must be at least 1';
    if (value > 100) return 'Epochs must be at most 100';
    return '';
  };

  const validateBatchSize = (value) => {
    if (!value) return 'Batch size is required';
    if (value <= 0) return 'Batch size must be positive';
    
    // Check if power of 2 (has only one bit set to 1)
    if ((value & (value - 1)) !== 0) {
      return 'Batch size must be a power of 2 (e.g., 2, 4, 8, 16, 32, 64, etc.)';
    }
    
    return '';
  };

  const validateLearningRate = (value) => {
    if (!value) return 'Learning rate is required';
    if (value <= 0) return 'Learning rate must be positive';
    // if (value < 0.1) return 'Learning rate must be at least 0.1';
    if (value > 1.0) return 'Learning rate must be at most 1.0';
    return '';
  };

  const validateSequenceLength = (value) => {
    if (!value) return 'Sequence length is required';
    if (value <= 0) return 'Sequence length must be positive';
    if (value < 65) return 'Sequence length must be at least 65';
    return '';
  };

  const handleInputChange = (param, value) => {
    // Update the value
    onTrainingChange({
      ...initialValues,
      [param]: value
    });
    
    // Validate the input
    if (param === 'epochs') {
      setErrors({...errors, epochs: validateEpochs(value)});
    } else if (param === 'batchSize') {
      setErrors({...errors, batchSize: validateBatchSize(value)});
    } else if (param === 'learningRate') {
      setErrors({...errors, learningRate: validateLearningRate(value)});
    } else if (param === 'sequenceLength') {
      setErrors({...errors, sequenceLength: validateSequenceLength(value)});
    }
  };

  const startTraining = () => {
    // Final validation before starting training
    const epochsError = validateEpochs(initialValues.epochs);
    const batchSizeError = validateBatchSize(initialValues.batchSize);
    const learningRateError = validateLearningRate(initialValues.learningRate);
    const sequenceLengthError = validateSequenceLength(initialValues.sequenceLength);
    
    setErrors({
      epochs: epochsError,
      batchSize: batchSizeError,
      learningRate: learningRateError,
      sequenceLength: sequenceLengthError
    });
    
    // If there are any errors, don't start training
    if (epochsError || batchSizeError || learningRateError || sequenceLengthError) {
      return;
    }
    
    setIsTraining(true);
    
    // Update status to 'Queued'
    onTrainingChange({
      ...initialValues,
      status: 'Queued'
    });
    
    // Simulate training process
    setTimeout(() => {
      setIsTraining(false);
      onTrainingChange({
        ...initialValues,
        trained: true,
        status: 'Success'
      });
    }, 3000);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Unsupervised Training</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Epochs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Epochs
          </label>
          <input 
            type="number" 
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            placeholder="Enter epochs"
            value={initialValues.epochs || ''}
            onChange={(e) => handleInputChange('epochs', e.target.value)}
          />
          {errors.epochs && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.epochs}</p>
          )}
        </div>
        
        {/* Batch Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Batch Size
          </label>
          <input 
            type="number" 
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            placeholder="32"
            value={initialValues.batchSize || ''}
            onChange={(e) => handleInputChange('batchSize', e.target.value)}
          />
          {errors.batchSize && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.batchSize}</p>
          )}
        </div>
        
        {/* Learning Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Learning Rate
          </label>
          <input 
            type="number" 
            step="0.001"
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            placeholder="0.001"
            value={initialValues.learningRate || ''}
            onChange={(e) => handleInputChange('learningRate', e.target.value)}
          />
          {errors.learningRate && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.learningRate}</p>
          )}
        </div>
        
        {/* Sequence Length */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sequence Length
          </label>
          <input 
            type="number" 
            className="w-full px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            placeholder="128"
            value={initialValues.sequenceLength || ''}
            onChange={(e) => handleInputChange('sequenceLength', e.target.value)}
          />
          {errors.sequenceLength && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.sequenceLength}</p>
          )}
        </div>
      </div>
      
      {initialValues.trained && (
        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>Unsupervised training completed successfully!</span>
          </div>
        </div>
      )}
      
      <div className="mt-6">
        <button 
          onClick={startTraining}
          disabled={isTraining || !initialValues.epochs || !initialValues.batchSize || !initialValues.learningRate || !initialValues.sequenceLength}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isTraining ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Training...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Train Model
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UnsupervisedTraining;