import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Download,
  Code,
  Play,
  Loader,
  FileSpreadsheet,
  FileCode,
  CheckCircle,
  FileJson
} from 'lucide-react';

const TestAutomationDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [fileContents, setFileContents] = useState({});
  const [generatedTests, setGeneratedTests] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mock test cases for demonstration
  const mockTestCases = [
    {
      id: 1,
      name: "UserAuthenticationTest",
      description: "Tests for user authentication functionality",
      testSteps: [
        { id: 1, name: "test_login_with_valid_credentials", description: "Verify user can login with valid username and password" },
        { id: 2, name: "test_login_with_invalid_credentials", description: "Verify system rejects login with invalid credentials" },
        { id: 3, name: "test_password_reset", description: "Verify password reset functionality works correctly" },
        { id: 4, name: "test_account_lockout", description: "Verify account gets locked after multiple failed attempts" }
      ]
    },
    {
      id: 2,
      name: "DataProcessingTest",
      description: "Tests for data processing and validation",
      testSteps: [
        { id: 1, name: "test_data_import", description: "Verify system can import CSV data correctly" },
        { id: 2, name: "test_data_validation", description: "Verify data validation rules are applied correctly" },
        { id: 3, name: "test_data_transformation", description: "Verify data is transformed according to business rules" },
        { id: 4, name: "test_data_export", description: "Verify data can be exported in correct format" }
      ]
    },
    {
      id: 3,
      name: "APIIntegrationTest",
      description: "Tests for external API integrations",
      testSteps: [
        { id: 1, name: "test_api_authentication", description: "Verify API authentication works correctly" },
        { id: 2, name: "test_api_response_handling", description: "Verify proper handling of API responses" },
        { id: 3, name: "test_error_handling", description: "Verify error conditions are handled gracefully" },
        { id: 4, name: "test_rate_limiting", description: "Verify rate limiting functionality works as expected" }
      ]
    }
  ];

  useEffect(() => {
    // Check if state has test data
    if (location.state && location.state.testData) {
      setTestData(location.state.testData);
      
      // If there are files, process them
      if (location.state.testData.files && location.state.testData.files.length > 0) {
        processFiles(location.state.testData.files);
      }
    } else {
      // If no data is passed, redirect back to test automation page
      navigate('/dashboard/use-cases/test-automation');
    }
  }, [location, navigate]);

  const processFiles = (files) => {
    // In a real implementation, this would parse the files
    // Here we'll just add some mock content based on file extensions
    const fileContentsObj = {};
    
    files.forEach(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      
      if (extension === 'py') {
        fileContentsObj[file.name] = `
# Sample Python file content
class UserService:
    def __init__(self, database):
        self.db = database
        
    def authenticate(self, username, password):
        user = self.db.find_user(username)
        if not user:
            return False
        return user.check_password(password)
        
    def reset_password(self, username, new_password):
        user = self.db.find_user(username)
        if not user:
            return False
        user.set_password(new_password)
        return self.db.save_user(user)
`;
      } else if (['xlsx', 'xls', 'csv'].includes(extension)) {
        // For Excel/CSV files, we'd show parsed data
        fileContentsObj[file.name] = [
          { id: 1, testName: "Login", expectedResult: "User successfully logs in", priority: "High" },
          { id: 2, testName: "Logout", expectedResult: "User successfully logs out", priority: "Medium" },
          { id: 3, testName: "Reset Password", expectedResult: "Password reset email sent", priority: "High" }
        ];
      }
    });
    
    setFileContents(fileContentsObj);
  };

  const handleGoBack = () => {
    navigate('/dashboard/use-cases/test-automation');
  };

  const handleGenerateTests = () => {
    if (!testData.files || testData.files.length === 0) {
      alert("Files are required!");
      return;
    }
    
    setIsGenerating(true);
    
    // Simulate API call with a timeout
    setTimeout(() => {
      setGeneratedTests(mockTestCases);
      setIsGenerating(false);
    }, 2000);
  };

  const handleExportTests = () => {
    if (generatedTests.length === 0) return;
    
    // Create a JSON representation of the test cases
    const exportData = {
      testSuite: testData.testName,
      timestamp: new Date().toISOString(),
      generatedBy: "AI Test Automation",
      testCases: generatedTests.map(testCase => ({
        id: testCase.id,
        name: testCase.name,
        description: testCase.description,
        testSteps: testCase.testSteps.map(step => ({
          id: step.id,
          name: step.name,
          description: step.description,
          expectedResult: "Pass"
        }))
      }))
    };
    
    // Create a blob and download it as JSON
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `test-automation-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderFileContent = (fileName, content) => {
    const extension = fileName.split('.').pop().toLowerCase();
    
    if (['xlsx', 'xls', 'csv'].includes(extension)) {
      // Render Excel/CSV content as a table
      return (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-gray-100 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">ID</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Test Name</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Expected Result</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Priority</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
              {content.map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{row.id}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{row.testName}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{row.expectedResult}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">{row.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    } else if (extension === 'py') {
      // Render Python content with syntax highlighting
      return (
        <div className="bg-gray-900 text-gray-200 p-4 rounded-md overflow-auto">
          <pre className="text-sm font-mono">{content}</pre>
        </div>
      );
    } else {
      return <p>Content preview not available</p>;
    }
  };

  if (!testData) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={handleGoBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {testData.testName || "Test Automation Details"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate automated tests from your files
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - File contents and generation button */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Input Files
            </h2>
            
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-96 bg-gray-50 dark:bg-gray-900 overflow-auto">
              {testData.files && testData.files.length > 0 ? (
                <div className="space-y-6">
                  {testData.files.map((file, index) => (
                    <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <h3 className="text-md font-medium flex items-center mb-3">
                        {file.name.endsWith('.py') ? (
                          <FileCode size={18} className="text-blue-500 mr-2" />
                        ) : (
                          <FileSpreadsheet size={18} className="text-green-500 mr-2" />
                        )}
                        {file.name}
                      </h3>
                      {fileContents[file.name] ? (
                        renderFileContent(file.name, fileContents[file.name])
                      ) : (
                        <p className="text-sm text-gray-500">Loading file content...</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <Code size={48} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    No files available
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                {testData.files && testData.files.length > 0 
                  ? `${testData.files.length} file${testData.files.length !== 1 ? 's' : ''} uploaded` 
                  : "No files uploaded"}
              </p>
              
              <button
                onClick={handleGenerateTests}
                disabled={isGenerating || !testData.files || testData.files.length === 0}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating Tests...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Generate Tests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Generated test cases */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Test Cases
            </h2>
            
            <button
              onClick={handleExportTests}
              disabled={generatedTests.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileJson size={16} />
              Export JSON
            </button>
          </div>
          
          {generatedTests.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
              {generatedTests.map((testCase) => (
                <div 
                  key={testCase.id}
                  className="border border-blue-200 dark:border-blue-700 rounded-lg p-4 bg-blue-50 dark:bg-blue-900/10"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <Code size={16} className="text-blue-600 mr-2" />
                    {testCase.name}
                  </h3>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{testCase.description}</p>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Steps:</h4>
                    <ul className="list-none text-sm text-gray-600 dark:text-gray-400 space-y-2 pl-2">
                      {testCase.testSteps.map((step) => (
                        <li key={step.id} className="flex items-start">
                          <CheckCircle size={14} className="text-blue-500 mr-2 mt-1 shrink-0" />
                          <div>
                            <span className="font-medium">{step.name}:</span> {step.description}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
              {isGenerating ? (
                <div className="text-center">
                  <Loader size={40} className="mx-auto animate-spin mb-4 text-blue-500" />
                  <p>Analyzing files and generating test cases...</p>
                  <p className="text-sm mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>No test cases generated yet</p>
                  <p className="text-sm mt-2">Click the "Generate Tests" button to analyze your files</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestAutomationDetails;
