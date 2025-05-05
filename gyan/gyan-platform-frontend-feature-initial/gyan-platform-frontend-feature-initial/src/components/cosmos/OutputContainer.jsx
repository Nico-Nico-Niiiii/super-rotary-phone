import React from 'react';
import { Download, AlertCircle } from 'lucide-react';

const OutputContainer = ({ 
  isGenerating, 
  modelType, 
  generatedVideoUrl,
  error
}) => {
  const handleDownload = () => {
    if (generatedVideoUrl) {
      const a = document.createElement('a');
      a.href = generatedVideoUrl;
      a.download = `cosmos_${modelType}_${Date.now()}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div className="w-full md:w-1/2 p-6">
      <h2 className="text-lg font-semibold mb-4">Output</h2>
      
      <div className="bg-gray-50 border border-gray-200 rounded-lg min-h-[400px] flex flex-col items-center justify-center p-4">
        {isGenerating ? (
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 font-medium">Generating world state...</p>
            <p className="text-sm text-gray-500 mt-2">
              This may take a few moments. {modelType === 'diffusion' ? 'Diffusion models typically require more computation time.' : ''}
            </p>
          </div>
        ) : error ? (
          <div className="text-center text-red-500 max-w-md">
            <AlertCircle size={48} className="mx-auto mb-4" />
            <h3 className="font-medium mb-2">Generation Error</h3>
            <p className="text-sm">{error}</p>
          </div>
        ) : generatedVideoUrl ? (
          <div className="w-full max-w-md">
            <div className="relative pt-[56.25%] w-full rounded-lg overflow-hidden bg-black">
              <video 
                className="absolute top-0 left-0 w-full h-full object-contain"
                src={generatedVideoUrl} 
                controls
                loop
                autoPlay
              />
            </div>
            <div className="flex justify-center mt-4">
              <button
                onClick={handleDownload}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download size={18} className="mr-2" />
                Download Video
              </button>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 max-w-md">
            <p className="mb-2">No output generated yet</p>
            <p className="text-sm">
              {modelType === 'autoregressive' 
                ? 'Autoregressive models generate physically plausible world states frame by frame.'
                : 'Diffusion models create high-quality videos by gradually denoising random patterns.'}
            </p>
          </div>
        )}
      </div>

      {/* Output Information */}
      {generatedVideoUrl && !isGenerating && !error && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <h3 className="text-md font-medium mb-2">Generation Details</h3>
          <div className="text-sm text-gray-600 space-y-1">
            <p><span className="font-medium">Model:</span> {modelType === 'autoregressive' ? 'Autoregressive-4b' : 'Diffusion-7b'}</p>
            <p><span className="font-medium">Generation type:</span> Physics-aware world state simulation</p>
            <p><span className="font-medium">Resolution:</span> 512x512</p>
            <p><span className="font-medium">Generated at:</span> {new Date().toLocaleString()}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default OutputContainer;