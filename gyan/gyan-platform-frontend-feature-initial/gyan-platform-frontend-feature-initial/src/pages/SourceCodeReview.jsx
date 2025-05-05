// import { useState, useRef } from 'react';
// import { 
//   Upload, 
//   FileUp, 
//   Code, 
//   CheckCircle, 
//   X,
//   Edit,
//   Save,
//   Download,
//   RefreshCw
// } from 'lucide-react';

// const SourceCodeReview = () => {
//   const [selectedLanguage, setSelectedLanguage] = useState('');
//   const [fileName, setFileName] = useState('');
//   const [fileContent, setFileContent] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const [isEditing, setIsEditing] = useState(false);
//   const [reviewComments, setReviewComments] = useState([]);
//   const [isReviewLoading, setIsReviewLoading] = useState(false);
//   const fileInputRef = useRef(null);

//   const languageOptions = [
//     { value: 'java', label: 'Java', extension: '.java' },
//     { value: 'c', label: 'C', extension: '.c' },
//     { value: 'cpp', label: 'C++', extension: '.cpp' },
//     { value: 'python', label: 'Python', extension: '.py' }
//   ];

//   const validateFileExtension = (filename, language) => {
//     const selectedOption = languageOptions.find(option => option.value === language);
//     if (!selectedOption) return false;
    
//     return filename.toLowerCase().endsWith(selectedOption.extension);
//   };

//   const handleFileUpload = (event) => {
//     const file = event.target.files[0];
//     if (!file) return;

//     if (!validateFileExtension(file.name, selectedLanguage)) {
//       alert(`Please upload a valid ${selectedLanguage.toUpperCase()} file with extension ${languageOptions.find(l => l.value === selectedLanguage).extension}`);
//       return;
//     }

//     setIsLoading(true);
//     setFileName(file.name);

//     const reader = new FileReader();
//     reader.onload = (e) => {
//       setFileContent(e.target.result);
//       setIsLoading(false);
//     };
//     reader.onerror = () => {
//       alert("Error reading file");
//       setIsLoading(false);
//     };
//     reader.readAsText(file);
//   };

//   const handleReviewCode = async () => {
//     if (!fileContent) {
//       alert("Please upload a file first");
//       return;
//     }

//     setIsReviewLoading(true);
    
//     // Simulate API call for code review
//     try {
//       // Replace with actual API call to backend service
//       await new Promise(resolve => setTimeout(resolve, 2000));
      
//       // Mock response
//       const mockReviewComments = [
//         { line: 5, severity: 'critical', message: 'Potential null pointer dereference' },
//         { line: 12, severity: 'warning', message: 'Variable is never used' },
//         { line: 18, severity: 'info', message: 'Consider using a more descriptive variable name' },
//         { line: 25, severity: 'critical', message: 'Resource leak: File is not closed properly' },
//         { line: 30, severity: 'warning', message: 'Method is too complex (Cyclomatic complexity > 10)' },
//       ];
      
//       setReviewComments(mockReviewComments);
//     } catch (error) {
//       console.error("Error reviewing code:", error);
//       alert("Error generating review comments");
//     } finally {
//       setIsReviewLoading(false);
//     }
//   };

//   const handleExportReview = () => {
//     if (reviewComments.length === 0) {
//       alert("No review comments to export");
//       return;
//     }

//     const reviewContent = reviewComments.map(comment => 
//       `Line ${comment.line} [${comment.severity.toUpperCase()}]: ${comment.message}`
//     ).join('\n');

//     const blob = new Blob([reviewContent], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `review-${fileName}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   const handleLanguageChange = (e) => {
//     setSelectedLanguage(e.target.value);
//     // Reset file content and review when language changes
//     setFileContent('');
//     setFileName('');
//     setReviewComments([]);
//     if (fileInputRef.current) {
//       fileInputRef.current.value = '';
//     }
//   };

//   const toggleEditMode = () => {
//     setIsEditing(!isEditing);
//   };

//   const getSeverityColor = (severity) => {
//     switch (severity) {
//       case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
//       case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
//       case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
//       default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200';
//     }
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Source Code Review</h1>
      
//       {/* Language Selection & File Upload */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
//         <div className="flex flex-col md:flex-row md:items-end gap-4">
//           <div className="flex-1">
//             <label htmlFor="language-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Select Language
//             </label>
//             <select
//               id="language-select"
//               value={selectedLanguage}
//               onChange={handleLanguageChange}
//               className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//             >
//               <option value="">Select a language</option>
//               {languageOptions.map(option => (
//                 <option key={option.value} value={option.value}>{option.label}</option>
//               ))}
//             </select>
//           </div>
          
//           <div className="flex-1">
//             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//               Upload Source Code
//             </label>
//             <div className="flex items-center">
//               <label 
//                 className={`flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${!selectedLanguage ? 'opacity-50 cursor-not-allowed' : ''}`}
//               >
//                 <Upload size={18} />
//                 <span>Choose File</span>
//                 <input
//                   type="file"
//                   ref={fileInputRef}
//                   className="hidden"
//                   disabled={!selectedLanguage}
//                   onChange={handleFileUpload}
//                 />
//               </label>
//               {fileName && (
//                 <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">
//                   {fileName}
//                 </span>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
      
//       {/* Code Editor and Review Section */}
//       {fileContent && (
//         <div className="flex flex-col lg:flex-row gap-6 flex-1">
//           {/* Code Editor */}
//           <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
//             <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
//               <div className="flex items-center">
//                 <Code size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
//               </div>
//               <button 
//                 onClick={toggleEditMode}
//                 className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
//               >
//                 {isEditing ? (
//                   <>
//                     <Save size={14} />
//                     <span>Save</span>
//                   </>
//                 ) : (
//                   <>
//                     <Edit size={14} />
//                     <span>Edit</span>
//                   </>
//                 )}
//               </button>
//             </div>
//             <div className="flex-1 p-0 relative">
//               <textarea
//                 value={fileContent}
//                 onChange={(e) => setFileContent(e.target.value)}
//                 readOnly={!isEditing}
//                 className="w-full h-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 border-0 focus:ring-0 resize-none overflow-auto"
//                 style={{ 
//                   minHeight: "400px",
//                   lineHeight: "1.5",
//                   tabSize: "2"
//                 }}
//               />
//             </div>
//             <div className="p-4 border-t border-gray-200 dark:border-gray-700">
//               <button
//                 onClick={handleReviewCode}
//                 disabled={isReviewLoading}
//                 className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 {isReviewLoading ? (
//                   <>
//                     <RefreshCw size={18} className="animate-spin" />
//                     <span>Generating Review...</span>
//                   </>
//                 ) : (
//                   <>
//                     <CheckCircle size={18} />
//                     <span>Fetch Review Comments</span>
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
          
//           {/* Review Comments */}
//           <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
//             <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
//               <div className="flex items-center">
//                 <CheckCircle size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
//                 <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Review Comments</span>
//               </div>
//               <button
//                 onClick={handleExportReview}
//                 disabled={reviewComments.length === 0}
//                 className="flex items-center gap-1 text-sm px-3 py-1.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//               >
//                 <Download size={14} />
//                 <span>Export</span>
//               </button>
//             </div>
//             <div className="flex-1 p-4 overflow-auto" style={{ minHeight: "400px" }}>
//               {reviewComments.length > 0 ? (
//                 <div className="space-y-3">
//                   {reviewComments.map((comment, index) => (
//                     <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
//                       <div className="flex justify-between items-start">
//                         <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
//                           Line {comment.line}
//                         </span>
//                         <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getSeverityColor(comment.severity)}`}>
//                           {comment.severity.charAt(0).toUpperCase() + comment.severity.slice(1)}
//                         </span>
//                       </div>
//                       <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
//                         {comment.message}
//                       </p>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 isReviewLoading ? (
//                   <div className="flex items-center justify-center h-full">
//                     <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-light"></div>
//                   </div>
//                 ) : (
//                   <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
//                     <CheckCircle size={40} className="mb-4 opacity-30" />
//                     <p>Click "Fetch Review Comments" to analyze your code</p>
//                   </div>
//                 )
//               )}
//             </div>
//           </div>
//         </div>
//       )}
      
//       {/* Empty State - No File Selected */}
//       {!fileContent && !isLoading && (
//         <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <FileUp size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
//           <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
//             No Source Code File Selected
//           </h3>
//           <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
//             Select a programming language and upload your source code file to review it for potential issues and best practices.
//           </p>
//         </div>
//       )}
      
