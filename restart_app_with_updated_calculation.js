/**
 * Restart App with Updated Calculation Logic
 * 
 * This script restarts the application after updating the calculation logic
 * for fee schedule percentiles and combined base rates.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

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
 * Restart the development server
 */
async function restartDevServer() {
  printSection('Restarting Development Server');
  
  try {
    // Kill any running development servers
    printInfo('Stopping any running development servers...');
    try {
      await execAsync('pkill -f "vite"');
      printSuccess('Stopped running development servers');
    } catch (error) {
      // It's okay if there are no servers to kill
      printInfo('No running development servers found');
    }
    
    // Start the development server in the background
    printInfo('Starting development server...');
    const { stdout, stderr } = await execAsync('npm run dev &');
    
    if (stderr) {
      printError('Error starting development server', new Error(stderr));
      return false;
    }
    
    printSuccess('Development server started successfully');
    printInfo('Server output:');
    console.log(colors.dim + stdout + colors.reset);
    
    return true;
  } catch (error) {
    printError('Error restarting development server', error);
    return false;
  }
}

/**
 * Main function to run the restart process
 */
async function main() {
  printSection('Restarting App with Updated Calculation Logic');
  
  try {
    // Restart the development server
    const serverRestarted = await restartDevServer();
    
    if (serverRestarted) {
      printSection('Summary');
      printSuccess('Application restarted with updated calculation logic');
      printInfo('The following changes have been applied:');
      console.log('  1. Fixed CPT code data retrieval to ensure fee schedule percentiles are available');
      console.log('  2. Updated geographic factor application to correctly adjust MFR and PFR percentiles');
      console.log('  3. Fixed combined base rate calculation to use adjusted percentiles');
      console.log('  4. Updated calculation display to show the correct values and formulas');
      console.log('\nThe application should now correctly:');
      console.log('  - Display fee schedule percentiles for CPT code 99203');
      console.log('  - Apply geographic factors to these percentiles');
      console.log('  - Calculate combined base rates as averages of the adjusted percentiles');
      console.log('  - Use these combined base rates for annual and lifetime cost calculations');
    } else {
      printError('Failed to restart the application');
    }
  } catch (error) {
    printError('Unhandled error in restart process', error);
  }
}

// Run the main function
main().catch(error => {
  printError('Unhandled error in main function', error);
  process.exit(1);
});
