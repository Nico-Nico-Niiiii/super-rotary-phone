import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import AceEditor from 'react-ace';
import { 
  ChevronRight,
  FileCode,
  File,
  PanelLeftClose,
  PanelLeft,
  Play,
  Edit,
  CheckCircle2,
  XCircle,
  X,
  Loader2,
  Info
} from 'lucide-react';

// Import Ace Editor themes and language modes
import 'ace-builds/src-noconflict/mode-java';
import 'ace-builds/src-noconflict/mode-python';
import 'ace-builds/src-noconflict/mode-golang';
import 'ace-builds/src-noconflict/mode-c_cpp';
import 'ace-builds/src-noconflict/theme-monokai';
import 'ace-builds/src-noconflict/theme-github';

const LoadingOverlay = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
    <div className="flex flex-col items-center space-y-4">
      <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      <p className="text-white text-sm font-medium">Generating...</p>
    </div>
  </div>
);

const AutomationDetails = () => {
  const API_BASE_URL = "http://gyan.capgemini.com:8000"

  const location = useLocation();
  const { workflow } = location.state || {};
  const { isDark } = useTheme();
  const [activeFile, setActiveFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [files, setFiles] = useState([]);
  const [isFilesOpen, setIsFilesOpen] = useState(true);
  const [coverageData, setCoverageData] = useState('');
  const [storedData, setStoredData] = useState(null);
  const [storedTests, setStoredTests] = useState(null);
  const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
  const [isRunningCoverage, setIsRunningCoverage] = useState(false);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);
  const [testContent, setTestContent] = useState('');
  const [testStatus, setTestStatus] = useState(null);
  const [isEditable, setIsEditable] = useState(false);
  const [showGenerateButton, setShowGenerateButton] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptOptions, setPromptOptions] = useState([]);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [coverageUrl, setCoverageUrl] = useState('');
  const [errorLogs, setErrorLogs] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [isEditAfterBuild, setIsEditAfterBuild] = useState(false);

  const [htmlFilePath, setHtmlFilePath] = useState(null);
  const [isHtmlViewerOpen, setIsHtmlViewerOpen] = useState(false);

  // Variables for Prompt Library Dropdown
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [modalPromptText, setModalPromptText] = useState('');
  const [tempSelectedPrompt, setTempSelectedPrompt] = useState(null);
  const [selectedPromptText, setSelectedPromptText] = useState(null);

  // Variables for FileExplorer & TestCases mapping
  const [selectedFile, setSelectedFile] = useState(null);
  const [inputContent, setInputContent] = useState(""); // Stores input editor content
  const [testCases, setTestCases] = useState({});
  const [testCasesMap, setTestCasesMap] = useState({});
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // Responsive state
  const [isMobileView, setIsMobileView] = useState(false);
  const [activePanel, setActivePanel] = useState('source'); // 'source' or 'test'

  // Add responsive behavior detection
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    
    // Check on initial load
    checkScreenSize();
    
    // Set up listener for window resize
    window.addEventListener('resize', checkScreenSize);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    if (workflow) {
      console.log(workflow)
      if (workflow.fileStructure && workflow.fileStructure.length > 0) {
        // Handle ZIP folder scenario
        console.log("Setting files from ZIP:", workflow.fileStructure);
        setFiles(workflow.fileStructure);
        
        // Automatically select the first file if available
        const firstFile = workflow.fileStructure[0];
        if (firstFile) {
          setActiveFile(firstFile);
          setSelectedFile(firstFile.name); // Set the selected file for test case mapping
          setFileContent(firstFile.content || "");
        }
      }
      else if (workflow.file) {
        setFiles(workflow.fileStructure || []);
        if (workflow.fileContent) {
          const fileName = workflow.fileName || workflow.fileStructure?.[0]?.name || 'Untitled';
          setActiveFile({
            name: fileName,
            content: workflow.fileContent
          });
          setSelectedFile(fileName); // Set the selected file for test case mapping
          setFileContent(workflow.fileContent);
        }
      }
    }
  }, [workflow]);

  // Add effect to update test content when selectedFile changes
  useEffect(() => {
    if (selectedFile && testCasesMap[selectedFile]) {
      setTestContent(testCasesMap[selectedFile]);
    }
  }, [selectedFile, testCasesMap]);

  const getEditorMode = (fileName) => {
    const extension = fileName?.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'java': return 'java';
      case 'py': return 'python';
      case 'go': return 'golang';
      case 'c': return 'c_cpp';
      default: return 'java';
    }
  };

  const fetchPromptLibrary = async () => {
    try {
      const language = workflow?.language || "java"; // Default to Java if not provided
      const type = workflow?.sourceType || "file";
      console.log("Language :", language);
      console.log("Type :", type);
      const response = await fetch(`${API_BASE_URL}/automation/${language}/prompt_name`); // Update API URL
      if (!response.ok) throw new Error("Failed to fetch prompts");
      
      const data = await response.json();
      console.log("Prompts:", data)

      setPromptOptions(data.prompt || []); // Assuming API returns { prompts: [...] }
      setShowDropdown(true);
    } catch (error) {
      console.error("Error fetching prompt library:", error);
    }
  };

  const handlePromptSelection = (e) => {
    const selectedValue = e.target.value;
    if (!selectedValue) return;

    const selectedPrompt = promptOptions.find(
      (prompt) => prompt.prompt_description === selectedValue
    );

    if (selectedPrompt){
      setModalPromptText(selectedPrompt.prompt_text);
      setTempSelectedPrompt(selectedValue);
      setIsPromptModalOpen(true);
    }
  };

  const handleAddPrompt = () => {
    if (tempSelectedPrompt){
      const selected = promptOptions.find(p => p.prompt_description === tempSelectedPrompt);
      if (selected) {
        setSelectedPrompt(selected.prompt_description);
        setSelectedPromptText(selected.prompt_text);
      }
    }
    setIsPromptModalOpen(false);
  };

  const handleCancelPrompt = () => {
    setSelectedPrompt(null);
    setIsPromptModalOpen(false);
  };

  const generateTestCase = async () => {
    setIsGenerating(true);
    setIsEditAfterBuild(false);
  
    const language = workflow?.language || "java"; // Default to Java if not provided
    const type = workflow?.sourceType || "file";

    let filesToSend = [];

    if (workflow?.fileStructure && workflow.fileStructure.length > 0){
      // ✅ If multiple files exist, send all files
      filesToSend = workflow.fileStructure.map(file => ({
        name: file.name,
        content: file.content
      }));
    }
    else{
      filesToSend = [{ 
        name: workflow?.fileName || "unknown.txt", 
        content: fileContent 
      }];
    }
    
    const requestBody = {
      input: filesToSend,
      prompt: selectedPrompt || ".", 
      prompt_text: selectedPromptText || ".",
    };

    // ENDPOINT FOR GENERATION
    const apiUrl = `${API_BASE_URL}/automation/${language}/generate_from_${type}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({requestBody}),
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate test cases");
      }
  
      const data = await response.json();
      console.log("Test cases - ", data);

      // Handle different response formats based on file type
      if (data.files) {
        // Single file response format
        const testCaseMap = {};
        data.files.forEach(file => {
          testCaseMap[file.name] = file.content;
        });
        setTestCasesMap(testCaseMap);
        setTestContent(testCaseMap[data.files[0].name] || "No test cases found.");
      }
      else if (data.ZipCodes && typeof data.ZipCodes === "object") {
        // Zip file response format
        const testCaseMap = {};
        
        // Extract test cases from the response
        Object.keys(data.ZipCodes).forEach(fileName => {
          const content = data.ZipCodes[fileName]?.testcase || "No test cases found.";
          testCaseMap[fileName] = content;
        });
        
        setTestCasesMap(testCaseMap);
        
        // Show test cases for currently selected file
        if (selectedFile && testCaseMap[selectedFile]) {
          setTestContent(testCaseMap[selectedFile]);
        } else {
          // If selectedFile doesn't have test cases, use the first available file
          const firstFileName = Object.keys(testCaseMap)[0];
          if (firstFileName) {
            setTestContent(testCaseMap[firstFileName]);
          } else {
            setTestContent("No test cases found.");
          }
        }
      }
      else if (data.Code) {
        // Direct code response
        setTestContent(data.Code || "No test cases found.");
        
        // Create a mapping with the single file
        if (selectedFile) {
          setTestCasesMap({ [selectedFile]: data.Code });
        }
      }
      
      setShowGenerateButton(false);
      setIsEditable(true); // Make the editor editable after initial generation
      
      // If on mobile, switch to test panel view after generation
      if (isMobileView) {
        setActivePanel('test');
      }
    } catch (error) {
      console.error("Error generating test cases:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditorChange = (newContent) => {
    if (!isEditable) return; // Only update content if the editor is editable
    
    setTestContent(newContent); // Ensure state updates with the latest content
    
    // If we have a selected file, update its test case in the map
    if (selectedFile) {
      setTestCasesMap(prev => ({
        ...prev,
        [selectedFile]: newContent
      }));
    }
  };


  const handleRunClick = async () => {
    if (!Object.values(testCasesMap).some(content => content.trim())) {
      alert("No test cases available to run!");
      return;
    }
    
    setIsRunningCoverage(true);
    
    const language = workflow?.language || "java";
    const type = workflow?.sourceType || "file";
    
    let filesToSend = [];
    
    if (workflow?.fileStructure && workflow.fileStructure.length > 0) {
      // Send all files
      filesToSend = workflow.fileStructure.map(file => ({
        name: file.name,
        content: file.content
      }));
    } else {
      filesToSend = [{
        name: workflow?.fileName || "unknown.txt",
        content: fileContent
      }];
    }
    
    // Filter test cases to only include files that are present in input
    let testToSend = {};
    filesToSend.forEach(file => {
      if (testCasesMap[file.name]) {
        testToSend[file.name] = testCasesMap[file.name];
      }
    });
    
    const requestBody = {
      input: filesToSend,
      test_code: testToSend
    };
    
    console.log("Request body for build case:", requestBody);
    
    const apiUrl = `${API_BASE_URL}/automation/${language}/build_from_${type}`;
    
    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestBody }),
      });
      
      if (!response.ok) {
        throw new Error("Failed to generate coverage report");
      }
      
      const data = await response.json();
      console.log("Coverage Report -", data);
      
      // Store the full report data
      setStoredData(data.Report);
      setStoredTests(data.Test);
      
      // Check if there's an error in the report
      const hasError = data.Report && data.Report.error;
      
      if (hasError) {
        setTestStatus('failed');
        // Store error information
        setErrorLogs(data.Report);
        // Set to read-only when a build fails (Edit button will appear)
        setIsEditable(false);
      } else {
        if (data.coverage_url) {
          setCoverageUrl(data.coverage_url);
        }
        setCoverageData(data);
        setTestStatus('success');
        setIsEditAfterBuild(false);
        setShowGenerateButton(false);
        setIsEditable(false); // Ensure test editor is read-only after successful build
      }
    } catch (error) {
      console.error("Error running coverage report:", error);
      setTestStatus('failed');
      setErrorLogs({ error: error.message });
      // Set to read-only when there's an error (Edit button will appear)
      setIsEditable(false);
    } finally {
      setIsRunningCoverage(false);
    }
  };

  const handleEdit = () => {
    setIsEditable(true); // Make the test editor editable
    setTestStatus(null);
    setShowGenerateButton(true);
    setIsEditAfterBuild(true);
  };

  const handleClick = async () => {
    setIsGenerating(true); // Show "Generating..."
    
    try {
      if (isEditAfterBuild) {
        await handleRunClick();
        // Ensure the editor is read-only after clicking build
        setIsEditable(false);
      } else {
        await generateTestCase();
      }
    } finally {
      setIsGenerating(false); // Reset once the results are received
    }
  };

  // Handle file selection for both source and test views
  const handleFileSelection = (file) => {
    setActiveFile(file);
    setSelectedFile(file.name);
    setFileContent(file.content || "");
    
    // Update test content for the selected file
    if (testCasesMap[file.name]) {
      setTestContent(testCasesMap[file.name]);
    } else {
      setTestContent(""); // Clear test content if no test case exists for this file
    }
  };

  const handleOptionClick = async (option) => {
    const language = workflow?.language || "java"; 
    const type = workflow?.sourceType || "file";
    console.log("Language for download", language)
    console.log("Type for language", type)
    
    const apiUrl = `${API_BASE_URL}/automation/${language}/download_${option}_for_${type}`;
    console.log("Stored data is :", storedData)
    console.log("Stored test case path is :", storedTests)
    try {
      const response = await fetch(apiUrl, {    
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          folder_path: storedData,
          stored_tests: storedTests
         }),
      });
  
      if (!response.ok) {
        throw new Error("Failed to get data");
      }

 
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
  
      // Extract filename from Content-Disposition
      let fileName = option;  // Default filename
      const contentDisposition = response.headers.get("Content-Disposition");
  
      if (contentDisposition) {
        const match = contentDisposition.match(/filename="?([^";]+)"?/);
        if (match) fileName = match[1];
      }
  
      console.log("Filename received", fileName)

      if (!fileName.includes(".")) {
        const contentType = response.headers.get("Content-Type");
        if (contentType === "application/zip") {
          fileName += ".zip";
        } else {
          fileName += ".html"; // Default to HTML if no extension is present
        }
      }
  
      console.log("Final filename:", fileName);
  
      // Download the file with the correct name
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;  
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error fetching file:", error);
    }
    setIsDropdownOpen(false);
  }
    
  // Panel switcher for mobile view
  const PanelSwitcher = () => (
    <div className="flex w-full border-b border-gray-700 md:hidden">
      <button
        onClick={() => setActivePanel('source')}
        className={`flex-1 py-2 text-sm font-medium ${
          activePanel === 'source' 
            ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-700') 
            : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
        }`}
      >
        Source
      </button>
      <button
        onClick={() => setActivePanel('test')}
        className={`flex-1 py-2 text-sm font-medium ${
          activePanel === 'test' 
            ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-700') 
            : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
        }`}
      >
        Test
      </button>
    </div>
  );

  const TestActionButtons = () => {
    // Get the current language from workflow
    const currentLanguage = workflow?.language || "java";
    
    // Check if the Add Prompt Library button should be shown
    // Only show for 'go' and 'c' languages
    const shouldShowPromptLibrary = currentLanguage === 'go' || currentLanguage === 'c';
  
    return (
      <div className="flex items-center gap-3 flex-wrap">
        {/* Only show the Add Prompt Library button for GO and C languages */}
        {shouldShowPromptLibrary && !showDropdown && (
          <button
            onClick={fetchPromptLibrary}
            className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
          >
            Add Prompt Library
          </button>
        )}
        
        {/* Only show the dropdown if the button was clicked and the language is supported */}
        {shouldShowPromptLibrary && showDropdown && (
          <select
            className="px-2 py-1 border border-gray-300 rounded-md text-xs"
            value={selectedPrompt || ""}
            onChange={handlePromptSelection}
          >
            <option value="">Select a prompt</option>
            {promptOptions.map((prompt, index) => (
              <option
                key={index} 
                value={prompt.prompt_description}
              >
                {prompt.prompt_description}
              </option>
            ))}
          </select>
        )}
  
        {/* Modal for Prompt Preview */}
        {isPromptModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg w-full max-w-[600px] mx-4 max-h-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Prompt Preview
              </h3>
              <button onClick={handleCancelPrompt} className="text-gray-500 hover:text-gray-700">
                <X size={20} />
              </button>
            </div>
  
            <div className="max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700">
              <p className="text-sm text-gray-700 dark:text-gray-300">{modalPromptText}</p>
            </div>
  
            <div className="mt-4 flex justify-end space-x-2">
              <button
                onClick={handleCancelPrompt}
                className="px-3 py-1.5 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleAddPrompt}
                className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
              >
                Add Prompt
              </button>
            </div>
          </div>
        </div>
      )}
  
      {showGenerateButton && (
        <button
          onClick={handleClick}
          className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 
                  transition-colors duration-200 flex items-center gap-2"
          disabled={isGenerating || (isEditAfterBuild && isRunningCoverage)}
        >
          {isGenerating ? (
            <Loader2 size={14} className="animate-spin" />
          ) : isEditAfterBuild ? (
            <Play size={14} />
          ) : (
            <FileCode size={14} />
          )}
          <span>{isGenerating ? "Generating..." : isEditAfterBuild ? "Build" : "Generate"}</span>
        </button>
      )}
  
        
      {testContent && !showGenerateButton && !testStatus && (
        <>
          <button
            onClick={handleRunClick}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 
              transition-colors duration-200 flex items-center gap-2"
          >
            <Play size={14} />
            <span>
              {isRunningCoverage ? "Running..." : "Build"}
            </span>
          </button>
          
          {/* Add Edit button when content is available but not yet built */}
          {!isEditable && (
            <button
              onClick={handleEdit}
              className="px-3 py-1.5 bg-gray-500 text-white rounded-md text-xs font-medium hover:bg-gray-600
                transition-colors duration-200 flex items-center gap-2"
            >
              <Edit size={14} />
              <span>Edit</span>
            </button>
          )}
        </>
      )}
  
      {showErrorModal && errorLogs && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Error Details</h3>
              <button 
                onClick={() => setShowErrorModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            {errorLogs.error && (
              <div className="mb-4">
                <h4 className="font-medium text-black mb-1">Error:</h4>
                <div className="bg-red-50 p-3 rounded text-red-700">{errorLogs.error}</div>
              </div>
            )}
            
            {errorLogs.stderr && (
              <div className="mb-4">
                <h4 className="font-medium text-black mb-1">Standard Error:</h4>
                <pre className="bg-gray-100 text-black p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
                  {errorLogs.stderr}
                </pre>
              </div>
            )}
            
            {errorLogs.stdout && (
              <div>
                <h4 className="font-medium text-black mb-1">Standard Output:</h4>
                <pre className="bg-gray-100 p-3 text-black rounded text-sm overflow-x-auto whitespace-pre-wrap">
                  {errorLogs.stdout}
                </pre>
              </div>
            )}
            
            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setShowErrorModal(false)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
  
  
      {testStatus === "success" && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 
              transition-colors duration-200 flex items-center gap-2"
          >
            <CheckCircle2 size={14} />
            <span>Download</span>
          </button>{isDropdownOpen && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 z-50">
              <ul className="py-1">
                {["coverage", "source"].map((option) => (
                  <li
                    key={option}
                    onClick={() => handleOptionClick(option)}
                    className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    {option}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
  
      {testStatus === 'failed' && (
        <div className="flex items-center gap-2">
          <button
            onClick={handleEdit}
            className="px-3 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600
              transition-colors duration-200 flex items-center gap-2"
          >
            <Edit size={14} />
            <span>Edit</span>
          </button>     
          <Info 
            size={18} 
            className="text-gray-700 dark:text-white hover:text-white-900 cursor-pointer" 
            onClick={() => setShowErrorModal(true)} 
            title="View Error Details" 
          />
        </div>
      )}
  
      {testStatus && (
        <div className="flex items-center gap-2">
          {testStatus === 'success' ? (
            <>
              <CheckCircle2 size={14} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-500">Passed</span>
            </>
          ) : (
            <>
              <XCircle size={14} className="text-red-500" />
              <span className="text-xs font-medium text-red-500">Failed</span>
            </>
          )}
        </div>
      )}
      </div>
    );
  };

  return (
    <div className={`h-[calc(100vh-4rem)] -m-8 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Panel switcher for mobile */}
      {isMobileView && <PanelSwitcher />}

      {/* Main content area - responsive flex layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* File Explorer - hide on mobile when closed */}
        <div className={`border-r ${isDark ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-white'} 
          transition-all duration-300 ease-in-out 
          ${isMobileView && !isExplorerOpen ? 'hidden' : ''}
          ${isExplorerOpen ? (isMobileView ? 'w-full absolute z-10 h-full' : 'w-64') : 'w-10'}`}><div className={`border-b h-11 flex items-center justify-between px-4 
            ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
            {isExplorerOpen && (
              <div className="flex items-center gap-2">
                <FileCode size={16} className="text-blue-400" />
                <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {workflow?.name || 'Untitled Workflow'}
                </span>
              </div>
            )}
            <button 
              onClick={() => {
                setIsExplorerOpen(!isExplorerOpen);
                // If we're closing the explorer on mobile, ensure we're back to the editor view
                if (isMobileView && isExplorerOpen) {
                  setActivePanel('source');
                }
              }}
              className={`${isDark ? 'text-white dark:bg-gray-700 focus:outline-none hover:text-white' : 'text-gray-600 hover:text-gray-900'} 
                p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0`}
            >
              {isExplorerOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
            </button>
          </div>
          
          {isExplorerOpen && (
            <div>
              <button 
                onClick={() => setIsFilesOpen(!isFilesOpen)}
                className={`flex items-center gap-1.5 p-2 w-full ${
                  isDark ? 'text-white dark:bg-gray-700 focus:outline-none hover:text-white' : 'text-gray-600 hover:text-gray-900'
                } transition-colors`}
              >
                <ChevronRight size={14} className={isFilesOpen ? "rotate-90" : ""} />
                <FileCode size={16} />
                <span className="text-sm">Files</span>
              </button>
              
              {isFilesOpen && files.map((file) => (
                <div
                  key={file.name}
                  className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${
                    activeFile?.name === file.name ? 
                      (isDark ? 'bg-gray-700' : 'bg-gray-100') :
                      (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
                  }`}
                  onClick={() => {
                    handleFileSelection(file);
                    // On mobile, close the explorer after selecting a file
                    if (isMobileView) {
                      setIsExplorerOpen(false);
                    }
                  }}
                >
                  <File size={14} className="text-blue-400" />
                  <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    {file.name}
                  </span>
                </div>
              ))}
            </div>
          )}
          </div>
          
          {/* Main Content - adapt to mobile vs desktop */}
          <div className={`flex-1 flex ${isMobileView ? 'flex-col' : 'flex-row'}`}>
            {/* Source Code View - conditionally show based on activePanel on mobile */}
            <div className={`${isMobileView ? (activePanel === 'source' ? 'flex flex-col flex-1' : 'hidden') : 'w-1/2 flex flex-col'}`}>
              <div className={`h-11 px-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} 
                border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <File size={16} className="text-blue-400" />
                  <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                    {activeFile?.name || 'No file selected'}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      console.log('Saving code:', fileContent);
                    }}
                    className="px-3 py-1 text-xs font-medium rounded-md text-white bg-blue-600 
                      hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1.5"
                  >
                    Save
                  </button>
                  <span className={`px-2.5 py-1 text-xs font-medium rounded-full
                    ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    {workflow?.language?.toUpperCase() || 'JAVA'}
                  </span>
                </div>
              </div>
              <div className={`flex-1 ${isDark ? 'bg-gray-850' : 'bg-white'}`}>
                <AceEditor
                  mode={getEditorMode(activeFile?.name)}
                  theme={isDark ? "monokai" : "github"}
                  value={fileContent || ""}
                  fontSize={14}
                  width="100%"
                  height="100%"
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    enableBasicAutocompletion: true,
                    enableLiveAutocompletion: true,
                    enableSnippets: true,
                    showLineNumbers: true,
                    tabSize: 2,
                    useWorker: false
                  }}
                  editorProps={{ $blockScrolling: true }}
                  readOnly={false}
                  onChange={setFileContent}
                />
              </div>
            </div>
          
            {/* Test View - conditionally show based on activePanel on mobile */}
            <div className={`${isMobileView ? (activePanel === 'test' ? 'flex flex-col flex-1' : 'hidden') : 'w-1/2 flex flex-col'} ${!isMobileView ? 'border-l border-gray-700' : ''}`}>
              <div className={`h-11 px-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} 
                border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center flex-wrap`}>
                {/* Show file name in test panel for mobile */}
                {isMobileView && (
                  <div className="flex items-center">
                    <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                      Test: {activeFile?.name || ''}
                    </span>
                  </div>
                )}
                {/* Empty div for layout on desktop */}
                {!isMobileView && <div></div>}
                <TestActionButtons />
              </div>
              <div className={`flex-1 ${isDark ? 'bg-gray-850' : 'bg-white'} relative`}>
                <AceEditor
                  mode={getEditorMode(activeFile?.name)}
                  theme={isDark ? "monokai" : "github"}
                  value={testContent}
                  fontSize={14}
                  width="100%"
                  height="100%"
                  showPrintMargin={false}
                  showGutter={true}
                  highlightActiveLine={true}
                  setOptions={{
                    showLineNumbers: true,
                    tabSize: 2,
                    useWorker: false
                  }}
                  editorProps={{ $blockScrolling: true }}
                  readOnly={!isEditable}
                  onChange={handleEditorChange}
                />
                {isGenerating && <LoadingOverlay />}
              </div>
            </div>
          </div>
          </div>
          
          {coverageUrl && (
          <div className="p-4 border-t border-gray-700">
            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>View Coverage Report:</p>
            <a 
              href={coverageUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-700 underline"
            >
              Open Coverage Report
            </a>
          </div>
          )}
          </div>
        );
      };
          
export default AutomationDetails;




// import React, { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext';
// import AceEditor from 'react-ace';
// import { 
//   ChevronRight,
//   AlertCircle,
//   FileCode,
//   File,
//   PanelLeftClose,
//   PanelLeft,
//   Play,
//   Edit,
//   CheckCircle2,
//   XCircle,
//   X,
//   Loader2,
//   Info
// } from 'lucide-react';

// // Import Ace Editor themes and language modes
// import 'ace-builds/src-noconflict/mode-java';
// import 'ace-builds/src-noconflict/mode-python';
// import 'ace-builds/src-noconflict/mode-golang';
// import 'ace-builds/src-noconflict/mode-c_cpp';
// import 'ace-builds/src-noconflict/theme-monokai';
// import 'ace-builds/src-noconflict/theme-github';

// const LoadingOverlay = () => (
//   <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
//     <div className="flex flex-col items-center space-y-4">
//       <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
//       <p className="text-white text-sm font-medium">Generating...</p>
//     </div>
//   </div>
// );

// const AutomationDetails = () => {
//   const API_BASE_URL = "http://localhost:8000"

//   const location = useLocation();
//   const { workflow } = location.state || {};
//   const { isDark } = useTheme();
//   const [activeFile, setActiveFile] = useState(null);
//   const [fileContent, setFileContent] = useState('');
//   const [files, setFiles] = useState([]);
//   const [isFilesOpen, setIsFilesOpen] = useState(true);
//   const [coverageData, setCoverageData] = useState('');
//   const [storedData, setStoredData] = useState(null);
//   const [storedTests, setStoredTests] = useState(null);
//   const [isCoverageModalOpen, setIsCoverageModalOpen] = useState(false);
//   const [isRunningCoverage, setIsRunningCoverage] = useState(false);
//   const [isExplorerOpen, setIsExplorerOpen] = useState(true);
//   const [testContent, setTestContent] = useState('');
//   const [testStatus, setTestStatus] = useState(null);
//   const [isEditable, setIsEditable] = useState(false);
//   const [showGenerateButton, setShowGenerateButton] = useState(true);
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [promptOptions, setPromptOptions] = useState([]);
//   const [selectedPrompt, setSelectedPrompt] = useState(null);
//   const [showDropdown, setShowDropdown] = useState(false);
//   const [coverageUrl, setCoverageUrl] = useState('');
//   const [errorLogs, setErrorLogs] = useState(null);
//   const [showErrorModal, setShowErrorModal] = useState(false);
//   const [isEditAfterBuild, setIsEditAfterBuild] = useState(false);