//       {/* Loading State */}
//       {isLoading && (
//         <div className="flex items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default SourceCodeReview;

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
  RefreshCw
} from 'lucide-react';

const SourceCodeReview = () => {
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [reviewComments, setReviewComments] = useState([]);
  const [isReviewLoading, setIsReviewLoading] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  const languageOptions = [
    { value: 'java', label: 'Java', extension: '.java' },
    { value: 'c', label: 'C', extension: '.c' },
    { value: 'cpp', label: 'C++', extension: '.cpp' },
    { value: 'python', label: 'Python', extension: '.py' }
  ];

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

  const handleReviewCode = async () => {
    if (!fileContent) {
      alert("Please upload a file first");
      return;
    }

    setIsReviewLoading(true);
    
    // Simulate API call for code review
    try {
      const response = await fetch(`${API_BASE_URL}/code_review/generate`, { 
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source_code: fileContent,
          language: selectedLanguage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch review");
      }
  
      const data = await response.json();
      console.log("Recd Data - ", data)
      setReviewComments(data.review || "No review available");
      
    } catch (error) {
      console.error("Error reviewing code:", error);
      alert("Error generating review comments");
    } finally {
      setIsReviewLoading(false);
    }
  };

  const handleExportReview = () => {
    if (reviewComments.length === 0) {
      alert("No review comments to export");
      return;
    }

    const reviewContent = reviewComments.map(comment => 
      `Line ${comment.line} [${comment.severity.toUpperCase()}]: ${comment.message}`
    ).join('\n');

    const blob = new Blob([reviewContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `review-${fileName}.txt`;
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

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100 dark:bg-red-900 dark:text-red-200';
      case 'warning': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900 dark:text-yellow-200';
      case 'info': return 'text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Source Code Review</h1>
      
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
      </div>
      
      {/* Code Editor and Review Section */}
      {fileContent && (
        <div className="flex flex-col lg:flex-row gap-6 flex-1">
          {/* Code Editor */}
          <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
            <div className="flex justify-between items-center border-b border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center">
                <Code size={18} className="text-gray-500 dark:text-gray-400 mr-2" />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{fileName}</span>
              </div>
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
                disabled={isReviewLoading}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isReviewLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Generating Review...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    <span>Fetch Review Comments</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Review Comments */}
          {/* <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col">
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
            
            <div className="w-full max-w-[600px] lg:w-2/5 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col max-h-[500px] flex-shrink-0"> */}
              {/* Scrollable Content */}
              {/* <div className="flex-1 p-4 overflow-y-auto">
                {reviewComments.length > 0 ? (
                  <div className="p-3 text-gray-700 dark:text-gray-300 space-y-2">
                    {reviewComments.split("\n").map((line, index) => (
                      <p key={index} className="mb-1">{line}</p>
                    ))}
                  </div>
                ) : isReviewLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-light"></div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                    <CheckCircle size={40} className="mb-4 opacity-30" />
                    <p>Click "Fetch Review Comments" to analyze your code</p>
                  </div>
                )}
              </div>
            </div>
          </div> */}

          <div className="w-full lg:w-2/5 bg-white dark:bg-gray-800 rounded-xl shadow-sm flex flex-col max-h-[550px]">
            {/* Header */}
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

            {/* Scrollable Content */}
            <div className="flex-1 p-4 overflow-y-auto">
              {reviewComments.length > 0 ? (
                <div className="p-3 text-gray-700 dark:text-gray-300 space-y-2">
                  {reviewComments.split("\n").map((line, index) => (
                    <p key={index} className="mb-1">{line}</p>
                  ))}
                </div>
              ) : isReviewLoading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-light"></div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                  <CheckCircle size={40} className="mb-4 opacity-30" />
                  <p>Click "Fetch Review Comments" to analyze your code</p>
                </div>
              )}
            </div>
          </div>

        </div>
      )}
      
      {/* Empty State - No File Selected */}
      {!fileContent && !isLoading && (
        <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <FileUp size={48} className="text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">
            No Source Code File Selected
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center max-w-md">
            Select a programming language and upload your source code file to review it for potential issues and best practices.
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

export default SourceCodeReview;