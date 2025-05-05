import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Terminal, 
  Code2, 
  Bug, 
  Play, 
  FileSearch, 
  Cpu, 
  GitBranch, 
  LineChart,
  ArrowRight 
} from 'lucide-react';
import DebuggerModal from '../components/DebuggerModal';

// Import all images
import software_debugger from '../assets/images/debug.jpg';
import data_analyser from '../assets/images/data.jpg';
import bios_analyser from '../assets/images/bios.jpg';
import cori from '../assets/images/cori.jpg';
import code_review from '../assets/images/code_review.jpg';
import code_review_logo from '../assets/images/code-review-logo1.jpg';

import { ComponentPlaceholderIcon } from '@radix-ui/react-icons';

const SoftwareDebugger = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  
  const debuggingUseCases = [
    {
      title: 'Runtime Error Analysis',
      description: 'Automatically analyze and diagnose runtime errors and exceptions in your code.',
      icon: <Terminal size={24} />,
      image: cori
    },
    {
      title: 'Code Inspection',
      description: 'Deep inspection of source code to identify potential bugs and optimization opportunities.',
      icon: <Code2 size={24} />,
      image: code_review_logo
    },
    {
      title: 'Bug Reproduction',
      description: 'Systematic reproduction of reported bugs with detailed step-by-step analysis.',
      icon: <Bug size={24} />,
      image: code_review
    },
    {
      title: 'Performance Analysis',
      description: 'Identify and resolve performance bottlenecks in your applications.',
      icon: <Play size={24} />,
      image: cori
    }
  ];

  const keyFeatures = [
    {
      title: 'Software Debugger',
      icon: <Bug size={24} />,
      id: 'ID_GYAN_T5',
      image: software_debugger,
      path: '/dashboard/use-cases/Software-Debugger'
    },
    {
      title: 'Data Analyser',
      icon: <LineChart size={24} />,
      id: 'ID_GYAN_T5',
      image: data_analyser,
      path: '/dashboard/use-cases/debugger/details'
    },
    {
      title: 'Bios Analyser',
      icon: <Cpu size={24} />,
      id: 'ID_GYAN_T5',
      image: bios_analyser,
      path: '/dashboard/use-cases/Bios-Analyser/details'
    }
  ];

  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleFeatureClick = (path) => {
    navigate(path);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Software Debugger</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Advanced AI-powered debugging tools for your applications</p>
          </div>
          {/* <button 
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 mt-4 md:mt-0"
            onClick={() => setIsModalOpen(true)}
            >
            <Play size={20} />
            Start Debugging
            </button> */}
        </div>
      </div>

      <br />
      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {keyFeatures.map((feature, index) => (
            <div 
              key={index}
              onClick={() => handleFeatureClick(feature.path)}
              className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={feature.image} 
                  alt={feature.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-primary-light">{feature.icon}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{feature.id}</div>
                </div>
                <h3 className="font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-light transition-colors duration-200">
                  {feature.title}
                </h3>
                <div className="flex items-center space-x-2 text-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-sm">View Details</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Rest of the component remains the same */}
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column - Image */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img 
              src={software_debugger} 
              alt="Software Debugger Interface" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
              Intelligent Debugging Assistant
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              Our AI-powered debugging assistant helps you identify and fix issues faster than ever. 
              With advanced code analysis and intelligent suggestions, you can resolve bugs more efficiently 
              and improve your code quality.
            </p>
          </div> */}

          {/* Use Cases Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {debuggingUseCases.map((useCase) => (
              <div 
                key={useCase.title}
                className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="h-40 overflow-hidden">
                  <img 
                    src={useCase.image} 
                    alt={useCase.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="text-primary-light">{useCase.icon}</div>
                    <div>
                      <h3 className="font-semibold text-gray-800 dark:text-white mb-2">{useCase.title}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{useCase.description}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DebuggerModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)} />
        
    </div>
  );
};

export default SoftwareDebugger;