//   const [htmlFilePath, setHtmlFilePath] = useState(null);
//   const [isHtmlViewerOpen, setIsHtmlViewerOpen] = useState(false);

//   // Variables for Prompt Library Dropdown
//   const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
//   const [modalPromptText, setModalPromptText] = useState('');
//   const [tempSelectedPrompt, setTempSelectedPrompt] = useState(null);
//   const [selectedPromptText, setSelectedPromptText] = useState(null);

//   // Variables for FileExplorer & TestCases mapping
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [inputContent, setInputContent] = useState(""); // Stores input editor content
//   const [testCases, setTestCases] = useState({});
//   const [testCasesMap, setTestCasesMap] = useState({});
//   const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
//   // Responsive state
//   const [isMobileView, setIsMobileView] = useState(false);
//   const [activePanel, setActivePanel] = useState('source'); // 'source' or 'test'

//   // Add responsive behavior detection
//   useEffect(() => {
//     const checkScreenSize = () => {
//       setIsMobileView(window.innerWidth < 768);
//     };
    
//     // Check on initial load
//     checkScreenSize();
    
//     // Set up listener for window resize
//     window.addEventListener('resize', checkScreenSize);
    
//     // Cleanup
//     return () => window.removeEventListener('resize', checkScreenSize);
//   }, []);

