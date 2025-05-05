







// // PromptLibraryModalDetails.js
// import React from 'react';
// import { X } from 'lucide-react';

// const PromptLibraryModalDetails = ({ isOpen, onClose, library }) => {
//   if (!isOpen || !library) return null;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl h-[800px] flex flex-col">
//         <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex justify-between items-center">
//             <div>
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{library.name}</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                 Total sections: {library.sections.length} | 
//                 Total prompts: {library.sections.reduce((acc, section) => acc + section.prompts.length, 0)}
//               </p>
//             </div>
//             <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6">
//           {library.sections.map((section, sectionIndex) => (
//             <div key={sectionIndex} className="mb-8 last:mb-0">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                   {section.name}
//                 </h3>
//                 <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm">
//                   {section.prompts.length} prompts
//                 </span>
//               </div>
              
//               <div className="overflow-x-auto border dark:border-gray-600 rounded-lg">
//                 <table className="w-full border-collapse">
//                   <thead>
//                     <tr className="bg-gray-50 dark:bg-gray-700">
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 w-1/2">
//                         Prompt
//                       </th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 w-1/2">
//                         Description
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody className="divide-y divide-gray-200 dark:divide-gray-600">
//                     {section.prompts.map((prompt, promptIndex) => (
//                       <tr key={promptIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                         <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
//                           {prompt.prompt}
//                         </td>
//                         <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
//                           {prompt.description}
//                         </td>
//                       </tr>
//                     ))}
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PromptLibraryModalDetails;



// import React from 'react';
// import { X } from 'lucide-react';

// const PromptLibraryModalDetails = ({ isOpen, onClose, library }) => {
//   if (!isOpen || !library) return null;

//   const totalSections = library.sections?.length || 0;

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl h-[800px] flex flex-col">
//         <div className="p-6 border-b border-gray-200 dark:border-gray-700">
//           <div className="flex justify-between items-center">
//             <div>
//               <h2 className="text-xl font-bold text-gray-900 dark:text-white">{library.name}</h2>
//               <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
//                 Total sections: {totalSections}
//               </p>
//             </div>
//             <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
//               <X size={24} />
//             </button>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto p-6">
//           {library.sections?.map((section, sectionIndex) => (
//             <div key={sectionIndex} className="mb-8 last:mb-0">
//               <div className="flex justify-between items-center mb-4">
//                 <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
//                   {section.name}
//                 </h3>
//               </div>
              
//               <div className="overflow-x-auto border dark:border-gray-600 rounded-lg">
//                 <table className="w-full border-collapse">
//                   <thead>
//                     <tr className="bg-gray-50 dark:bg-gray-700">
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 w-1/2">
//                         Prompt
//                       </th>
//                       <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 w-1/2">
//                         Description
//                       </th>
//                     </tr>
//                   </thead>
//                   <tbody>
//                     <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
//                       <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
//                         {section.prompt}
//                       </td>
//                       <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
//                         {section.description}
//                       </td>
//                     </tr>
//                   </tbody>
//                 </table>
//               </div>
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default PromptLibraryModalDetails;





import React, { useState } from 'react';
import { X, Pencil, Trash, Check, X as Close, Plus } from 'lucide-react';
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

