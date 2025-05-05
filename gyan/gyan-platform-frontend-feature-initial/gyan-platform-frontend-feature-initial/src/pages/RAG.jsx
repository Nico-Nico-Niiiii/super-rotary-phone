


// import { useState } from 'react';
// import { 
//   Plus, 
//   Database, 
//   Search, 
//   FileText,
//   ArrowUp, 
//   ArrowDown,
//   Cpu,
//   BarChart as ChartIcon,
//   Clock
// } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
// import GyanRagModal from '../components/GyanRagModal';  // Import the modal component

// const mockRAGStats = [
//   { name: 'Jan', retrieval: 82, latency: 120, accuracy: 88 },
//   { name: 'Feb', retrieval: 85, latency: 115, accuracy: 90 },
//   { name: 'Mar', retrieval: 88, latency: 118, accuracy: 87 },
//   { name: 'Apr', retrieval: 86, latency: 122, accuracy: 89 },
//   { name: 'May', retrieval: 89, latency: 116, accuracy: 91 },
//   { name: 'Jun', retrieval: 91, latency: 114, accuracy: 92 }
// ];

// const StatsCard = ({ title, value, trend, trendValue, icon: Icon }) => (
//   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
//     <div className="flex flex-col">
//       <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</span>
//       <div className="flex items-baseline gap-2">
//         <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
//         <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
//           {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
//           <span className="text-sm">{trendValue}%</span>
//         </div>
//       </div>
//     </div>
//     <div className="mt-2">
//       <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
//         <Icon size={20} className="text-primary-light" />
//       </div>
//     </div>
//   </div>
// );

// const RAGStatusCard = ({ title, description, status, metrics }) => (
//   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
//     <div className="flex justify-between items-start mb-4">
//       <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
//       <span className={`px-2 py-1 rounded-full text-xs ${
//         status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
//         status === 'indexing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
//         'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
//       }`}>
//         {status.charAt(0).toUpperCase() + status.slice(1)}
//       </span>
//     </div>
//     <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
//     <div className="grid grid-cols-2 gap-4">
//       {metrics.map((metric, index) => (
//         <div key={index}>
//           <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
//           <p className="text-sm font-medium text-gray-900 dark:text-white">
//             {metric.value}
//             <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
//           </p>
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const RAG = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);

//   const handleModalSubmit = async (ragData) => {
//     try {
//       // Handle the RAG configuration submission
//       console.log('Submitted RAG configuration:', ragData);
//       // Add your API call or data handling logic here
      
//       // Close the modal after successful submission
//       setIsModalOpen(false);
//     } catch (error) {
//       console.error('Error submitting RAG configuration:', error);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">RAG Studio</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Build and monitor your RAG Datasets</p>
//           </div>
//           <button 
//             onClick={() => setIsModalOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//           >
//             <Plus size={20} />
//             New RAG Dataset
//           </button>
//         </div>
//       </div>

//       {/* RAG Status Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         <RAGStatusCard 
//           title="Technical Documentation"
//           description="RAG pipeline for technical documentation search"
//           status="active"
//           metrics={[
//             { label: "Documents", value: "5,234" },
//             { label: "Avg Latency", value: "180", unit: "ms" },
//             { label: "Success Rate", value: "95.5", unit: "%" },
//             { label: "Daily Queries", value: "1.2K" }
//           ]}
//         />
//         <RAGStatusCard 
//           title="Legal Documents"
//           description="Contract analysis and retrieval system"
//           status="indexing"
//           metrics={[
//             { label: "Documents", value: "3,122" },
//             { label: "Indexed", value: "65", unit: "%" },
//             { label: "Success Rate", value: "88.2", unit: "%" },
//             { label: "Daily Queries", value: "850" }
//           ]}
//         />
//         <RAGStatusCard 
//           title="Knowledge Base"
//           description="Internal knowledge base search system"
//           status="pending"
//           metrics={[
//             { label: "Documents", value: "8,456" },
//             { label: "Avg Latency", value: "210", unit: "ms" },
//             { label: "Success Rate", value: "91.8", unit: "%" },
//             { label: "Daily Queries", value: "2.1K" }
//           ]}
//         />
//       </div>

//       {/* RAG Modal */}
//       <GyanRagModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={handleModalSubmit}
//       />
//     </div>
//   );
// };

