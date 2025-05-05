import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env': {},
    'import.meta.env.VITE_APP_API_URL': JSON.stringify('http://localhost:8000')
  },
   base: './',
  server: {
    host: '0.0.0.0', 
    allowedHosts: [
      'gyan.capgemini.com'
    ]
  },
  
})
