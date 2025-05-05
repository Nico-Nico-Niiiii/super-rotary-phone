import { useState, useEffect } from 'react';
import { 
  Plus, 
  MessageSquare,
  Clock,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  ChevronDown,
  Eye,
  EyeOff,
  AlertCircle,
  Trash2,
  Edit
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';

const BASE_URL = import.meta.env.VITE_APP_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Status Badge Component
const StatusBadge = ({ status }) => {
  const statusStyles = {
    resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

// Priority Badge Component
const PriorityBadge = ({ priority }) => {
  const priorityStyles = {
    high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    medium: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
    low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityStyles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
};

// Visibility Badge Component
const VisibilityBadge = ({ visibility }) => {
  const visibilityStyles = {
    public: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
    private: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
  };

  return (
    <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${visibilityStyles[visibility]}`}>
      {visibility === 'public' ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
      {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
    </span>
  );
};

const RaiseQuery = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  
  // Form states
  const [isNewQueryModalOpen, setIsNewQueryModalOpen] = useState(false);
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState(false);
  const [isResolveQueryModalOpen, setIsResolveQueryModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [visibility, setVisibility] = useState('private');
  const [status, setStatus] = useState('pending');
  const [resolution, setResolution] = useState('');
  const [formError, setFormError] = useState('');
  const [currentEditingQuery, setCurrentEditingQuery] = useState(null);
  
  // Query states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedTab, setSelectedTab] = useState('my'); // 'my' or 'public'
  const [myQueries, setMyQueries] = useState([]);
  const [publicQueries, setPublicQueries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);

  // Categories from backend
  const categories = ["Training", "Pipeline", "Deployment", "Other"];
  const statuses = ["pending", "in-progress", "resolved"];


  useEffect(() => {
    if (token) {
      // Add a request interceptor to include the token on every request
      const interceptor = api.interceptors.request.use(
        (config) => {
          config.headers.Authorization = `Bearer ${token}`;
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      // Clean up the interceptor when the component unmounts or token changes
      return () => {
        api.interceptors.request.eject(interceptor);
      };
    }
  }, [token]);

  // Fetch queries on component mount and when dependencies change
  // useEffect(() => {
  //   if (user && token) {
  //     fetchQueries();
  //   }
  // }, [user, token, selectedTab, selectedCategory, selectedStatus]);

  useEffect(() => {

      fetchQueries();
    
  }, [ selectedTab, selectedCategory, selectedStatus]);


  useEffect(() => {
    // Fetch immediately
    fetchQueries();
  
    // Set an interval to fetch data every 10 seconds
    const interval = setInterval(() => {
      fetchQueries();
    }, 10000);
  
    // Cleanup interval when component unmounts or dependencies change
    return () => clearInterval(interval);
  }, []);

  const fetchQueries = async () => {
    setLoading(true);
    try {
      let response;
      
      // Fetch my queries or public queries based on selected tab
      if (selectedTab === 'my') {
        if (selectedStatus !== 'all') {
          response = await api.get(`/api/queries/status/${selectedStatus}`);
        } else if (selectedCategory !== 'all') {
          response = await api.get(`/api/queries/category/${selectedCategory}`);
        } else {
          response = await api.get('/api/queries/my/');
        }
        setMyQueries(response.data);
      } else {
        if (selectedCategory !== 'all') {
          response = await api.get(`/api/queries/category/${selectedCategory}`, {
            params: { visibility: 'public' }
          });
        } else {
          response = await api.get('/api/queries/public/');
        }
        setPublicQueries(response.data);
      }
    } catch (error) {
      console.error('Error fetching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter queries based on search term
  const filteredQueries = (selectedTab === 'my' ? myQueries : publicQueries).filter(query => {
    const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         query.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Create a new query
  // const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setFormError('');

  //   if (!title || !description || !category) {
  //     setFormError('Please fill all required fields');
  //     return;
  //   }

  //   try {
  //     await api.post('/api/queries/', {
  //       title,
  //       description,
  //       category,
  //       priority,
  //       visibility
  //     });

  //     // Reset form and close modal
  //     resetForm();
  //     setIsNewQueryModalOpen(false);
      
  //     // Refetch queries to update the list
  //     fetchQueries();
  //   } catch (error) {
  //     console.error('Error creating query:', error);
  //     const errorMessage = error.response?.data?.detail || 'Failed to create query';
  //     setFormError(errorMessage);
  //   }
  // };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // More comprehensive validation
    const errors = [];
    if (!title?.trim()) errors.push('Title is required');
    if (!description?.trim()) errors.push('Description is required');
    if (!category?.trim()) errors.push('Category is required');

    if (errors.length > 0) {
      setFormError(errors.join(', '));
      return;
    }

    try {
      const queryData = {
        title,
        description,
        category,
        status: (status || 'IN_PROGRESS'),
        priority: (priority || 'MEDIUM'),
        visibility: (visibility || 'PRIVATE'),
      };

      const response = await api.post('/api/queries/', queryData);
      
      // Reset form and close modal
      resetForm();
      setIsNewQueryModalOpen(false);
      
      // Optionally pass the new query to parent component
      onQueryCreated?.(response.data);
      
      // Refetch queries to update the list
      fetchQueries();
    } catch (error) {
      console.error('Error creating query:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to create query';
      setFormError(errorMessage);
    }
  };

 
  // Update an existing query
  const handleUpdate = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title || !description || !category) {
      setFormError('Please fill all required fields');
      return;
    }

    try {
      await api.put(`/api/queries/${currentEditingQuery.id}`, {
        title,
        description,
        category,
        priority,
        visibility,
        status
      });

      // Reset form and close modal
      resetForm();
      setIsEditQueryModalOpen(false);
      setCurrentEditingQuery(null);
      
      // Refetch queries to update the list
      fetchQueries();
    } catch (error) {
      console.error('Error updating query:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to update query';
      setFormError(errorMessage);
    }
  };

  // Resolve a query
  const handleResolve = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!resolution) {
      setFormError('Please provide a resolution');
      return;
    }

   

    try {
      await api.put(`/api/queries/${currentEditingQuery.id}/resolve/?resolution=${encodeURIComponent(resolution)}`);

      // Reset form and close modal
      setResolution('');
      setIsResolveQueryModalOpen(false);
      setCurrentEditingQuery(null);
      
      // Refetch queries to update the list
      fetchQueries();
    } catch (error) {
      console.error('Error resolving query:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to resolve query';
      setFormError(errorMessage);
    }
  };

  // Delete a query
  const handleDelete = async (queryId) => {
    try {
      await api.delete(`/api/queries/${queryId}`);
      
      // Refetch queries to update the list
      fetchQueries();
      setDeleteConfirmation(null);
    } catch (error) {
      console.error('Error deleting query:', error);
    }
  };

  // Toggle visibility of a query
  const toggleVisibility = async (queryId, currentVisibility) => {
    try {
      const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
      
      await api.put(`/api/queries/${queryId}`, {
        visibility: newVisibility
      });

      // Update queries in state to reflect the change
      if (selectedTab === 'my') {
        setMyQueries(prevQueries => 
          prevQueries.map(query => 
            query.id === queryId ? { ...query, visibility: newVisibility } : query
          )
        );
      }
      
      // If making private and in public view, remove from public list
      if (newVisibility === 'private' && selectedTab === 'public') {
        setPublicQueries(prevQueries => 
          prevQueries.filter(query => query.id !== queryId)
        );
      }
    } catch (error) {
      console.error('Error updating query visibility:', error);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('');
    setPriority('medium');
    setVisibility('private');
    setStatus('pending');
    setFormError('');
  };

  // Set form fields for editing
  const setupEditForm = (query) => {
    setTitle(query.title);
    setDescription(query.description);
    setCategory(query.category);
    setPriority(query.priority);
    setVisibility(query.visibility);
    setStatus(query.status);
    setCurrentEditingQuery(query);
    setIsEditQueryModalOpen(true);
  };

  // Set up form for resolving
  const setupResolveForm = (query) => {
    setResolution('');
    setCurrentEditingQuery(query);
    setIsResolveQueryModalOpen(true);
  };

  // Handle search with backend
  const handleSearch = async () => {
    if (searchTerm.trim().length === 0) {
      fetchQueries();
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.get('/api/queries/search/', {
        params: {
          search_term: searchTerm,
          category: selectedCategory !== 'all' ? selectedCategory : undefined
        }
      });
      
      if (selectedTab === 'my') {
        setMyQueries(response.data.filter(query => query.user_email === user.email));
      } else {
        setPublicQueries(response.data.filter(query => query.visibility === 'public'));
      }
    } catch (error) {
      console.error('Error searching queries:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Support Queries</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your support requests</p>
          </div>
          <button 
            onClick={() => {
              resetForm();
              setIsNewQueryModalOpen(true);
            }}
          className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            <Plus size={20} />
            New Query
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      {/* <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            className={`py-2 px-4 font-medium ${
              selectedTab === 'my'
                ? 'text-primary-light border-b-2 border-primary-light dark:text-blue-400 dark:border-blue-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
            onClick={() => setSelectedTab('my')}
          >
            My Queries
          </button>
          <button
           className={`py-2 px-4 font-medium ${
            selectedTab === 'public'
              ? 'text-primary-light border-b-2 border-primary-light dark:text-blue-400 dark:border-blue-400'
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }`}
            onClick={() => setSelectedTab('public')}
          >
            Public Queries
          </button>
        </div>
      </div> */}

<div className="flex border-b border-gray-200 dark:border-gray-700">
  <button
    className={`py-2 px-4 font-medium ${
      selectedTab === 'my'
        ? 'text-primary-light border-b-2 border-primary-light dark:text-blue-400 dark:border-blue-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`}
    onClick={() => setSelectedTab('my')}
  >
    My Queries
  </button>
  <button
    className={`py-2 px-4 font-medium ${
      selectedTab === 'public'
        ? 'text-primary-light border-b-2 border-primary-light dark:text-blue-400 dark:border-blue-400'
        : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
    }`}
    onClick={() => setSelectedTab('public')}
  >
    Public Queries
  </button>
</div>

      {/* Filters and Search */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-4 justify-between">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search queries..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
            />
            <Search 
              className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 cursor-pointer" 
              onClick={handleSearch}
            />
          </div>
          <div className="flex gap-4 flex-wrap">
            <div className="relative">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
              >
                <option value="all">All Categories</option>
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
            
            {selectedTab === 'my' && (
              <div className="relative">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  // className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                  className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:text-white"
                  
                >
                  <option value="all">All Statuses</option>
                  {statuses.map(status => (
                    <option key={status} value={status}>{status.charAt(0).toUpperCase() + status.slice(1)}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Queries List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-light border-r-transparent"></div>
            <p className="mt-4 text-gray-500 dark:text-gray-400">Loading queries...</p>
          </div>
        ) : filteredQueries.length === 0 ? (
          <div className="p-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'No queries match your search criteria'
                : 'No queries available. Create your first query!'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b dark:border-gray-700">
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Query Details
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Priority
                  </th>
                  {selectedTab === 'my' && (
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                      Visibility
                    </th>
                  )}
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredQueries.map((query) => (
                  <tr 
                    key={query.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  >
                    <td className="px-6 py-4 cursor-pointer" onClick={() => navigate(`/queries/${query.id}`)}>
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                          {query.title}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                          {query.description}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-900 dark:text-white">
                        {query.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={query.status} />
                    </td>
                    <td className="px-6 py-4">
                      <PriorityBadge priority={query.priority} />
                    </td>
                    {selectedTab === 'my' && (
                      <td className="px-6 py-4">
                        <VisibilityBadge visibility={query.visibility} />
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                      {new Date(query.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {selectedTab === 'my' && (
                          <>
                            <button
                              onClick={() => setupEditForm(query)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600">
                              <Edit size={18} />
                            </button>
                            
                            {query.status !== 'resolved' && (
                              <button
                                onClick={() => setupResolveForm(query)}
                               className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300 p-1 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600"
                              >
                                <CheckCircle size={18} />
                              </button>
                            )}
                            
                            <button
                              onClick={() => toggleVisibility(query.id, query.visibility)}
                             className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-1 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              {query.visibility === 'public' ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                            
                            <button
                              onClick={() => setDeleteConfirmation(query.id)}
                             className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                        
                        <button
                          onClick={() => navigate(`/dashboard/queries/${query.id}`)}
                          className="text-primary-light hover:text-primary-dark p-1 rounded-full dark:bg-gray-700 dark:hover:bg-gray-600"
                        >
                          <MessageSquare size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Query Modal */}
      {isNewQueryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Query</h3>
              <button 
                onClick={() => {setIsNewQueryModalOpen(false)
                  setFormError('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle size={24} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                    placeholder="Enter query title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light h-32"
                    placeholder="Describe your query in detail"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    id="category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visibility
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="visibility-private"
                        name="visibility"
                        value="private"
                        checked={visibility === 'private'}
                        onChange={() => setVisibility('private')}
                        className="h-4 w-4 text-primary-light focus:ring-primary-light"
                      />
                      <label htmlFor="visibility-private" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <EyeOff className="h-4 w-4 mr-1" />
                        Private (Only visible to you)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="visibility-public"
                        name="visibility"
                        value="public"
                        checked={visibility === 'public'}
                        onChange={() => setVisibility('public')}
                        className="h-4 w-4 text-primary-light focus:ring-primary-light"
                      />
                      <label htmlFor="visibility-public" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        Public (Visible to everyone)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {setIsNewQueryModalOpen(false)
                    setFormError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
                >
                  Create Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Query Modal */}
      {isEditQueryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Query</h3>
              <button 
                onClick={() => {setIsEditQueryModalOpen(false)
                  setFormError('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle size={24} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                    placeholder="Enter query title"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description *
                  </label>
                  <textarea
                    id="edit-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light h-32"
                    placeholder="Describe your query in detail"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Category *
                  </label>
                  <select
                    id="edit-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                    required
                  >
                    <option value="">Select a category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority
                  </label>
                  <select
                    id="edit-priority"
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH"></option>
                  </select>
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
                  >
                    {statuses.map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Visibility
                  </label>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="edit-visibility-private"
                        name="visibility"
                        value="private"
                        checked={visibility === 'private'}
                        onChange={() => setVisibility('private')}
                        className="h-4 w-4 text-primary-light focus:ring-primary-light"
                      />
                      <label htmlFor="edit-visibility-private" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <EyeOff className="h-4 w-4 mr-1" />
                        Private (Only visible to you)
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id="edit-visibility-public"
                        name="visibility"
                        value="public"
                        checked={visibility === 'public'}
                        onChange={() => setVisibility('public')}
                        className="h-4 w-4 text-primary-light focus:ring-primary-light"
                      />
                      <label htmlFor="edit-visibility-public" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        Public (Visible to everyone)
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {setIsEditQueryModalOpen(false)
                    setFormError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
                >
                  Update Query
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Resolve Query Modal */}
      {isResolveQueryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Resolve Query</h3>
              <button 
                onClick={() => {setIsResolveQueryModalOpen(false)
                  setFormError('');
                }}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <XCircle size={24} />
              </button>
            </div>

            {formError && (
              <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg">
                {formError}
              </div>
            )}

            <form onSubmit={handleResolve}>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-700 dark:text-gray-300 mb-2">
                    You are about to mark this query as resolved: <span className="font-semibold">{currentEditingQuery?.title}</span>
                  </p>
                </div>
                
                <div>
                  <label htmlFor="resolution" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Resolution *
                  </label>
                  <textarea
                    id="resolution"
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light h-32"
                    placeholder="Describe how this query was resolved"
                    required
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {setIsResolveQueryModalOpen(false)
                    setFormError('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  Resolve
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full mx-4 p-6 shadow-lg">
            <div className="text-center mb-6">
              <div className="flex justify-center mb-4">
                <AlertCircle className="h-12 w-12 text-red-500" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Deletion</h3>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Are you sure you want to delete this query? This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-center space-x-4">
              <button
                onClick={() => {setDeleteConfirmation(null)
                  setFormError('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmation)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RaiseQuery;






// import { useState, useEffect } from 'react';
// import { 
//   Plus, 
//   MessageSquare,
//   Clock,
//   CheckCircle,
//   XCircle,
//   Search,
//   Filter,
//   ChevronDown,
//   Eye,
//   EyeOff,
//   AlertCircle
// } from 'lucide-react';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';
// import axios from 'axios';

// const BASE_URL = import.meta.env.VITE_APP_API_URL;

// // Create axios instance with default config
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// // Status Badge Component
// const StatusBadge = ({ status }) => {
//   const statusStyles = {
//     resolved: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
//     "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
//     pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
//   };

//   return (
//     <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusStyles[status]}`}>
//       {status.charAt(0).toUpperCase() + status.slice(1)}
//     </span>
//   );
// };

// // Priority Badge Component
// const PriorityBadge = ({ priority }) => {
//   const priorityStyles = {
//     high: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
//     medium: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
//     low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
//   };

//   return (
//     <span className={`px-2 py-1 rounded-full text-xs font-medium ${priorityStyles[priority]}`}>
//       {priority.charAt(0).toUpperCase() + priority.slice(1)}
//     </span>
//   );
// };

// // Visibility Badge Component
// const VisibilityBadge = ({ visibility }) => {
//   const visibilityStyles = {
//     public: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
//     private: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
//   };

//   return (
//     <span className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${visibilityStyles[visibility]}`}>
//       {visibility === 'public' ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
//       {visibility.charAt(0).toUpperCase() + visibility.slice(1)}
//     </span>
//   );
// };

// const RaiseQuery = () => {
//   const { user, token } = useAuth();
//   const navigate = useNavigate();
  
//   // Form states
//   const [isNewQueryModalOpen, setIsNewQueryModalOpen] = useState(false);
//   const [title, setTitle] = useState('');
//   const [description, setDescription] = useState('');
//   const [category, setCategory] = useState('');
//   const [priority, setPriority] = useState('medium');
//   const [visibility, setVisibility] = useState('private');
//   const [formError, setFormError] = useState('');
  
//   // Query states
//   const [searchTerm, setSearchTerm] = useState('');
//   const [selectedCategory, setSelectedCategory] = useState('all');
//   const [selectedTab, setSelectedTab] = useState('my'); // 'my' or 'public'
//   const [myQueries, setMyQueries] = useState([]);
//   const [publicQueries, setPublicQueries] = useState([]);
//   const [loading, setLoading] = useState(false);

//   // Setup axios request interceptor to include the token
//   useEffect(() => {
//     if (token) {
//       // Add a request interceptor to include the token on every request
//       const interceptor = api.interceptors.request.use(
//         (config) => {
//           config.headers.Authorization = `Bearer ${token}`;
//           return config;
//         },
//         (error) => {
//           return Promise.reject(error);
//         }
//       );

//       // Clean up the interceptor when the component unmounts or token changes
//       return () => {
//         api.interceptors.request.eject(interceptor);
//       };
//     }
//   }, [token]);

//   // Fetch queries on component mount and when dependencies change
//   useEffect(() => {
//     if (user && token) {
//       fetchQueries();
//     }
//   }, [user, token, selectedTab]);

//   const fetchQueries = async () => {
//     setLoading(true);
//     try {
//       let response;
      
//       // Fetch my queries or public queries based on selected tab
//       if (selectedTab === 'my') {
//         response = await api.get('/api/queries/my/');
//         setMyQueries(response.data);
//       } else {
//         response = await api.get('/api/queries/public/');
//         setPublicQueries(response.data);
//       }
//     } catch (error) {
//       console.error('Error fetching queries:', error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Filter queries based on search term and category
//   const filteredQueries = (selectedTab === 'my' ? myQueries : publicQueries).filter(query => {
//     const matchesSearch = query.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
//                          query.description.toLowerCase().includes(searchTerm.toLowerCase());
//     const matchesCategory = selectedCategory === 'all' || query.category === selectedCategory;
//     return matchesSearch && matchesCategory;
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setFormError('');

//     if (!title || !description || !category) {
//       setFormError('Please fill all required fields');
//       return;
//     }

//     try {
//       await api.post('/api/queries/', {
//         title,
//         description,
//         category,
//         priority,
//         visibility
//       });

//       // Reset form and close modal
//       setTitle('');
//       setDescription('');
//       setCategory('');
//       setPriority('medium');
//       setVisibility('private');
//       setIsNewQueryModalOpen(false);
      
//       // Refetch queries to update the list
//       fetchQueries();
//     } catch (error) {
//       console.error('Error creating query:', error);
//       const errorMessage = error.response?.data?.detail || 'Failed to create query';
//       setFormError(errorMessage);
//     }
//   };

//   const toggleVisibility = async (queryId, currentVisibility) => {
//     try {
//       const newVisibility = currentVisibility === 'public' ? 'private' : 'public';
      
//       await api.put(`/api/queries/${queryId}`, {
//         visibility: newVisibility
//       });

//       // Update queries in state to reflect the change
//       if (selectedTab === 'my') {
//         setMyQueries(prevQueries => 
//           prevQueries.map(query => 
//             query.id === queryId ? { ...query, visibility: newVisibility } : query
//           )
//         );
//       }
      
//       // If making private and in public view, remove from public list
//       if (newVisibility === 'private' && selectedTab === 'public') {
//         setPublicQueries(prevQueries => 
//           prevQueries.filter(query => query.id !== queryId)
//         );
//       }
//     } catch (error) {
//       console.error('Error updating query visibility:', error);
//     }
//   };

//   return (
//     <div className="space-y-8">
//       {/* Header Section */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex justify-between items-center">
//           <div>
//             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Support Queries</h2>
//             <p className="text-gray-500 dark:text-gray-400 mt-1">Track and manage your support requests</p>
//           </div>
//           <button 
//             onClick={() => setIsNewQueryModalOpen(true)}
//             className="flex items-center gap-2 px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//           >
//             <Plus size={20} />
//             New Query
//           </button>
//         </div>
//       </div>

//       {/* Tab Navigation */}
//       <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm">
//         <div className="flex border-b border-gray-200 dark:border-gray-700">
//           <button
//             className={`py-2 px-4 font-medium ${
//               selectedTab === 'my'
//                 ? 'text-primary-light border-b-2 border-primary-light'
//                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
//             }`}
//             onClick={() => setSelectedTab('my')}
//           >
//             My Queries
//           </button>
//           <button
//             className={`py-2 px-4 font-medium ${
//               selectedTab === 'public'
//                 ? 'text-primary-light border-b-2 border-primary-light'
//                 : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
//             }`}
//             onClick={() => setSelectedTab('public')}
//           >
//             Public Queries
//           </button>
//         </div>
//       </div>

//       {/* Filters and Search */}
//       <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
//         <div className="flex flex-col md:flex-row gap-4 justify-between">
//           <div className="relative flex-1">
//             <input
//               type="text"
//               placeholder="Search queries..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className="w-full px-4 py-2 pl-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//             />
//             <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
//           </div>
//           <div className="flex gap-4">
//             <div className="relative">
//               <select
//                 value={selectedCategory}
//                 onChange={(e) => setSelectedCategory(e.target.value)}
//                 className="appearance-none px-4 py-2 pr-10 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//               >
//                 <option value="all">All Categories</option>
//                 <option value="Training">Training</option>
//                 <option value="Pipeline">Pipeline</option>
//                 <option value="Deployment">Deployment</option>
//                 <option value="Other">Other</option>
//               </select>
//               <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Queries List */}
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
//         {loading ? (
//           <div className="p-8 text-center">
//             <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-light border-r-transparent"></div>
//             <p className="mt-4 text-gray-500 dark:text-gray-400">Loading queries...</p>
//           </div>
//         ) : filteredQueries.length === 0 ? (
//           <div className="p-8 text-center">
//             <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
//             <p className="mt-4 text-gray-500 dark:text-gray-400">
//               {searchTerm || selectedCategory !== 'all'
//                 ? 'No queries match your search criteria'
//                 : 'No queries available. Create your first query!'}
//             </p>
//           </div>
//         ) : (
//           <div className="overflow-x-auto">
//             <table className="min-w-full">
//               <thead>
//                 <tr className="border-b dark:border-gray-700">
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                     Query Details
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                     Category
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                     Status
//                   </th>
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                     Priority
//                   </th>
//                   {selectedTab === 'my' && (
//                     <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                       Visibility
//                     </th>
//                   )}
//                   <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                     Created
//                   </th>
//                   {selectedTab === 'my' && (
//                     <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">
//                       Actions
//                     </th>
//                   )}
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
//                 {filteredQueries.map((query) => (
//                   <tr 
//                     key={query.id}
//                     className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
//                     onClick={() => navigate(`/queries/${query.id}`)}
//                   >
//                     <td className="px-6 py-4">
//                       <div>
//                         <div className="text-sm font-medium text-gray-900 dark:text-white">
//                           {query.title}
//                         </div>
//                         <div className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
//                           {query.description}
//                         </div>
//                       </div>
//                     </td>
//                     <td className="px-6 py-4">
//                       <span className="text-sm text-gray-900 dark:text-white">
//                         {query.category}
//                       </span>
//                     </td>
//                     <td className="px-6 py-4">
//                       <StatusBadge status={query.status} />
//                     </td>
//                     <td className="px-6 py-4">
//                       <PriorityBadge priority={query.priority} />
//                     </td>
//                     {selectedTab === 'my' && (
//                       <td className="px-6 py-4">
//                         <VisibilityBadge visibility={query.visibility} />
//                       </td>
//                     )}
//                     <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
//                       {new Date(query.created_at).toLocaleDateString()}
//                     </td>
//                     {selectedTab === 'my' && (
//                       <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
//                         <button
//                           onClick={() => toggleVisibility(query.id, query.visibility)}
//                           className="text-primary-light hover:text-primary-dark"
//                         >
//                           {query.visibility === 'public' ? 'Make Private' : 'Make Public'}
//                         </button>
//                       </td>
//                     )}
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           </div>
//         )}
//       </div>

//       {/* New Query Modal */}
//       {isNewQueryModalOpen && (
//         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//           <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
//             <div className="flex justify-between items-center mb-6">
//               <h3 className="text-xl font-bold text-gray-900 dark:text-white">Create New Query</h3>
//               <button 
//                 onClick={() => setIsNewQueryModalOpen(false)}
//                 className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
//               >
//                 <XCircle size={24} />
//               </button>
//             </div>

//             {formError && (
//               <div className="mb-4 p-3 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-lg">
//                 {formError}
//               </div>
//             )}

//             <form onSubmit={handleSubmit}>
//               <div className="space-y-4">
//                 <div>
//                   <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Title *
//                   </label>
//                   <input
//                     type="text"
//                     id="title"
//                     value={title}
//                     onChange={(e) => setTitle(e.target.value)}
//                     className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//                     placeholder="Enter query title"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Description *
//                   </label>
//                   <textarea
//                     id="description"
//                     value={description}
//                     onChange={(e) => setDescription(e.target.value)}
//                     className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light h-32"
//                     placeholder="Describe your query in detail"
//                     required
//                   />
//                 </div>

//                 <div>
//                   <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Category *
//                   </label>
//                   <select
//                     id="category"
//                     value={category}
//                     onChange={(e) => setCategory(e.target.value)}
//                     className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//                     required
//                   >
//                     <option value="">Select a category</option>
//                     <option value="Training">Training</option>
//                     <option value="Pipeline">Pipeline</option>
//                     <option value="Deployment">Deployment</option>
//                     <option value="Other">Other</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label htmlFor="priority" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
//                     Priority
//                   </label>
//                   <select
//                     id="priority"
//                     value={priority}
//                     onChange={(e) => setPriority(e.target.value)}
//                     className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light"
//                   >
//                     <option value="low">Low</option>
//                     <option value="medium">Medium</option>
//                     <option value="high">High</option>
//                   </select>
//                 </div>

//                 <div>
//                   <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
//                     Visibility
//                   </label>
//                   <div className="flex items-center space-x-4">
//                     <div className="flex items-center">
//                       <input
//                         type="radio"
//                         id="visibility-private"
//                         name="visibility"
//                         value="private"
//                         checked={visibility === 'private'}
//                         onChange={() => setVisibility('private')}
//                         className="h-4 w-4 text-primary-light focus:ring-primary-light"
//                       />
//                       <label htmlFor="visibility-private" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
//                         <EyeOff className="h-4 w-4 mr-1" />
//                         Private (Only visible to you)
//                       </label>
//                     </div>
//                     <div className="flex items-center">
//                       <input
//                         type="radio"
//                         id="visibility-public"
//                         name="visibility"
//                         value="public"
//                         checked={visibility === 'public'}
//                         onChange={() => setVisibility('public')}
//                         className="h-4 w-4 text-primary-light focus:ring-primary-light"
//                       />
//                       <label htmlFor="visibility-public" className="ml-2 text-sm text-gray-700 dark:text-gray-300 flex items-center">
//                         <Eye className="h-4 w-4 mr-1" />
//                         Public (Visible to everyone)
//                       </label>
//                     </div>
//                   </div>
//                 </div>
//               </div>

//               <div className="mt-6 flex justify-end space-x-3">
//                 <button
//                   type="button"
//                   onClick={() => setIsNewQueryModalOpen(false)}
//                   className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
//                 >
//                   Cancel
//                 </button>
//                 <button
//                   type="submit"
//                   className="px-4 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
//                 >
//                   Create Query
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default RaiseQuery;