//   useEffect(() => {
//     if (workflow) {
//       console.log(workflow)
//       if (workflow.fileStructure && workflow.fileStructure.length > 0) {
//         // Handle ZIP folder scenario
//         console.log("Setting files from ZIP:", workflow.fileStructure);
//         setFiles(workflow.fileStructure);
        
//         // Automatically select the first file if available
//         const firstFile = workflow.fileStructure[0];
//         if (firstFile) {
//           setActiveFile(firstFile);
//           setSelectedFile(firstFile.name); // Set the selected file for test case mapping
//           setFileContent(firstFile.content || "");
//         }
//       }
//       else if (workflow.file) {
//         setFiles(workflow.fileStructure || []);
//         if (workflow.fileContent) {
//           const fileName = workflow.fileName || workflow.fileStructure?.[0]?.name || 'Untitled';
//           setActiveFile({
//             name: fileName,
//             content: workflow.fileContent
//           });
//           setSelectedFile(fileName); // Set the selected file for test case mapping
//           setFileContent(workflow.fileContent);
//         }
//       }
//     }
//   }, [workflow]);

//   // Add effect to update test content when selectedFile changes
//   useEffect(() => {
//     if (selectedFile && testCasesMap[selectedFile]) {
//       setTestContent(testCasesMap[selectedFile]);
//     }
//   }, [selectedFile, testCasesMap]);

