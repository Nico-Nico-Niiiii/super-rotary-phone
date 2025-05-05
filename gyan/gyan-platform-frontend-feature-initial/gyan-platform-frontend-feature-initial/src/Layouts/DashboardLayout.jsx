import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useProject } from '../context/ProjectContext';
import ProjectSelectorModal from '../components/ProjectSelectorModal';
import GyanTrainingModal from '../components/GyanTrainingModal';
import { 
  LayoutDashboard,
  Code2, 
  FileBox, 
  Database,
  Boxes,
  FolderOpen,
  Settings,
  HelpCircle,
  Sun,
  Moon,
  LogOut,
  User,
  ChevronDown,
  Cloud,
  Bot,
  Brain
} from 'lucide-react';
import logo from '../assets/images/logo.png';
import axios from 'axios';
import { useAuth } from '../context/AuthContext'; 
import CloudRouteItem from '../components/cloud ai/CloudRouteItem';


const BASE_URL = import.meta.env.VITE_APP_API_URL
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const DashboardLayout = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedItem, setExpandedItem] = useState(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useTheme();
  const profileRef = useRef(null);
 
  const {user} = useAuth();
  const [pID, setPID] = useState(null);


  const { selectedProject, setSelectedProject, selectedProjectId, setSelectedProjectId } = useProject();

  useEffect(() => {
    // If no project is selected but user is logged in, consider actions
    if (!selectedProject && user) {
      console.log("No project selected, user may need to select one");
    }
  }, [selectedProject, user]);


  useEffect(() => {
    const handleClickOutside = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Function to check if a route is one of the "coming soon" paths
  const isComingSoonRoute = (path) => {
    const comingSoonPaths = [
      '/dashboard/cloud/nemo-llm',
      '/dashboard/cloud/bedrock',
      '/dashboard/cloud/google-vertex'
    ];
    return comingSoonPaths.includes(path);
  };

  const navItems = [
    {
      title: 'Dashboard',
      icon: <LayoutDashboard size={18} />,
      path: '/dashboard'
    },
    {
      title: 'Studio',
      icon: <Code2 size={18} />,
      path: '/dashboard/studio',
      subItems: [
        { title: 'GyanFlow Pipeline', path: `/dashboard/project/${selectedProjectId}/pipeline`},
        { title: 'Agents', path: '/dashboard/studio/agents' },
        { title: 'Playground', path: `/dashboard/project/${selectedProjectId}/playground` },
        { title: 'Scratch Training', path: '/dashboard/studio/scratch-training' },
        { title: 'Training', path:  `/dashboard/project/${selectedProjectId}` },
        // { title: 'Training', path:  `/dashboard/studio/training` },
        { title: 'Evaluation', path: `/dashboard/project/${selectedProjectId}/evaluation`},
        { title: 'Deployment', path: `/dashboard/project/${selectedProjectId}/deployment` },
        { title: 'RAG', path: '/dashboard/studio/rag' },
        { title: 'Prompt', path: '/dashboard/studio/prompt' },
        { title: 'Compilation', path: '/dashboard/studio/compilation' }
      ]
    },
    {
      title: 'Use Cases',
      icon: <FileBox size={18} />,
      path: '/dashboard/use-cases',
      subItems: [
        { title: 'Conversational', path: '/dashboard/use-cases/conversational' },
        { title: 'Software Debugger', path: '/dashboard/use-cases/debugger' },
        { title: 'SDLC Automation', path: '/dashboard/use-cases/sdlc-automation' },
        { title: 'Device Test', path: '/dashboard/use-cases/device-test' },
        { title: 'Ticket Management', path: '/dashboard/use-cases/ticket-management' },
      ]
    },
    {
      title: 'Foundation Models',
      icon: <Database size={18} />,
      path: '/dashboard/foundation-models'
    },
    {
      title: 'Physical AI',
      icon: <Brain size={18} />,
      path: '/dashboard/physical-ai',
      subItems: [
        { title: 'Cosmos', path: '/dashboard/physical-ai/cosmos' }
      ]
    },
    {
      title: 'Agentic AI',
      icon: <Bot size={18} />,
      path: '/dashboard/agentic-ai',
      subItems: [
        { title: 'Agentic Framework', path: '/dashboard/agentic-framework' },
        { title: 'Agentic SDLC', path: '/dashboard/use-cases/sdlc-automation' },
        { title: 'Review Agent', path: '/dashboard/agentic-ai/review-agent' }
      ]
    },
    {
      title: 'Cloud AI Studio',
      icon: <Cloud size={18} />,
      path: '/dashboard/cloud-models',
      subItems: [
        { title: 'Azure AI', path: '/dashboard/cloud/azure' },
        { title: 'Open AI', path: '/dashboard/cloud/open-ai' },
        { title: 'Nemo LLM', path: '/dashboard/cloud/nemo-llm' },
        { title: 'Bedrock', path: '/dashboard/cloud/bedrock' },
        { title: 'Gertex', path: '/dashboard/cloud/google-vertex' },
      ]
    },
    {
      title: 'GyanHub',
      icon: <Boxes size={18} />,
      path: '/dashboard/gyanhub',
      subItems: [
        { title: 'Model Repositories', path: '/dashboard/model-repositories' },
        { title: 'Dataset Repositories', path: '/dashboard/dataset-repositories' }
      ]
    },
    {
      title: 'Settings',
      icon: <Settings size={18} />,
      path: '/dashboard/settings/profile',
      // subItems: [
      //   { title: 'Profile', path: '/dashboard/settings/profile' },
      //   // { title: 'Access Token', path: '/dashboard/settings/access-token' }
      // ]
    },
    {
      title: 'Raise A Query',
      icon: <HelpCircle size={18} />,
      path: '/dashboard/queries'
    }
  ];

  const [userInitial, setUserInitial] = useState('');
const [userProfile, setUserProfile] = useState({
  username: 'Username',
  firstName: 'John',
  lastName: 'Doe',
  email: 'user@example.com',
  avatarColor: '#4F46E5' // Default color
});

// Function to generate a consistent color based on username
const generateAvatarColor = (username) => {
  // Simple hash function for username to create a consistent color
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Convert to hex color
  let color = '#';
  for (let i = 0; i < 3; i++) {
    const value = (hash >> (i * 8)) & 0xFF;
    color += ('00' + value.toString(16)).substr(-2);
  }
  
  return color;
};

// Modified fetch user profile function
const fetchUserProfile = async () => {
  try {
    const response = await api.get('/users/me');
    console.log('Response', response.data);
    
    const userData = response.data;
    const firstName = userData.first_name || 'John';
    const lastName = userData.last_name || 'Doe';
    const username = userData.username || 'Username';
    
    // Get the first letter (either from firstName or username)
    const initial = firstName ? firstName.charAt(0).toUpperCase() : 
                   username.charAt(0).toUpperCase();
                   console.log("User initial", initial);
                   
    
    // Generate a color based on username
    const avatarColor = generateAvatarColor(username);
    
    setUserInitial(initial);
    setUserProfile({
      username: username,
      firstName: firstName,
      lastName: lastName,
      email: userData.email || 'user@example.com',
      avatarColor: avatarColor
    });
  } catch (error) {
    console.error('Failed to fetch user profile:', error);
  }
};

// Call this function in useEffect
useEffect(() => {
  fetchUserProfile();
}, []);

  
  const handleLogout = () => {
    setSelectedProject(null);
  setSelectedProjectId(null);
    navigate('/signin');
  };

  const handleItemClick = (item) => {
    if (item.subItems) {
      setExpandedItem(expandedItem === item.title ? null : item.title);
    } else {
      navigate(item.path);
      setExpandedItem(null);
    }
  };

  const handleMouseLeave = () => {
    setIsExpanded(false);
    setExpandedItem(null); // Close any open submenu
  };

  const handleSelectProjectClick = () => {
    navigate('/dashboard/projects');  
  };

  const handleNewProject = () => {
    setIsGyanModalOpen(true); // This should be defined at the top with useState
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
      setProjects(prevProjects => [response.data.project, ...prevProjects]);
      setSelectedProject(response.data.project);
setSelectedProjectId(response.data.project.id);  // Add the new project
      setIsGyanModalOpen(false);
      setCurrentPage(0);
    }
    } catch(error){
      console.error('Error creating project:', error);
    }
  
  };

  return (
    <div className="min-h-screen flex bg-[#f7f8fc] dark:bg-gray-900">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-sm z-50 px-4">
        <div className="flex justify-between items-center h-full">
          {/* Logo */}
          <div className="flex items-center">
            <img src={logo} alt="GYAN Logo" className="h-8 w-auto" />
          </div>

          {/* Right side - Theme toggle and Profile */}
          <div className="flex items-center space-x-4">
          {selectedProject ? (
        <button
        onClick={() => setIsProjectSelectorOpen(true)}
        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center transition-colors duration-200 group"
      >
        <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Selected Project:</span>
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-light">
          {selectedProject.name}
        </span>
      </button>
      ) : (
        <button
          onClick={() => setIsProjectSelectorOpen(true)}
          className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
        >
          Select Project
        </button>
      )}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700
                text-gray-500 dark:text-gray-400 transition-all duration-300 ease-in-out focus:outline-none"
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {/* Profile Dropdown */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700 
                  text-gray-700 dark:text-gray-300 transition-all duration-300"
              >
                <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center">
                  {userInitial}
                </div>
                
                <ChevronDown size={16} />
              </button>
              

              {isProfileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
                  <Link
                    to="/dashboard/profile"
                    className="w-full text-left px-4 py-2 text-sm bg-transparent text-gray-200 hover:bg-gray-700 flex items-center"
                    onClick={() => setIsProfileOpen(false)}
                  >
                    <User size={16} className="mr-2" />
                    Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm bg-transparent text-gray-200 hover:bg-gray-700 flex items-center"
                  >
                    <LogOut size={16} className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Add these modals just before the closing div of your return statement */}
      <ProjectSelectorModal 
        isOpen={isProjectSelectorOpen}
        onClose={() => setIsProjectSelectorOpen(false)}
        onNewProject={handleNewProject}
      />
      <GyanTrainingModal
        isOpen={isGyanModalOpen}
        onClose={() => setIsGyanModalOpen(false)}
        onSubmit={handleGyanTraining}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg transition-all duration-500 ease-in-out z-40
          ${isExpanded ? 'w-64' : 'w-16'}`}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={handleMouseLeave}
      >
        {/* Navigation Items */}
        <nav className="mt-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
          {navItems.map((item) => (
            <div key={item.path}>
              {item.title === 'Cloud AI Studio' ? (
                <CloudRouteItem
                  title={item.title}
                  icon={item.icon}
                  path={item.path}
                  isExpanded={isExpanded}
                  expandedItem={expandedItem}
                  setExpandedItem={setExpandedItem}
                  location={location}
                  subItems={item.subItems}
                />
              ) : (
                <>
                  <div
                    onClick={() => handleItemClick(item)}
                    className={`flex items-center px-3 py-2.5 transition-all duration-300 ease-in-out cursor-pointer
                      ${(location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
                        ? 'bg-primary-light/10 text-primary-light border-r-4 border-primary-light' 
                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  >
                    <div className="flex items-center justify-center min-w-[24px]">
                      {item.icon}
                    </div>
                    <span className={`ml-3 text-sm transition-all duration-300 ease-in-out whitespace-nowrap
                      ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
                      {item.title}
                    </span>
                    {item.subItems && isExpanded && (
                      <ChevronDown 
                        size={16} 
                        className={`ml-auto transition-transform duration-300 ${expandedItem === item.title ? 'rotate-180' : ''}`}
                      />
                    )}
                  </div>

                  {/* Sub Items */}
                  {item.subItems && isExpanded && expandedItem === item.title && (
                    <div className="overflow-hidden transition-all duration-300">
                      {item.subItems.map((subItem) => (
                        <Link
                          key={subItem.path}
                          to={subItem.path}
                          className={`flex items-center px-3 py-2 text-sm pl-12 transition-all duration-300 ease-in-out whitespace-nowrap
                            ${location.pathname === subItem.path 
                              ? 'text-primary-light bg-primary-light/5' 
                              : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                        >
                          {subItem.title}
                          {/* Add "Coming Soon" tag if needed for other sections */}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Main Content */}
      <div className={`flex-1 transition-all duration-500 ease-in-out ${isExpanded ? 'ml-64' : 'ml-16'} mt-16`}>
        <div className="p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;



















// import { useState, useRef, useEffect } from 'react';
// import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
// import { useTheme } from '../context/ThemeContext';
// import { useProject } from '../context/ProjectContext';
// import ProjectSelectorModal from '../components/ProjectSelectorModal';
// import GyanTrainingModal from '../components/GyanTrainingModal';
// import { 
//   LayoutDashboard,
//   Code2, 
//   FileBox, 
//   Database,
//   Boxes,
//   FolderOpen,
//   Settings,
//   HelpCircle,
//   Sun,
//   Moon,
//   LogOut,
//   User,
//   ChevronDown,
//   Cloud,
//   Bot,
//   Brain
// } from 'lucide-react';
// import logo from '../assets/images/logo.png';
// import axios from 'axios';
// import { useAuth } from '../context/AuthContext'; 
// import CloudRouteItem from '../components/cloud ai/CloudRouteItem';


// const BASE_URL = import.meta.env.VITE_APP_API_URL
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// const DashboardLayout = () => {
//   const [isExpanded, setIsExpanded] = useState(false);
//   const [expandedItem, setExpandedItem] = useState(null);
//   const [isProfileOpen, setIsProfileOpen] = useState(false);
//   const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
//   const [isGyanModalOpen, setIsGyanModalOpen] = useState(false);
//   const location = useLocation();
//   const navigate = useNavigate();
//   const { isDark, toggleTheme } = useTheme();
//   const profileRef = useRef(null);
//   const { selectedProject } = useProject(); 
//   const {user} = useAuth();
//   const [pID, setPID] = useState(null);

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (profileRef.current && !profileRef.current.contains(event.target)) {
//         setIsProfileOpen(false);
//       }
//     };
    

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // console.log(selectedProject.id);
  


//   const navItems = [
//     {
//       title: 'Dashboard',
//       icon: <LayoutDashboard size={18} />,
//       path: '/dashboard'
//     },
//     {
//       title: 'Studio',
//       icon: <Code2 size={18} />,
//       path: '/dashboard/studio',
//       subItems: [
//         { title: 'GyanFlow Pipeline', path: '/dashboard/studio/pipeline' },
//         { title: 'Agents', path: '/dashboard/studio/agents' },
//         { title: 'Playground', path: '/dashboard/studio/playground' },
//         { title: 'Scratch Training', path: '/dashboard/studio/scratch-training' },
//         { title: 'Training', path:  '/dashboard/studio/training' },
//         { title: 'Evaluation', path: '/dashboard/studio/evaluation' },
//         { title: 'Deployment', path: '/dashboard/studio/deployment' },
//         { title: 'RAG', path: '/dashboard/studio/rag' },
//         { title: 'Prompt', path: '/dashboard/studio/prompt' },
//         { title: 'Compilation', path: '/dashboard/studio/compilation' }
//       ]
//     },
//     {
//       title: 'Use Cases',
//       icon: <FileBox size={18} />,
//       path: '/dashboard/use-cases',
//       subItems: [
//         { title: 'Conversational', path: '/dashboard/use-cases/conversational' },
//         { title: 'Software Debugger', path: '/dashboard/use-cases/debugger' },
//         { title: 'Automation', path: '/dashboard/use-cases/automation' },
//         { title: 'Test Generation', path: '/dashboard/use-cases/test-generation' },
//         { title: 'Device Test', path: '/dashboard/use-cases/device-test' },
//         { title: 'Ticket Management', path: '/dashboard/use-cases/ticket-management' }
//       ]
//     },
//     {
//       title: 'Foundation Models',
//       icon: <Database size={18} />,
//       path: '/dashboard/foundation-models'
//     },
//     {
//       title: 'Physical AI',
//       icon: <Brain size={18} />,
//       path: '/dashboard/physical-ai',
//       subItems: [
//         { title: 'Cosmos', path: '/dashboard/physical-ai/cosmos' }
//       ]
//     },
//     {
//       title: 'Agentic AI',
//       icon: <Bot size={18} />,
//       path: '/dashboard/agentic-ai',
//       subItems: [
//         { title: 'Agentic Framework', path: '/dashboard/agentic-framework' }
//       ]
//     },
//     {
//       title: 'Cloud AI Studio',
//       icon: <Cloud size={18} />,
//       path: '/dashboard/cloud-models',
//       subItems: [
//         { title: 'Azure AI', path: '/dashboard/cloud/azure' },
//         { title: 'Open AI', path: '/dashboard/cloud/open-ai' },
//         { title: 'Nemo LLM', path: '/dashboard/cloud/nemo-llm' },
//         { title: 'Bedrock', path: '/dashboard/cloud/bedrock' },
//         { title: 'Gertex', path: '/dashboard/cloud/google-vertex' },
//       ]
//     },
//     {
//       title: 'GyanHub',
//       icon: <Boxes size={18} />,
//       path: '/dashboard/gyanhub',
//       subItems: [
//         { title: 'Model Repositories', path: '/dashboard/model-repositories' },
//         { title: 'Dataset Repositories', path: '/dashboard/dataset-repositories' }
//       ]
//     },


//     // {
//     //   title: 'Model Repositories',
//     //   icon: <Boxes size={18} />,
//     //   path: '/dashboard/model-repositories'
//     // },
//     // {
//     //   title: 'Dataset Repositories',
//     //   icon: <FolderOpen size={18} />,
//     //   path: '/dashboard/dataset-repositories'
//     // },

    
//     {
//       title: 'Settings',
//       icon: <Settings size={18} />,
//       path: '/dashboard/settings',
//       subItems: [
//         { title: 'Profile', path: '/dashboard/settings/profile' },
//         { title: 'Access Token', path: '/dashboard/settings/access-token' }
//       ]
//     },
//     {
//       title: 'Raise A Query',
//       icon: <HelpCircle size={18} />,
//       path: '/dashboard/raise-query'
//     }
//   ];

//   const handleLogout = () => {
//     navigate('/signin');
//   };

//   const handleItemClick = (item) => {
//     if (item.subItems) {
//       setExpandedItem(expandedItem === item.title ? null : item.title);
//     } else {
//       navigate(item.path);
//       setExpandedItem(null);
//     }
//   };

//   const handleMouseLeave = () => {
//     setIsExpanded(false);
//     setExpandedItem(null); // Close any open submenu
//   };

//   const handleSelectProjectClick = () => {
//     navigate('/dashboard/projects'); // Or whatever your projects page route is
//   };

  

//   const handleNewProject = () => {
//     setIsGyanModalOpen(true); // This should be defined at the top with useState
//   };

//   const handleGyanTraining = async(formData) => {
//     // Create a new project
//     try{
//     const projectData = {
//       name: formData.name,
//       type: formData.type === 'llm' ? 'Large Language Model' 
//             : formData.type === 'vision' ? 'Vision'
//             : 'Vision LLM',
//       model: formData.model 
//     };
  

//     console.log("Project data");
//     console.log(projectData);
    
    

//     const response = await api.post(`${endpoints.project.prefix}${endpoints.project.routes.create}`, 
//       projectData
//     );

//     console.log(response.data);
    

//     if (response.data.project) {  // Changed from new_project to project
//       setProjects(prevProjects => [response.data.project, ...prevProjects]);  // Add the new project
//       setIsGyanModalOpen(false);
//       setCurrentPage(0);
//     }
//     } catch(error){
//       console.error('Error creating project:', error);
//     }
  
//   };

//   return (
//     <div className="min-h-screen flex bg-[#f7f8fc] dark:bg-gray-900">
//       {/* Header */}
//       <header className="fixed top-0 left-0 right-0 h-16 bg-white dark:bg-gray-800 shadow-sm z-50 px-4">
//         <div className="flex justify-between items-center h-full">
//           {/* Logo */}
//           <div className="flex items-center">
//             <img src={logo} alt="GYAN Logo" className="h-8 w-auto" />
//           </div>

//           {/* Right side - Theme toggle and Profile */}
//           <div className="flex items-center space-x-4">
//           {selectedProject ? (
//         <button
//         onClick={() => setIsProjectSelectorOpen(true)}
//         className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 rounded-lg flex items-center transition-colors duration-200 group"
//       >
//         <span className="text-sm text-gray-600 dark:text-gray-300 mr-2">Selected Project:</span>
//         <span className="text-sm font-medium text-gray-900 dark:text-gray-100 group-hover:text-primary-light">
//           {selectedProject.name}
//         </span>
//       </button>
//       ) : (
//         <button
//           onClick={() => setIsProjectSelectorOpen(true)}
//           className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors duration-200"
//         >
//           Select Project
//         </button>
//       )}
//             <button
//               onClick={toggleTheme}
//               className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 dark:bg-gray-700
//                 text-gray-500 dark:text-gray-400 transition-all duration-300 ease-in-out focus:outline-none"
//             >
//               {isDark ? <Sun size={18} /> : <Moon size={18} />}
//             </button>

//             {/* Profile Dropdown */}
//             <div className="relative" ref={profileRef}>
//               <button
//                 onClick={() => setIsProfileOpen(!isProfileOpen)}
//                 className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-700 
//                   text-gray-700 dark:text-gray-300 transition-all duration-300"
//               >
//                 <div className="w-8 h-8 rounded-full bg-primary-light text-white flex items-center justify-center">
//                   D
//                 </div>
//                 <ChevronDown size={16} />
//               </button>

//               {isProfileOpen && (
//                 <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg py-1">
//                   <Link
//                     to="/dashboard/profile"
//                     className="w-full text-left px-4 py-2 text-sm bg-transparent text-gray-200 hover:bg-gray-700 flex items-center"
//                     onClick={() => setIsProfileOpen(false)}
//                   >
//                     <User size={16} className="mr-2" />
//                     Profile
//                   </Link>
//                   <button
//                     onClick={handleLogout}
//                     className="w-full text-left px-4 py-2 text-sm bg-transparent text-gray-200 hover:bg-gray-700 flex items-center"
//                   >
//                     <LogOut size={16} className="mr-2" />
//                     Logout
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </header>

//       {/* Add these modals just before the closing div of your return statement */}
//       <ProjectSelectorModal 
//         isOpen={isProjectSelectorOpen}
//         onClose={() => setIsProjectSelectorOpen(false)}
//         onNewProject={handleNewProject}
//       />
//       <GyanTrainingModal
//         isOpen={isGyanModalOpen}
//         onClose={() => setIsGyanModalOpen(false)}
//         onSubmit={handleGyanTraining}
//       />

//       {/* Sidebar */}
//       <div 
//         className={`fixed top-16 h-[calc(100vh-4rem)] bg-white dark:bg-gray-800 shadow-lg transition-all duration-500 ease-in-out z-40
//           ${isExpanded ? 'w-64' : 'w-16'}`}
//         onMouseEnter={() => setIsExpanded(true)}
//         onMouseLeave={handleMouseLeave}
//       >
//         {/* Navigation Items */}
//         <nav className="mt-4 h-full overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-500">
//           {navItems.map((item) => (
//             <div key={item.path}>
//               <div
//                 onClick={() => handleItemClick(item)}
//                 className={`flex items-center px-3 py-2.5 transition-all duration-300 ease-in-out cursor-pointer
//                   ${(location.pathname === item.path || location.pathname.startsWith(item.path + '/'))
//                     ? 'bg-primary-light/10 text-primary-light border-r-4 border-primary-light' 
//                     : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
//               >
//                 <div className="flex items-center justify-center min-w-[24px]">
//                   {item.icon}
//                 </div>
//                 <span className={`ml-3 text-sm transition-all duration-300 ease-in-out whitespace-nowrap
//                   ${isExpanded ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}`}>
//                   {item.title}
//                 </span>
//                 {item.subItems && isExpanded && (
//                   <ChevronDown 
//                     size={16} 
//                     className={`ml-auto transition-transform duration-300 ${expandedItem === item.title ? 'rotate-180' : ''}`}
//                   />
//                 )}
//               </div>

//               {/* Sub Items */}
//               {item.subItems && isExpanded && expandedItem === item.title && (
//                 <div className="overflow-hidden transition-all duration-300">
//                   {item.subItems.map((subItem) => (
//                     <Link
//                       key={subItem.path}
//                       to={subItem.path}
//                       className={`flex items-center px-3 py-2 text-sm pl-12 transition-all duration-300 ease-in-out whitespace-nowrap
//                         ${location.pathname === subItem.path 
//                           ? 'text-primary-light bg-primary-light/5' 
//                           : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
//                     >
//                       {subItem.title}
//                     </Link>
//                   ))}
//                 </div>
//               )}
//             </div>
//           ))}
//         </nav>
//       </div>

//       {/* Main Content */}
//       <div className={`flex-1 transition-all duration-500 ease-in-out ${isExpanded ? 'ml-64' : 'ml-16'} mt-16`}>
//         <div className="p-8">
//           <Outlet />
//         </div>
//       </div>
//     </div>
//   );
// };

// export default DashboardLayout;