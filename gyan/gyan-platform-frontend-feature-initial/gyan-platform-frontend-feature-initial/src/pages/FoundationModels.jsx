// import { useState, useEffect } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, Search, History, X } from 'lucide-react';


// import axios from 'axios';
// import endpoints from '../endpoints.json';

// const BASE_URL = import.meta.env.VITE_APP_API_URL

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// const modelData = [
//   {
//     name: "Gyan/CodeLlama-7B",
//     type: "LLM",
//     description: "Code generation model based on CodeLlama with 7 billion parameters",
//     source: "codellama/CodeLlama-7b-hf"
//   },
//   {
//     name: "Gyan/Llama2-7B",
//     type: "LLM",
//     description: "Meta's Llama2 general model with 7 billion parameters",
//     source: "meta-llama/Llama-2-7b"
//   },
//   {
//     name: "Gyan/Llama3-8B",
//     type: "LLM", 
//     description: "Meta's latest Llama3 model with 8 billion parameters",
//     source: "meta-llama/Meta-Llama-3-8B"
//   },
//   {
//     name: "Gyan/Llama3.1-8B-instruct",
//     type: "LLM",
//     description: "Instruction-tuned version of Llama 3.1 with 8B parameters",
//     source: "meta-llama/Llama-3.1-8B-Instruct"
//   },
//   {
//     name: "Gyan/Mistral-7B",
//     type: "LLM",
//     description: "Open source 7B parameter model from Mistral AI",
//     source: "mistralai/Mistral-7B-v0.1"
//   },
//   {
//     name: "Gyan/MobileLLM-125M",
//     type: "LLM",
//     description: "Lightweight 125M parameter model optimized for mobile devices",
//     source: "facebook/MobileLLM-125M"
//   },
//   {
//     name: "Gyan/OPT-350M",
//     type: "LLM",
//     description: "Meta's OPT model with 350M parameters",
//     source: "facebook/opt-350m"
//   },
//   {
//     name: "Gyan/OPT-1.3B",
//     type: "LLM",
//     description: "Meta's OPT model with 1.3B parameters",
//     source: "facebook/opt-1.3b"
//   },
//   {
//     name: "Gyan/OPT-2.7B",
//     type: "LLM",
//     description: "Meta's OPT model with 2.7B parameters",
//     source: "facebook/opt-2.7b"
//   },
//   {
//     name: "Gyan/TinyLlama-1.1B",
//     type: "LLM",
//     description: "Efficient 1.1B parameter chat model",
//     source: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
//   },
//   {
//     name: "Gyan/Yi-6B",
//     type: "LLM",
//     description: "6B parameter model from 01.ai",
//     source: "01-ai/Yi-6B"
//   },
//   {
//     name: "Gyan/PaliGemma",
//     type: "Vision LLM",
//     description: "Google's vision-language model with 3B parameters",
//     source: "google/paligemma-3b-pt-224"
//   }
// ];


// const Modal = ({ isOpen, onClose, title, children }) => {
//   if (!isOpen) return null;
  
//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[90vw] max-w-6xl"> {/* Increased width */}
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
//           <button 
//             onClick={onClose}
//             className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
//           >
//             ✕
//           </button>
//         </div>
//         {children}
//       </div>
//     </div>
//   );
//  };

// const ModelCard = ({ name, description, type, source }) => {
//   const navigate = useNavigate();

//   const handleModelClick = () => {
//     navigate(`/dashboard/foundation-models/${encodeURIComponent(name)}`);
//   };

//   return (
//     <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
//       <div className="flex justify-between items-start mb-4">
//         <div className="flex flex-col gap-2">
//           <h3 
//             onClick={handleModelClick}
//             className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-light dark:hover:text-primary-light cursor-pointer transition-colors duration-200 group flex items-center"
//           >
//             {name}
//             <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
//               →
//             </span>
//           </h3>
//           <div className="flex gap-2">
//             <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
//               {type}
//             </span>
//             {license && (
//               <button
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   setShowLicenseModal(true);
//                 }}
//                 className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full hover:bg-green-200 dark:hover:bg-green-800"
//               >
//                 {license.type}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>
//       <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
//       <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
//         <div className="text-xs truncate max-w-[200px]">
//           Source: {source}
//         </div>
//         <button 
//           onClick={handleModelClick}
//           className="px-3 py-1.5 text-primary-light hover:text-white hover:bg-primary-light rounded-lg transition-all duration-200"
//         >
//           View Details
//         </button>
//       </div>
//     </div>
//   );
// };

// const RequestModelModal = ({ isOpen, onClose }) => {
//   const [formData, setFormData] = useState({
//     model_name: '',
//     huggingface_id: '',
//     description: '',
//     reason: '',
//     model_type: 'LLM'
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       await api.post(`${endpoints.foundation_models.prefix}/request`, formData);
//       onClose();
//     } catch (error) {
//       console.error(error);
//     }
//   };

//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Request New Model">
//       <form onSubmit={handleSubmit} className="space-y-4">
//         <div>
//           <label className="block text-sm font-medium mb-1">Model Name</label>
//           <input
//             type="text"
//             value={formData.model_name}
//             onChange={(e) => setFormData({...formData, model_name: e.target.value})}
//             className="w-full p-2 border rounded"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">Huggingface ID</label>
//           <input
//             type="text"
//             value={formData.huggingface_id}
//             onChange={(e) => setFormData({...formData, huggingface_id: e.target.value})}
//             className="w-full p-2 border rounded"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">Description</label>
//           <textarea
//             value={formData.description}
//             onChange={(e) => setFormData({...formData, description: e.target.value})}
//             className="w-full p-2 border rounded"
//           />
//         </div>
//         <div>
//           <label className="block text-sm font-medium mb-1">Reason for Request</label>
//           <textarea
//             value={formData.reason}
//             onChange={(e) => setFormData({...formData, reason: e.target.value})}
//             className="w-full p-2 border rounded"
//           />
//         </div>
//         <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
//           Submit Request
//         </button>
//       </form>
//     </Modal>
//   );
// };

// const RequestDetailsModal = ({ isOpen, onClose, request }) => {
//   return (
//     <Modal isOpen={isOpen} onClose={onClose} title="Request Details">
//       <div className="space-y-4">
//         <div>
//           <h3 className="text-sm text-gray-500">Model Name</h3>
//           <p className="font-medium">{request?.model_name}</p>
//         </div>
//         <div>
//           <h3 className="text-sm text-gray-500">Huggingface ID</h3>
//           <p className="font-medium">{request?.huggingface_id}</p>
//         </div>
//         <div>
//           <h3 className="text-sm text-gray-500">Description</h3>
//           <p className="font-medium">{request?.description}</p>
//         </div>
//         <div>
//           <h3 className="text-sm text-gray-500">Reason</h3>
//           <p className="font-medium">{request?.reason}</p>
//         </div>
//         <div>
//           <h3 className="text-sm text-gray-500">Status</h3>
//           <span className={`px-2 py-1 text-xs rounded-full ${
//             request?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//             request?.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
//             'bg-red-100 text-red-800'
//           }`}>
//             {request?.status}
//           </span>
//         </div>
//         <div>
//           <h3 className="text-sm text-gray-500">Requested On</h3>
//           <p className="font-medium">{new Date(request?.created_at).toLocaleString()}</p>
//         </div>
//       </div>
//     </Modal>
//   );
// };

// const RequestStatusModal = ({ isOpen, onClose }) => {
//   const [requests, setRequests] = useState([]);
//   const [selectedRequest, setSelectedRequest] = useState(null);

//   useEffect(() => {
//     if (isOpen) {
//       fetchRequests();
//     }
//   }, [isOpen]);

//   const fetchRequests = async () => {
//     const response = await api.get(`${endpoints.foundation_models.prefix}${endpoints.foundation_models.routes.get_requests}`);
//     setRequests(response.data);
//   };

//   return (
//     <>
//       <Modal isOpen={isOpen} onClose={onClose} title="Model Requests Status">
//         <div className="overflow-x-auto">
//           <table className="min-w-full">
//             <thead className="bg-gray-50 sticky top-0">
//               <tr>
//                 <th className="px-4 py-2">Model Name</th>
//                 <th className="px-4 py-2">Status</th>
//                 <th className="px-4 py-2">Requested On</th>
//                 <th className="px-4 py-2">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {requests.map((request) => (
//                 <tr key={request.id} className="border-t">
//                   <td className="px-4 py-2">{request.model_name}</td>
//                   <td className="px-4 py-2">
//                     <span className={`px-2 py-1 text-xs rounded-full ${
//                       request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
//                       request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
//                       'bg-red-100 text-red-800'
//                     }`}>
//                       {request.status}
//                     </span>
//                   </td>
//                   <td className="px-4 py-2">{new Date(request.created_at).toLocaleDateString()}</td>
//                   <td className="px-4 py-2">
//                     <button 
//                       onClick={() => setSelectedRequest(request)}
//                       className="text-blue-500 hover:text-blue-700"
//                     >
//                       View Details
//                     </button>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </Modal>

