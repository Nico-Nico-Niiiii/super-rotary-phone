// import React, { useState } from 'react';
// import { 
//   Clock, 
//   BarChart2, 
//   AlertTriangle,
//   Activity,
//   Radio,
//   Wifi,
//   HandshakeIcon,
//   Upload,
//   Play,
//   Signal,
//   Cpu,
//   Bluetooth,
//   X,
//   RefreshCw,
//   FileText
// } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// const SoftwareDebuggerDetail = () => {
//   const [selectedDomain, setSelectedDomain] = useState('wifi');
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);

//   const handleRunAnalysis = () => {
//     setIsControlPanelOpen(false);
//     // Add your analysis logic here
//   };

//   const domains = [
//     { id: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth size={20} /> },
//     { id: 'kernel', label: 'Kernel', icon: <Cpu size={20} /> },
//     { id: 'network', label: 'Network', icon: <Signal size={20} /> },
//     { id: 'wifi', label: 'Wifi', icon: <Wifi size={20} /> }
//   ];

//   const primaryMetrics = [
//     { icon: <Clock size={20} />, label: 'Time Taken', value: 'NA' },
//     { icon: <BarChart2 size={20} />, label: 'Total logs', value: 'NA' },
//     { icon: <AlertTriangle size={20} />, label: 'Error/Issues', value: 'NA' },
//     { icon: <Activity size={20} />, label: 'Normal', value: 'NA' },
//   ];

//   const domainConfig = {
//     wifi: {
//       metrics: [
//         { icon: <Radio size={20} />, label: 'Disassociation', value: 'NA' },
//         { icon: <Wifi size={20} />, label: 'Disconnection', value: 'NA' },
//         { icon: <HandshakeIcon size={20} />, label: 'EP Handshake', value: 'NA' }
//       ]
//     },
//     bluetooth: {
//       metrics: [
//         { icon: <Bluetooth size={20} />, label: 'Connection Drop', value: 'NA' },
//         { icon: <Signal size={20} />, label: 'Signal Strength', value: 'NA' },
//         { icon: <HandshakeIcon size={20} />, label: 'Pairing Status', value: 'NA' }
//       ]
//     },
//     kernel: {
//       metrics: [
//         { icon: <Cpu size={20} />, label: 'CPU Usage', value: 'NA' },
//         { icon: <Activity size={20} />, label: 'System Calls', value: 'NA' },
//         { icon: <AlertTriangle size={20} />, label: 'Kernel Panics', value: 'NA' }
//       ]
//     },
//     network: {
//       metrics: [
//         { icon: <Signal size={20} />, label: 'Packet Loss', value: 'NA' },
//         { icon: <Activity size={20} />, label: 'Latency', value: 'NA' },
//         { icon: <Radio size={20} />, label: 'Connection Status', value: 'NA' }
//       ]
//     }
//   };

//   const pieChartData = [
//     { name: 'Disassociation', value: 25, color: '#2196F3' },
//     { name: 'Disconnect', value: 25, color: '#00BCD4' },
//     { name: 'Deauth', value: 25, color: '#4CAF50' },
//     { name: 'Normal', value: 25, color: '#FFC107' }
//   ];

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">SOFTWARE DEBUGGER</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered debugging analysis tool</p>
//           </div>
//           <div className="flex items-center gap-4 mt-4 md:mt-0">
//             <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//               <RefreshCw size={18} />
//               Refresh Data
//             </button>
//             <button onClick={() => setIsControlPanelOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
//               <Play size={18} />
//               New Analysis
//             </button>
//           </div>
//         </div>

