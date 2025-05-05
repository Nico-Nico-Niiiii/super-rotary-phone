// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { 
//   ArrowLeft,
//   Download,
//   FileSpreadsheet,
//   Play,
//   Loader,
//   Table
// } from 'lucide-react';
// // You'll need to install these packages if not already installed:
// // npm install papaparse xlsx
// // If you're getting import errors, check if these packages are installed in your project
// // For now, let's implement without external dependencies

// const CoriDetails = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [testData, setTestData] = useState(null);
//   const [excelData, setExcelData] = useState(null);
//   const [headers, setHeaders] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [generatedTestCases, setGeneratedTestCases] = useState([]);
//   const [isGenerating, setIsGenerating] = useState(false);

//   // Mock test cases for demonstration
//   const mockTestCases = [
//     {
//       id: 1,
//       name: "CORI Test Case 1",
//       steps: [
//         "Initialize system with configuration A",
//         "Run CORI command: GET_STATUS",
//         "Verify response code is 200",
//         "Verify response payload contains expected fields"
//       ],
//       expectedResult: "System returns proper status payload with all required fields"
//     },
//     {
//       id: 2,
//       name: "CORI Test Case 2",
//       steps: [
//         "Initialize system with configuration B",
//         "Run CORI command: SET_CONFIG with invalid parameters",
//         "Verify response code is 400",
//         "Verify error message is displayed"
//       ],
//       expectedResult: "System rejects invalid configuration with appropriate error"
//     },
//     {
//       id: 3,
//       name: "CORI Test Case 3",
//       steps: [
//         "Initialize system with default configuration",
//         "Run CORI command: RUN_DIAGNOSTIC",
//         "Verify all diagnostic checks pass",
//         "Verify performance metrics are within expected ranges"
//       ],
//       expectedResult: "Diagnostic completes successfully with all checks passed"
//     }
//   ];

//   useEffect(() => {
//     // Check if state has test data
//     if (location.state && location.state.testData) {
//       setTestData(location.state.testData);
      
//       // If there's an Excel file, parse and display it
//       if (location.state.testData.excelFile instanceof File) {
//         parseExcelFile(location.state.testData.excelFile);
//       }
//     } else {
//       // If no data is passed, redirect back to test generation page
//       navigate('/dashboard/use-cases/test-generation');
//     }
//   }, [location, navigate]);

//   const parseExcelFile = (file) => {
//     // Since we can't rely on external libraries for now, we'll create a simplified version
//     // that just displays file metadata instead of parsing the contents
    
//     setExcelData([
//       { row: 1, col1: "Sample", col2: "Data", col3: "Row 1" },
//       { row: 2, col1: "Sample", col2: "Data", col3: "Row 2" },
//       { row: 3, col1: "Sample", col2: "Data", col3: "Row 3" },
//       { row: 4, col1: "Sample", col2: "Data", col3: "Row 4" },
//       { row: 5, col1: "Sample", col2: "Data", col3: "Row 5" }
//     ]);
    
//     setHeaders(['row', 'col1', 'col2', 'col3']);
//     setRows([
//       { row: 1, col1: "Sample", col2: "Data", col3: "Row 1" },
//       { row: 2, col1: "Sample", col2: "Data", col3: "Row 2" },
//       { row: 3, col1: "Sample", col2: "Data", col3: "Row 3" },
//       { row: 4, col1: "Sample", col2: "Data", col3: "Row 4" },
//       { row: 5, col1: "Sample", col2: "Data", col3: "Row 5" }
//     ]);
    
//     // Note: In a real implementation, you would use the Papa and XLSX libraries
//     // to properly parse the Excel/CSV files
//   };

//   const handleGoBack = () => {
//     navigate('/dashboard/use-cases/test-generation');
//   };

//   const handleGenerateTestCases = () => {
//     if (!testData.excelFile) {
//       alert("Excel file is required!");
//       return;
//     }
    
