/**
 * Restart App with Users Table Fix
 * 
 * This script restarts the application after applying the users table fix.
 */

import { spawn, exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Print a header
console.log(`${colors.bgBlue}${colors.white}${colors.bright} RESTART APP WITH USERS TABLE FIX ${colors.reset}`);
console.log(`${colors.cyan}This script restarts the application after applying the users table fix.${colors.reset}`);
console.log();

/**
 * Execute a command and return a promise
 * @param {string} command - The command to execute
 * @returns {Promise<string>} - The command output
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

/**
 * Kill processes running on a specific port
 * @param {number} port - The port to kill processes on
 * @returns {Promise<void>}
 */
async function killProcessOnPort(port) {
  try {
    console.log(`${colors.yellow}Killing processes on port ${port}...${colors.reset}`);
    
    if (process.platform === 'win32') {
      // Windows
      const result = await executeCommand(`netstat -ano | findstr :${port}`);
      const lines = result.split('\n');
      
      for (const line of lines) {
        const match = line.match(/(\d+)$/);
        if (match) {
          const pid = match[1];
          await executeCommand(`taskkill /F /PID ${pid}`);
          console.log(`${colors.green}Killed process with PID ${pid}${colors.reset}`);
        }
      }
    } else {
      // Unix-like
      try {
        const result = await executeCommand(`lsof -i:${port} -t`);
        const pids = result.split('\n').filter(Boolean);
        
        for (const pid of pids) {
          await executeCommand(`kill -9 ${pid}`);
          console.log(`${colors.green}Killed process with PID ${pid}${colors.reset}`);
        }
      } catch (error) {
        // No processes found, which is fine
        console.log(`${colors.yellow}No processes found on port ${port}${colors.reset}`);
      }
    }
  } catch (error) {
    console.log(`${colors.yellow}No processes found on port ${port} or error killing processes${colors.reset}`);
  }
}

/**
 * Apply the users table fix
 * @returns {Promise<void>}
 */
async function applyUsersFix() {
  return new Promise((resolve, reject) => {
    console.log(`${colors.yellow}Applying users table fix...${colors.reset}`);
    
    const fixProcess = spawn('node', ['fix-users-table.js'], {
      stdio: 'inherit',
      shell: true
    });
    
    fixProcess.on('close', (code) => {
      if (code === 0) {
        console.log(`${colors.green}Users table fix applied successfully${colors.reset}`);
        resolve();
      } else {
        console.error(`${colors.red}Failed to apply users table fix (exit code: ${code})${colors.reset}`);
        reject(new Error(`Failed to apply users table fix (exit code: ${code})`));
      }
    });
  });
}

/**
 * Start the API server
 * @returns {Promise<void>}
 */
async function startApiServer() {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Starting API server...${colors.reset}`);
    
    const apiProcess = spawn('node', ['api-server.js'], {
      stdio: 'inherit',
      shell: true,
      detached: true
    });
    
    // Don't wait for the API server to exit
    apiProcess.unref();
    
    // Wait a bit for the API server to start
    setTimeout(() => {
      console.log(`${colors.green}API server started${colors.reset}`);
      resolve();
    }, 2000);
  });
}

/**
 * Start the development server
 * @returns {Promise<void>}
 */
async function startDevServer() {
  return new Promise((resolve) => {
    console.log(`${colors.yellow}Starting development server...${colors.reset}`);
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true,
      detached: true
    });
    
    // Don't wait for the development server to exit
    devProcess.unref();
    
    // Wait a bit for the development server to start
    setTimeout(() => {
      console.log(`${colors.green}Development server started${colors.reset}`);
      resolve();
    }, 5000);
  });
}

/**
 * Main function to restart the application
 */
async function main() {
  try {
    // Kill processes on ports 3002 (API server) and 8080 (development server)
    await killProcessOnPort(3002);
    await killProcessOnPort(8080);
    
    // Apply the users table fix
    await applyUsersFix();
    
    // Start the API server
    await startApiServer();
    
    // Start the development server
    await startDevServer();
    
    console.log(`${colors.green}${colors.bright}Application restarted successfully!${colors.reset}`);
    console.log(`${colors.green}You can now access the application at http://localhost:8080${colors.reset}`);
    console.log(`${colors.green}The API server is running at http://localhost:3002${colors.reset}`);
    
    console.log();
    console.log(`${colors.yellow}${colors.bright}Testing Instructions:${colors.reset}`);
    console.log(`${colors.yellow}1. Open the application in your browser${colors.reset}`);
    console.log(`${colors.yellow}2. Sign in with any email and password${colors.reset}`);
    console.log(`${colors.yellow}3. Create a new life care plan${colors.reset}`);
    console.log(`${colors.yellow}4. Verify that the plan is created successfully without any errors${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
    process.exit(1);
  }
}

// Run the main function
main();
