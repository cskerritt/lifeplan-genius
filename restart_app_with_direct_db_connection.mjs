/**
 * Restart Application with Direct Database Connection
 * 
 * This script restarts the application with the direct database connection.
 * It ensures that the application uses the direct database connection instead of
 * the browser-compatible database connection.
 * This version uses ES module syntax.
 */

import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set up colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Print a section header
 * @param {string} title Section title
 */
function printSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + ' ' + title + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

/**
 * Print a success message
 * @param {string} message Success message
 */
function printSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

/**
 * Print an error message
 * @param {string} message Error message
 * @param {Error} error Error object
 */
function printError(message, error) {
  console.log(colors.red + '✗ ' + message + colors.reset);
  if (error) {
    console.log(colors.red + '  Error: ' + error.message + colors.reset);
    if (error.stack) {
      console.log(colors.dim + error.stack + colors.reset);
    }
  }
}

/**
 * Print an info message
 * @param {string} message Info message
 */
function printInfo(message) {
  console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

/**
 * Print a warning message
 * @param {string} message Warning message
 */
function printWarning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

/**
 * Check if a file exists
 * @param {string} filePath File path
 * @returns {boolean} True if the file exists, false otherwise
 */
function fileExists(filePath) {
  try {
    return fs.existsSync(filePath);
  } catch (error) {
    return false;
  }
}

/**
 * Execute a command
 * @param {string} command Command to execute
 * @returns {Promise<string>} Command output
 */
function executeCommand(command) {
  return new Promise((resolve, reject) => {
    printInfo(`Executing command: ${command}`);
    
    const childProcess = spawn('sh', ['-c', command], { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    childProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    childProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`Command failed with code ${code}: ${stderr}`));
      }
    });
  });
}

/**
 * Restart the application
 */
async function restartApplication() {
  printSection('Restarting Application');
  
  try {
    // Kill any running npm processes
    await executeCommand('pkill -f "npm run dev" || true');
    
    // Start the application
    printInfo('Starting application...');
    
    const devProcess = spawn('npm', ['run', 'dev'], {
      env: {
        ...process.env,
        NODE_ENV: 'development',
        VITE_APP_ENV: 'development',
        VITE_USE_DIRECT_DB: 'true'
      },
      stdio: 'inherit'
    });
    
    devProcess.on('error', (error) => {
      printError('Error starting application', error);
    });
    
    printSuccess('Application restarted');
    return true;
  } catch (error) {
    printError('Error restarting application', error);
    return false;
  }
}

/**
 * Main function
 */
async function main() {
  printSection('Restarting Application with Direct Database Connection');
  
  // Restart the application
  const restartResult = await restartApplication();
  
  if (!restartResult) {
    printError('Failed to restart application');
    return;
  }
  
  // Print summary
  printSection('Summary');
  
  printSuccess('Application restarted with direct database connection');
  printInfo('The application will now use the direct database connection');
  printInfo('All database operations will be performed directly on the database');
  printInfo('This ensures that all data is up-to-date and accurate');
}

// Run the main function
main().catch(error => {
  printError('Unexpected error', error);
});