//   const getEditorMode = (fileName) => {
//     const extension = fileName?.split('.').pop()?.toLowerCase();
//     switch (extension) {
//       case 'java': return 'java';
//       case 'py': return 'python';
//       case 'go': return 'golang';
//       case 'c': return 'c_cpp';
//       default: return 'java';
//     }
//   };

//   const fetchPromptLibrary = async () => {
//     try {
//       const language = workflow?.language || "java"; // Default to Java if not provided
//       const type = workflow?.sourceType || "file";
//       console.log("Language :", language);
//       console.log("Type :", type);
//       const response = await fetch(`${API_BASE_URL}/automation/${language}/prompt_name`); // Update API URL
//       if (!response.ok) throw new Error("Failed to fetch prompts");
      
//       const data = await response.json();
//       console.log("Prompts:", data)

//       setPromptOptions(data.prompt || []); // Assuming API returns { prompts: [...] }
//       setShowDropdown(true);
//     } catch (error) {
//       console.error("Error fetching prompt library:", error);
//     }
//   };

//   const handlePromptSelection = (e) => {
//     const selectedValue = e.target.value;
//     if (!selectedValue) return;

//     const selectedPrompt = promptOptions.find(
//       (prompt) => prompt.prompt_description === selectedValue
//     );

//     if (selectedPrompt){
//       setModalPromptText(selectedPrompt.prompt_text);
//       setTempSelectedPrompt(selectedValue);
//       setIsPromptModalOpen(true);
//     }
//   };

//   const handleAddPrompt = () => {
//     if (tempSelectedPrompt){
//       const selected = promptOptions.find(p => p.prompt_description === tempSelectedPrompt);
//       if (selected) {
//         setSelectedPrompt(selected.prompt_description);
//         setSelectedPromptText(selected.prompt_text);
//       }
//     }
//     setIsPromptModalOpen(false);
//   };

//   const handleCancelPrompt = () => {
//     setSelectedPrompt(null);
//     setIsPromptModalOpen(false);
//   };

//   const generateTestCase = async () => {
//     setIsGenerating(true);
//     setIsEditAfterBuild(false);
  
//     const language = workflow?.language || "java"; // Default to Java if not provided
//     const type = workflow?.sourceType || "file";

//     let filesToSend = [];

//     if (workflow?.fileStructure && workflow.fileStructure.length > 0){
//       // ✅ If multiple files exist, send all files
//       filesToSend = workflow.fileStructure.map(file => ({
//         name: file.name,
//         content: file.content
//       }));
//     }
//     else{
//       filesToSend = [{ 
//         name: workflow?.fileName || "unknown.txt", 
//         content: fileContent 
//       }];
//     }
    
//     const requestBody = {
//       input: filesToSend,
//       prompt: selectedPrompt || ".", 
//       prompt_text: selectedPromptText || ".",
//     };

//     // ENDPOINT FOR GENERATION
//     const apiUrl = `${API_BASE_URL}/automation/${language}/generate_from_${type}`;
    
//     try {
//       const response = await fetch(apiUrl, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({requestBody}),
//       });
  
//       if (!response.ok) {
//         throw new Error("Failed to generate test cases");
//       }
  
//       const data = await response.json();
//       console.log("Test cases - ", data);

//       // Handle different response formats based on file type
//       if (data.files) {
//         // Single file response format
//         const testCaseMap = {};
//         data.files.forEach(file => {
//           testCaseMap[file.name] = file.content;
//         });
//         setTestCasesMap(testCaseMap);
//         setTestContent(testCaseMap[data.files[0].name] || "No test cases found.");
//       }
//       else if (data.ZipCodes && typeof data.ZipCodes === "object") {
//         // Zip file response format
//         const testCaseMap = {};
        
//         // Extract test cases from the response
//         Object.keys(data.ZipCodes).forEach(fileName => {
//           const content = data.ZipCodes[fileName]?.testcase || "No test cases found.";
//           testCaseMap[fileName] = content;
//         });
        
//         setTestCasesMap(testCaseMap);
        