// export default RAG;






// import { useState, useEffect } from 'react';
// import { 
//   Plus, 
//   Database, 
//   Search, 
//   FileText,
//   ArrowUp, 
//   ArrowDown,
//   Cpu,
//   BarChart as ChartIcon,
//   Clock,
//   Trash2,
//   PlayCircle
// } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
// import GyanRagModal from '../components/GyanRagModal';
// import endpoints from "../endpoints.json"
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
// // delete api.defaults.headers.common['Content-Type'];

// const mockRAGStats = [
//   { name: 'Jan', retrieval: 82, latency: 120, accuracy: 88 },
//   { name: 'Feb', retrieval: 85, latency: 115, accuracy: 90 },
//   { name: 'Mar', retrieval: 88, latency: 118, accuracy: 87 },
//   { name: 'Apr', retrieval: 86, latency: 122, accuracy: 89 },
//   { name: 'May', retrieval: 89, latency: 116, accuracy: 91 },
//   { name: 'Jun', retrieval: 91, latency: 114, accuracy: 92 }
// ];

// const StatsCard = ({ title, value, trend, trendValue, icon: Icon }) => (
//   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
//     <div className="flex flex-col">
//       <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</span>
//       <div className="flex items-baseline gap-2">
//         <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
//         <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
//           {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
//           <span className="text-sm">{trendValue}%</span>
//         </div>
//       </div>
//     </div>
//     <div className="mt-2">
//       <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
//         <Icon size={20} className="text-primary-light" />
//       </div>
//     </div>
//   </div>
// );

// // const RAGStatusCard = ({ title, description, status, metrics }) => (
// //   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
// //     <div className="flex justify-between items-start mb-4">
// //       <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
// //       <span className={`px-2 py-1 rounded-full text-xs ${
// //         status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
// //         status === 'indexing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
// //         'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
// //       }`}>
// //         {status.charAt(0).toUpperCase() + status.slice(1)}
// //       </span>
// //     </div>
// //     <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
// //     <div className="grid grid-cols-2 gap-4">
// //       {metrics.map((metric, index) => (
// //         <div key={index}>
// //           <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
// //           <p className="text-sm font-medium text-gray-900 dark:text-white">
// //             {metric.value}
// //             <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
// //           </p>
// //         </div>
// //       ))}
// //     </div>
// //   </div>
// // );


// // const RAGStatusCard = ({ id, title, description, status, metrics, onDelete }) => {
// //   const [isDeleting, setIsDeleting] = useState(false);

// //   const handleDelete = async (e) => {
// //     e.stopPropagation();
// //     if (window.confirm('Are you sure you want to delete this RAG database?')) {
// //       setIsDeleting(true);
// //       try {
// //         await onDelete(id);
// //       } catch (error) {
// //         console.error('Error deleting RAG:', error);
// //       } finally {
// //         setIsDeleting(false);
// //       }
// //     }
// //   };

// //   return (
// //     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative">
// //       <div className="flex justify-between items-start mb-4">
// //         <div className="flex-1">
// //           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
// //           <span className={`px-2 py-1 rounded-full text-xs ${
// //             status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
// //             status === 'indexing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
// //             'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
// //           }`}>
// //             {status.charAt(0).toUpperCase() + status.slice(1)}
// //           </span>
// //         </div>
// //         <button
// //           onClick={handleDelete}
// //           disabled={isDeleting}
// //           className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
// //           title="Delete RAG database"
// //         >
// //           <Trash2 size={18} />
// //         </button>
// //       </div>
// //       <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
// //       <div className="grid grid-cols-2 gap-4">
// //         {metrics.map((metric, index) => (
// //           <div key={index}>
// //             <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
// //             <p className="text-sm font-medium text-gray-900 dark:text-white">
// //               {metric.value}
// //               <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
// //             </p>
// //           </div>
// //         ))}
// //       </div>
// //       {isDeleting && (
// //         <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-xl">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };


// // const RAGStatusCard = ({ id, title, description, status, metrics, onDelete }) => {
// //   const [isDeleting, setIsDeleting] = useState(false);
// //   const [isTesting, setIsTesting] = useState(false);
// //   const [testResults, setTestResults] = useState(null);
// //   const [query, setQuery] = useState("");
// //   const [showTestPanel, setShowTestPanel] = useState(false);
// //   const [queryResults, setQueryResults] = useState(null);

