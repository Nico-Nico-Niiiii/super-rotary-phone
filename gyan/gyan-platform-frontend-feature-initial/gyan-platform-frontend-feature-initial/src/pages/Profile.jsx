import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  Edit2, 
  Save, 
  X, 
  Check, 
  Github, 
  Trash2, 
  Sun, 
  Moon, 
  Building2,
  Gitlab,
  User,  
  Link,  
  Palette ,
  KeyRound 
} from 'lucide-react';
// import api from '../services/userapi';

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

const Profile = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState('profile');
  const [activeSection, setActiveSection] = useState('personal');
  
  // Profile state
  const [profileImage, setProfileImage] = useState(null);
  const [formData, setFormData] = useState({
    // Personal Details
    username: '',
    firstName: '',
    lastName: '',
    gender: 'Male',
    role: '',
    
    // Contact Details
    email: '',
    phone: '',
    linkedin: '',

    
  
  });

  // Track which fields are being edited
  const [editingFields, setEditingFields] = useState({});


  // Access Tokens state
const [accessTokens, setAccessTokens] = useState([]);
const [showAccessTokenModal, setShowAccessTokenModal] = useState(false);
const [newAccessTokenName, setNewAccessTokenName] = useState('');
const [newAccessTokenValue, setNewAccessTokenValue] = useState('');

  // Connected Apps state
  const [tokens, setTokens] = useState({
    github: [],
    gitlab: [],
    gitea: []
  });
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [newTokens, setNewTokens] = useState({
    github: { name: '', value: '' },
    gitlab: { name: '', value: '' },
    gitea: { name: '', value: '' }
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState(null);

  // Add this to your existing state variables
const [gyanToken, setGyanToken] = useState('');
const [showGyanDeleteModal, setShowGyanDeleteModal] = useState(false);

  // Theme state
  const [theme, setTheme] = useState('light');

  // Style classes
  const inputClasses = `w-full px-3 py-2 border rounded-md bg-white dark:bg-gray-700 
    text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 
    focus:ring-2 focus:ring-primary-light focus:border-primary-light 
    outline-none transition-colors duration-200`;

  const textDisplayClasses = `w-full px-3 py-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-600
    text-gray-900 dark:text-white cursor-pointer transition-colors duration-200`;

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile();
   
  }, []);


  const createGyanToken = async () => {
    try {
      // Prompt for user password to generate Gyan token
      // const password = prompt('Please enter your account password:');
      console.log("Email", formData.email);
      
      const response = await api.post('/auth/create_access_token', {
        email: formData.email
      });
  
      if (response.data.access_token) {
        setGyanToken(response.data.access_token);
      }
    } catch (error) {
      console.error('Failed to create Gyan token:', error);
      alert('Failed to create Gyan token. Please check your password and try again.');
    }
  };

  const deleteGyanToken = () => {
    setGyanToken('');
    setShowGyanDeleteModal(false);
  };

  const renderGyanTokenSection = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Gyan Token</h2>
      
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        {gyanToken ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Your Gyan Token
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={gyanToken}
                  className={`${inputClasses} rounded-r-none`}
                  disabled
                />
                <div className="flex">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(gyanToken);
                      alert('Token copied to clipboard');
                    }}
                    className="px-3 py-2 bg-blue-500 text-white hover:bg-blue-600 transition-colors"
                    title="Copy to clipboard"
                  >
                    <Save size={16} />
                  </button>
                  <button
                    onClick={() => setShowGyanDeleteModal(true)}
                    className="px-3 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors rounded-r-md"
                    title="Delete token"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col space-y-4">
            <p className="text-gray-600 dark:text-gray-400">
              Generate a Gyan token to access the API.
            </p>
            <button
              onClick={createGyanToken}
              className="px-4 py-2 bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors w-fit"
            >
              Generate Gyan Token
            </button>
          </div>
        )}
      </div>
    </div>
  );


  const GyanDeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-medium mb-4">Delete Gyan Token</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this Gyan token? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowGyanDeleteModal(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={deleteGyanToken}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  

  // API functions
  const fetchUserProfile = async () => {
    try {
      const response = await api.get('/users/me');
      console.log('Response', response.data);
      
      const userData = response.data;
      
      setFormData({
        ...formData,
        username: userData.username || 'Username',
        firstName: userData.first_name || 'John',
        lastName: userData.last_name || 'Doe',
        email: userData.email || 'user@example.com'
      });
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const updateUserProfile = async (fieldData) => {
    try {
      const response = await api.patch('/users/me', fieldData, {
        headers: {
            'Content-Type': 'application/json',
        }
    });
      return response.data;
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw error;
    }
  };

  // Handlers
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const toggleFieldEdit = (fieldName) => {
    setEditingFields(prev => ({
      ...prev,
      [fieldName]: !prev[fieldName]
    }));
  };

  const saveField = async (fieldName) => {
    // Map from UI field names to API field names
    const apiFieldMappings = {
      firstName: 'first_name',
      lastName: 'last_name',
      username: 'username',
      gender: 'gender',
      role: 'role',
      phone: 'phone',
      linkedin: 'linkedin',
    };

    if (apiFieldMappings[fieldName]) {
      try {
        const fieldData = {
          [apiFieldMappings[fieldName]]: formData[fieldName]
        };
        console.log("Field data", fieldData);
        
        await updateUserProfile(fieldData);
      } catch (error) {
        // On error, revert the field to its original value by re-fetching
        fetchUserProfile();
      }
    }
    
    // Turn off editing for this field
    toggleFieldEdit(fieldName);
  };

  const handleAddToken = (provider, tokenData) => {
    const isValid = Math.random() > 0.5; // Simulate token validation
    const newTokenObj = {
      ...tokenData,
      id: Date.now(),
      isValid,
      status: isValid ? 'Valid' : 'Invalid'
    };
  
    setTokens(prev => ({
      ...prev,
      [provider]: [...prev[provider], newTokenObj]
    }));
    setShowTokenModal(false);
  };

  const handleDeleteToken = () => {
    if (tokenToDelete) {
      setTokens(prev => ({
        ...prev,
        [tokenToDelete.provider]: prev[tokenToDelete.provider].filter(
          token => token.id !== tokenToDelete.id
        )
      }));
      setShowDeleteModal(false);
      setTokenToDelete(null);
    }
  };


  const createAccessToken = async () => {
    try {
      // Prompt for user password to generate access token
      // const password = prompt('Please enter your account password:');
      
      const response = await api.post('/auth/create_access_token', {
        email: formData.email
      });
  
      if (response.data.access_token) {
        const newToken = {
          id: Date.now(),
          name: newAccessTokenName || 'Unnamed Token',
          value: response.data.access_token,
          createdAt: new Date().toISOString()
        };
  
        setAccessTokens(prev => [...prev, newToken]);
        setShowAccessTokenModal(false);
        setNewAccessTokenName('');
        setNewAccessTokenValue(response.data.access_token);
      }
    } catch (error) {
      console.error('Failed to create access token:', error);
      alert('Failed to create access token. Please check your password and try again.');
    }
  };


  const AccessTokenModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4 flex items-center">
          <KeyRound size={20} className="mr-2" /> Create New Access Token
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={newAccessTokenName}
              onChange={(e) => setNewAccessTokenName(e.target.value)}
              className={inputClasses}
              placeholder="Enter token name (optional)"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setShowAccessTokenModal(false);
              setNewAccessTokenName('');
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={createAccessToken}
            className="px-4 py-2 text-sm bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors"
          >
            Generate Token
          </button>
        </div>
      </div>
    </div>
  );




  // EditableField component for inline editing
  const EditableField = ({ label, name, value, type = 'text' }) => {
    const isEditing = editingFields[name];
    
    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        
        {isEditing ? (
          <div className="flex">
            <input
              type={type}
              name={name}
              value={value}
              onChange={handleInputChange}
              className={`${inputClasses} rounded-r-none`}
              autoFocus
            />
            <div className="flex">
              <button
                onClick={() => saveField(name)}
                className="px-3 py-2 bg-green-500 text-white hover:bg-green-600 transition-colors"
              >
                <Check size={16} />
              </button>
              <button
                onClick={() => toggleFieldEdit(name)}
                className="px-3 py-2 bg-red-500 text-white hover:bg-red-600 transition-colors rounded-r-md"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <div 
            onClick={() => toggleFieldEdit(name)}
            className={textDisplayClasses}
          >
            {value || 'Not set'}
          </div>
        )}
      </div>
    );
  };

  const renderProfileSection = () => (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Profile Settings</h2>
      </div>

      {/* Profile Image Section */}
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            {profileImage ? (
              <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-3xl text-gray-400">
                {formData.firstName[0]}{formData.lastName[0]}
              </div>
            )}
          </div>
          <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary-light rounded-full flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors">
            <Camera size={16} className="text-white" />
            <input
              type="file"
              className="hidden"
              accept="image/*"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </div>

      {/* Profile sections navigation */}
      <div className="flex space-x-4 border-b border-gray-200 dark:border-gray-700">
        {['personal', 'contact'].map((section) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`pb-2 px-1 text-sm font-medium border-b-2 transition-colors ${
              activeSection === section
                ? 'border-primary-light text-primary-light'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            {section.charAt(0).toUpperCase() + section.slice(1)} Details
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Personal Details Section */}
        {activeSection === 'personal' && (
          <>
            <EditableField label="Username" name="username" value={formData.username} />
            <EditableField label="First Name" name="firstName" value={formData.firstName} />
            <EditableField label="Last Name" name="lastName" value={formData.lastName} />
            <EditableField label="Gender" name="gender" value={formData.gender} />
            {/* <EditableField label="Date of Birth" name="dateOfBirth" value={formData.dateOfBirth} type="date" /> */}
            <EditableField label="Role" name="role" value={formData.role} />
          </>
        )}

        {/* Contact Details Section */}
        {activeSection === 'contact' && (
          <>
            <EditableField label="Email" name="email" value={formData.email} type="email" />
            <EditableField label="Phone" name="phone" value={formData.phone} type="tel" />
            <EditableField label="Linkedin" name="linkedin" value={formData.linkedin} />
          
          </>
        )}

        
       
      </div>
    </div>
  );

  const renderConnectedApps = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Connected Apps</h2>
      
      <div className="grid gap-6">
        {Object.entries(tokens).map(([provider, providerTokens]) => (
          <div key={provider} className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-3">
                {provider === 'github' && <Github size={24} />}
                {provider === 'gitlab' && <Gitlab size={24} />}
                {provider === 'gitea' && <Building2 size={24} />}
                <h3 className="text-lg font-medium capitalize">{provider}</h3>
              </div>
              <button
                onClick={() => {
                  setSelectedProvider(provider);
                  setShowTokenModal(true);
                }}
                className="px-3 py-1.5 text-sm bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors"
              >
                Add Token
              </button>
            </div>

            {providerTokens.length > 0 ? (
              <div className="space-y-3 mt-4">
                {providerTokens.map(token => (
                  <div key={token.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-md">
                    <div className="flex items-center space-x-3">
                      {token.isValid ? (
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                      ) : (
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                      )}
                      <span className="font-medium">{token.name}</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {token.status}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        setTokenToDelete({ id: token.id, provider });
                        setShowDeleteModal(true);
                      }}
                      className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
                No tokens added yet.
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderThemeSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Theme Settings</h2>
      
      <div className="bg-white dark:bg-gray-700 p-6 rounded-lg shadow-sm">
        <h3 className="text-lg font-medium mb-4">Select Theme</h3>
        
        <div className="flex space-x-4">
          <button
            onClick={() => setTheme('light')}
            className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
              theme === 'light'
                ? 'border-primary-light bg-primary-light/10'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <Sun size={20} className={theme === 'light' ? 'text-primary-light' : 'text-gray-500'} />
            <span className={theme === 'light' ? 'text-primary-light' : 'text-gray-500'}>Light</span>
          </button>

          <button
            onClick={() => setTheme('dark')}
            className={`flex items-center space-x-2 p-3 rounded-lg border-2 transition-all ${
              theme === 'dark'
                ? 'border-primary-light bg-primary-light/10'
                : 'border-gray-200 dark:border-gray-600'
            }`}
          >
            <Moon size={20} className={theme === 'dark' ? 'text-primary-light' : 'text-gray-500'} />
            <span className={theme === 'dark' ? 'text-primary-light' : 'text-gray-500'}>Dark</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderAccessTokens = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Access Tokens</h2>
        <button
          onClick={() => setShowAccessTokenModal(true)}
          className="px-3 py-1.5 text-sm bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors"
        >
          New Access Token
        </button>
      </div>
      
      {accessTokens.length > 0 ? (
        <div className="space-y-3">
          {accessTokens.map(token => (
            <div 
              key={token.id} 
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-600 rounded-md"
            >
              <div className="flex-1 mr-4">
                <div className="font-medium">{token.name}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  {token.value}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
                  Created: {new Date(token.createdAt).toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(token.value);
                  alert('Token copied to clipboard');
                }}
                className="px-2 py-1 text-sm bg-gray-200 dark:bg-gray-500 rounded hover:bg-gray-300 dark:hover:bg-gray-400 transition-colors"
              >
                Copy
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 text-sm">
          No access tokens created yet.
        </p>
      )}
    </div>
  );

  const TokenModal = () => {
    if (!selectedProvider) return null;

    return(
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-medium mb-4">
          Add New {selectedProvider?.charAt(0).toUpperCase() + selectedProvider?.slice(1)} Token
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Name
            </label>
            <input
              type="text"
              value={newTokens[selectedProvider]?.name || ''}
              onChange={(e) => setNewTokens(prev => ({
                ...prev,
                [selectedProvider]: {
                  ...prev[selectedProvider],
                  name: e.target.value
                }
              }))}
              className={inputClasses}
              placeholder="Enter token name"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Token Value
            </label>
            <input
              type="text"
              value={newTokens[selectedProvider]?.value || ''}
              onChange={(e) => setNewTokens(prev => ({
                ...prev,
                [selectedProvider]: {
                  ...prev[selectedProvider],
                  value: e.target.value
                }
              }))}
              className={inputClasses}
              placeholder="Enter token value"
            />
          </div>
        </div>
        <div className="flex justify-end space-x-3 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              setShowTokenModal(false);
              setNewTokens(prev => ({
                ...prev,
                [selectedProvider]: { name: '', value: '' }
              }));
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              handleAddToken(selectedProvider, newTokens[selectedProvider]);
            }}
            className="px-4 py-2 text-sm bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors"
            disabled={!newTokens[selectedProvider]?.name || !newTokens[selectedProvider]?.value}
          >
            Add Token
          </button>
        </div>
      </div>
    </div>
    
  );
};

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-sm">
        <h3 className="text-lg font-medium mb-4">Delete Token</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Are you sure you want to delete this token? This action cannot be undone.
        </p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteModal(false)}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleDeleteToken}
            className="px-4 py-2 text-sm bg-red-500 text-white rounded-md hover:bg-red-600"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex bg-white dark:bg-gray-800 rounded-lg shadow">
        {/* Left Sidebar */}
        <div className="w-64 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4 space-y-2">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'connected-apps', label: 'Connected Apps', icon: Link },
              { id: 'access-tokens', label: 'Access Tokens', icon: KeyRound }, 
              { id: 'gyan-token', label: 'Gyan Token', icon: KeyRound },
              { id: 'theme', label: 'Theme', icon: Palette }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center w-full px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? 'bg-primary-light text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50'
                }`}
              >
                <item.icon size={18} className="mr-2" />
                {item.label}
              </button>
            ))}
          </nav>
        </div>
  
        {/* Right Content Area */}
        <div className="flex-1 p-6">
          {activeTab === 'profile' && renderProfileSection()}
          {activeTab === 'connected-apps' && renderConnectedApps()}
          {activeTab === 'access-tokens' && renderAccessTokens()}
          {activeTab === 'gyan-token' && renderGyanTokenSection()}
          {activeTab === 'theme' && renderThemeSettings()}
        </div>
      </div>
  
      {/* Modals */}
      {showTokenModal && <TokenModal />}
      {showDeleteModal && <DeleteConfirmationModal />}
      {showAccessTokenModal && <AccessTokenModal />}
      {showGyanDeleteModal && <GyanDeleteConfirmationModal />} 
    </div>
  );
};

export default Profile;

