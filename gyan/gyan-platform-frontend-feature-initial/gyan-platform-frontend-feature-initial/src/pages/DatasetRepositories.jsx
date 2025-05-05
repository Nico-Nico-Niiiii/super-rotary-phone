


import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Plus, 
  Database,
  FileText,
  BarChart2,
  Search,
  ChevronDown,
  Share2,
  Star,
  Grid,
  List,
  MoreVertical,
  Globe,
  Tag,
  Clock,
  Download
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';

// API configuration
const API_BASE_URL = import.meta.env.VITE_APP_API_URL; // Update with your FastAPI URL
const GYANHUB_URL = 'http://localhost:8080'; // Your Gyanhub dashboard URL

// API service functions
const fetchDatasetRepositories = async (username, accessToken) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/gyanhub/fetch_data_repo`, {
      username,
      access_token: accessToken
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching dataset repositories:', error);
    throw error;
  }
};

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    public: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    private: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    archived: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
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

// Type Badge Component
const TypeBadge = ({ type }) => {
  const typeStyles = {
    Text: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    Image: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    "Time Series": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    Tabular: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    Audio: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
    Video: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200",
    // Default for unknown types
    default: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  };

  const style = typeStyles[type] || typeStyles.default;

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${style}`}>
      {type || 'Unknown'}
    </span>
  );
};