//         {/* Metrics Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
//           {primaryMetrics.map((metric, index) => (
//             <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//               <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
//               <div className="flex items-center gap-2 mt-1">
//                 <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.value}</span>
//                 {metric.icon}
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left Column - Metrics and Details */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Domain Metrics */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {domainConfig[selectedDomain].metrics.map((metric, index) => (
//               <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//                 <div className="inline-flex p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-200 mb-4">
//                   {metric.icon}
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
//                   {metric.value}
//                 </h4>
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                   {metric.label}
//                 </p>
//               </div>
//             ))}
//           </div>

//           {/* Log Details */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Logs</h3>
//               <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
//                 <option value="all">All Logs</option>
//                 <option value="error">Error</option>
//                 <option value="warning">Warning</option>
//               </select>
//             </div>
//             <div className="space-y-4">
//               {Array.from({ length: 5 }).map((_, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <div className={`w-2 h-2 rounded-full ${
//                       index % 3 === 0 ? 'bg-red-500' : index % 3 === 1 ? 'bg-yellow-500' : 'bg-green-500'
//                     }`} />
//                     <div>
//                       <p className="text-sm font-medium text-gray-900 dark:text-white">
//                         {index % 3 === 0 ? 'Connection timeout error in authentication process' :
//                          index % 3 === 1 ? 'High latency detected in network response' :
//                          'System configuration updated successfully'}
//                       </p>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">
//                         {new Date().toLocaleTimeString()}
//                       </p>
//                     </div>
//                   </div>
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     ID: #{(1000 + index).toString()}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Right Column - Charts and Actions */}
//         <div className="space-y-8">
//         {/* Distribution Chart */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//           <div className="p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Distribution of Logs
//             </h3>
//             <div className="h-44">
//               <ResponsiveContainer width="100%" height="100%">
//                 <PieChart>
//                   <Pie
//                     data={pieChartData}
//                     cx="50%"
//                     cy="50%"
//                     innerRadius={40}
//                     outerRadius={55}
//                     paddingAngle={5}
//                     dataKey="value"
//                   >
//                     {pieChartData.map((entry, index) => (
//                       <Cell key={`cell-${index}`} fill={entry.color} />
//                     ))}
//                   </Pie>
//                 </PieChart>
//               </ResponsiveContainer>
//             </div>
//           </div>
//           <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
//             <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
//               {pieChartData.map((entry, index) => (
//                 <div key={index} className="flex items-center gap-1">
//                   <div 
//                     className="w-2 h-2 rounded-full"
//                     style={{ backgroundColor: entry.color }}
//                   />
//                   <span className="text-xs text-gray-600 dark:text-gray-300">
//                     {entry.name} ({entry.value}%)
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//           {/* Quick Actions */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Quick Actions
//             </h3>
//             <div className="space-y-3">
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//                 <FileText size={18} className="text-blue-600" />
//                 <span className="text-sm text-gray-900 dark:text-white">Export Report</span>
//               </button>
//               <button className="w-full flex items-center gap-3 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//                 <RefreshCw size={18} className="text-blue-600" />
//                 <span className="text-sm text-gray-900 dark:text-white">Rerun Analysis</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Modal */}
//       {isControlPanelOpen && (
//         <>
//           <div 
//             className="fixed inset-0 bg-black bg-opacity-50 z-40"
//             onClick={() => setIsControlPanelOpen(false)}
//           />
//           <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Analysis</h3>
//                 <button 
//                   onClick={() => setIsControlPanelOpen(false)}
//                   className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//                 >
//                   <X size={18} />
//                 </button>
//               </div>

//               {/* File Upload Section */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                   Upload Debug File
//                 </label>
//                 <div 
//                   className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
//                   onDragOver={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                   }}
//                   onDrop={(e) => {
//                     e.preventDefault();
//                     e.stopPropagation();
//                     const file = e.dataTransfer.files[0];
//                     if (file) {
//                       setSelectedFile(file.name);
//                     }
//                   }}
//                 >
//                   <input
//                     type="file"
//                     className="hidden"
//                     onChange={(e) => {
//                       const file = e.target.files[0];
//                       if (file) {
//                         setSelectedFile(file.name);
//                       }
//                     }}
//                     id="file-upload"
//                   />
//                   <label htmlFor="file-upload" className="cursor-pointer">
//                     <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
//                     <p className="text-sm text-gray-600 dark:text-gray-400">
//                       Drag and drop your file here or
//                     </p>
//                     <p className="text-sm text-blue-500 hover:text-blue-600 font-medium">
//                       Browse files
//                     </p>
//                   </label>
//                 </div>
//                 {selectedFile && (
//                   <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
//                     Selected: {selectedFile}
//                   </div>
//                 )}
//               </div>

//               {/* Domain Selection */}
//               <div className="mb-6">
//                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
//                   Select Domain
//                 </label>
//                 <div className="grid grid-cols-2 gap-3">
//                   {domains.map((domain) => (
//                     <label 
//                       key={domain.id} 
//                       className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700"
//                     >
//                       <input
//                         type="radio"
//                         name="domain"
//                         value={domain.id}
//                         checked={selectedDomain === domain.id}
//                         onChange={(e) => setSelectedDomain(e.target.value)}
//                         className="text-blue-600 focus:ring-blue-500"
//                       />
//                       <div className="flex items-center ml-3">
//                         <span className="text-blue-500 mr-2">{domain.icon}</span>
//                         <span className="text-sm text-gray-700 dark:text-gray-300">{domain.label}</span>
//                       </div>
//                     </label>
//                   ))}
//                 </div>
//               </div>

//               {/* Action Buttons */}
//               <div className="flex gap-3">
//                 <button 
//                   onClick={() => setIsControlPanelOpen(false)}
//                   className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
//                 >
//                   Cancel
//                 </button>
//                 <button 
//                   onClick={handleRunAnalysis}
//                   className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
//                 >
//                   <Play size={18} />
//                   Run Analysis
//                 </button>
//               </div>
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// };

// export default SoftwareDebuggerDetail;









/////// WIFI LOGS WITH HF MODEL
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Clock, 
  BarChart2, 
  AlertTriangle,
  Activity,
  Radio,
  Wifi,
  HandshakeIcon,
  Upload,
  Play,
  Signal,
  Cpu,
  Bluetooth,
  X,
  RefreshCw,
  FileText
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const SoftwareDebuggerDetail = () => {
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  const [selectedDomain, setSelectedDomain] = useState('wifi');
  const [isControlPanelOpen, setIsControlPanelOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState(null);
  const [uploadName, setUploadName] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState('all'); // default filter is 'all'
  const [logs, setLogs] = useState({ normal_logs: [], anomaly_logs: [] });
  const [total_logs, setTotalLogs] = useState([]);
  const [output, setOutput] = useState([]);
  const [loading, setLoading] = useState(false);
  const [csv_filename, setCSV] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [isTableOpen, setTable] = useState(false);
  const [list_ts, setListTs] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const logsPerPage = 10;

  const [totalPages, setTotalPages] = useState(1);


  const handleNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const startIndex = (currentPage - 1) * logsPerPage;

  const handleFileUpload = async (files) => {
    if (!files || files.length === 0) {
      alert("No files selected!");
      return;
    }
    else if(files.length == 1) {
      alert("Please provide both log file and packet capture file!!");
      return;
    }
    else if(files.length > 2) {
      alert("Please provide one packet capture file and one log file!!");
      return;
    }

    const fileData = new FormData();

    if (files[1].name.includes('.txt')) {
      fileData.append('hapd_file', files[1]);
      fileData.append('packet_file', files[0]);

    } else {
      fileData.append('hapd_file', files[0]);
      fileData.append('packet_file', files[1]);
    }

    

    setIsControlPanelOpen(false);
    setLoading(true);

    try {
      // Sending files to the server
      const file_response = await axios.post(`${API_BASE_URL}/sw_debugger/packet_loading`, fileData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setUploadName(file_response.data.upload_name);

      // Handle success response
      console.log('Files uploaded successfully:', file_response.data);
      alert('Files uploaded successfully!');  
    } catch (error) {
      // Handle error
      console.error('Error uploading files:', error);
      alert('Failed to upload files. Please try again.');
    }
    finally {
      setLoading(false); // Set loading to false after the response is received
      setIsControlPanelOpen(true);
    }
  };


  // Function to handle the change in filter selection
  const handleFilterChange = (event) => {
    const filter = event.target.value;
    setSelectedFilter(filter);
    setCurrentPage(1);
  };

  useEffect(() => {
    const normalLogs = Array.isArray(logs.normal_logs) ? logs.normal_logs : [];
    const anomalyLogs = Array.isArray(logs.anomaly_logs) ? logs.anomaly_logs : [];
  
    if (selectedFilter === 'all') {
      setTotalPages(Math.ceil(normalLogs.length / logsPerPage));
    } else if (selectedFilter === 'error') {
      setTotalPages(Math.ceil(anomalyLogs.length / logsPerPage));
    } else if (selectedFilter === 'warning') {
      setTotalPages(Math.ceil(normalLogs.filter(log => log.status === 'warning').length / logsPerPage));
    }
  }, [logs, selectedFilter, logsPerPage]);  // Update the total pages when logs or filters change
  
  // Function to filter logs based on the selectedFilter value
  const getFilteredLogs = () => {
    const normalLogs = Array.isArray(logs.normal_logs) ? logs.normal_logs : [];
    const anomalyLogs = Array.isArray(logs.anomaly_logs) ? logs.anomaly_logs : [];
  
    if (selectedFilter === 'all') {
      return normalLogs.slice(startIndex, startIndex + logsPerPage); // Return both normal and anomaly logs
    } else if (selectedFilter === 'error') {
      return anomalyLogs.slice(startIndex, startIndex + logsPerPage); // Return only anomaly logs (error logs)
    } else if (selectedFilter === 'warning') {
      return normalLogs.filter(log => log.status === 'warning').slice(startIndex, startIndex + logsPerPage); // Return only warning logs from normal logs
    }
    return [];
  };  

  const handleRunAnalysis = async() => {
    setLoading(true);

    if (!selectedFiles || selectedFiles.length == 0) {
      alert("No file selected");
      return;
    }

    
    setIsControlPanelOpen(false);

    const formData = new FormData();

    formData.append('selected_radio', selectedDomain);
    formData.append('upload_folder', uploadName);
    formData.append('selected_option', "11");
    try {
      const response = await axios.post(`${API_BASE_URL}/sw_debugger/run_analysis`, formData);

      console.log(response.data);

      // Update logs based on the response
      setLogs({ normal_logs: response.data.logs, anomaly_logs: response.data.anomalies });

      setTotalLogs(response.data.total_logs)
      setOutput(response.data.output)
      setListTs(response.data.list_ts)

      console.log(logs);

      // Update the metrics with new values (placeholders here, replace with actual data)
      setPrimaryMetrics([
        { icon: <Clock size={20} />, label: 'Time Taken', value: response.data.Placeholder1 }, 
        { icon: <BarChart2 size={20} />, label: 'Total logs', value: response.data.Placeholder2 },
        { icon: <AlertTriangle size={20} />, label: 'Error/Issues', value: response.data.Placeholder3 },
        { icon: <Activity size={20} />, label: 'Normal', value: response.data.Placeholder4 },
      ]);

      setPieChartData([
        { name: 'Disassociation', value: response.data.Placeholder9, color: '#2196F3' },
        { name: 'Disconnect', value: response.data.Placeholder11, color: '#00BCD4' },
        { name: 'Deauth', value: response.data.Placeholder10, color: '#4CAF50' },
        { name: 'Normal', value: response.data.Placeholder12, color: '#FFC107' }
      ])

      // Update domain-specific metrics
      setDomainConfig((prevConfig) => ({
        ...prevConfig,
        wifi: {
          ...prevConfig.wifi,
          metrics: prevConfig.wifi.metrics.map((metric) => {
            let newValue = 'NA';
            if (metric.label === 'Disassociation') newValue = response.data.Placeholder5 || 'NA';
            if (metric.label === 'Deauthentication') newValue = response.data.Placeholder6 || 'NA';
            if (metric.label === 'EP Handshake') newValue = response.data.Placeholder7 || 'NA';
            return { ...metric, value: newValue };
          })
        }
      }));
      
    } catch (error) {
      console.error("Error in run-analysis request:", error);
      alert(error.toString());
    }
    finally {
      setLoading(false); // Set loading to false after the response is received
    }
  };

  const handlePacketAnalysis = async() => {
      setLoading(true);
      const formData1 = new FormData();
      formData1.append('upload_name', uploadName);
      
      formData1.append('logs', new Blob([JSON.stringify(total_logs)], { type: 'application/json' }));
      formData1.append('output', new Blob([JSON.stringify(output)], { type: 'application/json' }));
      formData1.append('list_ts', new Blob([JSON.stringify(list_ts)], { type: 'application/json' }));


      if (tableData.length > 0){
        setLoading(false);
        setTable(true);
        return;
      }

      try {
        const response1 = await axios.post(`${API_BASE_URL}/sw_debugger/packet_analysis`, formData1);
        setCSV(response1.data.filename);
        setTableData(response1.data.failure_packets);

        console.log(response1.data);

        setTable(true);
      }
      catch (error) {
        console.error("Error in packet-analysis request:", error);
        alert(error.toString());
      }
      finally {
        setLoading(false);
      }
  };

  const handleExportReport = async() => {
    const formData2 = new FormData();

    formData2.append('filename', csv_filename);

    try {
      const response1 = await axios.post(`${API_BASE_URL}/sw_debugger/export_report`, formData2, {
        headers: {
          'Content-Type': 'multipart/form-data', // Ensure it's treated as form data
        },
        responseType: 'blob', // To handle the file as a blob response
      });
      // Create a link element to trigger the download
      const blob = new Blob([response1.data], { type: 'text/csv' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = csv_filename; // Specify the download file name
      link.click(); // Trigger the download
    }
    catch (error) {
      console.error("Error in export report request:", error);
      alert(error.toString());
    }


  }

  const handleClose = () => {
    // Your close logic here
    setTable(false);
  };

  const PacketTable = ({ tableData, isOpen, onClose }) => {
    if (!isOpen || !tableData || tableData.length === 0) {
      return null;
    }
  };

  const domains = [
    { id: 'bluetooth', label: 'Bluetooth', icon: <Bluetooth size={20} /> },
    { id: 'kernel', label: 'Kernel', icon: <Cpu size={20} /> },
    { id: 'network', label: 'Network', icon: <Signal size={20} /> },
    { id: 'wifi', label: 'Wifi', icon: <Wifi size={20} /> }
  ];

  // const primaryMetrics = [
  //   { icon: <Clock size={20} />, label: 'Time Taken', value: 'NA' },
  //   { icon: <BarChart2 size={20} />, label: 'Total logs', value: 'NA' },
  //   { icon: <AlertTriangle size={20} />, label: 'Error/Issues', value: 'NA' },
  //   { icon: <Activity size={20} />, label: 'Normal', value: 'NA' },
  // ];

  const [primaryMetrics, setPrimaryMetrics] = useState([
      { icon: <Clock size={20} />, label: 'Time Taken', value: 'NA' },
      { icon: <BarChart2 size={20} />, label: 'Total logs', value: 'NA' },
      { icon: <AlertTriangle size={20} />, label: 'Error/Issues', value: 'NA' },
      { icon: <Activity size={20} />, label: 'Normal', value: 'NA' },
    ]);

    const [domainConfig, setDomainConfig] = useState({
    wifi: {
      metrics: [
        { icon: <Radio size={20} />, label: 'Disassociation', value: 'NA' },
        { icon: <Wifi size={20} />, label: 'Deauthentication', value: 'NA' },
        { icon: <HandshakeIcon size={20} />, label: 'EP Handshake', value: 'NA' }
      ]
    },
    bluetooth: {
      metrics: [
        { icon: <Bluetooth size={20} />, label: 'Connection Drop', value: 'NA' },
        { icon: <Signal size={20} />, label: 'Signal Strength', value: 'NA' },
        { icon: <HandshakeIcon size={20} />, label: 'Pairing Status', value: 'NA' }
      ]
    },
    kernel: {
      metrics: [
        { icon: <Cpu size={20} />, label: 'CPU Usage', value: 'NA' },
        { icon: <Activity size={20} />, label: 'System Calls', value: 'NA' },
        { icon: <AlertTriangle size={20} />, label: 'Kernel Panics', value: 'NA' }
      ]
    },
    network: {
      metrics: [
        { icon: <Signal size={20} />, label: 'Packet Loss', value: 'NA' },
        { icon: <Activity size={20} />, label: 'Latency', value: 'NA' },
        { icon: <Radio size={20} />, label: 'Connection Status', value: 'NA' }
      ]
    }
  });

  // Initialize the state for the pie chart data
  const [pieChartData, setPieChartData] = useState([
    { name: 'Disassociation', value: 25, color: '#2196F3' },
    { name: 'Disconnect', value: 25, color: '#00BCD4' },
    { name: 'Deauth', value: 25, color: '#4CAF50' },
    { name: 'Normal', value: 25, color: '#FFC107' }
  ]);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">SOFTWARE DEBUGGER</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered debugging analysis tool</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
            onClick={() => window.location.reload()}>
              <RefreshCw size={18} />
              Refresh Data
            </button>
            <button onClick={() => setIsControlPanelOpen(true)} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200">
              <Play size={18} />
              New Analysis
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {primaryMetrics.map((metric, index) => (
            <div key={index} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">{metric.label}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-sm font-medium text-gray-900 dark:text-white">{metric.value}</span>
                {metric.icon}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Metrics and Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Domain Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {domainConfig[selectedDomain].metrics.map((metric, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
                <div className="inline-flex p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-200 mb-4">
                  {metric.icon}
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {metric.value}
                </h4>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {metric.label}
                </p>
              </div>
            ))}
          </div>

          {/* Log Details */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Logs</h3>
              <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800"
              onChange={handleFilterChange}
              value={selectedFilter}>
                <option value="all">All Logs</option>
                <option value="error">Error</option>
                <option value="warning">Warning</option>
              </select>
            </div>
            <div className="space-y-4">
              {getFilteredLogs().length > 0 ? (
                  getFilteredLogs().map((log, index) => (
                    <div
                      key={log.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-2 h-2 rounded-full ${
                            log.status === 'Anomaly'
                              ? 'bg-red-500'
                              : log.status === 'warning'
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                          }`}
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-black">{log.text}</p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">ID: #{index + 1 + startIndex}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 dark:text-gray-400">No logs yet. Run an analysis to see logs.</p>
                )}
              <div className="flex justify-between items-center pt-4">
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className="text-sm text-blue-500 disabled:text-gray-400"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-500">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="text-sm text-blue-500 disabled:text-gray-400"
                >
                  Next
                </button>
                </div>
              </div>
            </div>
          </div>

        {/* Right Column - Charts and Actions */}
        <div className="space-y-8">
        {/* Distribution Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribution of Logs
            </h3>
            <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={55}
                    paddingAngle={5}
                    dataKey="value"
                >
                    {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                </PieChart>
            </ResponsiveContainer>
            </div>
        </div>
        <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-1">
            {pieChartData.map((entry, index) => (
                <div key={index} className="flex items-center gap-1">
                <div 
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                />
                <span className="text-xs text-gray-600 dark:text-gray-300">
                    {entry.name} ({entry.value}%)
                </span>
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
            <button className="w-full flex items-center gap-3 dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handlePacketAnalysis} >
                <Play size={18} className="text-blue-600" />
                <span className="text-sm text-gray-900 dark:text-white">Packet Analysis</span>
              </button>
              <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                onClick={handleExportReport}>
                <FileText size={18} className="text-blue-600" />
                <span className="text-sm text-gray-900 dark:text-white">Export Report</span>
              </button> 
            </div>
          </div>
        </div>
      </div>

      {isTableOpen && (
        <>
          {/* Disable body scroll when modal is open */}
          <style>{`
            body { overflow: hidden; }
          `}</style>
          
          {/* Background blur effect */}
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 backdrop-blur-sm"></div>
          
          {/* Modal box */}
          <div className="fixed inset-0 flex items-center justify-center">
            <div className="relative w-full max-w-4xl mx-auto bg-white rounded-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
              <div className="p-4">
                <button 
                  onClick={handleClose}
                  variant="ghost" 
                  className="absolute right-2 top-2 p-2 hover:bg-gray-100 rounded-full"
                >
                  <X className="h-4 w-4" />
                </button>
                
                {/* Make the table container scrollable */}
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-3 text-left font-medium text-gray-700 border">Logs</th>
                        <th className="p-3 text-left font-medium text-gray-700 border">Packet Summary</th>
                        <th className="p-3 text-left font-medium text-gray-700 border">Packet Time</th>
                        <th className="p-3 text-left font-medium text-gray-700 border">Reason Code</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tableData.map((packet, index) => (
                        <tr key={index} className="hover:bg-gray-50 text-black">
                          <td className="p-3 border">
                            {packet.Logs.map((log, logIndex) => (
                              <div key={logIndex} className="mb-1 last:mb-0">
                                {log}
                              </div>
                            ))}
                          </td>
                          <td className="p-3 border">{packet.Packet_summary}</td>
                          <td className="p-3 border">{packet.Packet_time}</td>
                          <td className="p-3 border">{packet['Reason Code']}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </>
      )}


      {/* Loading Overlay - Appears when `loading` is true */}
      {loading && (
        <div className="fixed inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 z-50">
          <div className="text-center">
            <div className="spinner-border animate-spin inline-block w-12 h-12 border-4 rounded-full border-t-white"></div>
            <p className="mt-4 text-white text-lg">Please wait...</p>
          </div>
        </div>
      )}

      {/* Modal */}
      {isControlPanelOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsControlPanelOpen(false)}
          />
          <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 bg-white dark:bg-gray-800 rounded-xl shadow-xl z-50">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">New Analysis</h3>
                <button 
                  onClick={() => setIsControlPanelOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              </div>

              {/* File Upload Section */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Upload Debug Files
                </label>
                <div
                  className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files && files.length > 0) {
                      alert(files);
                      setSelectedFiles(files);
                      handleFileUpload(files);
                    }
                  }}
                >
                  <input
                    type="file"
                    multiple // Allow multiple file selection
                    className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (files && files.length > 0) {
                        setSelectedFiles(files);
                        handleFileUpload(files);
                      }
                    }}
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Drag and drop your files here or
                    </p>
                    <p className="text-sm text-blue-500 hover:text-blue-600 font-medium">
                      Browse files
                    </p>
                  </label>
                </div>
                {selectedFiles && selectedFiles.length === 2  && (
                  <div className="mt-3 text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700 p-2 rounded-lg">
                    {Array.from(selectedFiles).map((file, index) => (
                      <p key={index}>Selected{index}: {file.name}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Domain Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Select Domain
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {domains.map((domain) => (
                    <label 
                      key={domain.id} 
                      className="flex items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border border-gray-200 dark:border-gray-700"
                    >
                      <input
                        type="radio"
                        name="domain"
                        value={domain.id}
                        checked={selectedDomain === domain.id}
                        onChange={(e) => setSelectedDomain(e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex items-center ml-3">
                        <span className="text-blue-500 mr-2">{domain.icon}</span>
                        <span className="text-sm text-gray-700 dark:text-gray-300">{domain.label}</span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => setIsControlPanelOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleRunAnalysis}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                  disabled={loading}
                >
                    <Play size={18} />
                    Run Analysis
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default SoftwareDebuggerDetail;