//     setIsGenerating(true);
    
//     // Simulate API call with a timeout
//     setTimeout(() => {
//       setGeneratedTestCases(mockTestCases);
//       setIsGenerating(false);
//     }, 2000);
//   };

//   const handleExportTestCases = () => {
//     if (generatedTestCases.length === 0) return;
    
//     // Create a formatted text of the test cases
//     let exportContent = "# Generated CORI Test Cases\n\n";
    
//     generatedTestCases.forEach(testCase => {
//       exportContent += `## ${testCase.name}\n\n`;
//       exportContent += "### Steps:\n";
//       testCase.steps.forEach((step, index) => {
//         exportContent += `${index + 1}. ${step}\n`;
//       });
//       exportContent += "\n### Expected Result:\n";
//       exportContent += `${testCase.expectedResult}\n\n`;
//     });
    
//     // Create a blob and download it
//     const blob = new Blob([exportContent], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `cori-test-cases-${Date.now()}.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
//   };

//   if (!testData) {
//     return <div className="p-8">Loading...</div>;
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="flex items-center mb-6">
//         <button 
//           onClick={handleGoBack}
//           className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//             {testData.testName || "CORI Test Details"}
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400">
//             Generate CORI test cases from your Excel data
//           </p>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
//         {/* Left side - Excel data and generation button */}
//         <div className="space-y-6">
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
//               Input Excel Data
//             </h2>
            
//             <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-96 bg-gray-50 dark:bg-gray-900 overflow-auto">
//               {excelData && excelData.length > 0 ? (
//                 <div className="overflow-x-auto">
//                   <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
//                     <thead className="bg-gray-100 dark:bg-gray-800">
//                       <tr>
//                         {headers.map((header, index) => (
//                           <th 
//                             key={index}
//                             className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider"
//                           >
//                             {header}
//                           </th>
//                         ))}
//                       </tr>
//                     </thead>
//                     <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
//                       {rows.slice(0, 10).map((row, rowIndex) => (
//                         <tr key={rowIndex}>
//                           {headers.map((header, cellIndex) => (
//                             <td 
//                               key={cellIndex}
//                               className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300"
//                             >
//                               {row[header]}
//                             </td>
//                           ))}
//                         </tr>
//                       ))}
//                     </tbody>
//                   </table>
//                   {rows.length > 10 && (
//                     <div className="text-center text-sm text-gray-500 mt-4">
//                       Showing 10 of {rows.length} rows
//                     </div>
//                   )}
//                 </div>
//               ) : (
//                 <div className="text-center h-full flex flex-col items-center justify-center">
//                   <FileSpreadsheet size={48} className="mx-auto text-gray-400" />
//                   <p className="mt-2 text-gray-500 dark:text-gray-400">
//                     {testData.excelFile ? "Processing Excel data..." : "No Excel data available"}
//                   </p>
//                 </div>
//               )}
//             </div>

//             <div className="mt-6">
//               <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
//                 File Name: <span className="font-medium">{testData.excelFile ? testData.excelFile.name : "Not specified"}</span>
//               </p>
              
//               <button
//                 onClick={handleGenerateTestCases}
//                 disabled={isGenerating || !excelData}
//                 className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//               >
//                 {isGenerating ? (
//                   <>
//                     <Loader size={18} className="animate-spin" />
//                     Generating CORI Test Cases...
//                   </>
//                 ) : (
//                   <>
//                     <Play size={18} />
//                     Generate CORI Test Cases
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
        
//         {/* Right side - Generated test cases */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <div className="flex justify-between items-center mb-4">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
//               Generated CORI Test Cases
//             </h2>
            
//             <button
//               onClick={handleExportTestCases}
//               disabled={generatedTestCases.length === 0}
//               className="flex items-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
//             >
//               <Download size={16} />
//               Export
//             </button>
//           </div>
          
