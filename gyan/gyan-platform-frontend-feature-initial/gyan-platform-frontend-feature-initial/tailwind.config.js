/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      colors: {
        primary: {
          light: '#00A3E0',
          dark: '#0082B3'
        },
        background: {
          light: '#f7f8fc',
          dark: '#151308'
        }
      }
    },
  },
  plugins: [
    require('tailwind-scrollbar')
  ],
}