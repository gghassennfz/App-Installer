import { useState, useEffect } from 'react'
import { tools } from './data/tools'
import './App.css'

const { ipcRenderer } = window.require('electron')

function App() {
  const [selectedTools, setSelectedTools] = useState([])
  const [installing, setInstalling] = useState(false)
  const [progress, setProgress] = useState({})

  useEffect(() => {
    ipcRenderer.on('installation-progress', (_, data) => {
      setProgress(prev => ({
        ...prev,
        [data.tool]: { status: data.status, message: data.message }
      }))
    })

    return () => {
      ipcRenderer.removeAllListeners('installation-progress')
    }
  }, [])

  const handleToolSelect = (tool) => {
    setSelectedTools(prev => {
      if (prev.find(t => t.id === tool.id)) {
        return prev.filter(t => t.id !== tool.id)
      }
      return [...prev, tool]
    })
  }

  const handleInstall = () => {
    setInstalling(true)
    ipcRenderer.send('install-tools', selectedTools)
  }

  const handleInstallAll = () => {
    setSelectedTools(tools)
    setInstalling(true)
    ipcRenderer.send('install-tools', tools)
  }

  return (
    <div className="container">
      <header>
        <h1>Developer Tools Installer</h1>
        <p>Select the tools you want to install</p>
      </header>

      <div className="tools-container">
        {tools.map(tool => (
          <div 
            key={tool.id} 
            className={`tool-card ${selectedTools.find(t => t.id === tool.id) ? 'selected' : ''}`}
            onClick={() => !installing && handleToolSelect(tool)}
          >
            <h3>{tool.name}</h3>
            <p>{tool.category}</p>
            {progress[tool.name] && (
              <div className={`status ${progress[tool.name].status}`}>
                {progress[tool.name].status}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="actions">
        <button 
          onClick={handleInstall} 
          disabled={installing || selectedTools.length === 0}
          className="install-btn"
        >
          Install Selected ({selectedTools.length})
        </button>
        <button 
          onClick={handleInstallAll} 
          disabled={installing}
          className="install-all-btn"
        >
          Install All
        </button>
      </div>
    </div>
  )
}

export default App