//           {generatedTestCases.length > 0 ? (
//             <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
//               {generatedTestCases.map((testCase) => (
//                 <div 
//                   key={testCase.id}
//                   className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
//                 >
//                   <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
//                     {testCase.name}
//                   </h3>
                  
//                   <div className="mb-3">
//                     <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps:</h4>
//                     <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-2">
//                       {testCase.steps.map((step, index) => (
//                         <li key={index}>{step}</li>
//                       ))}
//                     </ol>
//                   </div>
                  
//                   <div>
//                     <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Result:</h4>
//                     <p className="text-sm text-gray-600 dark:text-gray-400 pl-2">
//                       {testCase.expectedResult}
//                     </p>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           ) : (
//             <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
//               {isGenerating ? (
//                 <div className="text-center">
//                   <Loader size={40} className="mx-auto animate-spin mb-4 text-blue-500" />
//                   <p>Analyzing Excel data and generating CORI test cases...</p>
//                   <p className="text-sm mt-2">This may take a moment</p>
//                 </div>
//               ) : (
//                 <div className="text-center">
//                   <p>No test cases generated yet</p>
//                   <p className="text-sm mt-2">Click the "Generate CORI Test Cases" button to analyze your Excel data</p>
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CoriDetails;



import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Download,
  FileSpreadsheet,
  Play,
  Loader,
  Table
} from 'lucide-react';
import * as XLSX from 'xlsx';

const CoriDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [testData, setTestData] = useState(null);
  const [excelData, setExcelData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [generatedTestCases, setGeneratedTestCases] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

  useEffect(() => {
    // Check if state has test data
    if (location.state && location.state.testData) {
      setTestData(location.state.testData);
      
      // If there's an Excel file, parse and display it
      if (location.state.testData.excelFile instanceof File) {
        parseExcelFile(location.state.testData.excelFile);
      }
    } else {
      // If no data is passed, redirect back to test generation page
      navigate('/dashboard/use-cases/test-generation');
    }
  }, [location, navigate]);


  const parseExcelFile = (file) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      // Get the first sheet
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      // Convert sheet to JSON format
      const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

      if (jsonData.length === 0) {
        setExcelData([]);
        setHeaders([]);
        setRows([]);
        return;
      }

      // Extract headers (first row)
      const extractedHeaders = jsonData[0];

      // Extract row data (excluding headers)
      const extractedRows = jsonData.slice(1).map((row, index) => {
        let rowObject = { id: index + 1 };
        extractedHeaders.forEach((header, i) => {
          rowObject[header] = row[i] || ""; // Handle empty values
        });
        return rowObject;
      });

      setExcelData(jsonData);
      setHeaders(extractedHeaders);
      setRows(extractedRows);
    };

    reader.readAsArrayBuffer(file);
    
    // Note: In a real implementation, you would use the Papa and XLSX libraries
    // to properly parse the Excel/CSV files
  };

  const handleGoBack = () => {
    navigate('/dashboard/use-cases/test-generation');
  };

  const extractTestCases = (apiResponse) => {
    const resultsText = apiResponse.test_cases.results["Multiple User Support "]; // Extract the HTML content
    
    if (!resultsText) return []; // Return an empty array if no data
  
    // Use regex to extract test scenarios
    const testCases = [];
    const regex = /Test Scenario ID: (.*?)<br>Title: (.*?)<br>Steps:(.*?)<br>Expected Result: (.*?)<br>/gs;

    let match;
    while ((match = regex.exec(resultsText)) !== null) {
      testCases.push({
        id: match[1].trim(), // Test Case ID
        name: match[2].trim(), // Test Case Title
        steps: match[3]
          .replace(/<br>/g, "\n") // Convert <br> to newlines
          .replace(/&nbsp;/g, " ") // Convert &nbsp; to spaces
          .split("\n") // Split into array
          .map((step) => step.trim().replace(/^\*/, "").trim()) // Remove asterisks (*) & clean up
          .filter((step) => step.length > 0),
        expectedResult: match[4].trim().replace(/<br>/g, "\n").replace(/&nbsp;/g, " "), // Clean expected result
      });
    }

    return testCases;
  };

  const handleGenerateTestCases = async () => {
    if (!testData.excelFile) {
      alert("Excel file is required!");
      return;
    }
    
    setIsGenerating(true);

    try {
      const formData = new FormData();
      formData.append("excel_file", testData.excelFile);

      const response = await fetch(`${API_BASE_URL}/cori/generate`, {
        method: "POST",
        body: formData
      });
  
      if (!response.ok) {
        throw new Error("Failed to generate test cases");
      }
  
      const data = await response.json();
      console.log("Recd data - ", data)

      const fixedTests = extractTestCases(data)

      setGeneratedTestCases(fixedTests); 
    } catch (error) {
      console.error("Error generating test cases:", error);
      alert("Failed to generate test cases. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportTestCases = () => {
    if (!generatedTestCases || generatedTestCases.length === 0) {
      alert("No test cases to export!");
      return;
    }
  
    // Define the headers
    const csvHeaders = ["TestCaseID", "TestCaseName", "Steps", "Expected Result"];
  
    // Convert test cases into CSV-compatible format
    const csvData = generatedTestCases.map((testCase) => [
      testCase.id,
      testCase.name,
      testCase.steps.join(" | "), // Store all steps in one cell, separated by a delimiter (e.g., "|")
      testCase.expectedResult,
    ]);

    // Create worksheet
    const worksheet = XLSX.utils.aoa_to_sheet([csvHeaders, ...csvData]);

    // Create workbook and append worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "TestCases");

    // Write file and trigger download
    XLSX.writeFile(workbook, `cori-test-cases-${Date.now()}.csv`);

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
            {testData.testName || "CORI Test Details"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Generate CORI test cases from your Excel data
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left side - Excel data and generation button */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
              Input Excel Data
            </h2>
            
            <div className="border border-gray-300 dark:border-gray-700 rounded-lg p-4 min-h-96 bg-gray-50 dark:bg-gray-900 overflow-auto">
              {excelData && excelData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                    <colgroup>
                      {headers.map((header, index) => (
                        <col 
                          key={index} 
                          width={header === "ITEM ID" || header === "ID" ? "80px" : "auto"} 
                        />
                      ))}
                    </colgroup>
                    <thead className="bg-gray-100 dark:bg-gray-800 sticky top-0 z-10">
                      <tr>
                        {headers.map((header, index) => (
                          <th 
                            key={index}
                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider border-b border-gray-200 dark:border-gray-700"
                            style={{ 
                              minWidth: header === "ITEM ID" || header === "ID" ? "80px" : "150px",
                              width: header === "ITEM ID" || header === "ID" ? "80px" : "auto"
                            }}
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
                      {rows.slice(0, 10).map((row, rowIndex) => (
                        <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50 dark:bg-gray-800/50' : ''}>
                          {headers.map((header, cellIndex) => {
                            const content = row[header] || "";
                            const isLongContent = content.toString().length > 100;
                            const isExpanded = expandedRows[`${rowIndex}-${cellIndex}`];
                            const isIdColumn = header === "ITEM ID" || header === "ID";
                            
                            return (
                              <td 
                                key={cellIndex}
                                className={`px-4 py-3 text-sm text-gray-900 dark:text-gray-300 border-b border-gray-100 dark:border-gray-800 ${isIdColumn ? 'text-center' : ''}`}
                              >
                                <div className="break-words whitespace-normal">
                                  {isLongContent && !isExpanded ? (
                                    <>
                                      {content.toString().substring(0, 100)}...
                                      <button 
                                        className="ml-1 text-blue-500 hover:text-blue-700 text-xs font-medium"
                                        onClick={() => {
                                          setExpandedRows(prev => ({
                                            ...prev,
                                            [`${rowIndex}-${cellIndex}`]: true
                                          }));
                                        }}
                                      >
                                        See more
                                      </button>
                                    </>
                                  ) : isLongContent && isExpanded ? (
                                    <>
                                      {content}
                                      <button 
                                        className="ml-1 text-blue-500 hover:text-blue-700 text-xs font-medium"
                                        onClick={() => {
                                          setExpandedRows(prev => ({
                                            ...prev,
                                            [`${rowIndex}-${cellIndex}`]: false
                                          }));
                                        }}
                                      >
                                        See less
                                      </button>
                                    </>
                                  ) : (
                                    content
                                  )}
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {rows.length > 10 && (
                    <div className="text-center text-sm text-gray-500 mt-4 py-2 bg-gray-50 dark:bg-gray-800 rounded-b-lg border-t border-gray-200 dark:border-gray-700">
                      Showing 10 of {rows.length} rows
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center h-full flex flex-col items-center justify-center">
                  <FileSpreadsheet size={48} className="mx-auto text-gray-400" />
                  <p className="mt-2 text-gray-500 dark:text-gray-400">
                    {testData.excelFile ? "Processing Excel data..." : "No Excel data available"}
                  </p>
                </div>
              )}

            </div>

            <div className="mt-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                File Name: <span className="font-medium">{testData.excelFile ? testData.excelFile.name : "Not specified"}</span>
              </p>
              
              <button
                onClick={handleGenerateTestCases}
                disabled={isGenerating || !excelData}
                className="w-full py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <Loader size={18} className="animate-spin" />
                    Generating CORI Test Cases...
                  </>
                ) : (
                  <>
                    <Play size={18} />
                    Generate CORI Test Cases
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
              Generated CORI Test Cases
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
          
          {generatedTestCases.length > 0 ? (
            // <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
            //   {generatedTestCases.map((testCase) => (
            //     <div 
            //       key={testCase.id}
            //       className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
            //     >
            //       <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
            //         {testCase.name}
            //       </h3>
                  
            //       <div className="mb-3">
            //         <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Steps:</h4>
            //         <ol className="list-decimal list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-2">
            //           {testCase.steps.map((step, index) => (
            //             <li key={index}>{step}</li>
            //           ))}
            //         </ol>
            //       </div>
                  
            //       <div>
            //         <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Expected Result:</h4>
            //         <p className="text-sm text-gray-600 dark:text-gray-400 pl-2">
            //           {testCase.expectedResult}
            //         </p>
            //       </div>
            //     </div>
            //   ))}
            // </div>

              <div className="space-y-4 max-h-[600px] overflow-y-auto p-2">
            {generatedTestCases.map((testCase) => (
              <div 
                key={testCase.id}
                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-gray-50 dark:bg-gray-900"
              >
                {/* Display Test Case ID */}
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                  <span className="text-blue-500">ID: {testCase.id}</span> - {testCase.name}
                </h3>

                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Steps:
                  </h4>
                  <ol className="list list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 pl-2">
                    {testCase.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expected Result:
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 pl-2">
                    {testCase.expectedResult}
                  </p>
                </div>
              </div>
            ))}
          </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500 dark:text-gray-400">
              {isGenerating ? (
                <div className="text-center">
                  <Loader size={40} className="mx-auto animate-spin mb-4 text-blue-500" />
                  <p>Analyzing Excel data and generating CORI test cases...</p>
                  <p className="text-sm mt-2">This may take a moment</p>
                </div>
              ) : (
                <div className="text-center">
                  <p>No test cases generated yet</p>
                  <p className="text-sm mt-2">Click the "Generate CORI Test Cases" button to analyze your Excel data</p>
                </div>
              )}
            </div>
          )}



        </div>
      </div>
    </div>
  );
};

export default CoriDetails;