//         // Show test cases for currently selected file
//         if (selectedFile && testCaseMap[selectedFile]) {
//           setTestContent(testCaseMap[selectedFile]);
//         } else {
//           // If selectedFile doesn't have test cases, use the first available file
//           const firstFileName = Object.keys(testCaseMap)[0];
//           if (firstFileName) {
//             setTestContent(testCaseMap[firstFileName]);
//           } else {
//             setTestContent("No test cases found.");
//           }
//         }
//       }
//       else if (data.Code) {
//         // Direct code response
//         setTestContent(data.Code || "No test cases found.");
        
//         // Create a mapping with the single file
//         if (selectedFile) {
//           setTestCasesMap({ [selectedFile]: data.Code });
//         }
//       }
      
//       setShowGenerateButton(false);
//       setIsEditable(false); // Ensure test editor is read-only after generation
      
//       // If on mobile, switch to test panel view after generation
//       if (isMobileView) {
//         setActivePanel('test');
//       }
//     } catch (error) {
//       console.error("Error generating test cases:", error);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const handleEditorChange = (newContent) => {
//     if (!isEditable) return; // Only update content if the editor is editable
    
//     setTestContent(newContent); // Ensure state updates with the latest content
    
//     // If we have a selected file, update its test case in the map
//     if (selectedFile) {
//       setTestCasesMap(prev => ({
//         ...prev,
//         [selectedFile]: newContent
//       }));
//     }
//   };


//   const handleRunClick = async () => {
//     if (!Object.values(testCasesMap).some(content => content.trim())) {
//       alert("No test cases available to run!");
//       return;
//     }
    
//     setIsRunningCoverage(true);
    
//     const language = workflow?.language || "java";
//     const type = workflow?.sourceType || "file";
    
//     let filesToSend = [];
    
//     if (workflow?.fileStructure && workflow.fileStructure.length > 0) {
//       // Send all files
//       filesToSend = workflow.fileStructure.map(file => ({
//         name: file.name,
//         content: file.content
//       }));
//     } else {
//       filesToSend = [{
//         name: workflow?.fileName || "unknown.txt",
//         content: fileContent
//       }];
//     }
    
//     // Filter test cases to only include files that are present in input
//     let testToSend = {};
//     filesToSend.forEach(file => {
//       if (testCasesMap[file.name]) {
//         testToSend[file.name] = testCasesMap[file.name];
//       }
//     });
    
//     const requestBody = {
//       input: filesToSend,
//       test_code: testToSend
//     };
    
//     console.log("Request body for build case:", requestBody);
    
//     const apiUrl = `${API_BASE_URL}/automation/${language}/build_from_${type}`;
    
//     try {
//       const response = await fetch(apiUrl, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ requestBody }),
//       });
      
//       if (!response.ok) {
//         throw new Error("Failed to generate coverage report");
//       }
      
//       const data = await response.json();
//       console.log("Coverage Report -", data);
      
//       // Store the full report data
//       setStoredData(data.Report);
//       setStoredTests(data.Test);
      
//       // Check if there's an error in the report
//       const hasError = data.Report && data.Report.error;
      
//       if (hasError) {
//         setTestStatus('failed');
//         // Store error information
//         setErrorLogs(data.Report);
//         // Always set to read-only when a build fails
//         setIsEditable(false);
//       } else {
//         if (data.coverage_url) {
//           setCoverageUrl(data.coverage_url);
//         }
//         setCoverageData(data);
//         setTestStatus('success');
//         setIsEditAfterBuild(false);
//         setShowGenerateButton(false);
//         setIsEditable(false); // Ensure test editor is read-only after successful build
//       }
//     } catch (error) {
//       console.error("Error running coverage report:", error);
//       setTestStatus('failed');
//       setErrorLogs({ error: error.message });
//       // Always set to read-only when there's an error
//       setIsEditable(false);
//     } finally {
//       setIsRunningCoverage(false);
//     }
//   };

//   const handleEdit = () => {
//     setIsEditable(true); // Make the test editor editable
//     setTestStatus(null);
//     setShowGenerateButton(true);
//     setIsEditAfterBuild(true);
//   };

//   const handleClick = async () => {
//     setIsGenerating(true); // Show "Generating..."
    
//     try {
//       if (isEditAfterBuild) {
//         await handleRunClick();
//         // Ensure the editor is read-only after clicking build
//         setIsEditable(false);
//       } else {
//         await generateTestCase();
//       }
//     } finally {
//       setIsGenerating(false); // Reset once the results are received
//     }
//   };

//   // Handle file selection for both source and test views
//   const handleFileSelection = (file) => {
//     setActiveFile(file);
//     setSelectedFile(file.name);
//     setFileContent(file.content || "");
    
//     // Update test content for the selected file
//     if (testCasesMap[file.name]) {
//       setTestContent(testCasesMap[file.name]);
//     } else {
//       setTestContent(""); // Clear test content if no test case exists for this file
//     }
//   };

//   const handleOptionClick = async (option) => {
//     const language = workflow?.language || "java"; 
//     const type = workflow?.sourceType || "file";
//     console.log("Language for download", language)
//     console.log("Type for language", type)
    
//     const apiUrl = `${API_BASE_URL}/automation/${language}/download_${option}_for_${type}`;
//     console.log("Stored data is :", storedData)
//     console.log("Stored test case path is :", storedTests)
//     try {
//       const response = await fetch(apiUrl, {    
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           folder_path: storedData,
//           stored_tests: storedTests
//          }),
//       });
  
//       if (!response.ok) {
//         throw new Error("Failed to get data");
//       }

 
//       const blob = await response.blob();
//       const url = window.URL.createObjectURL(blob);
  
//       // Extract filename from Content-Disposition
//       let fileName = option;  // Default filename
//       const contentDisposition = response.headers.get("Content-Disposition");
  
//       if (contentDisposition) {
//         const match = contentDisposition.match(/filename="?([^";]+)"?/);
//         if (match) fileName = match[1];
//       }
  
//       console.log("Filename received", fileName)

//       if (!fileName.includes(".")) {
//         const contentType = response.headers.get("Content-Type");
//         if (contentType === "application/zip") {
//           fileName += ".zip";
//         } else {
//           fileName += ".html"; // Default to HTML if no extension is present
//         }
//       }
  
//       console.log("Final filename:", fileName);
  
//       // Download the file with the correct name
//       const a = document.createElement("a");
//       a.href = url;
//       a.download = fileName;  
//       document.body.appendChild(a);
//       a.click();
//       document.body.removeChild(a);
//       window.URL.revokeObjectURL(url);
//     } catch (error) {
//       console.error("Error fetching file:", error);
//     }
//     setIsDropdownOpen(false);
//   }
    