const PromptLibraryModalDetails = ({ isOpen, onClose, library, onUpdate }) => {
  const [editingSectionId, setEditingSectionId] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSection, setNewSection] = useState({
    name: '',
    prompt: '',
    description: ''
  });

  if (!isOpen || !library) return null;

  const handleEditClick = (section) => {
    setEditingSectionId(section.id);
    setEditingSection({
      name: section.name,
      prompt: section.prompt,
      description: section.description
    });
  };

  const handleAddSection = async () => {
    if (!newSection.name || !newSection.prompt || !newSection.description) {
      alert('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      await api.post(`${endpoints.prompts.prefix}/create`, {
        prompt_library_name: library.name,
        prompt_subsection_name: newSection.name,
        prompt: newSection.prompt,
        prompt_description: newSection.description
      });
      onUpdate();
      setIsAddingSection(false);
      setNewSection({ name: '', prompt: '', description: '' });
    } catch (error) {
      alert(error.response?.data?.detail || 'Failed to add section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingSection.name || !editingSection.prompt || !editingSection.description) {
      alert('All fields are required');
      return;
    }

    setIsLoading(true);
    try {
      await api.put(`${endpoints.prompts.prefix}/${editingSectionId}`, {
        prompt_library_name: library.name,
        prompt_subsection_name: editingSection.name,
        prompt: editingSection.prompt,
        prompt_description: editingSection.description
      });
      
      onUpdate();
      setEditingSectionId(null);
      setEditingSection(null);
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteSection = async (sectionId) => {
    if (!confirm('Are you sure you want to delete this section?')) return;
    
    setIsLoading(true);
    try {
      await api.delete(`${endpoints.prompts.prefix}/${sectionId}`);
      onUpdate();
    } catch (error) {
      console.error('Error:', error);
      alert(error.response?.data?.detail || 'Failed to delete section');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelEdit = () => {
    setEditingSectionId(null);
    setEditingSection(null);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-4xl h-[800px] flex flex-col">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">{library.name}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Total sections: {library.sections?.length || 0}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddingSection(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                <Plus size={18} />
                Add Section
              </button>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X size={24} />
              </button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {isAddingSection && (
            <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">New Section</h3>
                <button onClick={() => setIsAddingSection(false)}>
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Section Name"
                  value={newSection.name}
                  onChange={(e) => setNewSection({...newSection, name: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                />
                <textarea
                  placeholder="Prompt"
                  value={newSection.prompt}
                  onChange={(e) => setNewSection({...newSection, prompt: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={3}
                />
                <textarea
                  placeholder="Description"
                  value={newSection.description}
                  onChange={(e) => setNewSection({...newSection, description: e.target.value})}
                  className="w-full px-3 py-2 border rounded dark:bg-gray-700 dark:border-gray-600"
                  rows={2}
                />
                <button 
                  onClick={handleAddSection}
                  className="w-full py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Add Section
                </button>
              </div>
            </div>
          )}

          {library.sections?.map((section) => (
            <div key={section.id} className="mb-8 last:mb-0">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {editingSectionId === section.id ? (
                    <input
                      type="text"
                      value={editingSection.name}
                      onChange={(e) => setEditingSection({...editingSection, name: e.target.value})}
                      className="px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                      disabled={isLoading}
                    />
                  ) : section.name}
                </h3>
                <div className="flex gap-2">
                  {editingSectionId === section.id ? (
                    <>
                      <button 
                        onClick={handleSaveEdit}
                        disabled={isLoading}
                        className="p-1 text-green-500 hover:bg-green-50 rounded dark:hover:bg-green-900/20"
                      >
                        <Check size={18} />
                      </button>
                      <button 
                        onClick={handleCancelEdit}
                        disabled={isLoading}
                        className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                      >
                        <Close size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button 
                        onClick={() => handleEditClick(section)}
                        disabled={isLoading}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded dark:hover:bg-blue-900/20"
                      >
                        <Pencil size={18} />
                      </button>
                      <button 
                        onClick={() => handleDeleteSection(section.id)}
                        disabled={isLoading}
                        className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-red-900/20"
                      >
                        <Trash size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
              
              <div className="overflow-x-auto border dark:border-gray-600 rounded-lg">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 w-1/2">
                        Prompt
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700 dark:text-gray-200 border-b dark:border-gray-600 w-1/2">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {editingSectionId === section.id ? (
                          <textarea
                            value={editingSection.prompt}
                            onChange={(e) => setEditingSection({...editingSection, prompt: e.target.value})}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                            rows={3}
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">{section.prompt}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {editingSectionId === section.id ? (
                          <textarea
                            value={editingSection.description}
                            onChange={(e) => setEditingSection({...editingSection, description: e.target.value})}
                            className="w-full px-2 py-1 border rounded dark:bg-gray-700 dark:border-gray-600"
                            rows={3}
                            disabled={isLoading}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap">{section.description}</div>
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PromptLibraryModalDetails;