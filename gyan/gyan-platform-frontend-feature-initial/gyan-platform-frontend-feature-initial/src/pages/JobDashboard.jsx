// import React,{useState, useEffect} from 'react';
// import { useNavigate, useParams,useLocation } from 'react-router-dom';
// import { 
//   Box,
//   Database,
//   Cpu,
//   PlayCircle,
//   Clock,
//   Package,
//   Gauge,
//   ActivitySquare,
//   Target
// } from 'lucide-react';
// import { 
//   LineChart,
//   Line,
//   XAxis, 
//   YAxis,
//   ZAxis,
//   CartesianGrid, 
//   Tooltip, 
//   ResponsiveContainer,
//   PieChart,
//   Pie,
//   Cell
// } from 'recharts';
// import endpoints from '../endpoints.json';
// import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_APP_API_URL

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// function JobDashboard() {
//   const navigate = useNavigate();
 
//   const { id } = useParams();

//   const [data, setData] = useState({
//     batch_size: 0,
//     epoch: 0,
//     eval_loss: 0,
//     id: 0,
//     job_name: "",
//     learning_rate: 0,
//     model_name: "",
//     project_name: "",
//     status: "",
//     step: 0,
//     task_id: "27726f81-0a0a-4d2c-be96-43afd227c706",
//     timestamp: "2025-01-07T16:14:33.492659+05:30",
//     total_epochs: 0,
//     train_loss: 0,
//     user_email: ""
//   });

//   useEffect(() => {
//     const intervalId = setInterval(() => {
//       fetchJobs();
//       fetchAllLogs();
//     }, 2000); 
  
  
//     return () => clearInterval(intervalId);
//   }, []); 

//   const fetchJobs = async () => {
//     // try {
//       // setLoading(true);
//       const response = await api.get(
//         `${endpoints.training_logs.prefix}${endpoints.training_logs.routes.get_latest.replace('{job_id}', id)}`
//       );
//       // console.log(response.data);
//       setData(response.data);
      
//   };

// const fetchAllLogs = async () => {
//   const response = await api.get(
//     `${endpoints.training_logs.prefix}${endpoints.training_logs.routes.get_logs.replace(`{job_id}`,id)}`
//   );
//   console.log("Whole logs",response);
  
// }

  

//   // line chart data
//   const chartData = [
//     { time: '10', trainLoss: 13, validationLoss: 17 },
//     { time: '20', trainLoss: 18, validationLoss: 22 },
//     { time: '30', trainLoss: 34, validationLoss: 37 },
//     { time: '40', trainLoss: 24, validationLoss: 26 },
//     { time: '50', trainLoss: 12, validationLoss: 17 },
//     { time: '60', trainLoss: 24, validationLoss: 27 },
//     { time: '70', trainLoss: 24, validationLoss: 26 },
//     { time: '80', trainLoss: 12, validationLoss: 17 }
//   ];

//   // Modern donut chart data
//   const donutData = [
//     { name: 'Completed', value: data.epoch },
//     { name: 'Remaining', value: data.total_epochs - data.epoch  }
//   ];

//   // Modern gradient colors for donut chart
//   const DONUT_COLORS = [
//     ['#00A3E0', '#3F51B5'],  // Blue gradient for completed
//     ['#E0E7FF', '#C7D2FE']   // Light blue gradient for remaining
//   ];

//   // Custom tooltip for Line chart
//   const CustomTooltip = ({ active, payload, label }) => {
//     if (active && payload && payload.length) {
//       return (
//         <div className="bg-white/90 dark:bg-gray-800/90 p-3 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
//           <p className="text-gray-500 dark:text-gray-400 text-xs mb-1">Time: {label}</p>
//           {payload.map((entry, index) => (
//             <p key={index} className="text-sm" style={{ color: entry.stroke }}>
//               {entry.name}: {entry.value}
//             </p>
//           ))}
//         </div>
//       );
//     }
//     return null;
//   };

//   // Modern donut chart tooltip
//   const CustomDonutTooltip = ({ active, payload }) => {
//     if (active && payload && payload.length) {
//       const data = payload[0];
//       return (
//         <div className="bg-gray-900 p-3 rounded-md shadow-lg border border-gray-700">
//           <p className="text-gray-400 text-xs mb-1">{data.name}</p>
//           <p className="text-white font-semibold">
//             {data.value} {data.name === 'Completed' ? 'epochs' : ''}
//           </p>
//         </div>
//       );
//     }
//     return null;
//   };

