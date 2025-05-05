import React from 'react';
import { Upload, Trash2, CornerDownLeft } from 'lucide-react';

const InputContainer = ({ 
  prompt, 
  setPrompt, 
  selectedMode, 
  handleModeChange, 
  handleReset, 
  handleSubmit, 
  isGenerating, 
  modelType,
  modelTitle,
  fileInputRef,
  handleFileChange,
  selectedFile
}) => {
  // Determine which inputs are needed based on model type and mode
  const showPromptInput = 
    (modelType === 'diffusion') || // Always show prompt for diffusion
    (modelType === 'autoregressive' && selectedMode === 'video-to-world'); // Only show for autoregressive in video-to-world mode
  
  const showFileUpload = 
    (modelType === 'autoregressive' && selectedMode === 'text-to-world') || // Required for autoregressive text-to-world
    (selectedMode === 'video-to-world'); // Required for any video-to-world mode
  
  // Determine accepted file types
  const acceptedFileTypes = selectedMode === 'video-to-world' 
    ? "video/*" 
    : "image/*,video/*";
  
  // File upload label text
  const fileUploadLabel = selectedMode === 'video-to-world' 
    ? "Upload Video" 
    : "Upload Image or Video";
  
  // File type hint text
  const fileTypeHint = selectedMode === 'video-to-world' 
    ? "MP4, MOV, or WebM up to 30MB" 
    : "PNG, JPG, JPEG, MP4, MOV, or WebM up to 30MB";

  return (
    <div className="w-full md:w-1/2 p-6 border-r border-gray-200">
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-4">Input</h2>
        
        {/* Mode Selection Tabs */}
        <div className="flex mb-4 border-b border-gray-200">
          <button
            className={`py-2 px-4 font-medium text-sm ${
              selectedMode === 'text-to-world' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleModeChange('text-to-world')}
          >
            Text to World
          </button>
          {/* <button
            className={`py-2 px-4 font-medium text-sm ${
              selectedMode === 'video-to-world' 
                ? 'text-blue-600 border-b-2 border-blue-600' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => handleModeChange('video-to-world')}
          >
            Video to World
          </button> */}
        </div>
        
        {/* Display input requirements for clarity */}
        <div className="mb-4 p-3 bg-blue-50 text-blue-700 rounded-lg text-sm">
          {modelType === 'autoregressive' && selectedMode === 'text-to-world' && (
            <p>Upload an image or video to generate content</p>
          )}
          {modelType === 'autoregressive' && selectedMode === 'video-to-world' && (
            <p>Enter a caption and upload a video to generate content</p>
          )}
          {modelType === 'diffusion' && selectedMode === 'text-to-world' && (
            <p>Enter a text prompt to generate content</p>
          )}
          {modelType === 'diffusion' && selectedMode === 'video-to-world' && (
            <p>Enter a caption and upload a video to generate content</p>
          )}
        </div>
        
        {/* Prompt Input Section - Only show when needed */}
        {showPromptInput && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {selectedMode === 'text-to-world' ? 'Text Prompt' : 'Video Caption'}
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full min-h-[200px] p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={`Enter your ${selectedMode === 'text-to-world' ? 'text prompt' : 'video caption'}...`}
            />
          </div>
        )}
        
        {/* File Upload Section - Show when needed */}
        {showFileUpload && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {fileUploadLabel}
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {selectedFile ? (
                <div className="flex flex-col items-center">
                  <div className="text-sm text-gray-800 mb-2">{selectedFile.name}</div>
                  <div className="text-xs text-gray-500 mb-4">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </div>
                  <button
                    onClick={() => {
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="flex items-center text-sm text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={16} className="mr-1" />
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-2 text-sm text-gray-600">
                    <label
                      htmlFor="file-upload"
                      className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500"
                    >
                      <span>Upload a file</span>
                      <input
                        id="file-upload"
                        name="file-upload"
                        type="file"
                        className="sr-only"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept={acceptedFileTypes}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">{fileTypeHint}</p>
                </>
              )}
            </div>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex justify-between mt-6">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={isGenerating}
          >
            Reset
          </button>
          <button
            onClick={handleSubmit}
            disabled={
              isGenerating || 
              (showFileUpload && !selectedFile) ||
              (showPromptInput && !prompt.trim())
            }
            className={`px-6 py-2 rounded-lg text-white flex items-center ${
              isGenerating || 
              (showFileUpload && !selectedFile) ||
              (showPromptInput && !prompt.trim())
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {isGenerating ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <CornerDownLeft size={18} className="mr-2" />
                Generate
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputContainer;