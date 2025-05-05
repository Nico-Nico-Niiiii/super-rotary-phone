import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bug, 
  LineChart, 
  Cpu, 
  Upload, 
  Terminal, 
  Database, 
  X,
  Radio,
  Wifi,
  HandshakeIcon,
  Play,
  Signal,
  Bluetooth
} from 'lucide-react';

const DebuggerModal = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedType, setSelectedType] = useState(null);
  const [selectedDomain, setSelectedDomain] = useState('wifi');
  const [selectedFile, setSelectedFile] = useState(null);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    debuggerType: '',
    file: null,
    description: '',
    additionalInfo: {}
  });

  const debuggerTypes = [
    {
      id: 'software',
      title: 'Software Debugger',
      icon: <Bug className="w-6 h-6" />,
      description: 'Debug application code and runtime errors'
    },
    {
      id: 'bios',
      title: 'BIOS Analyser',
      icon: <Cpu className="w-6 h-6" />,
      description: 'Analyze and troubleshoot BIOS-related issues'
    },
    {
      id: 'data',
      title: 'Data Analyser',
      icon: <LineChart className="w-6 h-6" />,
      description: 'Analyze and debug data processing pipelines'
    }
  ];

  const domains = [
    { id: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth size={20} /> },
    { id: 'kernel', label: 'Kernel', icon: <Cpu size={20} /> },
    { id: 'network', label: 'Network', icon: <Signal size={20} /> },
    { id: 'wifi', label: 'Wifi', icon: <Wifi size={20} /> }
  ];

  const handleTypeSelect = (type) => {
    setSelectedType(type);
    setFormData({ ...formData, debuggerType: type });
    setCurrentStep(2);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setSelectedFile(file.name);
      setFormData({ ...formData, file });
    }
  };

  const handleDebuggerSubmit = () => {
    const routes = {
      'software': '/dashboard/use-cases/software-debugger',
      'bios': '/dashboard/use-cases/Bios-Analyser/details',
      'data': '/dashboard/use-cases/Data-Analyser/details'
    };

    const route = routes[selectedType];
    if (route) {
      onClose();
      navigate(route, { state: { formData } });
    }
  };

  const renderSoftwareDebuggerForm = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          New Analysis
        </h3>
        <div className="space-y-6">
          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload File
            </label>
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-primary-light dark:hover:border-primary-light transition-colors duration-200"
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const file = e.dataTransfer.files[0];
                if (file) {
                  setSelectedFile(file.name);
                  setFormData({ ...formData, file });
                }
              }}
            >
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <Upload className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Drag files here or
                </p>
                <p className="text-sm text-primary-light hover:text-primary-dark">
                  Browse
                </p>
              </label>
            </div>
            {selectedFile && (
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Selected file: {selectedFile}
              </p>
            )}
          </div>

         {/* Domain Selection */}
          <div> 
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Domain
            </label>
            <div className="grid grid-cols-2 gap-3">
              {domains.map((domain) => (
                <label 
                  key={domain.id} 
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700"
                >
                  <input
                    type="radio"
                    name="domain"
                    value={domain.id}
                    checked={selectedDomain === domain.id}
                    onChange={(e) => setSelectedDomain(e.target.value)}
                    className="text-primary-light"
                  />
                  <div className="flex items-center ml-3">
                    <span className="text-primary-light mr-2">{domain.icon}</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{domain.label}</span>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Navigation Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            >
              Back
            </button>
            <button 
              onClick={() => setCurrentStep(3)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <Play size={18} />
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderBiosForm = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          BIOS Information
        </h3>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Motherboard Model"
            className="w-full p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            onChange={(e) =>
              setFormData({
                ...formData,
                additionalInfo: {
                  ...formData.additionalInfo,
                  motherboard: e.target.value
                }
              })
            }
          />
          <input
            type="text"
            placeholder="Current BIOS Version"
            className="w-full p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            onChange={(e) =>
              setFormData({
                ...formData,
                additionalInfo: {
                  ...formData.additionalInfo,
                  biosVersion: e.target.value
                }
              })
            }
          />
          <textarea
            placeholder="Describe the BIOS-related issues..."
            className="w-full p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            rows="4"
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDataForm = () => {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Data Analysis Details
        </h3>
        <div className="space-y-4">
          <select
            className="w-full p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            onChange={(e) =>
              setFormData({
                ...formData,
                additionalInfo: {
                  ...formData.additionalInfo,
                  dataType: e.target.value
                }
              })
            }
          >
            <option value="">Select Data Type</option>
            <option value="structured">Structured Data</option>
            <option value="unstructured">Unstructured Data</option>
            <option value="streaming">Streaming Data</option>
          </select>
          <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
            <Database className="mx-auto h-12 w-12 text-gray-400" />
            <div className="mt-4">
              <label className="cursor-pointer">
                <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                  Upload your data files
                </span>
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) =>
                    setFormData({ ...formData, file: e.target.files[0] })
                  }
                />
              </label>
            </div>
          </div>
          <textarea
            placeholder="Describe your data analysis requirements..."
            className="w-full p-3 border border-gray-300 dark:border-gray-700 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
            rows="4"
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
          />
          <div className="flex space-x-4">
            <button
              onClick={() => setCurrentStep(1)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Back
            </button>
            <button
              onClick={() => setCurrentStep(3)}
              className="flex-1 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderSecondStep = () => {
    switch (selectedType) {
      case 'software':
        return renderSoftwareDebuggerForm();
      case 'bios':
        return renderBiosForm();
      case 'data':
        return renderDataForm();
      default:
        return null;
    }
  };

  const renderThirdStep = () => {
    const getTypeTitle = () => {
      const type = debuggerTypes.find(t => t.id === selectedType);
      return type ? type.title : '';
    };

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Confirm Details
        </h3>
        <div className="space-y-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <div>
            <span className="font-medium text-gray-900 dark:text-white">Type: </span>
            <span className="text-gray-700 dark:text-gray-300">{getTypeTitle()}</span>
          </div>

          {selectedType === 'software' && (
            <div>
              <span className="font-medium text-gray-900 dark:text-white">Domain: </span>
              <span className="text-gray-700 dark:text-gray-300">
                {domains.find(d => d.id === selectedDomain)?.label}
              </span>
            </div>
          )}

          {selectedFile && (
            <div>
              <span className="font-medium text-gray-900 dark:text-white">File: </span>
              <span className="text-gray-700 dark:text-gray-300">{selectedFile}</span>
            </div>
          )}

          {formData.additionalInfo && Object.entries(formData.additionalInfo).map(([key, value]) => (
            <div key={key}>
              <span className="font-medium text-gray-900 dark:text-white">
                {key.charAt(0).toUpperCase() + key.slice(1)}: 
              </span>
              <span className="text-gray-700 dark:text-gray-300"> {value}</span>
            </div>
          ))}
        </div>

        <div className="flex space-x-4">
          <button
            onClick={() => setCurrentStep(2)}
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Back
          </button>
          <button
            onClick={handleDebuggerSubmit}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Play size={18} />
            Start Analysis
          </button>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Select Debugger Type
            </h3>
            <div className="grid grid-cols-1 gap-4">
              {debuggerTypes.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-light dark:hover:border-primary-light transition-colors"
                >
                  <div className="flex-shrink-0 text-primary-light">
                    {type.icon}
                  </div>
                  <div className="ml-4 text-left">
                    <h4 className="text-base font-medium text-gray-900 dark:text-white">
                      {type.title}
                    </h4>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {type.description}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        );

      case 2:
        return renderSecondStep();

      case 3:
        return renderThirdStep();

      default:
        return null;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 focus:outline-none"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {renderStepContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DebuggerModal;