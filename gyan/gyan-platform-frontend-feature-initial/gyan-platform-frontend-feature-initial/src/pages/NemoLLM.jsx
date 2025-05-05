import React from 'react'
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, History } from 'lucide-react';

import axios from 'axios';
import endpoints from '../endpoints.json';

const BASE_URL = import.meta.env.VITE_APP_API_URL

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});



const NemoLLM = () => {
 



const modelData = [
  {
    name: "Gyan/CodeLlama-7B",
    type: "LLM",
    description: "Code generation model based on CodeLlama with 7 billion parameters",
    source: "codellama/CodeLlama-7b-hf"
  },
  {
    name: "Gyan/Llama2-7B",
    type: "LLM",
    description: "Meta's Llama2 general model with 7 billion parameters",
    source: "meta-llama/Llama-2-7b"
  },
  {
    name: "Gyan/Llama3-8B",
    type: "LLM", 
    description: "Meta's latest Llama3 model with 8 billion parameters",
    source: "meta-llama/Meta-Llama-3-8B"
  },
  {
    name: "Gyan/Llama3.1-8B-instruct",
    type: "LLM",
    description: "Instruction-tuned version of Llama 3.1 with 8B parameters",
    source: "meta-llama/Llama-3.1-8B-Instruct"
  },
  {
    name: "Gyan/Mistral-7B",
    type: "LLM",
    description: "Open source 7B parameter model from Mistral AI",
    source: "mistralai/Mistral-7B-v0.1"
  },
  {
    name: "Gyan/MobileLLM-125M",
    type: "LLM",
    description: "Lightweight 125M parameter model optimized for mobile devices",
    source: "facebook/MobileLLM-125M"
  },
  {
    name: "Gyan/OPT-350M",
    type: "LLM",
    description: "Meta's OPT model with 350M parameters",
    source: "facebook/opt-350m"
  },
  {
    name: "Gyan/OPT-1.3B",
    type: "LLM",
    description: "Meta's OPT model with 1.3B parameters",
    source: "facebook/opt-1.3b"
  },
  {
    name: "Gyan/OPT-2.7B",
    type: "LLM",
    description: "Meta's OPT model with 2.7B parameters",
    source: "facebook/opt-2.7b"
  },
  {
    name: "Gyan/TinyLlama-1.1B",
    type: "LLM",
    description: "Efficient 1.1B parameter chat model",
    source: "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
  },
  {
    name: "Gyan/Yi-6B",
    type: "LLM",
    description: "6B parameter model from 01.ai",
    source: "01-ai/Yi-6B"
  },
  {
    name: "Gyan/PaliGemma",
    type: "Vision LLM",
    description: "Google's vision-language model with 3B parameters",
    source: "google/paligemma-3b-pt-224"
  }
];




const ModelCard = ({ name, description, type, source }) => {
  const navigate = useNavigate();

  const handleModelClick = () => {
    navigate(`/dashboard/foundation-models/${encodeURIComponent(name)}`);
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <h3 
            onClick={handleModelClick}
            className="text-lg font-semibold text-gray-900 dark:text-white hover:text-primary-light dark:hover:text-primary-light cursor-pointer transition-colors duration-200 group flex items-center"
          >
            {name}
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 ml-2">
              →
            </span>
          </h3>
          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-full w-fit">
            {type}
          </span>
        </div>
      </div>
      <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">{description}</p>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <div className="text-xs truncate max-w-[200px]">
          Source: {source}
        </div>
        <button 
          onClick={handleModelClick}
          className="px-3 py-1.5 text-primary-light hover:text-white hover:bg-primary-light rounded-lg transition-all duration-200"
        >
          View Details
        </button>
      </div>
    </div>
  );
};




  const [searchQuery, setSearchQuery] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  const filteredModels = modelData.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.type.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Nemo LLM Models</h2>
            <p className="text-gray-500 dark:text-gray-400 mt-1">Manage and monitor your Nemo models</p>
          </div>
       
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredModels.map((model, index) => (
          <ModelCard key={index} {...model} />
        ))}
      </div>
   
    </div>
  );
};


  


export default NemoLLM