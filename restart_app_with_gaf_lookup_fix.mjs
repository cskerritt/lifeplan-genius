/**
 * Restart App with GAF Lookup Fix
 * 
 * This script restarts the application with the GAF lookup fix applied.
 * It ensures that the pfr_code and mfr_code from the gaf_lookup table
 * are correctly used for the appropriate fee calculations.
 */

import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
 * Check if a file exists
 * @param {string} filePath Path to the file
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
 * Restart the application
 */
function restartApp() {
  printSection('Restarting Application with GAF Lookup Fix');
  
  // Check if the GAF lookup fix documentation exists
  const docPath = path.join(__dirname, 'GAF_LOOKUP_FIX_DOCUMENTATION.md');
  if (!fileExists(docPath)) {
    printError('GAF lookup fix documentation not found. Make sure the fix has been applied.');
    return;
  }
  
  printSuccess('GAF lookup fix documentation found.');
  printInfo('Restarting the application...');
  
  // Use npm run dev to restart the application
  const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
  const child = spawn(npm, ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    printError('Failed to restart the application', error);
  });
  
  printInfo('Application restart initiated. Check the console for any errors.');
  printInfo('Verify that the GAF lookup fix is working correctly by checking the logs.');
  
  printSection('Testing Instructions');
  printInfo('To verify the fix is working correctly:');
  printInfo('1. Check the logs for messages about using pfr_code for mfu_fees and mfr_code for pfr_fees');
  printInfo('2. Verify that geographic adjustments are applied correctly to MFU and PFR costs');
  printInfo('3. Confirm that no duplicate adjustments are being applied');
}

// Run the restart function
restartApp();
