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

// User profile related endpoints
const userService = {
  // Get current user profile
  getCurrentUser: () => {
    return api.get('/users/me');
  },

  getCurrentUserFetch: () => {
    return api.get('/users/fetch');
  },
  
  // Update user profile
  updateProfile: (profileData) => {
    return api.patch('/users/me', profileData);
  }
};

export default api;
export { userService };