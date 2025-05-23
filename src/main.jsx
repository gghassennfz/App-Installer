import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Log information about the environment
console.log('React application starting')
console.log('Electron API available:', !!window.electronAPI)

// Wait for DOM to be fully loaded to prevent rendering issues
document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM fully loaded, rendering React app')
  
  const rootElement = document.getElementById('root')
  if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    )
  } else {
    console.error('Root element not found! Cannot render React app.')
  }
})
