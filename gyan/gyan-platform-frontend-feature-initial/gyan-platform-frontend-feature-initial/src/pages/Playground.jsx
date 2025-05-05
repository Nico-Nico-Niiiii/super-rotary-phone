// import { useState } from 'react';
// import { Plus, Box, History, Cpu, Code, ArrowUp, ArrowDown, Send } from 'lucide-react';
// import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

// const mockPerformanceStats = [
//   { name: 'Jan', inferences: 4, latency: 3, tokens: 5 },
//   { name: 'Feb', inferences: 6, latency: 4, tokens: 7 },
//   { name: 'Mar', inferences: 5, latency: 6, tokens: 6 },
//   { name: 'Apr', inferences: 8, latency: 5, tokens: 8 },
//   { name: 'May', inferences: 7, latency: 4, tokens: 7 },
//   { name: 'Jun', inferences: 9, latency: 7, tokens: 9 }
// ];

// const StatsCard = ({ title, value, trend, trendValue, icon: Icon }) => (
//   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
//     <div className="flex flex-col">
//       <span className="text-gray-500 dark:text-gray-400 text-sm mb-1">{title}</span>
//       <div className="flex items-baseline gap-2">
//         <span className="text-2xl font-semibold text-gray-900 dark:text-white">{value}</span>
//         <div className={`flex items-center ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
//           {trend === 'up' ? <ArrowUp size={16} /> : <ArrowDown size={16} />}
//           <span className="text-sm">{trendValue}%</span>
//         </div>
//       </div>
//     </div>
//     <div className="mt-2">
//       <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg w-fit">
//         <Icon size={20} className="text-primary-light" />
//       </div>
//     </div>
//   </div>
// );

// const ModelCard = ({ name, description, type, lastUsed }) => (
//   <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
//     <div className="flex justify-between items-start mb-4">
//       <div>
//         <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{name}</h3>
//         <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full">
//           {type}
//         </span>
//       </div>
//     </div>
//     <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
//     <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
//       <span>Last used: {lastUsed}</span>
//       <button className="text-primary-light hover:text-primary-dark transition-colors duration-200">
//         Select Model
//       </button>
//     </div>
//   </div>
// );

// const Playground = () => {
//   const [prompt, setPrompt] = useState('');

//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Playground</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Test and experiment with your models</p>
//           </div>
//           <button className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200">
//             <Plus size={20} />
//             New Session
//           </button>
//         </div>
//       </div>

//       {/* Stats Cards */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
//         <StatsCard 
//           title="Total Inference Calls"
//           value="2,845"
//           trend="up"
//           trendValue="12.5"
//           icon={Cpu}
//         />
//         <StatsCard 
//           title="Active Sessions"
//           value="8"
//           trend="up"
//           trendValue="8.2"
//           icon={Box}
//         />
//         <StatsCard 
//           title="Response Time"
//           value="125ms"
//           trend="down"
//           trendValue="15.3"
//           icon={History}
//         />
//         <StatsCard 
//           title="Success Rate"
//           value="99.8%"
//           trend="up"
//           trendValue="2.1"
//           icon={Code}
//         />
//       </div>

//       {/* Model Selection Grid */}
//       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//         <ModelCard 
//           name="GPT Large"
//           type="Language Model"
//           description="Large language model optimized for general text generation and comprehension"
//           lastUsed="2 hours ago"
//         />
//         <ModelCard 
//           name="BERT Classifier"
//           type="Classification"
//           description="Fine-tuned BERT model for text classification tasks"
//           lastUsed="1 day ago"
//         />
//         <ModelCard 
//           name="Code Assistant"
//           type="Code Generation"
//           description="Specialized model for code generation and completion"
//           lastUsed="3 hours ago"
//         />
//       </div>

//       {/* Playground Interface */}
//       <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
//         {/* Input Section */}
//         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//           <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Input</h3>
//           <div className="relative">
//             <textarea
//               value={prompt}
//               onChange={(e) => setPrompt(e.target.value)}
//               className="w-full h-[200px] p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-primary-light resize-none"
//               placeholder="Enter your prompt here..."
//             />
//             <button 
//               className="absolute bottom-4 right-4 p-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//             >
//               <Send size={20} />
//             </button>
//           </div>
//         </div>

//         {/* Output Section */}
//         <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//           <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Output</h3>
//           <div className="h-[200px] p-4 border rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white border-gray-200 dark:border-gray-700 overflow-auto">
//             {/* Model response will appear here */}
//             <p className="text-gray-500 dark:text-gray-400">Model response will appear here...</p>
//           </div>
//         </div>
//       </div>

//       {/* Performance Chart */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-white">Model Performance</h3>
//         <div className="h-[300px]">
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={mockPerformanceStats}>
//               <XAxis dataKey="name" stroke="#718096" fontSize={12} />
//               <YAxis stroke="#718096" fontSize={12} />
//               <Tooltip 
//                 contentStyle={{ 
//                   backgroundColor: '#1F2937',
//                   border: 'none',
//                   borderRadius: '8px',
//                   color: '#fff'
//                 }}
//               />
//               <Bar dataKey="inferences" fill="#00A3E0" radius={[4, 4, 0, 0]} />
//               <Bar dataKey="latency" fill="#0082B3" radius={[4, 4, 0, 0]} />
//               <Bar dataKey="tokens" fill="#005E82" radius={[4, 4, 0, 0]} />
//             </BarChart>
//           </ResponsiveContainer>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Playground;




///// playground exact same as training
// import { useState } from 'react';
// import { useNavigate } from 'react-router-dom';
// import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
// import GyanTrainingModal from '../components/GyanTrainingModal';

// // Mock data with more details
// const mockProjects = Array.from({ length: 30 }, (_, i) => ({
//   id: i + 1,
//   name: `Project ${i + 1}`,
//   type: ['Large Language Model', 'Vision LLM', 'Vision'][Math.floor(Math.random() * 3)],
//   status: ['Active', 'Pending', 'Completed'][Math.floor(Math.random() * 3)],
//   lastUpdated: `${Math.floor(Math.random() * 24)} hours ago`,
//   description: `This is a sample description for Project ${i + 1}`,
//   createdDate: 'DD/MM/YY', // You can generate random dates if needed
//   progress: Math.floor(Math.random() * 100)
// }));

// // Search Bar Component
// const SearchBar = ({ value, onChange }) => (
//   <div className="w-48 mb-8 ml-auto">
//     <div className="relative">
//       <input
//         type="text"
//         placeholder="Search ..."
//         value={value}
//         onChange={(e) => onChange(e.target.value)}
//         className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//       />
//       <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
//         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
//           <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
//         </svg>
//       </div>
//     </div>
//   </div>
// );

// const ProjectCard = ({ project }) => {
//     const navigate = useNavigate();
  
//     // const handleProjectClick = (projectId) => {
//     //   navigate(`/dashboard/project/${projectId}`, {
//     //     state: { projectData: project }
//     //   });
//     // };

//     const handleProjectClick = (projectId) => {
//       navigate(`/dashboard/project/${projectId}/playground`);
//     };
  
//     return (
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
//         <div className="flex justify-between items-start">
//           <h3 
//             onClick={() => handleProjectClick(project.id)}
//             className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-light dark:hover:text-primary-light transition-colors"
//           >
//             {project.name}
//           </h3>
//           <span className={`text-sm ${
//             project.status === 'Active' ? 'text-green-500' :
//             project.status === 'Completed' ? 'text-blue-500' :
//             'text-yellow-500'
//           }`}>
//             {project.status}
//           </span>
//         </div>
//         <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2
//           ${project.type === 'Large Language Model' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
//             project.type === 'Vision LLM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
//             'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'}`}>
//           {project.type}
//         </span>
//         <div className="flex justify-between items-center mt-4">
//           <p className="text-xs text-gray-500 dark:text-gray-400">Created: {project.createdDate}</p>
          
//           <button 
//           onClick={() => handleProjectClick(project.id)}
//           className="p-2 text-primary-light hover:text-primary-dark flex-shrink-0">
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
//               <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
//             </svg>
//           </button>
//         </div>
//       </div>
//     );
//   };


// const Playground = () => {
//   const navigate = useNavigate();
//   const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
//   const [searchTerm, setSearchTerm] = useState('');
//   const [currentPage, setCurrentPage] = useState(0);
//   const projectsPerPage = 8;

//   // Filter projects based on search term
//   const filteredProjects = mockProjects.filter(project =>
//     project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     project.type.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const maxPages = Math.ceil(filteredProjects.length / projectsPerPage);
//   const displayedProjects = searchTerm 
//     ? filteredProjects 
//     : filteredProjects.slice(currentPage * projectsPerPage, (currentPage + 1) * projectsPerPage);

//   const handleGyanTraining = (formData) => {
//     console.log('Project Creation Data:', formData);
//     // Add your project creation logic here
//     // After creation, you might want to refresh the projects list or navigate to the new project
//   };

//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Training Studio</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Create your new project to train the model.</p>
//           </div>
//           <button 
//             onClick={() => setIsGyanModalOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//           >
//             <Plus size={20} />
//             New Project
//           </button>
//         </div>
//       </div>
      
//       {/* Search and Projects Section */}
//       <div className="px-8">
//         <SearchBar 
//           value={searchTerm}
//           onChange={setSearchTerm}
//         />

//         {/* Projects Grid with Navigation */}
//         <div className="relative mb-16">
//           {!searchTerm && currentPage > 0 && (
//             <button
//               onClick={() => setCurrentPage(prev => prev - 1)}
//               className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
//             >
//               <ChevronLeft size={24} />
//             </button>
//           )}

//           <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
//             {displayedProjects.map(project => (
//               <ProjectCard key={project.id} project={project} />
//             ))}
//           </div>

//           {!searchTerm && currentPage < maxPages - 1 && (
//             <button
//               onClick={() => setCurrentPage(prev => prev + 1)}
//               className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
//             >
//               <ChevronRight size={24} />
//             </button>
//           )}
//         </div>
//       </div>

//       {/* Gyan Training Modal */}
//       <GyanTrainingModal
//         isOpen={isGyanModalOpen}
//         onClose={() => setIsGyanModalOpen(false)}
//         onSubmit={handleGyanTraining}
//       />
//     </div>
//   );
// };

// export default Playground;











import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import GyanTrainingModal from '../components/GyanTrainingModal';
import axios from 'axios';  
import { useAuth } from '../context/AuthContext'; 
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

// Search Bar Component
const SearchBar = ({ value, onChange }) => (
  <div className="w-48 mb-8 ml-auto">
    <div className="relative">
      <input
        type="text"
        placeholder="Search ..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-4 py-2 pl-10 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
      />
      <div className="absolute inset-y-0 left-3 flex items-center text-gray-400">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
      </div>
    </div>
  </div>
);



// Main Training Component


const ProjectCard = ({ project }) => {
  const navigate = useNavigate();

  if (!project) return null; 

  const handleProjectClick = (projectId) => {
    navigate(`/dashboard/project/${projectId}/playground`, {
      state: { projectData: project }
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
      <div className="flex justify-between items-start">
        <h3 
          onClick={() => handleProjectClick(project.id)}
          className="text-lg font-semibold text-gray-900 dark:text-white cursor-pointer hover:text-primary-light dark:hover:text-primary-light transition-colors"
        >
          {project.name}
        </h3>
        <span className={`text-sm ${
          project.status === 'Active' ? 'text-green-500' :
          project.status === 'Completed' ? 'text-blue-500' :
          'text-yellow-500'
        }`}>
          {project.status}
        </span>
      </div>
      <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
        project.model_type === 'Large Language Model' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
        project.model_type === 'Vision LLM' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        }`}>
        {project.model_type}
      </span>
        <div className='mt-2'>{project.model_name}</div>

      {/* <span className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${
        project.model_name === 'BERT' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
        project.model_name === 'GPT' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200' :
        'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      }`}>
        {project.model_name}
      </span> */}
      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date(project.created_date).toLocaleDateString()}
        </p>
        <button 
          onClick={() => handleProjectClick(project.id)}
          className="p-2 text-primary-light hover:text-primary-dark flex-shrink-0"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};



const Playground = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); 
  const [projects, setProjects] = useState([]);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const projectsPerPage = 8;

  useEffect(() => {
    if (user?.id) {
      fetchProjects();
    }
  }, [user]);

  const fetchProjects = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/project/user/${user.id}`, {
        withCredentials: true
      });
      setProjects(response.data);
    } catch (error) {
      console.error('Error fetching projects:', error);
    }
  };

  const handleGyanTraining = async(formData) => {
    // Create a new project
    try{
    const projectData = {
      name: formData.name,
      type: formData.type === 'llm' ? 'Large Language Model' 
            : formData.type === 'vision' ? 'Vision'
            : 'Vision LLM',
      model: formData.model 
    };
  

    console.log("Project data");
    console.log(projectData);
    
    

    const response = await api.post(`${endpoints.project.prefix}${endpoints.project.routes.create}`, 
      projectData
    );

    console.log(response.data);
    

    if (response.data.project) {  // Changed from new_project to project
      setProjects(prevProjects => [response.data.project, ...prevProjects]);  // Add the new project
      setIsGyanModalOpen(false);
      setCurrentPage(0);
    }
    } catch(error){
      console.error('Error creating project:', error);
    }
  
  };

 

  // Fixed filter function
const filteredProjects = projects.filter(project =>
  project?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
  project?.model_type?.toLowerCase().includes(searchTerm.toLowerCase())
);

  const maxPages = Math.ceil(filteredProjects.length / projectsPerPage);
  const displayedProjects = searchTerm 
    ? filteredProjects 
    : filteredProjects.slice(currentPage * projectsPerPage, (currentPage + 1) * projectsPerPage);

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Playground Studio</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Create your new playground to test the model.</p>
          </div>
          <button 
            onClick={() => setIsGyanModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            <Plus size={20} />
            New Project
          </button>
        </div>
      </div>
      
      {/* Search and Projects Section */}
      <div className="px-8">
        <SearchBar 
          value={searchTerm}
          onChange={setSearchTerm}
        />

        {/* Projects Grid with Navigation */}
        <div className="relative mb-16">
          {!searchTerm && currentPage > 0 && (
            <button
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="absolute -left-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayedProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {!searchTerm && currentPage < maxPages - 1 && (
            <button
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="absolute -right-12 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* Gyan Training Modal */}
      <GyanTrainingModal
        isOpen={isGyanModalOpen}
        onClose={() => setIsGyanModalOpen(false)}
        onSubmit={handleGyanTraining}
      />
    </div>
  );
};

export default Playground;