//       <RequestDetailsModal
//         isOpen={!!selectedRequest}
//         onClose={() => setSelectedRequest(null)}
//         request={selectedRequest}
//       />
//     </>
//   );
// };


// const TagFilter = ({ selectedTags, onTagSelect, availableTags }) => {
//   return (
//     <div className="flex flex-wrap gap-2 mt-4">
//       {availableTags.map((tag) => (
//         <button
//           key={tag}
//           onClick={() => onTagSelect(tag)}
//           className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
//             selectedTags.includes(tag)
//               ? 'bg-primary-light text-white'
//               : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
//           }`}
//         >
//           {tag}
//           {selectedTags.includes(tag) && (
//             <X size={14} className="inline ml-1" />
//           )}
//         </button>
//       ))}
//     </div>
//   );
// };

// const FoundationModels = () => {
//   const [searchQuery, setSearchQuery] = useState('');
//   const [showRequestModal, setShowRequestModal] = useState(false);
//   const [showStatusModal, setShowStatusModal] = useState(false);
//   const [selectedTags, setSelectedTags] = useState(['LLM']); // Default selection

//   // Extract unique types from modelData
//   const availableTags = [...new Set(modelData.map(model => model.type))];

//   const handleTagSelect = (tag) => {
//     setSelectedTags(prev => {
//       if (prev.includes(tag)) {
//         // Remove tag if it's already selected
//         return prev.filter(t => t !== tag);
//       } else {
//         // Add tag if it's not selected
//         return [...prev, tag];
//       }
//     });
//   };

//   const filteredModels = selectedTags.length === 0 ? [] : modelData.filter(model => {
//     const matchesSearch = 
//       model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
//       model.type.toLowerCase().includes(searchQuery.toLowerCase());
    
//     const matchesTags = selectedTags.includes(model.type);
    
//     return matchesSearch && matchesTags;
//   });

//   return (
//     <div className="space-y-8">
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Foundation Models</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and monitor your foundation models</p>
//           </div>
//           <div className="flex gap-2">
//             <button 
//               onClick={() => setShowStatusModal(true)}
//               className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
//             >
//               <History size={20} />
//               Request Status
//             </button>
//             <button 
//               onClick={() => setShowRequestModal(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark"
//             >
//               <Plus size={20} />
//               Request Model
//             </button>
//           </div>
//         </div>
//         <div className="relative">
//           <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
//           <input
//             type="text"
//             placeholder="Search models..."
//             value={searchQuery}
//             onChange={(e) => setSearchQuery(e.target.value)}
//             className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:bg-gray-700 dark:text-white"
//           />
//         </div>
//         <TagFilter 
//           selectedTags={selectedTags}
//           onTagSelect={handleTagSelect}
//           availableTags={availableTags}
//         />
//       </div>

//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
//         {filteredModels.map((model, index) => (
//           <ModelCard key={index} {...model} />
//         ))}
//       </div>

//       <RequestModelModal 
//         isOpen={showRequestModal} 
//         onClose={() => setShowRequestModal(false)} 
//       />
//       <RequestStatusModal 
//         isOpen={showStatusModal} 
//         onClose={() => setShowStatusModal(false)} 
//       />
//     </div>
//   );
// };

// export default FoundationModels;





