import axios from 'axios';

const API_BASE_URL = 'http://localhost:8009'; // Update with your actual backend URL

const cosmosApi = {
  // Autoregressive model APIs
  generateAutoText2World: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/generate/auto_text2world`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important for receiving binary file response
        }
      );
      
      // Create a URL from the blob response
      console.log("responseee",response.data)
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error generating autoregressive text-to-world:', error);
      throw error;
    }
  },

  generateAutoVideo2World: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/generate/auto_video2world`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important for receiving binary file response
        }
      );
      
      // Create a URL from the blob response
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error generating autoregressive video-to-world:', error);
      throw error;
    }
  },

  // Diffusion model APIs
  generateDiffusionText2World: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/generate/diffusion_text2world`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important for receiving binary file response
        }
      );
      
      // Create a URL from the blob response
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error generating diffusion text-to-world:', error);
      throw error;
    }
  },

  generateDiffusionVideo2World: async (formData) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/generate/diffusion_video2world`, 
        formData, 
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          responseType: 'blob', // Important for receiving binary file response
        }
      );
      
      // Create a URL from the blob response
      console.log("responseee",response.data)
      return URL.createObjectURL(response.data);
    } catch (error) {
      console.error('Error generating diffusion video-to-world:', error);
      throw error;
    }
  },

  // Adding a utility method to extract error messages from axios errors
  extractErrorMessage: (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      if (error.response.data && typeof error.response.data === 'object') {
        return error.response.data.detail || JSON.stringify(error.response.data);
      } else if (typeof error.response.data === 'string') {
        try {
          const errorData = JSON.parse(error.response.data);
          return errorData.detail || JSON.stringify(errorData);
        } catch (e) {
          return `Server error: ${error.response.status}`;
        }
      }
      return `Server error: ${error.response.status}`;
    } else if (error.request) {
      // The request was made but no response was received
      return 'No response from server. Please check your connection.';
    } else {
      // Something happened in setting up the request that triggered an Error
      return error.message || 'An unknown error occurred';
    }
  }
};

export default cosmosApi;