// //   const handleTest = async () => {
// //     setIsTesting(true);
// //     try {
// //       const response = await api.get(`${endpoints.rag.prefix}/test/${id}/status`);
// //       setTestResults(response.data);
// //       setShowTestPanel(true);
// //     } catch (error) {
// //       console.error('Error testing RAG:', error);
// //     } finally {
// //       setIsTesting(false);
// //     }
// //   };

// //   const handleQueryTest = async () => {
// //     if (!query.trim()) return;
    
// //     setIsTesting(true);
// //     try {
// //       const response = await api.post(`${endpoints.rag.prefix}/test/${id}/query`, {
// //         query: query,
// //         top_k: 3  // You can make this configurable
// //       });
// //       setQueryResults(response.data);
// //     } catch (error) {
// //       console.error('Error testing query:', error);
// //     } finally {
// //       setIsTesting(false);
// //     }
// //   };

// //   const renderVectorDBInfo = (storeInfo, vectorDb) => {
// //     switch (vectorDb) {
// //       case 'chromadb':
// //         return (
// //           <>
// //             <div>Collection: {storeInfo.collection_name}</div>
// //             <div>Documents: {storeInfo.total_documents}</div>
// //           </>
// //         );
// //       case 'pinecone':
// //         return (
// //           <>
// //             <div>Vectors: {storeInfo.total_vectors}</div>
// //             <div>Dimension: {storeInfo.dimension}</div>
// //             <div>Index Fullness: {storeInfo.index_fullness}%</div>
// //           </>
// //         );
// //       case 'weaviate':
// //         return (
// //           <>
// //             <div>Class: {storeInfo.class_name}</div>
// //             <div>Objects: {storeInfo.total_objects}</div>
// //           </>
// //         );
// //       case 'faiss':
// //         return (
// //           <>
// //             <div>Vectors: {storeInfo.total_vectors}</div>
// //             <div>Dimension: {storeInfo.dimension}</div>
// //             <div>Trained: {storeInfo.is_trained ? 'Yes' : 'No'}</div>
// //           </>
// //         );
// //       default:
// //         return <div>No specific info available</div>;
// //     }
// //   };

// //   return (
// //     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
// //       {/* Card Header */}
// //       <div className="flex justify-between items-start mb-4">
// //         <div className="flex-1">
// //           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
// //           <span className={`px-2 py-1 rounded-full text-xs ${
// //             status === 'Processed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
// //           }`}>
// //             {status}
// //           </span>
// //         </div>
// //         <div className="flex gap-2">
// //           <button
// //             onClick={handleTest}
// //             disabled={isTesting}
// //             className="p-2 text-blue-500 hover:text-blue-700 transition-colors duration-200"
// //           >
// //             <PlayCircle size={18} />
// //           </button>
// //           <button
// //             onClick={(e) => {
// //               e.stopPropagation();
// //               onDelete(id);
// //             }}
// //             disabled={isDeleting}
// //             className="p-2 text-gray-400 hover:text-red-500 transition-colors duration-200"
// //           >
// //             <Trash2 size={18} />
// //           </button>
// //         </div>
// //       </div>

// //       {/* Card Content */}
// //       <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
// //       <div className="grid grid-cols-2 gap-4">
// //         {metrics.map((metric, index) => (
// //           <div key={index}>
// //             <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
// //             <p className="text-sm font-medium text-gray-900 dark:text-white">
// //               {metric.value}
// //               <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
// //             </p>
// //           </div>
// //         ))}
// //       </div>

// //       {/* Test Panel */}
// //       {showTestPanel && testResults && (
// //         <div className="mt-4 border-t pt-4">
// //           <h4 className="text-sm font-medium mb-2">Vector Store Status</h4>
// //           <div className="space-y-2 text-sm">
// //             {renderVectorDBInfo(testResults.store_info, testResults.db_info.vector_db)}
// //           </div>

