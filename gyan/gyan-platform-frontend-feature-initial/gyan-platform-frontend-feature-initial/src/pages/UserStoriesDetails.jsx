import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Play,
  Loader,
  Table,
  FileText,
  CheckCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

const UserStoriesDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [storyData, setStoryData] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [generatedStories, setGeneratedStories] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [progress, setProgress] = useState(""); 

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  useEffect(() => {
    // Check if state has story data
    if (location.state && location.state.storyData) {
      setStoryData(location.state.storyData);
      
      // If there's an Excel file, parse and display it
      if (location.state.storyData.excelFile instanceof File) {
        parseExcelFile(location.state.storyData.excelFile);
      }
    } else {
      // If no data is passed, redirect back to user stories page
      navigate('/dashboard/use-cases/user-stories');
    }
  }, [location, navigate]);

  const parseExcelFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON (without headers)
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length > 0) {
        // Extract first row as header
        const extractedHeader = jsonData[0][0] || "Content";
        const extractedRows = jsonData.slice(1).map((row) => row[0] || "");

        setHeaders([extractedHeader]);
        setRows(extractedRows);
        setExcelData(extractedRows);
      }
    };

    reader.readAsArrayBuffer(file);
  };


  const handleGoBack = () => {
    navigate('/dashboard/use-cases/user-stories');
  };

  // const handleGenerateStories = async () => {
  //   if (!storyData.excelFile) {
  //     alert("Excel/CSV file is required!");
  //     return;
  //   }
    
  //   setIsGenerating(true);
  //   // setProgress("Starting...");

  //   try {

  //     const formData = new FormData();
  //     formData.append("file", storyData.excelFile);

  //     const response = await fetch(`${API_BASE_URL}/func_tech_agent/generate`, {
  //       method: "POST",
  //       body: formData,
  //     });

  //     if (!response.ok) {
  //       throw new Error("Failed to generate test cases");
  //     }

  //     const data = await response.json();
  //     console.log("Recd data - ", data)

  //     // const fixedTests = extractTestCases(data)
  //     setGeneratedStories(data); 
  //   } catch (error) {
  //     console.error("Error generating requirements:", error);
  //     alert("Failed to generate specifications. Please try again.");
  //   } finally {
  //     setIsGenerating(false);
  //   }

  // };

  const handleGenerateStories = async () => {
    if (!storyData.excelFile) {
      alert("Excel/CSV file is required!");
      return;
    }
  
    setIsGenerating(true);
    setProgress("Starting...");
  
    const formData = new FormData();
    formData.append("file", storyData.excelFile);
  
    // Use fetch() with POST for file upload and progress streaming
    const response = await fetch(`${API_BASE_URL}/func_tech_agent/generate`, {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Failed to generate requirements");
    }
  
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
  
    let result = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
  
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split("\n\n");
  
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.substring(6).trim();
  
          // Check if processing is done and result is received
          if (data === "done") {
            setProgress("Done!");
            setIsGenerating(false);
            break;
          } else {
            try {
              const parsedData = JSON.parse(data);
              setGeneratedStories(parsedData);
              setProgress("Final result received!");
            } catch (e) {
              // It's not JSON, so treat it as a progress message
              setProgress(data);
            }
          }
        }
      }
    }
  };
  


  const handleExportStories = () => {
    if (!generatedStories || Object.keys(generatedStories).length === 0 || !excelData) return;

    // Prepare data for CSV
    const csvData = excelData.map((story, index) => ({
      "User Story": story,  // Extracted from the uploaded Excel file
      "Functional Specifications": generatedStories["Functional_Specification"] || "N/A",
      "Technical Specifications": generatedStories["Technical_Specification"] || "N/A"
    }));

    // Convert JSON to worksheet
    const worksheet = XLSX.utils.json_to_sheet(csvData);

    // Create a workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Generated Specifications");

    // Generate CSV file and trigger download
    XLSX.writeFile(workbook, `Generated_Requirements_${Date.now()}.csv`);
  };

  if (!storyData) {
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
            {storyData.storyName || "Requirements Details"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate functional & technical requirements from your user story
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Excel data and generation button */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Input Excel/CSV Data
            </h2>
            
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-96 bg-gray-50 dark:bg-gray-900 overflow-auto">
              {excelData && excelData.length > 0 ? (

                <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm max-h-96 overflow-y-auto">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  {headers[0]} {/* Display column header */}
                </h3>
                <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                  {rows.join("\n\n")} {/* Show content with line breaks */}
                </div>
              </div>




              ) : (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <FileSpreadsheet size={48} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {storyData.excelFile ? "Processing Excel/CSV data..." : "No Excel/CSV data available"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                File Name: <span className="font-medium">{storyData.excelFile ? storyData.excelFile.name : "Not specified"}</span>
              </p>
              
              <button
                onClick={handleGenerateStories}
                disabled={isGenerating || !excelData}
                className="w-full py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                //   <>
                //     <Loader size={18} className="animate-spin" />
                //     Generating Requirements...
                //   </>
                // ) : (
                //   <>
                //     <Play size={18} />
                //     Generate Requirements
                //   </>

                <div className="text-center">
                <Loader size={40} className="mx-auto animate-spin mb-4 text-white-500" />
                <p>{progress}</p>  {/* Show the progress message */}
                <p className="text-sm mt-2">This may take a moment</p>
              </div>
                ) : (
              <div className="text-center">
                <p>Generate Requirements</p>
                <p className="text-sm mt-2">Click to start analysis</p>
              </div>

                )}

              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Generated user stories */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated Requirements
            </h2>
            
            <button
              onClick={handleExportStories}
              disabled={generatedStories.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export
            </button>
          </div>

            {Object.keys(generatedStories).length > 0 ? (
                <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
                  {Object.entries(generatedStories).map(([key, value]) => (
                    <div key={key} className="border border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                        <FileText size={16} className="text-green-600 mr-2" />
                        {key.replace(/_/g, " ")} {/* Format the key for better readability */}
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
                        {value} {/* Display the content of each key */}
                      </div>
                    </div>
                  ))}

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
              {isGenerating ? (
                <div className="text-center">
                  <Loader size={40} className="mx-auto animate-spin mb-4 text-green-500" />
                  <p>Analyzing Excel/CSV data and generating requirements...</p>
                  <p className="text-sm mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>No requirements generated yet</p>
                  <p className="text-sm mt-2">Click the "Generate Requirements" button to start analysis</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserStoriesDetails;