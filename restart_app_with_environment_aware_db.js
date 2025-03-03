/**
 * Restart Application with Environment-Aware Database Connection
 * 
 * This script restarts the application with the environment-aware database connection.
 * It ensures that the application uses the appropriate database connection based on
 * the environment (browser or Node.js).
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

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
 * Read a file
 * @param {string} filePath File path
 * @returns {string} File content
 */
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    printError(`Error reading file: ${filePath}`, error);
    return '';
  }
}

/**
 * Execute a command
 * @param {string} command Command to execute
 * @returns {string} Command output
 */
function executeCommand(command) {
  try {
    printInfo(`Executing command: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (error) {
    printError(`Error executing command: ${command}`, error);
    return '';
  }
}

/**
 * Verify that the required files exist
 */
function verifyFiles() {
  printSection('Verifying Required Files');
  
  const requiredFiles = [
    'src/utils/environmentUtils.ts',
    'src/utils/databaseUtils.ts',
    'src/utils/syncDatabaseData.ts',
    'src/utils/initDatabase.ts',
    'src/utils/dbConnection.ts',
    'src/utils/browserDbConnection.ts',
    'src/integrations/supabase/client.ts',
  ];
  
  let allFilesExist = true;
  
  for (const filePath of requiredFiles) {
    if (fileExists(filePath)) {
      printSuccess(`File exists: ${filePath}`);
    } else {
      printError(`File does not exist: ${filePath}`);
      allFilesExist = false;
    }
  }
  
  return allFilesExist;
}

/**
 * Verify that the database connection is working
 */
function verifyDatabaseConnection() {
  printSection('Verifying Database Connection');
  
  try {
    // Execute the check-db-tables.mjs script
    const output = executeCommand('node check-db-tables.mjs');
    
    // Check if the output contains the success message
    if (output.includes('Database connection and tables check completed successfully')) {
      printSuccess('Database connection is working');
      return true;
    } else {
      printError('Database connection is not working');
      return false;
    }
  } catch (error) {
    printError('Error verifying database connection', error);
    return false;
  }
}

/**
 * Restart the application
 */
function restartApplication() {
  printSection('Restarting Application');
  
  try {
    // Kill any running npm processes
    executeCommand('pkill -f "npm run dev" || true');
    
    // Start the application
    printInfo('Starting application...');
    executeCommand('npm run dev &');
    
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
function main() {
  printSection('Restarting Application with Environment-Aware Database Connection');
  
  // Verify that the required files exist
  const filesExist = verifyFiles();
  
  if (!filesExist) {
    printError('Cannot restart application because required files are missing');
    return;
  }
  
  // Verify that the database connection is working
  const databaseConnectionWorking = verifyDatabaseConnection();
  
  if (!databaseConnectionWorking) {
    printError('Cannot restart application because the database connection is not working');
    return;
  }
  
  // Restart the application
  const restartResult = restartApplication();
  
  if (!restartResult) {
    printError('Failed to restart application');
    return;
  }
  
  // Print summary
  printSection('Summary');
  
  printSuccess('Application restarted with environment-aware database connection');
  printInfo('The application will now use the appropriate database connection based on the environment');
  printInfo('In a browser environment, it will use the browser-compatible database connection');
  printInfo('In a Node.js environment, it will use the direct database connection');
  printInfo('All calculations will be performed using real data from the database');
}

// Run the main function
main();
