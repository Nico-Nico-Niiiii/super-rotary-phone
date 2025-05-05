














//  updated code for entire working
import React, { useState, useEffect } from 'react';
import { X, BarChart as BarChartIcon, PieChart as PieChartIcon, LineChart as LineChartIcon, ArrowUp, RotateCcw } from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, 
  CartesianGrid, XAxis, YAxis, Tooltip, 
  ResponsiveContainer, Cell, Legend 
} from 'recharts';
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
// Available metrics mapping with their keys from the database
const AVAILABLE_METRICS = [
  { id: 'bertscore', name: 'BERTScore', key: 'bertscore', remarkKey: 'bertscore_remark' },
  { id: 'bleu', name: 'BLEU Score', key: 'bleu', remarkKey: 'bleu_remark' },
  { id: 'chrf', name: 'ChrF Score', key: 'chrf', remarkKey: 'chrf_remark' },
  { id: 'perplexity', name: 'Perplexity', key: 'perplexity', remarkKey: 'perplexity_remark' },
  { id: 'rouge', name: 'ROUGE Score', key: 'rouge', remarkKey: 'rouge_remark' }
];

const CHART_TYPES = {
  LINE: 'line',
  BAR: 'bar',
  PIE: 'pie'
};

const ComparisonModal = ({ isOpen, onClose, job }) => {
  const [comparisonType, setComparisonType] = useState('top5');
  const [selectedChartType, setSelectedChartType] = useState(CHART_TYPES.LINE);
  const [selectedJobs, setSelectedJobs] = useState([]);
  const [selectedMetric, setSelectedMetric] = useState(AVAILABLE_METRICS[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [evalJobs, setEvalJobs] = useState([]);

  useEffect(() => {
    if (isOpen && job?.dataset_hash) {
      fetchMatchingJobs();
    }
  }, [isOpen, job?.dataset_hash]);

  const fetchMatchingJobs = async () => {
    try {
      const response = await api.get(
        `${endpoints.evaluation.prefix}${endpoints.evaluation.routes.projects.replace('{project_name}', job.project_name)}`
      );
      
      console.log("Response for all projects:", response.data);
      
      // Filter jobs with matching dataset_hash
      const targetHash = job?.dataset_hash;
      console.log(targetHash);
      console.log(Object.values(response.data)[0]);
      
      
      const matchingJobs = Object.values(response.data)[0].filter(evalJob => 
        evalJob.dataset_hash === targetHash && evalJob.id !== job.id
      );
      console.log("Matching jobs", matchingJobs);
      
      
      setEvalJobs(matchingJobs);
    } catch (error) {
      console.error("Error fetching matching jobs:", error);
    }
  };

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658'];

  // Format evaluation job for chart data
  const formatJobForChart = (evalJob) => ({
    name: evalJob.name,
    value: evalJob[selectedMetric.key],
    remark: evalJob[selectedMetric.remarkKey],
    isCurrent: evalJob.id === job?.id,  // Changed this line
    modelName: evalJob.model_name,
    jobDetails: {
      completed: evalJob.completed_at,
      modelType: evalJob.model_type,
      status: evalJob.status,
      epochs: evalJob.epochs,
      batchSize: evalJob.batch_size,
      learningRate: evalJob.learning_rate,
      quantization: evalJob.quantization,
      loraOptimized: evalJob.lora_optimized,
      tokenLength: evalJob.token_length
    }
  });

      // Get processed data based on comparison type
  const getProcessedData = () => {
    if (!job) return [];
    
    // Handle any5 comparison type
    if (comparisonType === 'any5') {
      const selectedData = [
        formatJobForChart(job),
        ...selectedJobs.map(j => formatJobForChart(j))
      ];
      return selectedData;
    }

    // For top5 and bottom5
    const allJobs = [job, ...evalJobs];
    
    // If we have 5 or fewer total jobs, return all of them in the appropriate order
    if (allJobs.length <= 5) {
      const sortedJobs = [...allJobs].sort((a, b) => {
        const valueA = a[selectedMetric.key];
        const valueB = b[selectedMetric.key];
        return comparisonType === 'top5' ? valueB - valueA : valueA - valueB;
      });
      return sortedJobs.map(j => formatJobForChart(j));
    }

    // For more than 5 jobs
    const sortedJobs = [...allJobs].sort((a, b) => {
      const valueA = a[selectedMetric.key];
      const valueB = b[selectedMetric.key];
      return comparisonType === 'top5' ? valueB - valueA : valueA - valueB;
    });

    const currentJobIndex = sortedJobs.findIndex(j => j.id === job.id);
    
    let jobsToDisplay;
    if (currentJobIndex < 5) {
      // Current job is in top/bottom 5, show those 5
      jobsToDisplay = sortedJobs.slice(0, 5);
    } else {
      // Current job is not in top/bottom 5, show top/bottom 4 plus current job
      jobsToDisplay = [...sortedJobs.slice(0, 4), sortedJobs[currentJobIndex]];
    }

    return jobsToDisplay.map(j => formatJobForChart(j));
  };

  const renderChart = (data) => {
    const chartHeight = 400;
    const chartWidth = '100%';

    const CustomTooltip = ({ active, payload }) => {
      if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
          <div className="bg-white dark:bg-gray-800 p-3 border rounded-lg shadow">
            <p className="font-medium">{data.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{data.modelName}</p>
            <p className="text-sm">
              {selectedMetric.name}: {data.value.toFixed(4)}
            </p>
            <p className="text-sm text-gray-500">Remark: {data.remark}</p>
            {data.isCurrent && (
              <p className="text-xs text-red-500 mt-1">Current Model</p>
            )}
          </div>
        );
      }
      return null;
    };

    switch (selectedChartType) {
      case CHART_TYPES.LINE:
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={CustomTooltip} />
              <Legend />
              <Line 
                name={selectedMetric.name}
                type="monotone" 
                dataKey="value" 
                stroke="#2563eb"
                strokeWidth={(d) => d.isCurrent ? 3 : 2}
                dot={(props) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.isCurrent ? 6 : 4}
                      fill={payload.isCurrent ? '#FF0000' : '#2563eb'}
                      stroke={payload.isCurrent ? '#FF0000' : '#2563eb'}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case CHART_TYPES.BAR:
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis />
              <Tooltip content={CustomTooltip} />
              <Legend />
              <Bar 
                name={selectedMetric.name}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={entry.isCurrent ? '#FF0000' : COLORS[index % COLORS.length]}
                    stroke={entry.isCurrent ? '#FF0000' : COLORS[index % COLORS.length]}
                    strokeWidth={entry.isCurrent ? 2 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );

      case CHART_TYPES.PIE:
        return (
          <ResponsiveContainer width={chartWidth} height={chartHeight}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={(entry) => entry.name}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={index} 
                    fill={entry.isCurrent ? '#FF0000' : COLORS[index % COLORS.length]}
                    stroke={entry.isCurrent ? '#FF0000' : COLORS[index % COLORS.length]}
                    strokeWidth={entry.isCurrent ? 2 : 1}
                  />
                ))}
              </Pie>
              <Tooltip content={CustomTooltip} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const renderJobSelection = () => {
    // Filter out current model from selection options
    const availableJobs = evalJobs.filter(evalJob => evalJob.id !== job?.id);
    
    const filteredJobs = availableJobs.filter(job => 
      job.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.model_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // If no jobs available after filtering
    if (filteredJobs.length === 0) {
      return (
        <div className="text-center text-gray-500 dark:text-gray-400 p-4">
          {searchTerm ? "No matching jobs found" : "No other jobs available for comparison"}
        </div>
      );
    }

    return (
      <div className="space-y-4">
        <input
          type="text"
          placeholder="Search jobs..."
          className="w-full p-3 text-lg border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {filteredJobs.map((job) => (
            <label 
              key={job.id}
              className="flex items-center space-x-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedJobs.some(j => j.id === job.id)}
                onChange={() => {
                  if (selectedJobs.some(j => j.id === job.id)) {
                    setSelectedJobs(selectedJobs.filter(j => j.id !== job.id));
                  } else if (selectedJobs.length < 5) {
                    setSelectedJobs([...selectedJobs, job]);
                  }
                }}
                className="form-checkbox h-4 w-4 text-blue-600"
              />
              <div className="flex flex-col">
                <span className="text-gray-900 dark:text-white">{job.name}</span>
                <span className="text-sm text-gray-500 dark:text-gray-400">{job.model_name}</span>
              </div>
            </label>
          ))}
        </div>
      </div>
    );
  };

  const renderMetricList = () => {
    const processedData = getProcessedData();
    return (
      <div className="space-y-2">
        {processedData.map((item, index) => (
          <div 
            key={index}
            className={`flex flex-col p-3 rounded-lg ${
              item.isCurrent 
                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
                : 'bg-gray-50 dark:bg-gray-700'
            }`}
          >
            <div className="flex justify-between items-center">
              <span className={`text-gray-900 dark:text-white ${
                item.isCurrent ? 'font-semibold' : ''
              }`}>
                {item.name}
                {item.isCurrent && (
                  <span className="text-xs text-red-500 ml-2">*</span>
                )}
              </span>
              {/* <span className="font-medium text-gray-900 dark:text-white">
                {item.value.toFixed(2)}
              </span> */}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {item.modelName}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              Remark: {item.remark}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (!isOpen) return null;

  const processedData = getProcessedData();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-7xl mx-4 shadow-xl">
        <div className="p-8">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              Compare Metrics
            </h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Metric Selection */}
          <div className="space-y-2 mb-8">
            
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Select Metric
            </label>
            <select
              value={selectedMetric.id}
              onChange={(e) => {
                const metric = AVAILABLE_METRICS.find(m => m.id === e.target.value);
                setSelectedMetric(metric);
              }}
              className="w-full p-3 border rounded-lg bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-white text-lg"
            >
              {AVAILABLE_METRICS.map((metric) => (
                <option key={metric.id} value={metric.id}>
                  {metric.name}
                </option>
              ))}
            </select>
          </div>

          {/* Warning message for limited jobs */}
          {evalJobs.length <= 1 && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg">
              Not enough jobs available for comparison. Run more evaluations to compare results.
            </div>
          )}

          {/* Comparison Type Selection */}
          <div className="flex space-x-6 mb-8">
            <button
              onClick={() => setComparisonType('top5')}
              className={`px-6 py-3 rounded-lg text-lg ${
                comparisonType === 'top5'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              Top 5
            </button>
            <button
              onClick={() => setComparisonType('bottom5')}
              className={`px-6 py-3 rounded-lg text-lg ${
                comparisonType === 'bottom5'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              Bottom 5
            </button>
            <button
              onClick={() => setComparisonType('any5')}
              className={`px-6 py-3 rounded-lg text-lg ${
                comparisonType === 'any5'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}
            >
              Any 5
            </button>
          </div>

          <div className="grid grid-cols-12 gap-8 h-[500px]">
            {/* Left side - Job List/Selection */}
            <div className="col-span-3">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                {comparisonType === 'any5' ? 'Select Jobs' : 'Jobs'}
              </h3>
              {comparisonType === 'any5' ? renderJobSelection() : renderMetricList()}
            </div>

            {/* Middle - Chart */}
            <div className="col-span-6">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                {selectedMetric.name} Comparison
              </h3>
              <div className="h-[400px]">
                {renderChart(processedData)}
              </div>
            </div>

            {/* Right side - Chart Type Selection */}
            <div className="col-span-3">
              <h3 className="text-xl font-medium text-gray-900 dark:text-white mb-4">
                Chart Type
              </h3>
              <div className="space-y-4">
                <button
                  onClick={() => setSelectedChartType(CHART_TYPES.LINE)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg text-lg ${
                    selectedChartType === CHART_TYPES.LINE
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <LineChartIcon className="h-6 w-6" />
                  <span>Line Chart</span>
                </button>
                <button
                  onClick={() => setSelectedChartType(CHART_TYPES.BAR)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg text-lg ${
                    selectedChartType === CHART_TYPES.BAR
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <BarChartIcon className="h-6 w-6" />
                  <span>Bar Chart</span>
                </button>
                <button
                  onClick={() => setSelectedChartType(CHART_TYPES.PIE)}
                  className={`w-full flex items-center space-x-3 p-4 rounded-lg text-lg ${
                    selectedChartType === CHART_TYPES.PIE
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                  }`}
                >
                  <PieChartIcon className="h-6 w-6" />
                  <span>Pie Chart</span>
                </button>
                <button className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm">
            <RotateCcw size={16} />
            Re-train
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-sm">
            <ArrowUp size={16} />
            Deploy
          </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;