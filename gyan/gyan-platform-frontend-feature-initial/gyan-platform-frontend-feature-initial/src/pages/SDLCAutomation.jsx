// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Code2, 
//   GitBranch, 
//   FileSearch, 
//   Play, 
//   ArrowRight 
// } from 'lucide-react';

// // Import images - you'll need to add these or use placeholders
// import automationImage from '/media/sahil/data1/Dhruv/dhruv-frontend/src/assets/images/automate.jpg';
// import sourceCodeReviewImage from '/media/sahil/data1/Dhruv/dhruv-frontend/src/assets/images/automate.jpg';
// import testGenerationImage from '/media/sahil/data1/Dhruv/dhruv-frontend/src/assets/images/automate.jpg';
// import userStoriesImage from '/media/sahil/data1/Dhruv/dhruv-frontend/src/assets/images/automate.jpg';

// const SDLCAutomation = () => {
//   const navigate = useNavigate();

//   const sdlcFeatures = [
//     {
//       title: 'Automation',
//       icon: <Play size={24} />,
//       id: 'ID_GYAN_T5',
//       image: automationImage,
//       path: '/dashboard/use-cases/automation'
//     },
//     {
//       title: 'Source Code Review',
//       icon: <Code2 size={24} />,
//       id: 'ID_GYAN_T5',
//       image: sourceCodeReviewImage,
//       path: '/dashboard/use-cases/source-code-review'
//     },
//     {
//       title: 'Test Generation',
//       icon: <GitBranch size={24} />,
//       id: 'ID_GYAN_T5',
//       image: testGenerationImage,
//       path: '/dashboard/use-cases/test-generation'
//     },
//     {
//       title: 'User Stories',
//       icon: <FileSearch size={24} />,
//       id: 'ID_GYAN_T5',
//       image: userStoriesImage,
//       path: '/dashboard/use-cases/user-stories'
//     }
//   ];

//   const handleFeatureClick = (path) => {
//     navigate(path);
//   };

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">SDLC Automation</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered tools for Software Development Lifecycle</p>
//           </div>
//         </div>
//       </div>

//       <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 mb-8">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//           {sdlcFeatures.map((feature, index) => (
//             <div 
//               key={index}
//               onClick={() => handleFeatureClick(feature.path)}
//               className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative"
//             >
//               <div className="h-48 overflow-hidden">
//                 <img 
//                   src={feature.image} 
//                   alt={feature.title}
//                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                   onError={(e) => {
//                     e.target.onerror = null;
//                     e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAxaDtGaWxsLVJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=';
//                   }}
//                 />
//               </div>
//               <div className="p-6">
//                 <div className="flex items-center space-x-3 mb-4">
//                   <div className="text-primary-light">{feature.icon}</div>
//                   <div className="text-xs text-gray-500 dark:text-gray-400">{feature.id}</div>
//                 </div>
//                 <h3 className="font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-light transition-colors duration-200">
//                   {feature.title}
//                 </h3>
//                 <div className="flex items-center space-x-2 text-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                   <span className="text-sm">View Details</span>
//                   <ArrowRight size={16} />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Additional content */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
//         <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
//           About SDLC Automation
//         </h2>
//         <p className="text-gray-600 dark:text-gray-300">
//           Our SDLC Automation suite provides intelligent tools to streamline your software development lifecycle.
//           From code reviews to test generation and workflow automation, these AI-powered solutions help you deliver
//           high-quality software faster and with fewer defects.
//         </p>
//         <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Workflow Automation</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Automate repetitive tasks and processes in your development workflow.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Code Quality</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Improve code quality with AI-powered reviews and suggestions.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Test Coverage</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Generate comprehensive tests to ensure software reliability.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">User Requirements</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Generate detailed user stories to capture requirements effectively.</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SDLCAutomation;


// import React from 'react';
// import { useNavigate } from 'react-router-dom';
// import { 
//   Code2, 
//   GitBranch, 
//   FileSearch, 
//   Play, 
//   ArrowRight,
//   Settings
// } from 'lucide-react';

// // Import images - you'll need to add these or use placeholders
// import automationImage from '../assets/images/automate.jpg';
// import sourceCodeReviewImage from '../assets/images/automate.jpg';
// import testGenerationImage from '../assets/images/automate.jpg';
// import userStoriesImage from '../assets/images/automate.jpg';
// import developmentAutomationImage from '../assets/images/automate.jpg';

// const SDLCAutomation = () => {
//   const navigate = useNavigate();

//   const sdlcFeatures = [
//     {
//       title: 'Automation',
//       icon: <Play size={24} />,
//       image: automationImage,
//       path: '/dashboard/use-cases/automation'
//     },
//     {
//       title: 'Source Code Review',
//       icon: <Code2 size={24} />,
//       image: sourceCodeReviewImage,
//       path: '/dashboard/use-cases/source-code-review'
//     },
//     {
//       title: 'Test Generation',
//       icon: <GitBranch size={24} />,
//       image: testGenerationImage,
//       path: '/dashboard/use-cases/test-generation'
//     },
//     {
//       title: 'Design Automation',
//       icon: <FileSearch size={24} />,
//       image: userStoriesImage,
//       path: '/dashboard/use-cases/user-stories'
//     },
//     {
//       title: 'Development Automation',
//       icon: <Settings size={24} />,
//       image: developmentAutomationImage,
//       path: '/dashboard/use-cases/development-automation'
//     }
//   ];

//   const handleFeatureClick = (path) => {
//     navigate(path);
//   };

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">SDLC Automation</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered tools for Software Development Lifecycle</p>
//           </div>
//         </div>
//       </div>

//       <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 mb-8">
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
//           {sdlcFeatures.map((feature, index) => (
//             <div 
//               key={index}
//               onClick={() => handleFeatureClick(feature.path)}
//               className="group bg-white dark:bg-gray-800 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative"
//             >
//               <div className="h-48 overflow-hidden">
//                 <img 
//                   src={feature.image} 
//                   alt={feature.title}
//                   className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//                   onError={(e) => {
//                     e.target.onerror = null;
//                     e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAxaDtGaWxsLVJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=';
//                   }}
//                 />
//               </div>
//               <div className="p-6">
//                 <div className="flex items-center space-x-3 mb-4">
//                   <div className="text-primary-light">{feature.icon}</div>
//                   <div className="text-xs text-gray-500 dark:text-gray-400">{feature.id}</div>
//                 </div>
//                 <h3 className="font-semibold text-gray-800 dark:text-white mb-2 group-hover:text-primary-light transition-colors duration-200">
//                   {feature.title}
//                 </h3>
//                 <div className="flex items-center space-x-2 text-primary-light opacity-0 group-hover:opacity-100 transition-opacity duration-200">
//                   <span className="text-sm">View Details</span>
//                   <ArrowRight size={16} />
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>

//       {/* Additional content */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
//         <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
//           About SDLC Automation
//         </h2>
//         <p className="text-gray-600 dark:text-gray-300">
//           Our SDLC Automation suite provides intelligent tools to streamline your software development lifecycle.
//           From code reviews to test generation and workflow automation, these AI-powered solutions help you deliver
//           high-quality software faster and with fewer defects.
//         </p>
//         <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Workflow Automation</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Automate repetitive tasks and processes in your development workflow.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Code Quality</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Improve code quality with AI-powered reviews and suggestions.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Test Coverage</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Generate comprehensive tests to ensure software reliability.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">User Requirements</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Generate detailed user stories to capture requirements effectively.</p>
//           </div>
//           <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
//             <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Development Automation</h3>
//             <p className="text-sm text-gray-600 dark:text-gray-300">Streamline development with AI-assisted code completion and refactoring.</p>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default SDLCAutomation;


import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Code2, 
  GitBranch, 
  FileSearch, 
  Play, 
  ArrowRight,
  Settings,
  ClipboardList,
  Users,
  TestTube
} from 'lucide-react';

// Import images - you'll need to add these or use placeholders
import automationImage from '../assets/images/automate.jpg';
import sourceCodeReviewImage from '../assets/images/automate.jpg';
import testGenerationImage from '../assets/images/automate.jpg';
import userStoriesImage from '../assets/images/automate.jpg';
import developmentAutomationImage from '../assets/images/automate.jpg';
import requirementGatheringImage from '../assets/images/automate.jpg';
import projectManagerImage from '../assets/images/automate.jpg';
import testAutomationImage from '../assets/images/automate.jpg';

const SDLCAutomation = () => {
  const navigate = useNavigate();

  const sdlcFeatures = [
    {
      title: 'Automation',
      icon: <Play size={24} />,
      image: automationImage,
      path: '/dashboard/use-cases/automation'
    },
    {
      title: 'Source Code Review',
      icon: <Code2 size={24} />,
      image: sourceCodeReviewImage,
      path: '/dashboard/use-cases/source-code-review'
    },
    {
      title: 'Test Generation',
      icon: <GitBranch size={24} />,
      image: testGenerationImage,
      path: '/dashboard/use-cases/test-generation'
    },
    {
      title: 'Design Automation',
      icon: <FileSearch size={24} />,
      image: userStoriesImage,
      path: '/dashboard/use-cases/user-stories'
    },
    {
      title: 'Development Automation',
      icon: <Settings size={24} />,
      image: developmentAutomationImage,
      path: '/dashboard/use-cases/development-automation'
    },
    {
      title: 'Requirement Gathering',
      icon: <ClipboardList size={24} />,
      image: requirementGatheringImage,
      path: '/dashboard/use-cases/requirement-gathering'
    },
    {
      title: 'Project Manager',
      icon: <Users size={24} />,
      image: projectManagerImage,
      path: '/dashboard/use-cases/project-manager'
    },
    {
      title: 'Test Automation',
      icon: <TestTube size={24} />,
      image: testAutomationImage,
      path: '/dashboard/use-cases/test-automation'
    }
  ];

  const handleFeatureClick = (path) => {
    navigate(path);
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">SDLC Automation</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">AI-powered tools for Software Development Lifecycle</p>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-8 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          {sdlcFeatures.map((feature, index) => (
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
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgZmlsbC1ydWxlPSJldmVub2RkIiBjbGlwLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0yNCAxaDtGaWxsLVJ1bGU9Im5vbnplcm8iLz48L3N2Zz4=';
                  }}
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

      {/* Additional content */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          About SDLC Automation
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Our SDLC Automation suite provides intelligent tools to streamline your software development lifecycle.
          From code reviews to test generation and workflow automation, these AI-powered solutions help you deliver
          high-quality software faster and with fewer defects.
        </p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Workflow Automation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Automate repetitive tasks and processes in your development workflow.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Code Quality</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Improve code quality with AI-powered reviews and suggestions.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Test Coverage</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Generate comprehensive tests to ensure software reliability.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">User Requirements</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Generate detailed user stories to capture requirements effectively.</p>
          </div>
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <h3 className="text-md font-medium text-gray-800 dark:text-white mb-2">Development Automation</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">Streamline development with AI-assisted code completion and refactoring.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SDLCAutomation;