//   // Panel switcher for mobile view
//   const PanelSwitcher = () => (
//     <div className="flex w-full border-b border-gray-700 md:hidden">
//       <button
//         onClick={() => setActivePanel('source')}
//         className={`flex-1 py-2 text-sm font-medium ${
//           activePanel === 'source' 
//             ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-700') 
//             : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
//         }`}
//       >
//         Source
//       </button>
//       <button
//         onClick={() => setActivePanel('test')}
//         className={`flex-1 py-2 text-sm font-medium ${
//           activePanel === 'test' 
//             ? (isDark ? 'bg-gray-700 text-white' : 'bg-blue-100 text-blue-700') 
//             : (isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-700')
//         }`}
//       >
//         Test
//       </button>
//     </div>
//   );

//   const TestActionButtons = () => (
//     <div className="flex items-center gap-3 flex-wrap">
//       {/* Modified to show dropdown directly instead of button */}
//       {!showDropdown ? (
//       <button
//         onClick={fetchPromptLibrary}
//         className="px-3 py-1.5 bg-gray-600 text-white rounded-md text-xs font-medium hover:bg-gray-700 transition-colors duration-200 flex items-center gap-2"
//       >
//         Add Prompt Library
//       </button>
//     ) : (
//       <select
//         className="px-2 py-1 border border-gray-300 rounded-md text-xs"
//         value={selectedPrompt || ""}
//         onChange={handlePromptSelection}
//       >
//         <option value="">Select a prompt</option>
//         {promptOptions.map((prompt, index) => (
//           <option
//             key={index} 
//             value={prompt.prompt_description}
//           >
//             {prompt.prompt_description}
//           </option>
//         ))}
//       </select>
//     )}

//       {/* Modal for Prompt Preview */}
//       {isPromptModalOpen && (
//       <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
//         <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-lg w-full max-w-[600px] mx-4 max-h-100">
//           <div className="flex justify-between items-center mb-4">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//               Prompt Preview
//             </h3>
//             <button onClick={handleCancelPrompt} className="text-gray-500 hover:text-gray-700">
//               <X size={20} />
//             </button>
//           </div>

//           <div className="max-h-60 overflow-y-auto p-2 border border-gray-300 rounded-md bg-gray-100 dark:bg-gray-700">
//           <p className="text-sm text-gray-700 dark:text-gray-300">{modalPromptText}</p>
//           </div>

//           <div className="mt-4 flex justify-end space-x-2">
//             <button
//               onClick={handleCancelPrompt}
//               className="px-3 py-1.5 text-sm text-gray-600 bg-gray-200 rounded-md hover:bg-gray-300"
//             >
//               Cancel
//             </button>
//             <button
//               onClick={handleAddPrompt}
//               className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700"
//             >
//               Add Prompt
//             </button>
//           </div>
//         </div>
//       </div>
//     )}

//     {showGenerateButton && (
//       <button
//         onClick={handleClick}
//         className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 
//                 transition-colors duration-200 flex items-center gap-2"
//         disabled={isGenerating || (isEditAfterBuild && isRunningCoverage)}
//       >
//         {isGenerating ? (
//           <Loader2 size={14} className="animate-spin" />
//         ) : isEditAfterBuild ? (
//           <Play size={14} />
//         ) : (
//           <FileCode size={14} />
//         )}
//         <span>{isGenerating ? "Generating..." : isEditAfterBuild ? "Build" : "Generate"}</span>
//       </button>
//     )}

      
//       {testContent && !showGenerateButton && !testStatus && (
//         <button
//           onClick={handleRunClick}
//           className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 
//             transition-colors duration-200 flex items-center gap-2"
//         >
//           <Play size={14} />
//           <span>
//             {isRunningCoverage ? "Running..." : "Build"}
//           </span>
//         </button>
//       )}

// {showErrorModal && errorLogs && (
//   <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//     <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-auto">
//       <div className="flex justify-between items-center mb-4">
//         <h3 className="text-lg font-semibold">Error Details</h3>
//         <button 
//           onClick={() => setShowErrorModal(false)}
//           className="text-gray-500 hover:text-gray-700"
//         >
//           ✕
//         </button>
//       </div>
      
//       {errorLogs.error && (
//         <div className="mb-4">
//           <h4 className="font-medium text-black mb-1">Error:</h4>
//           <div className="bg-red-50 p-3 rounded text-red-700">{errorLogs.error}</div>
//         </div>
//       )}
      
//       {errorLogs.stderr && (
//         <div className="mb-4">
//           <h4 className="font-medium text-black mb-1">Standard Error:</h4>
//           <pre className="bg-gray-100 text-black p-3 rounded text-sm overflow-x-auto whitespace-pre-wrap">
//             {errorLogs.stderr}
//           </pre>
//         </div>
//       )}
      
//       {errorLogs.stdout && (
//         <div>
//           <h4 className="font-medium text-black mb-1">Standard Output:</h4>
//           <pre className="bg-gray-100 p-3 text-black rounded text-sm overflow-x-auto whitespace-pre-wrap">
//             {errorLogs.stdout}
//           </pre>
//         </div>
//       )}
      
//       <div className="mt-4 flex justify-end">
//         <button
//           onClick={() => setShowErrorModal(false)}
//           className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//         >
//           Close
//         </button>
//       </div>
//     </div>
//   </div>
// )}


// {testStatus === "success" && (
//   <div className="relative">
//     <button
//       onClick={() => setIsDropdownOpen(!isDropdownOpen)}
//       className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 
//         transition-colors duration-200 flex items-center gap-2"
//     >
//       <CheckCircle2 size={14} />
//       <span>Download</span>
//     </button>{isDropdownOpen && (
//       <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-800 shadow-lg rounded-md border dark:border-gray-700 z-50">
//         <ul className="py-1">
//           {["coverage", "source"].map((option) => (
//             <li
//               key={option}
//               onClick={() => handleOptionClick(option)}
//               className="px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
//             >
//               {option}
//             </li>
//           ))}
//         </ul>
//       </div>
//     )}
//   </div>
// )}

// {testStatus === 'failed' && (
//   <div className="flex items-center gap-2">
//     <button
//       onClick={handleEdit}
//       className="px-3 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600
//         transition-colors duration-200 flex items-center gap-2"
//     >
//       <Edit size={14} />
//       <span>Edit</span>
//     </button>     
//      <Info 
//      size={18} 
//      className="text-gray-700 dark:text-white hover:text-white-900 cursor-pointer" 
//      onClick={() => setShowErrorModal(true)} 
//      title="View Error Details" 
//    />
//       </div>
//     )}

//       {testStatus && (
//         <div className="flex items-center gap-2">
//           {testStatus === 'success' ? (
//             <>
//               <CheckCircle2 size={14} className="text-emerald-500" />
//               <span className="text-xs font-medium text-emerald-500">Passed</span>
//             </>
//           ) : (
//             <>
//               <XCircle size={14} className="text-red-500" />
//               <span className="text-xs font-medium text-red-500">Failed</span>
//             </>
//           )}
//         </div>
//       )}
//     </div>
//   );

//   return (
//     <div className={`h-[calc(100vh-4rem)] -m-8 flex flex-col ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
//       {/* Panel switcher for mobile */}
//       {isMobileView && <PanelSwitcher />}

