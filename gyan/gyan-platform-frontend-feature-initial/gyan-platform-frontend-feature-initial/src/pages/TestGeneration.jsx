import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  GitBranch, 
  Code2, 
  Terminal,
  TestTube,
  Bug,
  Braces,
  ArrowRight,
  RefreshCcw,
  FileCode,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';

const TestGeneration = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState(null);
  const [formData, setFormData] = useState({
    choice: '',
    testName: '',
    imageFile: null,
    diagramType: 'sequence',
    excelFile: null
  });
  const [generatedTests, setGeneratedTests] = useState([]);

  const handleGenerateClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedChoice(null);
    setFormData({
      choice: '',
      testName: '',
      imageFile: null,
      diagramType: 'sequence',
      excelFile: null
    });
  };

  const handleChoiceSelect = (choice) => {
    setSelectedChoice(choice);
    setFormData({ ...formData, choice });
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

  const handleRadioChange = (e) => {
    setFormData({ ...formData, diagramType: e.target.value });
  };

  const handleSubmit = () => {
    // Create a new test object based on the selected choice
    const newTest = {
      id: Date.now(),
      type: formData.choice,
      testName: formData.testName,
      // Store the actual file objects for later use
      imageFile: formData.imageFile,
      excelFile: formData.excelFile,
      diagramType: formData.diagramType,
      status: 'pending',
      timestamp: new Date().toLocaleString()
    };
    
    setGeneratedTests([newTest, ...generatedTests]);
    
    // Close the modal first instead of navigating directly to details page
    handleCloseModal();
  };

  const renderModalContent = () => {
    if (!selectedChoice) {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Select Test Type
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => handleChoiceSelect('CORI')}
              className={`p-4 border rounded-lg ${
                selectedChoice === 'CORI' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              } hover:border-blue-500 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <Terminal size={24} className="text-blue-500" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">CORI</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generate CORI test cases
                  </p>
                </div>
              </div>
            </button>
            <button
              onClick={() => handleChoiceSelect('Test Scenario Generator')}
              className={`p-4 border rounded-lg ${
                selectedChoice === 'Test Scenario Generator' 
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
                  : 'border-gray-200 dark:border-gray-700'
              } hover:border-blue-500 transition-colors`}
            >
              <div className="flex items-center gap-3">
                <TestTube size={24} className="text-blue-500" />
                <div className="text-left">
                  <h4 className="font-medium text-gray-900 dark:text-white">Test Scenario Generator</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generate test scenarios
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      );
    }

    // CORI Form
    if (selectedChoice === 'CORI') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            CORI Test Generation
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Name
              </label>
              <input
                type="text"
                name="testName"
                value={formData.testName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload Excel File
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
    }

    // Test Scenario Generator Form
    if (selectedChoice === 'Test Scenario Generator') {
      return (
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Test Scenario Generator
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Test Name
              </label>
              <input
                type="text"
                name="testName"
                value={formData.testName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Upload Image
              </label>
              <input
                type="file"
                name="imageFile"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Diagram Type
              </label>
              <div className="flex gap-4">
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="diagramType"
                    value="sequence"
                    checked={formData.diagramType === 'sequence'}
                    onChange={handleRadioChange}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">Sequence Diagram</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="diagramType"
                    value="state"
                    checked={formData.diagramType === 'state'}
                    onChange={handleRadioChange}
                    className="form-radio h-4 w-4 text-blue-500"
                  />
                  <span className="ml-2 text-gray-700 dark:text-gray-300">State Diagram</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Test Generation</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered test case generation for comprehensive code coverage
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={handleGenerateClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <Play size={16} />
              Generate Tests
            </button>
          </div>
        </div>
      </div>

      {/* Generated Tests Grid */}
      {generatedTests.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedTests.map((test) => (
            <div 
              key={test.id} 
              className={`${
                test.type === 'CORI' 
                  ? 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                  : 'border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-900/10'
              } rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow`}
              onClick={() => {
                if (test.type === 'Test Scenario Generator') {
                  navigate('/dashboard/use-cases/test-generation/scenario-details', { 
                    state: { testData: test } 
                  });
                } else if (test.type === 'CORI') {
                  navigate('/dashboard/use-cases/test-generation/cori-details', {
                    state: { testData: test }
                  });
                }
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {test.type === 'CORI' ? (
                    <div className="flex items-center gap-2">
                      <Terminal size={20} className="text-blue-500" />
                      <span className="text-sm font-medium text-blue-500 bg-blue-100 dark:bg-blue-900/50 px-2 py-0.5 rounded">
                        CORI
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <TestTube size={20} className="text-purple-500" />
                      <span className="text-sm font-medium text-purple-500 bg-purple-100 dark:bg-purple-900/50 px-2 py-0.5 rounded">
                        Test Scenario
                      </span>
                    </div>
                  )}
                </div>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  test.status === 'pending' 
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    : ''
                }`}>
                  {test.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{test.testName}</h3>
              
              {test.type === 'CORI' && (
                <div className="space-y-2 mt-4">
                  <div className="p-3 rounded-lg bg-blue-100/50 dark:bg-blue-900/20">
                    <p className="text-xs font-medium mb-1">Excel File:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{test.excelFile ? test.excelFile.name : 'None'}</p>
                  </div>
                  <div className="mt-2 text-blue-600 dark:text-blue-400 text-sm flex items-center justify-end">
                    <span>Click to view details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
              
              {test.type === 'Test Scenario Generator' && (
                <div className="space-y-2 mt-4">
                  <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20">
                    <p className="text-xs font-medium mb-1">Image File:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{test.imageFile ? test.imageFile.name : 'None'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-100/50 dark:bg-purple-900/20">
                    <p className="text-xs font-medium mb-1">Diagram Type:</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 capitalize">{test.diagramType}</p>
                  </div>
                  <div className="mt-2 text-purple-600 dark:text-purple-400 text-sm flex items-center justify-end">
                    <span>Click to view details</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              )}
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Generated: {test.timestamp}
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
                  Generate New Test
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
                {selectedChoice && (
                  <button
                    onClick={() => setSelectedChoice(null)}
                    className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                  >
                    Back
                  </button>
                )}
                <div className="ml-auto">
                  {!selectedChoice ? (
                    <button
                      onClick={handleCloseModal}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:text-gray-800 dark:hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      Create
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestGeneration;