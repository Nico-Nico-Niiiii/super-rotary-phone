// // src/context/AuthContext.jsx
// import { createContext, useContext, useState, useEffect } from 'react';
// import axios from 'axios';
// import endpoints from '../endpoints.json';

// const AuthContext = createContext(undefined);


// const BASE_URL = import.meta.env.VITE_APP_API_URL

// // Create axios instance with default config
// const api = axios.create({
//   baseURL: BASE_URL,
//   withCredentials: true,
//   headers: {
//     'Content-Type': 'application/json',
//     'Accept': 'application/json',
//   }
// });

// export const AuthProvider = ({ children }) => {
//   const [isAuthenticated, setIsAuthenticated] = useState(false);
//   const [user, setUser] = useState(null);
//   const [error, setError] = useState('');
//   const [loading, setLoading] = useState(true);

//   // Verify authentication on mount
//   useEffect(() => {
//     const verifyAuth = async () => {
//       try {
        
        
//         const { data } = await api.get(`${endpoints.auth.prefix}${endpoints.auth.routes.verify}`);
//         setUser(data.user);
//         setIsAuthenticated(true);
//       } catch (err) {
//         setUser(null);
//         setIsAuthenticated(false);
//       } finally {
//         setLoading(false);
//       }
//     };

//     verifyAuth();
//   }, []);

//   const login = async (email, password) => {
//     try {
//       setError('');
//       const response= await api.post(`${endpoints.auth.prefix}${endpoints.auth.routes.login}`, {
//         email,
//         password
//       });
//       console.log("Hello from login");
//       console.log(response.data);

//       if (response.data) {
//         console.log("Hello login check 1");
//         setUser(response.data.user);
//       setIsAuthenticated(true);
        
//           return true;
//       }

      
      
      
//       return false;
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Login failed');
//       return false;
//     }
//   };

//   const signup = async (email, password, confirmPassword, username, firstName, lastName) => {
//     try {
//       if (password !== confirmPassword) {
//         setError('Passwords do not match');
//         return false;
//       }

//       setError('');
//       const response = await api.post(`${endpoints.auth.prefix}${endpoints.auth.routes.signup}`, {
//         email,
//         password,
//         username,
//         firstName,
//         lastName
//       },
//       { withCredentials: true ,
//                   headers: {
//                     'Content-Type': 'application/json',
//                   }
//                 });

//       console.log('Signup response:', response.data);  // Add this for debugging

//       if (response.data) {
//         console.log("Hello shree");
        
//           return await login(email, password);
//       }
//       return false;
//     } catch (err) {
//       console.error('Signup error:', err.response?.data); 
//       setError(err.response?.data?.detail || 'Signup failed');
//       return false;
//     }
//   };

//   const logout = async () => {
//     try {
//       await api.post(`${endpoints.auth.prefix}${endpoints.auth.routes.logout}`);
//       setUser(null);
//       setIsAuthenticated(false);
//       setError('');
//     } catch (err) {
//       setError(err.response?.data?.detail || 'Logout failed');
//     }
//   };

//   return (
//     <AuthContext.Provider value={{
//       isAuthenticated,
//       user,
//       error,
//       loading,
//       login,
//       logout,
//       signup
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };  


import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import endpoints from '../endpoints.json';

const AuthContext = createContext(undefined);

const BASE_URL = import.meta.env.VITE_APP_API_URL;

// Create axios instance with default config
const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  // Verify authentication on mount
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { data } = await api.get(`${endpoints.auth.prefix}${endpoints.auth.routes.verify}`);
        setUser(data.user);
        setIsAuthenticated(true);
      } catch (err) {
        setUser(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setError('');
      const response = await api.post(`${endpoints.auth.prefix}${endpoints.auth.routes.login}`, {
        email,
        password
      });
      
      if (response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
      return false;
    }
  };

  const signup = async (email, password, confirmPassword, username, firstName, lastName) => {
    try {
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return false;
      }

      setError('');
      
      // Create the payload matching the Pydantic model fields
      const signupPayload = {
        email,
        password,
        username,
        first_name: firstName,  // Map to match the backend schema
        last_name: lastName     // Map to match the backend schema
      };

      const response = await api.post(
        `${endpoints.auth.prefix}${endpoints.auth.routes.signup}`, 
        signupPayload,
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );

      if (response.data) {
        // If signup is successful, automatically log the user in
        return await login(email, password);
      }
      
      return false;
    } catch (err) {
      console.error('Signup error:', err.response?.data); 
      
      // Handle external API specific errors
      if (err.response?.data?.detail?.includes('External API error')) {
        setError(`External system error: ${err.response.data.detail}`);
      } else {
        setError(err.response?.data?.detail || 'Signup failed');
      }
      
      return false;
    }
  };

  const logout = async () => {
    try {
      await api.post(`${endpoints.auth.prefix}${endpoints.auth.routes.logout}`);
      setUser(null);
      setIsAuthenticated(false);
      setError('');
    } catch (err) {
      setError(err.response?.data?.detail || 'Logout failed');
    }
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      error,
      loading,
      login,
      logout,
      signup
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};