//   // Training configuration metrics
//   const configMetrics = [
//     {
//       label: "Status",
//       value: data.status,
//       icon: <PlayCircle className="w-5 h-5 text-emerald-500" />
//     },
//     {
//       label: "Epochs",
//       value: `${data.epoch}/${data.total_epochs}`,
//       icon: <Clock className="w-5 h-5 text-blue-500" />
//     },
//     {
//       label: "Batch Size",
//       value: data.batch_size,
//       icon: <Package className="w-5 h-5 text-purple-500" />
//     },
//     {
//       label: "Learning Rate",
//       value: data.learning_rate,
//       icon: <Gauge className="w-5 h-5 text-orange-500" />
//     },
//     {
//       label: "Train Loss",
//       value: data.train_loss,
//       icon: <ActivitySquare className="w-5 h-5 text-red-500" />
//     },
//     {
//       label: "Validation Loss",
//       value: data.eval_loss,
//       icon: <Target className="w-5 h-5 text-indigo-500" />
//     }
//   ];

//   // Custom gradient for donut chart
//   const renderGradients = () => (
//     <defs>
//       {DONUT_COLORS.map((colors, index) => (
//         <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
//           <stop offset="0%" stopColor={colors[0]} />
//           <stop offset="100%" stopColor={colors[1]} />
//         </linearGradient>
//       ))}
//     </defs>
//   );

//   return (
//     <div className="flex flex-col min-h-screen bg-#F7F8FC dark:bg-gray-900 p-6">
//       {/* Project Name */}
//       <div className="flex flex-col space-y-1 mb-4">
//         <span className="text-sm text-gray-500 dark:text-gray-400">Project</span>
//       <div className="text-xl font-bold text-gray-900 dark:text-white mb-6">
//         {data.project_name}
//       </div>
//       </div>

//       {/* Main Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
//         {/* Left Column */}
//         <div className="lg:col-span-3 flex flex-col gap-6">
//           {/* Top Stats */}
//           <div className="grid grid-cols-3 gap-4">
//             {/* Training Job */}
//             <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm h-22">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-full">
//                   <Box className="w-6 h-6 text-blue-500" />
//                 </div>
//                 <div>
//                   <span className="text-xs text-gray-500">Job Name</span>
//                   <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.job_name}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Base Model */}
//             <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm h-22">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-full">
//                   <Database className="w-6 h-6 text-orange-500" />
//                 </div>
//                 <div>
//                   <span className="text-xs text-gray-500">Foundation Model</span>
//                   <p className="text-sm font-semibold text-gray-900 dark:text-white">{data.model_name}</p>
//                 </div>
//               </div>
//             </div>

//             {/* Model Type */}
//             <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow-sm h-22">
//               <div className="flex items-center gap-3">
//                 <div className="p-2 bg-pink-100 dark:bg-pink-900/20 rounded-full">
//                   <Cpu className="w-6 h-6 text-pink-500" />
//                 </div>
//                 <div>
//                   <span className="text-xs text-gray-500">Model Type</span>
//                   <p className="text-sm font-semibold text-gray-900 dark:text-white">LLM</p>
//                 </div>
//               </div>
//             </div>
//           </div>