// const modelData = [
//   {
//     name: "Gyan/CodeLlama-7B",
//     type: "LLM",
//     description: "Code generation model based on CodeLlama with 7 billion parameters",
//     source: "codellama/CodeLlama-7b-hf"
//   },
//   {
//     name: "Gyan/Llama2-7B",
//     type: "LLM",
//     description: "Meta's Llama2 general model with 7 billion parameters",
//     source: "meta-llama/Llama-2-7b"
//   },
//   {
//     name: "Gyan/Llama3-8B",
//     type: "LLM", 
//     description: "Meta's latest Llama3 model with 8 billion parameters",
//     source: "meta-llama/Meta-Llama-3-8B"
//   },
//   {
//     name: "Gyan/Llama3.1-8B-instruct",
//     type: "LLM",
//     description: "Instruction-tuned version of Llama 3.1 with 8B parameters",
//     source: "meta-llama/Llama-3.1-8B-Instruct"
//   },
//   // {
//   //   name: "Gyan/Mistral-7B",
//   //   type: "LLM",
//   //   description: "Open source 7B parameter model from Mistral AI",
//   //   source: "mistralai/Mistral-7B-v0.1"
//   // },
//   // {
//   //   name: "Gyan/MobileLLM-125M",
//   //   type: "LLM",
//   //   description: "Lightweight 125M parameter model optimized for mobile devices",
//   //   source: "facebook/MobileLLM-125M"
//   // },
//   // {
//   //   name: "Gyan/OPT-350M",
//   //   type: "LLM",
//   //   description: "Meta's OPT model with 350M parameters",
//   //   source: "facebook/opt-350m"
//   // },
//   // {
//   //   name: "Gyan/OPT-1.3B",
//   //   type: "LLM",
//   //   description: "Meta's OPT model with 1.3B parameters",
//   //   source: "facebook/opt-1.3b"
//   // },
//   // {
//   //   name: "Gyan/OPT-2.7B",
//   //   type: "LLM",
//   //   description: "Meta's OPT model with 2.7B parameters",
//   //   source: "facebook/opt-2.7b"
//   // },
//   {
//     name: "Gyan/TinyLlama-1.1B",
//     type: "LLM",
//     description: "Efficient 1.1B parameter chat model",
//     source: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
//   },
//   // {
//   //   name: "Gyan/Yi-6B",
//   //   type: "LLM",
//   //   description: "6B parameter model from 01.ai",
//   //   source: "01-ai/Yi-6B"
//   // },
//   {
//     name: "Gyan/PaliGemma",
//     type: "Vision LLM",
//     description: "Google's vision-language model with 3B parameters",
//     source: "google/paligemma-3b-pt-224"
//   }
// ];










import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, History, X } from 'lucide-react';