//       {/* Main content area - responsive flex layout */}
//       <div className="flex flex-1 overflow-hidden">
//         {/* File Explorer - hide on mobile when closed */}
//         <div className={`border-r ${isDark ? 'border-gray-700 bg-gray-850' : 'border-gray-200 bg-white'} 
//           transition-all duration-300 ease-in-out 
//           ${isMobileView && !isExplorerOpen ? 'hidden' : ''}
//           ${isExplorerOpen ? (isMobileView ? 'w-full absolute z-10 h-full' : 'w-64') : 'w-10'}`}>
//           <div className={`border-b h-11 flex items-center justify-between px-4 
//             ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-gray-50'}`}>
//             {isExplorerOpen && (
//               <div className="flex items-center gap-2">
//                 <FileCode size={16} className="text-blue-400" />
//                 <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
//                   {workflow?.name || 'Untitled Workflow'}
//                 </span>
//               </div>
//             )}
//             <button 
//               onClick={() => {
//                 setIsExplorerOpen(!isExplorerOpen);
//                 // If we're closing the explorer on mobile, ensure we're back to the editor view
//                 if (isMobileView && isExplorerOpen) {
//                   setActivePanel('source');
//                 }
//               }}
//               className={`${isDark ? 'text-white dark:bg-gray-700 focus:outline-none hover:text-white' : 'text-gray-600 hover:text-gray-900'} 
//                 p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 flex-shrink-0`}
//             >
//               {isExplorerOpen ? <PanelLeftClose size={16} /> : <PanelLeft size={16} />}
//             </button>
//           </div>

//           {isExplorerOpen && (
//             <div>
//               <button 
//                 onClick={() => setIsFilesOpen(!isFilesOpen)}
//                 className={`flex items-center gap-1.5 p-2 w-full ${
//                   isDark ? 'text-white dark:bg-gray-700 focus:outline-none hover:text-white' : 'text-gray-600 hover:text-gray-900'
//                 } transition-colors`}
//               >
//                 <ChevronRight size={14} className={isFilesOpen ? "rotate-90" : ""} />
//                 <FileCode size={16} />
//                 <span className="text-sm">Files</span>
//               </button>
              
//               {isFilesOpen && files.map((file) => (
//                 <div
//                   key={file.name}
//                   className={`flex items-center gap-2 px-4 py-2 cursor-pointer ${
//                     activeFile?.name === file.name ? 
//                       (isDark ? 'bg-gray-700' : 'bg-gray-100') :
//                       (isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100')
//                   }`}
//                   onClick={() => {
//                     handleFileSelection(file);
//                     // On mobile, close the explorer after selecting a file
//                     if (isMobileView) {
//                       setIsExplorerOpen(false);
//                     }
//                   }}
//                 >
//                   <File size={14} className="text-blue-400" />
//                   <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
//                     {file.name}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           )}
//         </div>

//         {/* Main Content - adapt to mobile vs desktop */}
//         <div className={`flex-1 flex ${isMobileView ? 'flex-col' : 'flex-row'}`}>
//           {/* Source Code View - conditionally show based on activePanel on mobile */}
//           <div className={`${isMobileView ? (activePanel === 'source' ? 'flex flex-col flex-1' : 'hidden') : 'w-1/2 flex flex-col'}`}>
//             <div className={`h-11 px-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} 
//               border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
//               <div className="flex items-center gap-2">
//                 <File size={16} className="text-blue-400" />
//                 <span className={`text-sm font-medium truncate ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
//                   {activeFile?.name || 'No file selected'}
//                 </span>
//               </div>
//               <div className="flex items-center gap-3">
//                 <button
//                   onClick={() => {
//                     console.log('Saving code:', fileContent);
//                   }}
//                   className="px-3 py-1 text-xs font-medium rounded-md text-white bg-blue-600 
//                     hover:bg-blue-700 transition-colors duration-200 flex items-center gap-1.5"
//                 >
//                   Save
//                 </button>
//                 <span className={`px-2.5 py-1 text-xs font-medium rounded-full
//                   ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
//                   {workflow?.language?.toUpperCase() || 'JAVA'}
//                 </span>
//               </div>
//             </div>
//             <div className={`flex-1 ${isDark ? 'bg-gray-850' : 'bg-white'}`}>
//               <AceEditor
//                 mode={getEditorMode(activeFile?.name)}
//                 theme={isDark ? "monokai" : "github"}
//                 value={fileContent || ""}
//                 fontSize={14}
//                 width="100%"
//                 height="100%"
//                 showPrintMargin={false}
//                 showGutter={true}
//                 highlightActiveLine={true}
//                 setOptions={{
//                   enableBasicAutocompletion: true,
//                   enableLiveAutocompletion: true,
//                   enableSnippets: true,
//                   showLineNumbers: true,
//                   tabSize: 2,
//                   useWorker: false
//                 }}
//                 editorProps={{ $blockScrolling: true }}
//                 readOnly={false}
//                 onChange={setFileContent}
//               />
//             </div>
//           </div>

//           {/* Test View - conditionally show based on activePanel on mobile */}
//           <div className={`${isMobileView ? (activePanel === 'test' ? 'flex flex-col flex-1' : 'hidden') : 'w-1/2 flex flex-col'} ${!isMobileView ? 'border-l border-gray-700' : ''}`}>
//             <div className={`h-11 px-4 ${isDark ? 'bg-gray-800' : 'bg-gray-50'} 
//               border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center flex-wrap`}>
//               {/* Show file name in test panel for mobile */}
//               {isMobileView && (
//                 <div className="flex items-center">
//                   <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
//                     Test: {activeFile?.name || ''}
//                   </span>
//                 </div>
//               )}
//               {/* Empty div for layout on desktop */}
//               {!isMobileView && <div></div>}
//               <TestActionButtons />
//             </div>
//             <div className={`flex-1 ${isDark ? 'bg-gray-850' : 'bg-white'} relative`}>
//               <AceEditor
//                 mode={getEditorMode(activeFile?.name)}
//                 theme={isDark ? "monokai" : "github"}
//                 value={testContent}
//                 fontSize={14}
//                 width="100%"
//                 height="100%"
//                 showPrintMargin={false}
//                 showGutter={true}
//                 highlightActiveLine={true}
//                 setOptions={{
//                   showLineNumbers: true,
//                   tabSize: 2,
//                   useWorker: false
//                 }}
//                 editorProps={{ $blockScrolling: true }}
//                 readOnly={!isEditable}
//                 onChange={handleEditorChange}
//               />
//               {isGenerating && <LoadingOverlay />}
//             </div>
//           </div>
//         </div>
//       </div>

//       {coverageUrl && (
//         <div className="p-4 border-t border-gray-700">
//           <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>View Coverage Report:</p>
//           <a 
//             href={coverageUrl} 
//             target="_blank" 
//             rel="noopener noreferrer"
//             className="text-blue-500 hover:text-blue-700 underline"
//           >
//             Open Coverage Report
//           </a>
//         </div>
//       )}
//     </div>
//   );
// };

// export default AutomationDetails;