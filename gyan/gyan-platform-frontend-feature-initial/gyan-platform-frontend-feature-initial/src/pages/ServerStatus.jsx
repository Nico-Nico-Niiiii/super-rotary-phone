// // src/components/ServerStatus.jsx
// import React, { useState, useEffect } from 'react';
// import axios from 'axios';

// const ServerDown = () => {
//   return (
//     <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
//       <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
//         <div className="text-red-500 text-6xl mb-4">
//           <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
//           </svg>
//         </div>
//         <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GYAN Server is Down</h2>
//         <p className="text-gray-600 dark:text-gray-300">The server is currently unavailable. Please try again after some time.</p>
//         <button
//           onClick={() => window.location.reload()}
//           className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-colors duration-200"
//         >
//           Retry Connection
//         </button>
//       </div>
//     </div>
//   );
// };

// const ServerStatus = ({ children }) => {
//   const [isServerDown, setIsServerDown] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const checkServerStatus = async () => {
//       try {
//         const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
//         await axios.get(`${apiUrl}/`, { timeout: 5000 });
//         setIsServerDown(false);
//       } catch (error) {
//         console.error('Server connection error:', error);
//         setIsServerDown(true);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkServerStatus();

//     // Set up polling to check server status periodically
//     const intervalId = setInterval(checkServerStatus, 30000); // Check every 30 seconds

//     return () => clearInterval(intervalId);
//   }, []);

//   if (isLoading) {
//     return (
//       <div className="flex items-center justify-center min-h-screen">
//         <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
//       </div>
//     );
//   }

//   if (isServerDown) {
//     return <ServerDown />;
//   }

//   return <>{children}</>;
// };

// export default ServerStatus;






// src/pages/ServerStatus.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ServerDown = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg text-center">
        <div className="text-red-500 text-6xl mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">GYAN Server is Down</h2>
        <p className="text-gray-600 dark:text-gray-300">The server is currently unavailable. Please try again after some time.</p>
        <button
          onClick={() => window.location.reload()}
          className="w-full py-2 px-4 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg shadow-md focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-opacity-75 transition-colors duration-200"
        >
          Retry Connection
        </button>
      </div>
    </div>
  );
};

const ServerStatus = ({ children }) => {
  const [isServerDown, setIsServerDown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   const checkServerStatus = async () => {
  //     try {
  //       // Specifically configured for gyan.capgemini.com:8000
  //       let apiUrl;
        
  //       // Use environment variable if available
  //       if (process.env.REACT_APP_API_URL) {
  //         apiUrl = process.env.REACT_APP_API_URL;
  //       } 
  //       // Check if we're on the Capgemini domain
  //       else if (window.location.hostname.includes('capgemini.com')) {
  //         // Use the same protocol as the current page
  //         const protocol = window.location.protocol;
  //         apiUrl = `${protocol}//gyan.capgemini.com:8000`;
  //         console.log("api", apiUrl);
          
  //       }
  //       // Fallback to localhost for development
  //       else {
  //         apiUrl = 'http://localhost:8000';
  //       }
        
  //       console.log('Checking server status at:', apiUrl);
        
  //       // Try the request with specific options for corporate environments
  //       const response = await axios.get(`${apiUrl}/`, {
  //         timeout: 10000, // Increased timeout for corporate networks
  //         withCredentials: false, // Important for CORS
  //         headers: {
  //           'Accept': 'application/json',
  //           'Content-Type': 'application/json'
  //         }
  //       });
        
  //       // Check if we got a valid response
  //       if (response.status >= 200 && response.status < 300) {
  //         console.log('Server is up:', response.data);
  //         setIsServerDown(false);
  //       } else {
  //         console.warn('Server returned unexpected status:', response.status);
  //         setIsServerDown(true);
  //       }
  //     } catch (error) {
  //       console.error('Server connection error:', error);
  //       setIsServerDown(true);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   };

  //   checkServerStatus();

  //   // Set up polling to check server status periodically
  //   const intervalId = setInterval(checkServerStatus, 60000); // Check every minute (increased to reduce load)

  //   return () => clearInterval(intervalId);
  // }, []);


  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        let apiUrl;
  
        if (process.env.REACT_APP_API_URL) {
          apiUrl = process.env.REACT_APP_API_URL;
        } else if (window.location.hostname.includes('capgemini.com')) {
          const protocol = window.location.protocol;
          apiUrl = `${protocol}//gyan.capgemini.com:8000`;
          console.log("api", apiUrl);
        } else {
          apiUrl = 'http://localhost:8000';
        }
  
        console.log('Checking server status at:', apiUrl);
  
        const response = await axios.get(`${apiUrl}/`, {
          timeout: 10000,
          withCredentials: false,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        });
  
        if (response.status >= 200 && response.status < 300) {
          console.log('Server is up:', response.data);
          setIsServerDown(false);
        } else {
          console.warn('Server returned unexpected status:', response.status);
          setIsServerDown(true);
        }
      } catch (error) {
        console.error('Server connection error:', error);
        setIsServerDown(true);
      } finally {
        setIsLoading(false);
      }
    };
  
    checkServerStatus();
  }, []);
  

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  if (isServerDown) {
    return <ServerDown />;
  }

  return <>{children}</>;
};

export default ServerStatus;