import axios from 'axios';
import endpoints from '../endpoints.json';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const modelData = [
  {
    name: "Gyan/CodeLlama-7B",
    type: "LLM",
    description: "Code generation model based on CodeLlama with 7 billion parameters",
    source: "meta-llama/CodeLlama-7b-hf"
  },
  {
    name: "Gyan/Llama2-7B",
    type: "LLM",
    description: "Meta's Llama2 general model with 7 billion parameters",
    source: "meta-llama/Llama-2-7b-hf"
  },
  {
    name: "Gyan/Llama-2-13B",
    type: "LLM",
    description: "Meta's Llama2 model with 13 billion parameters",
    source: "meta-llama/Llama-2-13b-hf"
  },
  {
    name: "Gyan/Llama-2-70B",
    type: "LLM",
    description: "Meta's Llama2 model with 70 billion parameters",
    source: "meta-llama/Llama-2-70b-hf"
  },
  {
    name: "Gyan/Llama-2-7B-Chat",
    type: "LLM",
    description: "Chat version of Meta's Llama2 7B model",
    source: "meta-llama/Llama-2-7b-chat-hf"
  },
  {
    name: "Gyan/Llama-2-13B-Chat",
    type: "LLM",
    description: "Chat version of Meta's Llama2 13B model",
    source: "meta-llama/Llama-2-13b-chat"
  },
  {
    name: "Gyan/Llama-3.3-70B-Instruct",
    type: "LLM",
    description: "Instruction-tuned version of Llama 3.3 with 70B parameters",
    source: "meta-llama/Llama-3.3-70B-Instruct"
  },
  {
    name: "Gyan/Llama-3.2-1B",
    type: "LLM",
    description: "Llama 3.2 with 1 billion parameters",
    source: "meta-llama/Llama-3.2-1B"
  },
  {
    name: "Gyan/Llama-3.2-3B",
    type: "LLM",
    description: "Llama 3.2 with 3 billion parameters",
    source: "meta-llama/Llama-3.2-3B"
  },
  {
    name: "Gyan/Llama-3.2-1B-Instruct",
    type: "LLM",
    description: "Instruction-tuned Llama 3.2 with 1 billion parameters",
    source: "meta-llama/Llama-3.2-1B-Instruct"
  },
  {
    name: "Gyan/Llama-3.2-3B-Instruct",
    type: "LLM",
    description: "Instruction-tuned Llama 3.2 with 3 billion parameters",
    source: "meta-llama/Llama-3.2-3B-Instruct"
  },
  {
    name: "Gyan/Llama-3.1-8B",
    type: "LLM",
    description: "Meta's Llama 3.1 model with 8 billion parameters",
    source: "meta-llama/Llama-3.1-8B"
  },
  {
    name: "Gyan/Llama-3.1-8B-Instruct",
    type: "LLM",
    description: "Instruction-tuned Llama 3.1 with 8 billion parameters",
    source: "meta-llama/Llama-3.1-8B-Instruct"
  },
  {
    name: "Gyan/Llama-3.1-70B",
    type: "LLM",
    description: "Meta's Llama 3.1 model with 70 billion parameters",
    source: "meta-llama/Llama-3.1-70B"
  },
  {
    name: "Gyan/Llama-3.1-70B-Instruct",
    type: "LLM",
    description: "Instruction-tuned Llama 3.1 with 70 billion parameters",
    source: "meta-llama/Llama-3.1-70B-Instruct"
  },
  {
         name: "Gyan/Llama3-8B",
         type: "LLM", 
         description: "Meta's latest Llama3 model with 8 billion parameters",
         source: "meta-llama/Meta-Llama-3-8B"
       },
 
  // {
  //   name: "Gyan/TinyLlama-1.1B",
  //   type: "LLM", 
  //   description: "Efficient 1.1B parameter chat model",
  //   source: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
  // },
  {
    name: "Gyan/PaliGemma",
    type: "Vision LLM",
    description: "Google's vision-language model with 3B parameters",
    source: "google/paligemma-3b-pt-224"
  },
  
  {
    "name": "Gyan/Llama-3.2-11B-Vision",
    "type": "Vision LLM",
    "description": "Llama 3.2 Vision model with 11 billion parameters",
    "source": "meta-llama/Llama-3.2-11B-Vision"
},
{
    "name": "Gyan/Llama-3.2-11B-Vision-Instruct",
    "type": "Vision LLM",
    "description": "Instruction-tuned Llama 3.2 Vision model with 11 billion parameters",
    "source": "meta-llama/Llama-3.2-11B-Vision-Instruct"
},
{
    "name": "Gyan/Llama-3.2-90B-Vision",
    "type": "Vision LLM",
    "description": "Llama 3.2 Vision model with 90 billion parameters",
    "source": "meta-llama/Llama-3.2-90B-Vision"
},
{
    "name": "Gyan/Llama-3.2-90B-Vision-Instruct",
    "type": "Vision LLM",
    "description": "Instruction-tuned Llama 3.2 Vision model with 90 billion parameters",
    "source": "meta-llama/Llama-3.2-90B-Vision-Instruct"
}
];





const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-[90vw] max-w-6xl"> {/* Increased width */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
 };

