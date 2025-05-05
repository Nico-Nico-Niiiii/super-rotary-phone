import React, { useState } from 'react';
import { X, Plus, Trash, ChevronRight } from 'lucide-react';
import axios from 'axios';  
import endpoints from '../endpoints.json';

const BASE_URL = import.meta.env.VITE_APP_API_URL

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const PromptModal = ({ isOpen, onClose, onSave }) => {
  const [libraryName, setLibraryName] = useState('');
  const [sections, setSections] = useState([]);
  const [currentSectionName, setCurrentSectionName] = useState('');
  const [selectedSection, setSelectedSection] = useState(null);
  const [sectionPrompts, setSectionPrompts] = useState({});
  const [selectedPrompts, setSelectedPrompts] = useState([]);

  const resetForm = () => {
    setLibraryName('');
    setSections([]);
    setSelectedSection(null);
    setSectionPrompts({});
    setSelectedPrompts([]);
  };
  
  const getPromptForSection = (sectionIndex) => {
    return sectionPrompts[sectionIndex] || { prompt: '', description: '' };
  };

  const handleDeleteSection = (sectionIndex) => {
    const updatedSections = sections.filter((_, index) => index !== sectionIndex);
    setSections(updatedSections);
    setSelectedSection(null);
  };

  const handleAddPrompt = (sectionIndex) => {
    const currentPrompt = getPromptForSection(sectionIndex);
    if (currentPrompt.prompt.trim() === '' || currentPrompt.description.trim() === '') return;
    
    const updatedSections = [...sections];
    if (!updatedSections[sectionIndex].prompts) {
      updatedSections[sectionIndex].prompts = [];
    }
    updatedSections[sectionIndex].prompts.push({ ...currentPrompt });
    setSections(updatedSections);
    
    setSectionPrompts({
      ...sectionPrompts,
      [sectionIndex]: { prompt: '', description: '' }
    });
  };

  const handleDeleteSelectedPrompts = () => {
    if (selectedSection === null) return;
    
    const updatedSections = [...sections];
    const filteredPrompts = updatedSections[selectedSection].prompts.filter(
      (_, index) => !selectedPrompts.includes(index)
    );
    updatedSections[selectedSection].prompts = filteredPrompts;
    setSections(updatedSections);
    setSelectedPrompts([]);
  };

  const handleAddSection = () => {
    if (currentSectionName.trim() === '') return;

    // Check for duplicate section names
    if (sections.some(section => section.name === currentSectionName)) {
      alert('Section name must be unique within the library');
      return;
    }
    
    setSections([...sections, {
      name: currentSectionName,
      prompt: '',
      description: ''
    }]);
    setCurrentSectionName('');
  };

  const handleUpdateSectionPrompt = (sectionIndex, field, value) => {
    const updatedSections = [...sections];
    updatedSections[sectionIndex][field] = value;
    setSections(updatedSections);
  };
  

  const handleSave = async () => {
    if (libraryName.trim() === '') return;
    
    // Validate all sections have prompts and descriptions
    const incompleteSections = sections.filter(
      section => !section.prompt || !section.description
    );
    
    if (incompleteSections.length > 0) {
      alert('All sections must have both a prompt and description');
      return;
    }
    
    try {
      const prompts = sections.map(section => ({
        prompt_library_name: libraryName,
        prompt_subsection_name: section.name,
        prompt: section.prompt,
        prompt_description: section.description
      }));

      const response = await api.post(
        `${endpoints.prompts.prefix}${endpoints.prompts.routes.bulk_create}`, 
        prompts
      );

      console.log("Response in prompt modal", response.data);
      
      
      onSave({ name: libraryName, sections });
      resetForm();
      onClose();
    } catch (error) {
      if (error.response?.status === 400) {
        alert(error.response.data.detail);
      } else {
        console.error('Error:', error);
        alert('An error occurred while saving the library');
      }
    }
  };

  const togglePromptSelection = (promptIndex) => {
    setSelectedPrompts(prev => 
      prev.includes(promptIndex)
        ? prev.filter(i => i !== promptIndex)
        : [...prev, promptIndex]
    );
  };


  // Modify the right panel to show single prompt input
  const renderRightPanel = () => {
    if (selectedSection === null) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
          Select a section to manage its prompt
        </div>
      );
    }

    const section = sections[selectedSection];
    
    return (
      <>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-medium">{section.name} - Prompt</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Prompt
              </label>
              <textarea
                value={section.prompt}
                onChange={(e) => handleUpdateSectionPrompt(selectedSection, 'prompt', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                rows={4}
                placeholder="Enter prompt"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Description
              </label>
              <textarea
                value={section.description}
                onChange={(e) => handleUpdateSectionPrompt(selectedSection, 'description', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                rows={2}
                placeholder="Enter description"
              />
            </div>
          </div>
        </div>
      </>
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl h-[700px] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Prompt Library</h2>
              <input
                type="text"
                value={libraryName}
                onChange={(e) => setLibraryName(e.target.value)}
                className="w-full sm:w-80 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                placeholder="Enter library name"
              />
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Split Panel Content - with fixed height and scrollable */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Panel - Sections List */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={currentSectionName}
                  onChange={(e) => setCurrentSectionName(e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
                  placeholder="New section name"
                />
                <button
                  onClick={handleAddSection}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto" style={{ height: 'calc(700px - 184px)' }}>
              {sections.map((section, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedSection(index)}
                  className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    selectedSection === index ? 'bg-blue-50 dark:bg-gray-700' : ''
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <ChevronRight size={16} />
                    <span>{section.name}</span>
                    <span className="text-sm text-gray-500">({section.prompts?.length || 0})</span>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteSection(index);
                    }}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Right Panel - Prompts */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {renderRightPanel()}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
          >
            Save Library
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromptModal;






// import React, { useState } from 'react';
// import { X, Plus, Trash, ChevronRight } from 'lucide-react';

// import axios from 'axios';  

// import endpoints from '../endpoints.json';



// const BASE_URL = import.meta.env.VITE_APP_API_URL

// // Create axios instance with default config
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// const PromptModal = ({ isOpen, onClose, onSave }) => {
//   const [libraryName, setLibraryName] = useState('');
//   const [sections, setSections] = useState([]);
//   const [currentSectionName, setCurrentSectionName] = useState('');
//   const [selectedSection, setSelectedSection] = useState(null);
//   const [sectionPrompts, setSectionPrompts] = useState({});
//   const [selectedPrompts, setSelectedPrompts] = useState([]);

//   const resetForm = () => {
//     setLibraryName('');
//     setSections([]);
//     setSelectedSection(null);
//     setSectionPrompts({});
//     setSelectedPrompts([]);
//   };
  
//   const getPromptForSection = (sectionIndex) => {
//     return sectionPrompts[sectionIndex] || { prompt: '', description: '' };
//   };

//   const handleDeleteSection = (sectionIndex) => {
//     const updatedSections = sections.filter((_, index) => index !== sectionIndex);
//     setSections(updatedSections);
//     setSelectedSection(null);
//   };

//   const handleAddPrompt = (sectionIndex) => {
//     const currentPrompt = getPromptForSection(sectionIndex);
//     if (currentPrompt.prompt.trim() === '' || currentPrompt.description.trim() === '') return;
    
//     const updatedSections = [...sections];
//     if (!updatedSections[sectionIndex].prompts) {
//       updatedSections[sectionIndex].prompts = [];
//     }
//     updatedSections[sectionIndex].prompts.push({ ...currentPrompt });
//     setSections(updatedSections);
    
//     setSectionPrompts({
//       ...sectionPrompts,
//       [sectionIndex]: { prompt: '', description: '' }
//     });
//   };

//   const handleDeleteSelectedPrompts = () => {
//     if (selectedSection === null) return;
    
//     const updatedSections = [...sections];
//     const filteredPrompts = updatedSections[selectedSection].prompts.filter(
//       (_, index) => !selectedPrompts.includes(index)
//     );
//     updatedSections[selectedSection].prompts = filteredPrompts;
//     setSections(updatedSections);
//     setSelectedPrompts([]);
//   };

//   const handleAddSection = () => {
//     if (currentSectionName.trim() === '') return;

//         // Check for duplicate section names
//         if (sections.some(section => section.name === currentSectionName)) {
//           alert('Section name must be unique within the library');
//           return;
//         }
    
//         setSections([...sections, {
//           name: currentSectionName,
//           prompt: '',
//           description: ''
//         }]);
//         setCurrentSectionName('');
//       };

//       const handleUpdateSectionPrompt = (sectionIndex, field, value) => {
//         const updatedSections = [...sections];
//         updatedSections[sectionIndex][field] = value;
//         setSections(updatedSections);
//       };
  

//   const handleSave = async () => {
//     if (libraryName.trim() === '') return;
    
//     // Validate all sections have prompts and descriptions
//     const incompleteSections = sections.filter(
//       section => !section.prompt || !section.description
//     );
    
//     if (incompleteSections.length > 0) {
//       alert('All sections must have both a prompt and description');
//       return;
//     }
    
//     try {
//       const prompts = sections.map(section => ({
//         prompt_library_name: libraryName,
//         prompt_subsection_name: section.name,
//         prompt: section.prompt,
//         prompt_description: section.description
//       }));

//       const response = await api.post(
//         `${endpoints.prompts.prefix}${endpoints.prompts.routes.bulk_create}`, 
//         prompts
//       );

//       console.log("Response in prompt modal", response.data);
      
      
//       onSave({ name: libraryName, sections });
//       resetForm();
//       onClose();
//     } catch (error) {
//       if (error.response?.status === 400) {
//         alert(error.response.data.detail);
//       } else {
//         console.error('Error:', error);
//         alert('An error occurred while saving the library');
//       }
//     }
//   };

//   const togglePromptSelection = (promptIndex) => {
//     setSelectedPrompts(prev => 
//       prev.includes(promptIndex)
//         ? prev.filter(i => i !== promptIndex)
//         : [...prev, promptIndex]
//     );
//   };


//   // Modify the right panel to show single prompt input
//   const renderRightPanel = () => {
//     if (selectedSection === null) {
//       return (
//         <div className="flex-1 flex items-center justify-center text-gray-500 dark:text-gray-400">
//           Select a section to manage its prompt
//         </div>
//       );
//     }

//     const section = sections[selectedSection];
    
//     return (
//       <>
//         <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//           <h3 className="text-lg font-medium">{section.name} - Prompt</h3>
//         </div>
//         <div className="flex-1 overflow-y-auto p-4 space-y-4">
//           <div className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Prompt
//               </label>
//               <textarea
//                 value={section.prompt}
//                 onChange={(e) => handleUpdateSectionPrompt(selectedSection, 'prompt', e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
//                 rows={4}
//                 placeholder="Enter prompt"
//               />
//             </div>
//             <div>
//               <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                 Description
//               </label>
//               <textarea
//                 value={section.description}
//                 onChange={(e) => handleUpdateSectionPrompt(selectedSection, 'description', e.target.value)}
//                 className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
//                 rows={2}
//                 placeholder="Enter description"
//               />
//             </div>
//           </div>
//         </div>
//       </>
//     );
//   };

//   if (!isOpen) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-6xl h-[800px] flex flex-col">
//         {/* Header */}
//         <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex justify-between items-center">
//             <div className="space-y-2">
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Prompt Library</h2>
//               <input
//                 type="text"
//                 value={libraryName}
//                 onChange={(e) => setLibraryName(e.target.value)}
//                 className="w-80 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
//                 placeholder="Enter library name"
//               />
//             </div>
//             <button
//               onClick={onClose}
//               className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//             >
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         {/* Split Panel Content */}
//         <div className="flex-1 flex overflow-hidden">
//           {/* Left Panel - Sections List */}
//           <div className="w-1/3 border-r border-gray-200 dark:border-gray-700 flex flex-col">
//             <div className="p-4 border-b border-gray-200 dark:border-gray-700">
//               <div className="flex gap-2">
//                 <input
//                   type="text"
//                   value={currentSectionName}
//                   onChange={(e) => setCurrentSectionName(e.target.value)}
//                   className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700"
//                   placeholder="New section name"
//                 />
//                 <button
//                   onClick={handleAddSection}
//                   className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
//                 >
//                   <Plus size={20} />
//                 </button>
//               </div>
//             </div>
//             <div className="flex-1 overflow-y-auto">
//               {sections.map((section, index) => (
//                 <div
//                   key={index}
//                   onClick={() => setSelectedSection(index)}
//                   className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${
//                     selectedSection === index ? 'bg-blue-50 dark:bg-gray-700' : ''
//                   }`}
//                 >
//                   <div className="flex items-center gap-2">
//                     <ChevronRight size={16} />
//                     <span>{section.name}</span>
//                     <span className="text-sm text-gray-500">({section.prompts?.length || 0})</span>
//                   </div>
//                   <button
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       handleDeleteSection(index);
//                     }}
//                     className="text-red-500 hover:text-red-700 p-1"
//                   >
//                     <Trash size={16} />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           {/* Right Panel - Prompts */}
//           <div className="flex-1 flex flex-col">
         
//           {renderRightPanel()}
    
//           </div>
//         </div>

//         {/* Footer */}
//         <div className="p-6 border-t border-gray-200 dark:border-gray-700">
//           <button
//             onClick={handleSave}
//             className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200"
//           >
//             Save Library
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PromptModal;