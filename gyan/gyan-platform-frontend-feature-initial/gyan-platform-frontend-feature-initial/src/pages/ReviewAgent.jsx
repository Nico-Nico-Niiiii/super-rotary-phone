import { useState, useRef } from 'react';
import { 
  Upload, 
  FileUp, 
  Code, 
  CheckCircle, 
  X,
  Edit,
  Save,
  Download,
  RefreshCw,
  FileText,
  Info
} from 'lucide-react';

const ReviewAgent = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [styleGuidelineFile, setStyleGuidelineFile] = useState(null);
  const [styleGuidelineName, setStyleGuidelineName] = useState('');
  const [styleGuidelineContent, setStyleGuidelineContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStyleGuidelineLoading, setIsStyleGuidelineLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);
  const [reviewComments, setReviewComments] = useState([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const [showGuidelinesModal, setShowGuidelinesModal] = useState(false);
  const fileInputRef = useRef(null);
  const styleGuidelineInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  const languageOptions = [
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'c', label: 'C', extension: '.c' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'python', label: 'Python', extension: '.py' },
  ];

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const validateFileExtension = (filename, language) => {
    const selectedOption = languageOptions.find(option => option.value === language);
    if (!selectedOption) return false;
    
    return filename.toLowerCase().endsWith(selectedOption.extension);
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!validateFileExtension(file.name, selectedLanguage)) {
      alert(`Please upload a valid ${selectedLanguage.toUpperCase()} file with extension ${languageOptions.find(l => l.value === selectedLanguage).extension}`);
      return;
    }

    setIsLoading(true);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setFileContent(e.target.result);
      setIsLoading(false);
    };
    reader.onerror = () => {
      alert("Error reading file");
      setIsLoading(false);
    };
    reader.readAsText(file);
  };

  const handleStyleGuidelineUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setIsStyleGuidelineLoading(true);
    setStyleGuidelineFile(file);
    setStyleGuidelineName(file.name);

    const reader = new FileReader();
    reader.onload = (e) => {
      setStyleGuidelineContent(e.target.result);
      setIsStyleGuidelineLoading(false);
    };
    reader.onerror = () => {
      alert("Error reading style guideline file");
      setIsStyleGuidelineLoading(false);
    };
    reader.readAsText(file);
  };

  const handleReviewCode = async () => {
    if (!fileContent) {
      alert("Please upload a source code file first");
      return;
    }

    if (!styleGuidelineContent) {
      alert("Please upload a style guidelines file first");
      return;
    }

    setIsReviewLoading(true);

    try {
      const formData = new FormData();

      // Create File objects from the string content
      const codeFile = new File([fileContent], fileName);
      const styleGuideFile = new File([styleGuidelineContent], styleGuidelineName || "style_guide.txt");

      formData.append("code", codeFile);
      formData.append("specialization", selectedLanguage);
      formData.append("style_guide", styleGuideFile);

      for (let pair of formData.entries()) {
        console.log(`FormData contains: ${pair[0]}: ${pair[1]}`);
      }

      const response = await fetch(`${API_BASE_URL}/review_agent/generate`, {
        method: "POST", 
        body: formData
      });

      if (!response.ok){
        throw new Error(`Failed to fetch review: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Recd Data - ", data)
      
      setReviewComments(data);
    } 
    
    catch (error) {
      alert("Error generating review comments");
    } 
    
    finally {
      setIsReviewLoading(false);
    }
  };

  const handleExportReview = () => {
    if (reviewComments.length === 0) {
      alert("No review comments to export");
      return;
    }

    let csvContent = "";
    
    // Add the coder rating
    if (reviewComments["Coder Rating"]) {
      csvContent += "Coder Rating\n";
      csvContent += `"${reviewComments["Coder Rating"].replace(/"/g, '""')}"\n\n`;
    }
    
    // Add the comparison section
    if (reviewComments["comparison"]) {
      csvContent += "Code Comparison\n";
      csvContent += `"${reviewComments["comparison"].replace(/"/g, '""')}"\n\n`;
    }
    
    // Add the revised code
    if (reviewComments["Revised code"]) {
      csvContent += "Revised Code\n";
      csvContent += `"${reviewComments["Revised code"].replace(/"/g, '""')}"\n`;
    }
    
    // If we have no content, show an error
    if (!csvContent) {
      alert("No valid data found for export");
      return;
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agentic-review-${fileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleLanguageChange = (e) => {
    setSelectedLanguage(e.target.value);
    // Reset file content and review when language changes
    setFileContent('');
    setFileName('');
    setReviewComments([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleGuidelinesModal = () => {
    setShowGuidelinesModal(!showGuidelinesModal);
  };

  const toggleEditGuidelines = () => {
    setIsEditingGuidelines(!isEditingGuidelines);
  };

  // const getSeverityColor = (severity) => {
  //   switch (severity) {
  //     case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
  //     case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
  //     case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
  //     case 'style': return 'text-purple-600 bg-purple-100 dark:bg-purple-900 dark:text-purple-200';
  //     default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200';
  //   }
  // };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Review Agent</h1>
      
      {/* Language Selection & File Upload */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-end gap-4">
          <div className="flex-1">
            <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Language
            </label>
            <select
              id="language-select"
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            >
              <option value="">Select a language</option>
              {languageOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Upload Source Code
            </label>
            <div className="flex items-center">
              <label 
                className={`flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!selectedLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Upload size={18} />
                <span>Choose File</span>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  disabled={!selectedLanguage}
                  onChange={handleFileUpload}
                />
              </label>
              {fileName && (
                <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                  {fileName}
                </span>
              )}
            </div>
          </div>
        </div>
        
        {/* Style Guidelines Upload */}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload Style Guidelines <span className="text-red-500">*</span>
            {styleGuidelineContent && (
              <button 
                onClick={toggleGuidelinesModal} 
                className="ml-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="View guidelines"
              >
                <Info size={16} className="text-primary-light" />
              </button>
            )}
          </label>
          <div className="flex items-center">
            <label className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <FileText size={18} />
              <span>Choose Style Guidelines</span>
              <input
                type="file"
                ref={styleGuidelineInputRef}
                className="hidden"
                onChange={handleStyleGuidelineUpload}
                required
              />
            </label>
            {styleGuidelineName && (
              <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
                {styleGuidelineName}
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Upload a text file containing style guidelines to check against. This is required for code review.
          </p>
        </div>
      </div>
      
      {/* Code Editor and Review Section */}
      {fileContent && (
        <div className="flex flex-col gap-6 flex-1">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Source Code Editor */}
            <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center">
                  <Code size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Source Code: {fileName}</span>
                </div>
                <div className="flex items-center">
                  <button 
                    onClick={toggleGuidelinesModal} 
                    className="mr-2 p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    title="View guidelines"
                  >
                    <Info size={16} className="text-primary-light" />
                  </button>
                  <button 
                    onClick={toggleEditMode}
                    className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {isEditing ? (
                      <>
                        <Save size={14} />
                        <span>Save</span>
                      </>
                    ) : (
                      <>
                        <Edit size={14} />
                        <span>Edit</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <div className="flex-1 p-0 relative">
                <textarea
                  value={fileContent}
                  onChange={(e) => setFileContent(e.target.value)}
                  readOnly={!isEditing}
                  className="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border-0 focus:ring-0 resize-none overflow-auto"
                  style={{ 
                    minHeight: "400px",
                    lineHeight: "1.5",
                    tabSize: "2"
                  }}
                />
              </div>
              <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleReviewCode}
                  disabled={isReviewLoading || !styleGuidelineContent}
                  className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isReviewLoading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Analyzing Code...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={14} />
                      <span>Review Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            
            {/* Review Comments */}
            <div className="w-full lg:w-1/2 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
              <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center">
                  <CheckCircle size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Review Comments</span>
                </div>
                <button
                  onClick={handleExportReview}
                  disabled={reviewComments.length === 0}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Download size={14} />
                  <span>Export</span>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto" style={{ minHeight: "400px" }}>

                {/* {reviewComments.length > 0 ? (
                  <div className="space-y-3">
                    {reviewComments.map((comment, index) => (
                      <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                        <div className="flex justify-between items-start">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Line {comment.line}
                          </span>
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(comment.severity)}`}>
                            {comment.severity.charAt(0).toUpperCase() + comment.severity.slice(1)}
                          </span>
                        </div>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                          {comment.message}
                        </p>
                      </div>
                    ))}
                  </div> */}

                  {Object.keys(reviewComments).length > 0 ? (
                  <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
                    {Object.entries(reviewComments).map(([key, value]) => (
                      <div key={key} className="border border-green-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                          <FileText size={16} className="text-blue-600 mr-2" />
                          {key.replace(/_/g, " ")} {/* Format the key for better readability */}
                        </h3>
                        <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                          {value} {/* Display the content of each key */}
                        </div>
                      </div>
                    ))}

                  </div>
              
            
              
              ) : (
                  isReviewLoading ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-light"></div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                      <CheckCircle size={40} className="mb-4 opacity-30" />
                      <p>Click "Review Code" to analyze your code</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Guidelines Modal */}
      {showGuidelinesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-3xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center">
                <FileText size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-lg font-medium text-gray-700 dark:text-gray-300">
                  Style Guidelines: {styleGuidelineName}
                </span>
              </div>
              <div className="flex items-center">
                <button 
                  onClick={toggleEditGuidelines}
                  className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors mr-2"
                >
                  {isEditingGuidelines ? (
                    <>
                      <Save size={14} />
                      <span>Save</span>
                    </>
                  ) : (
                    <>
                      <Edit size={14} />
                      <span>Edit</span>
                    </>
                  )}
                </button>
                <button 
                  onClick={toggleGuidelinesModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-0">
              <textarea
                value={styleGuidelineContent}
                onChange={(e) => setStyleGuidelineContent(e.target.value)}
                readOnly={!isEditingGuidelines}
                className="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border-0 focus:ring-0 resize-none"
                style={{ 
                  minHeight: "400px",
                  lineHeight: "1.5",
                  tabSize: "2"
                }}
              />
            </div>
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end">
              <button
                onClick={toggleGuidelinesModal}
                className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Empty State - No Files Selected */}
      {!fileContent && !isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <FileUp size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No Files Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Select a programming language, then upload both your source code file and style guidelines file to begin the review process.
          </p>
        </div>
      )}
      
      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
        </div>
      )}
    </div>
  );
};

export default ReviewAgent;