// //           {/* Query Testing */}
// //           <div className="mt-4">
// //             <h4 className="text-sm font-medium mb-2">Test Query</h4>
// //             <div className="flex gap-2">
// //               <input
// //                 type="text"
// //                 value={query}
// //                 onChange={(e) => setQuery(e.target.value)}
// //                 placeholder="Enter your test query..."
// //                 className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600"
// //               />
// //               <button
// //                 onClick={handleQueryTest}
// //                 disabled={isTesting}
// //                 className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
// //               >
// //                 Test
// //               </button>
// //             </div>

// //             {/* Query Results */}
// //             {queryResults && (
// //               <div className="mt-4 space-y-4">
// //                 <div className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
// //                   <h5 className="font-medium text-sm mb-2">Response:</h5>
// //                   <p className="text-sm">{queryResults.response}</p>
// //                 </div>

// //                 <div className="space-y-2">
// //                   <h5 className="font-medium text-sm">Similar Documents:</h5>
// //                   {queryResults.similar_documents.map((doc, index) => (
// //                     <div key={index} className="p-2 bg-gray-50 dark:bg-gray-700 rounded text-sm">
// //                       {doc}
// //                     </div>
// //                   ))}
// //                 </div>
// //               </div>
// //             )}
// //           </div>
// //         </div>
// //       )}

// //       {/* Loading Overlay */}
// //       {(isDeleting || isTesting) && (
// //         <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-xl">
// //           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
// //         </div>
// //       )}
// //     </div>
// //   );
// // };

// const RAGStatusCard = ({ id, title, description, status, metrics, onDelete }) => {
//   const [isDeleting, setIsDeleting] = useState(false);
//   const [isTesting, setIsTesting] = useState(false);
//   const [testResults, setTestResults] = useState(null);
//   const [query, setQuery] = useState("");
//   const [showTestPanel, setShowTestPanel] = useState(false);
//   const [queryResults, setQueryResults] = useState(null);

//   const handleDelete = async (e) => {
//     e.stopPropagation();
//     if (window.confirm('Are you sure you want to delete this RAG database?')) {
//       setIsDeleting(true);
//       try {
//         await onDelete(id);
//       } catch (error) {
//         console.error('Error deleting RAG:', error);
//       } finally {
//         setIsDeleting(false);
//       }
//     }
//   };

//   const handleTest = async () => {
//     setIsTesting(true);
//     try {
//       const response = await api.get(`${endpoints.rag.prefix}/test/${id}/status`);
//       console.log("Status api", response.data);
      
//       setTestResults(response.data);
//       setShowTestPanel(true);
//     } catch (error) {
//       console.error('Error testing RAG:', error);
//     } finally {
//       setIsTesting(false);
//     }
//   };

//   const handleQueryTest = async () => {
//     if (!query.trim()) return;
    
//     setIsTesting(true);
//     try {
//       const response = await api.post(`${endpoints.rag.prefix}/test/${id}/query`, {
//         query: query,
//         top_k: 3
//       });
//       setQueryResults(response.data);
//     } catch (error) {
//       console.error('Error testing query:', error);
//     } finally {
//       setIsTesting(false);
//     }
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative">
//       {/* Card Header */}
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex-1">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
//           <span className={`px-2 py-1 rounded-full text-xs ${
//             status === 'Processed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
//             status === 'indexing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
//             'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
//           }`}>
//             {status}
//           </span>
//         </div>
//         <div className="flex gap-2">
//           <button
//             onClick={handleTest}
//             disabled={isTesting}
//             className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
//             title="Test RAG database"
//           >
//             <PlayCircle size={18} />
//           </button>
//           <button
//             onClick={handleDelete}
//             disabled={isDeleting}
//             className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
//             title="Delete RAG database"
//           >
//             <Trash2 size={18} />
//           </button>
//         </div>
//       </div>

//       {/* Card Content */}
//       <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
//       <div className="grid grid-cols-2 gap-4 mb-4">
//         {metrics.map((metric, index) => (
//           <div key={index}>
//             <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
//             <p className="text-sm font-medium text-gray-900 dark:text-white">
//               {metric.value}
//               <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
//             </p>
//           </div>
//         ))}
//       </div>

//       {/* Vector Store Status Section */}
//       {showTestPanel && testResults && (
//         <div className="mt-4 border-t dark:border-gray-700 pt-4">
//           <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Vector Store Status</h4>
//           <div className="space-y-2">
//             <div>
//               <span className="text-gray-500 dark:text-gray-400">Collection:</span>
//               <span className="ml-2 text-gray-900 dark:text-white">
//                 {testResults.store_info.collection_name || 'Not found'}
//               </span>
//             </div>
//             <div>
//               <span className="text-gray-500 dark:text-gray-400">Documents:</span>
//               <span className="ml-2 text-gray-900 dark:text-white">
//                 {testResults.store_info.total_documents || 0}
//               </span>
//             </div>
//           </div>

//           {/* Test Query Section */}
//           <div className="mt-4">
//             <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Test Query</h4>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={query}
//                 onChange={(e) => setQuery(e.target.value)}
//                 placeholder="Enter your test query..."
//                 className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
//               />
//               <button
//                 onClick={handleQueryTest}
//                 disabled={isTesting}
//                 className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200"
//               >
//                 Test
//               </button>
//             </div>

//             {/* Query Results */}
//             {queryResults && (
//               <div className="mt-4 space-y-4">
//                 <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
//                   <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Response:</h5>
//                   <p className="text-gray-700 dark:text-gray-300">{queryResults.response}</p>
//                 </div>
//                 {queryResults.similar_documents?.length > 0 && (
//                   <div>
//                     <h5 className="font-medium mb-2 text-gray-900 dark:text-white">Similar Documents:</h5>
//                     <div className="space-y-2">
//                       {queryResults.similar_documents.map((doc, index) => (
//                         <div 
//                           key={index} 
//                           className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300"
//                         >
//                           {doc}
//                         </div>
//                       ))}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* Loading Overlay */}
//       {(isDeleting || isTesting) && (
//         <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-xl">
//           <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
//         </div>
//       )}
//     </div>
//   );
// };



// const RAG = () => {
//   const [isModalOpen, setIsModalOpen] = useState(false);
//   const [ragDatabases, setRagDatabases] = useState([]);
//   const [isLoading, setIsLoading] = useState(false);
//   const [error, setError] = useState(null);

  

//   const handleDelete = async (id) => {
//     try {
//       setError(null);
//       await api.delete(`${endpoints.rag.prefix}/${id}`);
//       await fetchRagDatabases(); // Refresh the list after deletion
//     } catch (error) {
//       console.error('Error deleting RAG database:', error);
//       setError(error.response?.data?.detail || error.message);
//       throw error;
//     }
//   };


//   const fetchRagDatabases = async () => {
//     try {
//       setIsLoading(true);
//       setError(null);
//       const response = await api.get(`${endpoints.rag.prefix}${endpoints.rag.routes.list}`);
//       console.log("Fetch rag db", response.data);
//       setRagDatabases(response.data);

//     } catch (error) {
//       console.error('Error fetching RAG databases:', error);
//       setError(error.response?.data?.detail || error.message);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchRagDatabases();
//   }, []);

 

//   const handleModalSubmit = async (ragData) => {
//     try {
//       setError(null);
      
//       // Create FormData object
//       const formData = new FormData();
      
//       // Append the file with the correct field name
//       if (ragData.dataset) {
//         formData.append('dataset', ragData.dataset);
//       }
      
//       // Append all other form fields
//       formData.append('name', ragData.name);
//       formData.append('rag_type', ragData.ragType);
//       formData.append('llm_model', ragData.llmModel);
//       formData.append('embedding_model', ragData.embeddingModel);
//       formData.append('chunking_option', ragData.chunkingOption);
//       formData.append('vector_db', ragData.vectorDb);
//       formData.append('search_option', ragData.searchOption);
  
//       // Make sure to set the correct headers for multipart/form-data
//       const response = await api.post(`${endpoints.rag.prefix}${endpoints.rag.routes.create}`, 
//         formData,
//         {
//           headers: {
//             'Content-Type': 'multipart/form-data',
//           },
//         }
//       );
  
//       await fetchRagDatabases(); // Refresh the list after successful creation
//       return response.data;
//     } catch (error) {
//       console.error('Error handling RAG submission:', error);
//       setError(error.response?.data?.detail || error.message);
//       throw error;
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">RAG Studio</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Build and monitor your RAG Datasets</p>
//           </div>
//           <button 
//             onClick={() => setIsModalOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//           >
//             <Plus size={20} />
//             New RAG Dataset
//           </button>
//         </div>
//       </div>