//           {/* Charts Section */}
//           <div className="grid grid-cols-2 gap-6">
//           <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm">
//             {/* line chart */}
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Progress</h3>
//             <div className="h-[250px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart
//                   data={chartData}
//                   margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
//                 >
//                   <CartesianGrid 
//                     strokeDasharray="3 3" 
//                     stroke="#374151" 
//                     opacity={0.2} 
//                     vertical={false}
//                   />
//                   <XAxis 
//                     dataKey="time" 
//                     stroke="#9CA3AF"
//                     tick={{ fill: '#6B7280', fontSize: 12 }}
//                     tickLine={{ stroke: '#6B7280' }}
//                     axisLine={{ stroke: '#6B7280', opacity: 0.2 }}
//                   />
//                   <YAxis 
//                     stroke="#9CA3AF"
//                     tick={{ fill: '#6B7280', fontSize: 12 }}
//                     tickLine={{ stroke: '#6B7280' }}
//                     axisLine={{ stroke: '#6B7280', opacity: 0.2 }}
//                   />
//                   <Tooltip content={<CustomTooltip />} />
//                   <Line 
//                     type="monotone"
//                     name="Train Loss"
//                     dataKey="trainLoss"
//                     stroke="#3B82F6"
//                     strokeWidth={2}
//                     dot={false}
//                     activeDot={{ r: 4, fill: '#3B82F6' }}
//                   />
//                   <Line 
//                     type="monotone"
//                     name="Validation Loss"
//                     dataKey="validationLoss"
//                     stroke="#EF4444"
//                     strokeWidth={2}
//                     dot={false}
//                     activeDot={{ r: 4, fill: '#EF4444' }}
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//             {/* Modern Donut Chart */}
//             <div className="bg-white dark:bg-gray-800 p-6 rounded-md shadow-sm">
//               <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Epochs Progress</h3>
//               <div className="h-[250px] relative">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     {renderGradients()}
//                     <Pie
//                       data={donutData}
//                       innerRadius="75%"
//                       outerRadius="90%"
//                       paddingAngle={4}
//                       dataKey="value"
//                       startAngle={90}
//                       endAngle={-270}
//                     >
//                       {donutData.map((entry, index) => (
//                         <Cell 
//                           key={`cell-${index}`} 
//                           fill={`url(#gradient-${index})`}
//                           strokeWidth={0}
//                         />
//                       ))}
//                     </Pie>
//                     <Tooltip content={<CustomDonutTooltip />} />
//                   </PieChart>
//                 </ResponsiveContainer>
//                 <div className="absolute inset-0 flex flex-col items-center justify-center">
//                   <div className="text-center space-y-1">
//                     <p className="text-3xl font-bold text-gray-900 dark:text-white">
//                       {data.epoch}
//                     </p>
//                     <div className="space-y-0.5">
//                       <p className="text-sm font-medium text-gray-900 dark:text-white">Epochs</p>
//                       <p className="text-xs text-gray-500">out of {data.total_epochs}</p>
//                     </div>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* Training Configuration Section */}
//         <div>
//           {/* Main Training Config Card */}
//           <div className="bg-white dark:bg-blue-900/20 p-3 rounded-md flex items-center pl-16 shadow-sm h-15 mb-4">
//             <div className="flex items-center space-x-2">
//               <div>
//                 <p className="text-gray-900 dark:text-white text-md font-semibold">Training Status</p>
//               </div>
//             </div>
//           </div>

//           {/* Metric Cards Grid */}
//           <div className="grid grid-cols-2 gap-4">
//             {configMetrics.map((metric, index) => (
//               <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-md shadow-sm">
//                 <div className="flex items-center gap-2 mb-1">
//                   {metric.icon}
//                   <p className="text-xs text-gray-500">{metric.label}</p>
//                 </div>
//                 <p className="text-gray-900 dark:text-white font-semibold">{metric.value}</p>
//               </div>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default JobDashboard;



















// // new UI
// import React, { useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { 
//   Box, Database, Cpu, PlayCircle, Clock, Package, 
//   Gauge, ActivitySquare, Target, ChevronRight, 
//   ArrowUpRight, ArrowDownRight, Zap
// } from 'lucide-react';
// import { 
//   LineChart, Line, XAxis, YAxis, CartesianGrid, 
//   Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
// } from 'recharts';
// import { animate } from 'framer-motion';

// import endpoints from '../endpoints.json';
// import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_APP_API_URL

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// const JobDashboard = () => {
//   // Your existing state and API setup...

//   // Enhanced status badge component
//   const StatusBadge = ({ status }) => {
//     const getStatusColor = () => {
//       switch (status?.toLowerCase()) {
//         case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
//         case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
//         case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
//         default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
//       }
//     };

//     return (
//       <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
//         {status}
//       </span>
//     );
//   };

//   // Training metrics cards with animations
//   const MetricCard = ({ label, value, icon, trend }) => {
//     const getTrendColor = () => {
//       if (!trend) return '';
//       return trend > 0 ? 'text-green-500' : 'text-red-500';
//     };

