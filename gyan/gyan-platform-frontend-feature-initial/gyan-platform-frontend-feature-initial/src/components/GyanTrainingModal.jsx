import { useState , useEffect} from 'react';
import { X } from 'lucide-react';
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:8000',
  withCredentials: true, // Important for cookies
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const GyanTrainingModal = ({ isOpen, onClose, onSubmit }) => {
  const initialFormState = {
    name: '',
    type: '',
    model: ''
  };

  const [formData, setFormData] = useState(initialFormState);
  const [nameError, setNameError] = useState('');
  const [modelsList, setModelsList] = useState([]); // For storing fetched models
  const [isLoading, setIsLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    const fetchModels = async () => {
      if (!formData.type) return;
      
      setIsLoading(true);
      try {
        const response = await api.get(`/foundation-models/type/${formData.type}`);
        setModelsList(response.data.models || []);
        // Reset model selection when type changes
        setFormData(prev => ({ ...prev, model: '' }));
      } catch (error) {
        console.error('Error fetching models:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchModels();
  }, [formData.type]);

  const validateProjectName = (name) => {
    // Check if empty
    if (!name.trim()) {
      return 'Project name is required';
    }
    
    // Check if starts with capital letter
    if (!/^[A-Z]/.test(name)) {
      return 'Project name must start with a capital letter';
    }
    
    // Check length
    if (name.length > 10) {
      return 'Project name must not exceed 10 characters';
    }

     // Check for spaces
     if (/\s/.test(name)) {
      return 'Job name cannot contain spaces';
    }

    // Check for special characters (allowing only letters, numbers and spaces)
    if (!/^[A-Za-z0-9\s]*$/.test(name)) {
      return 'Project name cannot contain special characters';
    }

    return '';
  };

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData({ ...formData, name: newName });
    setNameError(validateProjectName(newName));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validate all fields
    const error = validateProjectName(formData.name);
    if (error) {
      setNameError(error);
      return;
    }

    if (!formData.type || !formData.model) {
      return;
    }

    // Submit form data
    onSubmit(formData);
    
    // Reset form
    setFormData(initialFormState);
    setNameError('');
  };

  // Reset form when modal is closed
  const handleClose = () => {
    setFormData(initialFormState);
    setNameError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md p-6 relative">
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <X size={20} />
        </button>

        {/* Title */}
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          Create New Project
        </h2>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name *
              <span className="text-xs text-gray-500 ml-1"><br />
                (Max 10 characters, start with capital letter, no special characters)
              </span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={handleNameChange}
              className={`w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light focus:border-transparent
                ${nameError ? 'border-red-500' : ''}`}
              placeholder="Enter project name"
            />
            {nameError && (
              <p className="text-red-500 text-xs mt-1">{nameError}</p>
            )}
          </div>

          {/* Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Type *
            </label>
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="llm"
                  checked={formData.type === 'llm'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-4 h-4 text-primary-light border-gray-300 focus:ring-primary-light"
                  required
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                  LLM
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="vision"
                  checked={formData.type === 'vision'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-4 h-4 text-primary-light border-gray-300 focus:ring-primary-light"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                  Vision
                </span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="vision-llm"
                  checked={formData.type === 'vision-llm'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-4 h-4 text-primary-light border-gray-300 focus:ring-primary-light"
                />
                <span className="ml-2 text-sm text-gray-900 dark:text-gray-300">
                  Vision LLM
                </span>
              </label>
            </div>
          </div>

          {/* Model Selection */}
          <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Select Model *
      </label>
      <select
        required
        value={formData.model}
        onChange={(e) => setFormData({ ...formData, model: e.target.value })}
        className="w-full p-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white 
          border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light focus:border-transparent"
        disabled={isLoading || !formData.type}
      >
        <option value="">Select model</option>
        {isLoading ? (
          <option disabled>Loading models...</option>
        ) : (
          modelsList.map((model) => (
            <option key={model.id} value={model.model_name}>
              {model.model_name}
            </option>
          ))
        )}
      </select>
      {formData.type && !isLoading && modelsList.length === 0 && (
        <p className="text-sm text-yellow-600 mt-1">
          No models available for this type
        </p>
      )}
    </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="mr-4 px-4 py-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 
                dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-light text-white rounded-md hover:bg-primary-dark
                transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary-light"
              disabled={!!nameError || !formData.type || !formData.model}
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default GyanTrainingModal;