//       {/* Error display */}
//       {error && (
//         <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
//           {error}
//         </div>
//       )}

//       {/* RAG Status Grid */}
//       {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         {isLoading ? (
//           <div className="col-span-3 text-center py-8">Loading...</div>
//         ) : ragDatabases.length > 0 ? (
//           ragDatabases.map((rag) => (
//             <RAGStatusCard 
//               key={rag.id}
//               title={rag.name}
//               description={`${rag.rag_type} RAG configuration`}
//               status={rag.status.toLowerCase()}
//               metrics={[
//                 { label: "Files", value: rag.total_files },
//                 { label: "Vector DB", value: rag.vector_db },
//                 { label: "Model", value: rag.llm_model.split('/').pop() },
//                 { label: "Chunking", value: rag.chunking_option }
//               ]}
//             />
//           ))
//         ) : (
//           <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
//             No RAG databases found. Create one to get started.
//           </div>
//         )}
//       </div> */}


//       {/* RAG Status Grid */}
//   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//     {isLoading ? (
//       <div className="col-span-3 text-center py-8">Loading...</div>
//     ) : ragDatabases.length > 0 ? (
//       ragDatabases.map((rag) => (
//         <RAGStatusCard 
//           key={rag.id}
//           id={rag.id}
//           title={rag.name}
//           description={`${rag.rag_type} RAG configuration`}
//           status={rag.status.toLowerCase()}
//           metrics={[
//             { label: "Files", value: rag.total_files },
//             { label: "Vector DB", value: rag.vector_db },
//             { label: "Model", value: rag.llm_model.split('/').pop() },
//             { label: "Chunking", value: rag.chunking_option }
//           ]}
//           onDelete={handleDelete}
//         />
//       ))
//     ) : (
//       <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
//         No RAG databases found. Create one to get started.
//       </div>
//     )}
//   </div>


//       {/* Sample Stats Cards - You can remove or modify these as needed */}
//       {/* <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatsCard 
//           title="Total Documents"
//           value="12,234"
//           trend="up"
//           trendValue="8.2"
//           icon={FileText}
//         />
//         <StatsCard 
//           title="Avg Response Time"
//           value="156ms"
//           trend="down"
//           trendValue="4.3"
//           icon={Clock}
//         />
//         <StatsCard 
//           title="Search Accuracy"
//           value="94.2%"
//           trend="up"
//           trendValue="2.1"
//           icon={Search}
//         />
//         <StatsCard 
//           title="Active Models"
//           value="8"
//           trend="up"
//           trendValue="1"
//           icon={Cpu}
//         />
//       </div> */}

//       {/* Performance Chart */}
//       {/* <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Performance Metrics</h3>
//         <div className="h-72">
//           <ResponsiveContainer width="100%" height="100%">
//             <LineChart data={mockRAGStats}>
//               <XAxis dataKey="name" />
//               <YAxis />
//               <Tooltip />
//               <Line type="monotone" dataKey="retrieval" stroke="#3B82F6" strokeWidth={2} />
//               <Line type="monotone" dataKey="accuracy" stroke="#10B981" strokeWidth={2} />
//               <Line type="monotone" dataKey="latency" stroke="#F59E0B" strokeWidth={2} />
//             </LineChart>
//           </ResponsiveContainer>
//         </div>
//       </div> */}

//       {/* RAG Modal */}
//       <GyanRagModal
//         isOpen={isModalOpen}
//         onClose={() => setIsModalOpen(false)}
//         onSubmit={handleModalSubmit}
//       />
//     </div>
//   );
// };

// export default RAG;




import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  FileText,
  ArrowUp, 
  ArrowDown,
  Cpu,
  Clock,
  Trash2,
  PlayCircle,
  Copy,
  X  // Add X icon for modal close
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
import GyanRagModal from '../components/GyanRagModal';
import endpoints from "../endpoints.json"
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

