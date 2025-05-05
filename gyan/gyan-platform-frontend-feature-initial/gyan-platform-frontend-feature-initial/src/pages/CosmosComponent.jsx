import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/cosmos/Header';
import Navigation from '../components/cosmos/Navigation';
import InputContainer from '../components/cosmos/InputContainer';
import OutputContainer from '../components/cosmos/OutputContainer';
import cosmosApi from '../services/CosmosApiService';

const CosmosComponent = ({ modelType }) => {
  // Default prompts based on model type
  const defaultPrompts = {
    autoregressive: 'A first person view from the perspective of a robot worker in a modern factory setting.',
    diffusion: 'A first person view from the perspective from a human sized robot as it works in a chemical plant. The robot has many boxes and supplies nearby on the industrial shelves. The camera on moving forward, at a height of 1m above the floor. Photorealistic'
  };

  const [prompt, setPrompt] = useState('');
  const [selectedMode, setSelectedMode] = useState('text-to-world');
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelTitle, setModelTitle] = useState('');
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState('');
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Cleanup function for blob URLs
  useEffect(() => {
    return () => {
      // Clean up any created object URLs when component unmounts
      if (generatedVideoUrl && generatedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(generatedVideoUrl);
      }
    };
  }, [generatedVideoUrl]);

  useEffect(() => {
    // Set prompt and title based on model type
    if (modelType === 'autoregressive') {
      setPrompt(defaultPrompts.autoregressive);
      setModelTitle('Autoregressive-4b');
    } else if (modelType === 'diffusion') {
      setPrompt(defaultPrompts.diffusion);
      setModelTitle('Diffusion-7b');
    }
  }, [modelType]);

  const handleModeChange = (mode) => {
    setSelectedMode(mode);
    
    // Clean up previous video URL if it exists
    if (generatedVideoUrl && generatedVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedVideoUrl);
    }
    
    setGeneratedVideoUrl('');
    setError(null);
    setSelectedFile(null);
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    // Reset prompt based on model type when changing modes
    if (modelType === 'autoregressive') {
      setPrompt(defaultPrompts.autoregressive);
    } else {
      // For diffusion model
      setPrompt(defaultPrompts.diffusion);
    }
  };

  const handleFileChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    try {
      setIsGenerating(true);
      setError(null);
      
      // Clean up previous video URL if it exists
      if (generatedVideoUrl && generatedVideoUrl.startsWith('blob:')) {
        URL.revokeObjectURL(generatedVideoUrl);
        setGeneratedVideoUrl('');
      }

      // Create a unique video save name
      const videoSaveName = `cosmos_${modelType}_${Date.now()}`;
      
      // Prepare the form data based on model type and selected mode
      const formData = new FormData();
      formData.append('video_save_name', videoSaveName);

      // Set default parameters
      formData.append('top_p', '0.8');
      formData.append('temperature', '1.0');
      formData.append('offload_guardrail_models', 'false');
      formData.append('offload_diffusion_decoder', 'false');
      formData.append('offload_ar_model', 'false');
      formData.append('offload_tokenizer', 'false');
      formData.append('num_input_frames', '250');

      if (selectedMode === 'text-to-world') {
        // Text-to-World generation
        if (modelType === 'autoregressive') {
          // For autoregressive text2world, we need a media file (image or video)
          if (!selectedFile) {
            throw new Error('Please select an input image or video file');
          }
          
          formData.append('input_file', selectedFile);
          
          const videoUrl = await cosmosApi.generateAutoText2World(formData);
          setGeneratedVideoUrl(videoUrl);
        } else {
          // For diffusion text2world - prompt only
          formData.append('prompt', prompt);
          
          const videoUrl = await cosmosApi.generateDiffusionText2World(formData);
          setGeneratedVideoUrl(videoUrl);
        }
      } else {
        // Video-to-World generation - requires a prompt and an uploaded file
        if (!selectedFile) {
          throw new Error('Please select an input video file');
        }
        
        if (!prompt.trim()) {
          throw new Error('Please enter a caption for the video');
        }

        formData.append('input_file', selectedFile);
        formData.append('prompt', prompt);
        
        if (modelType === 'autoregressive') {
          formData.append('input_type', 'video');
          
          const videoUrl = await cosmosApi.generateAutoVideo2World(formData);
          setGeneratedVideoUrl(videoUrl);
        } else {
          // For diffusion video2world
          const videoUrl = await cosmosApi.generateDiffusionVideo2World(formData);
          setGeneratedVideoUrl(videoUrl);
        }
      }
    } catch (error) {
      console.error('Error generating content:', error);
      
      // Extract more useful error message if possible
      const errorMessage = cosmosApi.extractErrorMessage 
        ? cosmosApi.extractErrorMessage(error) 
        : (error.message || 'An error occurred during generation');
      
      setError(errorMessage);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    // Clean up previous video URL if it exists
    if (generatedVideoUrl && generatedVideoUrl.startsWith('blob:')) {
      URL.revokeObjectURL(generatedVideoUrl);
    }
    
    // Reset to default prompt for the current model type
    setPrompt(defaultPrompts[modelType] || '');
    setGeneratedVideoUrl('');
    setError(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-[#FFFFFF] text-[#111827] min-h-screen">
      <Header modelTitle={modelTitle} />
      <Navigation />
      
      <div className="flex flex-col md:flex-row">
        <InputContainer 
          prompt={prompt}
          setPrompt={setPrompt}
          selectedMode={selectedMode}
          handleModeChange={handleModeChange}
          handleReset={handleReset}
          handleSubmit={handleSubmit}
          isGenerating={isGenerating}
          modelType={modelType}
          modelTitle={modelTitle}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
          selectedFile={selectedFile}
        />
        
        <OutputContainer 
          isGenerating={isGenerating}
          modelType={modelType}
          generatedVideoUrl={generatedVideoUrl}
          error={error}
        />
      </div>
    </div>
  );
};

export default CosmosComponent;