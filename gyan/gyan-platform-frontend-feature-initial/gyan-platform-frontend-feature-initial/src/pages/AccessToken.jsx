import React, { useState } from 'react';
import { Key, Plus, X } from 'lucide-react';

const AccessToken = () => {
  const [token, setToken] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const handleSaveToken = () => {
    if (tempToken.trim()) {
      setToken(tempToken);
      setIsAdding(false);
      setTempToken('');
    }
  };

  const handleAddNewToken = () => {
    if (token) {
      setShowDeleteDialog(true);
    } else {
      setIsAdding(true);
    }
  };

  const handleDeleteConfirm = () => {
    setToken('');
    setShowDeleteDialog(false);
    setIsAdding(true);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Access Token</h2>
        <button
          onClick={handleAddNewToken}
          className="flex items-center px-4 py-2 text-sm rounded-md bg-primary-light text-white hover:bg-primary-dark transition-colors"
        >
          <Plus size={16} className="mr-2" />
          Add Token
        </button>
      </div>

      <div className="space-y-4">
        {!isAdding && token && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Current Token
            </label>
            <div className="flex items-center space-x-2">
              <div className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 rounded-md">
                <div className="flex items-center space-x-2">
                  <Key size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white font-mono text-sm">
                    {token}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAdding && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              New Token
            </label>
            <div className="flex items-center space-x-2">
              <input
                type="text"
                value={tempToken}
                onChange={(e) => setTempToken(e.target.value)}
                placeholder="Enter your access token"
                className="flex-1 px-3 py-2 border rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-primary-light focus:border-primary-light outline-none"
              />
              <button
                onClick={handleSaveToken}
                disabled={!tempToken.trim()}
                className="px-4 py-2 bg-primary-light text-white rounded-md hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Custom Modal/Dialog for Delete Confirmation */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Delete Current Token?
              </h3>
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
              >
                <X size={20} />
              </button>
            </div>
            
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This action cannot be undone. This will permanently delete your current access token.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowDeleteDialog(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none"
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

export default AccessToken;