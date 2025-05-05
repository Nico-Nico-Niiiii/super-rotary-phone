import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  Code, 
  GitBranch, 
  GitCommit, 
  Tag, 
  FileText, 
  Database,
  ChevronDown,
  Download,
  FileCode,
  ArrowUp,
  Folder,
  File,
  AlertCircle,
} from 'lucide-react';

import { useTheme } from '../context/ThemeContext';
import axios from 'axios'; // Make sure axios is installed

const ModelRepositoryView = () => {
  // We can use either route param approach depending on your actual route setup
  const params = useParams();
  const owner = params.owner || "GYAN"; // Default to GYAN if not specified
  const repo = params.repo || params.id; // Try to use repo param, fall back to id
  
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const [repoContents, setRepoContents] = useState([]);
  const [repoInfo, setRepoInfo] = useState(null);
  const [readmeContent, setReadmeContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('code');
  const [activeBranch, setActiveBranch] = useState('main');
  const [currentPath, setCurrentPath] = useState('');
  const [pathHistory, setPathHistory] = useState([]);

  // Base API URL for your Gitea instance - adjust this according to your setup
  // This should be the base URL to your API without trailing slash
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL;

  console.log("Current params:", { owner, repo, currentPath });

  useEffect(() => {
    const fetchRepositoryContents = async () => {
      if (!repo) {
        setError("Repository name is required");
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        console.log(`Fetching repo contents for ${owner}/${repo}${currentPath ? `/${currentPath}` : ''}`);
        
        // Directly fetch contents - simplify the initial approach
        const contentsEndpoint = `${API_BASE_URL}/repos/${owner}/${repo}/contents${currentPath ? `/${currentPath}` : ''}`;
        console.log("Calling API endpoint:", contentsEndpoint);
        
        const contentsResponse = await axios.get(contentsEndpoint);
        console.log("API Response:", contentsResponse);
        
        if (contentsResponse.data) {
          setRepoContents(Array.isArray(contentsResponse.data) ? contentsResponse.data : [contentsResponse.data]);
          setLoading(false);
        } else {
          throw new Error("No data returned from API");
        }
        
        // Fetch basic repo info as well if we don't have it yet
        if (!repoInfo) {
          try {
            const repoResponse = await axios.get(`${API_BASE_URL}/repos/${owner}/${repo}`);
            console.log("Repo info response:", repoResponse);
            setRepoInfo(repoResponse.data);
          } catch (repoError) {
            console.error("Error fetching repo info:", repoError);
            // Continue anyway since we have the contents
          }
        }
        
        // Look for README in the current contents
        const readmeFile = contentsResponse.data.find(
          file => file.name.toLowerCase() === 'readme.md' || file.name.toLowerCase() === 'readme'
        );
        
        if (readmeFile) {
          try {
            const readmeResponse = await axios.get(readmeFile.download_url);
            setReadmeContent(readmeResponse.data);
          } catch (readmeError) {
            console.error("Error fetching README:", readmeError);
          }
        }
        
      } catch (error) {
        console.error("Error fetching repository data:", error);
        setError(`Error: ${error.message || "Failed to fetch repository data"}`);
        setLoading(false);
      }
    };
    
    fetchRepositoryContents();
  }, [owner, repo, currentPath]);
  
  // Function to handle directory navigation
  const handleFileNavigation = async (file) => {
    if (file.type === 'dir') {
      // Add current path to history
      setPathHistory([...pathHistory, currentPath]);
      
      // Calculate new path
      const newPath = currentPath ? `${currentPath}/${file.name}` : file.name;
      setCurrentPath(newPath);
    } else if (file.type === 'file') {
      // Handle file viewing
      if (file.download_url) {
        window.open(file.download_url, '_blank');
      } else {
        console.error("No download URL available for file", file);
      }
    }
  };
  
  // Function to navigate back up the directory tree
  const navigateUp = () => {
    if (pathHistory.length > 0) {
      const previousPath = pathHistory[pathHistory.length - 1];
      setCurrentPath(previousPath);
      setPathHistory(pathHistory.slice(0, -1));
    } else {
      setCurrentPath('');
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-light"></div>
        <p className="ml-4 text-gray-600 dark:text-gray-400">Loading repository content...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex items-center text-red-600 mb-4">
          <AlertCircle size={24} className="mr-2"/>
          <h2 className="text-xl font-bold">Error Loading Repository</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg overflow-auto mb-4">
          <p className="font-mono text-sm">Repository: {owner}/{repo}</p>
          <p className="font-mono text-sm">Current Path: {currentPath || "/"}</p>
          <p className="font-mono text-sm">API Endpoint: {`${API_BASE_URL}/repos/${owner}/${repo}/contents${currentPath ? `/${currentPath}` : ''}`}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/dashboard/model-repositories')}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors duration-200"
          >
            Back to Repositories
          </button>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Repository Header */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Code size={24} className="text-gray-600 dark:text-gray-400" />
              {owner}/{repo || "Repository"}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {repoInfo?.description || 'Repository details'}
            </p>
            
            <div className="flex items-center gap-4 mt-4">
              {repoInfo?.language && (
                <div className="bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full">
                  <span className="text-gray-600 dark:text-gray-400 text-sm font-semibold">
                    {repoInfo.language}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Repository Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="flex flex-wrap border-b border-gray-200 dark:border-gray-700">
          <button 
            className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 ${
              activeTab === 'code' 
                ? 'border-primary-light text-primary-light' 
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
            onClick={() => setActiveTab('code')}
          >
            <Code size={16} />
            <span>Code</span>
          </button>
          {readmeContent && (
            <button 
              className={`flex items-center gap-1 px-4 py-3 text-sm font-medium border-b-2 ${
                activeTab === 'wiki' 
                  ? 'border-primary-light text-primary-light' 
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
              onClick={() => setActiveTab('wiki')}
            >
              <FileText size={16} />
              <span>README</span>
            </button>
          )}
        </div>
        
        {/* Code Tab Content */}
        {activeTab === 'code' && (
          <div className="p-6">
            {/* Current Path Display and Navigation Controls */}
            <div className="flex flex-col md:flex-row gap-4 justify-between mb-6">
              <div className="flex gap-2 items-center">
                <button 
                  onClick={navigateUp}
                  disabled={!currentPath}
                  className={`px-3 py-1.5 rounded-lg transition-colors ${
                    currentPath 
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600' 
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed'
                  }`}
                >
                  <span>..</span>
                </button>
                <div className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                  /{currentPath}
                </div>
              </div>
              <div className="flex gap-2">
                <button className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors">
                  <ArrowUp size={16} />
                  <span>Clone</span>
                  <ChevronDown size={16} />
                </button>
                <button className="flex items-center gap-1 px-3 py-1.5 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-800 transition-colors">
                  <Download size={16} />
                  <span>Download</span>
                  <ChevronDown size={16} />
                </button>
              </div>
            </div>
            
            {/* Files Table */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Size
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {repoContents.length > 0 ? (
                    repoContents.map((file, index) => (
                      <tr 
                        key={index}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        onClick={() => handleFileNavigation(file)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            {file.type === 'dir' ? (
                              <Folder size={16} className="text-blue-500 mr-2" />
                            ) : (
                              <File size={16} className="text-gray-500 dark:text-gray-400 mr-2" />
                            )}
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {file.name}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {file.size !== undefined ? formatFileSize(file.size) : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            {file.type || "Unknown"}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="3" className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                        No files found in this directory
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            
            {/* README Content - only show if readme exists and we're in the root directory */}
            {readmeContent && !currentPath && (
              <div className="mt-8 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                <div className="bg-gray-50 dark:bg-gray-700 px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">README.md</h3>
                </div>
                <div className="p-4 bg-white dark:bg-gray-800 prose dark:prose-invert max-w-none">
                  <div dangerouslySetInnerHTML={{ __html: formatMarkdown(readmeContent) }} />
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* README Tab Content */}
        {activeTab === 'wiki' && (
          <div className="p-6">
            {readmeContent ? (
              <div className="prose dark:prose-invert max-w-none">
                <div dangerouslySetInnerHTML={{ __html: formatMarkdown(readmeContent) }} />
              </div>
            ) : (
              <div className="text-center text-gray-500 dark:text-gray-400">
                <p>No README file found in this repository.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format file size
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Simple markdown formatter (in a real app, you'd use a proper markdown library)
const formatMarkdown = (markdown) => {
  if (!markdown) return '';
  
  // Basic formatting: headers, bold, code blocks, links, etc.
  let html = markdown
    // Code blocks
    .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
    // Headers
    .replace(/^# (.*$)/gm, '<h1>$1</h1>')
    .replace(/^## (.*$)/gm, '<h2>$1</h2>')
    .replace(/^### (.*$)/gm, '<h3>$1</h3>')
    // Bold
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-blue-500 hover:underline">$1</a>')
    // Lists
    .replace(/^\s*\*\s(.*$)/gm, '<li>$1</li>')
    // Tables
    .replace(/\|([^|]*)\|/g, '<td>$1</td>')
    .replace(/<td>(.*?)<\/td>/g, (match) => {
      return match.replace(/\s+/g, ' ');
    })
    .replace(/^(.*?)<td>/gm, '<tr><td>')
    .replace(/<\/td>(.*?)$/gm, '</td></tr>')
    // Paragraphs
    .replace(/\n\n/g, '</p><p>');
  
  // Wrap in paragraph if not already
  if (!html.startsWith('<')) {
    html = '<p>' + html + '</p>';
  }
  
  // Handle tables
  html = html.replace(/<tr>(<td>.*?<\/td>)<\/tr>/g, (match, p1) => {
    // Check if this looks like a table header
    if (p1.includes('--')) {
      return ''; // Skip separator rows
    }
    
    if (p1.includes('-')) {
      // Likely a header row
      return '<tr>' + p1.replace(/<td>/g, '<th>').replace(/<\/td>/g, '</th>') + '</tr>';
    }
    
    return match;
  });
  
  // Wrap tables
  html = html.replace(/<tr>.*?<\/tr>/gs, (match) => {
    if (!match.startsWith('<table>')) {
      return '<table class="min-w-full border-collapse my-4">' + match + '</table>';
    }
    return match;
  });
  
  return html;
};

// Helper function to fetch repository data - mock implementation for testing
const fetchRepositoryById = async (id) => {
  // This is a mock function that you should replace with actual API calls
  console.log("Fetching repository with ID:", id);
  
  // Return mock data for testing
  return {
    data: {
      id: parseInt(id),
      name: "Llama-2-7b",
      description: "Test repository for development",
      owner: { login: "GYAN" },
      default_branch: "main",
    }
  };
};

export default ModelRepositoryView;