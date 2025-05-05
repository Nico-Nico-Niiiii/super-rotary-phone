// import React, { useState, useEffect } from 'react';
// import { useParams } from 'react-router-dom';


// import { 
//   PlayCircle, ArrowUp, BarChart2, Database, MessageSquarePlus, RotateCcw
// } from 'lucide-react';

//   import { 
//     CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, 
//     ResponsiveContainer, PieChart, Pie, Cell 
//   } from 'recharts';

// // Mock training jobs with their specific parameters
// const MOCK_TRAINING_JOBS = [
//   {
//     id: 1,
//     name: "Training Job 1",
//     status: "Completed",
//     accuracy: 0.95,
//     loss: 0.02,
//     createdAt: "2024-12-20",
//     parameters: {
//       epochs: "100",
//       batchSize: "32",
//       learningRate: "0.001",
//       tokenLength: "512",
//       quantization: "int8",
//       rank: "16",
//       loraOptimized: "Yes"
//     }
//   },
//   {
//     id: 2,
//     name: "Fine-tuning Job",
//     status: "In Progress",
//     accuracy: 0.88,
//     loss: 0.05,
//     createdAt: "2024-12-21",
//     parameters: {
//       epochs: "150",
//       batchSize: "64",
//       learningRate: "0.0005",
//       tokenLength: "1024",
//       quantization: "int4",
//       rank: "8",
//       loraOptimized: "No"
//     }
//   },
//   {
//     id: 3,
//     name: "Base Training",
//     status: "Failed",
//     accuracy: 0.82,
//     loss: 0.09,
//     createdAt: "2024-12-19",
//     parameters: {
//       epochs: "200",
//       batchSize: "16",
//       learningRate: "0.002",
//       tokenLength: "2048",
//       quantization: "fp16",
//       rank: "32",
//       loraOptimized: "Yes"
//     }
//   }
// ];

// const EvaluationModel = () => {
//   const { id } = useParams();
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState('');
//   const [isProcessing, setIsProcessing] = useState(false);
//   const [selectedJob, setSelectedJob] = useState(MOCK_TRAINING_JOBS[0]);
//   const [currentParams, setCurrentParams] = useState(MOCK_TRAINING_JOBS[0].parameters);

//   const handleJobSelect = (job) => {
//     setSelectedJob(job);
//     setCurrentParams(job.parameters);
//   };

//   const getStatusColor = (status) => {
//     switch (status.toLowerCase()) {
//       case 'completed': return 'text-green-600';
//       case 'in progress': return 'text-blue-500';
//       case 'failed': return 'text-red-500';
//       default: return 'text-gray-500';
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
//       {/* Project header */}
//       <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
//         <div className="flex flex-col space-y-1 mb-4">
//           <span className="text-sm text-gray-500 dark:text-gray-400">Project</span>
//           <h1 className="text-xl font-bold text-gray-900 dark:text-white">
//             GYAN_TEST_PROJECT
//           </h1>
//         </div>
       
//       </div>

