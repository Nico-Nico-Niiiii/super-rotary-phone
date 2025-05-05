import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  GitBranch,
  Clock,
  HardDrive,
  Download,
  BarChart2,
  Search,
  Filter,
  ChevronDown,
  Share2,
  Star,
  Grid,
  List,
  MoreVertical,
  GitCommit,
  Code
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

// API configuration
const API_BASE_URL = import.meta.env.VITE_APP_API_URL;
const GYANHUB_URL = 'http://10.155.1.170:8080'; // Your Gyanhub dashboard URL

// API service functions
const fetchModelRepositories = async (username, accessToken) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/gyanhub/fetch_model_repo`, {
      username,
      access_token: accessToken
    });
    console.log("Response data",response.data);
    
    return response.data;
  } catch (error) {
    console.error('Error fetching repositories:', error);
    throw error;
  }
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    staging: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    development: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    // Default for unknown status
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  };

  const style = statusStyles[status] || statusStyles.default;
  const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {displayStatus}
    </span>
  );
};

// Framework Badge Component
const FrameworkBadge = ({ framework }) => {
  const frameworkStyles = {
    PyTorch: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    TensorFlow: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    JAX: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    // Default for unknown frameworks
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  };

  const style = frameworkStyles[framework] || frameworkStyles.default;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {framework || 'Unknown'}
    </span>
  );
};

const ModelRepositories = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFramework, setSelectedFramework] = useState('all');
  const [repositories, setRepositories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modelName, setModelName] = useState();
  
  // Helper function to parse metrics from description (if stored there)
  const parseMetricsFromDescription = (description) => {
    try {
      const accuracyMatch = description.match(/accuracy:?\s*(\d+\.?\d*)/i);
      const f1Match = description.match(/f1(?:\s*score)?:?\s*(\d+\.?\d*)/i);
      const latencyMatch = description.match(/latency:?\s*(\d+\.?\d*\s*m?s)/i);
      
      return {
        accuracy: accuracyMatch ? parseFloat(accuracyMatch[1]) : null,
        f1Score: f1Match ? parseFloat(f1Match[1]) : null,
        latency: latencyMatch ? latencyMatch[1] : null
      };
    } catch (e) {
      console.error("Error parsing metrics:", e);
      return { accuracy: null, f1Score: null, latency: null };
    }
  };
  
  // Helper function to format repository size
  const formatSize = (sizeInKB) => {
    if (!sizeInKB) return "Unknown";
    
    const sizeInMB = sizeInKB / 1024;
    if (sizeInMB < 1) return `${sizeInKB} KB`;
    
    const sizeInGB = sizeInMB / 1024;
    if (sizeInGB < 1) return `${sizeInMB.toFixed(1)} MB`;
    
    return `${sizeInGB.toFixed(1)} GB`;
  };
  
  // Helper to extract status from repository
  const extractStatusFromRepo = (repo) => {
    if (repo.topics && Array.isArray(repo.topics)) {
      if (repo.topics.includes('production')) return 'production';
      if (repo.topics.includes('staging')) return 'staging';
      if (repo.topics.includes('development')) return 'development';
    }
    
    // Default status based on activity
    const lastUpdated = new Date(repo.updated_at);
    const now = new Date();
    const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
    
    if (daysSinceUpdate <= 7) return 'development';
    if (daysSinceUpdate <= 30) return 'staging';
    return 'production';
  };

  // Helper function to get repository URL
  const getRepoUrl = (repo) => {
    return `${GYANHUB_URL}/GYAN/${repo.name}`;
  };

  // Navigation handler for repository click
  const handleRepoClick = (repo) => {
    window.open(getRepoUrl(repo), "_blank");
  };

  useEffect(() => {
    const fetchRepositories = async () => {
      try {
        setLoading(true);
        const username = "GYAN";
        const accessToken = "f733445561d1c6d61df37944e82cd06a2a8ef32e";
        
        try {
          const response = await fetchModelRepositories(username, accessToken);
          
          if (response && response.model_repos) {
            // Transform the data to match your component's expected format
            const formattedRepos = response.model_repos.map(repo => {
              // Extract metrics from description or repo metadata if available
              const metrics = repo.description ? parseMetricsFromDescription(repo.description) : {
                accuracy: null,
                f1Score: null,
                latency: null
              };
              
              return {
                id: repo.id,
                name: repo.name,
                description: repo.description || "No description available",
                framework: repo.language || "Unknown", // Assuming language field could represent framework
                version: repo.default_branch || "main",
                size: formatSize(repo.size),
                stars: repo.stars_count,
                downloads: repo.forks_count, // Using forks as proxy for downloads
                lastUpdated: new Date(repo.updated_at).toISOString().split('T')[0],
                status: extractStatusFromRepo(repo),
                metrics: metrics
              };
            });
            
            setRepositories(formattedRepos);
          } else {
            // Fallback to sample data if response structure is unexpected
            console.log("Using sample repositories (unexpected API response)");
            setRepositories(sampleRepositories);
          }
        } catch (apiError) {
          // Fallback to sample data if API fails
          console.log("Using sample repositories (API error)");
          setRepositories(sampleRepositories);
        }
      } catch (err) {
        console.error("Error in repository fetch logic:", err);
        // Still fallback to sample data
        setRepositories(sampleRepositories);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRepositories();
  }, []);

  // Collect unique frameworks from repositories for filter options
  const uniqueFrameworks = [...new Set(repositories.map(repo => repo.framework).filter(Boolean))];

  // Filter repositories based on search term and framework
  const filteredRepos = repositories.filter(repo => {
    const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFramework = selectedFramework === 'all' || repo.framework === selectedFramework;
    return matchesSearch && matchesFramework;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Repositories</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and version your ML models</p>
          </div>
          <a 
            href="http://localhost:8080/repo/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block no-underline"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-light hover:bg-primary-dark text-white rounded-lg transition-colors duration-200 cursor-pointer">
              <Plus size={20} />
              <span>New Repository</span>
            </div>
          </a>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={selectedFramework}
                onChange={(e) => setSelectedFramework(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
              >
                <option value="all">All Frameworks</option>
                {uniqueFrameworks.map(framework => (
                  <option key={framework} value={framework}>{framework}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <Grid size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
              >
                <List size={20} className="text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Repositories Grid/List */}
      {filteredRepos.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">No repositories found matching your criteria.</p>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredRepos.map((repo) => (
            <div 
              key={repo.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleRepoClick(repo)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Code size={18} className="text-gray-500 dark:text-gray-400" />
                      {repo.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{repo.description}</p>
                  </div>
                  <button 
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent repository click event
                      // Menu options functionality
                    }}
                  >
                    <MoreVertical size={20} />
                  </button>
                </div>
                
                <div className="flex items-center gap-2 mt-4">
                  <FrameworkBadge framework={repo.framework} />
                  <StatusBadge status={repo.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <GitBranch size={14} />
                      Version
                    </span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.version}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                      <HardDrive size={14} />
                      Size
                    </span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.size}</p>
                  </div>
                  {repo.metrics.accuracy && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <BarChart2 size={14} />
                        Accuracy
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.metrics.accuracy}%</p>
                    </div>
                  )}
                  {repo.metrics.latency && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <Clock size={14} />
                        Latency
                      </span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.metrics.latency}</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{repo.stars}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Download size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{repo.downloads}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <GitCommit size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">1 commit</span>
                    </div>
                  </div>
                  <button 
                    className="flex items-center gap-1 text-primary-light hover:text-primary-dark"
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the card click
                      // Share functionality
                    }}
                  >
                    <Share2 size={16} />
                    <span className="text-sm">Share</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ModelRepositories;













// import { useState, useEffect } from 'react';
// import axios from 'axios';
// import { 
//   Plus, 
//   GitBranch,
//   Clock,
//   HardDrive,
//   Download,
//   BarChart2,
//   Search,
//   Filter,
//   ChevronDown,
//   Share2,
//   Star,
//   Grid,
//   List,
//   MoreVertical
// } from 'lucide-react';

// // API configuration
// const API_BASE_URL = 'http://10.155.1.170:8080'; // Update with your FastAPI URL

// // API service functions
// const fetchModelRepositories = async (username, accessToken) => {
//   try {
//     const response = await axios.post(`${API_BASE_URL}/fetch_model_repos`, {
//       username,
//       access_token: accessToken
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Error fetching repositories:', error);
//     throw error;
//   }
// };

// // Status Badge Component
// const StatusBadge = ({ status }) => {
//   const statusStyles = {
//     production: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
//     staging: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
//     development: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
//     // Default for unknown status
//     default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
//   };

//   const style = statusStyles[status] || statusStyles.default;
//   const displayStatus = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Unknown';

//   return (
//     <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
//       {displayStatus}
//     </span>
//   );
// };

// // Framework Badge Component
// const FrameworkBadge = ({ framework }) => {
//   const frameworkStyles = {
//     PyTorch: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
//     TensorFlow: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
//     JAX: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
//     // Default for unknown frameworks
//     default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
//   };

//   const style = frameworkStyles[framework] || frameworkStyles.default;

//   return (
//     <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
//       {framework || 'Unknown'}
//     </span>
//   );
// };

// const ModelRepositories = () => {
//   const [viewMode, setViewMode] = useState('grid');
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedFramework, setSelectedFramework] = useState('all');
//   const [repositories, setRepositories] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);
  
//   // Helper function to parse metrics from description (if stored there)
//   const parseMetricsFromDescription = (description) => {
//     // This is a placeholder - you'll need to implement based on your specific format
//     // Example: "Accuracy: 92.5%, F1: 0.89, Latency: 45ms"
//     try {
//       const accuracyMatch = description.match(/accuracy:?\s*(\d+\.?\d*)/i);
//       const f1Match = description.match(/f1(?:\s*score)?:?\s*(\d+\.?\d*)/i);
//       const latencyMatch = description.match(/latency:?\s*(\d+\.?\d*\s*m?s)/i);
      
//       return {
//         accuracy: accuracyMatch ? parseFloat(accuracyMatch[1]) : null,
//         f1Score: f1Match ? parseFloat(f1Match[1]) : null,
//         latency: latencyMatch ? latencyMatch[1] : null
//       };
//     } catch (e) {
//       console.error("Error parsing metrics:", e);
//       return { accuracy: null, f1Score: null, latency: null };
//     }
//   };
  
//   // Helper function to format repository size
//   const formatSize = (sizeInKB) => {
//     if (!sizeInKB) return "Unknown";
    
//     const sizeInMB = sizeInKB / 1024;
//     if (sizeInMB < 1) return `${sizeInKB} KB`;
    
//     const sizeInGB = sizeInMB / 1024;
//     if (sizeInGB < 1) return `${sizeInMB.toFixed(1)} MB`;
    
//     return `${sizeInGB.toFixed(1)} GB`;
//   };
  
//   // Helper to extract status from repository
//   const extractStatusFromRepo = (repo) => {
//     if (repo.topics && Array.isArray(repo.topics)) {
//       if (repo.topics.includes('production')) return 'production';
//       if (repo.topics.includes('staging')) return 'staging';
//       if (repo.topics.includes('development')) return 'development';
//     }
    
//     // Default status based on activity
//     const lastUpdated = new Date(repo.updated_at);
//     const now = new Date();
//     const daysSinceUpdate = Math.floor((now - lastUpdated) / (1000 * 60 * 60 * 24));
    
//     if (daysSinceUpdate <= 7) return 'development';
//     if (daysSinceUpdate <= 30) return 'staging';
//     return 'production';
//   };

//   // Collect unique frameworks from repositories for filter options
//   const uniqueFrameworks = [...new Set(repositories.map(repo => repo.framework).filter(Boolean))];

//   useEffect(() => {
//     const fetchRepositories = async () => {
//       try {
//         setLoading(true);
//         const username = "GYAN";
//         const accessToken = "f733445561d1c6d61df37944e82cd06a2a8ef32e";
        
//         const response = await fetchModelRepositories(username, accessToken);
        
//         if (response && response.model_repos) {
//           // Transform the data to match your component's expected format
//           const formattedRepos = response.model_repos.map(repo => {
//             // Extract metrics from description or repo metadata if available
//             const metrics = repo.description ? parseMetricsFromDescription(repo.description) : {
//               accuracy: null,
//               f1Score: null,
//               latency: null
//             };
            
//             return {
//               id: repo.id,
//               name: repo.name,
//               description: repo.description || "No description available",
//               framework: repo.language || "Unknown", // Assuming language field could represent framework
//               version: repo.default_branch || "main",
//               size: formatSize(repo.size),
//               stars: repo.stars_count,
//               downloads: repo.forks_count, // Using forks as proxy for downloads
//               lastUpdated: new Date(repo.updated_at).toISOString().split('T')[0],
//               status: extractStatusFromRepo(repo),
//               metrics: metrics
//             };
//           });
          
//           setRepositories(formattedRepos);
//         }
//       } catch (err) {
//         console.error("Error fetching repositories:", err);
//         setError("Failed to load repositories. Please try again later.");
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchRepositories();
//   }, []);

//   // Filter repositories based on search term and framework
//   const filteredRepos = repositories.filter(repo => {
//     const matchesSearch = repo.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          (repo.description && repo.description.toLowerCase().includes(searchTerm.toLowerCase()));
//     const matchesFramework = selectedFramework === 'all' || repo.framework === selectedFramework;
//     return matchesSearch && matchesFramework;
//   });

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center h-64">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
//       </div>
//     );
//   }

//   if (error) {
//     return (
//       <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
//         <p>{error}</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Model Repositories</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and version your ML models</p>
//           </div>
//           <button 
//             className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//           >
//             <Plus size={20} />
//             New Repository
//           </button>
//         </div>
//       </div>

//       {/* Filters and Search */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex flex-col md:flex-row gap-4 justify-between">
//           <div className="relative flex-1">
//             <input
//               type="text"
//               placeholder="Search repositories..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//             />
//             <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//           </div>
//           <div className="flex gap-4">
//             <div className="relative">
//               <select
//                 value={selectedFramework}
//                 onChange={(e) => setSelectedFramework(e.target.value)}
//                 className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//               >
//                 <option value="all">All Frameworks</option>
//                 {uniqueFrameworks.map(framework => (
//                   <option key={framework} value={framework}>{framework}</option>
//                 ))}
//               </select>
//               <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
//             </div>
//             <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-lg">
//               <button
//                 onClick={() => setViewMode('grid')}
//                 className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
//               >
//                 <Grid size={20} className="text-gray-500" />
//               </button>
//               <button
//                 onClick={() => setViewMode('list')}
//                 className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : ''}`}
//               >
//                 <List size={20} className="text-gray-500" />
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Repositories Grid/List */}
//       {filteredRepos.length === 0 ? (
//         <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//           <p className="text-gray-500 dark:text-gray-400">No repositories found matching your criteria.</p>
//         </div>
//       ) : (
//         <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
//           {filteredRepos.map((repo) => (
//             <div key={repo.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200">
//               <div className="p-6">
//                 <div className="flex justify-between items-start">
//                   <div className="flex-1">
//                     <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{repo.name}</h3>
//                     <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{repo.description}</p>
//                   </div>
//                   <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
//                     <MoreVertical size={20} />
//                   </button>
//                 </div>
                
//                 <div className="flex items-center gap-2 mt-4">
//                   <FrameworkBadge framework={repo.framework} />
//                   <StatusBadge status={repo.status} />
//                 </div>

//                 <div className="grid grid-cols-2 gap-4 mt-4">
//                   <div>
//                     <span className="text-sm text-gray-500 dark:text-gray-400">Version</span>
//                     <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.version}</p>
//                   </div>
//                   <div>
//                     <span className="text-sm text-gray-500 dark:text-gray-400">Size</span>
//                     <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.size}</p>
//                   </div>
//                   {repo.metrics.accuracy && (
//                     <div>
//                       <span className="text-sm text-gray-500 dark:text-gray-400">Accuracy</span>
//                       <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.metrics.accuracy}%</p>
//                     </div>
//                   )}
//                   {repo.metrics.latency && (
//                     <div>
//                       <span className="text-sm text-gray-500 dark:text-gray-400">Latency</span>
//                       <p className="text-sm font-medium text-gray-900 dark:text-white">{repo.metrics.latency}</p>
//                     </div>
//                   )}
//                 </div>

//                 <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
//                   <div className="flex items-center gap-4">
//                     <div className="flex items-center gap-1">
//                       <Star size={16} className="text-gray-400" />
//                       <span className="text-sm text-gray-500 dark:text-gray-400">{repo.stars}</span>
//                     </div>
//                     <div className="flex items-center gap-1">
//                       <Download size={16} className="text-gray-400" />
//                       <span className="text-sm text-gray-500 dark:text-gray-400">{repo.downloads}</span>
//                     </div>
//                   </div>
//                   <button className="flex items-center gap-1 text-primary-light hover:text-primary-dark">
//                     <Share2 size={16} />
//                     <span className="text-sm">Share</span>
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//     </div>
//   );
// };

// export default ModelRepositories;