const mockRAGStats = [
  { name: 'Jan', retrieval: 82, latency: 120, accuracy: 88 },
  { name: 'Feb', retrieval: 85, latency: 115, accuracy: 90 },
  { name: 'Mar', retrieval: 88, latency: 118, accuracy: 87 },
  { name: 'Apr', retrieval: 86, latency: 122, accuracy: 89 },
  { name: 'May', retrieval: 89, latency: 116, accuracy: 91 },
  { name: 'Jun', retrieval: 91, latency: 114, accuracy: 92 }
];

const StatsCard = ({ title, value, trend, trendValue, icon: Icon }) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
    <div className="flex flex-col">
      <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</span>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
        <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
          {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
          <span className="text-sm">{trendValue}%</span>
        </div>
      </div>
    </div>
    <div className="mt-2">
      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
        <Icon size={20} className="text-primary-light" />
      </div>
    </div>
  </div>
);


const CopyButton = ({ text, tooltipPosition = 'top' }) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }).catch(err => {
      console.error('Failed to copy:', err);
    });
  };

  return (
    <button 
      onClick={handleCopy}
      className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative"
      title={isCopied ? "Copied!" : "Copy"}
    >
      <Copy size={16} />
      {isCopied && (
        <span className={`absolute ${
          tooltipPosition === 'top' ? '-top-6' : '-bottom-6'
        } left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded z-10`}>
          Copied!
        </span>
      )}
    </button>
  );
};

