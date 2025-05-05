import React from 'react';
import { X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Mock comparison data
const mockComparisonData = [
  {
    name: 'EVAL_JOB1_2024-12-24',
    accuracy: 85,
    precision: 82,
    recall: 88,
    f1Score: 84,
  },
  {
    name: 'EVAL_JOB2_2024-12-24',
    accuracy: 78,
    precision: 75,
    recall: 80,
    f1Score: 77,
  },
  {
    name: 'EVAL_JOB3_2024-12-24',
    accuracy: 92,
    precision: 90,
    recall: 93,
    f1Score: 91,
  },
];

const ModelCompareEval = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full m-4 shadow-xl h-4/5" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Job Performance Comparison</h3>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="h-4/5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={mockComparisonData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="accuracy" fill="#8884d8" name="Accuracy" />
              <Bar dataKey="precision" fill="#82ca9d" name="Precision" />
              <Bar dataKey="recall" fill="#ffc658" name="Recall" />
              <Bar dataKey="f1Score" fill="#ff7300" name="F1 Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold mb-2 text-gray-900 dark:text-white">Performance Summary</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {mockComparisonData.map((job) => (
              <div 
                key={job.name}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <h5 className="font-medium text-sm mb-2 text-gray-900 dark:text-white">{job.name}</h5>
                <div className="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                  <p>Accuracy: {job.accuracy}%</p>
                  <p>Precision: {job.precision}%</p>
                  <p>Recall: {job.recall}%</p>
                  <p>F1 Score: {job.f1Score}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModelCompareEval;