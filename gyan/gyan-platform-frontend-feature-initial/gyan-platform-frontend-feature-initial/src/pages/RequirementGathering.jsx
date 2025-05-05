import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Play, 
  ArrowRight,
  X,
  FileSpreadsheet,
  ClipboardList 
} from 'lucide-react';

const RequirementGathering = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    requirementName: '',
    excelFile: null
  });
  const [generatedRequirements, setGeneratedRequirements] = useState([]);

  const handleGenerateClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      requirementName: '',
      excelFile: null
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    if (files && files[0]) {
      setFormData({ ...formData, [name]: files[0] });
    }
  };

  const handleSubmit = () => {
    // Create a new requirement object
    const newRequirement = {
      id: Date.now(),
      requirementName: formData.requirementName,
      excelFile: formData.excelFile,
      status: 'pending',
      timestamp: new Date().toLocaleString()
    };
    
    setGeneratedRequirements([newRequirement, ...generatedRequirements]);
    handleCloseModal();
  };

  const renderModalContent = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Requirement Name
            </label>
            <input
              type="text"
              name="requirementName"
              value={formData.requirementName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="Enter a name for your requirement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload Excel/CSV File
            </label>
            <input
              type="file"
              name="excelFile"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
            />
          </div>
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">User Stories Generator</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered requirement specification for software development
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={handleGenerateClick}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200"
            >
              <Play size={16} />
              Create
            </button>
          </div>
        </div>
      </div>

      {/* Generated Requirements Grid */}
      {generatedRequirements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedRequirements.map((requirement) => (
            <div 
              key={requirement.id} 
              className="border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                navigate('/dashboard/use-cases/requirement-gathering/details', { 
                  state: { requirementData: requirement } 
                });
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={20} className="text-purple-500" />
                    <span className="text-sm font-medium text-purple-500 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                      Requirement
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  {requirement.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{requirement.requirementName}</h3>
              
              <div className="mt-2 space-y-2">
                <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20">
                  <p className="text-xs font-medium mb-1">Excel/CSV File:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{requirement.excelFile ? requirement.excelFile.name : 'None'}</p>
                </div>
                
                <div className="mt-2 text-purple-600 dark:text-purple-400 text-sm flex items-center justify-end">
                  <span>Click to view details</span>
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {requirement.timestamp}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg max-w-2xl w-full m-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Create User Stories
                </h2>
                <button
                  onClick={handleCloseModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={24} />
                </button>
              </div>
              
              {renderModalContent()}

              <div className="flex justify-between mt-8">
                <div className="ml-auto">
                  <button
                    onClick={handleCloseModal}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors mr-2"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RequirementGathering;