const ModelCard = ({ name, description, type, source }) => {
  const navigate = useNavigate();
  const isChat = name.toLowerCase().includes('chat');

  const handleModelClick = () => {
    navigate(`/dashboard/foundation-models/${encodeURIComponent(name)}`, {
      state: { name, description, type, source }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <h3 
            onClick={handleModelClick}
            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-light dark:hover:text-primary-light cursor-pointer transition-colors duration-200 group flex items-center"
          >
            {name}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
              →
            </span>
          </h3>
          <div className="flex flex-wrap gap-2">
            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full w-fit">
              {type}
            </span>
            {isChat && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full w-fit">
                Chat preferred
              </span>
            )}
          </div>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="text-xs truncate max-w-[200px]">
          Source: {source}
        </div>
        <button 
          onClick={handleModelClick}
          className="px-3 py-1.5 text-primary-light hover:text-white hover:bg-primary-light rounded-lg transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
};

const RequestModelModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    model_name: '',
    huggingface_id: '',
    description: '',
    reason: '',
    model_type: 'LLM'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`${endpoints.foundation_models.prefix}/request`, formData);
      onClose();
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request New Model">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Model Name</label>
          <input
            type="text"
            value={formData.model_name}
            onChange={(e) => setFormData({...formData, model_name: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Huggingface ID</label>
          <input
            type="text"
            value={formData.huggingface_id}
            onChange={(e) => setFormData({...formData, huggingface_id: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Reason for Request</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({...formData, reason: e.target.value})}
            className="w-full p-2 border rounded"
          />
        </div>
        <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
          Submit Request
        </button>
      </form>
    </Modal>
  );
};

const RequestDetailsModal = ({ isOpen, onClose, request }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Request Details">
      <div className="space-y-4">
        <div>
          <h3 className="text-sm text-gray-500">Model Name</h3>
          <p className="font-medium">{request?.model_name}</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Huggingface ID</h3>
          <p className="font-medium">{request?.huggingface_id}</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Description</h3>
          <p className="font-medium">{request?.description}</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Reason</h3>
          <p className="font-medium">{request?.reason}</p>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Status</h3>
          <span className={`px-2 py-1 text-xs rounded-full ${
            request?.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
            request?.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
            'bg-red-100 text-red-800'
          }`}>
            {request?.status}
          </span>
        </div>
        <div>
          <h3 className="text-sm text-gray-500">Requested On</h3>
          <p className="font-medium">{new Date(request?.created_at).toLocaleString()}</p>
        </div>
      </div>
    </Modal>
  );
};

const RequestStatusModal = ({ isOpen, onClose }) => {
  const [requests, setRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    if (isOpen) {
      fetchRequests();
    }
  }, [isOpen]);

  const fetchRequests = async () => {
    const response = await api.get(`${endpoints.foundation_models.prefix}${endpoints.foundation_models.routes.get_requests}`);
    setRequests(response.data);
  };

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} title="Model Requests Status">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-2">Model Name</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Requested On</th>
                <th className="px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.id} className="border-t">
                  <td className="px-4 py-2">{request.model_name}</td>
                  <td className="px-4 py-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      request.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      request.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {request.status}
                    </span>
                  </td>
                  <td className="px-4 py-2">{new Date(request.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">
                    <button 
                      onClick={() => setSelectedRequest(request)}
                      className="text-blue-500 hover:text-blue-700"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Modal>

      <RequestDetailsModal
        isOpen={!!selectedRequest}
        onClose={() => setSelectedRequest(null)}
        request={selectedRequest}
      />
    </>
  );
};


const TagFilter = ({ selectedTags, onTagSelect, availableTags }) => {
  return (
    <div className="flex flex-wrap gap-2 mt-4">
      {availableTags.map((tag) => (
        <button
          key={tag}
          onClick={() => onTagSelect(tag)}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedTags.includes(tag)
              ? 'bg-primary-light text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
          }`}
        >
          {tag}
          {selectedTags.includes(tag) && (
            <X size={14} className="inline ml-1" />
          )}
        </button>
      ))}
    </div>
  );
};

const FoundationModels = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState(['LLM']); // Default selection

  // Extract unique types from modelData
  const availableTags = [...new Set(modelData.map(model => model.type))];

  const handleTagSelect = (tag) => {
    setSelectedTags(prev => {
      if (prev.includes(tag)) {
        // Remove tag if it's already selected
        return prev.filter(t => t !== tag);
      } else {
        // Add tag if it's not selected
        return [...prev, tag];
      }
    });
  };

  const filteredModels = selectedTags.length === 0 ? [] : modelData.filter(model => {
    const matchesSearch = 
      model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      model.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesTags = selectedTags.includes(model.type);
    
    return matchesSearch && matchesTags;
  });

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Foundation Models</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and monitor your foundation models</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowStatusModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              <History size={20} />
              Request Status
            </button>
            <button 
              onClick={() => setShowRequestModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark"
            >
              <Plus size={20} />
              Request Model
            </button>
          </div>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:bg-gray-700 dark:text-white"
          />
        </div>
        <TagFilter 
          selectedTags={selectedTags}
          onTagSelect={handleTagSelect}
          availableTags={availableTags}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[80vh] overflow-y-auto">
        {filteredModels.map((model, index) => (
          <ModelCard key={index} {...model} />
        ))}
      </div>

      <RequestModelModal 
        isOpen={showRequestModal} 
        onClose={() => setShowRequestModal(false)} 
      />
      <RequestStatusModal 
        isOpen={showStatusModal} 
        onClose={() => setShowStatusModal(false)} 
      />
    </div>
  );
};

export default FoundationModels;