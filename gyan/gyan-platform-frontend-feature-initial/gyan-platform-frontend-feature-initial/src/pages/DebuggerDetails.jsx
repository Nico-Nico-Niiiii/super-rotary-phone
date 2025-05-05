// import React, { useState, useEffect } from 'react';
// import { 
//   Upload,
//   X,
//   Play, 
//   RefreshCw,
//   FileText,
//   CheckCircle,
//   AlertTriangle, 
//   File, 
//   Info, 
//   Download,
//   CircleCheckBig,
//   SearchCheck
// } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


// const Pagination = ({ currentPage, totalPages, onPageChange }) => {
//   return (
//     <div className="flex justify-end space-x-2 mt-4 px-6">
//       <button
//         onClick={() => onPageChange(currentPage - 1)}
//         disabled={currentPage === 1}
//         className="px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
//       >
//         Previous
//       </button>
//       <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
//         Page {currentPage} of {totalPages}
//       </span>
//       <button
//         onClick={() => onPageChange(currentPage + 1)}
//         disabled={currentPage === totalPages}
//         className="px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
//       >
//         Next
//       </button>
//     </div>
//   );
// };


// const DebuggerDetails = () => {
//   const [activeTab, setActiveTab] = useState('overview');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isLoading, setIsLoading] = useState(false);

//   const [analysisResults, setAnalysisResults] = useState({
//     filename: "NA",
//     scenario: "NA",
//     passLogs: 0,
//     failLogs: 0,
//     totalLogs: 0, 
//     resultsData: []
//     });

//   const [searchTerm, setSearchTerm] = useState("");
//   const [expandedRows, setExpandedRows] = useState({});

//   const handleSeeMore = (apiIndex, failureIndex) => {
//     setExpandedRows(prevState => ({
//       ...prevState,
//       [`${apiIndex}-${failureIndex}`]: !prevState[`${apiIndex}-${failureIndex}`]
//     }));
//   };

//   // pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const jobsPerPage = 5; // Number of items per page
  
//   // Reset pagination when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm, analysisResults.resultsData]);
  

//   const filteredLogs = analysisResults.resultsData.filter(log =>
//     log.api.toLowerCase().includes(searchTerm.toLowerCase()) 
//   );

//   // Calculate pagination indexes
//   const indexOfLastJob = currentPage * jobsPerPage;
//   const indexOfFirstJob = indexOfLastJob - jobsPerPage;
//   const currentLogs = filteredLogs.slice(indexOfFirstJob, indexOfLastJob);
//   const totalPages = Math.ceil(filteredLogs.length / jobsPerPage);
  
//   // Data for the pie chart
//   const [distributionData, setDistributionData] = useState([
//     { name: 'Passed', value: 50, color: '#2196F3' },
//     { name: 'Failed', value: 50, color: '#FF9800' }
//   ]);

  
//   const handleBrowseFiles = () => {
//     document.getElementById('file-upload').click();
//   };

//   const handleFileChange = (event) => {
//     if (event.target.files.length > 0) {
//       setSelectedFile(event.target.files[0]);
//       setShowModal(true);
//     }
//   };

//   const handleStartAnalysis = async () => {
//     if (!selectedFile) {
//       alert('Please select a zip file for analysis');
//       return;
//     }

//     setIsLoading(true);

//     try {
//       const formData = new FormData();
//       formData.append('file', selectedFile);
//       console.log("Before fetch request");

//       const response = await fetch('http://localhost:8000/data_analyzer/generate', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error('Analysis failed');
//       }

//       const data = await response.json();
//       // console.log("Data recieved:", data)
//       // console.log("ResultsData: ", data.data)
//       console.log("Filtered Logs:", filteredLogs.length);
//       console.log("Pagination: ", indexOfFirstJob, "to", indexOfLastJob);
//       console.log("Current Logs:", currentLogs.length);
//       // Handle the response data here
      
//       const total_logs = data.total;
//       const failed_logs = data.fail_child_logs;
//       const pass_logs = data.pass_child_logs;

//       // Set values to fields
//       setAnalysisResults({
//         filename: data.filename, 
//         scenario: data.scenario_name, 
//         passLogs: pass_logs, 
//         failLogs: failed_logs, 
//         totalLogs: total_logs, 
//         resultsData: Array.isArray(data.data) ? data.data : []
//       })

//       const normalPercent = total_logs > 0 ? ((pass_logs/total_logs) * 100).toFixed(0) : 0;
//       const anomalyPercent = total_logs > 0 ? ((failed_logs/total_logs) * 100).toFixed(0) : 0;

//       // Set Values in Pie Chart
//       setDistributionData([
//         { name: 'Passed', value: parseInt(normalPercent), color: '#2196F3' },
//         { name: 'Failed', value: parseInt(anomalyPercent), color: '#FF9800' }
//       ]);
      
//       setIsModalOpen(false);
//       setSelectedFile(null);

//     } catch (error) {
//       console.error('Error during analysis:', error);
//       alert('Failed to analyze file. Please try again.');
//     } finally {
//       setIsLoading(false);
//     }
//   };


//   const exportToCSV = () => {
//     // Define CSV header
//     const header = ["Data API", "Failure Message", "Reason", "Suggested Fix"];

//     // Extract table data
//     const csvData = filteredLogs.flatMap(log => 
//       log.failure_messages.map((failureMessage, index) => [
//           log.api, 
//           failureMessage, 
//           log.possible_reasons[index], 
//           log.fixes[index]
//       ])
//     );

//     // Combine header and data
//     const csvContent = [header, ...csvData]
//         .map(row => row.map(value => `"${value}"`).join(",")) // Ensure values are quoted
//         .join("\n");

//     // Create a blob and trigger download
//     const blob = new Blob([csvContent], { type: "text/csv" });
//     const link = document.createElement("a");
//     link.href = URL.createObjectURL(blob);
//     link.download = "data_analysis_results.csv";
//     document.body.appendChild(link);
//     link.click();
//     document.body.removeChild(link);
//   };


//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">DATA ANALYSER</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time debugging analysis dashboard</p>
//           </div>
//           <div className="flex items-center gap-4 mt-4 md:mt-0">
//             <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//               <RefreshCw size={18} />
//               Refresh Data
//             </button>
//             <button
//               onClick = {() => setIsModalOpen(true)} 
//               className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200">
//               <Play size={18} />
//               New Analysis
//             </button>
//           </div>
//         </div>
        
//         {/* Report Details Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//               <div className="flex items-center gap-2 mb-1">
//                 <File className="w-4 h-4 text-cyan-500 dark:text-gray-400" />
//                 <p className="text-xs text-gray-500 dark:text-gray-400">Report Name</p>
//               </div>
//             <p 
//               className="text-sm font-medium text-gray-900 dark:text-white mt-1 relative group"
//               title={analysisResults.filename}
//             >
//               <span className="inline-block max-w-full truncate">
//                 {analysisResults.filename.length > 20 
//                   ? `${analysisResults.filename.slice(0, 19)}...` 
//                   : analysisResults.filename}
//               </span>
//               <span className="invisible group-hover:visible absolute left-0 -top-8 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
//                 {analysisResults.filename}
//               </span>
//             </p>
//           </div>

//           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-2 mb-1">
//               <SearchCheck className="w-4 h-4 text-pink-500 dark:text-gray-400" />
//               <p className="text-xs text-gray-500 dark:text-gray-400">Scenario Name</p>
//             </div>
//             <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
//               {analysisResults.scenario}
//             </p>
//           </div>
      
//           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-2 mb-1">
//               <Info className="w-4 h-4 text-blue-500 dark:text-gray-400" />
//               <p className="text-xs text-gray-500 dark:text-gray-400">Total Logs</p>
//             </div>
//             <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
//               {analysisResults.totalLogs}
//             </p>
//           </div>

//           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//             <div className="flex items-center gap-2 mb-1">
//               <AlertTriangle className="w-4 h-4 text-red-500" />
//               <p className="text-xs text-gray-500 dark:text-gray-400">Failed Logs</p>
//             </div>
//             <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
//               {analysisResults.failLogs}
//             </p>
//           </div>

//           <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//               <div className="flex items-center gap-2 mb-1">
//                 <CheckCircle className="w-4 h-4 text-green-500" />
//                 <p className="text-xs text-gray-500 dark:text-gray-400">Passed Logs</p>
//               </div>
//               <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
//                 {analysisResults.passLogs}
//               </p>
//           </div>

//         </div>
        
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left Column - Metrics and Details */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Metrics Grid */}
//         <div className="lg:col-span-2">
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          
//           <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h3>

//           {/* Search Box */}
//           <div className="relative">
//             <input
//               type="text"
//               placeholder="Search logs..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
//             />
//           </div>
//           </div>
          
//           <div className="p-6">
//             <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
//               {/* Table Header */}
//               <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
//                 <div className="col-span-3 break-words">DATA API</div>
//                 <div className="col-span-4 break-words">FAILURE</div>
//                 <div className="col-span-3 break-words">REASON</div>
//                 <div classname="col-span-4 break-words">FIX</div>
//               </div>
              
//               {/* Table Body */}
//               <div className="divide-y divide-gray-200 dark:divide-gray-700">
//               {filteredLogs.length > 0 ? (
//                 currentLogs.map((log, index) => {
//                   return log.failure_messages.map((failureMessage, failureIndex) => (
//                     <div
//                       key={`${index}-${failureIndex}`}
//                       className="grid grid-cols-12 gap-4 px-4 py-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
//                     >
//                       {/* Data API */}
//                       <div className="col-span-3 text-gray-900 dark:text-white break-words">
//                         <div>{log.api}</div> {/* Show the API name */}
//                       </div>

//                       {/* Failure */}
//                       <div className="col-span-3 text-gray-600 dark:text-gray-300 break-words">
//                         <div
//                           className={`${
//                             expandedRows[`${index}-${failureIndex}`] ? "" : "line-clamp-2"
//                           }`}
//                         >
//                           {failureMessage}
//                         </div>
//                         <button
//                           onClick={() => handleSeeMore(index, failureIndex)}
//                           className="text-blue-600 text-xs mt-2"
//                         >
//                           {expandedRows[`${index}-${failureIndex}`] ? 'See Less' : 'See More'}
//                         </button>
//                       </div>

//                       {/* Reason */}
//                       <div className="col-span-3 text-gray-600 dark:text-gray-300 break-words">
//                         <div
//                           className={`${
//                             expandedRows[`${index}-${failureIndex}`] ? "" : "line-clamp-2"
//                           }`}
//                         >
//                           {log.possible_reasons[failureIndex]}
//                         </div>
//                       </div>

//                       {/* Fix */}
//                       <div className="col-span-3 text-gray-600 dark:text-gray-300 break-words">
//                         <div
//                           className={`${
//                             expandedRows[`${index}-${failureIndex}`] ? "" : "line-clamp-2"
//                           }`}
//                         >
//                           {log.fixes[failureIndex]}
//                         </div>
//                       </div>
//                     </div>
//                   ));
//                 })
//               ) : (
//                 <div className="p-4 text-center text-gray-500 dark:text-gray-400">
//                   No results yet.
//                 </div>
//               )}
//               </div>
              
//               {filteredLogs.length > 0 && (
//               <Pagination 
//                 currentPage={currentPage}
//                 totalPages={totalPages}
//                 onPageChange={setCurrentPage}
//               />
//             )}
            
            
//             </div>
//           </div>
        
//         </div>
//         </div>

//       </div>

//         {/* Right Column - Distribution Chart and Actions */}
//         <div className="space-y-8">
//           {/* Distribution Chart */}<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//             Distribution of Logs
//           </h3>
//           <div className="flex flex-col md:flex-row items-center gap-8">
//             <div className="h-64 w-full md:w-2/3">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={distributionData}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={60}
//                     outerRadius={80}
//                     paddingAngle={5}
//                     dataKey="value"
//                   >
//                     {distributionData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//             <div className="flex flex-col gap-4 w-full md:w-1/3">
//               {distributionData.map((entry, index) => (
//                 <div key={index} className="flex items-center gap-3">
//                   <div 
//                     className="w-4 h-4 rounded-full"
//                     style={{ backgroundColor: entry.color }}
//                   />
//                   <div className="flex flex-col">
//                     <span className="text-sm font-medium text-gray-900 dark:text-white">
//                       {entry.name}
//                     </span>
//                     <span className="text-xs text-gray-500 dark:text-gray-400">
//                       {entry.value}% of logs
//                     </span>
//                   </div>
//                 </div>
//               ))}
//             </div>
//           </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Quick Actions
//             </h3>
//             <div className="space-y-3">
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//                 <FileText size={18} className="text-primary-light" />
//                 <span className="text-sm text-gray-900 dark:text-white">Extent Report</span>
//               </button>
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={exportToCSV}>
//                 <Download size={18} className="text-primary-light" />
//                 <span className="text-sm text-gray-900 dark:text-white">Export Analysis</span>
//               </button>
//             </div>
//           </div>

//       {/* Start Analysis Modal */}
//       {isModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md">
//             {/* Header */}
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-semibold text-gray-900 dark:text-white">New Analysis</h3>
//               <button 
//                 onClick={() => {
//                   setIsModalOpen(false);
//                   setSelectedFile(null);
//                 }}
//                 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//               >
//                 <X size={20} />
//               </button>
//             </div>

//             {/* Upload Section */}
//             <div className="mb-6">
//               <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Upload Zip File</p>
//               <div 
//                 className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-lg p-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
//                 onClick={handleBrowseFiles}
//               >
//                 <div className="flex flex-col items-center text-center">
//                   <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-2" />
//                   <p className="text-sm text-gray-600 dark:text-gray-400">
//                     Drag and drop your file here or{' '}
//                     <span className="text-blue-500 hover:text-blue-600 dark:text-blue-400">Browse files</span>
//                   </p>
//                   {selectedFile && (
//                     <p className="mt-2 text-sm text-blue-500 dark:text-blue-400">
//                       Selected: {selectedFile.name}
//                     </p>
//                   )}
//                 </div>
//                 <input
//                   id="file-upload"
//                   type="file"
//                   className="hidden"
//                   onChange={handleFileChange}
//                   accept=".zip"
//                 />
//               </div>
//             </div>

//             {/* Action Buttons */}
//             <div className="flex justify-end gap-3">
//               <button
//                 onClick={() => {
//                   setIsModalOpen(false);
//                   setSelectedFile(null);
//                 }}
//                 className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
//               >
//                 Cancel
//               </button>
//               <button
//                 onClick={handleStartAnalysis}
//                 disabled={!selectedFile || isLoading}
//                 className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg flex items-center gap-2
//                   ${!selectedFile || isLoading 
//                     ? 'opacity-50 cursor-not-allowed' 
//                     : 'hover:bg-blue-600'
//                   }`}
//               >
//                 {isLoading ? (
//                   <>
//                     <RefreshCw className="w-4 h-4 animate-spin" />
//                     Running...
//                   </>
//                 ) : (
//                   <>
//                     <Play className="w-4 h-4" />
//                     Run Analysis
//                   </>
//                 )}
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//         </div>
//       </div>
//     </div>
//   );
// };

// export default DebuggerDetails;


import React, { useState, useEffect } from 'react';
import { 
  Upload,
  X,
  Play, 
  RefreshCw,
  FileText,
  AlertTriangle, 
  File, 
  Info, 
  Download,
  CheckCircle,
  SearchCheck
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const flattenLogsData = (logs) => {
  return logs.flatMap((log, apiIndex) => 
    log.failure_messages.map((failureMessage, failureIndex) => ({
      apiIndex,
      failureIndex,
      api: log.api,
      failureMessage,
      possibleReason: log.possible_reasons[failureIndex],
      fix: log.fixes[failureIndex]
    }))
  );
};

const DebuggerDetails = () => {
  const API_BASE_URL = "http://localhost:8000"

  const [activeTab, setActiveTab] = useState('overview');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [analysisResults, setAnalysisResults] = useState({
    filename: "NA",
    scenario: "NA",
    passLogs: 0,
    failLogs: 0,
    totalLogs: 0, 
    resultsData: []
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState({});

  // pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5; // Number of items per page
  
  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, analysisResults.resultsData]);
  
  const filteredLogs = analysisResults.resultsData.filter(log =>
    log.api.toLowerCase().includes(searchTerm.toLowerCase()) 
  );

  const flattenedFilteredLogs = flattenLogsData(filteredLogs);
  const indexOfLastItem = currentPage * jobsPerPage;
  const indexOfFirstItem = indexOfLastItem - jobsPerPage;
  const currentItems = flattenedFilteredLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(flattenedFilteredLogs.length / jobsPerPage);

  // Calculate pagination indexes
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstJob, indexOfLastJob);
  
  // Data for the pie chart
  const [distributionData, setDistributionData] = useState([
    { name: 'Passed', value: 50, color: '#2196F3' },
    { name: 'Failed', value: 50, color: '#FF9800' }
  ]);

  const handleSeeMore = (apiIndex, failureIndex) => {
    setExpandedRows(prevState => ({
      ...prevState,
      [`${apiIndex}-${failureIndex}`]: !prevState[`${apiIndex}-${failureIndex}`]
    }));
  };
  
  const handleBrowseFiles = () => {
    document.getElementById('file-upload').click();
  };

  const handleFileChange = (event) => {
    if (event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setShowModal(true);
    }
  };


  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      alert('Please select a zip file for analysis');
      return;
    }

    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      console.log("Before fetch request");

      const response = await fetch(`${API_BASE_URL}/data_analyzer/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      // console.log("Data recieved:", data)
      // console.log("ResultsData: ", data.data)
      // console.log("Filtered Logs:", filteredLogs.length);
      // console.log("Pagination: ", indexOfFirstJob, "to", indexOfLastJob);
      // console.log("Current Logs:", currentLogs.length);
      // Handle the response data here
      
      const total_logs = data.total;
      const failed_logs = data.fail_child_logs;
      const pass_logs = data.pass_child_logs;

      // Set values to fields
      setAnalysisResults({
        filename: data.filename, 
        scenario: data.scenario_name, 
        passLogs: pass_logs, 
        failLogs: failed_logs, 
        totalLogs: total_logs, 
        resultsData: Array.isArray(data.data) ? data.data : []
      })

      const normalPercent = total_logs > 0 ? ((pass_logs/total_logs) * 100).toFixed(0) : 0;
      const anomalyPercent = total_logs > 0 ? ((failed_logs/total_logs) * 100).toFixed(0) : 0;

      // Set Values in Pie Chart
      setDistributionData([
        { name: 'Passed', value: parseInt(normalPercent), color: '#2196F3' },
        { name: 'Failed', value: parseInt(anomalyPercent), color: '#FF9800' }
      ]);
      
      setIsModalOpen(false);
      setSelectedFile(null);

    } catch (error) {
      console.error('Error during analysis:', error);
      alert('Failed to analyze file. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };


  const exportToCSV = () => {
    // Define CSV header
    const header = ["Data API", "Failure Message", "Reason", "Suggested Fix"];

    // Extract table data
    const csvData = filteredLogs.flatMap(log => 
      log.failure_messages.map((failureMessage, index) => [
          log.api, 
          failureMessage, 
          log.possible_reasons[index], 
          log.fixes[index]
      ])
    );

    // Combine header and data
    const csvContent = [header, ...csvData]
        .map(row => row.map(value => `"${value}"`).join(",")) // Ensure values are quoted
        .join("\n");

    // Create a blob and trigger download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "data_analysis_results.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };


  const Pagination = ({ currentPage, totalPages, onPageChange }) => {
    return (
      <div className="flex justify-end space-x-2 mt-4 px-6">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="px-3 py-1 text-sm text-gray-600 dark:text-gray-300">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    );
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">DATA ANALYSER</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Real-time debugging analysis dashboard</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <RefreshCw size={18} />
              Refresh Data
            </button>
            <button
              onClick = {() => setIsModalOpen(true)} 
              className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200">
              <Play size={18} />
              New Analysis
            </button>
          </div>
        </div>
        
        {/* Report Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <File className="w-4 h-4 text-cyan-500 dark:text-gray-400" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Report Name</p>
              </div>
            <p 
              className="text-sm font-medium text-gray-900 dark:text-white mt-1 relative group"
              title={analysisResults.filename}
            >
              <span className="inline-block max-w-full truncate">
                {analysisResults.filename.length > 20 
                  ? `${analysisResults.filename.slice(0, 19)}...` 
                  : analysisResults.filename}
              </span>
              <span className="invisible group-hover:visible absolute left-0 -top-8 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                {analysisResults.filename}
              </span>
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <SearchCheck className="w-4 h-4 text-pink-500 dark:text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Scenario Name</p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {analysisResults.scenario}
            </p>
          </div>
      
          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Info className="w-4 h-4 text-blue-500 dark:text-gray-400" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Logs</p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {analysisResults.totalLogs}
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              <p className="text-xs text-gray-500 dark:text-gray-400">Failed Logs</p>
            </div>
            <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
              {analysisResults.failLogs}
            </p>
          </div>

          <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <p className="text-xs text-gray-500 dark:text-gray-400">Passed Logs</p>
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1">
                {analysisResults.passLogs}
              </p>
          </div>

        </div>
        
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Metrics and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Metrics Grid */}
        <div className="lg:col-span-2">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Analysis Results</h3>

          {/* Search Box */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600"
            />
          </div>
          </div>
          
          <div className="p-6">
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Table Header */}
              <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="col-span-3 break-words">DATA API</div>
                <div className="col-span-4 break-words">FAILURE</div>
                <div className="col-span-3 break-words">REASON</div>
                <div className="col-span-2 break-words">FIX</div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {flattenedFilteredLogs.length > 0 ? (
                currentItems.map((item) => (
                  <div
                    key={`${item.apiIndex}-${item.failureIndex}`}
                    className="grid grid-cols-12 gap-4 px-4 py-3 text-xs hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    {/* Data API */}
                    <div className="col-span-3 text-gray-900 dark:text-white break-words">
                      <div>{item.api}</div>
                    </div>

                    {/* Failure */}
                    <div className="col-span-3 text-gray-600 dark:text-gray-300 break-words">
                      <div
                        className={`${
                          expandedRows[`${item.apiIndex}-${item.failureIndex}`] ? "" : "line-clamp-2"
                        }`}
                      >
                        {item.failureMessage}
                      </div>
                      <button
                        onClick={() => handleSeeMore(item.apiIndex, item.failureIndex)}
                        className="text-blue-600 text-xs mt-2"
                      >
                        {expandedRows[`${item.apiIndex}-${item.failureIndex}`] ? 'See Less' : 'See More'}
                      </button>
                    </div>

                    {/* Reason */}
                    <div className="col-span-3 text-gray-600 dark:text-gray-300 break-words">
                      <div
                        className={`${
                          expandedRows[`${item.apiIndex}-${item.failureIndex}`] ? "" : "line-clamp-2"
                        }`}
                      >
                        {item.possibleReason}
                      </div>
                    </div>

                    {/* Fix */}
                    <div className="col-span-3 text-gray-600 dark:text-gray-300 break-words">
                      <div
                        className={`${
                          expandedRows[`${item.apiIndex}-${item.failureIndex}`] ? "" : "line-clamp-2"
                        }`}
                      >
                        {item.fix}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No results yet.
                </div>
              )}
              </div>
              
              {flattenedFilteredLogs.length > 0 && (
                <Pagination 
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              )}
            
            
            </div>
          </div>
        
        </div>
        </div>

      </div>

        {/* Right Column - Distribution Chart and Actions */}
        <div className="space-y-8">
          {/* Distribution Chart */}<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribution of Logs
          </h3>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-64 w-full md:w-2/3">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col gap-4 w-full md:w-1/3">
              {distributionData.map((entry, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {entry.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {entry.value}% of logs
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Quick Actions
            </h3>
            <div className="space-y-3">
              <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <FileText size={18} className="text-primary-light" />
                <span className="text-sm text-gray-900 dark:text-white">Extent Report</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={exportToCSV}>
                <Download size={18} className="text-primary-light" />
                <span className="text-sm text-gray-900 dark:text-white">Export Analysis</span>
              </button>
            </div>
          </div>

      {/* Start Analysis Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg w-full max-w-md">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">New Analysis</h3>
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Upload Section */}
            <div className="mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Upload Zip File</p>
              <div 
                className="border-2 border-dashed border-blue-200 dark:border-blue-900 rounded-lg p-6 cursor-pointer hover:border-blue-300 dark:hover:border-blue-700 transition-colors"
                onClick={handleBrowseFiles}
              >
                <div className="flex flex-col items-center text-center">
                  <Upload className="w-6 h-6 text-gray-400 dark:text-gray-500 mb-2" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Drag and drop your file here or{' '}
                    <span className="text-blue-500 hover:text-blue-600 dark:text-blue-400">Browse files</span>
                  </p>
                  {selectedFile && (
                    <p className="mt-2 text-sm text-blue-500 dark:text-blue-400">
                      Selected: {selectedFile.name}
                    </p>
                  )}
                </div>
                <input
                  id="file-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".zip"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleStartAnalysis}
                disabled={!selectedFile || isLoading}
                className={`px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg flex items-center gap-2
                  ${!selectedFile || isLoading 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-blue-600'
                  }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Running...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Analysis
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

        </div>
      </div>
    </div>
  );
};

export default DebuggerDetails;