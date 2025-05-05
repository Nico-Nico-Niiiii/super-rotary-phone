import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JSZip from 'jszip';
import {
  Play,
  GitBranch,
  Code2,
  Terminal,
  FileCode,
  Braces,
  ArrowRight,
  Globe,
  File,
  FolderArchive,
  X,
  Clock
} from 'lucide-react';

const Automation = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [workflows, setWorkflows] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    language: '',
    sourceType: '',
    sourceInput: ''
  });

  const languages = [
    { value: 'java', label: 'JAVA' },
    { value: 'go', label: 'GO' },
    { value: 'c', label: 'C' },
    { value: 'cpp', label: 'C++' }
  ];

  const sourceTypes = [
    { value: 'file', label: 'Single File', icon: <File className="w-4 h-4" /> },
    { value: 'zip', label: 'ZIP File', icon: <FolderArchive className="w-4 h-4" /> },
    { value: 'github', label: 'Github URL', icon: <Globe className="w-4 h-4" /> }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    let fileContent = null;
    let fileStructure = null;
    let fileName = '';

    const inputElement = e.target.querySelector('input[type="file"]');
    const file = inputElement?.files[0];

    if (formData.sourceType === 'file') {
      const file = e.target.querySelector('input[type="file"]').files[0];
      fileName = file.name;
      
      try {
        const reader = new FileReader();
        fileContent = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
        
        fileStructure = [{
          name: fileName,
          type: 'file',
          content: fileContent
        }];
      } catch (error) {
        console.error('Error reading file:', error);
      } 

    }

    else if (formData.sourceType == 'zip'){
      try {
        const zip = new JSZip();
        const zipData = await zip.loadAsync(file);
        fileStructure = [];

        await Promise.all(
          Object.keys(zipData.files).map(async (filename) => {
            if (!zipData.files[filename].dir) {
              const content = await zipData.files[filename].async('text');
              fileStructure.push({
                name: filename,
                type: 'file',
                content
              });
            }
          })
        );
      } catch (error) {
        console.error('Error extracting ZIP:', error);
      }
    }
    else if (formData.sourceType === 'github') {
      fileName = 'main.java';
      fileContent = '// Content from GitHub\n// URL: ' + formData.sourceInput;
      fileStructure = [{
        name: fileName,
        type: 'file',
        content: fileContent
      }];
    }

    const newWorkflow = {
      ...formData,
      id: `WF-${Math.random().toString(36).substr(2, 9)}`,
      created: new Date(),
      status: 'pending',
      fileContent,
      fileStructure,
      fileName, 
    };

    setWorkflows([...workflows, newWorkflow]);
    setIsOpen(false);
    setFormData({ name: '', language: '', sourceType: '', sourceInput: '' });
  };

  const getLanguageIcon = (language) => {
    switch (language) {
      case 'java':
        return <Code2 size={20} />;
      case 'go':
        return <GitBranch size={20} />;
      case 'c':
        return <Terminal size={20} />;
      case 'cpp':
        return <Braces size={20} />;
      default:
        return <FileCode size={20} />;
    }
  };

  const handleWorkflowClick = (workflow) => {
    navigate('/dashboard/use-cases/automation/details', { state: { workflow } });
  };

  const renderSourceInput = () => {
    switch (formData.sourceType) {
      case 'file':
      case 'zip':
        return (
          <input
            type="file"
            accept={formData.sourceType === 'zip' ? '.zip' : undefined}
            onChange={(e) => setFormData({ ...formData, sourceInput: e.target.value })}
            className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
              file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 
              file:text-blue-700 hover:file:bg-blue-100"
          />
        );
      case 'github':
        return (
          <input
            type="text"
            placeholder="Enter Github URL"
            value={formData.sourceInput}
            onChange={(e) => setFormData({ ...formData, sourceInput: e.target.value })}
            className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
              placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automation Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Streamline your development workflow with intelligent automation tools
            </p>
          </div>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <button
              onClick={() => setIsOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
                hover:bg-blue-700 transition-colors duration-200"
            >
              <Play size={18} />
              Create Workflow
            </button>
          </div>
        </div>
      </div>

      {/* Workflows List */}
      {workflows.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Your Workflows
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {workflows.map((workflow) => (
              <div
                key={workflow.id}
                onClick={() => handleWorkflowClick(workflow)}
                className="group bg-gray-50 dark:bg-gray-700 rounded-lg p-6 cursor-pointer 
                  hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
                    {getLanguageIcon(workflow.language)}
                  </div>
                  <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 
                    dark:bg-blue-900 dark:text-blue-200 rounded-full">
                    {workflow.status}
                  </span>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {workflow.name}
                </h4>
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Clock size={16} className="mr-2" />
                  {new Date(workflow.created).toLocaleString()}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
                    {workflow.language} Project
                  </span>
                  <ArrowRight 
                    size={20} 
                    className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Create New Workflow</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter workflow name"
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                      placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
                      focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Language
                  </label>
                  <select
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">Select language</option>
                    {languages.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Source Code
                  </label>
                  <div className="space-y-3">
                    {sourceTypes.map((type) => (
                      <label key={type.value} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="sourceType"
                          value={type.value}
                          checked={formData.sourceType === type.value}
                          onChange={(e) => setFormData({ ...formData, sourceType: e.target.value, sourceInput: '' })}
                          className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                        />
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <span className="text-sm text-gray-700">{type.label}</span>
                        </div>
                      </label>
                    ))}
                  </div>
                  {renderSourceInput()}
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
                      rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-blue-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md 
                      hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
                      focus:ring-blue-500"
                  >
                    Create
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Automation;


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import JSZip from 'jszip';
// import {
//   Play,
//   GitBranch,
//   Code2,
//   Terminal,
//   FileCode,
//   Braces,
//   ArrowRight,
//   Globe,
//   File,
//   FolderArchive,
//   X,
//   Clock
// } from 'lucide-react';

// const Automation = () => {
//   const navigate = useNavigate();
//   const [isOpen, setIsOpen] = useState(false);
//   const [workflows, setWorkflows] = useState([]);
//   const [formData, setFormData] = useState({
//     name: '',
//     language: '',
//     sourceType: '',
//     sourceInput: ''
//   });

//   const languages = [
//     { value: 'java', label: 'JAVA' },
//     { value: 'go', label: 'GO' },
//     { value: 'c', label: 'C' },
//     { value: 'cpp', label: 'C++' }
//   ];

//   const sourceTypes = [
//     { value: 'file', label: 'Single File', icon: <File className="w-4 h-4" /> },
//     { value: 'zip', label: 'ZIP File', icon: <FolderArchive className="w-4 h-4" /> },
//     { value: 'github', label: 'Github URL', icon: <Globe className="w-4 h-4" /> }
//   ];

//   const handleSubmit = async (e) => {
//     e.preventDefault();
    
//     let fileContent = null;
//     let fileStructure = null;
//     let fileName = '';

//     const inputElement = e.target.querySelector('input[type="file"]');
//     const file = inputElement?.files[0];

//     if (formData.sourceType === 'file') {
//       const file = e.target.querySelector('input[type="file"]').files[0];
//       fileName = file.name;
      
//       try {
//         const reader = new FileReader();
//         fileContent = await new Promise((resolve, reject) => {
//           reader.onload = (e) => resolve(e.target.result);
//           reader.onerror = (e) => reject(e);
//           reader.readAsText(file);
//         });
        
//         fileStructure = [{
//           name: fileName,
//           type: 'file',
//           content: fileContent
//         }];
//       } catch (error) {
//         console.error('Error reading file:', error);
//       } 

//     }

//     else if (formData.sourceType == 'zip'){
//       try {
//         const zip = new JSZip();
//         const zipData = await zip.loadAsync(file);
//         fileStructure = [];

//         await Promise.all(
//           Object.keys(zipData.files).map(async (filename) => {
//             if (!zipData.files[filename].dir) {
//               const content = await zipData.files[filename].async('text');
//               fileStructure.push({
//                 name: filename,
//                 type: 'file',
//                 content
//               });
//             }
//           })
//         );
//       } catch (error) {
//         console.error('Error extracting ZIP:', error);
//       }
//     }
//     else if (formData.sourceType === 'github') {
//       fileName = 'main.java';
//       fileContent = '// Content from GitHub\n// URL: ' + formData.sourceInput;
//       fileStructure = [{
//         name: fileName,
//         type: 'file',
//         content: fileContent
//       }];
//     }

//     const newWorkflow = {
//       ...formData,
//       id: `WF-${Math.random().toString(36).substr(2, 9)}`,
//       created: new Date(),
//       status: 'pending',
//       fileContent,
//       fileStructure,
//       fileName, 
//     };

//     setWorkflows([...workflows, newWorkflow]);
//     setIsOpen(false);
//     setFormData({ name: '', language: '', sourceType: '', sourceInput: '' });
//   };

//   const getLanguageIcon = (language) => {
//     switch (language) {
//       case 'java':
//         return <Code2 size={20} />;
//       case 'go':
//         return <GitBranch size={20} />;
//       case 'c':
//         return <Terminal size={20} />;
//       case 'cpp':
//         return <Braces size={20} />;
//       default:
//         return <FileCode size={20} />;
//     }
//   };

//   const handleWorkflowClick = (workflow) => {
//     navigate('/dashboard/use-cases/automation/details', { state: { workflow } });
//   };

//   const renderSourceInput = () => {
//     switch (formData.sourceType) {
//       case 'file':
//       case 'zip':
//         return (
//           <input
//             type="file"
//             accept={formData.sourceType === 'zip' ? '.zip' : undefined}
//             onChange={(e) => setFormData({ ...formData, sourceInput: e.target.value })}
//             className="mt-2 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 
//               file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 
//               file:text-blue-700 hover:file:bg-blue-100"
//           />
//         );
//       case 'github':
//         return (
//           <input
//             type="text"
//             placeholder="Enter Github URL"
//             value={formData.sourceInput}
//             onChange={(e) => setFormData({ ...formData, sourceInput: e.target.value })}
//             className="mt-2 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
//               placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//           />
//         );
//       default:
//         return null;
//     }
//   };

//   return (
//     <div className="w-full max-w-7xl mx-auto px-4 py-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm mb-8">
//         <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Automation Studio</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">
//               Streamline your development workflow with intelligent automation tools
//             </p>
//           </div>
//           <div className="flex items-center gap-4 mt-4 md:mt-0">
//             <button
//               onClick={() => setIsOpen(true)}
//               className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg 
//                 hover:bg-blue-700 transition-colors duration-200"
//             >
//               <Play size={18} />
//               Create Workflow
//             </button>
//           </div>
//         </div>
//       </div>

//       {/* Workflows List */}
//       {workflows.length > 0 && (
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-8">
//           <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
//             Your Workflows
//           </h3>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//             {workflows.map((workflow) => (
//               <div
//                 key={workflow.id}
//                 onClick={() => handleWorkflowClick(workflow)}
//                 className="group bg-gray-50 dark:bg-gray-700 rounded-lg p-6 cursor-pointer 
//                   hover:shadow-md transition-all duration-200"
//               >
//                 <div className="flex items-center justify-between mb-4">
//                   <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg text-blue-600 dark:text-blue-300">
//                     {getLanguageIcon(workflow.language)}
//                   </div>
//                   <span className="px-2.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 
//                     dark:bg-blue-900 dark:text-blue-200 rounded-full">
//                     {workflow.status}
//                   </span>
//                 </div>
//                 <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
//                   {workflow.name}
//                 </h4>
//                 <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-4">
//                   <Clock size={16} className="mr-2" />
//                   {new Date(workflow.created).toLocaleString()}
//                 </div>
//                 <div className="flex items-center justify-between">
//                   <span className="text-sm font-medium text-gray-600 dark:text-gray-300 capitalize">
//                     {workflow.language} Project
//                   </span>
//                   <ArrowRight 
//                     size={20} 
//                     className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
//                   />
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Modal */}
//       {isOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
//           <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
//             <div className="p-6">
//               <div className="flex justify-between items-center mb-6">
//                 <h3 className="text-lg font-semibold text-gray-900">Create New Workflow</h3>
//                 <button
//                   onClick={() => setIsOpen(false)}
//                   className="text-gray-400 hover:text-gray-500"
//                 >
//                   <X size={20} />
//                 </button>
//               </div>

//               <form onSubmit={handleSubmit} className="space-y-6">
//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Name
//                   </label>
//                   <input
//                     type="text"
//                     value={formData.name}
//                     onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//                     placeholder="Enter workflow name"
//                     className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
//                       placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 
//                       focus:border-blue-500"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Language
//                   </label>
//                   <select
//                     value={formData.language}
//                     onChange={(e) => setFormData({ ...formData, language: e.target.value })}
//                     className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm 
//                       focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
//                     required
//                   >
//                     <option value="">Select language</option>
//                     {languages.map((lang) => (
//                       <option key={lang.value} value={lang.value}>
//                         {lang.label}
//                       </option>
//                     ))}
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 mb-1">
//                     Source Code
//                   </label>
//                   <div className="space-y-3">
//                     {sourceTypes.map((type) => (
//                       <label key={type.value} className="flex items-center gap-3">
//                         <input
//                           type="radio"
//                           name="sourceType"
//                           value={type.value}
//                           checked={formData.sourceType === type.value}
//                           onChange={(e) => setFormData({ ...formData, sourceType: e.target.value, sourceInput: '' })}
//                           className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
//                         />
//                         <div className="flex items-center gap-2">
//                           {type.icon}
//                           <span className="text-sm text-gray-700">{type.label}</span>
//                         </div>
//                       </label>
//                     ))}
//                   </div>
//                   {renderSourceInput()}
//                 </div>

//                 <div className="flex justify-end gap-4 pt-4">
//                   <button
//                     type="button"
//                     onClick={() => setIsOpen(false)}
//                     className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 
//                       rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 
//                       focus:ring-blue-500"
//                   >
//                     Cancel
//                   </button>
//                   <button
//                     type="submit"
//                     className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md 
//                       hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 
//                       focus:ring-blue-500"
//                   >
//                     Create
//                   </button>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Automation;