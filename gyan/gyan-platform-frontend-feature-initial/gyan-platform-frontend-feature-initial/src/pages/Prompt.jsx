




// /////////////////////////////////////

// import { useState, useEffect } from 'react';
// import { 
//  Plus, 
//  MessageSquare,
//  History,
//  GitBranch,
//  ArrowUp, 
//  ArrowDown,
//  Users,
//  BarChart as ChartIcon,
//  Star,
//  Trash
// } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, LineChart, Line } from 'recharts';
// import endpoints from '../endpoints.json'
// import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_APP_API_URL

// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// import PromptModal from '../components/PromptModal';
// import PromptLibraryModalDetails from '../components/PromptLibraryModalDetails';

// const mockPromptStats = [
//  { name: 'Jan', success: 82, usage: 1200, versions: 8 },
//  { name: 'Feb', success: 85, usage: 1500, versions: 12 },
//  { name: 'Mar', success: 88, usage: 1800, versions: 15 },
//  { name: 'Apr', success: 86, usage: 2200, versions: 18 },
//  { name: 'May', success: 89, usage: 2500, versions: 22 },
//  { name: 'Jun', success: 91, usage: 2800, versions: 25 }
// ];

// const StatsCard = ({ title, value, trend, trendValue, icon: Icon }) => (
//  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
//    <div className="flex flex-col">
//      <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</span>
//      <div className="flex items-baseline gap-2">
//        <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
//        <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
//          {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
//          <span className="text-sm">{trendValue}%</span>
//        </div>
//      </div>
//    </div>
//    <div className="mt-2">
//      <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
//        <Icon size={20} className="text-primary-light" />
//      </div>
//    </div>
//  </div>
// );

// const Prompt = () => {
//  const [isModalOpen, setIsModalOpen] = useState(false);
//  const [promptLibraries, setPromptLibraries] = useState([]);
//  const [selectedLibrary, setSelectedLibrary] = useState(null);
//  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
//  const [loading, setLoading] = useState(false);

//  const fetchPromptLibraries = async () => {
//    try {
//      setLoading(true);
//      const { data: prompts } = await api.get(`${endpoints.prompts.prefix}${endpoints.prompts.routes.list}`);
     
//      const libraries = {};
//      prompts.forEach(prompt => {
//        if (!libraries[prompt.prompt_library_name]) {
//          libraries[prompt.prompt_library_name] = {
//            name: prompt.prompt_library_name,
//            sections: {}
//          };
//        }
       
//        if (!libraries[prompt.prompt_library_name].sections[prompt.prompt_subsection_name]) {
//          libraries[prompt.prompt_library_name].sections[prompt.prompt_subsection_name] = {
//            name: prompt.prompt_subsection_name,
//            prompts: []
//          };
//        }
       
//        libraries[prompt.prompt_library_name].sections[prompt.prompt_subsection_name].prompts.push({
//          prompt: prompt.prompt,
//          description: prompt.prompt_description
//        });
//      });
     
//      setPromptLibraries(Object.values(libraries).map(library => ({
//        ...library,
//        sections: Object.values(library.sections)
//      })));
//    } catch (error) {
//      console.error('Error:', error);
//    } finally {
//      setLoading(false);
//    }
//  };

//  const handleSaveLibrary = (libraryData) => {
//    setPromptLibraries([...promptLibraries, libraryData]);
//  };

//  const handleDeleteLibrary = async (libraryName) => {
//    try {
//      await api.delete(`${endpoints.prompts.prefix}${endpoints.prompts.routes.delete_library}`.replace('{library_name}', libraryName));
//      fetchPromptLibraries();
//    } catch (error) {
//      console.error('Error:', error);
//    }
//  };

//  useEffect(() => {
//    fetchPromptLibraries();
//  }, []);

//  return (
//    <div className="space-y-8">
//      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//        <div className="flex justify-between items-center">
//          <div>
//            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prompt Studio</h2>
//            <p className="text-gray-500 dark:text-gray-400 mt-1">Design, test, and manage your prompts</p>
//          </div>
//          <button 
//            onClick={() => setIsModalOpen(true)}
//            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//          >
//            <Plus size={20} />
//            New Prompt
//          </button>
//        </div>
//      </div>

//      {loading ? (
//        <div className="flex justify-center items-center min-h-[200px]">
//          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
//        </div>
//      ) : promptLibraries.length === 0 ? (
//        <div className="text-center text-gray-500 dark:text-gray-400 min-h-[200px] flex items-center justify-center">
//          No prompt libraries found. Create one to get started.
//        </div>
//      ) : (
//        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//          {promptLibraries.map((library, index) => (
//            <div 
//              key={index} 
//              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 h-96 flex flex-col cursor-pointer group border border-gray-100 dark:border-gray-700"
//              onClick={() => {
//                setSelectedLibrary(library);
//                setIsDetailModalOpen(true);
//              }}
//            >
//              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
//                <div>
//                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
//                    {library.name}
//                  </h3>
//                  <div className="flex items-center gap-2 mt-2">
//                    <span className="text-sm text-gray-500 dark:text-gray-400">
//                      {library.sections.length} sections
//                    </span>
//                    <span className="text-gray-300 dark:text-gray-600">•</span>
//                    <span className="text-sm text-gray-500 dark:text-gray-400">
//                      {library.sections.reduce((acc, section) => acc + section.prompts.length, 0)} total prompts
//                    </span>
//                  </div>
//                </div>
//                <button
//                  onClick={(e) => {
//                    e.stopPropagation();
//                    handleDeleteLibrary(library.name);
//                  }}
//                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
//                >
//                  <Trash size={18} />
//                </button>
//              </div>

//              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
//                {library.sections.map((section, sectionIndex) => (
//                  <div 
//                    key={sectionIndex} 
//                    className="mb-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 transition-colors duration-200"
//                  >
//                    <div className="flex justify-between items-start">
//                      <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
//                        {section.name}
//                      </h4>
//                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-full">
//                        {section.prompts.length}
//                      </span>
//                    </div>
//                    {section.prompts.length > 0 && (
//                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-1">
//                        {section.prompts[0].prompt}
//                      </p>
//                    )}
//                  </div>
//                ))}
//              </div>

//              <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
//                <button className="w-full py-2 px-4 bg-gray-50 dark:bg-gray-700/50 text-gray-700 dark:text-gray-300 text-sm rounded-lg group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors duration-200">
//                  View Details
//                </button>
//              </div>
//            </div>
//          ))}
//        </div>
//      )}

//      <PromptModal 
//        isOpen={isModalOpen}
//        onClose={() => setIsModalOpen(false)}
//        onSave={handleSaveLibrary}
//      />
//      <PromptLibraryModalDetails
//        isOpen={isDetailModalOpen}
//        onClose={() => {
//          setIsDetailModalOpen(false);
//          setSelectedLibrary(null);
//        }}
//        library={selectedLibrary}
//      />
//    </div>
//  );
// };

// export default Prompt;





import React, { useState, useEffect } from 'react';
import { Plus, Trash } from 'lucide-react';
import endpoints from '../endpoints.json';
import axios from 'axios';
import PromptModal from '../components/PromptModal';
import PromptLibraryModalDetails from '../components/PromptLibraryModalDetails';


const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const Prompt = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [promptLibraries, setPromptLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // const fetchPromptLibraries = async () => {
  //   try {
  //     setLoading(true);
  //     const { data: prompts } = await api.get(`${endpoints.prompts.prefix}${endpoints.prompts.routes.list}`);
      
  //     const libraries = {};
  //     prompts.forEach(prompt => {
  //       if (!libraries[prompt.prompt_library_name]) {
  //         libraries[prompt.prompt_library_name] = {
  //           name: prompt.prompt_library_name,
  //           sections: {}
  //         };
  //       }
        
  //       // Each section now has only one prompt
  //       libraries[prompt.prompt_library_name].sections[prompt.prompt_subsection_name] = {
  //         name: prompt.prompt_subsection_name,
  //         prompt: prompt.prompt,
  //         description: prompt.prompt_description
  //       };
  //     });
      
  //     setPromptLibraries(Object.values(libraries).map(library => ({
  //       ...library,
  //       // Convert sections object to array
  //       sections: Object.values(library.sections)
  //     })));
  //   } catch (error) {
  //     console.error('Error:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };


  // Fixed data structure mapping in Prompt.jsx
const fetchPromptLibraries = async () => {
  try {
    setLoading(true);
    const { data: prompts } = await api.get(`${endpoints.prompts.prefix}${endpoints.prompts.routes.list}`);
    
    const libraries = {};
    prompts.forEach(prompt => {
      if (!libraries[prompt.prompt_library_name]) {
        libraries[prompt.prompt_library_name] = {
          name: prompt.prompt_library_name,
          sections: []
        };
      }
      
      libraries[prompt.prompt_library_name].sections.push({
        id: prompt.id,
        name: prompt.prompt_subsection_name,
        prompt: prompt.prompt,
        description: prompt.prompt_description
      });
    });
    
    setPromptLibraries(Object.values(libraries));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    setLoading(false);
  }
};

  const handleSaveLibrary = (libraryData) => {
    setPromptLibraries(prev => [...prev, {
      name: libraryData.name,
      sections: libraryData.sections.map(section => ({
        name: section.name,
        prompt: section.prompt,
        description: section.description
      }))
    }]);
  };

  const handleDeleteLibrary = async (libraryName) => {
    try {
      await api.delete(`${endpoints.prompts.prefix}${endpoints.prompts.routes.delete_library}`.replace('{library_name}', libraryName));
      fetchPromptLibraries();
    } catch (error) {
      console.error('Error:', error);
    }
  };

  useEffect(() => {
    fetchPromptLibraries();
  }, []);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Prompt Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Design, test, and manage your prompts</p>
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New Prompt
          </button>
        </div>
      </div>

      {/* Library Grid */}
      {loading ? (
        <div className="flex justify-center items-center min-h-[200px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-light"></div>
        </div>
      ) : promptLibraries.length === 0 ? (
        <div className="text-center text-gray-500 dark:text-gray-400 min-h-[200px] flex items-center justify-center">
          No prompt libraries found. Create one to get started.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promptLibraries.map((library, index) => (
            <div 
              key={index} 
              className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 h-96 flex flex-col cursor-pointer group border border-gray-100 dark:border-gray-700"
              onClick={() => {
                setSelectedLibrary(library);
                setIsDetailModalOpen(true);
              }}
            >
              <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {library.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {library.sections?.length || 0} sections
                    </span>
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteLibrary(library.name);
                  }}
                  className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400 p-1.5 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200"
                >
                  <Trash size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto pr-2 -mr-2">
                {library.sections?.map((section, sectionIndex) => (
                  <div 
                    key={sectionIndex} 
                    className="mb-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg group-hover:bg-blue-50/50 dark:group-hover:bg-blue-900/20 transition-colors duration-200"
                  >
                    <h4 className="text-md font-medium text-gray-800 dark:text-gray-200">
                      {section.name}
                    </h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2">
                      {section.prompt}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <PromptModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveLibrary}
      />
      <PromptLibraryModalDetails
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setSelectedLibrary(null);
        }}
        library={selectedLibrary}
        onUpdate={fetchPromptLibraries}
      />
    </div>
  );
};

export default Prompt;