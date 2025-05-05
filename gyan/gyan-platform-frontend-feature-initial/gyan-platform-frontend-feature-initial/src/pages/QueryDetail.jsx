import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  User, 
  MessageSquare,
  Clock,
  Calendar,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Send,
  AlertCircle
} from 'lucide-react';
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

const QueryDetail = () => {
  const { queryId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  
  // Query state
  const [query, setQuery] = useState(null);
  const [isEditQueryModalOpen, setIsEditQueryModalOpen] = useState(false);
  const [isResolveQueryModalOpen, setIsResolveQueryModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState('medium');
  const [visibility, setVisibility] = useState('private');
  const [status, setStatus] = useState('pending');
  const [resolution, setResolution] = useState('');
  const [formError, setFormError] = useState('');
  
  // Comments state
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  
  // Categories from backend
  const categories = ["Training", "Pipeline", "Deployment", "Other"];
  const statuses = ["pending", "in-progress", "resolved"];

  // Setup axios request interceptor to include the token
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

  // Fetch query data
//   useEffect(() => {
//     if (queryId && token) {
//       fetchQueryData();
//     }
//   }, [queryId, token]);


useEffect(() => {
   
      fetchQueryData();
    
  }, [queryId]);

  const fetchQueryData = async () => {
    setLoading(true);
    try {
      const queryResponse = await api.get(`/api/queries/${queryId}`);
      setQuery(queryResponse.data);
      
      // Set form fields for potential editing
      setTitle(queryResponse.data.title);
      setDescription(queryResponse.data.description);
      setCategory(queryResponse.data.category);
      setPriority(queryResponse.data.priority);
      setVisibility(queryResponse.data.visibility);
      setStatus(queryResponse.data.status);
      
      // Fetch comments
      const commentsResponse = await api.get(`/api/queries/${queryId}/comments/`);
      setComments(commentsResponse.data);
    } catch (error) {
      console.error('Error fetching query data:', error);
      if (error.response?.status === 404) {
        navigate('/queries');
      }
    } finally {
      setLoading(false);
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
      const response = await api.put(`/api/queries/${queryId}`, {
        title,
        description,
        category,
        priority,
        visibility,
        status
      });

      // Update query state with new data
      setQuery(response.data);
      setIsEditQueryModalOpen(false);
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
      const response = await api.put(`/api/queries/${queryId}/resolve/?resolution=${encodeURIComponent(resolution)}`);

      // Update query state with new data
      setQuery(response.data);
      setIsResolveQueryModalOpen(false);
    } catch (error) {
      console.error('Error resolving query:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to resolve query';
      setFormError(errorMessage);
    }
  };

  // Delete a query
  const handleDelete = async () => {
    try {
      await api.delete(`/api/queries/${queryId}`);
      navigate('/queries');
    } catch (error) {
      console.error('Error deleting query:', error);
    }
  };

  // Toggle visibility of a query
  const toggleVisibility = async () => {
    try {
      const newVisibility = query.visibility === 'public' ? 'private' : 'public';
      
      const response = await api.put(`/api/queries/${queryId}`, {
        visibility: newVisibility
      });

      // Update query state with new data
      setQuery(response.data);
      setVisibility(newVisibility);
    } catch (error) {
      console.error('Error updating query visibility:', error);
    }
  };

  // Add a new comment
  const handleAddComment = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    try {
        
      const response = await api.post(`/api/queries/comments/${queryId}/?content=${encodeURIComponent(newComment)}`);

      // Add new comment to the list
      setComments([response.data, ...comments]);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary-light border-r-transparent"></div>
        <p className="ml-4 text-gray-500 dark:text-gray-400">Loading query...</p>
      </div>
    );
  }

  if (!query) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <AlertCircle className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Query Not Found</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">The query you're looking for doesn't exist or you don't have permission to view it.</p>
      
        <button 
  onClick={() => navigate('/dashboard/queries')}
  className="flex items-center px-4 py-2 bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors duration-200"
>
  <ArrowLeft className="mr-2 h-4 w-4" />
  Back to Queries
</button>
      </div>
    );
  }

  const isOwner = user.email === query.user_email;

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      {/* Back Button */}
      <div className="mb-6">
        <button 
          onClick={() => navigate('/dashboard/queries')}
          className="flex items-center text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Queries
        </button>
      </div>

      {/* Query Details Card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {query.title}
              </h1>
              <div className="flex flex-wrap gap-2 mb-3">
                <StatusBadge status={query.status} />
                <PriorityBadge priority={query.priority} />
                <VisibilityBadge visibility={query.visibility} />
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  {query.category}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                <User className="h-4 w-4 mr-1" />
                <span>{query.user_email}</span>
                <span className="mx-2">•</span>
                <Calendar className="h-4 w-4 mr-1" />
                <span>{formatDate(query.created_at)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            {isOwner && (
              <div className="flex space-x-2 mt-4 sm:mt-0">
                <button
                  onClick={() => setIsEditQueryModalOpen(true)}
                  className="flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </button>
                
                {query.status !== 'resolved' && (
                  <button
                    onClick={() => setIsResolveQueryModalOpen(true)}
                    className="flex items-center px-3 py-1.5 border border-green-500 rounded-lg text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-200"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Resolve
                  </button>
                )}
                
                <button
                  onClick={() => toggleVisibility()}
                  className="flex items-center px-3 py-1.5 border border-purple-300 dark:border-purple-600 rounded-lg text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-200"
                >
                  {query.visibility === 'public' ? (
                    <>
                      <EyeOff className="h-4 w-4 mr-1" />
                      Make Private
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4 mr-1" />
                      Make Public
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setDeleteConfirmation(true)}
                  className="flex items-center px-3 py-1.5 border border-red-300 dark:border-red-600 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-200"
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Description */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Description
          </h2>
          <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {query.description}
          </div>
        </div>

        {/* Resolution (if resolved) */}
        {query.status === 'resolved' && query.resolution && (
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 bg-green-50 dark:bg-green-900/20">
            <div className="flex items-center mb-3">
              <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mr-2" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Resolution
              </h2>
              {query.resolved_at && (
                <span className="ml-auto flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4 mr-1" />
                  {formatDate(query.resolved_at)}
                </span>
              )}
            </div>
            <div className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {query.resolution}
            </div>
          </div>
        )}

        {/* Comments Section */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
            <MessageSquare className="h-5 w-5 mr-2" />
            Comments ({comments.length})
          </h2>

          {/* Add Comment Form */}
       
          <form onSubmit={handleAddComment} className="mb-6">
  <div className="flex">
    <input
      type="text"
      value={newComment}
      onChange={(e) => setNewComment(e.target.value)}
      placeholder="Add a comment..."
      className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:focus:ring-blue-500 dark:text-white dark:placeholder-gray-400"
    />
    <button
      type="submit"
      className="px-4 py-2 bg-primary-light dark:bg-blue-600 text-white rounded-r-lg hover:bg-primary-dark dark:hover:bg-blue-700 transition-colors duration-200 flex items-center"
    >
      <Send className="h-4 w-4 mr-1" />
      Send
    </button>
  </div>
</form>

          {/* Comments List */}
          {comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">
                No comments yet. Be the first to comment!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment) => (
                <div 
                  key={comment.id} 
                  className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                >
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex items-center">
                      <User className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {comment.user_email}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    {comment.content}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Query Modal */}
      {isEditQueryModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl max-w-2xl w-full mx-4 p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Edit Query</h3>
              <button 
                onClick={() => setIsEditQueryModalOpen(false)}
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
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
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
                  onClick={() => setIsEditQueryModalOpen(false)}
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
                onClick={() => setIsResolveQueryModalOpen(false)}
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
                    You are about to mark this query as resolved: <span className="font-semibold">{query.title}</span>
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
                  onClick={() => setIsResolveQueryModalOpen(false)}
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
                onClick={() => setDeleteConfirmation(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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

export default QueryDetail;