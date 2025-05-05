import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Download,
  FileImage,
  Play,
  Loader,
} from 'lucide-react';

const TestScenarioDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [generatedTestCases, setGeneratedTestCases] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  useEffect(() => {
    // Check if state has test data
    if (location.state && location.state.testData) {
      setTestData(location.state.testData);
      
      // If there's an image file, create a preview URL
      if (location.state.testData.imageFile instanceof File) {
        const imageUrl = URL.createObjectURL(location.state.testData.imageFile);
        setImagePreview(imageUrl);
        
        // Clean up the URL when component unmounts
        return () => URL.revokeObjectURL(imageUrl);
      }
    } else {
      // If no data is passed, redirect back to test generation page
      navigate('/dashboard/use-cases/test-generation');
    }
  }, [location, navigate]);

  const handleGoBack = () => {
    navigate('/dashboard/use-cases/test-generation');
  };

  const handleGenerateTestCases = async () => {
    if (!testData.imageFile || !testData.diagramType) {
      alert("Image and diagram type are required!");
      return;
    }
    
    setIsGenerating(true);
    
    const formData = new FormData();
    formData.append("image", testData.imageFile);
    formData.append("choice", testData.diagramType);

    try {
      const response = await fetch(`${API_BASE_URL}/test_scenario/generate`, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to generate test cases");
      }

      const data = await response.json();
      console.log("Recd Test Cases - ", data)

      setGeneratedTestCases(data || []);
    } catch (error) {
      console.error("Error generating test cases:", error);
      alert("Error generating test cases. Please try again.");
    } finally {
      setIsGenerating(false);
    }

  };

  // const handleExportTestCases = () => {
  //   if (generatedTestCases.length === 0) return;
    
  //   // Create a formatted text of the test cases
  //   let exportContent = "# Generated Test Cases\n\n";
    
  //   generatedTestCases.forEach(testCase => {
  //     exportContent += `## ${testCase.name}\n\n`;
  //     exportContent += "### Steps:\n";
  //     testCase.steps.forEach((step, index) => {
  //       exportContent += `${index + 1}. ${step}\n`;
  //     });
  //     exportContent += "\n### Expected Result:\n";
  //     exportContent += `${testCase.expectedResult}\n`;
  //     exportContent += "\n### Pass/Fail Criteria:\n";
  //     exportContent += `${testCase.passFailCriteria}\n\n`
  //   });
    
  //   // Create a blob and download it
  //   const blob = new Blob([exportContent], { type: 'text/plain' });
  //   const url = URL.createObjectURL(blob);
  //   const a = document.createElement('a');
  //   a.href = url;
  //   a.download = `testcases-${testData.diagramType}-${testData.testName}.txt`;
  //   document.body.appendChild(a);
  //   a.click();
  //   document.body.removeChild(a);
  //   URL.revokeObjectURL(url);
  // };

  const handleExportTestCases = () => {
    if (!generatedTestCases?.test_scenario) return;
  
    // Get the plain text test cases content
    const exportContent = generatedTestCases.test_scenario;
  
    // Create a blob and download it
    const blob = new Blob([exportContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `testcases-${testData.diagramType}-${testData.testName}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
            {testData.testName || "Test Scenario Details"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate test cases from your diagram
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Image and generation button */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Input Diagram
            </h2>
            
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-96 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
              {imagePreview ? (
                <img 
                  src={imagePreview} 
                  alt="Uploaded diagram" 
                  className="max-w-full max-h-96 object-contain"
                />
              ) : (
                <div className="text-center">
                  <FileImage size={48} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    No image available
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                Diagram Type: <span className="font-medium capitalize">{testData.diagramType || "Not specified"}</span>
              </p>
              
              <button
                onClick={handleGenerateTestCases}
                disabled={isGenerating || !imagePreview}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating Test Cases...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Generate Test Cases
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
              onClick={handleExportTestCases}
              disabled={generatedTestCases.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          
          {generatedTestCases?.test_scenario ? (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900 max-h-[600px] overflow-y-auto whitespace-pre-wrap text-sm text-gray-900 dark:text-white">
            {generatedTestCases.test_scenario}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
              {isGenerating ? (
                <div className="text-center">
                  <Loader size={40} className="mx-auto animate-spin mb-4 text-blue-500" />
                  <p>Analyzing diagram and generating test cases...</p>
                  <p className="text-sm mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>No test cases generated yet</p>
                  <p className="text-sm mt-2">Click the "Generate Test Cases" button to analyze your diagram</p>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TestScenarioDetails;