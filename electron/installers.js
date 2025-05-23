// Custom installers for tools that need special handling
const path = require('path');
const fs = require('fs');
const { exec } = require('child_process');
const os = require('os');

// Map of tool IDs to their download URLs and install commands
const specialInstallers = {
  'Postman.Postman': {
    name: 'Postman',
    url: 'https://dl.pstmn.io/download/latest/win64',
    setupFileName: 'postman-installer.exe',
    installArgs: '-s', // silent install
  },
  'Docker.DockerDesktop': {
    name: 'Docker Desktop',
    url: 'https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe',
    setupFileName: 'docker-installer.exe',
    installArgs: 'install --quiet',
  },
  'MongoDB.Server': {
    name: 'MongoDB',
    url: 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-6.0.6-signed.msi',
    setupFileName: 'mongodb-installer.msi',
    installArgs: '/quiet /qn',
    msi: true,
  },
  'Node.js.LTS': {
    name: 'Node.js LTS',
    url: 'https://nodejs.org/dist/v18.16.0/node-v18.16.0-x64.msi',
    setupFileName: 'nodejs-installer.msi',
    installArgs: '/quiet /qn',
    msi: true,
  },
  'Python.Python.3': {
    name: 'Python 3',
    url: 'https://www.python.org/ftp/python/3.12.0/python-3.12.0-amd64.exe',
    setupFileName: 'python-installer.exe',
    installArgs: '/quiet InstallAllUsers=1 PrependPath=1',
  },
  'DittoClipboard.Ditto': {
    name: 'Ditto',
    url: 'https://github.com/sabrogden/Ditto/releases/download/3.24.246.0/DittoSetup_64bit_3_24_246_0.exe',
    setupFileName: 'ditto-installer.exe',
    installArgs: '/SILENT /NORESTART',
  },
};

/**
 * Installs a tool using custom download and installation methods
 * @param {Object} tool The tool to install
 * @param {Function} progressCallback Callback for installation progress updates
 * @returns {Promise<boolean>} True if installation was successful
 */
async function installTool(tool, progressCallback) {
  const installer = specialInstallers[tool.id];
  
  if (!installer) {
    progressCallback({
      tool: tool.name,
      status: 'error',
      message: 'No custom installer available for this tool'
    });
    return false;
  }
  
  try {
    // Create a temp directory for downloads if it doesn't exist
    const downloadDir = path.join(os.tmpdir(), 'dev-tools-installer');
    if (!fs.existsSync(downloadDir)) {
      fs.mkdirSync(downloadDir, { recursive: true });
    }
    
    const setupFilePath = path.join(downloadDir, installer.setupFileName);
    
    // Download the installer
    progressCallback({
      tool: tool.name,
      status: 'installing',
      message: `Downloading ${installer.name}...`
    });
    
    // Construct the PowerShell download command
    const downloadCommand = `powershell -Command "& { [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '${installer.url}' -OutFile '${setupFilePath}' }"`;
    
    // Execute the download command
    await new Promise((resolve, reject) => {
      exec(downloadCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // Run the installer
    progressCallback({
      tool: tool.name,
      status: 'installing',
      message: `Installing ${installer.name}...`
    });
    
    // Construct the installation command
    let installCommand;
    if (installer.msi) {
      installCommand = `msiexec /i "${setupFilePath}" ${installer.installArgs}`;
    } else {
      installCommand = `"${setupFilePath}" ${installer.installArgs}`;
    }
    
    // Execute the installation command
    await new Promise((resolve, reject) => {
      exec(installCommand, (error, stdout, stderr) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
    
    // Clean up the installer file
    try {
      fs.unlinkSync(setupFilePath);
    } catch (e) {
      console.warn(`Could not delete installer file: ${e.message}`);
    }
    
    progressCallback({
      tool: tool.name,
      status: 'success',
      message: `${installer.name} installed successfully!`
    });
    
    return true;
  } catch (error) {
    progressCallback({
      tool: tool.name,
      status: 'error',
      message: `Installation failed: ${error.message}`
    });
    
    return false;
  }
}

/**
 * Checks if a tool is already installed
 * @param {Object} tool The tool to check
 * @returns {Promise<boolean>} True if the tool is already installed
 */
async function isToolInstalled(tool) {
  // For tools that have special installers, we can check specific paths or registry
  const specialChecks = {
    'Postman.Postman': async () => {
      return new Promise((resolve) => {
        const appDataPath = process.env.LOCALAPPDATA || path.join(os.homedir(), 'AppData', 'Local');
        const postmanPath = path.join(appDataPath, 'Postman');
        fs.access(postmanPath, fs.constants.F_OK, (err) => {
          resolve(!err); // No error means the directory exists
        });
      });
    },
    'Docker.DockerDesktop': async () => {
      return new Promise((resolve) => {
        const programFilesPath = process.env['ProgramFiles'] || 'C:\\Program Files';
        const dockerPath = path.join(programFilesPath, 'Docker', 'Docker');
        fs.access(dockerPath, fs.constants.F_OK, (err) => {
          resolve(!err); // No error means the directory exists
        });
      });
    },
    // Add more checks for other tools
  };
  
  if (specialChecks[tool.id]) {
    return await specialChecks[tool.id]();
  }
  
  // Default check using winget
  return new Promise((resolve) => {
    exec(`winget list --id ${tool.id}`, (error, stdout) => {
      resolve(!error && stdout && stdout.includes(tool.id));
    });
  });
}

module.exports = {
  installTool,
  isToolInstalled,
  specialInstallers
};
