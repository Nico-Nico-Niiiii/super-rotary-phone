// import React, { useState, useEffect } from 'react';
// import { useLocation } from 'react-router-dom';
// import { 
//   Upload, 
//   Play,
//   AlertCircle,
//   AlertTriangle,
//   CheckCircle,
//   X,
//   RefreshCw,
//   BarChart,
//   FileText,
//   XCircle,
//   Download, 
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

// const BiosAnalyserDetail = () => {
//   const location = useLocation();
//   const formData = location.state?.formData;
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [selectedModel, setSelectedModel] = useState('');
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);
//   const [isExtentOpen, setIsExtentOpen] = useState(false);
//   const [analysisResults, setAnalysisResults] = useState({
//     totalLogs: 0, 
//     normalLogs: 0, 
//     anomalyLogs: 0, 
//     logResults: []
//     });

//   const [searchTerm, setSearchTerm] = useState("");

//   // pagination states
//   const [currentPage, setCurrentPage] = useState(1);
//   const jobsPerPage = 7; // Number of items per page

//   // Reset pagination when filters change
//   useEffect(() => {
//     setCurrentPage(1);
//   }, [searchTerm]);

//   // Filter logs based on search term (case-insensitive)
//   const filteredLogs = analysisResults.logResults.filter(log =>
//     log.Input.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     log.Output.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   // Calculate pagination indexes
//   const indexOfLastJob = currentPage * jobsPerPage;
//   const indexOfFirstJob = indexOfLastJob - jobsPerPage;
//   const currentLogs = filteredLogs.slice(indexOfFirstJob, indexOfLastJob);
//   const totalPages = Math.ceil(filteredLogs.length / jobsPerPage);

//   const [distributionData, setDistributionData] = useState([
//     { name: 'Normal', value: 50, color: '#2196F3' }, // Blue for Normal
//     { name: 'Anomaly', value: 50, color: '#FF9800' } // Orange for Anomaly
//   ]);

//   const metrics = [
//     { label: 'Total Logs', value: analysisResults.totalLogs, icon: <AlertCircle size={20} />, bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-200' },
//     { label: 'Normal Logs', value: analysisResults.normalLogs, icon: <CheckCircle size={20} />, bgColor: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-600 dark:text-green-200' },
//     { label: 'Anomaly Logs', value: analysisResults.anomalyLogs, icon: <AlertTriangle size={20} />, bgColor: 'bg-red-100 dark:bg-yellow-900', textColor: 'text-yellow-600 dark:text-yellow-200' }
//   ];

//   const handleBrowseFiles = () => {
//     document.getElementById('file-upload').click();
//   };

//   const handleFileChange = (event) => {
//     // const file = event.target.files[0];
//     // if (file) setSelectedFile(file.name);
//     if (event.target.files.length > 0) {
//       setSelectedFile(event.target.files[0]);
//       setShowModal(true);
//     }
//   };

//   const handleStartAnalysis = async () => {
//     if (!selectedFile) {
//       alert('Please select a log file for analysis');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const formData = new FormData();
//       formData.append('file', selectedFile);

//       const response = await fetch('http://localhost:8000/bios_logs/generate', {
//         method: 'POST',
//         body: formData,
//       });

//       if (!response.ok) {
//         throw new Error('Analysis failed');
//       }

//       const data = await response.json();
//       // console.log("Data recieved:", data)
//       console.log("Filtered Logs:", filteredLogs.length);
//       console.log("Pagination: ", indexOfFirstJob, "to", indexOfLastJob);
//       console.log("Current Logs:", currentLogs.length);
//       // Handle the response data here

//       const total = data.total;
//       const normal = data.normal_counts;
//       const anomaly = data.anomaly_counts;
//       const chat_messages = data.chat_messages || [];

//       const normalPercent = total > 0 ? ((normal/total) * 100).toFixed(0) : 0;
//       const anomalyPercent = total > 0 ? ((anomaly/total) * 100).toFixed(0) : 0;

//       // Set Values in count boxes
//       setAnalysisResults({
//         totalLogs: total,
//         normalLogs: normal,
//         anomalyLogs: anomaly,
//         logResults: chat_messages
//       });

//       // Set Values in Pie Chart
//       setDistributionData([
//         { name: 'Normal', value: parseInt(normalPercent), color: '#2196F3' },
//         { name: 'Anomaly', value: parseInt(anomalyPercent), color: '#FF9800' }
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
//     const header = ["Bios Logs", "Type", "Details"];
    
//     // Convert the logResults to CSV rows
//     const rows = analysisResults.logResults.map(log => [
//       log.Input,
//       log.Output,
//       log.Details,
//     ]);
  
//     // Combine header and rows
//     const csvContent = [header, ...rows]
//       .map(row => row.join(","))
//       .join("\n");
  
//     // Trigger CSV file download
//     const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
//     const link = document.createElement("a");
//     if (link.download !== undefined) {
//       // Create a link to download the file
//       const fileName = "bios_analysis_results.csv";
//       link.setAttribute("href", URL.createObjectURL(blob));
//       link.setAttribute("download", fileName);
//       link.style.visibility = "hidden";
//       document.body.appendChild(link);
//       link.click();
//       document.body.removeChild(link);
//     }
//   };

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">BIOS ANALYSER</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">System BIOS analysis and verification tool</p>
//           </div>
//           <div className="flex items-center gap-4 mt-4 md:mt-0">
//             <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
//               <RefreshCw size={18} />
//               Refresh Data
//             </button>
//             <button 
//               onClick={() => setIsModalOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
//             >
//               <Play size={18} />
//               New Analysis
//             </button>
//           </div>
//         </div>

//         {/* Metrics Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
//           {metrics.map((metric, index) => (
//             <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg col-span-2">
//               <div className="flex items-center justify-between">
//                 <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
//                 <div className={`inline-flex p-2 ${metric.bgColor} rounded-lg ${metric.textColor}`}>
//                   {metric.icon}
//                 </div>
//               </div>
//               <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">{metric.value}</p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Layout - Two Columns */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//       {/* Left Column - Analysis Results */}
//       <div className="lg:col-span-2">
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
//               <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
//                 <div className="col-span-5 break-words">BIOS LOGS</div>
//                 <div className="col-span-2 break-words">TYPE</div>
//                 <div className="col-span-4 break-words">DETAILS</div>
//               </div>
              
//               {/* Table Body */}
//               <div className="divide-y divide-gray-200 dark:divide-gray-700">
//               {filteredLogs.length > 0 ? (
//                 currentLogs.map((log, index) => (
//                   <div key={index} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    
//                     {/* BIOS Log Details */}
//                     <div className="col-span-5 text-gray-900 dark:text-white break-words">
//                       <div>{log.Input}</div>
//                     </div>

//                     {/* Event Type (Normal / Anomaly) */}
//                     <div className="col-span-2 flex justify-center items-center">
//                       <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
//                         ${log.Output === 'Normal' 
//                           ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
//                           : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
//                         {log.Output}
//                       </span>
//                     </div>

//                     {/* Reason / Details */}
//                     <div className="col-span-5 text-gray-600 dark:text-gray-300">
//                       {log.Details}
//                     </div>

//                   </div>
//                 ))
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
//       </div>

//         {/* Right Column - Distribution and Quick Actions */}
//         <div className="lg:col-span-1 space-y-8">
//           {/* Distribution Chart */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Distribution of Logs
//             </h3>
//             <div className="flex flex-col items-center gap-6">
//               <div className="h-48 w-full">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={distributionData}
//                       cx="50%"
//                       cy="50%"
//                       innerRadius={40}
//                       outerRadius={60}
//                       paddingAngle={5}
//                       dataKey="value"
//                     >
//                       {distributionData.map((entry, index) => (
//                         <Cell key={`cell-${index}`} fill={entry.color} />
//                       ))}
//                     </Pie>
//                   </PieChart>
//                 </ResponsiveContainer>
//               </div>
//               <div className="flex flex-row gap-5 w-full flex-wrap justify-center">
//                 {distributionData.map((entry, index) => (
//                   <div key={index} className="flex items-center gap-3">
//                     <div 
//                       className="w-4 h-4 rounded-full"
//                       style={{ backgroundColor: entry.color }}
//                     />
//                     <div className="flex flex-col">
//                       <span className="text-sm font-medium text-gray-900 dark:text-white">
//                         {entry.name}
//                       </span>
//                       <span className="text-xs text-gray-500 dark:text-gray-400">
//                         {entry.value}% of logs
//                       </span>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Quick Actions
//             </h3>
            
//             <div className="space-y-3">  
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={(prev) => setIsExtentOpen(true)}>
//                 <FileText size={18} className="text-primary-light" />
//                 <span className="text-sm text-gray-900 dark:text-white">Extent Report</span>
//               </button>
              
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick = {exportToCSV}>
//                 <Download size={18} className="text-primary-light" />
//                 <span className="text-sm text-gray-900 dark:text-white">Export Analysis</span>
//               </button>
//             </div>

