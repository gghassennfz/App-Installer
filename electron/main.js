const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { exec } = require('child_process');
const { installTool, isToolInstalled, specialInstallers } = require('./installers');

function createWindow() {
  // Create the browser window with optimized settings for Material UI
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // In development, we need to disable sandbox for better compatibility
      sandbox: process.env.NODE_ENV !== 'development',
      devTools: process.env.NODE_ENV === 'development', 
      // Enable modern web features for better Material UI performance
      webSecurity: process.env.NODE_ENV !== 'development',
      allowRunningInsecureContent: process.env.NODE_ENV === 'development'
    },
    // Visual improvements for Material UI
    backgroundColor: '#f8fafc',
    titleBarStyle: 'default',
    autoHideMenuBar: false,
    show: false, // Don't show until ready-to-show
  });

  // Show window when ready to prevent flickering
  win.once('ready-to-show', () => {
    win.show();
  });

  // In development, load from local server
  const isDev = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';
  
  if (isDev) {
    // Try to connect to Vite server on different possible ports
    const tryConnectToPort = async (port) => {
      const url = `http://127.0.0.1:${port}/`;
      try {
        console.log(`Trying to connect to development server at: ${url}`);
        await win.loadURL(url);
        console.log(`Successfully connected to Vite server at port ${port}`);
        return true;
      } catch (err) {
        console.log(`Failed to connect to port ${port}: ${err.message}`);
        return false;
      }
    };

    // Try different possible ports that Vite might use
    const tryConnect = async () => {
      // Possible ports that Vite may use (5175, 5176, 5177, etc.)
      const ports = [5175, 5176, 5177, 5178, 5179, 5180];
      
      for (const port of ports) {
        if (await tryConnectToPort(port)) return;
      }
      
      // If all ports fail, show error message
      win.loadFile(path.join(__dirname, 'error.html'));
      console.error('Could not connect to any Vite development server');
    };
    
    tryConnect();
    // DevTools can be opened manually with Ctrl+Shift+I if needed
    // Uncomment the next line if you want DevTools to open automatically
    // win.webContents.openDevTools();
    
    // For development mode with Vite and Material UI, we need to disable the CSP entirely
    win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
      if (details.responseHeaders['content-security-policy']) {
        delete details.responseHeaders['content-security-policy'];
      }
      callback({
        responseHeaders: details.responseHeaders
      });
    });
    
    // Set up proper error handling for loading
    win.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
      console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
      // Try reloading after a short delay
      setTimeout(() => {
        console.log('Attempting to reload...');
        win.loadURL(devServerUrl);
      }, 2000);
    });
  } else {
    // In production, load the index.html file
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Log errors
  win.webContents.on('did-fail-load', (_, errorCode, errorDescription) => {
    console.error(`Failed to load: ${errorCode} - ${errorDescription}`);
  });
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
  console.log('Received install-tools request for:', tools.map(t => t.name).join(', '));
  
  // Process tools one at a time to avoid conflicts
  const installQueue = [...tools];
  let currentInstall = null;
  
  const processNextInstall = () => {
    if (installQueue.length === 0) {
      console.log('All installations completed or attempted');
      return;
    }
    
    currentInstall = installQueue.shift();
    installTool(currentInstall);
  };
  
  const installTool = (tool) => {
    // Send initial progress message
    event.reply('installation-progress', {
      tool: tool.name,
      status: 'installing',
      message: `Starting installation of ${tool.name}...`
    });
    
    // Try to check if tool is already installed first
    const checkCommand = `winget list --id ${tool.id}`;
    exec(checkCommand, (checkError, checkStdout, checkStderr) => {
      if (!checkError && checkStdout && checkStdout.includes(tool.id)) {
        // Tool is already installed
        console.log(`${tool.name} is already installed`);
        event.reply('installation-progress', {
          tool: tool.name,
          status: 'success',
          message: `${tool.name} is already installed on your system.`
        });
        processNextInstall();
        return;
      }
      
      // Proceed with installation
      const command = `winget install -e --id "${tool.id}" --accept-source-agreements --accept-package-agreements`;
      console.log(`Executing command: ${command}`);
      
      const childProcess = exec(command);
      let output = '';
      
      // Stream stdout data
      childProcess.stdout.on('data', (data) => {
        output += data;
        console.log(`${tool.name} stdout: ${data}`);
        event.reply('installation-progress', {
          tool: tool.name,
          status: 'installing',
          message: `Installing ${tool.name}... ${data}`
        });
      });
      
      // Stream stderr data
      childProcess.stderr.on('data', (data) => {
        console.error(`${tool.name} stderr: ${data}`);
      });
      
      // Handle process completion
      childProcess.on('exit', (code) => {
        if (code === 0) {
          console.log(`Successfully installed ${tool.name}`);
          event.reply('installation-progress', {
            tool: tool.name,
            status: 'success',
            message: output || 'Installation completed successfully'
          });
        } else {
          console.error(`Failed to install ${tool.name} with exit code ${code}`);
          
          // Try an alternative installation method for known tools
          tryAlternativeInstallation(tool, event, (success) => {
            if (!success) {
              event.reply('installation-progress', {
                tool: tool.name,
                status: 'error',
                message: `Installation failed with exit code ${code}. Please install manually.`
              });
            }
            processNextInstall();
          });
          return;
        }
        
        processNextInstall();
      });
      
      // Handle process errors
      childProcess.on('error', (err) => {
        console.error(`Error executing command for ${tool.name}:`, err);
        event.reply('installation-progress', {
          tool: tool.name,
          status: 'error',
          message: `Error executing installation command: ${err.message}`
        });
        processNextInstall();
      });
    });
  };
  
  // Try alternative installation methods for known tools
  const tryAlternativeInstallation = (tool, event, callback) => {
    console.log(`Trying alternative installation for ${tool.name}`);
    
    // Check if we have a custom installer for this tool
    if (specialInstallers[tool.id]) {
      console.log(`Using custom installer for ${tool.name}`);
      
      // Use our custom installer module
      installTool(tool, (progress) => {
        // Forward progress updates to the renderer process
        event.reply('installation-progress', progress);
      })
      .then(success => {
        if (success) {
          console.log(`Custom installation succeeded for ${tool.name}`);
        } else {
          console.error(`Custom installation failed for ${tool.name}`);
        }
        callback(success);
      })
      .catch(error => {
        console.error(`Error during custom installation of ${tool.name}:`, error);
        event.reply('installation-progress', {
          tool: tool.name,
          status: 'error',
          message: `Installation error: ${error.message}`
        });
        callback(false);
      });
    } else {
      // No custom installer available
      console.log(`No custom installer available for ${tool.name}`);
      callback(false);
    }
  };
  
  // Start the installation process
  processNextInstall();
});
