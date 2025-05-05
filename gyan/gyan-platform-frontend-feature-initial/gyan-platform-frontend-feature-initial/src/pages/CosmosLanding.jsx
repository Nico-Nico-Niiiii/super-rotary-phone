import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Cpu, 
  BarChart2, 
  ArrowRight,
  Brain,
  VideoIcon
} from 'lucide-react';

// Import images - you'll need to replace these with your actual images
import cosmosImage from '../assets/images/cosmos.jpg';
import autoregressive from '../assets/images/auto.png';
import diffusion from '../assets/images/diffusion.jpg';


const CosmosLanding = () => {
  const navigate = useNavigate();
  
  const modelCards = [
    {
      title: 'Autoregressive-4b',
      icon: <Brain size={24} />,
      id: 'NVIDIA/Autoregressive-4b',
      image: autoregressive,
      path: 'autoregressive',
      description: 'Generate coherent text sequences through next-token prediction'
    },
    {
      title: 'Diffusion-7b',
      icon: <VideoIcon size={24} />,
      id: 'NVIDIA/Diffusion-7b',
      image: diffusion,
      path: 'diffusion',
      description: 'Physics-aware video generation from text and image prompts'
    }
  ];

  const keyFeatures = [
    {
      title: 'Physics-Aware Generation',
      description: 'Create video world states with realistic physics simulation for AI development',
      icon: <BarChart2 size={24} />
    },
    {
      title: 'Multi-Modal Input',
      description: 'Generate content from both text descriptions and image references',
      icon: <Cpu size={24} />
    }
  ];

  const handleModelSelect = (path) => {
    navigate(path, { relative: "route" });
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Cosmos</h2>
            <p className="text-gray-500 mt-1">Advanced AI models for generating physics-aware world states</p>
          </div>
        </div>
      </div>

      {/* Model Cards Section */}
      <div className="bg-gray-50 rounded-xl p-8 mb-8">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">Select a Model</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modelCards.map((model, index) => (
            <div 
              key={index}
              onClick={() => handleModelSelect(model.path)}
              className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer relative"
            >
              <div className="h-48 overflow-hidden">
                <img 
                  src={model.image} 
                  alt={model.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="text-[#00A3E0]">{model.icon}</div>
                  <div className="text-xs text-gray-500">{model.id}</div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2 group-hover:text-[#00A3E0] transition-colors duration-200">
                  {model.title}
                </h3>
                <p className="text-sm text-gray-600 mb-4">{model.description}</p>
                <div className="flex items-center space-x-2 text-[#00A3E0] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-sm">Launch Model</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Left Column - Image */}
        <div className="lg:col-span-1">
          <div className="rounded-xl overflow-hidden shadow-lg">
            <img 
              src={cosmosImage} 
              alt="Cosmos Platform Interface" 
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Right Column - Content */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Physics-Aware AI Models
            </h2>
            <p className="text-gray-600">
              Cosmos models generate realistic world states for physical AI development.
              With advanced simulation capabilities, you can create realistic videos and scenarios
              that adhere to physical laws and constraints, enabling more effective training and testing
              of AI systems in virtual environments.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {keyFeatures.map((feature) => (
              <div 
                key={feature.title}
                className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300"
              >
                <div className="flex items-start space-x-4">
                  <div className="text-[#00A3E0]">{feature.icon}</div>
                  <div>
                    <h3 className="font-semibold text-gray-800 mb-2">{feature.title}</h3>
                    <p className="text-sm text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CosmosLanding;