//           </div>
//         </div>
//       </div>

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
//               <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Upload Log File</p>
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
//                   accept=".txt"
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


//        {/* Extent Report Modal */}
//        {isExtentOpen && (
//         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
//           <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-[90%] max-w-[600px]">
//             {/* Modal Header */}
//             <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extent Report</h2>
//               <button onClick={() => setIsExtentOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
//                 ✖
//               </button>
//             </div>

//             {/* Modal Body */}
//             <div className="p-4 max-h-[500px] overflow-auto text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg">
//               {analysisResults.logResults.map((log, index) => (
//                 <div key={index} className="mb-4 p-3 border-b border-gray-300 dark:border-gray-700">
//                 {log.Input.split(/(Event PCR Index:.*?)(?=Event Type:|$)|(Event Type:.*?)(?=SHA1 Digest:|$)|(SHA1 Digest:.*?)(?=Event Size:|$)|(Event Size:.*?)(?=$)/g)
//                   .filter(Boolean)
//                   .map((line, i) => (
//                     <p key={i} className="mb-1">{line}</p>
//                   ))}
//               </div>
//               ))}
//             </div>

//           </div>
//         </div>
//       )}

//     </div>
//   );
// };

// export default BiosAnalyserDetail;

import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  Upload, 
  Play,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  BarChart,
  FileText,
  XCircle,
  Download, 
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';


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

