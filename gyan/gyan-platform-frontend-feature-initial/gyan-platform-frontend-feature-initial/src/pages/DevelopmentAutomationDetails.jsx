// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { 
//   ArrowLeft,
//   Download,
//   FileCode,
//   Play,
//   Loader,
//   Code,
//   CheckCircle,
//   FolderTree,
//   RefreshCw,
//   ChevronRight,
//   ChevronDown,
//   File,
//   Folder,
//   Info,
//   X,
//   ChevronLeft
// } from 'lucide-react';

// const DevelopmentAutomationDetails = () => {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [projectData, setProjectData] = useState(null);
//   const [dataContent, setDataContent] = useState(null);
  
//   // File directory/viewer states
//   const [fileStructure, setFileStructure] = useState(null);
//   const [selectedFile, setSelectedFile] = useState(null);
//   const [selectedFileSpecs, setSelectedFileSpecs] = useState([]);
//   const [generatedFiles, setGeneratedFiles] = useState({});
//   const [directoryCollapsed, setDirectoryCollapsed] = useState(false);
//   const [showSpecsModal, setShowSpecsModal] = useState(false);
  
//   // Dynamic specifications 
//   const [technicalSpecs, setTechnicalSpecs] = useState([
//     { id: 'TS001', title: 'Data Schema Validation', description: 'Validate data structure against schema', selected: false },
//     { id: 'TS002', title: 'Data Type Validation', description: 'Validate data types for all fields', selected: false },
//     { id: 'TS003', title: 'Value Range Validation', description: 'Validate values against allowed ranges', selected: false },
//     { id: 'TS004', title: 'Schema Definition', description: 'Define validation schema in JSON format', selected: false },
//     { id: 'TS005', title: 'Data Cleaning', description: 'Clean and preprocess raw data', selected: false },
//     { id: 'TS006', title: 'Data Transformation', description: 'Transform data for analysis', selected: false },
//     { id: 'TS007', title: 'Missing Value Handling', description: 'Handle missing values in datasets', selected: false },
//     { id: 'TS008', title: 'Descriptive Statistics', description: 'Calculate descriptive statistics', selected: false },
//     { id: 'TS009', title: 'Correlation Analysis', description: 'Analyze correlations between variables', selected: false },
//     { id: 'TS010', title: 'Outlier Detection', description: 'Detect and handle outliers', selected: false },
//     { id: 'TS011', title: 'CSV Export', description: 'Export data to CSV format', selected: false },
//     { id: 'TS012', title: 'Excel Export', description: 'Export data to Excel format', selected: false }
//   ]);
  
//   const [functionalSpecs, setFunctionalSpecs] = useState([
//     { id: 'FS001', title: 'Line Charts', description: 'Generate line charts from data', selected: false },
//     { id: 'FS002', title: 'Bar Charts', description: 'Generate bar charts from data', selected: false },
//     { id: 'FS003', title: 'Heatmaps', description: 'Generate heatmaps for correlation visualization', selected: false },
//     { id: 'FS004', title: 'HTML Reports', description: 'Generate HTML reports', selected: false },
//     { id: 'FS005', title: 'PDF Reports', description: 'Generate PDF reports', selected: false },
//     { id: 'FS006', title: 'Report Templates', description: 'Define report templates', selected: false },
//     { id: 'FS007', title: 'Workflow Definition', description: 'Define data processing workflows', selected: false },
//     { id: 'FS008', title: 'Workflow Execution', description: 'Execute data processing workflows', selected: false },
//     { id: 'FS009', title: 'Workflow Monitoring', description: 'Monitor workflow execution', selected: false },
//     { id: 'FS010', title: 'Data Input UI', description: 'User interface for data input', selected: false },
//     { id: 'FS011', title: 'Visualization UI', description: 'User interface for data visualization', selected: false },
//     { id: 'FS012', title: 'Export UI', description: 'User interface for data export', selected: false }
//   ]);
  
//   const [isGenerating, setIsGenerating] = useState(false);
//   const [expandedFolders, setExpandedFolders] = useState({});
//   const [isLoading, setIsLoading] = useState(false);

//   // Mock file content mapping to specifications
//   const fileSpecMapping = {
//     'data_validation.py': ['TS001', 'TS002', 'TS003'],
//     'validation_schema.json': ['TS001', 'TS004'],
//     'data_processor.py': ['TS005', 'TS006', 'TS007'],
//     'data_analysis.py': ['TS008', 'TS009', 'TS010'],
//     'export_utils.py': ['TS011', 'TS012'],
//     'visualization.py': ['FS001', 'FS002', 'FS003'],
//     'reporting.py': ['FS004', 'FS005'],
//     'report_template.html': ['FS004', 'FS006'],
//     'workflow.py': ['FS007', 'FS008', 'FS009'],
//     'ui.py': ['FS010', 'FS011', 'FS012']
//   };

//   useEffect(() => {
//     // Check if state has project data
//     if (location.state && location.state.projectData) {
//       setProjectData(location.state.projectData);
      
//       // If there's a data file, parse and display it
//       if (location.state.projectData.dataFile) {
//         try {
//           // Just set data content for now
//           setDataContent(`Loaded ${location.state.projectData.dataFile.name}. Using default specifications.`);
          
//           // Try to read file content - this will not work for Excel files in this context
//           // But we're keeping the structure for future implementation
//           readDataFile(location.state.projectData.dataFile);
//         } catch (error) {
//           console.error("Error handling data file:", error);
//           setDataContent(`Error reading ${location.state.projectData.dataFile.name}. Using default specifications.`);
//         }
//       }
//     } else {
//       // If no data is passed, redirect back to development automation page
//       navigate('/dashboard/use-cases/development-automation');
//     }
//   }, [location, navigate]);

//   // Read data file - in a real implementation, this would parse the Excel file
//   const readDataFile = (file) => {
//     // In a real implementation, this would use XLS/CSV parsing libraries
//     // For now, we're just logging and using the default specs
//     console.log("File to read:", file.name);
    
//     // In a real implementation we'd use a library like SheetJS/xlsx
//     // But for this demo, we'll just use the default specifications
//   };

//   const handleGoBack = () => {
//     navigate('/dashboard/use-cases/development-automation');
//   };

//   // Toggle a single technical specification
//   const toggleTechnicalSpec = (id) => {
//     setTechnicalSpecs(prevSpecs => 
//       prevSpecs.map(spec => 
//         spec.id === id ? {...spec, selected: !spec.selected} : spec
//       )
//     );
//   };

//   // Toggle a single functional specification
//   const toggleFunctionalSpec = (id) => {
//     setFunctionalSpecs(prevSpecs => 
//       prevSpecs.map(spec => 
//         spec.id === id ? {...spec, selected: !spec.selected} : spec
//       )
//     );
//   };

//   // Toggle all technical specifications
//   const toggleAllTechnicalSpecs = () => {
//     const allSelected = technicalSpecs.every(spec => spec.selected);
//     setTechnicalSpecs(prevSpecs => 
//       prevSpecs.map(spec => ({...spec, selected: !allSelected}))
//     );
//   };

//   // Toggle all functional specifications
//   const toggleAllFunctionalSpecs = () => {
//     const allSelected = functionalSpecs.every(spec => spec.selected);
//     setFunctionalSpecs(prevSpecs => 
//       prevSpecs.map(spec => ({...spec, selected: !allSelected}))
//     );
//   };

//   // Toggle folder expansion in file tree
//   const toggleFolder = (folderId) => {
//     setExpandedFolders(prev => ({
//       ...prev,
//       [folderId]: !prev[folderId]
//     }));
//   };

//   // Toggle directory collapse
//   const toggleDirectoryCollapse = () => {
//     setDirectoryCollapsed(!directoryCollapsed);
//   };

//   // Generate mock file content based on description
//   const generateMockContent = (fileName, specIds) => {
//     const fileExtension = fileName.split('.').pop();
//     let content = '';
    
//     if (fileExtension === 'py') {
//       content = `# ${fileName} - Generated based on specifications\n`;
//       content += `# This file implements the following specifications:\n`;
      
//       // Add specs from both technical and functional
//       const allSpecs = [...technicalSpecs, ...functionalSpecs];
//       specIds.forEach(id => {
//         const spec = allSpecs.find(s => s.id === id);
//         if (spec) {
//           content += `# - [${spec.id}] ${spec.title}: ${spec.description}\n`;
//         }
//       });
      
//       content += '\n# Implementation follows below\n';
//       content += `def main():\n    print("Implementing specifications for ${fileName}")\n\nif __name__ == "__main__":\n    main()`;
//     } else if (fileExtension === 'json') {
//       const jsonContent = {
//         name: fileName,
//         description: "Generated based on specifications",
//         specifications: specIds.map(id => {
//           const spec = [...technicalSpecs, ...functionalSpecs].find(s => s.id === id);
//           return spec ? { id: spec.id, title: spec.title } : { id };
//         })
//       };
      
//       content = JSON.stringify(jsonContent, null, 2);
//     } else if (fileExtension === 'html') {
//       content = `<!DOCTYPE html>\n<html>\n<head>\n  <title>${fileName}</title>\n</head>\n<body>\n  <h1>${fileName}</h1>\n  <p>This file implements the following specifications:</p>\n  <ul>`;
      
//       // Add specs from both technical and functional
//       const allSpecs = [...technicalSpecs, ...functionalSpecs];
//       specIds.forEach(id => {
//         const spec = allSpecs.find(s => s.id === id);
//         if (spec) {
//           content += `\n    <li><strong>${spec.id}:</strong> ${spec.title} - ${spec.description}</li>`;
//         }
//       });
      
//       content += '\n  </ul>\n</body>\n</html>';
//     }
    
//     return content;
//   };

//   const generateCode = () => {
//     setIsGenerating(true);
    
//     // Get selected specifications
//     const selectedTechSpecs = technicalSpecs.filter(spec => spec.selected).map(spec => spec.id);
//     const selectedFuncSpecs = functionalSpecs.filter(spec => spec.selected).map(spec => spec.id);
    
//     if (selectedTechSpecs.length === 0 && selectedFuncSpecs.length === 0) {
//       alert("Please select at least one specification to generate code.");
//       setIsGenerating(false);
//       return;
//     }
    
//     // Simulate API call with a timeout
//     setTimeout(() => {
//       // Create file structure based on selected specifications
//       const newFileStructure = {
//         id: 'root',
//         name: projectData.projectName || 'project',
//         type: 'folder',
//         children: []
//       };
      
//       // Add src folder
//       const srcFolder = {
//         id: 'src',
//         name: 'src',
//         type: 'folder',
//         children: []
//       };
      
//       // Add utilities folder
//       const utilitiesFolder = {
//         id: 'utilities',
//         name: 'utilities',
//         type: 'folder',
//         children: []
//       };
      
//       // Add generated files based on selected specifications
//       const newGeneratedFiles = {};
      
//       // Filter files based on selected specifications
//       const selectedFiles = Object.entries(fileSpecMapping).filter(([fileName, specIds]) => {
//         // Check if any of the file's specs are selected
//         return specIds.some(specId => 
//           selectedTechSpecs.includes(specId) || selectedFuncSpecs.includes(specId)
//         );
//       });
      
//       // Add technical specification files
//       selectedFiles.forEach(([fileName, specIds]) => {
//         // Check if this is a technical spec file (TS prefix)
//         const isTechSpec = specIds.some(id => id.startsWith('TS'));
        
//         if (isTechSpec) {
//           const fileId = fileName;
          
//           // Generate content based on the file's specifications
//           const fileContent = generateMockContent(fileName, specIds);
          
//           // Add to generated files
//           newGeneratedFiles[fileId] = {
//             id: fileId,
//             name: fileName,
//             content: fileContent,
//             specIds: specIds
//           };
          
//           // Add to utilities folder
//           utilitiesFolder.children.push({
//             id: fileId,
//             name: fileName,
//             type: 'file',
//             parentId: 'utilities'
//           });
//         }
//       });
      
//       // Add functional specification files
//       selectedFiles.forEach(([fileName, specIds]) => {
//         // Check if this is a functional spec file (FS prefix)
//         const isFuncSpec = specIds.some(id => id.startsWith('FS'));
        
//         if (isFuncSpec) {
//           const fileId = fileName;
          
//           // Generate content based on the file's specifications
//           const fileContent = generateMockContent(fileName, specIds);
          
//           // Add to generated files
//           newGeneratedFiles[fileId] = {
//             id: fileId,
//             name: fileName,
//             content: fileContent,
//             specIds: specIds
//           };
          
//           // Add to src folder
//           srcFolder.children.push({
//             id: fileId,
//             name: fileName,
//             type: 'file',
//             parentId: 'src'
//           });
//         }
//       });
      
//       // Add folders to file structure if they have children
//       if (utilitiesFolder.children.length > 0) {
//         srcFolder.children.push(utilitiesFolder);
//       }
      
//       if (srcFolder.children.length > 0) {
//         newFileStructure.children.push(srcFolder);
//       }
      
//       // Add tests folder if test-related specifications are selected
//       const testSpecIds = ['TS001', 'TS003', 'TS008', 'TS010'];
//       if (testSpecIds.some(id => selectedTechSpecs.includes(id))) {
//         const testsFolder = {
//           id: 'tests',
//           name: 'tests',
//           type: 'folder',
//           children: [
//             {
//               id: 'test_validation',
//               name: 'test_validation.py',
//               type: 'file',
//               parentId: 'tests'
//             },
//             {
//               id: 'test_analysis',
//               name: 'test_analysis.py',
//               type: 'file',
//               parentId: 'tests'
//             }
//           ]
//         };
        
//         newFileStructure.children.push(testsFolder);
        
//         // Add test files to generated files
//         newGeneratedFiles['test_validation'] = {
//           id: 'test_validation',
//           name: 'test_validation.py',
//           content: generateMockContent('test_validation.py', ['TS001', 'TS003']),
//           specIds: ['TS001', 'TS003']
//         };
        
//         newGeneratedFiles['test_analysis'] = {
//           id: 'test_analysis',
//           name: 'test_analysis.py',
//           content: generateMockContent('test_analysis.py', ['TS008', 'TS010']),
//           specIds: ['TS008', 'TS010']
//         };
//       }
      
//       // Add README.md
//       newFileStructure.children.push({
//         id: 'readme',
//         name: 'README.md',
//         type: 'file',
//         parentId: 'root'
//       });
      
//       // Add README.md content with selected specification references
//       const readmeContent = `# ${projectData.projectName || 'Data Processing Project'}\n\n## Overview\nThis project provides tools for processing and analyzing data from CSV/Excel files.\n\n## Features\n${selectedTechSpecs.map(id => {
//         const spec = technicalSpecs.find(s => s.id === id);
//         return spec ? `- [${spec.id}] ${spec.title}\n` : '';
//       }).join('')}${selectedFuncSpecs.map(id => {
//         const spec = functionalSpecs.find(s => s.id === id);
//         return spec ? `- [${spec.id}] ${spec.title}\n` : '';
//       }).join('')}\n## Requirements\nSee requirements.txt file for dependencies.`;
      
//       newGeneratedFiles['readme'] = {
//         id: 'readme',
//         name: 'README.md',
//         content: readmeContent,
//         specIds: [...selectedTechSpecs, ...selectedFuncSpecs]
//       };
      
//       // Add requirements.txt
//       newFileStructure.children.push({
//         id: 'requirements',
//         name: 'requirements.txt',
//         type: 'file',
//         parentId: 'root'
//       });
      
//       // Add requirements.txt content based on selected specifications
//       const requirementsContent = `pandas==1.5.3\nnumpy==1.24.2\n${selectedFuncSpecs.includes('FS001') || selectedFuncSpecs.includes('FS002') || selectedFuncSpecs.includes('FS003') ? 'matplotlib==3.7.1\nseaborn==0.12.2\n' : ''}${selectedFuncSpecs.includes('FS004') || selectedFuncSpecs.includes('FS005') ? 'jinja2==3.1.2\n' : ''}${selectedTechSpecs.includes('TS011') || selectedTechSpecs.includes('TS012') ? 'openpyxl==3.1.2\nxlrd==2.0.1\n' : ''}${selectedFuncSpecs.includes('FS005') ? 'pdfkit==1.0.0\n' : ''}`;
      
//       newGeneratedFiles['requirements'] = {
//         id: 'requirements',
//         name: 'requirements.txt',
//         content: requirementsContent,
//         specIds: [] // Not directly tied to specific specs
//       };
      
//       // Set state with new file structure and generated files
//       setFileStructure(newFileStructure);
//       setGeneratedFiles(newGeneratedFiles);
      
//       // Set expanded folders
//       setExpandedFolders({
//         root: true,
//         src: true
//       });
      
//       // Set initial selected file
//       if (newFileStructure.children.length > 0) {
//         if (newGeneratedFiles['readme']) {
//           setSelectedFile(newGeneratedFiles['readme']);
//           // Set selected file specifications
//           setSelectedFileSpecs(getSpecifications(newGeneratedFiles['readme'].specIds));
//         } else {
//           // Find first file
//           let firstFile = null;
          
//           // Helper function to find first file
//           const findFirstFile = (folder) => {
//             for (const child of folder.children) {
//               if (child.type === 'file') {
//                 return newGeneratedFiles[child.id];
//               } else if (child.type === 'folder') {
//                 const file = findFirstFile(child);
//                 if (file) return file;
//               }
//             }
//             return null;
//           };
          
//           firstFile = findFirstFile(newFileStructure);
          
//           if (firstFile) {
//             setSelectedFile(firstFile);
//             // Set selected file specifications
//             setSelectedFileSpecs(getSpecifications(firstFile.specIds));
//           }
//         }
//       }
      
//       setIsGenerating(false);
//     }, 2000);
//   };

//   // Get specification objects from IDs
//   const getSpecifications = (specIds) => {
//     if (!specIds) return [];
    
//     const specs = [];
    
//     specIds.forEach(id => {
//       // Check in technical specs
//       const techSpec = technicalSpecs.find(spec => spec.id === id);
//       if (techSpec) {
//         specs.push({...techSpec, type: 'technical'});
//         return;
//       }
      
//       // Check in functional specs
//       const funcSpec = functionalSpecs.find(spec => spec.id === id);
//       if (funcSpec) {
//         specs.push({...funcSpec, type: 'functional'});
//       }
//     });
    
//     return specs;
//   };

//   // Handle file selection
//   const handleFileSelect = (fileId) => {
//     const file = generatedFiles[fileId];
//     if (file) {
//       setSelectedFile(file);
//       // Set selected file specifications
//       setSelectedFileSpecs(getSpecifications(file.specIds));
//     }
//   };

//   // Open specifications modal
//   const openSpecsModal = (e) => {
//     e.stopPropagation();
//     setShowSpecsModal(true);
//   };

//   // Close specifications modal
//   const closeSpecsModal = () => {
//     setShowSpecsModal(false);
//   };

//   // Handle project download
//   const handleDownloadProject = () => {
//     if (!fileStructure || Object.keys(generatedFiles).length === 0) {
//       alert("No project files to download");
//       return;
//     }
    
//     // In a real implementation, we would:
//     // 1. Create a ZIP file with all the generated files
//     // 2. Maintain the folder structure
//     // 3. Trigger the download
    
//     // For this demo, we'll create a text representation of the project
//     let projectText = `# ${projectData.projectName || 'Generated Project'}\n\n`;
    
//     // Helper function to build project text recursively
//     const buildProjectText = (node, indent = '') => {
//       if (node.type === 'folder') {
//         projectText += `${indent}📁 ${node.name}/\n`;
        
//         if (node.children && node.children.length > 0) {
//           node.children.forEach(child => {
//             buildProjectText(child, indent + '  ');
//           });
//         }
//       } else {
//         projectText += `${indent}📄 ${node.name}\n`;
        
//         // Add file content if available
//         const file = generatedFiles[node.id];
//         if (file && file.content) {
//           projectText += `${indent}  Content preview: ${file.content.substring(0, 50)}...\n`;
//         }
//       }
//     };
    
//     // Build project text
//     buildProjectText(fileStructure);
    
//     // Create a blob and trigger download
//     const blob = new Blob([projectText], { type: 'text/plain' });
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement('a');
//     a.href = url;
//     a.download = `${projectData.projectName || 'project'}_structure.txt`;
//     document.body.appendChild(a);
//     a.click();
//     document.body.removeChild(a);
//     URL.revokeObjectURL(url);
    
//     // Show alert for demo purposes
//     alert("In a real implementation, this would download a ZIP file containing all the generated project files in their proper structure.");
//   };

//   // Render file tree
//   const renderFileTree = (node, level = 0) => {
//     if (!node) return null;
    
//     const isExpanded = expandedFolders[node.id];
    
//     if (node.type === 'folder') {
//       return (
//         <div key={node.id}>
//           <div 
//             className={`flex items-center ${level > 0 ? 'pl-4' : ''} py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer`}
//             onClick={() => toggleFolder(node.id)}
//           >
//             {isExpanded ? (
//               <ChevronDown size={16} className="text-gray-500 mr-1" />
//             ) : (
//               <ChevronRight size={16} className="text-gray-500 mr-1" />
//             )}
//             <Folder size={16} className="text-yellow-500 mr-2" />
//             <span className="text-sm">{node.name}</span>
//           </div>
          
//           {isExpanded && node.children && (
//             <div className={`${level > 0 ? 'border-l border-gray-200 dark:border-gray-700 ml-2 pl-2' : ''}`}>
//               {node.children.map(child => renderFileTree(child, level + 1))}
//             </div>
//           )}
//         </div>
//       );
//     } else {
//       return (
//         <div key={node.id}>
//           <div 
//             className={`flex items-center ${level > 0 ? 'pl-4' : ''} py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${selectedFile && selectedFile.id === node.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
//             onClick={() => handleFileSelect(node.id)}
//           >
//             <File size={16} className="text-gray-500 mr-2 ml-4" />
//             <span className="text-sm">{node.name}</span>
//           </div>
//         </div>
//       );
//     }
//   };

//   if (!projectData) {
//     return <div className="p-8">Loading...</div>;
//   }

//   return (
//     <div className="max-w-7xl mx-auto px-4 py-8">
//       {/* Header */}
//       <div className="flex items-center mb-6">
//         <button 
//           onClick={handleGoBack}
//           className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
//         >
//           <ArrowLeft size={20} />
//         </button>
//         <div>
//           <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
//             {projectData.projectName || "Development Project Details"}
//           </h1>
//           <p className="text-gray-500 dark:text-gray-400">
//             Select specifications and generate code for your project
//           </p>
//         </div>
//       </div>

//       {/* Main content */}
//       <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//         {/* Left side - File tree and code display */}
//         <div className="lg:col-span-2">
//           <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
//             {/* File tree with toggle */}
//             {!directoryCollapsed && (
//               <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700">
//                 <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
//                   <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
//                     <FolderTree size={18} className="mr-2" />
//                     Project Files
//                   </h2>
//                   <button 
//                     onClick={toggleDirectoryCollapse}
//                     className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
//                   >
//                     <Folder size={18} />
//                   </button>
//                 </div>
                
//                 {fileStructure ? (
//                   <div className="p-2 h-96 overflow-auto">
//                     {renderFileTree(fileStructure)}
//                   </div>
//                 ) : (
//                   <div className="p-4 h-96 flex items-center justify-center">
//                     <p className="text-gray-500 dark:text-gray-400 text-center">
//                       {isGenerating ? (
//                         <span className="flex items-center">
//                           <Loader size={16} className="animate-spin mr-2" />
//                           Generating file structure...
//                         </span>
//                       ) : (
//                         "Generate code to see file structure"
//                       )}
//                     </p>
//                   </div>
//                 )}
                
//                 {/* Download button */}
//                 {fileStructure && (
//                   <div className="p-4 border-t border-gray-200 dark:border-gray-700">
//                     <button
//                       className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
//                       onClick={handleDownloadProject}
//                     >
//                       <Download size={16} />
//                       Download
//                     </button>
//                   </div>
//                 )}
//               </div>
//             )}
            
//             {/* Code display */}
//             <div className="flex-1">
//               <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
//                 {directoryCollapsed && (
//                   <button 
//                     onClick={toggleDirectoryCollapse}
//                     className="p-1 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
//                   >
//                     <Folder size={18} />
//                   </button>
//                 )}

