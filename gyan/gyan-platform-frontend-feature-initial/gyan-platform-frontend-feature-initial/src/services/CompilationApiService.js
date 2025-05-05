// src/services/edgeDeploymentService.js
import axios from 'axios';

// API base URL - adjust this to your backend URL
const API_BASE_URL = 'http://localhost:8000';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Service for interacting with the Edge Deployment API
 */
export const CompilationApiService = {
  /**
   * Optimize a model with the given parameters
   * @param {Object} optimizeParams - Parameters for optimization
   * @returns {Promise} - Promise that resolves to the optimized model data or stream
   */
  optimizeModel: async (optimizeParams) => {
    try {
      const response = await apiClient.post('/gyan/api/deploy/edge/model_optimiser', {
        optimization_framework: optimizeParams.framework,
        precision_type: optimizeParams.precisionType,
      }, {
        responseType: 'stream',
      });
      
      return response.data;
    } catch (error) {
      console.error('Error optimizing model:', error);
      throw error.response?.data || error.message || error;
    }
  },

  /**
   * Get the list of optimized models
   * @returns {Promise} - Promise that resolves to the list of optimized models
   */
  getOptimizedModels: async () => {
    try {
      const response = await apiClient.get('/gyan/api/deploy/edge/optimized_model_list');
      return response.data;
    } catch (error) {
      console.error('Error fetching optimized models:', error);
      throw error.response?.data || error.message || error;
    }
  },

  /**
   * Download an optimized model
   * @param {string} modelName - Name of the model to download
   * @param {string} framework - Framework of the model
   * @returns {string} - Download URL
   */
  downloadModel: (modelName, framework) => {
    return `${API_BASE_URL}/gyan/api/deploy/edge/download-zip?model_name=${modelName}&framework=${framework}`;
  },

  /**
   * Delete an optimized model
   * @param {Object} modelInfo - Information about the model to delete
   * @returns {Promise} - Promise that resolves to the deletion result
   */
  deleteModel: async (modelInfo) => {
    try {
      const params = {
        model_type: modelInfo.deploymentType || 'llm',
        model_name: modelInfo.model,
        project_name: modelInfo.name,
        optimization_framework: modelInfo.framework,
        precision: modelInfo.precisionType,
      };
      
      const response = await apiClient.get('/gyan/api/deploy/edge/delete_optimized_model', { params });
      return response.data;
    } catch (error) {
      console.error('Error deleting model:', error);
      throw error.response?.data || error.message || error;
    }
  },
  
  /**
   * Process an optimization stream
   * @param {ReadableStream} stream - Stream of optimization data
   * @param {Function} onProgress - Callback for progress updates
   * @returns {Promise} - Promise that resolves when optimization is complete
   */
  processOptimizationStream: async (stream, onProgress) => {
    try {
      // Create a reader from the stream
      const reader = stream.getReader ? stream.getReader() : stream;
      const decoder = new TextDecoder();
      let result = '';
      
      while (true) {
        // Read from the stream
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }
        
        // Decode the chunk and add to result
        const chunk = decoder.decode(value, { stream: true });
        result += chunk;
        
        // Parse and process each line
        const lines = result.split('\n');
        
        // Keep the last line which might be incomplete
        result = lines.pop() || '';
        
        // Process complete lines
        for (const line of lines) {
          if (line.trim()) {
            try {
              const data = JSON.parse(line);
              if (onProgress) {
                onProgress(data);
              }
            } catch {
              console.warn('Failed to parse JSON line:', line);
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing optimization stream:', error);
      throw error;
    }
  }
};