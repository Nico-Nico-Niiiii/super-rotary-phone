import React, { useState } from 'react';
import { 
  Play,
  RefreshCw,
  Code2,
  FileCode,
  GitBranch,
  Settings,
  Clock,
  Check,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  TestTube,
  BarChart,
  ArrowRight
} from 'lucide-react';

const TestGenerationDetails = () => {
  const metrics = [
    {
      label: 'Generated Tests',
      value: '847',
      change: '+124',
      icon: <FileCode size={20} />
    },
    {
      label: 'Coverage',
      value: '94.2%',
      change: '+2.8%',
      icon: <Check size={20} />
    },
    {
      label: 'Avg. Generation Time',
      value: '1.2s',
      change: '-15%',
      icon: <Clock size={20} />
    }
  ];

  const testTypes = [
    {
      icon: <Code2 size={24} />,
      title: 'Unit Tests',
      description: 'Automatically generate unit tests with high code coverage.',
      count: '324'
    },
    {
      icon: <GitBranch size={24} />,
      title: 'Integration Tests',
      description: 'Create end-to-end test scenarios for complex workflows.',
      count: '156'
    },
    {
      icon: <TestTube size={24} />,
      title: 'API Tests',
      description: 'Generate comprehensive API test suites.',
      count: '245'
    },
    {
      icon: <AlertCircle size={24} />,
      title: 'Edge Cases',
      description: 'Identify and test boundary conditions and edge cases.',
      count: '122'
    }
  ];

  const recentTests = [
    {
      id: 'TEST-123',
      name: 'User Authentication',
      status: 'success',
      coverage: '96%',
      timestamp: '2 mins ago'
    },
    {
      id: 'TEST-122',
      name: 'Payment Processing',
      status: 'warning',
      coverage: '89%',
      timestamp: '15 mins ago'
    },
    {
      id: 'TEST-121',
      name: 'Data Validation',
      status: 'success',
      coverage: '94%',
      timestamp: '1 hour ago'
    }
  ];

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Unit Test Generation</h2>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                Active
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Generate comprehensive unit tests for your codebase</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <RefreshCw size={18} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200">
              <Play size={18} />
              Generate Tests
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary-light/10 rounded-lg text-primary-light">
                  {metric.icon}
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">{metric.label}</span>
              </div>
              <span className={`text-sm ${
                metric.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
              }`}>
                {metric.change}
              </span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-4">{metric.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Test Types Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Test Types
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {testTypes.map((type, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 bg-primary-light/10 rounded-lg text-primary-light">
                        {type.icon}
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                          {type.title}
                        </h4>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          ({type.count})
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {type.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Coverage Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Coverage Analysis
              </h3>
              <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">Coverage Graph Placeholder</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-8">
          {/* Recent Tests */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Recent Tests
              </h3>
              <div className="space-y-4">
                {recentTests.map((test, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className={`p-1.5 rounded-full ${
                        test.status === 'success' 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-200' 
                          : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {test.status === 'success' ? <Check size={14} /> : <AlertCircle size={14} />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{test.name}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{test.id}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{test.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm ${
                      parseInt(test.coverage) > 90 ? 'text-green-500' : 'text-yellow-500'
                    }`}>{test.coverage}</span>
                  </div>
                ))}
              </div>
              <button className="w-full mt-4 text-sm text-primary-light hover:text-primary-dark flex items-center justify-center gap-1">
                View All Tests
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <Settings size={18} className="text-primary-light" />
                  <span className="text-sm text-gray-900 dark:text-white">Configure Settings</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <BarChart size={18} className="text-primary-light" />
                  <span className="text-sm text-gray-900 dark:text-white">View Analytics</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <MessageSquare size={18} className="text-primary-light" />
                  <span className="text-sm text-gray-900 dark:text-white">Get Support</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestGenerationDetails;