// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Play, 
//   Smartphone,
//   Laptop,
//   Tablet,
//   Monitor,
//   Wifi,
//   Computer,
//   ArrowRight,
//   RefreshCw,
//   Settings,
//   CheckCircle2,
//   AlertCircle,
//   BarChart
// } from 'lucide-react';
// import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

// const DeviceTest = () => {
//   const navigate = useNavigate();

//   // Report details matching DebuggerDetails style
//   const reportDetails = {
//     ReportFile: 'Device_Test_09012025.zip',
//     CaseDate: 'CrossPlatform_v2',
//     CaseId: 'Active',
//     ComplaintId: '10:15 AM',
//     CoriVersion: '30 minutes',
//   };

//   // Metrics matching DebuggerDetails style
//   const metrics = [
//     {
//       icon: <CheckCircle2 size={20} />,
//       label: 'Device Coverage',
//       value: '95%',
//       percentage: '+3.2%',
//       bgColor: 'bg-green-100 dark:bg-green-900',
//       textColor: 'text-green-600 dark:text-green-200'
//     },
//     {
//       icon: <AlertCircle size={20} />,
//       label: 'Success Rate',
//       value: '97.8%',
//       percentage: '+1.5%',
//       bgColor: 'bg-blue-100 dark:bg-blue-900',
//       textColor: 'text-blue-600 dark:text-blue-200'
//     },
//     {
//       icon: <BarChart size={20} />,
//       label: 'Total Tests',
//       value: '3,847',
//       percentage: '+256',
//       bgColor: 'bg-purple-100 dark:bg-purple-900',
//       textColor: 'text-purple-600 dark:text-purple-200'
//     }
//   ];

//   // Distribution data for pie chart
//   const distributionData = [
//     { name: 'Mobile', value: 40, color: '#2196F3' },
//     { name: 'Desktop', value: 35, color: '#00BCD4' },
//     { name: 'Tablet', value: 25, color: '#4CAF50' }
//   ];

//   const deviceTests = [
//     { status: 'passed', name: 'Mobile UI Test Suite', id: 'TST1001' },
//     { status: 'failed', name: 'Desktop Performance Test', id: 'TST1002' },
//     { status: 'passed', name: 'Network Compatibility Check', id: 'TST1003' },
//     { status: 'passed', name: 'Cross-Platform Validation', id: 'TST1004' },
//     { status: 'failed', name: 'Hardware Integration Test', id: 'TST1005' }
//   ];

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">DEVICE TEST</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Comprehensive device testing dashboard</p>
//           </div>
//           <div className="flex items-center gap-4 mt-4 md:mt-0">
//             <button className="flex items-center gap-2 px-4 py-2 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//               <RefreshCw size={18} />
//               Refresh Data
//             </button>
//             <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200">
//               <Play size={18} />
//               New Test
//             </button>
//           </div>
//         </div>

//         {/* Report Details Grid */}
//         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
//           {Object.entries(reportDetails).map(([key, value]) => (
//             <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//               <p className="text-xs text-gray-500 dark:text-gray-400">{key.replace(/([A-Z])/g, ' $1').trim()}</p>
//               <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 relative group" title={value}>
//                 <span className="inline-block max-w-full truncate">
//                   {String(value).length > 15 ? `${String(value).slice(0, 14)}...` : value}
//                 </span>
//                 <span className="invisible group-hover:visible absolute left-0 -top-8 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
//                   {value}
//                 </span>
//               </p>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Main Content Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left Column - Metrics and Details */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Metrics Grid */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//             {metrics.map((metric, index) => (
//               <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//                 <div className={`inline-flex p-2 ${metric.bgColor} rounded-lg ${metric.textColor} mb-4`}>
//                   {metric.icon}
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
//                   {metric.value}
//                 </h4>
//                 <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                   {metric.label}
//                 </p>
//                 <p className={`text-xs mt-2 ${metric.textColor}`}>
//                   {metric.percentage}
//                 </p>
//               </div>
//             ))}
//           </div>

//           {/* Test Details */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <div className="flex justify-between items-center mb-4">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Tests</h3>
//               <select className="text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800">
//                 <option value="all">All Tests</option>
//                 <option value="mobile">Mobile Only</option>
//                 <option value="desktop">Desktop Only</option>
//                 <option value="tablet">Tablet Only</option>
//               </select>
//             </div>
//             <div className="space-y-4">
//               {deviceTests.map((test, index) => (
//                 <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
//                   <div className="flex items-center gap-3">
//                     <div className={`w-2 h-2 rounded-full ${
//                       test.status === 'passed' ? 'bg-green-500' : 'bg-red-500'
//                     }`} />
//                     <div>
//                       <p className="text-sm font-medium text-gray-900 dark:text-white">
//                         {test.name}
//                       </p>
//                       <p className="text-xs text-gray-500 dark:text-gray-400">
//                         {new Date().toLocaleTimeString()}
//                       </p>
//                     </div>
//                   </div>
//                   <span className="text-xs text-gray-500 dark:text-gray-400">
//                     ID: {test.id}
//                   </span>
//                 </div>
//               ))}
//             </div>
//           </div>
//         </div>

//         {/* Right Column - Distribution Chart and Actions */}
//         <div className="space-y-8">
//           {/* Distribution Chart */}
// <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//   <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//     Device Distribution
//   </h3>
//   <div className="flex flex-col md:flex-row items-center gap-8">
//     <div className="h-64 w-full md:w-2/3">
//       <ResponsiveContainer width="100%" height="100%">
//         <PieChart>
//           <Pie
//             data={distributionData}
//             cx="50%"
//             cy="50%"
//             innerRadius={60}
//             outerRadius={80}
//             paddingAngle={5}
//             dataKey="value"
//           >
//             {distributionData.map((entry, index) => (
//               <Cell key={`cell-${index}`} fill={entry.color} />
//             ))}
//           </Pie>
//         </PieChart>
//       </ResponsiveContainer>
//     </div>
//     <div className="flex flex-col gap-4 w-full md:w-1/3">
//       {distributionData.map((entry, index) => (
//         <div key={index} className="flex items-center gap-3">
//           <div 
//             className="w-2 h-2 rounded-full"
//             style={{ backgroundColor: entry.color }}
//           />
//           <div className="flex flex-col">
//             <span className="text-sm font-medium text-gray-900 dark:text-white">
//               {entry.name}
//             </span>
//             <span className="text-xs text-gray-500 dark:text-gray-400">
//               {entry.value}% of tests
//             </span>
//           </div>
//         </div>
//       ))}
//     </div>
//   </div>
// </div>

//           {/* Test Report */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Test Report
//             </h3>
//             <div className="space-y-4">
//               <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//                 <div className="flex justify-between items-center mb-2">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Report File:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     DeviceTest_04172024.zip
//                   </span>
//                 </div>
//                 <div className="flex justify-between items-center">
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Test Suite:</span>
//                   <span className="text-sm font-medium text-gray-900 dark:text-white">
//                     CrossPlatform_v2
//                   </span>
//                 </div>
//               </div>
//               <button className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200">
//                 <ArrowRight size={18} />
//                 View Report
//               </button>
//             </div>
//           </div>

//           {/* Quick Actions */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Quick Actions
//             </h3>
//             <div className="space-y-3">
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//                 <Laptop size={18} className="text-primary-light" />
//                 <span className="text-sm text-gray-900 dark:text-white">Run Device Test</span>
//               </button>
//               <button className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
//                 <RefreshCw size={18} className="text-primary-light" />
//                 <span className="text-sm text-gray-900 dark:text-white">Refresh Tests</span>
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DeviceTest;

import React , {useState, useEffect} from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Play, 
  Smartphone,
  Laptop,
  Tablet,
  Monitor,
  Wifi,
  Computer,
  ArrowRight,
  RefreshCw,
  Settings,
  CheckCircle2,
  AlertCircle,
  BarChart,
  FileText, 
  Loader, 
} from 'lucide-react';