//       {/* Main content */}
//       <div className="p-6">
//         <div className="grid grid-cols-12 gap-6">
//           {/* Left section - Training Jobs */}
//           <div className="col-span-4 bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)]">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Training Jobs
//             </h2>
//             <div className="space-y-0 overflow-y-auto">
//               {MOCK_TRAINING_JOBS.map((job, index) => (
//                 <div key={job.id}>
//                   <div
//                     onClick={() => handleJobSelect(job)}
//                     className={`p-3 cursor-pointer transition-colors flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-700 ${
//                       selectedJob?.id === job.id
//                         ? 'bg-blue-50 dark:bg-blue-900/20'
//                         : ''
//                     }`}
//                   >
//                     <div className="flex items-center space-x-3">
//                       <h3 className={`font-medium ${
//                         selectedJob?.id === job.id
//                           ? 'text-blue-600 dark:text-blue-400'
//                           : 'text-gray-900 dark:text-white'
//                       }`}>
//                         {job.name}
//                       </h3>
//                     </div>
//                     <span className="text-xs text-gray-500 dark:text-gray-400">
//                       {job.createdAt}
//                     </span>
//                   </div>
//                   {index < MOCK_TRAINING_JOBS.length - 1 && (
//                     <div className="border-b border-gray-200 dark:border-gray-700" />
//                   )}
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Middle section - Chat */}
//           <div className="col-span-4 bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)] flex flex-col">
//             <div className="flex-1 overflow-y-auto mb-4">
//               {messages.map((message, index) => (
//                 <div
//                   key={index}
//                   className={`mb-4 ${message.type === 'user' ? 'text-right' : 'text-left'}`}
//                 >
//                   <div
//                     className={`inline-block max-w-[80%] p-3 rounded-lg ${
//                       message.type === 'user'
//                         ? 'bg-blue-500 text-white'
//                         : 'bg-gray-100 dark:bg-gray-700'
//                     }`}
//                   >
//                     {message.content}
//                   </div>
//                 </div>
//               ))}
//             </div>
//             <div className="flex gap-2">
//               <input
//                 type="text"
//                 value={input}
//                 onChange={(e) => setInput(e.target.value)}
//                 className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
//                 placeholder="Type your message..."
//               />
//               <button
//                 onClick={() => {}}
//                 className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
//               >
//                 Send
//               </button>
//             </div>
//           </div>

//           {/* Right section - Parameters */}
//           <div className="col-span-4 bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)]">
//             <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
//               Training Parameters
//             </h2>
//             <div className="grid grid-cols-2 gap-4 mb-6">
//               {/* Left column parameters */}
//               <div className="space-y-4">
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Epochs
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.epochs}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Learning Rate
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.learningRate}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Quantization
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.quantization}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Lora Optimized
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.loraOptimized}
//                     </span>
//                   </div>
//                 </div>
//               </div>

//               {/* Right column parameters */}
//               <div className="space-y-4">
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Batch Size
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.batchSize}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Token Length
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.tokenLength}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Rank
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {currentParams.rank}
//                     </span>
//                   </div>
//                 </div>
//                 <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
//                   <div className="flex justify-between items-center">
//                     <label className="text-sm text-gray-500 dark:text-gray-400">
//                       Status
//                     </label>
//                     <span className="text-base font-medium text-gray-900 dark:text-white">
//                       {selectedJob.status}
//                     </span>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             {/* Training Progress Chart */}
//             <div className="mt-6">
//               <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
//                 Training Progress
//               </h3>
//               <div className="h-48">
//                 <ResponsiveContainer width="100%" height="100%">
//                   <LineChart data={[
//                     { name: '0', value: 0 },
//                     { name: '25', value: 30 },
//                     { name: '50', value: 55 },
//                     { name: '75', value: 80 },
//                     { name: '100', value: 100 }
//                   ]}>
//                     <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
//                     <XAxis dataKey="name" stroke="#9CA3AF" />
//                     <YAxis stroke="#9CA3AF" />
//                     <Tooltip />
//                     <Line 
//                       type="monotone" 
//                       dataKey="value" 
//                       stroke="#3B82F6" 
//                       strokeWidth={2}
//                       dot={{ fill: '#3B82F6', r: 4 }}
//                       activeDot={{ r: 6 }}
//                     />
//                   </LineChart>
//                 </ResponsiveContainer>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default EvaluationModel;






















import React, { useState, useMemo, useEffect } from 'react';
import { Info, X , ChevronUp, ChevronDown } from 'lucide-react';
import { 
  CartesianGrid, LineChart, Line, XAxis, YAxis, Tooltip, 
  ResponsiveContainer 
} from 'recharts';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import ComparisonModal from './ComparisonModal';
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

// Mock report data
const MOCK_REPORT_DATA = [
  {
    metric: "Bertscore",
    score: 0.95,
    remark: "Good",
    indicator: "green"
  },
  {
    metric: "Bleu",
    score: 0.15,
    remark: "Moderate",
    indicator: "yellow"
  },
  {
    metric: "Chrf",
    score: 0.82,
    remark: "Moderate",
    indicator: "yellow"
  },
  {
    metric: "Perplexity",
    score: 0.45,
    remark: "Fail",
    indicator: "red"
  },
  {
    metric: "Rouge",
    score: 0.88,
    remark: "Good",
    indicator: "green"
  }
];



// Mock parameters data
const MOCK_PARAMETERS = {
  epochs: "100",
  batchSize: "32",
  learningRate: "0.001",
  tokenLength: "512",
  quantization: "int8",
  rank: "16",
  loraOptimized: "Yes"
};

// Score ranges info
const SCORE_RANGES = [
  {
    range: "0.0 - 0.5",
    remark: "Fail",
    indicator: "Red",
    description: "Model performance is poor and needs significant improvement"
  },
  {
    range: "0.5 - 0.85",
    remark: "Moderate",
    indicator: "Yellow",
    description: "Model performance is acceptable but has room for improvement"
  },
  {
    range: "0.85 - 1.0",
    remark: "Good",
    indicator: "Green",
    description: "Model performance is excellent"
  }
];

const EvaluationModel = () => {
  const [currentParams] = useState(MOCK_PARAMETERS);
  const [showInfoPopup, setShowInfoPopup] = useState(false);
  const [isParamsOpen, setIsParamsOpen] = useState(true);
    const [isProgressOpen, setIsProgressOpen] = useState(true);
    const [showComparisonModal, setShowComparisonModal] = useState(false);
  const location = useLocation();
  const jobInfo = location.state;
  console.log("Data got eval", jobInfo);

  const [logsData, setLogsData] = useState([]);

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

  useEffect(() => {
    fetchAllLogs();
  },[])
  
    // const currentModelData = {
    //     jobId: "current_model",
    //     jobName: "GYAN_TEST_PROJECT", // Your current model name
    //     metrics: {
    //       Bertscore: MOCK_REPORT_DATA.find(m => m.metric === "Bertscore")?.score || 0,
    //       Bleu: MOCK_REPORT_DATA.find(m => m.metric === "Bleu")?.score || 0,
    //       Chrf: MOCK_REPORT_DATA.find(m => m.metric === "Chrf")?.score || 0,
    //       Perplexity: MOCK_REPORT_DATA.find(m => m.metric === "Perplexity")?.score || 0,
    //       Rouge: MOCK_REPORT_DATA.find(m => m.metric === "Rouge")?.score || 0,
    //     }
    //   };

    const currentModelData = useMemo(() => ({
        jobId: "current_model",
        jobName: "GYAN_TEST_PROJECT",
        metrics: {
          Bertscore: MOCK_REPORT_DATA.find(m => m.metric === "Bertscore")?.score || 0,
          Bleu: MOCK_REPORT_DATA.find(m => m.metric === "Bleu")?.score || 0,
          Chrf: MOCK_REPORT_DATA.find(m => m.metric === "Chrf")?.score || 0,
          Perplexity: MOCK_REPORT_DATA.find(m => m.metric === "Perplexity")?.score || 0,
          Rouge: MOCK_REPORT_DATA.find(m => m.metric === "Rouge")?.score || 0,
        }
      }), []); 

  const getIndicatorColor = (indicator) => {
    switch (indicator.toLowerCase()) {
      case 'good': return 'bg-green-500';
      case 'moderate': return 'bg-yellow-500';
      case 'bad': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getIndicatorTextColor = (indicator) => {
    switch (indicator.toLowerCase()) {
      case 'good': return 'text-green-600';
      case 'moderate': return 'text-yellow-600';
      case 'bad': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };


  const fetchAllLogs = async () => {
    try {
      if(jobInfo !== null){
      const response = await api.get(
        `${endpoints.training_logs.prefix}${endpoints.training_logs.routes.get_logs.replace('{job_id}', jobInfo?.job_id)}`
      );
  
      if (response.data && Array.isArray(response.data)) {
        setLogsData(response.data);
      }
      console.log("Whole logs", response.data);
    }
    } catch (error) {
      console.error('Error fetching logs:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Project header */}
      <div className="bg-white dark:bg-gray-800 px-6 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div className="flex flex-col space-y-1">
            <span className="text-sm text-gray-500 dark:text-gray-400">Project</span>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {jobInfo.project_name}
            </h1>
          </div>
          <button 
            onClick={() => setShowInfoPopup(true)}
            className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-gray-300 bg-white hover:bg-gray-50 transition-all transform hover:scale-105 hover:border-gray-400"
          >
            <Info className="h-6 w-6 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Info Popup */}
      {showInfoPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full mx-4 shadow-xl">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Performance Score Ranges
                </h2>
                <button 
                  onClick={() => setShowInfoPopup(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                {SCORE_RANGES.map((range, index) => (
                  <div key={index} className="flex items-start space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className={`w-4 h-4 mt-1 rounded-full ${getIndicatorColor(range.indicator)}`} />
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {range.range} 
                        <span className={`ml-2 ${getIndicatorTextColor(range.indicator)}`}>
                          ({range.remark})
                        </span>
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {range.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowInfoPopup(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Table section */}
          <div className="col-span-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <div className="border-b border-gray-200 dark:border-gray-700 p-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Model Report
              </h2>
              <button
      onClick={() => setShowComparisonModal(true)}
      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
    >
      Compare
    </button>
    </div>
            </div>
            <div className="p-4">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white rounded-l-lg">
                        Metric
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Score
                      </th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                        Remark
                      </th>
                      <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900 dark:text-white rounded-r-lg">
                        Indicator
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {/* BertScore */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          BertScore
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {jobInfo.bertscore.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${getIndicatorTextColor(jobInfo.bertscore_remark)}`}>
                            {jobInfo.bertscore_remark}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-4 h-4 rounded-full mx-auto ${getIndicatorColor(jobInfo.bertscore_remark)}`} />
                        </td>
                      </tr>

                      {/* Bleu */}

                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          Bleu
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {jobInfo.bleu.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${getIndicatorTextColor(jobInfo.bleu_remark)}`}>
                            {jobInfo.bleu_remark}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-4 h-4 rounded-full mx-auto ${getIndicatorColor(jobInfo.bleu_remark)}`} />
                        </td>
                      </tr>
{/* Chrf */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                        Chrf
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {jobInfo.chrf.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${getIndicatorTextColor(jobInfo.chrf_remark)}`}>
                            {jobInfo.chrf_remark}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-4 h-4 rounded-full mx-auto ${getIndicatorColor(jobInfo.chrf_remark)}`} />
                        </td>
                      </tr>
{/* Perplexity */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          Perplexity
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {jobInfo.perplexity.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${getIndicatorTextColor(jobInfo.perplexity_remark)}`}>
                            {jobInfo.perplexity_remark}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-4 h-4 rounded-full mx-auto ${getIndicatorColor(jobInfo.perplexity_remark)}`} />
                        </td>
                      </tr>
{/* Rouge */}
                      <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                          Rouge
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-300">
                          {jobInfo.rouge.toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          <span className={`font-medium ${getIndicatorTextColor(jobInfo.rouge_remark)}`}>
                            {jobInfo.rouge_remark}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`w-4 h-4 rounded-full mx-auto ${getIndicatorColor(jobInfo.rouge_remark)}`} />
                        </td>
                      </tr>
                  
                          

                  </tbody>
                </table>
              </div>
            </div>
          </div>


          <div className="col-span-4 bg-white dark:bg-gray-800 rounded-lg p-4 h-[calc(100vh-12rem)] overflow-y-auto">
            {/* Training Parameters Section */}
            <div className="mb-4">
            

<button 
  onClick={() => setIsParamsOpen(!isParamsOpen)} // or setIsProgressOpen for the progress section
  className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
>
  <span>Training Parameters</span>
  {isParamsOpen ? ( // or isProgressOpen for the progress section
    <ChevronUp className="h-5 w-5 text-gray-500" />
  ) : (
    <ChevronDown className="h-5 w-5 text-gray-500" />
  )}
</button>
              
              {/* <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg ${
  isParamsOpen ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
}`}> */}
                {/* <div className="grid grid-cols-2 gap-4"> */}
                
                  <div className="mb-4">
            

            {/* <button 
              onClick={() => setIsParamsOpen(!isParamsOpen)} // or setIsProgressOpen for the progress section
              className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
            >
              <span>Training Parameters</span>
              {isParamsOpen ? ( // or isProgressOpen for the progress section
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button> */}
                          
                          <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg ${
              isParamsOpen ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'}`}>
            
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                      <h3 className="text-lg font-semibold mb-4">Training Details</h3>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto scrollbar-hide pr-4">
                        <div className="flex justify-between items-center py-2 border-b gap-4">
                          <span className="text-sm text-gray-500 min-w-[100px]">Job ID</span>
                          <span className="text-sm font-medium text-right">{jobInfo?.id || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Model Type</span>
                          <span className="text-sm font-medium">{jobInfo?.model_type === "Large Language Model" ? "LLM" : jobInfo?.model_type || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Strategy</span>
                          <span className="text-sm font-medium">{jobInfo?.decode || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Top K</span>
                          <span className="text-sm font-medium">{jobInfo?.top_k || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Top P</span>
                          <span className="text-sm font-medium">{jobInfo?.top_p || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Temperature</span>
                          <span className="text-sm font-medium">{jobInfo?.temperature || "-"}</span>
                        </div>
                        
                        <div className="flex justify-between items-center py-2 border-b gap-4">
                          <span className="text-sm text-gray-500 min-w-[100px]">Dataset Path</span>
                          <span className="text-sm font-medium text-right truncate max-w-[200px]" title={jobInfo?.dataset_path}>
                            {jobInfo?.dataset_path || "-"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Batch Size</span>
                          <span className="text-sm font-medium">{jobInfo?.batch_size || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Learning Rate</span>
                          <span className="text-sm font-medium">{jobInfo?.learning_rate || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Token Length</span>
                          <span className="text-sm font-medium">{jobInfo?.token_length || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Rank</span>
                          <span className="text-sm font-medium">{jobInfo?.rank || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Quantization</span>
                          <span className="text-sm font-medium">{jobInfo?.quantization || "-"}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">LoRA Optimized</span>
                          <span className="text-sm font-medium">{jobInfo?.lora_optimized ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Started On</span>
                          <span className="text-sm font-medium">{new Date(jobInfo?.started_on).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b">
                          <span className="text-sm text-gray-500">Completed At</span>
                          <span className="text-sm font-medium">{jobInfo?.completed_at ? new Date(jobInfo.completed_at).toLocaleString() : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                          <span className="text-sm text-gray-500">User Email</span>
                          <span className="text-sm font-medium">{jobInfo?.user_email}</span>
                        </div>
                      </div>
                    </div>
                           
                          </div>
                        </div>  

                 
                {/* </div> */}
              {/* </div> */}
            </div>


            {/* Training Progress Section */}
            <div className="mt-4">
             
              <button 
  onClick={() => setIsProgressOpen(!isProgressOpen)} 
  className="w-full flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-white mb-2 bg-gray-100 hover:bg-gray-200 dark:hover:bg-gray-700 p-3 rounded-lg border border-gray-100 dark:border-gray-700"
>
  <span>Progress Graph</span>
  {isProgressOpen ? ( 
    <ChevronUp className="h-5 w-5 text-gray-500" />
  ) : (
    <ChevronDown className="h-5 w-5 text-gray-500" />
  )}
</button>
              
              <div className={`transition-all duration-300 ease-in-out overflow-hidden bg-gray-50 dark:bg-gray-700 rounded-lg ${
  isProgressOpen ? 'max-h-96 opacity-100 p-4' : 'max-h-0 opacity-0 p-0'
}`}>
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
              </div>
            </div>
          </div>

        

            
          </div>
        </div>
        <ComparisonModal
  isOpen={showComparisonModal}
  onClose={() => setShowComparisonModal(false)}
  currentModel={currentModelData}
  job={jobInfo}
/>
      </div>
  );
};

export default EvaluationModel;