//     return (
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
//         <div className="flex justify-between items-start">
//           <div className="space-y-2">
//             <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
//             <div className="flex items-baseline space-x-2">
//               <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
//               {trend && (
//                 <span className={`flex items-center ${getTrendColor()}`}>
//                   {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
//                   {Math.abs(trend)}%
//                 </span>
//               )}
//             </div>
//           </div>
//           <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
//             {icon}
//           </div>
//         </div>
//       </div>
//     );
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
//       {/* Header Section */}
//       <div className="mb-8">
//         <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
//           <span>Projects</span>
//           <ChevronRight size={16} />
//           <span>Training Jobs</span>
//           <ChevronRight size={16} />
//           <span className="text-gray-900 dark:text-white">{data.job_name}</span>
//         </div>
//         <div className="flex justify-between items-center">
//           <div>
//             <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
//               {data.project_name}
//             </h1>
//             <div className="flex items-center space-x-4">
//               <StatusBadge status={data.status} />
//               <span className="text-sm text-gray-500 dark:text-gray-400">
//                 Started {new Date(data.timestamp).toLocaleDateString()}
//               </span>
//             </div>
//           </div>
//           <div className="flex items-center space-x-3">
//             <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
//               View Logs
//             </button>
//             <button className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center space-x-2">
//               <Zap size={16} />
//               <span>Actions</span>
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Main Grid */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left Column - Progress Charts */}
//         <div className="lg:col-span-2 space-y-8">
//           {/* Training Progress Chart */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
//             <div className="flex justify-between items-center mb-6">
//               <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training Progress</h2>
//               <div className="flex items-center space-x-4">
//                 <div className="flex items-center space-x-2">
//                   <div className="w-3 h-3 rounded-full bg-blue-500"></div>
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Train Loss</span>
//                 </div>
//                 <div className="flex items-center space-x-2">
//                   <div className="w-3 h-3 rounded-full bg-red-500"></div>
//                   <span className="text-sm text-gray-500 dark:text-gray-400">Validation Loss</span>
//                 </div>
//               </div>
//             </div>
//             <div className="h-[300px]">
//               <ResponsiveContainer width="100%" height="100%">
//                 <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
//                   <defs>
//                     <linearGradient id="trainGradient" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
//                       <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
//                     </linearGradient>
//                     <linearGradient id="validationGradient" x1="0" y1="0" x2="0" y2="1">
//                       <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
//                       <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
//                     </linearGradient>
//                   </defs>
//                   <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
//                   <XAxis 
//                     dataKey="time"
//                     className="text-gray-500 dark:text-gray-400"
//                     tickLine={false}
//                   />
//                   <YAxis 
//                     className="text-gray-500 dark:text-gray-400"
//                     tickLine={false}
//                   />
//                   <Tooltip 
//                     contentStyle={{ 
//                       backgroundColor: 'rgba(255, 255, 255, 0.8)',
//                       borderRadius: '8px',
//                       border: 'none',
//                       boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
//                     }}
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="trainLoss"
//                     stroke="#3B82F6"
//                     strokeWidth={2}
//                     dot={false}
//                     activeDot={{ r: 6 }}
//                     fillOpacity={1}
//                     fill="url(#trainGradient)"
//                   />
//                   <Line
//                     type="monotone"
//                     dataKey="validationLoss"
//                     stroke="#EF4444"
//                     strokeWidth={2}
//                     dot={false}
//                     activeDot={{ r: 6 }}
//                     fillOpacity={1}
//                     fill="url(#validationGradient)"
//                   />
//                 </LineChart>
//               </ResponsiveContainer>
//             </div>
//           </div>

//           {/* Metrics Grid */}
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//             <MetricCard
//               label="Training Loss"
//               value={data.train_loss.toFixed(4)}
//               icon={<ActivitySquare className="text-blue-500" size={20} />}
//               trend={-2.4}
//             />
//             <MetricCard
//               label="Validation Loss"
//               value={data.eval_loss.toFixed(4)}
//               icon={<Target className="text-red-500" size={20} />}
//               trend={1.2}
//             />
//             <MetricCard
//               label="Learning Rate"
//               value={data.learning_rate}
//               icon={<Gauge className="text-purple-500" size={20} />}
//             />
//           </div>
//         </div>