const DeviceTest = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  // Report details with renamed fields
  const reportDetails = {
    reportFile: 'Device_Test_09012025.zip',
    caseDate: 'CrossPlatform_v2',
    caseId: 'Active',
    complaintId: '10:15 AM',
    coriVersion: '30 minutes'
  };

  // File Upload 
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.name.endsWith('.zip')) {
      setSelectedFile(file);
    } else {
      alert('Please upload a valid .zip file');
    }
  };

  // Function called on Start Test
  const handleStartTest = async () => {
    if (!selectedFile) {
      alert('Please upload a zip file before starting the test');
      return;
    }

    setIsLoading(true); // Show loader

    const formData = new FormData();
    formData.append('zipfile', selectedFile);

    try {
      const response = await fetch(`${API_BASE_URL}/cori_logs/analyze`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      } 

      const data = await response.json();
      console.log("Recd Data - ", data)

      setIsModalOpen(false);
      setSelectedFile(null);


    } catch (error) {
      console.error('Error starting test:', error);
      setSelectedFile(null);
      alert('Error starting test');
    } finally{
      setIsLoading(false);
      setSelectedFile(null);
    }
  };




  // Metrics matching DebuggerDetails style with new handpiece info
  const metrics = [
    {
      icon: <CheckCircle2 size={20} />,
      label: 'Handpiece Details',
      value: 'Handpiece serial number: SN001187',
      secondValue: 'Handpiece part number: 110310',
      bgColor: 'bg-green-100 dark:bg-green-900',
      textColor: 'text-green-600 dark:text-green-200'
    },
    {
      icon: <AlertCircle size={20} />,
      label: 'Handpiece Dates',
      value: 'Handpiece date of manufacture: 09/14/21',
      secondValue: 'Handpiece date of last service: 06/16/22',
      bgColor: 'bg-blue-100 dark:bg-blue-900',
      textColor: 'text-blue-600 dark:text-blue-200'
    },
    {
      icon: <BarChart size={20} />,
      label: 'Usage Stats',
      value: 'Handpiece times used since last service: 51',
      secondValue: 'Handpiece usage count: 91',
      bgColor: 'bg-purple-100 dark:bg-purple-900',
      textColor: 'text-purple-600 dark:text-purple-200'
    },
    {
      icon: <FileText size={20} />,
      label: 'Description',
      value: 'On 10/13 at 9:34 created communication error while attempting to load the bur. Exposure Motor would not extend. Attempted KPC. It failed KPC test. Opened Drill, verified Cable continuity, no problem. Verified Exposure Motor, no problem. Reassembled Drill, passed KPC, Attempted case and no problem loading bur. Grabbed log files.',
      isDescription: true,
      bgColor: 'bg-amber-100 dark:bg-amber-900',
      textColor: 'text-amber-600 dark:text-amber-200'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">DEVICE TEST</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Comprehensive device testing dashboard</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button 
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            onClick={() => setIsModalOpen(true)}
            >
              <Play size={18} />
              New Test
            </button>
          </div>
        </div>

        {/* Report Details Grid - with renamed fields */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(reportDetails).map(([key, value]) => (
            <div key={key} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {key === 'reportFile' ? 'Report File' : 
                 key === 'caseDate' ? 'Case Date' :
                 key === 'caseId' ? 'Case Id' :
                 key === 'complaintId' ? 'Complaint Id' :
                 key === 'coriVersion' ? 'Cori Version' :
                 key.replace(/([A-Z])/g, ' $1').trim()}
              </p>
              <p className="text-sm font-medium text-gray-900 dark:text-white mt-1 relative group" title={value}>
                <span className="inline-block max-w-full truncate">
                  {String(value).length > 15 ? `${String(value).slice(0, 14)}...` : value}
                </span>
                <span className="invisible group-hover:visible absolute left-0 -top-8 bg-gray-900 text-white text-xs rounded py-1 px-2 whitespace-nowrap z-10">
                  {value}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8">
        {/* Modified Metrics section - All in a single line */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {metrics.slice(0, 3).map((metric, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
              <div className={`inline-flex p-2 ${metric.bgColor} rounded-lg ${metric.textColor} mb-4`}>
                {metric.icon}
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {metric.label}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {metric.value}
                </p>
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {metric.secondValue}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Description - Full width */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
          <div className={`inline-flex p-2 ${metrics[3].bgColor} rounded-lg ${metrics[3].textColor} mb-4`}>
            {metrics[3].icon}
          </div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Description
          </h4>
          <p className="text-sm text-gray-900 dark:text-white">
            <strong>Description:</strong> {metrics[3].value}
          </p>
        </div>

        {/* Test Details and Quick Actions in two columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Test Details textarea */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Latest Tests</h3>
              </div>
              <textarea 
                className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-white resize-none border border-gray-200 dark:border-gray-600" 
                placeholder="Enter test information here..."
              ></textarea>
            </div>
          </div>

          {/* Right Column - Quick Actions */}
          <div>
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button 
                  className="w-full flex items-center gap-3 p-3 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                  onClick={() => {
                    const csvData = "Date,Device,TestType,Result,Duration\n2025-03-13,SN001187,Connectivity,PASS,30s";
                    const blob = new Blob([csvData], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.setAttribute('hidden', '');
                    a.setAttribute('href', url);
                    a.setAttribute('download', 'device_tests_export.csv');
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                  }}
                >
                  <FileText size={18} className="text-primary-light" />
                  <span className="text-sm text-gray-900 dark:text-white">Export Tests</span>
                </button>

                {/* Start Test Modal */}
                {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg max-w-sm w-full p-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Upload Zip File</h3>
                    <div className="flex items-center space-x-2 mb-4">
                      <input
                        type="file"
                        accept=".zip"
                        onChange={handleFileChange}
                        className="w-full p-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm"
                      />
                      {selectedFile && (
                        <div className="text-sm text-gray-900 dark:text-white truncate max-w-[150px]">
                          {selectedFile.name}
                        </div>
                      )}
                    </div>

                  {/* Buttons */}
                  <div className="flex justify-end space-x-2">
                    <button
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartTest}
                      disabled={!selectedFile || isLoading}
                      className={`px-4 py-2 bg-primary-light text-white rounded-lg flex hover:bg-primary-dark transition-colors
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

                      {/* Loader*/}
              {/* {isLoading && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <div className="flex flex-col items-center space-y-4 bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg">
                    <Loader size={32} className="animate-spin text-primary-light" />
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">Analyzing...</p>
                  </div>
                </div>
              )}  */}



              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceTest;