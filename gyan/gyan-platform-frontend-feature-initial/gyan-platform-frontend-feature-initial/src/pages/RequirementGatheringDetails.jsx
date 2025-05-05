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
  CheckCircle,
  ClipboardList
} from 'lucide-react';
import * as XLSX from 'xlsx';

const RequirementGatheringDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [requirementData, setRequirementData] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [generatedRequirements, setGeneratedRequirements] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [progress, setProgress] = useState(""); 

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL


  useEffect(() => {
    // Check if state has requirement data
    if (location.state && location.state.requirementData) {
      setRequirementData(location.state.requirementData);
      
      // If there's an Excel file, parse and display it
      if (location.state.requirementData.excelFile instanceof File) {
        parseExcelFile(location.state.requirementData.excelFile);
      }
    } else {
      // If no data is passed, redirect back to requirement gathering page
      navigate('/dashboard/use-cases/requirement-gathering');
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
    navigate('/dashboard/use-cases/requirement-gathering');
  };

  // const handleGenerateRequirements = async () => {
  //   if (!requirementData.excelFile) {
  //     alert("Excel/CSV file is required!");
  //     return;
  //   }
    
  //   setIsGenerating(true);

  //   try {
  //     const formData = new FormData();
  //     formData.append("file", requirementData.excelFile);

  //     const response = await fetch(`${API_BASE_URL}/userstory_agent/generate`, {
  //       method: "POST",
  //       body: formData
  //     });
  
  //     if (!response.ok) {
  //       throw new Error("Failed to generate test cases");
  //     }
  
  //     const data = await response.json();
  //     console.log("Recd data - ", data)

  //     // const fixedTests = extractTestCases(data)
  //     setGeneratedRequirements(data); 
  //   } catch (error) {
  //     console.error("Error generating requirements:", error);
  //     alert("Failed to generate specifications. Please try again.");
  //   } finally {
  //     setIsGenerating(false);
  //   }

  // };


  const handleGenerateRequirements = async () => {
    if (!requirementData.excelFile) {
      alert("Excel/CSV file is required!");
      return;
    }
  
    setIsGenerating(true);
    setProgress("Starting...");
  
    const formData = new FormData();
    formData.append("file", requirementData.excelFile);
  
    // Use fetch() with POST for file upload and progress streaming
    const response = await fetch(`${API_BASE_URL}/userstory_agent/generate`, {
      method: "POST",
      body: formData,
    });
  
    if (!response.ok) {
      throw new Error("Failed to generate stories");
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
              setGeneratedRequirements(parsedData);
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




  const handleExportRequirements = () => {
    if (!generatedRequirements.userstory) return;

    // Automatically detect the start of the first user story and clean everything before that
    const userStoryStart = generatedRequirements.userstory.match(/(?=###\s\*\*User Story)/i);
    const cleanedData = userStoryStart 
      ? generatedRequirements.userstory.substring(userStoryStart.index).trim() 
      : generatedRequirements.userstory.trim();
    
    // Split stories at "---" to separate them into different cells
    const stories = cleanedData.split("\n---\n").map(story => story.trim());
    
    // Create CSV content
    let csvContent = "Generated UserStories\n";
    stories.forEach(story => {
      // Escape double quotes and wrap each story in quotes to handle multi-line content
      const escapedStory = `"${story.replace(/"/g, '""')}"`;
      csvContent += `${escapedStory}\n`;
    });

    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `generated-userstories-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!requirementData) {
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
            {requirementData.requirementName || "Requirement Details"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate User Stories from your Excel/CSV data
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
                // <div className="overflow-x-auto">
                //   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                //     <thead className="bg-gray-100 dark:bg-gray-800">
                //       <tr>
                //         {headers.map((header, index) => (
                //           <th 
                //             key={index}
                //             className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                //           >
                //             {header}
                //           </th>
                //         ))}
                //       </tr>
                //     </thead>
                //     <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                //       {rows.slice(0, 10).map((row, rowIndex) => (
                //         <tr key={rowIndex}>
                //           {headers.map((header, cellIndex) => (
                //             <td 
                //               key={cellIndex}
                //               className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
                //             >
                //               {row[header]}
                //             </td>
                //           ))}
                //         </tr>
                //       ))}
                //     </tbody>
                //   </table>
                //   {rows.length > 10 && (
                //     <div className="text-center text-sm text-gray-500 mt-4">
                //       Showing 10 of {rows.length} rows
                //     </div>
                //   )}
                // </div>

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
                    {requirementData.excelFile ? "Processing Excel/CSV data..." : "No Excel/CSV data available"}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                File Name: <span className="font-medium">{requirementData.excelFile ? requirementData.excelFile.name : "Not specified"}</span>
              </p>
              
              <button
                onClick={handleGenerateRequirements}
                disabled={isGenerating || !excelData}
                className="w-full py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                //   <>
                //     <Loader size={18} className="animate-spin" />
                //     Generating Requirements...
                //   </>
                // ) : (
                //   <>
                //     <Play size={18} />
                //     Generate
                //   </>

                  <div className="text-center">
                  <Loader size={40} className="mx-auto animate-spin mb-4 text-white-500" />
                  <p>{progress}</p>  {/* Show the progress message */}
                  <p className="text-sm mt-2">This may take a moment</p>
                </div>
                  ) : (
                <div className="text-center">
                  <p>Generate User Story</p>
                  <p className="text-sm mt-2">Click to start analysis</p>
                </div>

                )}
              </button>
            </div>
          </div>
        </div>
        
        {/* Right side - Generated requirements */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Generated User Stories
            </h2>
            
            <button
              onClick={handleExportRequirements}
              disabled={generatedRequirements.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export
            </button>
          </div>
          
          {/* {generatedRequirements.length > 0 ? (
            <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
              {generatedRequirements.map((req) => (
                <div 
                  key={req.id}
                  className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/10"
                >
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                    <ClipboardList size={16} className="text-purple-600 mr-2" />
                    {req.title}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300 pl-2 mb-3">
                    <p><span className="font-medium">Type:</span> {req.type}</p>
                    <p><span className="font-medium">Priority:</span> {req.priority}</p>
                    <p><span className="font-medium">Description:</span> {req.description}</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Details:</h4>
                    <ul className="list-none text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-2">
                      {req.details.map((detail, index) => (
                        <li key={index} className="flex items-start">
                          <CheckCircle size={14} className="text-purple-500 mr-2 mt-1 shrink-0" />
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div> */}

             {Object.keys(generatedRequirements).length > 0 ? (
              <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
                {Object.entries(generatedRequirements).map(([key, value]) => (
                  <div key={key} className="border border-purple-200 dark:border-purple-700 rounded-lg p-4 bg-purple-50 dark:bg-purple-900/10">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center">
                      <CheckCircle size={16} className="text-purple-600 mr-2" />
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
                  <Loader size={40} className="mx-auto animate-spin mb-4 text-purple-500" />
                  <p>Analyzing Excel/CSV data and generating requirements...</p>
                  <p className="text-sm mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>No User Stories generated yet</p>
                  <p className="text-sm mt-2">Click the "Generate" button to analyze your Excel/CSV data</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequirementGatheringDetails;