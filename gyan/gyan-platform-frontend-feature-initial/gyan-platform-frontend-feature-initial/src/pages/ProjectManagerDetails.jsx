import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, Play, Loader, Save, FileText,
  CheckCircle, Users, Calendar, Clock, AlertTriangle, Flag, BarChart,
  Mail, User, Briefcase, Code, Star, Hash, Bookmark
} from 'lucide-react';
import * as XLSX from 'xlsx';

const ProjectManagerDetails = () => {
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  const location = useLocation();
  const navigate = useNavigate();
  const [projectData, setProjectData] = useState(null);
  const [teamData, setTeamData] = useState(null);
  const [headers, setHeaders] = useState([]);
  const [rows, setRows] = useState([]);
  const [projectPlan, setProjectPlan] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [projectDescription, setProjectDescription] = useState('');
  const [editedProjectDescription, setEditedProjectDescription] = useState('');
  const [editedTeamData, setEditedTeamData] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');
  const [rawTeamData, setRawTeamData] = useState('');
  const [showRawEditor, setShowRawEditor] = useState(false);

  const ganttChartData = [
    { task: 'Design chatbot user interface', assignee: 'Alice', startDate: '2025-02-26', endDate: '2025-03-02' },
    { task: 'Develop chatbot backend', assignee: 'Bob', startDate: '2025-03-03', endDate: '2025-03-09' },
    { task: 'Research existing chatbot applications', assignee: 'Charlie', startDate: '2025-02-22', endDate: '2025-02-25' },
    { task: 'Testing and debugging', assignee: 'David', startDate: '2025-03-10', endDate: '2025-03-13' },
    { task: 'Integrate chatbot with customer support system', assignee: 'Eve', startDate: '2025-03-10', endDate: '2025-03-15' },
    { task: 'Define chatbot functionality and features', assignee: 'Frank', startDate: '2025-02-26', endDate: '2025-02-27' }
  ];

  const loadingMessages = [
    "task_generation",
    "task_dependencies",
    "task_schedule",
    "task_allocator",
    "risk_assessor",
    "insight_generator",
    "routing"
  ];

  // Get detailed loading messages for each task
  const getLoadingTaskMessage = (taskName) => {
    const taskMessages = {
      "task_generation": "Defining and structuring tasks to align with project goals...",
      "task_dependencies": "Identifying dependencies to ensure a logical task flow...",
      "task_schedule": "Strategically planning task execution for optimal efficiency...",
      "task_allocator": "Assigning tasks to the right team members based on skills and availability...",
      "risk_assessor": "Evaluating potential risks to maintain project stability...",
      "insight_generator": "Extracting key insights to drive informed project decisions...",
      "routing": "Streamlining task transitions for smooth project progression..."
    };
    
    return taskMessages[taskName] || "Analyzing project data and team composition...";
  };

  // Role based color assignments
  const getRoleColor = (role) => {
    const roleMap = {
      'Project Manager': 'bg-purple-100 text-purple-800 border-purple-200',
      'Business Analyst': 'bg-blue-100 text-blue-800 border-blue-200',
      'UX Designer': 'bg-pink-100 text-pink-800 border-pink-200',
      'UI Designer': 'bg-rose-100 text-rose-800 border-rose-200',
      'Frontend Developer': 'bg-amber-100 text-amber-800 border-amber-200',
      'Backend Developer': 'bg-green-100 text-green-800 border-green-200',
      'Database Engineer': 'bg-teal-100 text-teal-800 border-teal-200',
      'QA Engineer': 'bg-indigo-100 text-indigo-800 border-indigo-200'
    };
    
    return roleMap[role] || 'bg-gray-100 text-gray-800 border-gray-200';
  };

  // Get icon based on role
  const getRoleIcon = (role) => {
    const roleIconMap = {
      'Project Manager': <Briefcase size={16} className="text-purple-600" />,
      'Business Analyst': <FileText size={16} className="text-blue-600" />,
      'UX Designer': <User size={16} className="text-pink-600" />,
      'UI Designer': <Bookmark size={16} className="text-rose-600" />,
      'Frontend Developer': <Code size={16} className="text-amber-600" />,
      'Backend Developer': <Code size={16} className="text-green-600" />,
      'Database Engineer': <FileSpreadsheet size={16} className="text-teal-600" />,
      'QA Engineer': <CheckCircle size={16} className="text-indigo-600" />
    };
    
    return roleIconMap[role] || <User size={16} className="text-gray-600" />;
  };

  useEffect(() => {
    // Check if state has project data
    if (location.state && location.state.projectData) {
      setProjectData(location.state.projectData);
      
      // If there's a team file, parse and display it
      if (location.state.projectData.teamFile instanceof File) {
        parseTeamFile(location.state.projectData.teamFile);
      }

      // Set the project description
      if (location.state.projectData.inputType === 'text') {
        const description = location.state.projectData.projectDescription || 'No description provided';
        setProjectDescription(description);
        setEditedProjectDescription(description);
      } else if (location.state.projectData.descriptionFile instanceof File) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const content = e.target.result || 'Unable to read file';
          setProjectDescription(content);
          setEditedProjectDescription(content);
        };
        reader.readAsText(location.state.projectData.descriptionFile);
      } else {
        const defaultDesc = 'No description provided';
        setProjectDescription(defaultDesc);
        setEditedProjectDescription(defaultDesc);
      }
    } else {
      // If no data is passed, redirect back to project manager page
      navigate('/dashboard/use-cases/project-manager');
    }
  }, [location, navigate]);

  const parseTeamFile = (file) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
  
      // Assuming the first sheet is the one you want to parse
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
  
      // Convert sheet to JSON
      const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  
      setRawTeamData(jsonData);
      setEditedTeamData(jsonData);
  
      // Extract headers and rows
      const headers = ['ID', 'Name', 'Roll Description'];  // Fixed the headers
      const rows = jsonData.map((row, index) => ({
        id: row.ID || index + 1, // Fallback if no ID column
        name: row.Name || 'N/A',
        description: row.Description || 'No description',
      }));
  
      setTeamData(rows);
      setHeaders(headers);
      setRows(rows);
    };
  
    reader.onerror = (error) => console.error('Error reading file:', error);
    reader.readAsArrayBuffer(file);
  };


  const handleGoBack = () => {
    navigate('/dashboard/use-cases/project-manager');
  };

  const handleSaveDescription = () => {
    setProjectDescription(editedProjectDescription);
    // In a real application, you would save this to your backend
    alert('Project description saved successfully!');
  };

  const handleSaveTeamData = () => {
    // Parse the edited CSV data
    const lines = editedTeamData.split('\n');
    const headers = lines[0].split(',');
    
    const rows = lines.slice(1).map(line => {
      const values = line.split(',');
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index]?.replace(/"/g, '') || '';
      });
      return row;
    });
    
    setTeamData(rows);
    setRows(rows);
    
    // In a real application, you would save this to your backend
    alert('Team data saved successfully!');
  };

  const handleGeneratePlan = async () => {
    if (!projectData) {
      alert("Project data is required!");
      return;
    }
    
    setIsGenerating(true);

    try{
      console.log("entered try")
      const formData = new FormData();
      formData.append("des", projectData.descriptionFile);
      formData.append("team", projectData.teamFile);
      console.log("created formData")

      const response = await fetch(`${API_BASE_URL}/pm_agent/generate`, {
        method: "POST", 
        body: formData
      });

      if (!response.ok){
        throw new Error(`Failed to generate plan: ${response.status} ${response.statusText}`);
      }

      const data = await response.json()
      console.log("Recd Data - ", data)

    }

    catch(error){
      alert("Error generating project plan.");
    }

    finally{
      setIsGenerating(false);
    }



    ////////// DUMMMY CODE 
    // let messageIndex = 0;
    
    // // Display each loading message for 2 seconds
    // const messageInterval = setInterval(() => {
    //   setLoadingMessage(loadingMessages[messageIndex]);
    //   messageIndex++;
      
    //   if (messageIndex >= loadingMessages.length) {
    //     clearInterval(messageInterval);
    //     setTimeout(() => {
    //       setProjectPlan(ganttChartData);
    //       setIsGenerating(false);
    //       setLoadingMessage('');
    //     }, 1000); // Last message stays for 1 second
    //   }
    // }, 2000);
  };

  const handleExportPlan = () => {
    if (!projectPlan) return;
    
    // Create CSV content
    let csvContent = "task,assignee,startDate,endDate\n";
    projectPlan.forEach(item => {
      csvContent += `"${item.task}","${item.assignee}","${item.startDate}","${item.endDate}"\n`;
    });
    
    // Create a blob and download it
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `project-gantt-chart-${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const renderGanttChart = () => {
    if (!projectPlan) return null;
    
    // Find the min and max dates to set the timeline boundaries
    const startDates = projectPlan.map(item => new Date(item.startDate));
    const endDates = projectPlan.map(item => new Date(item.endDate));
    const minDate = new Date(Math.min(...startDates));
    const maxDate = new Date(Math.max(...endDates));
    
    // Add buffer days
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 2);
    
    // Calculate the total days for the timeline
    const totalDays = Math.ceil((maxDate - minDate) / (1000 * 60 * 60 * 24));
    
    // Format date as string
    const formatDate = (date) => {
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    };
    
    // Generate dates for the x-axis (weekly intervals)
    const timelineDates = [];
    const currentDate = new Date(minDate);
    while (currentDate <= maxDate) {
      timelineDates.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 7); // Weekly intervals
    }
    
    // Generate color map for assignees
    const assignees = [...new Set(projectPlan.map(item => item.assignee))];
    const colors = [
      "#4D72F5", // Blue
      "#F54D4D", // Red
      "#4DF57C", // Green
      "#9E4DF5", // Purple
      "#F5A64D", // Orange
      "#4DD2F5"  // Light Blue
    ];
    
    const assigneeColorMap = {};
    assignees.forEach((assignee, index) => {
      assigneeColorMap[assignee] = colors[index % colors.length];
    });
    
    // Calculate position and width for each task dynamically
    const calculateTaskStyle = (startDate, endDate) => {
      const startDateTime = new Date(startDate).getTime();
      const endDateTime = new Date(endDate).getTime();
      const minDateTime = minDate.getTime();
      const maxDateTime = maxDate.getTime();
      const timeRange = maxDateTime - minDateTime;
      
      const leftPos = ((startDateTime - minDateTime) / timeRange) * 100;
      const width = ((endDateTime - startDateTime) / timeRange) * 100;
      
      return {
        left: `${leftPos}%`,
        width: `${width}%`
      };
    };
    
    return (
      <div className="mt-4">
        <h3 className="text-xl font-semibold mb-4">Gantt Chart - Iteration:3</h3>
        
        <div className="w-full">
          {/* Chart header - timeline */}
          <div className="flex mb-2">
            <div className="w-40 md:w-52 shrink-0 pr-2 font-medium text-gray-700 dark:text-gray-300">
              Tasks
            </div>
            <div className="flex-1 relative">
              <div className="flex justify-between border-b border-gray-300 dark:border-gray-700 pb-1">
                {timelineDates.map((date, index) => (
                  <div key={index} className="text-xs text-gray-500 dark:text-gray-400">
                    {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Chart rows */}
          {projectPlan.map((item, index) => (
            <div key={index} className="flex mb-3 h-10 items-center" data-task={item.task}>
              {/* Task label */}
              <div className="w-40 md:w-52 shrink-0 pr-2 text-sm text-gray-700 dark:text-gray-300 truncate" title={item.task}>
                {item.task}
              </div>
              
              {/* Timeline area */}
              <div className="flex-1 relative bg-gray-100 dark:bg-gray-800 h-8 rounded-md">
                {/* Task bar */}
                <div
                  className="absolute h-full rounded-md flex items-center justify-center text-xs text-white font-medium cursor-pointer group"
                  style={{
                    ...calculateTaskStyle(item.startDate, item.endDate),
                    backgroundColor: assigneeColorMap[item.assignee]
                  }}
                >
                  <span className="truncate px-1">
                    {window.innerWidth > 640 ? item.assignee : ''}
                  </span>
                  
                  {/* Tooltip on hover */}
                  <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-64 bg-white dark:bg-gray-800 shadow-lg rounded-md p-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-10">
                    <div className="text-xs text-gray-900 dark:text-white font-medium mb-1">
                      {item.task}
                    </div>
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div className="text-gray-500 dark:text-gray-400">Assignee:</div>
                      <div className="text-gray-900 dark:text-white">{item.assignee}</div>
                      <div className="text-gray-500 dark:text-gray-400">Start Date:</div>
                      <div className="text-gray-900 dark:text-white">{item.startDate}</div>
                      <div className="text-gray-500 dark:text-gray-400">End Date:</div>
                      <div className="text-gray-900 dark:text-white">{item.endDate}</div>
                      <div className="text-gray-500 dark:text-gray-400">Duration:</div>
                      <div className="text-gray-900 dark:text-white">
                        {Math.ceil((new Date(item.endDate) - new Date(item.startDate)) / (1000 * 60 * 60 * 24)) + 1} days
                      </div>
                    </div>
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white dark:border-t-gray-800"></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {/* Legend */}
          <div className="mt-4 flex flex-wrap gap-3">
            <div className="text-xs font-medium text-gray-700 dark:text-gray-300">Team Member:</div>
            {assignees.map((assignee, index) => (
              <div key={index} className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-sm" 
                  style={{ backgroundColor: assigneeColorMap[assignee] }}
                ></div>
                <span className="text-xs text-gray-700 dark:text-gray-300">{assignee}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Render the team data in a more visually appealing table format
  const renderTeamTable = () => {
    if (!teamData || teamData.length === 0) {
      return (
        <div className="text-center h-full flex flex-col items-center justify-center">
          <Users size={36} className="mx-auto text-gray-400 mb-1" />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {projectData.teamFile ? "Processing team data..." : "No team data available"}
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          {/* Table Header */}
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">ID</th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
              <th scope="col" className="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
            </tr>
          </thead>
  
          {/* Table Body */}
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-800">
            {teamData.map((member, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                {/* ID */}
                <td className="px-2 py-2 whitespace-nowrap text-xs text-gray-900 dark:text-white">{member.id}</td>
                
                {/* Name */}
                <td className="px-2 py-2 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-7 w-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <User size={12} className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="ml-2">
                      <div className="text-xs font-medium text-gray-900 dark:text-white">{member.name}</div>
                    </div>
                  </div>
                </td>
  
                {/* Description */}
                <td className="px-2 py-2 text-xs text-gray-500 dark:text-gray-400">
                  {member.description}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  if (!projectData) {
    return <div className="p-8">Loading...</div>;
  }

  // Get loading task details
  const getCurrentTaskDetails = () => {
    if (!loadingMessage) return null;
    
    const taskMessages = {
      "task_generation": "Task Generation: Defining and structuring tasks to align with project goals.",
      "task_dependencies": "Task Dependencies: Identifying dependencies to ensure a logical task flow.",
      "task_schedule": "Task Scheduling: Strategically planning task execution for optimal efficiency.",
      "task_allocator": "Task Allocation: Assigning tasks to the right team members based on skills and availability.",
      "risk_assessor": "Risk Assessment: Evaluating potential risks to maintain project stability.",
      "insight_generator": "Insight Generation: Extracting key insights to drive informed project decisions.",
      "routing": "Task Routing: Streamlining task transitions for smooth project progression."
    };
    
    return taskMessages[loadingMessage] || "Processing...";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-4">
      {/* Header */}
      <div className="flex items-center mb-4">
        <button 
          onClick={handleGoBack}
          className="mr-3 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {projectData.projectName || "Project Details"}
          </h1>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Generate an AI-powered project plan based on your input
          </p>
        </div>
      </div>

      {/* Main content with new layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Left side - Project Description */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                <FileText size={16} className="text-blue-500 mr-1" />
                Project Description
              </h2>
              <button
                onClick={handleSaveDescription}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
              >
                <Save size={12} />
                Save
              </button>
            </div>
            
            <textarea
              value={editedProjectDescription}
              onChange={(e) => setEditedProjectDescription(e.target.value)}
              className="w-full h-64 p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-xs"
              placeholder="Enter project description..."
            />
          </div>
        </div>

        {/* Right side - Team Members with scroll */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 h-full">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
                <Users size={16} className="text-blue-500 mr-1" />
                Team Members
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRawEditor(!showRawEditor)}
                  className="flex items-center gap-1 px-2 py-1 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors text-xs"
                >
                  <Code size={12} />
                  {showRawEditor ? 'Hide Editor' : 'Edit Raw Data'}
                </button>
                {showRawEditor && (
                  <button
                    onClick={handleSaveTeamData}
                    className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-xs"
                  >
                    <Save size={12} />
                    Save
                  </button>
                )}
              </div>
            </div>
            
            {/* Visual Team Table with scroll */}
            <div className="h-64 overflow-auto mb-2">
              {renderTeamTable()}
            </div>
            
            {/* Raw CSV Data Editor - only shown when edit is toggled */}
            {showRawEditor && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-xs font-medium text-gray-700 dark:text-gray-300">Edit Raw Data (CSV)</h3>
                  <span className="text-xs text-gray-500 dark:text-gray-400">Changes reflected after saving</span>
                </div>
                <textarea
                  value={editedTeamData}
                  onChange={(e) => setEditedTeamData(e.target.value)}
                  className="w-full h-32 p-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500 bg-gray-50 dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-mono text-xs"
                  placeholder="Enter team data in CSV format..."
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Generate Plan Button */}
      <div className="mb-4">
        <button
          onClick={handleGeneratePlan}
          disabled={isGenerating}
          className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1 text-sm"
        >
          {isGenerating ? (
            <>
              <Loader size={14} className="animate-spin" />
              Generating Project Plan...
            </>
          ) : (
            <>
              <Play size={14} />
              Generate Project Plan
            </>
          )}
        </button>
      </div>
      
      {/* Project Plan (below both sections) */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 min-h-[590px]">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center">
            <Calendar size={16} className="text-blue-500 mr-1" />
            Project Plan
          </h2>
          
          <button
            onClick={handleExportPlan}
            disabled={!projectPlan}
            className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-xs"
          >
            <Download size={12} />
            Export CSV
          </button>
        </div>
        
        {projectPlan ? (
          renderGanttChart()
        ) : (
          <div className="flex flex-col items-center justify-center h-[550px] text-gray-500 dark:text-gray-400">
            {isGenerating ? (
              <div className="text-center">
                <Loader size={32} className="mx-auto animate-spin mb-3 text-blue-500" />
                <div className="max-w-md mx-auto bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                  <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    ● {getCurrentTaskDetails()}
                  </p>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <p className="text-sm">No project plan generated yet</p>
                <p className="text-xs mt-1">Click the "Generate Project Plan" button to create a comprehensive plan</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProjectManagerDetails;
