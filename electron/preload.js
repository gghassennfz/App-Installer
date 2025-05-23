const { contextBridge, ipcRenderer } = require('electron');

console.log('Preload script running!');

/**
 * Securely expose Electron APIs to the renderer process
 * This allows our Material UI React application to communicate with Electron
 * while maintaining security through the contextBridge
 */
contextBridge.exposeInMainWorld('electronAPI', {
  // Send messages to the main process
  sendMessage: (channel, data) => {
    // Whitelist channels for security
    const validChannels = ['install-tools'];
    if (validChannels.includes(channel)) {
      ipcRenderer.send(channel, data);
    }
  },
  
  // Listen for installation progress updates
  onProgress: (callback) => {
    const progressListener = (_, data) => callback(data);
    ipcRenderer.on('installation-progress', progressListener);
    
    // Return a function to remove this specific listener
    return () => {
      ipcRenderer.removeListener('installation-progress', progressListener);
    };
  },
  
  // Remove all listeners of a specific channel
  removeAllListeners: (channel) => {
    const validChannels = ['installation-progress'];
    if (validChannels.includes(channel)) {
      ipcRenderer.removeAllListeners(channel);
    }
  },
  
  // Get app info
  getAppInfo: () => {
    return {
      isElectron: true,
      version: process.versions.electron,
      platform: process.platform
    };
  },
  
  // Check if running in Electron
  isElectron: true
});

// Log when preload is complete
console.log('Electron preload script loaded successfully!');
