import React, { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ZoomIn, ZoomOut, RotateCcw, Maximize, MoreHorizontal, Plus, Home, Box, HelpCircle, Settings, MessageSquare, Search, ArrowLeft, ChevronRight, X } from 'lucide-react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AgentInfoModal from './AgentInfoModal';
import AgentExecutions from './AgentExecutions';
import endpoints from '../../endpoints.json';
import axios from 'axios';
const BASE_URL = import.meta.env.VITE_APP_API_URL
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

const N8nWorkflowDashboard = () => {
  const [activeTab, setActiveTab] = useState('Editor');
  const [nodes, setNodes] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const canvasRef = useRef(null);
  
  // State for sidebar management
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarType, setSidebarType] = useState(''); 
  const [sidebarTitle, setSidebarTitle] = useState('');
  const [selectedNode, setSelectedNode] = useState(null);
  
  // State for first time canvas (empty state)
  const [isFirstStep, setIsFirstStep] = useState(true);

  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [currentAgentProId, setCurrentAgentProId] = useState(null);
  const [hoverNode, setHoverNode] = useState(null);

  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const projectData = location.state?.projectData;
  const [agentProId, setAgentProId] = useState(location.state?.agentProId || '');
  const [agentProjectName, setAgentProjectName] = useState(projectData?.agent_project_name || 'New Agent Project');
  const [framework, setFramework] = useState(projectData?.framework || '');
  const [loading, setLoading] = useState(!projectData);


  const [initialData, setInitialData] = useState({
    agent_flow: "",
    agent_pro_id: "",
    agent_project_name: "",
    framework: "",
    project_id: null,
    project_name: "",
    system_prompt: "",
  });




  // Node types catalog
  const agentTypes = [
    { id: 'research-agent', title: 'Research Agent', description: 'Conducts research tasks and analyzes information', icon: 'search' },
    { id: 'chat-agent', title: 'Chat Agent', description: 'Handles conversation and user interactions', icon: 'message-square' },
    { id: 'task-agent', title: 'Task Agent', description: 'Completes specific tasks based on instructions', icon: 'check-square' },
    { id: 'memory-agent', title: 'Memory Agent', description: 'Manages context and memory for other agents', icon: 'database' },
    { id: 'planner-agent', title: 'Planner Agent', description: 'Creates plans and coordinates other agents', icon: 'clipboard' }
  ];
  
  const llmTypes = [
    { id: 'gpt-4', title: 'GPT-4', description: 'OpenAI\'s advanced large language model' },
    { id: 'claude-3-sonnet', title: 'Claude 3 Sonnet', description: 'Balanced performance and efficiency' },
    { id: 'llama-3', title: 'Llama 3', description: 'Meta\'s open large language model' },
    { id: 'mistral-large', title: 'Mistral Large', description: 'Powerful model with great reasoning capabilities' },
    { id: 'gemini-pro', title: 'Gemini Pro', description: 'Google\'s advanced multimodal model' }
  ];
  
  const toolTypes = [
    { id: 'web-search', title: 'Web Search', description: 'Search the internet for information' },
    { id: 'tavily_search', title: 'Tavily Search', description: 'Search the internet for information' },
    { id: 'code-interpreter', title: 'Code Interpreter', description: 'Execute code snippets and analyze data' },
    { id: 'database-query', title: 'Database Query', description: 'Query databases and retrieve information' },
    { id: 'pdf-reader', title: 'PDF Reader', description: 'Extract and analyze content from PDF documents' },
    { id: 'calculator', title: 'Calculator', description: 'Perform mathematical calculations' },
    { id: 'knowledge-base', title: 'Knowledge Base', description: 'Access internal knowledge base' }
  ];
  
  const conditionTypes = [
    { id: 'if-condition', title: 'If Condition', description: 'Route flow based on condition evaluation' },
    { id: 'switch', title: 'Switch', description: 'Route flow based on multiple possible values' }
  ];
  
  const flowTypes = {
    'Single Agent': agentTypes.slice(0, 1),
    'Sequential Multiple Agent': agentTypes,
    'Parallel Agent': agentTypes
  };
  // Helper function to check if node has agent info
  const hasAgentInfo = (node) => {
    return node && node.agentInfo && Object.keys(node.agentInfo).length > 0;
  };

  useEffect(() => {
    fetchProjectData();
  },[])


  const fetchProjectData = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `${endpoints.agentProjects.prefix}${endpoints.agentProjects.routes.get.replace('{project_id}', id)}`
      );

      console.log("Response from project", response.data);

      if (response.data) {
        setInitialData({
          agent_flow: response.data.agent_flow || "",
          agent_pro_id: response.data.agent_pro_id || "",
          agent_project_name: response.data.agent_project_name || "",
          framework: response.data.framework || "",
          project_id: response.data.project_id || null,
          project_name: response.data.project_name || "",
          system_prompt: response.data.system_prompt || "",
        });}
      
      
      if (response.data) {
        setAgentProId(response.data.agent_pro_id);
        setAgentProjectName(response.data.agent_project_name);
        setFramework(response.data.framework);
      }
    } catch (error) {
      console.error('Error fetching project data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we don't have project data from location state, fetch it
    if (!projectData && id) {
      const fetchProjectData = async () => {
        try {
          setLoading(true);
          const response = await api.get(
            `${endpoints.agentProjects.prefix}${endpoints.agentProjects.routes.get.replace('{project_id}', id)}`
          );

          console.log("Response from project", response.data);
          
          
          if (response.data) {
            setAgentProId(response.data.agent_pro_id);
            setAgentProjectName(response.data.agent_project_name);
            setFramework(response.data.framework);
          }
        } catch (error) {
          console.error('Error fetching project data:', error);
        } finally {
          setLoading(false);
        }
      };
      
      fetchProjectData();
    }
  }, [id, projectData]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const returnedFromForm = params.get('formSubmitted');
    const nodeId = params.get('nodeId');
    
    // Ensure we have the necessary conditions to proceed
    if (returnedFromForm === 'true' && nodeId && agentProId) {
      const refreshWorkflowAfterSubmission = async () => {
        try {
          // 1. Fetch the latest agent info for the specific node
          const agentInfoResponse = await api.get(`/api/agent-info/node/${nodeId}`);
          
          if (!agentInfoResponse.data || !agentInfoResponse.data.success) {
            console.error('No agent info found for node:', nodeId);
            return;
          }
          
          const agentInfo = agentInfoResponse.data.agent_info;
          
          // 2. Fetch the full workflow to ensure we have the latest state
          const workflowResponse = await api.get(`/api/agent-workflows/${agentProId}`);
          
          if (!workflowResponse.data || !workflowResponse.data.nodes) {
            console.error('Failed to load workflow');
            return;
          }
          
          // 3. Create updated nodes with the new agent info
          const updatedNodes = workflowResponse.data.nodes.map(node => {
            if (node.id === nodeId) {
              return {
                ...node,
                agentInfo: agentInfo,
                title: agentInfo.agent_name || node.title,
                subtitle: agentInfo.role || node.subtitle
              };
            }
            return node;
          });
          
          // 4. Update nodes and connections
          setNodes(prevNodes => {
            // If the node is not in the existing nodes, add it
            const existingNodeIds = prevNodes.map(n => n.id);
            const nodesToSet = existingNodeIds.includes(nodeId) 
              ? updatedNodes 
              : [...prevNodes, ...updatedNodes.filter(n => n.id === nodeId)];
            
            return nodesToSet;
          });
          
          setConnections(workflowResponse.data.connections || []);
          
          // 5. Select the updated node
          const updatedNode = updatedNodes.find(n => n.id === nodeId);
          if (updatedNode) {
            setSelectedNode(updatedNode);
            setIsFirstStep(false); // Ensure we're not in first step
          }
          
          // 6. Save the updated workflow
          await api.post(`/api/agent-workflows/save/${agentProId}`, {
            agent_pro_id: agentProId,
            nodes: updatedNodes,
            connections: workflowResponse.data.connections || []
          });
          
          // 7. Clean up navigation parameters
          navigate(location.pathname, { replace: true });
          
          console.log('Workflow updated successfully after agent configuration');
        } catch (error) {
          console.error('Error updating workflow after form submission:', error);
        }
      };
      
      // Execute the refresh
      refreshWorkflowAfterSubmission();
    }
  }, [
    location.search, 
    agentProId, 
    navigate, 
    location.pathname
  ]);

  // Also update the main workflow loading function
  useEffect(() => {
    if (agentProId) {
      const loadWorkflow = async () => {
        try {
          console.log("Loading initial workflow data");
          const response = await api.get(`/api/agent-workflows/${agentProId}`);
          
          if (response.data && response.data.nodes && response.data.connections) {
            // Process nodes to ensure they have proper visualization properties
            const processedNodes = await Promise.all(response.data.nodes.map(async node => {
              // For agent nodes, try to load agent info
              if (node.type?.includes('agent')) {
                try {
                  // Try to get agent info for this node
                  const agentInfoResponse = await api.get(`/api/agent-info/node/${node.id}`);
                  
                  if (agentInfoResponse.data && agentInfoResponse.data.success) {
                    const agentInfo = agentInfoResponse.data.agent_info;
                    console.log(`Found agent info for node ${node.id}:`, agentInfo);
                    
                    return {
                      ...node,
                      agentInfo: agentInfo,
                      title: agentInfo.agent_name,
                      subtitle: agentInfo.role || ""
                    };
                  }
                } catch (error) {
                  console.log(`No agent info found for node ${node.id}`);
                }
              }
              
              // If we get here, either it's not an agent node or we couldn't find agent info
              return node;
            }));
            
            console.log("Processed nodes:", processedNodes);
            setNodes(processedNodes);
            setConnections(response.data.connections);
            
            // If there are nodes, we're not in first step anymore
            if (processedNodes.length > 0) {
              setIsFirstStep(false);
            }
          }
        } catch (error) {
          console.error('Error loading workflow:', error);
        }
      };
      
      loadWorkflow();
    }
  }, [agentProId]); 

 


  // Replace existing modal with direct navigation
  const handleOpenAgentModal = (nodeId) => {
    const node = nodes.find(n => n.id === nodeId);
    if (node) {
      // Open the modal with the current node's data
      setSelectedNode(node);
      setIsAgentModalOpen(true);
    }
  };

  
  const handleAgentInfoSubmit = (agentData) => {
    if (selectedNode) {
      // Update the specific node with new agent information
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            agentInfo: agentData,
            title: agentData.agent_name || node.title,
            subtitle: agentData.role || '',
          };
        }
        return node;
      });
  
      // Update local state
      setNodes(updatedNodes);
      
      // Close the modal
      setIsAgentModalOpen(false);
      
      // Optionally, reset the selected node
      setSelectedNode(null);
    }
  };

  // Handle first node or add node placement
  const handleAddFirstNode = () => {
    setIsFirstStep(false);
    setSidebarType('agent-select');
    setSidebarTitle('Select Agent Type');
    setIsSidebarOpen(true);
  };
  
  // Handle node selection from sidebar
  const handleNodeSelection = (nodeType, nodeData) => {
    // Close sidebar
    setIsSidebarOpen(false);
    
    // Create the new node
    const newNodeId = `${nodeType}-${Date.now()}`;
    let newNode = {
      id: newNodeId,
      type: nodeType,
      position: { x: 400, y: 300 }, // Default position in center of canvas
      title: nodeData.title,
      subtitle: '',
      data: nodeData
    };
    
    if (nodeType.includes('agent')) {
      newNode.title = nodeData.title;
      newNode.subtitle = '';
      
      // If there's a selected node, position the new node appropriately
      if (selectedNode) {
        newNode.position = { 
          x: selectedNode.position.x + 200, 
          y: selectedNode.position.y 
        };
      }
    } else if (nodeType === 'if-condition') {
      newNode.title = 'If';
      newNode.subtitle = '';
      
      // If there's a selected node, position the new node appropriately
      if (selectedNode) {
        newNode.position = { 
          x: selectedNode.position.x + 200, 
          y: selectedNode.position.y 
        };
      }
    } else if (nodeType.includes('llm')) {
      // For model nodes, set properties and position below the parent
      newNode.title = nodeData.title;
      newNode.toolName = 'LLM';
      newNode.toolSubtitle = nodeData.title;
      newNode.parentId = selectedNode?.id;
      
      // Position below the parent node
      if (selectedNode) {
        newNode.position = {
          x: selectedNode.position.x - 75,
          y: selectedNode.position.y + 180
        };
      }
    } else if (nodeType.includes('tool')) {
      // For tool nodes, set properties and position below the parent
      newNode.title = nodeData.title;
      newNode.toolName = 'Tool';
      newNode.toolSubtitle = nodeData.title;
      newNode.parentId = selectedNode?.id;
      
      // Position below the parent node
      if (selectedNode) {
        newNode.position = {
          x: selectedNode.position.x + 75,
          y: selectedNode.position.y + 180
        };
      }
    }
    
    // Add the new node
    setNodes(prevNodes => [...prevNodes, newNode]);
    
    // If there is a selected node, create a connection
    if (selectedNode) {
      if (nodeType.includes('agent') || nodeType === 'if-condition') {
        // Connect from selectedNode to new agent or If condition
        setConnections(prevConnections => [
          ...prevConnections,
          { source: selectedNode.id, target: newNodeId }
        ]);
      } else if (['llm', 'tool'].some(t => nodeType.includes(t))) {
        // Create appropriate connection for tools and LLMs
        const connectionType = nodeType.includes('llm') ? 'llm' : 'tool';
        
        // Add dashed line connection
        setConnections(prevConnections => [
          ...prevConnections,
          { 
            source: selectedNode.id, 
            target: newNodeId,
            type: connectionType,
            dashed: true
          }
        ]);
      }
    }
  };

  // Handle delete node functionality
  const handleDeleteNode = (nodeId) => {
    // Get the node to be deleted
    const nodeToDelete = nodes.find(node => node.id === nodeId);
    
    if (!nodeToDelete) return;
    
    // 1. Remove the node itself
    let updatedNodes = nodes.filter(node => node.id !== nodeId);
    
    // 2. Remove all connections involving this node
    let updatedConnections = connections.filter(
      conn => conn.source !== nodeId && conn.target !== nodeId
    );
    
    // 3. If this is a parent node that has children nodes attached
    // Also remove any child nodes that belong to this parent
    if (nodeToDelete.type?.includes('agent')) {
      // Find all child nodes of this agent and remove them
      const childNodeIds = nodes
        .filter(node => node.parentId === nodeId)
        .map(node => node.id);
      
      // Remove child nodes
      updatedNodes = updatedNodes.filter(node => !childNodeIds.includes(node.id));
      
      // Remove connections to child nodes
      updatedConnections = updatedConnections.filter(
        conn => !childNodeIds.includes(conn.source) && !childNodeIds.includes(conn.target)
      );
    }
    
    // 4. If removing the last node, show the "Add first step" UI
    if (updatedNodes.length === 0) {
      setIsFirstStep(true);
    }
    
    // 5. Update state
    setNodes(updatedNodes);
    setConnections(updatedConnections);
    
    // 6. Clear selection if we're deleting the selected node
    if (selectedNode && selectedNode.id === nodeId) {
      setSelectedNode(null);
      // Also close the sidebar if it's open
      setIsSidebarOpen(false);
    }
  };

  const handleSave = async () => {
    try {
      const nodeMap = {};

      // Initialize predecessor and successor in agentInfo
      nodes.forEach(node => {
        nodeMap[node.id] = {
          ...node,
          agentInfo: {
            ...node.agentInfo,
            predecessor: null, // Default to null
            successor: [], // Default to empty array
          }
        };
      });
  
      // Populate predecessor and successor relationships
      connections.forEach(conn => {
        if (nodeMap[conn.source] && nodeMap[conn.target]) {
          nodeMap[conn.source].agentInfo.successor.push(conn.target); // Update successor
          nodeMap[conn.target].agentInfo.predecessor = conn.source; // Update predecessor
        }
      });
  
      // Convert the nodeMap back into an array with updated nodes
      const updatedNodes = Object.values(nodeMap);
      // Create an object representing the workflow
      const workflowData = {
        agent_pro_id: agentProId,
        nodes: updatedNodes,
        connections: connections,
        // You might want to add more data like canvas position, zoom, etc.
      };
      
      // Save workflow data
      await api.post(
        `/api/agent-workflows/save/${agentProId}`,
        workflowData
      );
      
      // Show success message
      alert('Workflow saved successfully');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    }
  };

  const handleNodeClick = (node) => {
    setSelectedNode(node);
    
    // Open sidebar for agent nodes to add next agent
    if (node.type?.includes('agent')) {
      // Option to show context menu with both "Add next" and "Configure agent"
      setSidebarType('agent-actions');
      setSidebarTitle('Agent Actions');
      setIsSidebarOpen(true);
    } else if (node.type === 'if-condition') {
      // For If nodes, handle true/false paths
      setSidebarType('conditions');
      setSidebarTitle('Conditions');
      setIsSidebarOpen(true);
    }
  };
  
  // Handle adding connections between nodes
  const handleAddConnection = (sourceNode, type) => {
    setSelectedNode(sourceNode);
    
    if (type === 'llm') {
      setSidebarType('llm-select');
      setSidebarTitle('Select LLM');
    } else if (type === 'tool') {
      setSidebarType('tool-select');
      setSidebarTitle('Select Tool');
    } else if (type === 'agent') {
      setSidebarType('agent-select');
      setSidebarTitle('Select Agent Type');
    } else if (type === 'condition') {
      setSidebarType('condition-select');
      setSidebarTitle('Select Condition Type');
    } else if (type === 'next') {
      setSidebarType('agent-next');
      setSidebarTitle('Next Step');
    } else {
      setSidebarType('agent-select');
      setSidebarTitle('Select Agent Type');
    }
    
    setIsSidebarOpen(true);
  };

  // Render agent tooltip for hover
  const renderAgentTooltip = (node) => {
    if (!hasAgentInfo(node)) return null;
    
    return (
      <div 
        className="absolute z-10 bg-white border border-gray-200 rounded-md shadow-md p-3 w-64"
        style={{
          left: `${node.position.x + 160}px`,
          top: `${node.position.y}px`,
        }}
      >
        <h3 className="font-medium text-sm">{node.agentInfo.agent_name}</h3>
        <p className="text-xs text-gray-600 mt-1">{node.agentInfo.role}</p>
        {node.agentInfo.description && (
          <p className="text-xs mt-2">{node.agentInfo.description}</p>
        )}
        <div className="flex justify-end mt-2">
          <button 
            className="text-xs text-blue-500 hover:text-blue-700"
            onClick={() => handleOpenAgentModal(node.id)}
          >
            Edit Details
          </button>
        </div>
      </div>
    );
  };

  // Add a new function to get the actions sidebar content
  const getAgentActionsSidebar = () => {
    return (
      <div className="p-4">
        <div className="flex items-center mb-4">
          <button 
            className="mr-2 p-1 hover:bg-gray-100 rounded"
            onClick={() => setIsSidebarOpen(false)}
          >
            <ArrowLeft size={16} />
          </button>
          <h2 className="text-lg font-medium">Agent Actions</h2>
        </div>
        
        <div className="space-y-4">
          <div 
            className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setIsSidebarOpen(false);
              if (selectedNode) {
                handleOpenAgentModal(selectedNode.id);
              }
            }}
          >
            <h3 className="text-sm font-medium flex items-center">
              <Settings size={16} className="mr-2" />
              Configure Agent
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Set up agent details, parameters, and behavior
            </p>
          </div>
          
          <div 
            className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setSidebarType('agent-next');
              setSidebarTitle('Next Step');
            }}
          >
            <h3 className="text-sm font-medium flex items-center">
              <Plus size={16} className="mr-2" />
              Add Next Step
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Add the next agent or condition in your workflow
            </p>
          </div>
          
          <div 
            className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setSidebarType('llm-select');
              setSidebarTitle('Select LLM');
            }}
          >
            <h3 className="text-sm font-medium flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#4285F4" className="mr-2">
                <path d="M6 12l4 4 8-8" />
              </svg>
              Add LLM
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Connect a language model to this agent
            </p>
          </div>
          
          <div 
            className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
            onClick={() => {
              setSidebarType('tool-select');
              setSidebarTitle('Select Tool');
            }}
          >
            <h3 className="text-sm font-medium flex items-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" className="mr-2">
                <rect x="2" y="2" width="20" height="20" rx="2" />
                <rect x="11" y="11" width="2" height="2" fill="#4CAF50" />
              </svg>
              Add Tool
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Connect a tool to this agent
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Get the sidebar content based on type
  const getSidebarContent = () => {
    switch (sidebarType) {
      case 'agent-select':
        const agentOptionsToShow = framework && flowTypes[framework] 
          ? flowTypes[framework] 
          : agentTypes;
          
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button 
                className="mr-2 p-1 hover:bg-gray-100 rounded"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-medium">Select Agent Type</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select an agent type to add to your workflow</p>
            <div className="mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search agents..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pl-9"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div className="space-y-2">
              {agentOptionsToShow.map(agent => (
                <div 
                  key={agent.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleNodeSelection(agent.id, agent)}
                >
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {agent.icon === 'search' ? (
                        <Search size={16} className="text-gray-600" />
                      ) : agent.icon === 'message-square' ? (
                        <MessageSquare size={16} className="text-gray-600" />
                      ) : (
                        <Settings size={16} className="text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{agent.title}</h3>
                    <p className="text-xs text-gray-500">{agent.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      
      case 'agent-next':
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button 
                className="mr-2 p-1 hover:bg-gray-100 rounded"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-medium">Next Step</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Choose what to add next</p>

            <div className="mb-3">
              <h3 className="text-sm font-medium mb-2">Agents</h3>
            </div>
            
            <div className="space-y-2 mb-6">
              {agentTypes.slice(0, 2).map(agent => (
                <div 
                  key={agent.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleNodeSelection(agent.id, agent)}
                >
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {agent.icon === 'search' ? (
                        <Search size={16} className="text-gray-600" />
                      ) : agent.icon === 'message-square' ? (
                        <MessageSquare size={16} className="text-gray-600" />
                      ) : (
                        <Settings size={16} className="text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{agent.title}</h3>
                    <p className="text-xs text-gray-500">{agent.description}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mb-3">
              <h3 className="text-sm font-medium mb-2">Conditions</h3>
            </div>
            
            <div className="space-y-2">
              {conditionTypes.map(condition => (
                <div 
                  key={condition.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleNodeSelection('if-condition', condition)}
                >
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{condition.title}</h3>
                    <p className="text-xs text-gray-500">{condition.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'condition-select':
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button 
                className="mr-2 p-1 hover:bg-gray-100 rounded"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-medium">Conditions</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">Select a condition to branch your workflow</p>
            <div className="mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search conditions..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pl-9"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div className="space-y-2">
              {conditionTypes.map(condition => (
                <div 
                  key={condition.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleNodeSelection('if-condition', condition)}
                >
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-green-500 rounded flex items-center justify-center text-white">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-sm font-medium">{condition.title}</h3>
                    </div>
                    <p className="text-xs text-gray-500">{condition.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
        case 'llm-select':
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button 
                className="mr-2 p-1 hover:bg-gray-100 rounded"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-medium">Language Models</h2>
            </div>
            <div className="mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search LLMs..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pl-9"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            <div className="space-y-2">
              {llmTypes.map(llm => (
                <div 
                  key={llm.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleNodeSelection(`${llm.id}-llm`, llm)}
                >
                  <div className="mr-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100">
                      <div className="text-sm font-semibold">
                        {llm.title.charAt(0)}
                      </div>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{llm.title}</h3>
                    <p className="text-xs text-gray-500">{llm.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'tool-select':
        return (
          <div className="p-4">
            <div className="flex items-center mb-4">
              <button 
                className="mr-2 p-1 hover:bg-gray-100 rounded"
                onClick={() => setIsSidebarOpen(false)}
              >
                <ArrowLeft size={16} />
              </button>
              <h2 className="text-lg font-medium">Tools</h2>
            </div>
            <div className="mb-4">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search tools..." 
                  className="w-full px-3 py-2 border border-gray-300 rounded-md pl-9"
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
              </div>
            </div>
            
            <div className="space-y-2">
              {toolTypes.map(tool => (
                <div 
                  key={tool.id}
                  className="p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer flex items-center"
                  onClick={() => handleNodeSelection(`${tool.id}-tool`, tool)}
                >
                  <div className="mr-3">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {tool.id === 'web-search' ? (
                        <Search size={16} className="text-gray-600" />
                      ) : tool.id === 'code-interpreter' ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="16 18 22 12 16 6"></polyline>
                          <polyline points="8 6 2 12 8 18"></polyline>
                        </svg>
                      ) : (
                        <Settings size={16} className="text-gray-600" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium">{tool.title}</h3>
                    <p className="text-xs text-gray-500">{tool.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      case 'agent-actions':
        return getAgentActionsSidebar();
        
      default:
        return null;
    }
  };

return (
  <div className="flex flex-col h-screen bg-white">
    {/* Top Navigation Bar */}
    <div className="flex items-center px-4 py-2 border-b border-gray-200">
      <div className="flex items-center">
        <div className="flex items-center text-blue-500 mr-4">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="8" cy="8" r="5" fill="#4F46E5" />
            <path d="M3 8 L13 8" stroke="#4F46E5" />
            <path d="M8 3 L8 13" stroke="#4F46E5" />
          </svg>
          <span className="font-bold ml-1">Agent Flow</span>
        </div>
      </div>
      
      <div className="flex-1 text-center">
        <span className="font-medium">{agentProjectName || 'New Agent Project'}</span>
      </div>
    </div>

    {/* Main Content Area */}
    <div className="flex-1 flex flex-col overflow-hidden relative" style={{ minHeight: "500px" }}>
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'Editor' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('Editor')}
        >
          Editor
        </button>
        <button 
          className={`px-4 py-2 text-sm ${activeTab === 'Executions' ? 'bg-white border-b-2 border-blue-500' : 'bg-gray-100'}`}
          onClick={() => setActiveTab('Executions')}
        >
          Executions
        </button>
      </div>

      {/* Conditionally render either Workflow Canvas or Executions based on activeTab */}
      {activeTab === 'Editor' ? (
        // Workflow Canvas
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-white p-8 overflow-auto cursor-move"
          style={{
            backgroundImage: 'radial-gradient(#e5e7eb 1px, transparent 0)',
            backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
          }}
          onMouseDown={(e) => {
            // Only start dragging canvas when clicking directly on the background
            if (e.target === canvasRef.current || e.target.classList.contains('bg-white')) {
              setIsDragging(true);
              setDragStart({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseMove={(e) => {
            if (isDragging) {
              const dx = e.clientX - dragStart.x;
              const dy = e.clientY - dragStart.y;
              setCanvasOffset({
                x: canvasOffset.x + dx,
                y: canvasOffset.y + dy
              });
              setDragStart({ x: e.clientX, y: e.clientY });
            }
          }}
          onMouseUp={() => {
            setIsDragging(false);
          }}
          onMouseLeave={() => {
            setIsDragging(false);
          }}
        >
          <div className="absolute right-4 top-4 z-10">
            <button className="p-2 rounded border border-gray-200 text-gray-500">
              <Plus size={16} />
            </button>
          </div>

          {/* Workflow nodes container */}
          <div 
            className="relative w-full h-full" 
            style={{ 
              transform: `scale(${zoom}) translate(${canvasOffset.x / zoom}px, ${canvasOffset.y / zoom}px)`,
              transformOrigin: '0 0'
            }}
          >
            {/* Empty state - first workflow step */}
            {isFirstStep && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex flex-col items-center">
                  <div 
                    className="w-24 h-24 border border-dashed border-gray-300 rounded-md flex items-center justify-center mb-2 cursor-pointer hover:bg-gray-50"
                    onClick={handleAddFirstNode}
                  >
                    <Plus size={24} className="text-gray-400" />
                  </div>
                  <span className="text-gray-500 text-sm">Add first agent...</span>
                </div>
              </div>
            )}

            {/* Draw connections first so they appear behind nodes */}
            {connections.map((connection, index) => {
              const sourceNode = nodes.find(node => node.id === connection.source);
              const targetNode = nodes.find(node => node.id === connection.target);
              
              if (!sourceNode || !targetNode) return null;
              
              // Calculate connection points
              const startX = sourceNode.position.x + 80; // Node width is ~160px
              const startY = sourceNode.position.y + 40;  // Node height is ~80px, half is 40px
              const endX = targetNode.position.x;
              const endY = targetNode.position.y + 40;
              
              // Different styles for regular, dashed, and condition connections
              const strokeDash = connection.dashed ? "4,4" : "";
              const strokeColor = connection.dashed ? "#93c5fd" : "#d1d5db";
              
              // Regular straight path for normal connections
              const path = `M${startX},${startY} L${endX},${endY}`;
              
              return (
                <svg key={`connection-${index}`} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                  <path 
                    d={path} 
                    stroke={strokeColor}
                    strokeWidth="2" 
                    fill="none" 
                    strokeDasharray={strokeDash}
                  />
                  {connection.label && (
                    <text 
                      x={(startX + endX) / 2} 
                      y={(startY - 10)} 
                      fontSize="12" 
                      fill="#6b7280" 
                      textAnchor="middle"
                    >
                      {connection.label}
                    </text>
                  )}
                </svg>
              );
            })}

            {/* Draw dashed tool connections explicitly for tools */}
            {nodes.map(node => {
              if (node.type?.includes('agent')) {
                // Find all tools and LLMs connected to this Agent
                const llmNode = nodes.find(n => n.type?.includes('llm') && n.parentId === node.id);
                const toolNode = nodes.find(n => n.type?.includes('tool') && n.parentId === node.id);
                
                const connections = [];
                
                if (llmNode) {
                  connections.push({
                    id: `${node.id}-llm`,
                    startX: node.position.x + 40,
                    startY: node.position.y + 80,
                    endX: llmNode.position.x + 30,
                    endY: llmNode.position.y,
                    label: 'LLM',
                    color: '#93c5fd'  // blue
                  });
                }
                
                if (toolNode) {
                  connections.push({
                    id: `${node.id}-tool`,
                    startX: node.position.x + 120,
                    startY: node.position.y + 80,
                    endX: toolNode.position.x + 30,
                    endY: toolNode.position.y,
                    label: 'Tool',
                    color: '#86efac'  // green
                  });
                }
                
                return connections.map(conn => (
                  <svg key={conn.id} className="absolute top-0 left-0 w-full h-full pointer-events-none">
                    <path
                      d={`M${conn.startX},${conn.startY} L${conn.endX},${conn.endY}`}
                      stroke={conn.color}
                      strokeWidth="1.5"
                      strokeDasharray="4,4"
                      fill="none"
                    />
                    {/* Add labels to connections */}
                    <text
                      x={(conn.startX + conn.endX) / 2}
                      y={(conn.startY + conn.endY) / 2 - 5}
                      fontSize="10"
                      fill="#6b7280"
                      textAnchor="middle"
                      className="bg-white px-1"
                    >
                      {conn.label}
                    </text>
                  </svg>
                ));
              }
              return null;
            })}

            {/* Render all nodes */}
            {nodes.map((node) => {
              const { id, type, position, title, subtitle, parentId } = node;
              
              // Node UI based on type
              let nodeIcon = null;
              let borderColor = "border-gray-300";
              let bgColor = "bg-white";
              let nodeSize = "w-40 h-28";
              
              if (type?.includes('agent')) {
                borderColor = "border-blue-300";
                nodeIcon = (
                  <div className="absolute flex items-center justify-center p-2">
                    {type === 'research-agent' ? (
                      <Search size={20} className="text-blue-500" />
                    ) : type === 'chat-agent' ? (
                      <MessageSquare size={20} className="text-blue-500" />
                    ) : (
                      <Settings size={20} className="text-blue-500" />
                    )}
                  </div>
                );
              } else if (type === 'if-condition') {
                borderColor = "border-green-300";
                nodeIcon = (
                  <div className="absolute flex items-center justify-center p-2">
                    <div className="w-10 h-10 bg-green-500 rounded flex items-center justify-center text-white">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <path d="M12 8v8M8 12h8" />
                      </svg>
                    </div>
                  </div>
                );
              } else if (type?.includes('llm')) {
                borderColor = "border-blue-300";
                nodeSize = "w-36 h-36";
                bgColor = "bg-white";
                nodeIcon = (
                  <div className="absolute flex items-center justify-center p-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border border-blue-300">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="#4285F4">
                        <path d="M6 12l4 4 8-8" />
                      </svg>
                    </div>
                  </div>
                );
              } else if (type?.includes('tool')) {
                borderColor = "border-green-300";
                nodeSize = "w-36 h-36";
                bgColor = "bg-white";
                nodeIcon = (
                  <div className="absolute flex items-center justify-center p-2">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center bg-white border border-green-300">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="2" />
                        <rect x="11" y="11" width="2" height="2" fill="#4CAF50" />
                      </svg>
                    </div>
                  </div>
                );
              }

              return (
                <React.Fragment key={id}>
                  {/* The node itself */}
                  <div
                    className={`absolute ${nodeSize} rounded-lg border ${borderColor} ${bgColor} flex flex-col items-center justify-center cursor-grab shadow-sm hover:shadow-md`}
                    style={{
                      left: `${position.x}px`,
                      top: `${position.y}px`,
                    }}
                    onClick={() => handleNodeClick(node)}
                    onMouseEnter={() => type?.includes('agent') && hasAgentInfo(node) ? setHoverNode(node) : null}
                    onMouseLeave={() => setHoverNode(null)}
                    onMouseDown={(e) => {
                      // Prevent parent canvas drag when dragging a node
                      e.stopPropagation();
                      
                      // Prepare for node drag
                      const startX = e.clientX;
                      const startY = e.clientY;
                      const startLeft = position.x;
                      const startTop = position.y;
                      
                      const onMouseMove = (moveEvent) => {
                        const dx = moveEvent.clientX - startX;
                        const dy = moveEvent.clientY - startY;
                        
                        // Update node position
                        const updatedNodes = nodes.map(n => {
                          if (n.id === id) {
                            return {
                              ...n,
                              position: {
                                x: startLeft + dx,
                                y: startTop + dy
                              }
                            };
                          }
                          return n;
                        });
                        
                        setNodes(updatedNodes);
                      };
                      
                      const onMouseUp = () => {
                        document.removeEventListener('mousemove', onMouseMove);
                        document.removeEventListener('mouseup', onMouseUp);
                      };
                      
                      document.addEventListener('mousemove', onMouseMove);
                      document.addEventListener('mouseup', onMouseUp);
                    }}
                  >
                    {/* Delete button for all nodes */}
                    <div className="absolute top-1 right-1 z-10">
                      <button 
                        className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center text-red-500 hover:bg-red-200"
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent triggering node selection
                          handleDeleteNode(node.id);
                        }}
                        title="Delete node"
                      >
                        <X size={10} />
                      </button>
                    </div>

                    {/* Information icon for agents with agentInfo */}
                    {type?.includes('agent') && hasAgentInfo(node) && (
                      <div className="absolute top-1 right-8 z-10">
                        <button 
                          className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-200"
                          onClick={(e) => {
                            e.stopPropagation(); // Prevent triggering node selection
                            handleOpenAgentModal(node.id);
                          }}
                          title="View agent details"
                        >
                          <span className="text-xs font-bold">i</span>
                        </button>
                      </div>
                    )}

                    {/* Node connectors */}
                    {type?.includes('agent') && (
                      <>
                        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        </div>
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        </div>
                        
                        {/* Agent bottom options */}
                        <div className="absolute -bottom-8 w-full flex justify-between px-4">
                          <div 
                            className="flex flex-col items-center cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddConnection(node, 'llm');
                            }}
                          >
                            <div className="w-4 h-4 rounded-full bg-blue-400 mb-1"></div>
                            <span className="text-xs text-blue-500">LLM</span>
                          </div>
                          
                          <div 
                            className="flex flex-col items-center cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddConnection(node, 'tool');
                            }}
                          >
                            <div className="w-4 h-4 rounded-full bg-green-400 mb-1"></div>
                            <span className="text-xs text-green-500">Tool</span>
                          </div>
                        </div>
                        
                        {/* Tool connection plus buttons */}
                        <div className="absolute -bottom-16 w-full flex justify-around px-4">
                          <button 
                            className="w-6 h-6 rounded-md bg-white border border-blue-300 flex items-center justify-center text-blue-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddConnection(node, 'llm');
                            }}
                          >
                            <Plus size={14} />
                          </button>
                          
                          <button 
                            className="w-6 h-6 rounded-md bg-white border border-green-300 flex items-center justify-center text-green-500"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddConnection(node, 'tool');
                            }}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </>
                    )}

                    {type === 'if-condition' && (
                      <>
                        <div className="absolute -left-1 top-1/2 transform -translate-y-1/2">
                          <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        </div>
                        {/* True output connector */}
                        <div className="absolute right-0 top-1/3 transform translate-x-4">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-600 mr-1">true</span>
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          </div>
                        </div>
                        {/* False output connector */}
                        <div className="absolute right-0 bottom-1/3 transform translate-x-4">
                          <div className="flex items-center">
                            <span className="text-xs text-gray-600 mr-1">false</span>
                            <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {['llm', 'tool'].some(t => type?.includes(t)) && (
                      <div className="absolute -top-1 left-1/2 transform -translate-x-1/2">
                        <div className="w-3 h-3 rounded-full bg-blue-400"></div>
                      </div>
                    )}
                    
                    {nodeIcon}
                    
                    <div className={`text-center ${type?.includes('llm') || type?.includes('tool') ? 'mt-16' : 'mt-12'}`}>
                      <span className="text-sm font-medium">{title}</span>
                      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
                    </div>
                    
                    {/* Add button for connecting to next node */}
                    {type?.includes('agent') && (
                      <button 
                        className="absolute -right-4 top-1/2 transform translate-x-1/2 -translate-y-1/2 w-6 h-6 bg-white rounded-md border border-gray-300 flex items-center justify-center"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAddConnection(node, 'agent');
                        }}
                      >
                        <Plus size={14} />
                      </button>
                    )}
                  </div>

                  {/* Display node type and details for LLM and tool nodes */}
                  {['llm', 'tool'].some(t => type?.includes(t)) && node.toolName && (
                    <div 
                      className="absolute text-center bg-white bg-opacity-80 px-2 py-1 rounded shadow-sm"
                      style={{
                        left: `${position.x}px`,
                        top: `${position.y + 100}px`,
                        width: '90px',
                        transform: 'translateX(-25%)'
                      }}
                    >
                      <div className="text-sm font-medium">
                        {node.toolName}
                      </div>
                      {node.toolSubtitle && (
                        <div className="text-xs text-gray-600">{node.toolSubtitle}</div>
                      )}
                    </div>
                  )}
{type?.includes('agent') && hasAgentInfo(node) && (
  <div className="absolute top-1 right-8 z-10">
    <button 
      className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-blue-500 hover:bg-blue-200"
      onClick={(e) => {
        e.stopPropagation(); // Prevent triggering node selection
        handleOpenAgentModal(node.id);
      }}
      title="View agent details"
    >
      <span className="text-xs font-bold">i</span>
    </button>
  </div>
)}

{/* Detailed Agent Info Modal */}
{hoverNode && hoverNode.id === id && hasAgentInfo(node) && (
 <div 
 className="fixed z-[100] bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80"
 style={{
   left: `${Math.min(position.x + 160, window.innerWidth - 320)}px`,
   top: `${Math.min(position.y, window.innerHeight - 400)}px`,
   maxHeight: '400px',
   overflowY: 'auto'
 }}
 onClick={(e) => e.stopPropagation()}
>
    <div className="flex items-start mb-3">
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800">
          {node.agentInfo.agent_name || title}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {node.agentInfo.role || subtitle}
        </p>
      </div>
      <button 
        className="text-gray-500 hover:text-gray-700"
        onClick={() => handleOpenAgentModal(node.id)}
      >
        <Settings size={16} />
      </button>
    </div>

    {node.agentInfo.description && (
      <div className="mb-3">
        <h4 className="text-sm font-medium text-gray-700 mb-1">Description</h4>
        <p className="text-sm text-gray-600">
          {node.agentInfo.description}
        </p>
      </div>
    )}

    <div className="grid grid-cols-2 gap-2">
      {node.agentInfo.selected_llm && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">LLM</h4>
          <p className="text-sm text-gray-800">
            {node.agentInfo.selected_llm}
          </p>
        </div>
      )}

      {node.agentInfo.selected_tool && (
        <div>
          <h4 className="text-xs font-medium text-gray-600">Tool</h4>
          <p className="text-sm text-gray-800">
            {node.agentInfo.selected_tool}
          </p>
        </div>
      )}

      {node.agentInfo.goal && (
        <div className="col-span-2">
          <h4 className="text-xs font-medium text-gray-600">Goal</h4>
          <p className="text-sm text-gray-800">
            {node.agentInfo.goal}
          </p>
        </div>
      )}
    </div>

    <div className="mt-3 pt-2 border-t border-gray-200 text-right">
      <button 
        className="text-sm text-blue-600 hover:text-blue-800"
        onClick={() => handleOpenAgentModal(node.id)}
      >
        Edit Agent
      </button>
    </div>
  </div>
)}
                 
                </React.Fragment>
              );
            })}
          </div>
        </div>
      ) : (
        // Executions Tab Content
        <div className="flex-1 overflow-hidden">
          <AgentExecutions agentProId={agentProId} />
        </div>
      )}

      {/* Bottom Controls - Only show for Editor tab */}
      {activeTab === 'Editor' && (
        <div className="flex justify-between items-center p-2 border-t border-gray-200">
          <div className="flex space-x-2">
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
              onClick={() => {
                // Reset canvas position
                setCanvasOffset({ x: 0, y: 0 });
              }}
            >
              <Maximize size={18} />
            </button>
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
              onClick={() => {
                // Zoom in (max zoom: 2)
                setZoom(Math.min(2, zoom + 0.1));
              }}
            >
              <ZoomIn size={18} />
            </button>
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
              onClick={() => {
                // Zoom out (min zoom: 0.5)
                setZoom(Math.max(0.5, zoom - 0.1));
              }}
            >
              <ZoomOut size={18} />
            </button>
            <button 
              className="p-2 text-gray-500 hover:bg-gray-100 rounded"
              onClick={() => {
                // Reset zoom
                setZoom(1);
              }}
            >
              <RotateCcw size={18} />
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            Agent ID: {agentProId || 'New Agent'}
          </div>
          <button 
            className="ml-2 px-3 py-1 bg-blue-500 text-white text-sm rounded"
            onClick={handleSave}
          >
            Save
          </button>
          
          <button 
            className="px-4 py-2 bg-blue-500 text-white rounded-md flex items-center hover:bg-blue-600"
            onClick={() => {
              // Switch to the Executions tab when clicking "Test agent"
              setActiveTab('Executions');
            }}
          >
            <MessageSquare size={16} className="mr-2" />
            Test agent
          </button>
        </div>
      )}

      {/* Right Sidebar - Only show for Editor tab */}
      {activeTab === 'Editor' && isSidebarOpen && (
        <div className="absolute top-0 right-0 bottom-0 w-80 bg-white border-l border-gray-200 z-50 overflow-y-auto">
          {getSidebarContent()}
        </div>
      )}
    </div>

   

{isAgentModalOpen && (
  <AgentInfoModal 
    isOpen={isAgentModalOpen}
    initialData={initialData}
    onClose={() => {
      setIsAgentModalOpen(false);
      setSelectedNode(null);
    }}
    onSubmit={(agentData) => {
      // Update the specific node with new agent information
      const updatedNodes = nodes.map(node => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            agentInfo: agentData,
            title: agentData.agent_name || node.title,
            subtitle: agentData.role || '',
          };
        }
        return node;
      });

      // Update local state
      setNodes(updatedNodes);
      
      // Close the modal
      setIsAgentModalOpen(false);
      setSelectedNode(null);
    }}
  
  />
)}
  </div>
);

};

export default N8nWorkflowDashboard;




















