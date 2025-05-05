import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { AuthProvider } from './context/AuthContext'
import { ProjectProvider } from './context/ProjectContext';
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
    <ProjectProvider>
      <ThemeProvider>
        <AuthProvider>
          <App /> 
        </AuthProvider>
      </ThemeProvider>
    </ProjectProvider>
    </BrowserRouter>
  </React.StrictMode>,
)