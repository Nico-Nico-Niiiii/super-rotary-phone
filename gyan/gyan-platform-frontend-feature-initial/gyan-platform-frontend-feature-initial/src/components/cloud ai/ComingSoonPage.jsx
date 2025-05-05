import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Calendar, Mail, Bell } from 'lucide-react';

const ComingSoonPage = () => {
  const { provider } = useParams(); // This will capture the cloud provider from URL if needed
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  
  // Get provider details based on the URL parameter
  const getProviderDetails = () => {
    if (!provider) return {
      name: "Cloud AI",
      description: "Connect to powerful cloud AI services for enterprise-grade solutions.",
      features: ["Seamless integration", "Enterprise support", "High availability"]
    };
    
    switch(provider.toLowerCase()) {
      case 'nemo-llm': 
        return {
          name: "NVIDIA NeMo LLM",
          description: "NVIDIA NeMo LLM is a powerful framework for building, customizing and deploying generative AI models at scale.",
          features: [
            "Pre-trained large language models", 
            "Production-ready container deployments", 
            "Enterprise-grade reliability",
            "Low-latency inference"
          ]
        };
      case 'bedrock': 
        return {
          name: "AWS Bedrock",
          description: "Amazon Bedrock is a fully managed service that makes foundation models from leading AI companies available through a unified API.",
          features: [
            "Access to top foundation models", 
            "Serverless infrastructure", 
            "Enterprise security features",
            "Customization options"
          ]
        };
      case 'google-vertex': 
        return {
          name: "Google Vertex AI",
          description: "Google Vertex AI brings together the Google Cloud services for building ML under one unified UI and API.",
          features: [
            "Pre-trained and custom ML models", 
            "End-to-end MLOps", 
            "Integrated with Google's AI ecosystem",
            "Streamlined workflows"
          ]
        };
      default: 
        return {
          name: provider.charAt(0).toUpperCase() + provider.slice(1),
          description: "Cloud AI service integration coming soon.",
          features: ["Stay tuned for more details"]
        };
    }
  };
  
  const providerDetails = getProviderDetails();
  
  const handleEmailSubmit = (e) => {
    e.preventDefault();
    // Here you would typically send this to your backend
    console.log("Email submitted:", email);
    setIsSubmitted(true);
    setEmail('');
    
    // Reset the success message after 5 seconds
    setTimeout(() => {
      setIsSubmitted(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center">
      {/* Decorative top banner */}
      <div className="w-full max-w-3xl h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-t-lg mb-8"></div>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl p-8 w-full max-w-3xl relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-primary-light/5 rounded-full -mt-20 -mr-20"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full -mb-16 -ml-16"></div>
        
        {/* Label */}
        <div className="bg-primary-light/10 text-primary-light font-semibold px-4 py-1 rounded-full inline-block mb-4">
          Coming Soon
        </div>
        
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
          {providerDetails.name} Integration
        </h1>
        
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
          {providerDetails.description}
        </p>
        
        {/* Feature highlights */}
        <div className="border-t border-b border-gray-200 dark:border-gray-700 py-6 mb-8">
          <h3 className="font-semibold text-gray-800 dark:text-gray-100 mb-4 text-left">Key Features</h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
            {providerDetails.features.map((feature, index) => (
              <li key={index} className="flex items-center">
                <div className="p-1 bg-green-100 dark:bg-green-900/30 rounded-full mr-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600 dark:text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                {feature}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="flex items-start space-x-4 mb-8">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div className="text-left">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Expected Launch</h3>
            <p className="text-gray-600 dark:text-gray-400">Q2 2025</p>
          </div>
        </div>
        
        {/* Notification signup */}
        <div className="p-6 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <div className="flex items-center mb-4">
            <Bell className="text-primary-light mr-2" size={20} />
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">Get Notified When It's Ready</h3>
          </div>
          
          <form onSubmit={handleEmailSubmit} className="flex flex-col sm:flex-row gap-3">
            <input 
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:bg-gray-800"
              required
            />
            <button 
              type="submit"
              className="px-6 py-2 bg-primary-light text-white rounded-lg hover:bg-primary-light/90 transition-colors"
            >
              Notify Me
            </button>
          </form>
          
          {isSubmitted && (
            <div className="mt-3 p-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-sm">
              Thanks! You've been added to our newsletter for updates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ComingSoonPage;