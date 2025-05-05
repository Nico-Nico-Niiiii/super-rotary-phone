import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Upload } from 'lucide-react';
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';

const TicketManagement = () => {
  const API_BASE_URL = import.meta.env.VITE_APP_API_URL

  const { isDark } = useTheme();
  const [selectedOption, setSelectedOption] = useState('fillBlank');
  const [responseType, setResponseType] = useState('chat');
  const [dragActive, setDragActive] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [analysisResults, setAnalysisResults] = useState(null);
  const [chatMessage, setChatMessage] = useState('');
  const [expandedRows, setExpandedRows] = useState({});
  const [nextQuery, setNextQuery] = useState('');

  const COLORS = {
    fillBlank: ['#FF90B3', '#299646', '#c490ff', "#42daeb", '#94B3FD', '#f5ae0a', '#99D98C', '#FFC288'],
    duplicate: ['#4287f5', '#f54242', '#f5a442', '#FF90B3', '#97ff90', '#c490ff', "#90f4ff"]
  };

  const options = [
    { value: 'fillBlank', label: 'Fill Blank Category' },
    { value: 'ticketResponse', label: 'Ticket Response' },
    { value: 'findDuplicate', label: 'Find Duplicate Ticket' }
  ];

  const handleOptionChange = (newOption) => {
    setSelectedOption(newOption);
    setResponseType('chat');
    setShowResults(false);
    setSelectedFile(null);
    setChatMessage('');
    setAnalysisResults(null);
  };

  // Functions for File Section
  const handleFileUpload = (file) => {
    setSelectedFile(file);
  }; 

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // For Handling Chat Queries 
  const handleQuerySubmit = async (query) => {
    if (!query.trim()) return; // Prevent empty queries
  
    const formData = new FormData();
    formData.append("query", query);
  
    try {
      const response = await fetch(`${API_BASE_URL}/ticket_mgnt/chat`, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        throw new Error("Analysis failed");
      }
  
      const data = await response.json();
      const responseText = data.response.replace(/^"|"$/g, ''); // Remove extra quotes
  
      setAnalysisResults({
        type: 'ticketResponseSingle',
        ticket: query, // Save the query (either original or next one)
        resolution: responseText,
      });
  
      setShowResults(true);
    } catch (error) {
      console.error("Error submitting query:", error);
    }
  };

  // Handling Next Query in Chat
  const NextQueryInput = ({ isDark }) => {
    const [nextQuery, setNextQuery] = useState('');
  
    const handleNextQuery = () => {
      if (nextQuery.trim() !== '') {
        // Handle the next query submission logic here
        handleQuerySubmit(nextQuery);
        setNextQuery('');
      }
    };
  
    return (
      <div className="mt-4 space-y-4">
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Enter your next query..."
            value={nextQuery}
            onChange={(e) => setNextQuery(e.target.value)}
            className={`flex-1 p-3 rounded-lg ${
              isDark 
                ? 'bg-gray-800 text-gray-200 border-gray-600 focus:bg-gray-700' 
                : 'bg-white text-gray-800 border-gray-300'
            } border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
          />
          {nextQuery.trim() !== '' && (
            <button
              onClick={handleNextQuery}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
            >
              Submit
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleSubmit = async () => {
    if (selectedOption === 'findDuplicate' && selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile)
      formData.append("choice", "duplicate")

      try{
        const response = await fetch(`${API_BASE_URL}/ticket_mgnt/generate`, {
          method: "POST", 
          body: formData,
        });

        if (!response.ok){
          throw new Error("Analysis failed");
        }

        const data = await response.json();
        console.log("Recd data - ", data)

            // Convert response object into an array for rendering
        const formattedResults = Object.entries(data.response).map(([name, value]) => ({
          name,
          value
        }));

        setAnalysisResults({
          type: 'duplicate',
          distribution: formattedResults
        });
        setShowResults(true);

      }
      catch(error){
        console.error("File Upload Error:", error);
      }

    } 
    
    else if (selectedOption === 'fillBlank' && selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile)
      formData.append("choice", "blank")

      try{
        const response = await fetch(`${API_BASE_URL}/ticket_mgnt/generate`, {
          method: "POST", 
          body: formData,
        });

        if (!response.ok){
          throw new Error("Analysis failed");
        }

        const data = await response.json();
        console.log("Recd data - ", data)

        // Extract required data
        const totalIncidents = data.response.total_records;
        const blankCategories = data.response.total_issues;

        const distribution = Object.entries(data.response.category_counts).map(([name, value]) => ({
          name,
          value: parseFloat(((value / totalIncidents) * 100).toFixed(1)), // Convert to percentage
        }));

        // console.log("Distribution Data: ", distribution);
        
        // Create Mapping for Tickets 
        const tickets = data.response.df_filled.map(ticket => ({
          description: ticket["Short Description"],
          category: ticket["Category"],
        }));

        setAnalysisResults({
          type: 'fillBlank',
          totalIncidents,
          blankCategories,
          distribution,
          tickets
        });
        
        setShowResults(true);

      }
      catch(error){
        console.error("File Upload Error:", error);
      }

    } 
    
    else if (selectedOption === 'ticketResponse') {
      if (responseType === 'file' && selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile)
        formData.append("choice", "response_file")

        try{
          const response = await fetch(`${API_BASE_URL}/ticket_mgnt/generate`, {
            method: "POST", 
            body: formData,
          });

          if (!response.ok){
            throw new Error("Analysis failed");
          }

          const data = await response.json();
          console.log("Recd data - ", data)

          const tickets = data.response.map(item => ({
            ticket: item.Input.replace(/^"|"$/g, ''), // Remove surrounding quotes
            resolution: item.Output.replace(/^"|"$/g, '') // Remove surrounding quotes
          }));
          

          setAnalysisResults({
            type: 'ticketResponseTable',
            tickets: tickets
          });
          setShowResults(true);
        
      }
      catch(error){
        console.error("File Upload Error:", error);
      }
        
      } 
      
      else if (responseType === 'chat' && chatMessage) {
        handleQuerySubmit(chatMessage);
      }
    }
  };




  
  const FileUploadSection = () => (
    <div className="mt-4">
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-all duration-300 ${
          dragActive 
            ? isDark 
              ? 'border-blue-400 bg-gray-800' 
              : 'border-blue-400 bg-blue-50'
            : isDark
              ? 'border-gray-600 hover:border-gray-500'
              : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          onChange={(e) => handleFileUpload(e.target.files[0])}
          accept=".xlsx,.xls,.csv"
        />
        <div className="flex flex-col items-center space-y-4">
          <Upload size={32} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
          <div>
            <p className={`font-medium mb-1 ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              {selectedFile 
                ? `Selected file: ${selectedFile.name}`
                : 'Drag and drop your file here or click to browse'
              }
            </p>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Supported format: XLSX
            </p>
          </div>
        </div>
      </div>
    </div>
  );


  // Table for Showing Tickets
  const TicketsTable = ({ tickets, itemsPerPage = 10 }) => {
    const [currentPage, setCurrentPage] = useState(1);
  
    const totalPages = Math.ceil(tickets.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentTickets = tickets.slice(startIndex, endIndex);
  
    return (
      <div className="rounded-lg bg-gray-50 dark:bg-gray-700 p-4">
        <table className="w-full table-fixed border border-gray-300 dark:border-gray-600">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
              <th className="px-4 py-3 text-left text-xs font-medium uppercase w-3/4 border-r border-gray-300">Ticket Description</th>
              <th className="px-4 py-3 text-center text-xs font-medium uppercase w-1/4">Category</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-600">
            {currentTickets.map((ticket, index) => (
              <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-200 break-words border-r border-gray-300">
                  {ticket.description}
                </td>
                <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300 text-center">
                  {ticket.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
  
        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
              currentPage === 1 ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          >
            Previous
          </button>
  
          <span className="text-gray-700 dark:text-gray-300">
            Page {currentPage} of {totalPages}
          </span>
  
          <button
            className={`px-4 py-2 bg-blue-500 text-white rounded-md ${
              currentPage === totalPages ? "opacity-50 cursor-not-allowed" : ""
            }`}
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          >
            Next
          </button>
        </div>
      </div>
    );
  };

  // Rendering Results 
  const renderDuplicateResults = () => (
    <div className={`space-y-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <h2 className="text-2xl font-bold">Results</h2>
      <div className="flex flex-col items-center">
        <div className="h-64 w-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={analysisResults.distribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                fill="#8884d8"
                paddingAngle={2}
                dataKey="value"
              >
                {analysisResults.distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS.duplicate[index % COLORS.duplicate.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-8 flex flex-col gap-2">
          {analysisResults.distribution.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-4 h-4 rounded-sm" 
                style={{ backgroundColor: COLORS.duplicate[index % COLORS.duplicate.length] }}
              />
              <span className="text-sm">{entry.name} (Count: {entry.value})</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderFillBlankResults = () => (
    <div className={`space-y-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <div>
        <h2 className="text-2xl font-bold mb-2">Results</h2>
        <div className="max-w-3xl">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white p-4 dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm dark:text-white text-gray-500">Total Number of Incidents</p>
                  <p className="text-2xl font-semibold">{analysisResults.totalIncidents}</p>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 dark:bg-gray-700 rounded-lg shadow-sm">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-3 rounded-lg">
                  <svg className="w-6 h-6 text-blue-500" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm dark:text-white text-gray-500">Total Number of Blank Category</p>
                  <p className="text-2xl font-semibold">{analysisResults.blankCategories}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-64 w-1/2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={analysisResults.distribution}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {analysisResults.distribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS.fillBlank[index % COLORS.fillBlank.length]} />
              ))}
            </Pie>
            <Legend 
              layout="vertical" 
              align="right" 
              verticalAlign="middle"
              formatter={(value, entry) => `${value} (${entry.payload.value}%)`}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold mb-2">Tickets</h3>
        <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <table className="w-full">
            <tbody className="bg-white divide-y divide-gray-200">

              <TicketsTable tickets={analysisResults.tickets} />
            
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTicketResponseTable = () => (
    <div className={`space-y-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <h2 className="text-2xl font-bold">Results</h2>
      <div>
        <div className={`rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                <th className="text-left p-2">Ticket</th>
                <th className="text-left p-2">Suggested Resolution</th>
              </tr>
            </thead>
            <tbody>
              {analysisResults.tickets.map((ticket, index) => (
                <tr key={index} className={`${isDark ? 'border-gray-600' : 'border-gray-200'} border-b`}>
                  <td className="p-2">
                    <div className="relative">
                      <div className={`${expandedRows[index] ? '' : 'line-clamp-1'}`}>
                        {ticket.ticket}
                      </div>
                      {ticket.ticket.length > 10 && (
                        <button
                          onClick={() => setExpandedRows(prev => ({...prev, [index]: !prev[index]}))}
                          className="text-blue-500 hover:text-blue-600 text-sm mt-1"
                        >
                          {expandedRows[index] ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="relative">
                      <div className={`${expandedRows[index] ? '' : 'line-clamp-1'}`}>
                        {ticket.resolution}
                      </div>
                      {ticket.resolution.length > 1000 && (
                        <button
                          onClick={() => setExpandedRows(prev => ({...prev, [index]: !prev[index]}))}
                          className="text-blue-500 hover:text-blue-600 text-sm mt-1"
                        >
                          {expandedRows[index] ? 'Show Less' : 'Show More'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTicketResponseSingle = () => (
    <div className={`space-y-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <div>
          <h3 className="text-lg font-medium mb-2">{analysisResults.ticket}</h3>
          <div className={`p-4 rounded ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
            <h4 className="font-medium mb-2">Suggested Resolution</h4>
            <p>{analysisResults.resolution}</p>
          </div>
          <NextQueryInput isDark={isDark} />
        </div>
      </div>
    </div>
  );

  const renderInputSection = () => {
    if (selectedOption === 'ticketResponse' && !showResults) {
      return (
        <div className="mt-4 space-y-4">
          <div className="flex gap-8">
            <label className={`flex items-center cursor-pointer ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <input
                type="radio"
                name="responseType"
                value="chat"
                checked={responseType === 'chat'}
                onChange={(e) => setResponseType(e.target.value)}
                className="sr-only"
              />
              <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                responseType === 'chat'
                  ? 'bg-blue-500'
                  : isDark ? 'border-gray-500' : 'border-gray-300'
              } border`}>
                {responseType === 'chat' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              Chat
            </label>
            <label className={`flex items-center cursor-pointer ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
              <input
                type="radio"
                name="responseType"
                value="file"
                checked={responseType === 'file'}
                onChange={(e) => setResponseType(e.target.value)}
                className="sr-only"
              />
              <div className={`w-4 h-4 mr-2 rounded-full flex items-center justify-center ${
                responseType === 'file'
                  ? 'bg-blue-500'
                  : isDark ? 'border-gray-500' : 'border-gray-300'
              } border`}>
                {responseType === 'file' && (
                  <div className="w-2 h-2 rounded-full bg-white" />
                )}
              </div>
              File Upload
            </label>
          </div>
          
          {responseType === 'chat' ? (
            <input
              type="text"
              placeholder="Type your message..."
              value={chatMessage}
              onChange={(e) => setChatMessage(e.target.value)}
              className={`w-full p-3 rounded-lg ${
                isDark 
                  ? 'bg-gray-800 text-gray-200 border-gray-600 focus:bg-gray-700' 
                  : 'bg-white text-gray-800 border-gray-300'
              } border focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300`}
            />
          ) : (
            <FileUploadSection />
          )}
        </div>
      );
    } else if (!showResults) {
      return <FileUploadSection />;
    }
    return null;
  };

  const ResultsSection = () => {
    if (!analysisResults) return null;

    switch (analysisResults.type) {
      case 'duplicate':
        return renderDuplicateResults();
      case 'fillBlank':
        return renderFillBlankResults();
      case 'ticketResponseTable':
        return renderTicketResponseTable();
      case 'ticketResponseSingle':
        return renderTicketResponseSingle();
      default:
        return null;
    }
  };

  
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`p-4 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
        <h1 className="text-2xl font-bold mb-4">Ticket Management</h1>
        
        <div className={`rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Tabs Navigation */}
          <div className={`border-b dark:bg-gray-700 ${isDark ? 'border-gray-700' : 'border-gray-200'} px-4`}>
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => handleOptionChange(option.value)}
                className={`py-2 px-4 dark:bg-gray-700 dark:text-white focus:outline-none border-b-2 transition-colors ${
                  selectedOption === option.value
                    ? isDark 
                      ? 'text-blue-400 border-blue-400'
                      : 'text-blue-500 border-blue-500'
                    : isDark
                      ? 'text-gray-400 border-transparent hover:text-gray-300'
                      : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="p-4 space-y-4">
            {!showResults ? (
              <div className="space-y-4">
                {renderInputSection()}
                
                <div className="flex justify-end">
                  <button
                    onClick={handleSubmit}
                    disabled={!selectedFile && !chatMessage}
                    className={`px-4 py-2 rounded-md transition-colors ${
                      (!selectedFile && !chatMessage)
                        ? isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-300 text-gray-500'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    Analyze
                  </button>
                </div>
              </div>
            ) : (
              <ResultsSection />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TicketManagement;