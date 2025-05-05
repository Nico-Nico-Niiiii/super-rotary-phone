import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { 
  MessageSquarePlus, Database, 
  ChevronDown, ChevronUp,
  Code, PlayCircle, ArrowUp, RotateCcw, X, Library
} from 'lucide-react';
import ChatInterface from './ChatInterface';
import LicenseModal from '../components/LicenseModal';

const MOCK_MODEL_DATA = {
  name: "BERT-Base-Uncased",
  version: "v1.0.0",
  description: "A pretrained BERT model for natural language understanding tasks.",
  metrics: {
    accuracy: 0.92,
    f1Score: 0.89,
    precision: 0.91,
    recall: 0.88
  },
  downloads: 15234,
  stars: 842,
  lastUpdated: "DD-MM-YYYY",
  license: "MIT",
  licenseDetails: {
    type: "MIT",
    text: `LLAMA 2 COMMUNITY LICENSE AGREEMENT	
    Llama 2 Version Release Date: July 18, 2023
    
    "Agreement" means the terms and conditions for use, reproduction, distribution and 
    modification of the Llama Materials set forth herein.
    
    "Documentation" means the specifications, manuals and documentation 
    accompanying Llama 2 distributed by Meta at ai.meta.com/resources/models-and-
    libraries/llama-downloads/.
    
    "Licensee" or "you" means you, or your employer or any other person or entity (if 
    you are entering into this Agreement on such person or entity's behalf), of the age 
    required under applicable laws, rules or regulations to provide legal consent and that 
    has legal authority to bind your employer or such other person or entity if you are 
    entering in this Agreement on their behalf.
    
    "Llama 2" means the foundational large language models and software and 
    algorithms, including machine-learning model code, trained model weights, 
    inference-enabling code, training-enabling code, fine-tuning enabling code and other 
    elements of the foregoing distributed by Meta at ai.meta.com/resources/models-and-
    libraries/llama-downloads/.
    
    "Llama Materials" means, collectively, Meta's proprietary Llama 2 and 
    Documentation (and any portion thereof) made available under this Agreement.
    
    "Meta" or "we" means Meta Platforms Ireland Limited (if you are located in or, if you 
    are an entity, your principal place of business is in the EEA or Switzerland) and Meta 
    Platforms, Inc. (if you are located outside of the EEA or Switzerland). 
    
    By clicking "I Accept" below or by using or distributing any portion or element of the 
    Llama Materials, you agree to be bound by this Agreement.
    
    1. License Rights and Redistribution. 
    
          a. Grant of Rights. You are granted a non-exclusive, worldwide, non-
    transferable and royalty-free limited license under Meta's intellectual property or 
    other rights owned by Meta embodied in the Llama Materials to use, reproduce, 
    distribute, copy, create derivative works of, and make modifications to the Llama 
    Materials.  
          
          b. Redistribution and Use.  
    
                i. If you distribute or make the Llama Materials, or any derivative works 
    thereof, available to a third party, you shall provide a copy of this Agreement to such 
    third party. 
                ii.  If you receive Llama Materials, or any derivative works thereof, from 
    a Licensee as part of an integrated end user product, then Section 2 of this 
    Agreement will not apply to you. 
    
                iii. You must retain in all copies of the Llama Materials that you 
    distribute the following attribution notice within a "Notice" text file distributed as a 
    part of such copies: "Llama 2 is licensed under the LLAMA 2 Community License, 
    Copyright (c) Meta Platforms, Inc. All Rights Reserved."
    
                iv. Your use of the Llama Materials must comply with applicable laws 
    and regulations (including trade compliance laws and regulations) and adhere to the 
    Acceptable Use Policy for the Llama Materials (available at 
    https://ai.meta.com/llama/use-policy), which is hereby incorporated by reference into 
    this Agreement.
    
                v. You will not use the Llama Materials or any output or results of the 
    Llama Materials to improve any other large language model (excluding Llama 2 or 
    derivative works thereof).  
    
    2. Additional Commercial Terms. If, on the Llama 2 version release date, the 
    monthly active users of the products or services made available by or for Licensee, 
    or Licensee's affiliates, is greater than 700 million monthly active users in the 
    preceding calendar month, you must request a license from Meta, which Meta may 
    grant to you in its sole discretion, and you are not authorized to exercise any of the 
    rights under this Agreement unless or until Meta otherwise expressly grants you 
    such rights.
                
    3. Disclaimer of Warranty. UNLESS REQUIRED BY APPLICABLE LAW, THE 
    LLAMA MATERIALS AND ANY OUTPUT AND RESULTS THEREFROM ARE 
    PROVIDED ON AN "AS IS" BASIS, WITHOUT WARRANTIES OF ANY KIND, 
    EITHER EXPRESS OR IMPLIED, INCLUDING, WITHOUT LIMITATION, ANY 
    WARRANTIES OF TITLE, NON-INFRINGEMENT, MERCHANTABILITY, OR 
    FITNESS FOR A PARTICULAR PURPOSE. YOU ARE SOLELY RESPONSIBLE 
    FOR DETERMINING THE APPROPRIATENESS OF USING OR REDISTRIBUTING 
    THE LLAMA MATERIALS AND ASSUME ANY RISKS ASSOCIATED WITH YOUR 
    USE OF THE LLAMA MATERIALS AND ANY OUTPUT AND RESULTS.
    
    4. Limitation of Liability. IN NO EVENT WILL META OR ITS AFFILIATES BE 
    LIABLE UNDER ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, TORT, 
    NEGLIGENCE, PRODUCTS LIABILITY, OR OTHERWISE, ARISING OUT OF THIS 
    AGREEMENT, FOR ANY LOST PROFITS OR ANY INDIRECT, SPECIAL, 
    CONSEQUENTIAL, INCIDENTAL, EXEMPLARY OR PUNITIVE DAMAGES, EVEN 
    IF META OR ITS AFFILIATES HAVE BEEN ADVISED OF THE POSSIBILITY OF 
    ANY OF THE FOREGOING.
     
    5. Intellectual Property.
    
          a. No trademark licenses are granted under this Agreement, and in 
    connection with the Llama Materials, neither Meta nor Licensee may use any name 
    or mark owned by or associated with the other or any of its affiliates, except as 
    required for reasonable and customary use in describing and redistributing the 
    Llama Materials.
    
          b. Subject to Meta's ownership of Llama Materials and derivatives made by or 
    for Meta, with respect to any derivative works and modifications of the Llama 
    Materials that are made by you, as between you and Meta, you are and will be the 
    owner of such derivative works and modifications.
    
          c. If you institute litigation or other proceedings against Meta or any entity 
    (including a cross-claim or counterclaim in a lawsuit) alleging that the Llama 
    Materials or Llama 2 outputs or results, or any portion of any of the foregoing, 
    constitutes infringement of intellectual property or other rights owned or licensable 
    by you, then any licenses granted to you under this Agreement shall terminate as of 
    the date such litigation or claim is filed or instituted. You will indemnify and hold 
    harmless Meta from and against any claim by any third party arising out of or related 
    to your use or distribution of the Llama Materials.
    
    6. Term and Termination. The term of this Agreement will commence upon your 
    acceptance of this Agreement or access to the Llama Materials and will continue in 
    full force and effect until terminated in accordance with the terms and conditions 
    herein. Meta may terminate this Agreement if you are in breach of any term or 
    condition of this Agreement. Upon termination of this Agreement, you shall delete 
    and cease use of the Llama Materials. Sections 3, 4 and 7 shall survive the 
    termination of this Agreement. 
    
    7. Governing Law and Jurisdiction. This Agreement will be governed and 
    construed under the laws of the State of California without regard to choice of law 
    principles, and the UN Convention on Contracts for the International Sale of Goods 
    does not apply to this Agreement. The courts of California shall have exclusive 
    jurisdiction of any dispute arising out of this Agreement. `,
        url: `/licenses/mit-license.txt`
  },
  framework: "PyTorch",
  size: "445MB",
  parameters: "",
  tags: ["NLP", "Transformer", "BERT", "Text Classification"]
};

