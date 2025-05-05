import React from 'react';
import { 
  Play,
  RefreshCw,
  Smartphone,
  Laptop,
  Tablet,
  Settings,
  Clock,
  Check,
  AlertCircle,
  ChevronRight,
  MessageSquare,
  Wifi,
  BarChart,
  Shield,
  ArrowRight
} from 'lucide-react';

const DeviceTestDetails = () => {
  const metrics = [
    {
      label: 'Total Tests',
      value: '1,234',
      change: '+156',
      icon: <Check size={20} />
    },
    {
      label: 'Coverage',
      value: '96.5%',
      change: '+2.1%',
      icon: <Shield size={20} />
    },
    {
      label: 'Avg. Duration',
      value: '2.4m',
      change: '-18%',
      icon: <Clock size={20} />
    }
  ];

  const deviceTypes = [
    {
      icon: <Smartphone size={24} />,
      title: 'Mobile Devices',
      description: 'iOS and Android device testing.',
      count: '48'
    },
    {
      icon: <Laptop size={24} />,
      title: 'Laptops',
      description: 'Windows and MacOS testing.',
      count: '36'
    },
    {
      icon: <Tablet size={24} />,
      title: 'Tablets',
      description: 'iPad and Android tablet testing.',
      count: '24'
    },
    {
      icon: <Wifi size={24} />,
      title: 'Network Tests',
      description: 'Connection and bandwidth testing.',
      count: '18'
    }
  ];

  const recentTests = [
    {
      id: 'TEST-345',
      device: 'iPhone 13 Pro',
      status: 'success',
      performance: '98%',
      timestamp: '5 mins ago'
    },
    {
      id: 'TEST-344',
      device: 'Samsung Galaxy S21',
      status: 'warning',
      performance: '87%',
      timestamp: '15 mins ago'
    },
    {
      id: 'TEST-343',
      device: 'iPad Pro',
      status: 'success',
      performance: '95%',
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Mobile Device Testing</h2>
              <span className="px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                Active
              </span>
            </div>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Comprehensive mobile device testing suite</p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
              <RefreshCw size={18} />
              Refresh
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200">
              <Play size={18} />
              Run Tests
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
          {/* Device Types Grid */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Device Types
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {deviceTypes.map((type, index) => (
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

          {/* Test Performance Graph */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Performance Analysis
              </h3>
              <div className="h-64 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">Performance Graph Placeholder</span>
              </div>
            </div>
          </div>

          {/* Device Compatibility Matrix */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Compatibility Matrix
              </h3>
              <div className="h-48 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-lg">
                <span className="text-gray-500 dark:text-gray-400">Compatibility Matrix Placeholder</span>
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
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{test.device}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500 dark:text-gray-400">{test.id}</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">•</span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">{test.timestamp}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`text-sm ${
                      parseInt(test.performance) > 90 ? 'text-green-500' : 'text-yellow-500'
                    }`}>{test.performance}</span>
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
                  <span className="text-sm text-gray-900 dark:text-white">Configure Devices</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <BarChart size={18} className="text-primary-light" />
                  <span className="text-sm text-gray-900 dark:text-white">View Reports</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                  <MessageSquare size={18} className="text-primary-light" />
                  <span className="text-sm text-gray-900 dark:text-white">Support</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceTestDetails;