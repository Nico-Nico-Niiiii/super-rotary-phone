import React, { useState } from 'react';
import { Download, Trash2, Loader } from 'lucide-react';
import { CompilationApiService } from '../../services/CompilationApiService';

const OptimizationLogModal = ({ logs, isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Optimization Logs
            </h3>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              ?
            </button>
          </div>
          <div className="space-y-2">
            {logs.map((log, index) => (
              <div 
                key={index} 
                className={`p-3 rounded-lg ${
                  log.status === 'Started' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  log.status === 'Success' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  log.status === 'Error' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                  'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium">{log.stage}</span>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
                {log.details && (
                  <p className="text-sm mt-1 text-gray-600 dark:text-gray-300">
                    {log.details}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const EdgeDeploymentCard = ({ project, onDelete }) => {
  const [isLogModalOpen, setIsLogModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  if (!project) return null;

  const isCompleted = project.status === 'Completed';

  // Determine status color and text
  const getStatusStyle = () => {
    switch (project.status) {
      case 'Optimizing':
        return 'text-yellow-500';
      case 'Completed':
        return 'text-green-500';
      case 'Failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getModelTypeStyle = () => {
    switch (project.deploymentType) {
      case 'vision':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'llm':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'vision-llm':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      
      // Get download URL from service
      const downloadUrl = CompilationApiService.downloadModel(
        project.model,
        project.framework
      );
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', `${project.framework}_${project.model}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Download failed:', error);
      alert(`Download failed: ${error.message}`);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        setIsDeleting(true);
        
        // Call delete API
        await edgeDeploymentService.deleteModel(project);
        
        // Call onDelete callback if provided
        if (onDelete) {
          onDelete(project.id);
        }
      } catch (error) {
        console.error('Delete failed:', error);
        alert(`Delete failed: ${error.message}`);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 space-y-4 w-full">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
            {project.name}
          </h3>
          <span 
            className={`inline-block px-2 py-1 text-xs rounded-full mt-2 ${getModelTypeStyle()}`}
          >
            {project.deploymentType === 'vision' ? 'Vision Model' :
             project.deploymentType === 'llm' ? 'Large Language Model' :
             project.deploymentType === 'vision-llm' ? 'Vision LLM' : 
             project.deploymentType}
          </span>
        </div>
        <span 
          className={`font-medium text-sm ${getStatusStyle()}`}
        >
          {project.status}
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Model</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {project.model.toUpperCase()}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Framework</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {project.framework.charAt(0).toUpperCase() + project.framework.slice(1)}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500 dark:text-gray-400">Precision</span>
          <span className="font-medium text-gray-800 dark:text-gray-200">
            {project.precisionType}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center mt-4">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Created: {new Date(project.created_date).toLocaleDateString()}
        </p>
        
        <div className="flex items-center space-x-2">
          {/* Show View Logs button only when optimization is NOT completed */}
          {!isCompleted && (
            <button 
              onClick={() => setIsLogModalOpen(true)}
              className="text-sm text-primary-light hover:text-primary-dark"
            >
              View Logs
            </button>
          )}
          
          {/* Show download and delete buttons only when optimization is completed */}
          {isCompleted && (
            <>
              <button 
                onClick={handleDownload}
                disabled={isDownloading}
                className="p-2 text-green-500 hover:text-green-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                title="Download Model"
              >
                {isDownloading ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Download size={18} />
                )}
              </button>
              <button 
                onClick={handleDelete}
                disabled={isDeleting}
                className="p-2 text-red-500 hover:text-red-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                title="Delete Project"
              >
                {isDeleting ? (
                  <Loader size={18} className="animate-spin" />
                ) : (
                  <Trash2 size={18} />
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Optimization Logs Modal */}
      <OptimizationLogModal 
        logs={project.optimizationLogs || [
          { 
            stage: 'Initialization', 
            status: 'Started', 
            timestamp: new Date().toISOString(),
            details: 'Project optimization process initiated.'
          }
        ]} 
        isOpen={isLogModalOpen} 
        onClose={() => setIsLogModalOpen(false)} 
      />
    </div>
  );
};

export default EdgeDeploymentCard;