const DatasetRepositories = () => {
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [datasets, setDatasets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to parse metrics from description (if stored there)
  const parseMetricsFromDescription = (description) => {
    try {
      if (!description) return { quality: null, completeness: null, balance: null };
      
      const qualityMatch = description.match(/quality:?\s*(\d+\.?\d*)/i);
      const completenessMatch = description.match(/completeness:?\s*(\d+\.?\d*)/i);
      const balanceMatch = description.match(/balance:?\s*(\d+\.?\d*)/i);
      
      return {
        quality: qualityMatch ? parseFloat(qualityMatch[1]) : null,
        completeness: completenessMatch ? parseFloat(completenessMatch[1]) : null,
        balance: balanceMatch ? balanceMatch[1] : null
      };
    } catch (e) {
      console.error("Error parsing metrics:", e);
      return { quality: null, completeness: null, balance: null };
    }
  };

  // Helper function to extract data type from repository
  const extractDataTypeFromRepo = (repo) => {
    if (repo.topics && Array.isArray(repo.topics)) {
      // Check for data type in topics
      const dataTypes = ['Text', 'Image', 'Time Series', 'Tabular', 'Audio', 'Video'];
      for (const type of dataTypes) {
        if (repo.topics.includes(type.toLowerCase())) {
          return type;
        }
      }
    }
    
    // Try to infer from description
    if (repo.description) {
      const description = repo.description.toLowerCase();
      if (description.includes('text') || description.includes('nlp')) return 'Text';
      if (description.includes('image') || description.includes('vision')) return 'Image';
      if (description.includes('time series') || description.includes('temporal')) return 'Time Series';
      if (description.includes('tabular') || description.includes('table')) return 'Tabular';
      if (description.includes('audio') || description.includes('sound')) return 'Audio';
      if (description.includes('video')) return 'Video';
    }
    
    return 'Unknown';
  };

  // Helper function to extract status from repository
  const extractStatusFromRepo = (repo) => {
    // First check if repo is actually private according to Gitea
    if (repo.private) return 'private';
    
    // Then check in topics if available
    if (repo.topics && Array.isArray(repo.topics)) {
      if (repo.topics.includes('public')) return 'public';
      if (repo.topics.includes('private')) return 'private';
      if (repo.topics.includes('archived')) return 'archived';
    }
    
    // Default to public if not specified and repo is not private
    return 'public';
  };

  // Helper function to extract format from repo
  const extractFormatFromRepo = (repo) => {
    if (repo.topics && Array.isArray(repo.topics)) {
      const possibleFormats = ['CSV', 'JSON', 'Parquet', 'PNG', 'JPEG', 'WAV', 'MP3', 'MP4'];
      for (const format of possibleFormats) {
        if (repo.topics.includes(format.toLowerCase())) {
          return format;
        }
      }
    }
    
    return 'Unknown';
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

  // Helper function to get repository URL
  const getRepoUrl = (dataset) => {
    return `${GYANHUB_URL}/GYAN/${dataset.name}`;
  };

  // Extract unique types from dataset for filter options
  const uniqueTypes = [...new Set(datasets.map(dataset => dataset.type).filter(Boolean))];

  // Navigation handler for repository click
  const handleRepoClick = (dataset) => {
    window.location.href = getRepoUrl(dataset);
  };

  useEffect(() => {
    const fetchDatasets = async () => {
      try {
        setLoading(true);
        const username = "GYAN";
        const accessToken = "f733445561d1c6d61df37944e82cd06a2a8ef32e";
        
        const response = await fetchDatasetRepositories(username, accessToken);
        
        if (response && response.dataset_repos) {
          if (response.dataset_repos.length === 0) {
            // Handle empty response case
            setDatasets([]);
            setLoading(false);
            return;
          }
          
          // Transform the data to match your component's expected format
          const formattedDatasets = response.dataset_repos.map(repo => {
            // Extract metrics from description or repo metadata if available
            const metrics = repo.description ? parseMetricsFromDescription(repo.description) : {
              quality: null,
              completeness: null,
              balance: null
            };
            
            // Estimate samples count if not provided directly
            // This is just a placeholder - you might want to extract real sample count
            const estimatedSamples = repo.size ? `${Math.round(repo.size / 10)}K` : 'Unknown';
            
            return {
              id: repo.id,
              name: repo.name,
              description: repo.description || "No description available",
              type: extractDataTypeFromRepo(repo),
              format: extractFormatFromRepo(repo),
              version: repo.default_branch || "main",
              size: formatSize(repo.size),
              samples: estimatedSamples,
              stars: repo.stars_count,
              downloads: repo.forks_count, // Using forks as proxy for downloads
              lastUpdated: new Date(repo.updated_at).toISOString().split('T')[0],
              status: extractStatusFromRepo(repo),
              metrics: metrics
            };
          });
          
          setDatasets(formattedDatasets);
        } else {
          // Handle case when response structure is not as expected
          setDatasets([]);
        }
      } catch (err) {
        console.error("Error fetching dataset repositories:", err);
        setError("Failed to load dataset repositories. Please try again later.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchDatasets();
  }, []);

  // Filter datasets based on search term and type
  const filteredDatasets = datasets.filter(dataset => {
    const matchesSearch = dataset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (dataset.description && dataset.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === 'all' || dataset.type === selectedType;
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dataset Repositories</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and version your training datasets</p>
          </div>
          <a 
            href="http://localhost:8080/data/create" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block no-underline"
          >
            <div className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 cursor-pointer">
              <Plus size={20} />
              <span>New Dataset</span>
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
              placeholder="Search datasets..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
            />
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          </div>
          <div className="flex gap-4">
            <div className="relative">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
              >
                <option value="all">All Types</option>
                {uniqueTypes.map(type => (
                  <option key={type} value={type}>{type}</option>
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

      {/* Datasets Grid/List */}
      {filteredDatasets.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <p className="text-gray-500 dark:text-gray-400">
            {searchTerm || selectedType !== 'all' 
              ? "No datasets found matching your criteria." 
              : "No dataset repositories available. Create your first dataset repository to get started."}
          </p>
        </div>
      ) : (
        <div className={`grid ${viewMode === 'grid' ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'} gap-6`}>
          {filteredDatasets.map((dataset) => (
            <div 
              key={dataset.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
              onClick={() => handleRepoClick(dataset)}
            >
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{dataset.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{dataset.description}</p>
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
                  <TypeBadge type={dataset.type} />
                  <StatusBadge status={dataset.status} />
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Samples</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{dataset.samples}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">Size</span>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{dataset.size}</p>
                  </div>
                  {dataset.metrics.quality && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Quality</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{dataset.metrics.quality}%</p>
                    </div>
                  )}
                  {dataset.metrics.completeness && (
                    <div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">Completeness</span>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{dataset.metrics.completeness}%</p>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Star size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">{dataset.stars}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={16} className="text-gray-400" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {dataset.lastUpdated}
                      </span>
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

export default DatasetRepositories;