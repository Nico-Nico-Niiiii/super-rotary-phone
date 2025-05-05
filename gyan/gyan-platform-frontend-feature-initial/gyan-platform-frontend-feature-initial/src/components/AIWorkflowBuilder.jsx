// import React, { useState, useRef } from 'react';
// import { 
//   Bot, Plus, Database, Wrench, Brain, 
//   ChevronDown, GitBranch, CircleDot,
//   ArrowBigLeftDash
// } from 'lucide-react';

// const AIWorkflowBuilder = () => {
//   const [selectedComponents, setSelectedComponents] = useState({
//     model: null,
//     memory: null,
//     tool: null
//   });
  
//   const [positions, setPositions] = useState({
//     model: { x: 100, y: 200 },
//     memory: { x: 100, y: 320 },
//     tool: { x: 100, y: 440 }
//   });

//   const [showPlusOptions, setShowPlusOptions] = useState(false);
//   const [conditions, setConditions] = useState([]);

//   const predefinedOptions = {
//     models: [
//       { id: 'openai', name: 'OpenAI Chat Model', icon: <CircleDot className="w-4 h-4" /> },
//     ],
//     memory: [
//       { id: 'window_buffer', name: 'Window Buffer Memory', icon: <Database className="w-4 h-4" /> },
//     ],
//     tools: [
//       { id: 'workflow', name: 'Call n8n Workflow Tool', icon: <Wrench className="w-4 h-4" /> }
//     ]
//   };

//   const handleDragStart = (e, type) => {
//     e.dataTransfer.setData('type', type);
//   };

//   const handleDrag = (e, type) => {
//     if (e.clientX === 0 && e.clientY === 0) return;
    
//     setPositions(prev => ({
//       ...prev,
//       [type]: {
//         x: e.clientX - 50,
//         y: e.clientY - 20
//       }
//     }));
//   };

//   const handleComponentSelect = (type, option) => {
//     setSelectedComponents(prev => ({
//       ...prev,
//       [type]: option
//     }));
//   };

//   const handleAddCondition = (type) => {
//     const newCondition = {
//       id: Date.now(),
//       type,
//       position: { x: 500, y: 150 }
//     };

//     if (type === 'if_else') {
//       newCondition.outcomes = [
//         { id: `success-${Date.now()}`, label: 'Success', position: { x: 700, y: 100 } },
//         { id: `failure-${Date.now()}`, label: 'Failure', position: { x: 700, y: 200 } }
//       ];
//     } else if (type === 'switch') {
//       newCondition.cases = Array.from({ length: 5 }, (_, i) => ({
//         id: `case-${Date.now()}-${i}`,
//         label: `Case ${i + 1}`,
//         position: { x: 700, y: 100 + (i * 80) }
//       }));
//     }

//     setConditions(prev => [...prev, newCondition]);
//     setShowPlusOptions(false);
//   };

//   const DropZone = ({ title, options, onSelect }) => {
//     const [isOpen, setIsOpen] = useState(false);

//     return (
//       <div className="relative mb-3">
//         <button
//           onClick={() => setIsOpen(!isOpen)}
//           className="w-full p-2 text-left text-sm flex items-center justify-between rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
//         >
//           <span className="text-gray-600 dark:text-gray-300">{title}</span>
//           <ChevronDown className="w-4 h-4 text-gray-400" />
//         </button>
        
//         {isOpen && (
//           <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
//             {options.map(option => (
//               <button
//                 key={option.id}
//                 onClick={() => {
//                   onSelect(option);
//                   setIsOpen(false);
//                 }}
//                 className="w-full p-2 text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700"
//               >
//                 {option.icon}
//                 <span className="text-gray-700 dark:text-gray-300">{option.name}</span>
//               </button>
//             ))}
//           </div>
//         )}
//       </div>
//     );
//   };

//   return (
//     <div className="h-screen bg-gray-50 dark:bg-gray-900 p-8 relative">
//       {/* AI Agent Box with Outward Connection */}
//       <div className="relative">
//         <div className="w-80 p-4 rounded-lg shadow-lg border-2 border-blue-200 bg-white dark:bg-gray-800">
//           <div className="flex items-center space-x-2 mb-4">
//             <Bot className="w-6 h-6 text-blue-500" />
//             <h3 className="font-medium text-gray-900 dark:text-white">AI Agent</h3>
//           </div>

//           <div className="space-y-2">
//             <DropZone 
//               title="Add Model" 
//               options={predefinedOptions.models}
//               onSelect={(option) => handleComponentSelect('model', option)}
//             />
//             <DropZone 
//               title="Add Memory" 
//               options={predefinedOptions.memory}
//               onSelect={(option) => handleComponentSelect('memory', option)}
//             />
//             <DropZone 
//               title="Add Tool" 
//               options={predefinedOptions.tools}
//               onSelect={(option) => handleComponentSelect('tool', option)}
//             />
//           </div>
//         </div>

//         {/* Horizontal Connection Line with Plus Button */}
//         <div className="absolute right-0 top-1/2 -translate-y-1/2">
//           <div className="flex items-center">
//             <div className="w-16 h-0.5 bg-gray-300 dark:bg-gray-600" />
//             <div className="relative">
//               <button
//                 onClick={() => setShowPlusOptions(!showPlusOptions)}
//                 className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400"
//               >
//                 <Plus className="w-4 h-4 text-gray-500" />
//               </button>
              
//               {showPlusOptions && (
//                 <div className="absolute left-full ml-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
//                   <button
//                     onClick={() => handleAddCondition('if_else')}
//                     className="w-full p-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700"
//                   >
//                     <GitBranch className="w-4 h-4" />
//                     <span>Add If/Else</span>
//                   </button>
//                   <button
//                     onClick={() => handleAddCondition('switch')}
//                     className="w-full p-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700"
//                   >
//                     <ArrowBigLeftDash className="w-4 h-4" />
//                     <span>Add Switch</span>
//                   </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Connection Lines */}
//       <svg className="absolute inset-0" style={{ zIndex: 1, pointerEvents: 'none', overflow: 'visible' }}>
//         <defs>
//           <marker
//             id="arrowhead"
//             markerWidth="12"
//             markerHeight="8"
//             refX="9"
//             refY="4"
//             orient="auto"
//           >
//             <path
//               d="M0,0 L12,4 L0,8 L2,4 Z"
//               className="fill-gray-400 dark:fill-gray-500"
//             />
//           </marker>
//         </defs>

//         {/* Vertical connection lines */}
//         {selectedComponents.model && (
//           <g key="model-connection">
//             <path
//               d={`M 40 ${200} C 40 ${200}, 40 ${positions.model.y + 20}, ${positions.model.x} ${positions.model.y + 20}`}
//               className="stroke-gray-300 dark:stroke-gray-600"
//               strokeWidth="2"
//               fill="none"
//               markerEnd="url(#arrowhead)"
//               style={{
//                 strokeDasharray: '0',
//                 strokeLinecap: 'round',
//                 filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
//               }}
//             />
//             <circle 
//               cx={40} 
//               cy={200} 
//               r="3.5"
//               className="fill-gray-300 dark:fill-gray-600"
//               style={{
//                 filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
//               }}
//             />
//           </g>
//         )}

//         {selectedComponents.memory && (
//           <g key="memory-connection">
//             <path
//               d={`M 40 ${280} C 40 ${280}, 40 ${positions.memory.y + 20}, ${positions.memory.x} ${positions.memory.y + 20}`}
//               className="stroke-gray-300 dark:stroke-gray-600"
//               strokeWidth="2"
//               fill="none"
//               markerEnd="url(#arrowhead)"
//               style={{
//                 strokeDasharray: '0',
//                 strokeLinecap: 'round',
//                 filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
//               }}
//             />
//             <circle 
//               cx={40} 
//               cy={280} 
//               r="3.5"
//               className="fill-gray-300 dark:fill-gray-600"
//               style={{
//                 filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
//               }}
//             />
//           </g>
//         )}

//         {selectedComponents.tool && (
//           <g key="tool-connection">
//             <path
//               d={`M 40 ${360} C 40 ${360}, 40 ${positions.tool.y + 20}, ${positions.tool.x} ${positions.tool.y + 20}`}
//               className="stroke-gray-300 dark:stroke-gray-600"
//               strokeWidth="2"
//               fill="none"
//               markerEnd="url(#arrowhead)"
//               style={{
//                 strokeDasharray: '0',
//                 strokeLinecap: 'round',
//                 filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
//               }}
//             />
//             <circle 
//               cx={40} 
//               cy={360} 
//               r="3.5"
//               className="fill-gray-300 dark:fill-gray-600"
//               style={{
//                 filter: 'drop-shadow(0 1px 1px rgb(0 0 0 / 0.05))',
//               }}
//             />
//           </g>
//         )}

//         {/* Condition connections */}
//         {conditions.map(condition => (
//           <g key={`condition-${condition.id}`}>
//             {condition.type === 'if_else' && condition.outcomes?.map(outcome => (
//               <path
//                 key={`outcome-${outcome.id}`}
//                 d={`M ${condition.position.x + 200} ${condition.position.y + 20} C ${condition.position.x + 250} ${condition.position.y + 20}, ${outcome.position.x - 50} ${outcome.position.y + 20}, ${outcome.position.x} ${outcome.position.y + 20}`}
//                 className="stroke-gray-300 dark:stroke-gray-600"
//                 strokeWidth="2"
//                 fill="none"
//                 markerEnd="url(#arrowhead)"
//               />
//             ))}
//             {condition.type === 'switch' && condition.cases?.map(caseItem => (
//               <path
//                 key={`case-${caseItem.id}`}
//                 d={`M ${condition.position.x + 200} ${condition.position.y + 20} C ${condition.position.x + 250} ${condition.position.y + 20}, ${caseItem.position.x - 50} ${caseItem.position.y + 20}, ${caseItem.position.x} ${caseItem.position.y + 20}`}
//                 className="stroke-gray-300 dark:stroke-gray-600"
//                 strokeWidth="2"
//                 fill="none"
//                 markerEnd="url(#arrowhead)"
//               />
//             ))}
//           </g>
//         ))}
//       </svg>

//        {/* Selected Components */}
//        {selectedComponents.model && (
//         <div
//           draggable
//           onDragStart={(e) => handleDragStart(e, 'model')}
//           onDrag={(e) => handleDrag(e, 'model')}
//           className="absolute p-3 rounded-lg shadow-md border-2 border-blue-200 bg-white dark:bg-gray-800 w-48 cursor-move"
//           style={{ left: positions.model.x, top: positions.model.y }}
//         >
//           <div className="flex items-center space-x-2">
//             {selectedComponents.model.icon}
//             <span className="text-sm font-medium">OpenAI Chat Model</span>
//           </div>
//         </div>
//       )}

//       {selectedComponents.memory && (
//         <div
//           draggable
//           onDragStart={(e) => handleDragStart(e, 'memory')}
//           onDrag={(e) => handleDrag(e, 'memory')}
//           className="absolute p-3 rounded-lg shadow-md border-2 border-green-200 bg-white dark:bg-gray-800 w-48 cursor-move"
//           style={{ left: positions.memory.x, top: positions.memory.y }}
//         >
//           <div className="flex items-center space-x-2">
//             {selectedComponents.memory.icon}
//             <span className="text-sm font-medium">Window Buffer Memory</span>
//           </div>
//         </div>
//       )}

//       {selectedComponents.tool && (
//         <div
//           draggable
//           onDragStart={(e) => handleDragStart(e, 'tool')}
//           onDrag={(e) => handleDrag(e, 'tool')}
//           className="absolute p-3 rounded-lg shadow-md border-2 border-purple-200 bg-white dark:bg-gray-800 w-48 cursor-move"
//           style={{ left: positions.tool.x, top: positions.tool.y }}
//         >
//           <div className="flex items-center space-x-2">
//             {selectedComponents.tool.icon}
//             <span className="text-sm font-medium">{selectedComponents.tool.name}</span>
//           </div>
//         </div>
//       )}

//       {/* Conditional Components */}
//       {conditions.map(condition => (
//         <div key={condition.id}>
//           {/* Main condition box */}
//           <div
//             className="absolute p-4 rounded-lg shadow-lg border-2 bg-white dark:bg-gray-800"
//             style={{
//               left: condition.position.x,
//               top: condition.position.y,
//               width: '200px',
//               borderColor: condition.type === 'if_else' ? '#bfdbfe' : '#ddd6fe'
//             }}
//           >
//             <div className="flex items-center space-x-2">
//               {condition.type === 'if_else' ? (
//                 <GitBranch className="w-6 h-6 text-blue-500" />
//               ) : (
//                 <ArrowBigLeftDash className="w-6 h-6 text-purple-500" />
//               )}
//               <span className="font-medium">
//                 {condition.type === 'if_else' ? 'If/Else' : 'Switch'}
//               </span>
//             </div>
//           </div>

//           {/* Outcome boxes */}
//           {condition.type === 'if_else' && condition.outcomes?.map(outcome => (
//             <div
//               key={outcome.id}
//               className="absolute p-3 rounded-lg shadow-md border-2 border-gray-200 bg-white dark:bg-gray-800"
//               style={{
//                 left: outcome.position.x,
//                 top: outcome.position.y,
//                 width: '160px'
//               }}
//             >
//               <div className="flex items-center space-x-2">
//                 <CircleDot className="w-4 h-4 text-gray-500" />
//                 <span className="text-sm font-medium">{outcome.label}</span>
//               </div>
//             </div>
//           ))}

//           {/* Switch cases */}
//           {condition.type === 'switch' && condition.cases?.map(caseItem => (
//             <div
//               key={caseItem.id}
//               className="absolute p-3 rounded-lg shadow-md border-2 border-gray-200 bg-white dark:bg-gray-800"
//               style={{
//                 left: caseItem.position.x,
//                 top: caseItem.position.y,
//                 width: '160px'
//               }}
//             >
//               <div className="flex items-center space-x-2">
//                 <CircleDot className="w-4 h-4 text-gray-500" />
//                 <span className="text-sm font-medium">{caseItem.label}</span>
//               </div>
//             </div>
//           ))}
//         </div>
//       ))}
//     </div>
//   );
// };

// export default AIWorkflowBuilder;






import React, { useState, useRef } from 'react';
import { 
  Bot, Plus, Database, Wrench, Brain, 
  ChevronDown, GitBranch, CircleDot,
  ArrowBigLeftDash
} from 'lucide-react';