const QueryResponseModal = ({ isOpen, onClose, response, similarDocuments }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Query Response</h2>
          <div className="flex items-center space-x-2">
            <button 
              onClick={onClose} 
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Response Section */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">Response:</h3>
              <CopyButton text={response} />
            </div>
            <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg relative">
              <p className="text-gray-700 dark:text-gray-300">{response}</p>
            </div>
          </div>

          {/* Similar Documents Section */}
          {similarDocuments && similarDocuments.length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-2 text-gray-900 dark:text-white">Similar Documents:</h3>
              <div className="space-y-2">
                {similarDocuments.map((doc, index) => (
                  <div 
                    key={index} 
                    className="p-3 bg-gray-50 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300 flex justify-between items-center"
                  >
                    <span>{doc}</span>
                    <CopyButton text={doc} tooltipPosition="bottom" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};



const RAGStatusCard = ({ id, title, description, status, metrics, onDelete }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [query, setQuery] = useState("");
  const [showTestPanel, setShowTestPanel] = useState(false);
  const [queryResults, setQueryResults] = useState(null);
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [isResponseModalOpen, setIsResponseModalOpen] = useState(false);

  const handleDelete = async (e) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this RAG database?')) {
      setIsDeleting(true);
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting RAG:', error);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleTest = async () => {
    setIsTesting(true);
    try {
      const response = await api.get(`${endpoints.rag.prefix}/test/${id}/status`);
      console.log("Status api", response.data);
      
      setTestResults(response.data);
      setShowTestPanel(true);
    } catch (error) {
      console.error('Error testing RAG:', error);
    } finally {
      setIsTesting(false);
    }
  };

  const handleQueryTest = async () => {
    if (!query.trim()) return;
    
    setIsQueryLoading(true);
    try {
      const response = await api.post(`${endpoints.rag.prefix}/test/${id}/query`, {
        query: query,
        top_k: 3
      });
      setQueryResults(response.data);
    } catch (error) {
      console.error('Error testing query:', error);
    } finally {
      setIsQueryLoading(false);
    }
  };

  const openResponseModal = () => {
    setIsResponseModalOpen(true);
  };

  const closeResponseModal = () => {
    setIsResponseModalOpen(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 relative">
      {/* Card Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <span className={`px-2 py-1 rounded-full text-xs ${
            status === 'Processed' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            status === 'indexing' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
          }`}>
            {status}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className="p-2 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
            title="Test RAG database"
          >
            <PlayCircle size={18} />
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 transition-colors duration-200"
            title="Delete RAG database"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Card Content */}
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
      <div className="grid grid-cols-2 gap-4 mb-4">
        {metrics.map((metric, index) => (
          <div key={index}>
            <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {metric.value}
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{metric.unit}</span>
            </p>
          </div>
        ))}
      </div>

      {/* Vector Store Status Section */}
      {showTestPanel && testResults && (
        <div className="mt-4 border-t dark:border-gray-700 pt-4">
          <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Vector Store Status</h4>
          <div className="space-y-2">
            <div>
              <span className="text-gray-500 dark:text-gray-400">Collection:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {testResults.store_info.collection_name || 'Not found'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400">Documents:</span>
              <span className="ml-2 text-gray-900 dark:text-white">
                {testResults.store_info.total_documents || 0}
              </span>
            </div>
          </div>

          {/* Test Query Section */}
          <div className="mt-4">
            <h4 className="text-base font-medium mb-3 text-gray-900 dark:text-white">Test Query</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter your test query..."
                className="flex-1 p-2 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <button
                onClick={handleQueryTest}
                disabled={isQueryLoading}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 transition-colors duration-200 flex items-center justify-center"
              >
                {isQueryLoading ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  'Test'
                )}
              </button>
            </div>

            {/* Show Response Button */}
            {queryResults && !isQueryLoading && (
              <div className="mt-4">
                <button
                  onClick={openResponseModal}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors duration-200"
                >
                  Show Response
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Response Modal */}
      <QueryResponseModal 
        isOpen={isResponseModalOpen}
        onClose={closeResponseModal}
        response={queryResults?.response}
        similarDocuments={queryResults?.similar_documents}
      />

      {/* Loading Overlay */}
      {(isDeleting || isTesting) && (
        <div className="absolute inset-0 bg-white/50 dark:bg-gray-800/50 flex items-center justify-center rounded-xl">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
        </div>
      )}
    </div>
  );
};

const RAG = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [ragDatabases, setRagDatabases] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDelete = async (id) => {
    try {
      setError(null);
      await api.delete(`${endpoints.rag.prefix}/${id}`);
      await fetchRagDatabases(); // Refresh the list after deletion
    } catch (error) {
      console.error('Error deleting RAG database:', error);
      setError(error.response?.data?.detail || error.message);
      throw error;
    }
  };

  const fetchRagDatabases = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get(`${endpoints.rag.prefix}${endpoints.rag.routes.list}`);
      console.log("Fetch rag db", response.data);
      setRagDatabases(response.data);
    } catch (error) {
      console.error('Error fetching RAG databases:', error);
      setError(error.response?.data?.detail || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRagDatabases();
  }, []);

  const handleModalSubmit = async (ragData) => {
    try {
      setError(null);
      
      // Create FormData object
      const formData = new FormData();
      
      // Append the file with the correct field name
      if (ragData.dataset) {
        formData.append('dataset', ragData.dataset);
      }
      
      // Append all other form fields
      formData.append('name', ragData.name);
      formData.append('rag_type', ragData.ragType);
      formData.append('llm_model', ragData.llmModel);
      formData.append('embedding_model', ragData.embeddingModel);
      formData.append('chunking_option', ragData.chunkingOption);
      formData.append('vector_db', ragData.vectorDb);
      formData.append('search_option', ragData.searchOption);
  
      // Make sure to set the correct headers for multipart/form-data
      const response = await api.post(`${endpoints.rag.prefix}${endpoints.rag.routes.create}`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );
  
      await fetchRagDatabases(); // Refresh the list after successful creation
      return response.data;
    } catch (error) {
      console.error('Error handling RAG submission:', error);
      setError(error.response?.data?.detail || error.message);
      throw error;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">RAG Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Build and monitor your RAG Datasets</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New RAG
          </button>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg">
          {error}
        </div>
      )}

      {/* RAG Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-3 text-center py-8">Loading...</div>
        ) : ragDatabases.length > 0 ? (
          ragDatabases.map((rag) => (
            <RAGStatusCard 
              key={rag.id}
              id={rag.id}
              title={rag.name}
              description={`${rag.rag_type} RAG configuration`}
              status={rag.status.toLowerCase()}
              metrics={[
                { label: "Files", value: rag.total_files },
                { label: "Vector DB", value: rag.vector_db },
                { label: "Model", value: rag.llm_model.split('/').pop() },
                { label: "Chunking", value: rag.chunking_option }
              ]}
              onDelete={handleDelete}
            />
          ))
        ) : (
          <div className="col-span-3 text-center py-8 text-gray-500 dark:text-gray-400">
            No RAG databases found. Create one to get started.
          </div>
        )}
      </div>

      {/* RAG Modal */}
      <GyanRagModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleModalSubmit}
      />
    </div>
  );
};

export default RAG;