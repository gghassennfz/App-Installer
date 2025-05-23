const { exec } = require('child_process');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// List of ports to check, in order of preference
const ports = [5175, 5176, 5177, 5178, 5179, 5180];

// Wait time between checks (milliseconds)
const waitTime = 1000;
const maxAttempts = 30;

console.log('Waiting for Vite server to start...');

/**
 * Check if a port is in use
 * @param {number} port - Port number to check
 * @returns {Promise<boolean>} - Promise resolving to true if port is in use
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const options = {
      hostname: '127.0.0.1',
      port: port,
      path: '/',
      method: 'HEAD',
      timeout: 1000
    };

    const req = http.request(options, (res) => {
      resolve(true);
    });

    req.on('error', (e) => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Start Electron process
 * @param {number} port - Port that Vite is running on
 */
function startElectron(port) {
  console.log(`Vite server detected on port ${port}. Starting Electron...`);
  
  // Set the environment variable for Electron to know which port to connect to
  const env = {
    ...process.env,
    NODE_ENV: 'development',
    VITE_DEV_SERVER_URL: `http://127.0.0.1:${port}/`
  };

  // Start Electron using a more compatible approach
  const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = ['electron', '.'];
  
  console.log(`Running command: ${cmd} ${args.join(' ')}`);
  
  const electronProcess = spawn(cmd, args, {
    stdio: 'inherit',
    env,
    shell: true
  });

  electronProcess.on('close', (code) => {
    console.log(`Electron process exited with code ${code}`);
    process.exit(code);
  });
}

/**
 * Check all ports recursively until a Vite server is found
 */
async function checkPorts(attemptCount = 0) {
  if (attemptCount >= maxAttempts) {
    console.error('Timed out waiting for Vite server to start');
    process.exit(1);
    return;
  }

  // Try each port in order
  for (const port of ports) {
    const inUse = await isPortInUse(port);
    if (inUse) {
      startElectron(port);
      return;
    }
  }

  // If no port is in use, wait and try again
  console.log(`Waiting for Vite server... (${attemptCount + 1}/${maxAttempts})`);
  setTimeout(() => checkPorts(attemptCount + 1), waitTime);
}

// Start checking for Vite server
checkPorts();
