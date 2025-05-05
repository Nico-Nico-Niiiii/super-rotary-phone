import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Play, 
  ArrowRight,
  X,
  FileSpreadsheet 
} from 'lucide-react';

const UserStories = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    storyName: '',
    excelFile: null
  });
  const [generatedStories, setGeneratedStories] = useState([]);

  const handleGenerateClick = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setFormData({
      storyName: '',
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
    // Create a new story object
    const newStory = {
      id: Date.now(),
      storyName: formData.storyName,
      excelFile: formData.excelFile,
      status: 'pending',
      timestamp: new Date().toLocaleString()
    };
    
    setGeneratedStories([newStory, ...generatedStories]);
    handleCloseModal();
  };

  const renderModalContent = () => {
    return (
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Create Project Requirements
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Project Name
            </label>
            <input
              type="text"
              name="storyName"
              value={formData.storyName}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800"
              placeholder="Enter a name for your project"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Upload User Story (Excel/CSV File)
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
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Requirements Generator</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              AI-powered functional & technical requirements generation for agile development
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
              onClick={handleGenerateClick}
              className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <Play size={16} />
              Generate requirements
            </button>
          </div>
        </div>
      </div>

      {/* Generated Stories Grid */}
      {generatedStories.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {generatedStories.map((story) => (
            <div 
              key={story.id} 
              className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/10 rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                navigate('/dashboard/use-cases/user-stories/details', { 
                  state: { storyData: story } 
                });
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <FileText size={20} className="text-green-500" />
                    <span className="text-sm font-medium text-green-500 bg-green-100 dark:bg-green-900/50 px-2 py-0.5 rounded">
                      User Story
                    </span>
                  </div>
                </div>
                <span className="text-xs font-medium px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">
                  {story.status}
                </span>
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{story.storyName}</h3>
              
              <div className="mt-2 space-y-2">
                <div className="p-3 rounded-lg bg-green-100/50 dark:bg-green-900/20">
                  <p className="text-xs font-medium mb-1">Excel/CSV File:</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{story.excelFile ? story.excelFile.name : 'None'}</p>
                </div>
                
                <div className="mt-2 text-green-600 dark:text-green-400 text-sm flex items-center justify-end">
                  <span>Click to view details</span>
                  <ArrowRight size={16} className="ml-1" />
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Created: {story.timestamp}
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
                  Create Requirements
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
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
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

export default UserStories;