const AIWorkflowBuilder = () => {
  const [selectedComponents, setSelectedComponents] = useState({
    model: null,
    memory: null,
    tool: null
  });
  
  const [positions, setPositions] = useState({
    model: { x: 400, y: 100 },
    memory: { x: 400, y: 220 },
    tool: { x: 400, y: 340 },
    plusButton: { x: 340, y: 160 }
  });

  const [showPlusOptions, setShowPlusOptions] = useState(false);
  const [conditions, setConditions] = useState([]);

  const predefinedOptions = {
    models: [
      { id: 'openai', name: 'OpenAI Chat Model', icon: <CircleDot className="w-4 h-4" /> },
    ],
    memory: [
      { id: 'window_buffer', name: 'Window Buffer Memory', icon: <Database className="w-4 h-4" /> },
    ],
    tools: [
      { id: 'workflow', name: 'Call n8n Workflow Tool', icon: <Wrench className="w-4 h-4" /> }
    ]
  };


  const handleDragStart = (e, type, id) => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ type, id }));
  };

  const handleDrag = (e, type, id) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    
    // Handle dragging of main components
    if (['model', 'memory', 'tool'].includes(type)) {
      setPositions(prev => ({
        ...prev,
        [type]: {
          x: e.clientX - 50,
          y: e.clientY - 20
        }
      }));
    }

    // Handle dragging of conditions and their outcomes/cases
    setConditions(prevConditions => 
      prevConditions.map(condition => {
        // Drag the main condition box
        if (condition.id === id) {
          return {
            ...condition,
            position: {
              x: e.clientX - 50,
              y: e.clientY - 20
            }
          };
        }
        
        // Handle dragging outcomes for if/else
        if (condition.type === 'if_else') {
          return {
            ...condition,
            outcomes: condition.outcomes.map(outcome => 
              outcome.id === id 
                ? { 
                    ...outcome, 
                    position: {
                      x: e.clientX - 50,
                      y: e.clientY - 20
                    }
                  }
                : outcome
            )
          };
        }
        
        // Handle dragging cases for switch
        if (condition.type === 'switch') {
          return {
            ...condition,
            cases: condition.cases.map(caseItem => 
              caseItem.id === id
                ? { 
                    ...caseItem, 
                    position: {
                      x: e.clientX - 50,
                      y: e.clientY - 20
                    }
                  }
                : caseItem
            )
          };
        }
        
        return condition;
      })
    );
  };

  const handleComponentSelect = (type, option) => {
    setSelectedComponents(prev => ({
      ...prev,
      [type]: option
    }));
  };

  const handleAddCondition = (type) => {
    const newCondition = {
      id: Date.now(),
      type,
      position: { x: 500, y: 140 }
    };

    if (type === 'if_else') {
      newCondition.outcomes = [
        { 
          id: `success-${Date.now()}`, 
          label: 'Success', 
          position: { x: 700, y: 100 } 
        },
        { 
          id: `failure-${Date.now()}`, 
          label: 'Failure', 
          position: { x: 700, y: 180 } 
        }
      ];
    } else if (type === 'switch') {
      newCondition.cases = Array.from({ length: 3 }, (_, i) => ({
        id: `case-${Date.now()}-${i}`,
        label: `Case ${i + 1}`,
        position: { x: 700, y: 150 + (i * 80) }
      }));
    }

    setConditions(prev => [...prev, newCondition]);
    setShowPlusOptions(false);
  };

  const DropZone = ({ title, options, onSelect }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative mb-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full p-2 text-left text-sm flex items-center justify-between rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <span className="text-gray-600 dark:text-gray-300">{title}</span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </button>
        
        {isOpen && (
          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
            {options.map(option => (
              <button
                key={option.id}
                onClick={() => {
                  onSelect(option);
                  setIsOpen(false);
                }}
                className="w-full p-2 text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {option.icon}
                <span className="text-gray-700 dark:text-gray-300">{option.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };


  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 p-8 relative">
      {/* AI Agent Box with Outward Connection */}
      <div className="relative">
        <div className="relative w-64 p-4 rounded-lg shadow-lg border-2 border-blue-200 bg-white dark:bg-gray-800">
          <div className="flex items-center space-x-2 mb-4">
            <Bot className="w-6 h-6 text-blue-500" />
            <h3 className="font-medium text-gray-900 dark:text-white">AI Agent</h3>
          </div>

          <div className="space-y-2">
            <DropZone 
              title="Add Model" 
              options={predefinedOptions.models}
              onSelect={(option) => handleComponentSelect('model', option)}
            />
            <DropZone 
              title="Add Memory" 
              options={predefinedOptions.memory}
              onSelect={(option) => handleComponentSelect('memory', option)}
            />
            <DropZone 
              title="Add Tool" 
              options={predefinedOptions.tools}
              onSelect={(option) => handleComponentSelect('tool', option)}
            />
          </div>
        </div>

        {/* Plus Button */}
        {/* <div className="absolute -right-0 top-1/2 -translate-y-1/2"> */}
        <div style={{ position: 'absolute', right: '1200px', top: '50%', transform: 'translateY(-50%)' }}>
          <div className="relative">
          <button
  onClick={() => setShowPlusOptions(!showPlusOptions)}
  className="w-6 h-6 rounded-full bg-white border-2 border-gray-300 dark:border-gray-600 flex items-center justify-center hover:border-blue-500 dark:hover:border-blue-400"
>
  <Plus className="w-4 h-4 text-gray-500" />
</button>
            
{showPlusOptions && (
  <div className="absolute left-full ml-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <button
                  onClick={() => handleAddCondition('if_else')}
                  className="w-full p-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <GitBranch className="w-4 h-4" />
                  <span>Add If/Else</span>
                </button>
                <button
                  onClick={() => handleAddCondition('switch')}
                  className="w-full p-2 text-left text-sm flex items-center space-x-2 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <ArrowBigLeftDash className="w-4 h-4" />
                  <span>Add Switch</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Connection Lines */}
      <svg className="absolute inset-0" style={{ zIndex: 1, pointerEvents: 'none', overflow: 'visible' }}>
        <defs>
          <marker
            id="arrowhead"
            markerWidth="12"
            markerHeight="8"
            refX="9"
            refY="4"
            orient="auto"
          >
            <path
              d="M0,0 L12,4 L0,8 L2,4 Z"
              className="fill-gray-400 dark:fill-gray-500"
            />
          </marker>
        </defs>

        {/* Direct connection from AI Agent to Plus Button */}
        <path
    d="M 290 160 L 400 160"
    className="stroke-gray-300 dark:stroke-gray-600"
    strokeWidth="2"
    fill="none"
    markerEnd="url(#arrowhead)"
/>

        {/* Vertical connection lines for components */}
        {selectedComponents.model && (
          <g key="model-connection">
            <path
    d={`M 220 120 L ${positions.model.x} ${positions.model.y + 20}`}
    className="stroke-gray-300 dark:stroke-gray-600"
    strokeWidth="2"
    fill="none"
    markerEnd="url(#arrowhead)"
/>
          </g>
        )}

        {selectedComponents.memory && (
          <g key="memory-connection">
            <path
    d={`M 220 160 L ${positions.memory.x} ${positions.memory.y + 20}`}
    className="stroke-gray-300 dark:stroke-gray-600"
    strokeWidth="2"
    fill="none"
    markerEnd="url(#arrowhead)"
/>
          </g>
        )}

        {selectedComponents.tool && (
          <g key="tool-connection">
           <path
    d={`M 220 200 L ${positions.tool.x} ${positions.tool.y + 20}`}
    className="stroke-gray-300 dark:stroke-gray-600"
    strokeWidth="2"
    fill="none"
    markerEnd="url(#arrowhead)"
/>
          </g>
        )}

        {/* Connections for conditions */}
        {conditions.map(condition => (
          <g key={condition.id}>
            {/* Connection from plus button to condition */}
            <path
              d={`M 235 160 L ${condition.position.x} ${condition.position.y + 20}`}
              className="stroke-gray-300 dark:stroke-gray-600"
              strokeWidth="2"
              fill="none"
              markerEnd="url(#arrowhead)"
            />

            {/* Connections from condition to outcomes/cases */}
            {condition.type === 'if_else' && condition.outcomes?.map(outcome => (
              <path
                key={`outcome-${outcome.id}`}
                d={`M ${condition.position.x + 200} ${condition.position.y + 20} L ${outcome.position.x} ${outcome.position.y + 20}`}
                className="stroke-gray-300 dark:stroke-gray-600"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            ))}

            {condition.type === 'switch' && condition.cases?.map(caseItem => (
              <path
                key={`case-${caseItem.id}`}
                d={`M ${condition.position.x + 200} ${condition.position.y + 20} L ${caseItem.position.x} ${caseItem.position.y + 20}`}
                className="stroke-gray-300 dark:stroke-gray-600"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
            ))}
          </g>
        ))}
      </svg>

      {/* Selected Components */}
      {selectedComponents.model && (
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'model')}
          onDrag={(e) => handleDrag(e, 'model')}
          className="absolute p-3 rounded-lg shadow-md border-2 border-blue-200 bg-white dark:bg-gray-800 w-48 cursor-move"
          style={{ left: positions.model.x, top: positions.model.y }}
        >
          <div className="flex items-center space-x-2">
            {selectedComponents.model.icon}
            <span className="text-sm font-medium">OpenAI Chat Model</span>
          </div>
        </div>
      )}

{selectedComponents.memory && (
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'memory')}
          onDrag={(e) => handleDrag(e, 'memory')}
          className="absolute p-3 rounded-lg shadow-md border-2 border-green-200 bg-white dark:bg-gray-800 w-48 cursor-move"
          style={{ left: positions.memory.x, top: positions.memory.y }}
        >
             <div className="flex items-center space-x-2">
            {selectedComponents.memory.icon}
            <span className="text-sm font-medium">Window Buffer Memory</span>
          </div>
        </div>
      )}

      {selectedComponents.tool && (
        <div
          draggable
          onDragStart={(e) => handleDragStart(e, 'tool')}
          onDrag={(e) => handleDrag(e, 'tool')}
          className="absolute p-3 rounded-lg shadow-md border-2 border-purple-200 bg-white dark:bg-gray-800 w-48 cursor-move"
          style={{ left: positions.tool.x, top: positions.tool.y }}
        >
          <div className="flex items-center space-x-2">
            {selectedComponents.tool.icon}
            <span className="text-sm font-medium">{selectedComponents.tool.name}</span>
          </div>
        </div>
      )}

      {/* Conditional Components */}
      {conditions.map(condition => (
        <div key={condition.id}>
          {/* Main condition box */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'condition', condition.id)}
            onDrag={(e) => handleDrag(e, 'condition', condition.id)}
            className="absolute p-4 rounded-lg shadow-lg border-2 bg-white dark:bg-gray-800 cursor-move"
            style={{
              left: condition.position.x,
              top: condition.position.y,
              width: '200px',
              borderColor: condition.type === 'if_else' ? '#bfdbfe' : '#ddd6fe'
            }}
          >
            <div className="flex items-center space-x-2">
              {condition.type === 'if_else' ? (
                <GitBranch className="w-6 h-6 text-blue-500" />
              ) : (
                <ArrowBigLeftDash className="w-6 h-6 text-purple-500" />
              )}
              <span className="font-medium">
                {condition.type === 'if_else' ? 'If/Else' : 'Switch'}
              </span>
            </div>
          </div>

          {/* Outcome boxes for If/Else */}
          {condition.type === 'if_else' && condition.outcomes?.map(outcome => (
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'outcome', outcome.id)}
              onDrag={(e) => handleDrag(e, 'outcome', outcome.id)}
              key={outcome.id}
              className="absolute p-3 rounded-lg shadow-md border-2 border-gray-200 bg-white dark:bg-gray-800 cursor-move"
              style={{
                left: outcome.position.x,
                top: outcome.position.y,
                width: '160px'
              }}
            >
              <div className="flex items-center space-x-2">
                <CircleDot className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{outcome.label}</span>
              </div>
            </div>
          ))}

          {/* Switch cases */}
          {condition.type === 'switch' && condition.cases?.map(caseItem => (
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, 'case', caseItem.id)}
              onDrag={(e) => handleDrag(e, 'case', caseItem.id)}
              key={caseItem.id}
              className="absolute p-3 rounded-lg shadow-md border-2 border-gray-200 bg-white dark:bg-gray-800 cursor-move"
              style={{
                left: caseItem.position.x,
                top: caseItem.position.y,
                width: '160px'
              }}
            >
              <div className="flex items-center space-x-2">
                <CircleDot className="w-4 h-4 text-gray-500" />
                <span className="text-sm font-medium">{caseItem.label}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default AIWorkflowBuilder;