const MOCK_RAG_OPTIONS = [
  { id: 1, name: "Wikipedia Dataset" },
  { id: 2, name: "Scientific Papers" },
  { id: 3, name: "Code Documentation" },
  { id: 4, name: "Technical Manuals" }
];

const MOCK_PROMPT_OPTIONS = [
  { id: 1, name: "Text Classification" },
  { id: 2, name: "Named Entity Recognition" },
  { id: 3, name: "Question Answering" },
  { id: 4, name: "Sentiment Analysis" }
];

const MOCK_PROMPT_LIBRARY = [
  { id: 1, name: "General Prompts" },
  { id: 2, name: "Technical Documentation" },
  { id: 3, name: "Creative Writing" },
  { id: 4, name: "Data Analysis" }
];


const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg p-6 w-96">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-300"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

const ModelDetails = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [showRagPopup, setShowRagPopup] = useState(false);
  const [showPromptPopup, setShowPromptPopup] = useState(false);
  const [showPromptLibPopup, setShowPromptLibPopup] = useState(false);
  const [selectedRag, setSelectedRag] = useState(null);
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [selectedPromptLib, setSelectedPromptLib] = useState(null);
  const [tempRagSelection, setTempRagSelection] = useState(null);
  const [tempPromptSelection, setTempPromptSelection] = useState(null);
  const [tempPromptLibSelection, setTempPromptLibSelection] = useState(null);
  const [isMetricsOpen, setIsMetricsOpen] = useState(true);
  const [isConfigOpen, setIsConfigOpen] = useState(true);
  const [isModelInfoOpen, setIsModelInfoOpen] = useState(true);
  const location = useLocation();
  const modelName = location.state?.modelName || "Unknown Model";
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const modelLicense = location.state?.license || {
    type: "MIT",
    text: "Default MIT License text...",
    url: "/licenses/default-license.txt"
  };

  return (
    <div className="min-h-screen bg-[#F7F8FC] dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              {modelName}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Version {MOCK_MODEL_DATA.version}
            </p>
          </div>
          <div className="flex gap-2">
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        <div className="grid grid-cols-12 gap-4">
          {/* Chat section - 70% width */}
          <div className="col-span-8">
            <ChatInterface />
          </div>

          {/* Right section - 30% width */}
          <div className="col-span-4 space-y-4">
            {/* Configuration section */}
            <div className="bg-white dark:bg-gray-800 rounded-md p-3">
              <button 
                onClick={() => setIsConfigOpen(!isConfigOpen)}
                className="w-full flex justify-between items-center text-base font-semibold text-gray-900 dark:text-black mb-3"
              >
                <span>Configuration</span>
                {isConfigOpen ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </button>
              
              {isConfigOpen && (
                <div className="space-y-3">
                  {/* RAG Dataset section */}
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedRag ? 'Selected RAG' : 'RAG Dataset'}
                    </label>
                    {selectedRag ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs rounded-full">
                        <span>{selectedRag.name}</span>
                        <button
                          onClick={() => setSelectedRag(null)}
                          className="hover:bg-orange-200 dark:hover:bg-orange-900/50 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowRagPopup(true)}
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-orange-500 text-white rounded-md hover:bg-orange-600 text-xs"
                      >
                        <Database size={14} />
                        Add RAG
                      </button>
                    )}
                  </div>

                  {/* Prompt Template section */}
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedPrompt ? 'Selected Prompt' : 'Prompt Template'}
                    </label>
                    {selectedPrompt ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 text-xs rounded-full">
                        <span>{selectedPrompt.name}</span>
                        <button
                          onClick={() => setSelectedPrompt(null)}
                          className="hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowPromptPopup(true)}
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-500 text-white rounded-md hover:bg-indigo-600 text-xs"
                      >
                        <MessageSquarePlus size={14} />
                        Add Prompt
                      </button>
                    )}
                  </div>

                  {/* Prompt Library section */}
                  <div className="flex justify-between items-center">
                    <label className="text-xs text-gray-500 dark:text-gray-400">
                      {selectedPromptLib ? 'Selected Library' : 'Prompt Library'}
                    </label>
                    {selectedPromptLib ? (
                      <div className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 text-xs rounded-full">
                        <span>{selectedPromptLib.name}</span>
                        <button
                          onClick={() => setSelectedPromptLib(null)}
                          className="hover:bg-purple-200 dark:hover:bg-purple-900/50 rounded-full p-0.5 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => setShowPromptLibPopup(true)}
                        className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500 text-white rounded-md hover:bg-purple-600 text-xs"
                      >
                        <Library size={14} />
                        Add Library
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Model Information section */}
            <div className="bg-white dark:bg-gray-800 rounded-md p-3">
            <button 
              onClick={() => setIsModelInfoOpen(!isModelInfoOpen)}
              className="w-full flex justify-between items-center text-base font-semibold text-gray-900 dark:text-white mb-3"
            >
              <span>Model Information</span>
              {isModelInfoOpen ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
  
          {isModelInfoOpen && (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Framework</label>
                <p className="text-sm text-gray-900 dark:text-white">{MOCK_MODEL_DATA.framework}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Description</label>
                <p className="text-sm text-gray-900 dark:text-white mt-0.5">{MOCK_MODEL_DATA.description}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Size</label>
                <p className="text-sm text-gray-900 dark:text-white">{MOCK_MODEL_DATA.size}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Parameters</label>
                <p className="text-sm text-gray-900 dark:text-white">{MOCK_MODEL_DATA.parameters}</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">License</label>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowLicenseModal(true)}
                    className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-2"
                  >
                    <span>{location.state?.license?.type || MOCK_MODEL_DATA.license}</span>
                    <span className="text-xs text-gray-500">(Click to view)</span>
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Tags</label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {MOCK_MODEL_DATA.tags.map((tag, index) => (
                    <span 
                      key={index}
                      className="px-1.5 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400">Last Updated</label>
                <p className="text-sm text-gray-900 dark:text-white">{MOCK_MODEL_DATA.lastUpdated}</p>
              </div>
            </div>
          )}
        </div>
          </div>
        </div>
      </div>

      <LicenseModal
        isOpen={showLicenseModal}
        onClose={() => setShowLicenseModal(false)}
        license={location.state?.license || {
          type: MOCK_MODEL_DATA.license,
          text: `License text for ${MOCK_MODEL_DATA.license}...`, // Add actual license text here
          url: `/licenses/${MOCK_MODEL_DATA.license.toLowerCase()}-license.txt`
        }}
        data={MOCK_MODEL_DATA.licenseDetails}
      />

      {/* RAG Modal */}
      <Modal 
        isOpen={showRagPopup}
        onClose={() => {
          setShowRagPopup(false);
          setTempRagSelection(null);
        }}
        title="Select RAG Dataset"
      >
        <div className="space-y-4">
          <select
            value={tempRagSelection?.id || ''}
            onChange={(e) => {
              const selected = MOCK_RAG_OPTIONS.find(opt => opt.id === Number(e.target.value));
              setTempRagSelection(selected);
            }}
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a dataset</option>
            {MOCK_RAG_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowRagPopup(false);
                setTempRagSelection(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSelectedRag(tempRagSelection);
                setShowRagPopup(false);
                setTempRagSelection(null);
              }}
              disabled={!tempRagSelection}
              className={`px-4 py-2 text-white rounded-lg ${
                tempRagSelection 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Prompt Modal */}
      <Modal 
        isOpen={showPromptPopup}
        onClose={() => {
          setShowPromptPopup(false);
          setTempPromptSelection(null);
        }}
        title="Select Prompt Template"
      >
        <div className="space-y-4">
          <select
            value={tempPromptSelection?.id || ''}
            onChange={(e) => {
              const selected = MOCK_PROMPT_OPTIONS.find(opt => opt.id === Number(e.target.value));
              setTempPromptSelection(selected);
            }}
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a template</option>
            {MOCK_PROMPT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowPromptPopup(false);
                setTempPromptSelection(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSelectedPrompt(tempPromptSelection);
                setShowPromptPopup(false);
                setTempPromptSelection(null);
              }}
              disabled={!tempPromptSelection}
              className={`px-4 py-2 text-white rounded-lg ${
                tempPromptSelection 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>

      {/* Prompt Library Modal */}
      <Modal 
        isOpen={showPromptLibPopup}
        onClose={() => {
          setShowPromptLibPopup(false);
          setTempPromptLibSelection(null);
        }}
        title="Select Prompt Library"
      >
        <div className="space-y-4">
          <select
            value={tempPromptLibSelection?.id || ''}
            onChange={(e) => {
              const selected = MOCK_PROMPT_LIBRARY.find(opt => opt.id === Number(e.target.value));
              setTempPromptLibSelection(selected);
            }}
            className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            <option value="">Select a library</option>
            {MOCK_PROMPT_LIBRARY.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setShowPromptLibPopup(false);
                setTempPromptLibSelection(null);
              }}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                setSelectedPromptLib(tempPromptLibSelection);
                setShowPromptLibPopup(false);
                setTempPromptLibSelection(null);
              }}
              disabled={!tempPromptLibSelection}
              className={`px-4 py-2 text-white rounded-lg ${
                tempPromptLibSelection 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
              }`}
            >
              Confirm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ModelDetails;