//         {/* Right Column - Training Details */}
//         <div className="space-y-8">
//           {/* Progress Card */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Progress</h3>
//             <div className="relative pt-4">
//               <div className="h-[200px]">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <PieChart>
//                     <Pie
//                       data={donutData}
//                       innerRadius={60}
//                       outerRadius={80}
//                       paddingAngle={5}
//                       dataKey="value"
//                     >
//                       {donutData.map((entry, index) => (
//                         <Cell
//                           key={`cell-${index}`}
//                           fill={index === 0 ? '#3B82F6' : '#E5E7EB'}
//                         />
//                       ))}
//                     </Pie>
//                   </PieChart>
//                 </ResponsiveContainer>
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <div className="text-center">
//                     <p className="text-3xl font-bold text-gray-900 dark:text-white">
//                       {Math.round((data.epoch / data.total_epochs) * 100)}%
//                     </p>
//                     <p className="text-sm text-gray-500 dark:text-gray-400">
//                       Complete
//                     </p>
//                   </div>
//                 </div>
//               </div>
//               <div className="text-center mt-4">
//                 <p className="text-sm text-gray-500 dark:text-gray-400">
//                   {data.epoch} of {data.total_epochs} epochs completed
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Training Details */}
//           <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
//             <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Details</h3>
//             <div className="space-y-4">
//               <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
//                 <span className="text-sm text-gray-500 dark:text-gray-400">Model</span>
//                 <span className="text-sm font-medium text-gray-900 dark:text-white">{data.model_name}</span>
//               </div>
//               <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
//                 <span className="text-sm text-gray-500 dark:text-gray-400">Batch Size</span>
//                 <span className="text-sm font-medium text-gray-900 dark:text-white">{data.batch_size}</span>
//               </div>
//               <div className="flex justify-between items-center py-2">
//                 <span className="text-sm text-gray-500 dark:text-gray-400">Created By</span>
//                 <span className="text-sm font-medium text-gray-900 dark:text-white">{data.user_email}</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default JobDashboard;








// latest ui
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { 
  Box, Database, Cpu, PlayCircle, Clock, Package, 
  Gauge, ActivitySquare, Target, ChevronRight, 
  ArrowUpRight, ArrowDownRight, Zap
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { animate } from 'framer-motion';
import endpoints from '../endpoints.json';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const JobDashboard = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const jobInfo = location.state;
  const [logsData, setLogsData] = useState([]);
  console.log("JOB Info",jobInfo);
  

  const [data, setData] = useState({
    batch_size: 0,
    epoch: 0,
    eval_loss: 0,
    id: 0,
    job_name: "",
    learning_rate: 0,
    model_name: "",
    project_name: "",
    status: "",
    step: 0,
    task_id: "27726f81-0a0a-4d2c-be96-43afd227c706",
    timestamp: "2025-01-07T16:14:33.492659+05:30",
    total_epochs: 0,
    train_loss: 0,
    user_email: ""
  });

  // Line chart data
  const chartData = useMemo(() => {
    if (!logsData.length) return [];
    
    const firstTimestamp = new Date(logsData[0].timestamp).getTime();
    
    return logsData.map(log => {
      const currentTime = new Date(log.timestamp).getTime();
      const timeDiffInSeconds = Math.floor((currentTime - firstTimestamp) / 1000);
      
      return {
        time: timeDiffInSeconds,
        timeLabel: `${timeDiffInSeconds}s`,
        trainLoss: log.train_loss,
        validationLoss: log.eval_loss,
        epoch: log.epoch,
        step: log.step
      };
    });
  }, [logsData]);

  // Donut chart data
  const donutData = [
    { name: 'Completed', value: data.epoch },
    { name: 'Remaining', value: data.total_epochs - data.epoch }
  ];

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchJobs();
      fetchAllLogs();
    }, 2000);

    return () => clearInterval(intervalId);
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get(
        `${endpoints.training_logs.prefix}${endpoints.training_logs.routes.get_latest.replace('{job_id}', id)}`
      );
      console.log("jobs data",response.data);
      
      setData(response.data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchAllLogs = async () => {
    try {
      const response = await api.get(
        `${endpoints.training_logs.prefix}${endpoints.training_logs.routes.get_logs.replace('{job_id}', id)}`
      );

      if (response.data && Array.isArray(response.data)) {
        setLogsData(response.data);
      }
      console.log("Whole logs", response.data);
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  // Enhanced status badge component
  const StatusBadge = ({ status }) => {
    const getStatusColor = () => {
      switch (status?.toLowerCase()) {
        case 'running': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
        case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
        case 'failed': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
        default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      }
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor()}`}>
        {status}
      </span>
    );
  };

  // Training metrics cards with animations
  // const MetricCard = ({ label, value, icon, trend }) => {
  //   const getTrendColor = () => {
  //     if (!trend) return '';
  //     return trend > 0 ? 'text-green-500' : 'text-red-500';
  //   };

  //   return (
  //     <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-all">
  //       <div className="flex justify-between items-start">
  //         <div className="space-y-2">
  //           <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
  //           <div className="flex items-baseline space-x-2">
  //             <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{value}</h4>
  //             {trend && (
  //               <span className={`flex items-center ${getTrendColor()}`}>
  //                 {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
  //                 {Math.abs(trend)}%
  //               </span>
  //             )}
  //           </div>
  //         </div>
  //         <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
  //           {icon}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // };


  // return (
  //   <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
     
  //     <div className="mb-8">
  //       <div className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
  //         <span>Projects</span>
  //         <ChevronRight size={16} />
  //         <span>Training Jobs</span>
  //         <ChevronRight size={16} />
  //         <span className="text-gray-900 dark:text-white">{data.job_name}</span>
  //       </div>
  //       <div className="flex justify-between items-center">
  //         <div>
  //           <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
  //             {data.project_name}
  //           </h1>
  //           <div className="flex items-center space-x-4">
  //             <StatusBadge status={data.status} />
  //             <span className="text-sm text-gray-500 dark:text-gray-400">
  //               Started {new Date(data.timestamp).toLocaleDateString()}
  //             </span>
  //           </div>
  //         </div>
  //         <div className="flex items-center space-x-3">
  //           <button className="px-4 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
  //             View Logs
  //           </button>
  //           <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
  //             <Zap size={16} />
  //             <span>Actions</span>
  //           </button>
  //         </div>
  //       </div>
  //     </div>

   
  //     <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
     
  //       <div className="lg:col-span-2 space-y-8">
        
  //         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
  //           <div className="flex justify-between items-center mb-6">
  //             <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Training Progress</h2>
  //             <div className="flex items-center space-x-4">
  //               <div className="flex items-center space-x-2">
  //                 <div className="w-3 h-3 rounded-full bg-blue-500"></div>
  //                 <span className="text-sm text-gray-500 dark:text-gray-400">Train Loss</span>
  //               </div>
  //               <div className="flex items-center space-x-2">
  //                 <div className="w-3 h-3 rounded-full bg-red-500"></div>
  //                 <span className="text-sm text-gray-500 dark:text-gray-400">Validation Loss</span>
  //               </div>
  //             </div>
  //           </div>
  //           <div className="h-[300px]">
  //             <ResponsiveContainer width="100%" height="100%">
  //               <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
  //                 <defs>
  //                   <linearGradient id="trainGradient" x1="0" y1="0" x2="0" y2="1">
  //                     <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
  //                     <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
  //                   </linearGradient>
  //                   <linearGradient id="validationGradient" x1="0" y1="0" x2="0" y2="1">
  //                     <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3}/>
  //                     <stop offset="95%" stopColor="#EF4444" stopOpacity={0}/>
  //                   </linearGradient>
  //                 </defs>
  //                 <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
  //                 <XAxis 
  //                   dataKey="time"
  //                   className="text-gray-500 dark:text-gray-400"
  //                   tickLine={false}
  //                 />
  //                 <YAxis 
  //                   className="text-gray-500 dark:text-gray-400"
  //                   tickLine={false}
  //                 />
  //                 <Tooltip 
  //                   contentStyle={{ 
  //                     backgroundColor: 'rgba(255, 255, 255, 0.8)',
  //                     borderRadius: '8px',
  //                     border: 'none',
  //                     boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
  //                   }}
  //                 />
  //                 <Line
  //                   type="monotone"
  //                   dataKey="trainLoss"
  //                   stroke="#3B82F6"
  //                   strokeWidth={2}
  //                   dot={false}
  //                   activeDot={{ r: 6 }}
  //                   fillOpacity={1}
  //                   fill="url(#trainGradient)"
  //                 />
  //                 <Line
  //                   type="monotone"
  //                   dataKey="validationLoss"
  //                   stroke="#EF4444"
  //                   strokeWidth={2}
  //                   dot={false}
  //                   activeDot={{ r: 6 }}
  //                   fillOpacity={1}
  //                   fill="url(#validationGradient)"
  //                 />
  //               </LineChart>
  //             </ResponsiveContainer>
  //           </div>
  //         </div>

        
  //         <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
  //           <MetricCard
  //             label="Training Loss"
  //             value={data.train_loss.toFixed(4)}
  //             icon={<ActivitySquare className="text-blue-500" size={20} />}
  //             trend={-2.4}
  //           />
  //           <MetricCard
  //             label="Validation Loss"
  //             value={data.eval_loss.toFixed(4)}
  //             icon={<Target className="text-red-500" size={20} />}
  //             trend={1.2}
  //           />
  //           <MetricCard
  //             label="Learning Rate"
  //             value={data.learning_rate}
  //             icon={<Gauge className="text-purple-500" size={20} />}
  //           />
  //         </div>
  //       </div>

       
  //       <div className="space-y-8">
      
  //         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
  //           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Progress</h3>
  //           <div className="relative pt-4">
  //             <div className="h-[200px]">
  //               <ResponsiveContainer width="100%" height="100%">
  //                 <PieChart>
  //                   <Pie
  //                     data={donutData}
  //                     innerRadius={60}
  //                     outerRadius={80}
  //                     paddingAngle={5}
  //                     dataKey="value"
  //                   >
  //                     {donutData.map((entry, index) => (
  //                       <Cell
  //                         key={`cell-${index}`}
  //                         fill={index === 0 ? '#3B82F6' : '#E5E7EB'}
  //                       />
  //                     ))}
  //                   </Pie>
  //                 </PieChart>
  //               </ResponsiveContainer>
  //               <div className="absolute inset-0 flex items-center justify-center">
  //                 <div className="text-center">
  //                   <p className="text-3xl font-bold text-gray-900 dark:text-white">
  //                     {Math.round((data.epoch / data.total_epochs) * 100)}%
  //                   </p>
  //                   <p className="text-sm text-gray-500 dark:text-gray-400">
  //                     Complete
  //                   </p>
  //                 </div>
  //               </div>
  //             </div>
  //             <div className="text-center mt-4">
  //               <p className="text-sm text-gray-500 dark:text-gray-400">
  //                 {data.epoch} of {data.total_epochs} epochs completed
  //               </p>
  //             </div>
  //           </div>
  //         </div>

         
  //         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
  //           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Training Details</h3>
  //           <div className="space-y-4">
  //             <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
  //               <span className="text-sm text-gray-500 dark:text-gray-400">Model</span>
  //               <span className="text-sm font-medium text-gray-900 dark:text-white">{data.model_name}</span>
  //             </div>
  //             <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
  //               <span className="text-sm text-gray-500 dark:text-gray-400">Batch Size</span>
  //               <span className="text-sm font-medium text-gray-900 dark:text-white">{data.batch_size}</span>
  //             </div>
  //             <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
  //               <span className="text-sm text-gray-500 dark:text-gray-400">Learning Rate</span>
  //               <span className="text-sm font-medium text-gray-900 dark:text-white">{data.learning_rate}</span>
  //             </div>
  //             <div className="flex justify-between items-center py-2 border-b dark:border-gray-700">
  //               <span className="text-sm text-gray-500 dark:text-gray-400">Total Epochs</span>
  //               <span className="text-sm font-medium text-gray-900 dark:text-white">{data.total_epochs}</span>
  //             </div>
  //             <div className="flex justify-between items-center py-2">
  //               <span className="text-sm text-gray-500 dark:text-gray-400">Created By</span>
  //               <span className="text-sm font-medium text-gray-900 dark:text-white">{data.user_email}</span>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

  // Enhanced metric card for the top row
  const MetricCard = ({ label, value, icon, trend }) => {
    const getTrendColor = () => trend > 0 ? 'text-green-500' : 'text-red-500';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-start">
          <div className="space-y-2">
            <span className="text-sm text-gray-500">{label}</span>
            <div className="flex items-baseline space-x-2">
              <h4 className="text-2xl font-bold">{value}</h4>
              {trend && (
                <span className={`flex items-center ${getTrendColor()}`}>
                  {trend > 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                  {Math.abs(trend)}%
                </span>
              )}
            </div>
          </div>
          <div className="p-2 bg-gray-100 rounded-lg">
            {icon}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      {/* Enhanced Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {data.project_name}
        </h1>
        <div className="flex items-center text-lg text-gray-600 dark:text-gray-400">
          <span>{jobInfo.model_type == "Large Language Model" ? "LLM" : jobInfo.model_type}</span>
          <span className="mx-2">|</span>
          <span>{data.model_name}</span>
        </div>
      </div>

      {/* Top Metrics Grid - 4 boxes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <MetricCard
          label="Current Step"
          value={data.step}
          icon={<Package className="text-blue-500" size={20} />}
        />
        <MetricCard
          label="Epoch Progress"
          value={`${data.epoch.toFixed(1)}/${data.total_epochs}`}
          icon={<Gauge className="text-purple-500" size={20} />}
        />
        <MetricCard
          label="Training Loss"
          value={data.train_loss.toFixed(4)}
          icon={<ActivitySquare className="text-green-500" size={20} />}
        />
        <MetricCard
          label="Validation Loss"
          value={data.eval_loss.toFixed(4)}
          icon={<Target className="text-red-500" size={20} />}
        />
      </div>

      {/* Middle Section - 3 boxes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {/* Progress Donut */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Training Progress</h3>
          <div className="relative h-[300px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  innerRadius={90}
                  outerRadius={120}
                  paddingAngle={data.epoch === data.total_epochs ? 0 : 5} 
                  dataKey="value"
                  cx="50%"
                  cy="50%"
                >
                  {donutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#3B82F6' : '#E5E7EB'} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-3xl font-bold">
                  {Math.round((data.epoch / data.total_epochs) * 100)}%
                </p>
                <p className="text-sm text-gray-500">Complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Training Progress Chart */}
        {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Training Progress</h3>
          <div className="h-[200px]">
            <ResponsiveContainer>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="trainLoss" stroke="#3B82F6" />
                <Line type="monotone" dataKey="validationLoss" stroke="#EF4444" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div> */}
         {/* Training Progress Chart */}
         <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Training Progress</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span className="text-sm text-gray-500">Train Loss</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span className="text-sm text-gray-500">Validation Loss</span>
              </div>
            </div>
          </div>
          <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={chartData}
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" vertical={false} />
                <XAxis 
                  dataKey="timeLabel"
                  className="text-gray-500 dark:text-gray-400"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Time (seconds)', position: 'bottom', offset: 0 }}
                />
                <YAxis 
                  className="text-gray-500 dark:text-gray-400"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    borderRadius: '8px',
                    border: 'none',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                  cursor={{ strokeWidth: 1 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="trainLoss" 
                  stroke="#3B82F6"
                  strokeWidth={2.5}
                  dot={true}
                  activeDot={{ r: 8 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="validationLoss" 
                  stroke="#EF4444"
                  strokeWidth={2.5}
                  dot={true}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>


        {/* Training Details */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Training Details</h3>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4">
            <div className="flex justify-between items-center py-2 border-b gap-4">
              <span className="text-sm text-gray-500 min-w-[100px]">Job ID</span>
              <span className="text-sm font-medium text-right">{jobInfo.id}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Model Type</span>
              <span className="text-sm font-medium">{jobInfo.model_type === "Large Language Model" ? "LLM" : jobInfo.model_type}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">HF ID</span>
              <span className="text-sm font-medium">{jobInfo.hf_id}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b gap-4">
              <span className="text-sm text-gray-500 min-w-[100px]">Dataset Path</span>
              <span className="text-sm font-medium text-right truncate max-w-[200px]" title={jobInfo.dataset_path}>
                {jobInfo.dataset_path}
              </span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Batch Size</span>
              <span className="text-sm font-medium">{jobInfo.batch_size}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Learning Rate</span>
              <span className="text-sm font-medium">{jobInfo.learning_rate}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Token Length</span>
              <span className="text-sm font-medium">{jobInfo.token_length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Rank</span>
              <span className="text-sm font-medium">{jobInfo.rank}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Quantization</span>
              <span className="text-sm font-medium">{jobInfo.quantization}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">LoRA Optimized</span>
              <span className="text-sm font-medium">{jobInfo.lora_optimized ? 'Yes' : 'No'}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Started On</span>
              <span className="text-sm font-medium">{new Date(jobInfo.started_on).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b">
              <span className="text-sm text-gray-500">Completed At</span>
              <span className="text-sm font-medium">{jobInfo.completed_at ? new Date(jobInfo.completed_at).toLocaleString() : '-'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-gray-500">User Email</span>
              <span className="text-sm font-medium">{jobInfo.user_email}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {/* <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Training Logs</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-750">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Epoch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Step</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Training Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validation Loss</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Learning Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
             
               {logsData.map((log, index) => (
                <tr key={log.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {log.epoch}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {log.step}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {log.train_loss.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {log.eval_loss.toFixed(4)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                    {log.learning_rate}
                  </td>
                </tr>
              ))}
          
            </tbody>
          </table>
        </div>
      </div> */}

            {/* Logs Table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm mt-8">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Training Logs</h3>
        </div>
        <div className="overflow-hidden">
          <div className="max-h-[330px] overflow-y-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-750 sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-750">Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-750">Epoch</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-750">Step</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-750">Training Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-750">Validation Loss</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50 dark:bg-gray-750">Learning Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {
                [...logsData].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)) 
                .map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {log.epoch.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {log.step}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {log.train_loss.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {log.eval_loss.toFixed(4)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-300">
                      {log.learning_rate}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default JobDashboard;