//                 <div className="flex-1 flex items-center">
//                   <Code size={18} className="mr-2 text-gray-600 dark:text-gray-400" />
//                   <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
//                     {selectedFile ? selectedFile.name : "Code Viewer"}
//                   </h2>
//                 </div>
                
//                 {selectedFile && selectedFileSpecs.length > 0 && (
//                   <button
//                     onClick={openSpecsModal}
//                     className="p-1 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
//                     title="View specifications"
//                   >
//                     <Info size={18} />
//                   </button>
//                 )}
//               </div>
              
//               <div className="p-4 h-96 overflow-auto bg-gray-50 dark:bg-gray-900">
//                 {selectedFile ? (
//                   <pre className="text-sm font-mono text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
//                     {selectedFile.content}
//                   </pre>
//                 ) : (
//                   <div className="h-full flex items-center justify-center">
//                     <p className="text-gray-500 dark:text-gray-400 text-center">
//                       {isGenerating ? (
//                         <span className="flex items-center">
//                           <Loader size={16} className="animate-spin mr-2" />
//                           Generating code...
//                         </span>
//                       ) : (
//                         "Select a file to view code"
//                       )}
//                     </p>
//                   </div>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>
        
//         {/* Right side - Specifications */}
//         <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
//           <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">
//             Input Data & Specifications
//           </h2>
          
//           {/* Data file info */}
//           <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-700">
//             <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Data File</h3>
//             <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
//               <span className="font-medium">Name:</span> {projectData.dataFile ? projectData.dataFile.name : "Not specified"}
//             </p>
//             {isLoading ? (
//               <div className="flex items-center justify-center py-1">
//                 <Loader size={14} className="animate-spin text-blue-500 mr-2" />
//                 <span className="text-xs text-gray-600 dark:text-gray-300">Loading specifications...</span>
//               </div>
//             ) : (
//               dataContent && (
//                 <div className="text-xs text-gray-600 dark:text-gray-300 border-t border-blue-200 dark:border-blue-700 pt-1 mt-1">
//                   {dataContent}
//                 </div>
//               )
//             )}
//           </div>
          
//           {/* Technical specifications */}
//           <div className="mb-3">
//             <div className="flex items-center justify-between mb-1">
//               <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Technical Specifications</h3>
//               <button 
//                 className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
//                 onClick={toggleAllTechnicalSpecs}
//                 disabled={isLoading}
//               >
//                 {technicalSpecs.every(spec => spec.selected) ? "Deselect All" : "Select All"}
//               </button>
//             </div>
            
//             {isLoading ? (
//               <div className="flex items-center justify-center h-12 border border-gray-200 dark:border-gray-700 rounded-lg">
//                 <Loader size={14} className="animate-spin text-blue-500 mr-2" />
//                 <span className="text-xs text-gray-600 dark:text-gray-300">Loading specifications...</span>
//               </div>
//             ) : (
//               <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
//                 {technicalSpecs.map(spec => (
//                   <div 
//                     key={spec.id}
//                     className={`p-2 rounded-lg cursor-pointer ${
//                       spec.selected 
//                         ? 'bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700' 
//                         : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
//                     }`}
//                     onClick={() => toggleTechnicalSpec(spec.id)}
//                   >
//                     <div className="flex items-start">
//                       <div className="flex-shrink-0 mt-0.5">
//                         <div className={`w-3 h-3 rounded ${
//                           spec.selected ? 'bg-blue-500' : 'border border-gray-300 dark:border-gray-600'
//                         }`}>
//                           {spec.selected && (
//                             <CheckCircle size={12} className="text-white" />
//                           )}
//                         </div>
//                       </div>
//                       <div className="ml-2">
//                         <h4 className="text-xs font-medium text-gray-900 dark:text-white">{spec.id}: {spec.title}</h4>
//                         <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{spec.description}</p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
          
//           {/* Functional specifications */}
//           <div className="mb-3">
//             <div className="flex items-center justify-between mb-1">
//               <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Functional Specifications</h3>
//               <button 
//                 className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
//                 onClick={toggleAllFunctionalSpecs}
//                 disabled={isLoading}
//               >
//                 {functionalSpecs.every(spec => spec.selected) ? "Deselect All" : "Select All"}
//               </button>
//             </div>
            
//             {isLoading ? (
//               <div className="flex items-center justify-center h-12 border border-gray-200 dark:border-gray-700 rounded-lg">
//                 <Loader size={14} className="animate-spin text-blue-500 mr-2" />
//                 <span className="text-xs text-gray-600 dark:text-gray-300">Loading specifications...</span>
//               </div>
//             ) : (
//               <div className="max-h-40 overflow-y-auto pr-1 space-y-1">
//                 {functionalSpecs.map(spec => (
//                   <div 
//                     key={spec.id}
//                     className={`p-2 rounded-lg cursor-pointer ${
//                       spec.selected 
//                         ? 'bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700' 
//                         : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700/50'
//                     }`}
//                     onClick={() => toggleFunctionalSpec(spec.id)}
//                   >
//                     <div className="flex items-start">
//                       <div className="flex-shrink-0 mt-0.5">
//                         <div className={`w-3 h-3 rounded ${
//                           spec.selected ? 'bg-green-500' : 'border border-gray-300 dark:border-gray-600'
//                         }`}>
//                           {spec.selected && (
//                             <CheckCircle size={12} className="text-white" />
//                           )}
//                         </div>
//                       </div>
//                       <div className="ml-2">
//                         <h4 className="text-xs font-medium text-gray-900 dark:text-white">{spec.id}: {spec.title}</h4>
//                         <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1">{spec.description}</p>
//                       </div>
//                     </div>
//                   </div>
//                 ))}
//               </div>
//             )}
//           </div>
          
//           {/* Generate button */}
//           <button
//             onClick={generateCode}
//             disabled={isGenerating || isLoading}
//             className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
//           >
//             {isGenerating ? (
//               <>
//                 <Loader size={14} className="animate-spin" />
//                 <span className="text-sm">Generating Code Files...</span>
//               </>
//             ) : (
//               <>
//                 <Play size={14} />
//                 <span className="text-sm">Generate Code Files</span>
//               </>
//             )}
//           </button>
//         </div>
//       </div>

//       {/* Specifications Modal */}
//       {showSpecsModal && selectedFile && (
//         <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={closeSpecsModal}>
//           <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 max-h-[60vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
//             <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
//               <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
//                 <Info size={16} className="text-blue-500 mr-2" />
//                 {selectedFile.name} Specifications
//               </h3>
//               <button
//                 onClick={closeSpecsModal}
//                 className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
//               >
//                 <X size={16} />
//               </button>
//             </div>
            
//             <div className="p-3 overflow-y-auto">
//               {selectedFileSpecs.length > 0 ? (
//                 <div className="space-y-2">
//                   {selectedFileSpecs.map(spec => (
//                     <div 
//                       key={spec.id}
//                       className={`p-2 rounded-md ${
//                         spec.type === 'technical' 
//                           ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
//                           : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
//                       }`}
//                     >
//                       <div className="flex items-center mb-1">
//                         <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
//                           spec.type === 'technical'
//                             ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
//                             : 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
//                         }`}>
//                           {spec.id}
//                         </span>
//                       </div>
                      
//                       <h4 className="text-sm font-medium text-gray-900 dark:text-white">{spec.title}</h4>
//                       <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{spec.description}</p>
//                     </div>
//                   ))}
//                 </div>
//               ) : (
//                 <p className="text-center text-gray-500 dark:text-gray-400">
//                   No specifications associated with this file.
//                 </p>
//               )}
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DevelopmentAutomationDetails;


import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft,
  Download,
  FileCode,
  Play,
  Loader,
  Code,
  CheckCircle,
  FolderTree,
  RefreshCw,
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Info,
  X,
  ChevronLeft
} from 'lucide-react';
import * as XLSX from 'xlsx';
import JSZip from "jszip";
import { saveAs } from "file-saver";