const BiosAnalyserDetail = () => {
  const location = useLocation();
  const formData = location.state?.formData;
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedModel, setSelectedModel] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtentOpen, setIsExtentOpen] = useState(false);
  const [analysisResults, setAnalysisResults] = useState({
    totalLogs: 0, 
    normalLogs: 0, 
    anomalyLogs: 0, 
    logResults: []
    });

  const [searchTerm, setSearchTerm] = useState("");

  // pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 7; // Number of items per page

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Filter logs based on search term (case-insensitive)
  const filteredLogs = analysisResults.logResults.filter(log =>
    log.Input.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.Output.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination indexes
  const indexOfLastJob = currentPage * jobsPerPage;
  const indexOfFirstJob = indexOfLastJob - jobsPerPage;
  const currentLogs = filteredLogs.slice(indexOfFirstJob, indexOfLastJob);
  const totalPages = Math.ceil(filteredLogs.length / jobsPerPage);

  const [distributionData, setDistributionData] = useState([
    { name: 'Normal', value: 50, color: '#2196F3' }, // Blue for Normal
    { name: 'Anomaly', value: 50, color: '#FF9800' } // Orange for Anomaly
  ]);

  const metrics = [
    { label: 'Total Logs', value: analysisResults.totalLogs, icon: <AlertCircle size={20} />, bgColor: 'bg-blue-100 dark:bg-blue-900', textColor: 'text-blue-600 dark:text-blue-200' },
    { label: 'Normal Logs', value: analysisResults.normalLogs, icon: <CheckCircle size={20} />, bgColor: 'bg-green-100 dark:bg-green-900', textColor: 'text-green-600 dark:text-green-200' },
    { label: 'Anomaly Logs', value: analysisResults.anomalyLogs, icon: <AlertTriangle size={20} />, bgColor: 'bg-red-100 dark:bg-yellow-900', textColor: 'text-yellow-600 dark:text-yellow-200' }
  ];

  const handleBrowseFiles = () => {
    document.getElementById('file-upload').click();
  };

  const handleFileChange = (event) => {
    // const file = event.target.files[0];
    // if (file) setSelectedFile(file.name);
    if (event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
      setShowModal(true);
    }
  };

  const handleStartAnalysis = async () => {
    if (!selectedFile) {
      alert('Please select a log file for analysis');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const response = await fetch('http://localhost:8010/bios_logs/generate', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const data = await response.json();
      // console.log("Data recieved:", data)
      console.log("Filtered Logs:", filteredLogs.length);
      console.log("Pagination: ", indexOfFirstJob, "to", indexOfLastJob);
      console.log("Current Logs:", currentLogs.length);
      // Handle the response data here

      const total = data.total;
      const normal = data.normal_counts;
      const anomaly = data.anomaly_counts;
      const chat_messages = data.chat_messages || [];

      const normalPercent = total > 0 ? ((normal/total) * 100).toFixed(0) : 0;
      const anomalyPercent = total > 0 ? ((anomaly/total) * 100).toFixed(0) : 0;

      // Set Values in count boxes
      setAnalysisResults({
        totalLogs: total,
        normalLogs: normal,
        anomalyLogs: anomaly,
        logResults: chat_messages
      });

      // Set Values in Pie Chart
      setDistributionData([
        { name: 'Normal', value: parseInt(normalPercent), color: '#2196F3' },
        { name: 'Anomaly', value: parseInt(anomalyPercent), color: '#FF9800' }
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
    const header = ["Bios Logs", "Type", "Details"];
    
    // Convert the logResults to CSV rows
    const rows = analysisResults.logResults.map(log => [
      log.Input,
      log.Output,
      log.Details,
    ]);
  
    // Combine header and rows
    const csvContent = [header, ...rows]
      .map(row => row.join(","))
      .join("\n");
  
    // Trigger CSV file download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      // Create a link to download the file
      const fileName = "bios_analysis_results.csv";
      link.setAttribute("href", URL.createObjectURL(blob));
      link.setAttribute("download", fileName);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">BIOS ANALYSER</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">System BIOS analysis and verification tool</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <RefreshCw size={18} />
              Refresh Data
            </button>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Play size={18} />
              New Analysis
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {metrics.map((metric, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg col-span-2">
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
                <div className={`inline-flex p-2 ${metric.bgColor} rounded-lg ${metric.textColor}`}>
                  {metric.icon}
                </div>
              </div>
              <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">{metric.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Layout - Two Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Left Column - Analysis Results */}
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
              <div className="grid grid-cols-12 gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-700 text-xs font-medium text-gray-500 dark:text-gray-400">
                <div className="col-span-5 break-words">BIOS LOGS</div>
                <div className="col-span-2 break-words">TYPE</div>
                <div className="col-span-4 break-words">DETAILS</div>
              </div>
              
              {/* Table Body */}
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredLogs.length > 0 ? (
                currentLogs.map((log, index) => (
                  <div key={index} className="grid grid-cols-12 gap-4 px-4 py-3 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    
                    {/* BIOS Log Details */}
                    <div className="col-span-5 text-gray-900 dark:text-white break-words">
                      <div>{log.Input}</div>
                    </div>

                    {/* Event Type (Normal / Anomaly) */}
                    <div className="col-span-2 flex justify-center items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                        ${log.Output === 'Normal' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
                        {log.Output}
                      </span>
                    </div>

                    {/* Reason / Details */}
                    <div className="col-span-5 text-gray-600 dark:text-gray-300">
                      {log.Details}
                    </div>

                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  No results yet.
                </div>
              )}

              </div>

              {filteredLogs.length > 0 && (
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

        {/* Right Column - Distribution and Quick Actions */}
        <div className="lg:col-span-1 space-y-8">
          {/* Distribution Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Distribution of Logs
            </h3>
            <div className="flex flex-col items-center gap-6">
              <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distributionData}
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={60}
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
              <div className="flex flex-row gap-5 w-full flex-wrap justify-center">
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
              <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick={(prev) => setIsExtentOpen(true)}>
                <FileText size={18} className="text-primary-light" />
                <span className="text-sm text-gray-900 dark:text-white">Extent Report</span>
              </button>
              
              <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200" onClick = {exportToCSV}>
                <Download size={18} className="text-primary-light" />
                <span className="text-sm text-gray-900 dark:text-white">Export Analysis</span>
              </button>
            </div>

          </div>
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
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Upload Log File</p>
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
                  accept=".txt"
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


       {/* Extent Report Modal */}
       {isExtentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg w-[90%] max-w-[600px]">
            {/* Modal Header */}
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extent Report</h2>
              <button onClick={() => setIsExtentOpen(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                ✖
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 max-h-[500px] overflow-auto text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-800 rounded-lg">
              {analysisResults.logResults.map((log, index) => (
                <div key={index} className="mb-4 p-3 border-b border-gray-300 dark:border-gray-700">
                {log.Input.split(/(Event PCR Index:.*?)(?=Event Type:|$)|(Event Type:.*?)(?=SHA1 Digest:|$)|(SHA1 Digest:.*?)(?=Event Size:|$)|(Event Size:.*?)(?=$)/g)
                  .filter(Boolean)
                  .map((line, i) => (
                    <p key={i} className="mb-1">{line}</p>
                  ))}
              </div>
              ))}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default BiosAnalyserDetail;