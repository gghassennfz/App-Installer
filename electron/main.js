const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');

// Enable remote module
require('@electron/remote/main').initialize();

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true
    }
  });

  // In development, load from local server
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL('http://localhost:5174');
  } else {
    // In production, load the index.html file
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Enable DevTools in development
  if (process.env.VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools();
  }

  // Enable remote module for the window
  require('@electron/remote/main').enable(win.webContents);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle tool installation
ipcMain.on('install-tools', (event, tools) => {
  tools.forEach(tool => {
    const command = `winget install -e --id "${tool.id}" --accept-source-agreements --accept-package-agreements`;
    
    exec(command, (error, stdout, stderr) => {
      if (error) {
        event.reply('installation-progress', {
          tool: tool.name,
          status: 'error',
          message: error.message
        });
        return;
      }
      
      event.reply('installation-progress', {
        tool: tool.name,
        status: 'success',
        message: stdout
      });
    });
  });
});