const DevelopmentAutomationDetails = () => {
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  const location = useLocation();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState(null);
  const [dataContent, setDataContent] = useState(null);
  const [mappedCSVData, setCSVData] = useState([]);
  
  // File directory/viewer states
  const [fileStructure, setFileStructure] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileSpecs, setSelectedFileSpecs] = useState([]);
  const [generatedFiles, setGeneratedFiles] = useState({});
  const [directoryCollapsed, setDirectoryCollapsed] = useState(false);
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  
  // Dynamic specifications 
  const [technicalSpecs, setTechnicalSpecs] = useState([
    { id: 'TS001', title: 'Data Schema Validation', description: 'Validate data structure against schema', selected: false },
    { id: 'TS002', title: 'Data Type Validation', description: 'Validate data types for all fields', selected: false },
    { id: 'TS003', title: 'Value Range Validation', description: 'Validate values against allowed ranges', selected: false },
    { id: 'TS004', title: 'Schema Definition', description: 'Define validation schema in JSON format', selected: false },
    { id: 'TS005', title: 'Data Cleaning', description: 'Clean and preprocess raw data', selected: false },
    { id: 'TS006', title: 'Data Transformation', description: 'Transform data for analysis', selected: false },
    { id: 'TS007', title: 'Missing Value Handling', description: 'Handle missing values in datasets', selected: false },
    { id: 'TS008', title: 'Descriptive Statistics', description: 'Calculate descriptive statistics', selected: false },
    { id: 'TS009', title: 'Correlation Analysis', description: 'Analyze correlations between variables', selected: false },
    { id: 'TS010', title: 'Outlier Detection', description: 'Detect and handle outliers', selected: false },
    { id: 'TS011', title: 'CSV Export', description: 'Export data to CSV format', selected: false },
    { id: 'TS012', title: 'Excel Export', description: 'Export data to Excel format', selected: false }
  ]);
  
  const [functionalSpecs, setFunctionalSpecs] = useState([
    { id: 'FS001', title: 'Line Charts', description: 'Generate line charts from data', selected: false },
    { id: 'FS002', title: 'Bar Charts', description: 'Generate bar charts from data', selected: false },
    { id: 'FS003', title: 'Heatmaps', description: 'Generate heatmaps for correlation visualization', selected: false },
    { id: 'FS004', title: 'HTML Reports', description: 'Generate HTML reports', selected: false },
    { id: 'FS005', title: 'PDF Reports', description: 'Generate PDF reports', selected: false },
    { id: 'FS006', title: 'Report Templates', description: 'Define report templates', selected: false },
    { id: 'FS007', title: 'Workflow Definition', description: 'Define data processing workflows', selected: false },
    { id: 'FS008', title: 'Workflow Execution', description: 'Execute data processing workflows', selected: false },
    { id: 'FS009', title: 'Workflow Monitoring', description: 'Monitor workflow execution', selected: false },
    { id: 'FS010', title: 'Data Input UI', description: 'User interface for data input', selected: false },
    { id: 'FS011', title: 'Visualization UI', description: 'User interface for data visualization', selected: false },
    { id: 'FS012', title: 'Export UI', description: 'User interface for data export', selected: false }
  ]);
  
  
  // Keep track of expanded user stories for each section
  const [expandedTechUserStories, setExpandedTechUserStories] = useState({});
  const [expandedFuncUserStories, setExpandedFuncUserStories] = useState({});
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if state has project data
    if (location.state && location.state.projectData) {
      setProjectData(location.state.projectData);
      
      // If there's a data file, parse and display it
      if (location.state.projectData.dataFile) {
        try {
          // Just set data content for now
          setDataContent(`Loaded ${location.state.projectData.dataFile.name}.`);
          
          // Try to read file content - this will not work for Excel files in this context
          // But we're keeping the structure for future implementation
          readDataFile(location.state.projectData.dataFile);
        } catch (error) {
          console.error("Error handling data file:", error);
          setDataContent(`Error reading ${location.state.projectData.dataFile.name}.`);
        }
      }
    } else {
      // If no data is passed, redirect back to development automation page
      navigate('/dashboard/use-cases/development-automation');
    }
  }, [location, navigate]);

  // Read data file - in a real implementation, this would parse the Excel file
  const readDataFile = (file) => {
    try {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Assuming the first sheet contains the data
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert sheet data to JSON
        const jsonData = XLSX.utils.sheet_to_json(sheet);
  
        // Mapping the data as requested
        const mappedCSVData = jsonData.map(row => {
          const description = row['USERSTORY'] || "";
          const userStoryTitleMatch = description.match(/User Story:\s*(.*)/i);
          const userStoryTitle = userStoryTitleMatch ? userStoryTitleMatch[1].trim() : "No Title";

          return {
          userStoryNo: row['USERSTORY'] || "NA",
          userStoryTitle: userStoryTitle,
          functionalSpec: row['FUNCTIONAL SPEC'] || "NA",
          technicalSpec: row['TECHNICAL SPEC'] || "NA"
        };
      });
  
        console.log(mappedCSVData);
        setCSVData(mappedCSVData);
      };
  
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error('Error reading the file:', error);
    }
  };

  const handleGoBack = () => {
    navigate('/dashboard/use-cases/development-automation');
  };

  // Toggle a single technical specification
  const toggleTechnicalSpec = (id) => {
    setTechnicalSpecs(prevSpecs => 
      prevSpecs.map(spec => 
        spec.id === id ? {...spec, selected: !spec.selected} : spec
      )
    );
  };

  // Toggle a single functional specification
  const toggleFunctionalSpec = (id) => {
    setFunctionalSpecs(prevSpecs => 
      prevSpecs.map(spec => 
        spec.id === id ? {...spec, selected: !spec.selected} : spec
      )
    );
  };

  // Toggle all technical specifications
  const toggleAllTechnicalSpecs = () => {
    const allSelected = technicalSpecs.every(spec => spec.selected);
    setTechnicalSpecs(prevSpecs => 
      prevSpecs.map(spec => ({...spec, selected: !allSelected}))
    );
  };

  // Toggle all functional specifications
  const toggleAllFunctionalSpecs = () => {
    const allSelected = functionalSpecs.every(spec => spec.selected);
    setFunctionalSpecs(prevSpecs => 
      prevSpecs.map(spec => ({...spec, selected: !allSelected}))
    );
  };

  // Toggle user story expansion for technical specifications
  const toggleTechUserStory = (userStoryId) => {
    setExpandedTechUserStories(prev => ({
      ...prev,
      [userStoryId]: !prev[userStoryId]
    }));
  };

  // Toggle user story expansion for functional specifications
  const toggleFuncUserStory = (userStoryId) => {
    setExpandedFuncUserStories(prev => ({
      ...prev,
      [userStoryId]: !prev[userStoryId]
    }));
  };

  // Select all tech specs for a user story
  const selectAllTechUserStorySpecs = (userStory) => {
    setTechnicalSpecs(prevSpecs => 
      prevSpecs.map(spec => 
        userStory.techSpecs.includes(spec.id) ? {...spec, selected: true} : spec
      )
    );
  };

  // Deselect all tech specs for a user story
  const deselectAllTechUserStorySpecs = (userStory) => {
    setTechnicalSpecs(prevSpecs => 
      prevSpecs.map(spec => 
        userStory.techSpecs.includes(spec.id) ? {...spec, selected: false} : spec
      )
    );
  };

  // Select all func specs for a user story
  const selectAllFuncUserStorySpecs = (userStory) => {
    setFunctionalSpecs(prevSpecs => 
      prevSpecs.map(spec => 
        userStory.funcSpecs.includes(spec.id) ? {...spec, selected: true} : spec
      )
    );
  };

  // Deselect all func specs for a user story
  const deselectAllFuncUserStorySpecs = (userStory) => {
    setFunctionalSpecs(prevSpecs => 
      prevSpecs.map(spec => 
        userStory.funcSpecs.includes(spec.id) ? {...spec, selected: false} : spec
      )
    );
  };

  // Check if all tech specs for a user story are selected
  const areAllTechUserStorySpecsSelected = (userStory) => {
    return userStory.techSpecs.length > 0 ? 
      userStory.techSpecs.every(id => 
        technicalSpecs.find(spec => spec.id === id)?.selected
      ) : true;
  };

  // Check if all func specs for a user story are selected
  const areAllFuncUserStorySpecsSelected = (userStory) => {
    return userStory.funcSpecs.length > 0 ? 
      userStory.funcSpecs.every(id => 
        functionalSpecs.find(spec => spec.id === id)?.selected
      ) : true;
  };

  // Toggle all tech specs for a user story
  const toggleAllTechUserStorySpecs = (userStory) => {
    const allSelected = areAllTechUserStorySpecsSelected(userStory);
    if (allSelected) {
      deselectAllTechUserStorySpecs(userStory);
    } else {
      selectAllTechUserStorySpecs(userStory);
    }
  };

  // Toggle all func specs for a user story
  const toggleAllFuncUserStorySpecs = (userStory) => {
    const allSelected = areAllFuncUserStorySpecsSelected(userStory);
    if (allSelected) {
      deselectAllFuncUserStorySpecs(userStory);
    } else {
      selectAllFuncUserStorySpecs(userStory);
    }
  };

  // Toggle folder expansion in file tree
  const toggleFolder = (folderId) => {
    setExpandedFolders(prev => ({
      ...prev,
      [folderId]: !prev[folderId]
    }));
  };

  // Toggle directory collapse
  const toggleDirectoryCollapse = () => {
    setDirectoryCollapsed(!directoryCollapsed);
  };

  // Render technical specifications organized by user stories
  const renderTechnicalSpecifications = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-12 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Loader size={14} className="animate-spin text-blue-500 mr-2" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Loading specifications...</span>
        </div>
      );
    }
    
    if (mappedCSVData.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No data available
        </div>
      );
    }
    
    return (
      <div className="max-h-80 overflow-y-auto space-y-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
      {mappedCSVData.map((story) => (
        <div
          key={story.userStoryNo}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          {/* Header with User Story Title */}
          <div
            className="p-2 bg-gray-100 dark:bg-gray-700 flex items-center justify-between cursor-pointer"
            onClick={() => toggleTechUserStory(story.userStoryNo)}
          >
            <div className="flex items-center">
              {expandedTechUserStories[story.userStoryNo] ? (
                <ChevronDown size={16} className="text-gray-500 mr-2" />
              ) : (
                <ChevronRight size={16} className="text-gray-500 mr-2" />
              )}
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {story.userStoryTitle}
              </h4>
            </div>
          </div>

          {/* Collapsible Content - Functional Spec */}
          {expandedTechUserStories[story.userStoryNo] && (
            <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Technical Spec:
              </h5>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                {story.technicalSpec || 'No Functional Spec Available'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>


    );
  };

  // Render functional specifications organized by user stories
  const renderFunctionalSpecifications = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-12 border border-gray-200 dark:border-gray-700 rounded-lg">
          <Loader size={14} className="animate-spin text-blue-500 mr-2" />
          <span className="text-xs text-gray-600 dark:text-gray-300">Loading specifications...</span>
        </div>
      );
    }
    
    if (mappedCSVData.length === 0) {
      return (
        <div className="text-sm text-gray-500 dark:text-gray-400">
          No data available
        </div>
      );
    }
    
    return (
      <div className="max-h-80 overflow-y-auto space-y-2 p-2 border rounded-lg bg-gray-50 dark:bg-gray-800">
      {mappedCSVData.map((story) => (
        <div
          key={story.userStoryNo}
          className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
        >
          {/* Header with User Story Title */}
          <div
            className="p-2 bg-gray-100 dark:bg-gray-700 flex items-center justify-between cursor-pointer"
            onClick={() => toggleFuncUserStory(story.userStoryNo)}
          >
            <div className="flex items-center">
              {expandedFuncUserStories[story.userStoryNo] ? (
                <ChevronDown size={16} className="text-gray-500 mr-2" />
              ) : (
                <ChevronRight size={16} className="text-gray-500 mr-2" />
              )}
              <h4 className="text-sm font-medium text-gray-900 dark:text-white">
                {story.userStoryTitle}
              </h4>
            </div>
          </div>

          {/* Collapsible Content - Functional Spec */}
          {expandedFuncUserStories[story.userStoryNo] && (
            <div className="p-2 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Functional Spec:
              </h5>
              <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                {story.functionalSpec || 'No Functional Spec Available'}
              </p>
            </div>
          )}
        </div>
      ))}
    </div>


    );
  };

  const mapResponseToFileStructure = (responseData) => {
    console.log("Raw responseData:", responseData);
    const fileStructure = {
      id: "root",
      name: "Generated Project",
      type: "folder",
      children: []
    };
  
    const generatedFiles = {};
  
    Object.entries(responseData).forEach(([fileName, content]) => {
      console.log("filename", fileName)
      generatedFiles[fileName] = content;
  
      const fileEntry = {
        id: fileName,
        name: fileName,
        type: "file",
        parentId: "root"
      };
  
      fileStructure.children.push(fileEntry);
    });
  
    return { fileStructure, generatedFiles };
  };


  const generateCode = async () => {
    try{
      setIsGenerating(true);

      // Ensure a file is selected
      if (!location.state.projectData.dataFile) {
        alert('Please select an Excel file first.');
        setIsGenerating(false);
        return;
    }

      const formData = new FormData();
      formData.append('excel_file', location.state.projectData.dataFile);

      // Send the Excel file to the backend
      const response = await fetch(`${API_BASE_URL}/dev_agent/generate`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to generate code. Please try again.');
      }
  
      // Extract the generated code from the response
      const responseData = await response.json();
      console.log("Generated Code Data - ", responseData);
      const result = mapResponseToFileStructure(responseData.integrated_content.code);
      
      console.log("Structure - ", result.fileStructure)
      console.log("GeneratedFiles - ", result.generatedFiles)
      
      setFileStructure(result.fileStructure);
      setGeneratedFiles(result.generatedFiles);

      setIsGenerating(false);
    }
    catch (error) {
      console.error('Error generating code:', error);
      alert(error.message);
      setIsGenerating(false);
    }
    
    
    // Get selected specifications
    // const selectedTechSpecs = technicalSpecs.filter(spec => spec.selected).map(spec => spec.id);
    // const selectedFuncSpecs = functionalSpecs.filter(spec => spec.selected).map(spec => spec.id);
    
    // Simulate API call with a timeout
    // setTimeout(() => {
    //   // Create file structure based on selected specifications
    //   const newFileStructure = {
    //     id: 'root',
    //     name: projectData.projectName || 'project',
    //     type: 'folder',
    //     children: []
    //   };
      
    //   // Add src folder
    //   const srcFolder = {
    //     id: 'src',
    //     name: 'src',
    //     type: 'folder',
    //     children: []
    //   };
      
    //   // Add utilities folder
    //   const utilitiesFolder = {
    //     id: 'utilities',
    //     name: 'utilities',
    //     type: 'folder',
    //     children: []
    //   };
      
    //   // Add generated files based on selected specifications
    //   const newGeneratedFiles = {};
      
    //   // Filter files based on selected specifications
    //   const selectedFiles = Object.entries(fileSpecMapping).filter(([fileName, specIds]) => {
    //     // Check if any of the file's specs are selected
    //     return specIds.some(specId => 
    //       selectedTechSpecs.includes(specId) || selectedFuncSpecs.includes(specId)
    //     );
    //   });
      
    //   // Add technical specification files
    //   selectedFiles.forEach(([fileName, specIds]) => {
    //     // Check if this is a technical spec file (TS prefix)
    //     const isTechSpec = specIds.some(id => id.startsWith('TS'));
        
    //     if (isTechSpec) {
    //       const fileId = fileName;
          
    //       // Generate content based on the file's specifications
    //       const fileContent = generateMockContent(fileName, specIds);
          
    //       // Add to generated files
    //       newGeneratedFiles[fileId] = {
    //         id: fileId,
    //         name: fileName,
    //         content: fileContent,
    //         specIds: specIds
    //       };
          
    //       // Add to utilities folder
    //       utilitiesFolder.children.push({
    //         id: fileId,
    //         name: fileName,
    //         type: 'file',
    //         parentId: 'utilities'
    //       });
    //     }
    //   });
      
    //   // Add functional specification files
    //   selectedFiles.forEach(([fileName, specIds]) => {
    //     // Check if this is a functional spec file (FS prefix)
    //     const isFuncSpec = specIds.some(id => id.startsWith('FS'));
        
    //     if (isFuncSpec) {
    //       const fileId = fileName;
          
    //       // Generate content based on the file's specifications
    //       const fileContent = generateMockContent(fileName, specIds);
          
    //       // Add to generated files
    //       newGeneratedFiles[fileId] = {
    //         id: fileId,
    //         name: fileName,
    //         content: fileContent,
    //         specIds: specIds
    //       };
          
    //       // Add to src folder
    //       srcFolder.children.push({
    //         id: fileId,
    //         name: fileName,
    //         type: 'file',
    //         parentId: 'src'
    //       });
    //     }
    //   });
      
    //   // Add folders to file structure if they have children
    //   if (utilitiesFolder.children.length > 0) {
    //     srcFolder.children.push(utilitiesFolder);
    //   }
      
    //   if (srcFolder.children.length > 0) {
    //     newFileStructure.children.push(srcFolder);
    //   }
      
    //   // Add tests folder if test-related specifications are selected
    //   const testSpecIds = ['TS001', 'TS003', 'TS008', 'TS010'];
    //   if (testSpecIds.some(id => selectedTechSpecs.includes(id))) {
    //     const testsFolder = {
    //       id: 'tests',
    //       name: 'tests',
    //       type: 'folder',
    //       children: [
    //         {
    //           id: 'test_validation',
    //           name: 'test_validation.py',
    //           type: 'file',
    //           parentId: 'tests'
    //         },
    //         {
    //           id: 'test_analysis',
    //           name: 'test_analysis.py',
    //           type: 'file',
    //           parentId: 'tests'
    //         }
    //       ]
    //     };
        
    //     newFileStructure.children.push(testsFolder);
        
    //     // Add test files to generated files
    //     newGeneratedFiles['test_validation'] = {
    //       id: 'test_validation',
    //       name: 'test_validation.py',
    //       content: generateMockContent('test_validation.py', ['TS001', 'TS003']),
    //       specIds: ['TS001', 'TS003']
    //     };
        
    //     newGeneratedFiles['test_analysis'] = {
    //       id: 'test_analysis',
    //       name: 'test_analysis.py',
    //       content: generateMockContent('test_analysis.py', ['TS008', 'TS010']),
    //       specIds: ['TS008', 'TS010']
    //     };
    //   }
      
    //   // Add README.md
    //   newFileStructure.children.push({
    //     id: 'readme',
    //     name: 'README.md',
    //     type: 'file',
    //     parentId: 'root'
    //   });
      
    //   // Add README.md content with selected specification references
    //   const readmeContent = `# ${projectData.projectName || 'Data Processing Project'}\n\n## Overview\nThis project provides tools for processing and analyzing data from CSV/Excel files.\n\n## Features\n${selectedTechSpecs.map(id => {
    //     const spec = technicalSpecs.find(s => s.id === id);
    //     return spec ? `- [${spec.id}] ${spec.title}\n` : '';
    //   }).join('')}${selectedFuncSpecs.map(id => {
    //     const spec = functionalSpecs.find(s => s.id === id);
    //     return spec ? `- [${spec.id}] ${spec.title}\n` : '';
    //   }).join('')}\n## Requirements\nSee requirements.txt file for dependencies.`;
      
    //   newGeneratedFiles['readme'] = {
    //     id: 'readme',
    //     name: 'README.md',
    //     content: readmeContent,
    //     specIds: [...selectedTechSpecs, ...selectedFuncSpecs]
    //   };
      
    //   // Add requirements.txt
    //   newFileStructure.children.push({
    //     id: 'requirements',
    //     name: 'requirements.txt',
    //     type: 'file',
    //     parentId: 'root'
    //   });
      
    //   // Add requirements.txt content based on selected specifications
    //   const requirementsContent = `pandas==1.5.3\nnumpy==1.24.2\n${selectedFuncSpecs.includes('FS001') || selectedFuncSpecs.includes('FS002') || selectedFuncSpecs.includes('FS003') ? 'matplotlib==3.7.1\nseaborn==0.12.2\n' : ''}${selectedFuncSpecs.includes('FS004') || selectedFuncSpecs.includes('FS005') ? 'jinja2==3.1.2\n' : ''}${selectedTechSpecs.includes('TS011') || selectedTechSpecs.includes('TS012') ? 'openpyxl==3.1.2\nxlrd==2.0.1\n' : ''}${selectedFuncSpecs.includes('FS005') ? 'pdfkit==1.0.0\n' : ''}`;
      
    //   newGeneratedFiles['requirements'] = {
    //     id: 'requirements',
    //     name: 'requirements.txt',
    //     content: requirementsContent,
    //     specIds: [] // Not directly tied to specific specs
    //   };
      
    //   // Set state with new file structure and generated files
    //   setFileStructure(newFileStructure);
    //   setGeneratedFiles(newGeneratedFiles);
      
    //   // Set expanded folders
    //   setExpandedFolders({
    //     root: true,
    //     src: true
    //   });
      
    //   // Set initial selected file
    //   if (newFileStructure.children.length > 0) {
    //     if (newGeneratedFiles['readme']) {
    //       setSelectedFile(newGeneratedFiles['readme']);
    //       // Set selected file specifications
    //       setSelectedFileSpecs(getSpecifications(newGeneratedFiles['readme'].specIds));
    //     } else {
    //       // Find first file
    //       let firstFile = null;
          
    //       // Helper function to find first file
    //       const findFirstFile = (folder) => {
    //         for (const child of folder.children) {
    //           if (child.type === 'file') {
    //             return newGeneratedFiles[child.id];
    //           } else if (child.type === 'folder') {
    //             const file = findFirstFile(child);
    //             if (file) return file;
    //           }
    //         }
    //         return null;
    //       };
          
    //       firstFile = findFirstFile(newFileStructure);
          
    //       if (firstFile) {
    //         setSelectedFile(firstFile);
    //         // Set selected file specifications
    //         setSelectedFileSpecs(getSpecifications(firstFile.specIds));
    //       }
    //     }
    //   }
      
    //   setIsGenerating(false);
    // }, 2000);
  };

  // Get specification objects from IDs
  const getSpecifications = (specIds) => {
    if (!specIds) return [];
    
    const specs = [];
    
    specIds.forEach(id => {
      // Check in technical specs
      const techSpec = technicalSpecs.find(spec => spec.id === id);
      if (techSpec) {
        specs.push({...techSpec, type: 'technical'});
        return;
      }
      
      // Check in functional specs
      const funcSpec = functionalSpecs.find(spec => spec.id === id);
      if (funcSpec) {
        specs.push({...funcSpec, type: 'functional'});
      }
    });
    
    return specs;
  };

  // Handle file selection
  const handleFileSelect = (fileId) => {
    console.log("FileId recd", fileId);
    const file = generatedFiles[fileId];
    console.log("File value", file)
    setSelectedFile(file);
      // Set selected file specifications
    // setSelectedFileSpecs(getSpecifications(file.specIds));
  };

  // Open specifications modal
  const openSpecsModal = (e) => {
    e.stopPropagation();
    setShowSpecsModal(true);
  };

  // Close specifications modal
  const closeSpecsModal = () => {
    setShowSpecsModal(false);
  };

  // Handle project download
  const handleDownloadProject = () => {
    if (!fileStructure || Object.keys(generatedFiles).length === 0) {
      alert("No project files to download");
      return;
    }
  
    const zip = new JSZip();
  
    // Helper function to recursively add files and folders to ZIP
    const addFilesToZip = (node, folder) => {
      if (node.type === "folder") {
        // Create a new folder inside ZIP
        const newFolder = folder.folder(node.name);
  
        if (node.children && node.children.length > 0) {
          node.children.forEach(child => addFilesToZip(child, newFolder));
        }
      } else {
        const fileContent = generatedFiles[node.id] || "No content available";
        if (typeof fileContent === "string") {
          folder.file(node.name, fileContent);
        } else {
          console.warn(`Skipping file ${node.name} due to unsupported content type.`);
        }
      }
    };
  
    // Start adding files from root
    addFilesToZip(fileStructure, zip);
  
    // Generate ZIP and trigger download
    zip.generateAsync({ type: "blob" }).then(blob => {
      saveAs(blob, `${projectData.projectName || "project"}.zip`);
    });
  
    // alert("Downloading ZIP file with project structure...");
    // if (!fileStructure || Object.keys(generatedFiles).length === 0) {
    //   alert("No project files to download");
    //   return;
    // }
    
    // // In a real implementation, we would:
    // // 1. Create a ZIP file with all the generated files
    // // 2. Maintain the folder structure
    // // 3. Trigger the download
    
    // // For this demo, we'll create a text representation of the project
    // let projectText = `# ${projectData.projectName || 'Generated Project'}\n\n`;
    
    // // Helper function to build project text recursively
    // const buildProjectText = (node, indent = '') => {
    //   if (node.type === 'folder') {
    //     projectText += `${indent}📁 ${node.name}/\n`;
        
    //     if (node.children && node.children.length > 0) {
    //       node.children.forEach(child => {
    //         buildProjectText(child, indent + '  ');
    //       });
    //     }
    //   } else {
    //     projectText += `${indent}📄 ${node.name}\n`;
        
    //     // Add file content if available
    //     const file = generatedFiles[node.id];
    //     if (file && file.content) {
    //       projectText += `${indent}  Content preview: ${file.content.substring(0, 50)}...\n`;
    //     }
    //   }
    // };
    
    // // Build project text
    // buildProjectText(fileStructure);
    
    // // Create a blob and trigger download
    // const blob = new Blob([projectText], { type: 'text/plain' });
    // const url = URL.createObjectURL(blob);
    // const a = document.createElement('a');
    // a.href = url;
    // a.download = `${projectData.projectName || 'project'}_structure.txt`;
    // document.body.appendChild(a);
    // a.click();
    // document.body.removeChild(a);
    // URL.revokeObjectURL(url);
    
    // // Show alert for demo purposes
    // alert("In a real implementation, this would download a ZIP file containing all the generated project files in their proper structure.");
  };

  // Render file tree
  const renderFileTree = (node, level = 0) => {
    if (!node) return null;
    
    const isExpanded = expandedFolders[node.id];
    
    if (node.type === 'folder') {
      return (
        <div key={node.id}>
          <div 
            className={`flex items-center ${level > 0 ? 'pl-4' : ''} py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer`}
            onClick={() => toggleFolder(node.id)}
          >
            {isExpanded ? (
              <ChevronDown size={16} className="text-gray-500 mr-1" />
            ) : (
              <ChevronRight size={16} className="text-gray-500 mr-1" />
            )}
            <Folder size={16} className="text-yellow-500 mr-2" />
            <span className="text-sm">{node.name}</span>
          </div>
          
          {isExpanded && node.children && (
            <div className={`${level > 0 ? 'border-l border-gray-200 dark:border-gray-700 ml-2 pl-2' : ''}`}>
              {node.children.map(child => renderFileTree(child, level + 1))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div key={node.id}>
          <div 
            className={`flex items-center ${level > 0 ? 'pl-4' : ''} py-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded cursor-pointer ${selectedFile && selectedFile.id === node.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
            onClick={() => handleFileSelect(node.id)}
          >
            <File size={16} className="text-gray-500 mr-2 ml-4" />
            <span className="text-sm">{node.name}</span>
          </div>
        </div>
      );
    }
  };

  if (!projectData) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center mb-6">
        <button 
          onClick={handleGoBack}
          className="mr-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {projectData.projectName || "Development Project Details"}
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Select specifications and generate code for your project
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left side - File tree and code display */}
        <div className="lg:col-span-2">
          <div className="flex flex-col md:flex-row bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {/* File tree with toggle */}
            {!directoryCollapsed && (
              <div className="w-full md:w-64 border-r border-gray-200 dark:border-gray-700">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                    <FolderTree size={18} className="mr-2" />
                    Project Files
                  </h2>
                  <button 
                    onClick={toggleDirectoryCollapse}
                    className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Folder size={18} />
                  </button>
                </div>
                
                {fileStructure ? (
                  <div className="p-2 h-96 overflow-auto">
                    {renderFileTree(fileStructure)}
                  </div>
                ) : (
                  <div className="p-4 h-96 flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      {isGenerating ? (
                        <span className="flex items-center">
                          <Loader size={16} className="animate-spin mr-2" />
                          Generating file structure...
                        </span>
                      ) : (
                        "Generate code to see file structure"
                      )}
                    </p>
                  </div>
                )}
                
                {/* Download button */}
                {fileStructure && (
                  <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      onClick={handleDownloadProject}
                    >
                      <Download size={16} />
                      Download
                    </button>
                  </div>
                )}
              </div>
            )}
            
            {/* Code display */}
            <div className="flex-1">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center">
                {directoryCollapsed && (
                  <button 
                    onClick={toggleDirectoryCollapse}
                    className="p-1 mr-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Folder size={18} />
                  </button>
                )}

                <div className="flex-1 flex items-center">
                  <Code size={18} className="mr-2 text-gray-600 dark:text-gray-400" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {selectedFile ? selectedFile.name : "Code Viewer"}
                  </h2>
                </div>
                
                {selectedFile && selectedFileSpecs.length > 0 && (
                  <button
                    onClick={openSpecsModal}
                    className="p-1 ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-blue-500"
                    title="View specifications"
                  >
                    <Info size={18} />
                  </button>
                )}
              </div>
              
              <div className="p-4 h-96 overflow-auto bg-gray-50 dark:bg-gray-900">
                {selectedFile ? (
                  <pre className="text-sm font-mono text-gray-800 dark:text-gray-300 whitespace-pre-wrap">
                    {selectedFile}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-500 dark:text-gray-400 text-center">
                      {isGenerating ? (
                        <span className="flex items-center">
                          <Loader size={16} className="animate-spin mr-2" />
                          Generating code...
                        </span>
                      ) : (
                        "Select a file to view code"
                      )}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Right side - Specifications */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4">
          <h2 className="text-base font-semibold mb-3 text-gray-900 dark:text-white">
            Input Data & Specifications
          </h2>
          
          {/* Data file info */}
          <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-700">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Data File</h3>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
              <span className="font-medium">Name:</span> {projectData.dataFile ? projectData.dataFile.name : "Not specified"}
            </p>
            {isLoading ? (
              <div className="flex items-center justify-center py-1">
                <Loader size={14} className="animate-spin text-blue-500 mr-2" />
                <span className="text-xs text-gray-600 dark:text-gray-300">Loading specifications...</span>
              </div>
            ) : (
              dataContent && (
                <div className="text-xs text-gray-600 dark:text-gray-300 border-t border-blue-200 dark:border-blue-700 pt-1 mt-1">
                  {dataContent}
                </div>
              )
            )}
          </div>
          
          {/* Technical specifications organized by user stories */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Technical Specifications</h3>
              {/* <button 
                className="text-xs text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                onClick={toggleAllTechnicalSpecs}
                disabled={isLoading}
              >
                {technicalSpecs.every(spec => spec.selected) ? "Deselect All" : "Select All"}
              </button> */}
            </div>
            
            {renderTechnicalSpecifications()}
          </div>
          
          {/* Functional specifications organized by user stories */}
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Functional Specifications</h3>
              {/* <button 
                className="text-xs text-green-500 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
                onClick={toggleAllFunctionalSpecs}
                disabled={isLoading}
              >
                {functionalSpecs.every(spec => spec.selected) ? "Deselect All" : "Select All"}
              </button> */}
            </div>
            
            {renderFunctionalSpecifications()}
          </div>
          
          {/* Generate button */}
          <button
            onClick={generateCode}
            disabled={isGenerating || isLoading}
            className="w-full py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <>
                <Loader size={14} className="animate-spin" />
                <span className="text-sm">Generating Code Files...</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span className="text-sm">Generate Code Files</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Specifications Modal */}
      {showSpecsModal && selectedFile && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50" onClick={closeSpecsModal}>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg w-96 max-h-[60vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                <Info size={16} className="text-blue-500 mr-2" />
                {selectedFile.name} Specifications
              </h3>
              <button
                onClick={closeSpecsModal}
                className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-3 overflow-y-auto">
              {selectedFileSpecs.length > 0 ? (
                <div className="space-y-2">
                  {selectedFileSpecs.map(spec => (
                    <div 
                      key={spec.id}
                      className={`p-2 rounded-md ${
                        spec.type === 'technical' 
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' 
                          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      }`}
                    >
                      <div className="flex items-center mb-1">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                          spec.type === 'technical'
                            ? 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300'
                            : 'bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300'
                        }`}>
                          {spec.id}
                        </span>
                      </div>
                      
                      <h4 className="text-sm font-medium text-gray-900 dark:text-white">{spec.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{spec.description}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 dark:text-gray-400">
                  No specifications associated with this file.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DevelopmentAutomationDetails;