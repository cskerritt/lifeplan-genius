/**
 * Restart Application with Direct Database Connection
 * 
 * This script restarts the application with direct PostgreSQL database connection
 * instead of using Supabase. It verifies that all the necessary changes have been
 * made to use direct database connections.
 */

// Import required modules
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// Promisify exec for async/await usage
const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);

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
 * Check if a file contains a specific string
 * @param {string} filePath Path to the file
 * @param {string} searchString String to search for
 * @returns {Promise<boolean>} True if the file contains the string, false otherwise
 */
async function fileContainsString(filePath, searchString) {
  try {
    const content = await readFileAsync(filePath, 'utf8');
    return content.includes(searchString);
  } catch (error) {
    printError(`Error reading file ${filePath}`, error);
    return false;
  }
}

/**
 * Test database connection using pg command line
 * @returns {Promise<boolean>} True if the connection is successful, false otherwise
 */
async function testDatabaseConnection() {
  try {
    // Get connection string from environment variables
    const result = await execAsync('grep -E "^VITE_DATABASE_URL=" .env.local || grep -E "^DATABASE_URL=" .env.local || grep -E "^VITE_DATABASE_URL=" .env || grep -E "^DATABASE_URL=" .env');
    
    let connectionString = '';
    if (result.stdout) {
      connectionString = result.stdout.trim().split('=')[1];
      // Remove quotes if present
      connectionString = connectionString.replace(/^["']|["']$/g, '');
    } else {
      connectionString = 'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
    }
    
    // Redact password for logging
    const redactedConnectionString = connectionString.replace(
      /(postgresql:\/\/\w+:)([^@]+)(@.+)/,
      '$1*****$3'
    );
    printInfo(`Using connection string: ${redactedConnectionString}`);
    
    // Test connection using psql
    printInfo('Testing database connection with psql...');
    await execAsync(`psql "${connectionString}" -c "SELECT 1 as connection_test;"`);
    
    printSuccess('Database connection test successful');
    return true;
  } catch (error) {
    printError('Database connection test failed', error);
    return false;
  }
}

/**
 * Verify that all necessary files have been updated to use direct database connection
 * @returns {Promise<boolean>} True if all files have been updated, false otherwise
 */
async function verifyDirectDbUsage() {
  const filesToCheck = [
    {
      path: 'src/utils/dbConnection.ts',
      searchString: 'shouldUseDirectConnection = () => {',
      description: 'shouldUseDirectConnection function in dbConnection.ts'
    },
    {
      path: 'src/hooks/usePlanData.ts',
      searchString: 'import { executeQuery }',
      description: 'executeQuery import in usePlanData.ts'
    },
    {
      path: 'src/hooks/usePlanItemsDb.ts',
      searchString: 'import { executeQuery',
      description: 'executeQuery import in usePlanItemsDb.ts'
    },
    {
      path: 'src/hooks/useCostCalculations.ts',
      searchString: 'import { executeQuery }',
      description: 'executeQuery import in useCostCalculations.ts'
    }
  ];
  
  let allUpdated = true;
  
  for (const file of filesToCheck) {
    printInfo(`Checking ${file.path}...`);
    const containsString = await fileContainsString(file.path, file.searchString);
    
    if (containsString) {
      printSuccess(`${file.path} has been updated to use direct database connection`);
    } else {
      printError(`${file.path} has not been updated to use direct database connection`);
      allUpdated = false;
    }
  }
  
  return allUpdated;
}

/**
 * Main function to run the restart process
 */
async function restartApp() {
  printSection('Restarting Application with Direct Database Connection');
  
  try {
    // Test database connection
    printInfo('Testing database connection...');
    const connectionSuccess = await testDatabaseConnection();
    
    if (connectionSuccess) {
      // Verify that all hooks are using direct database connection
      printInfo('Verifying direct database connection usage in hooks...');
      const allUpdated = await verifyDirectDbUsage();
      
      if (allUpdated) {
        printSuccess('All necessary files have been updated to use direct database connection');
        
        // Restart the application
        printInfo('Restarting the application...');
        
        try {
          // Kill any running instances of the application
          await execAsync('pkill -f "node.*vite" || true');
          printInfo('Killed any running instances of the application');
        } catch (error) {
          // It's okay if there are no running instances to kill
          printInfo('No running instances of the application to kill');
        }
        
        // Start the application in the background
        printInfo('Starting the application...');
        await execAsync('npm run dev &');
        
        printSuccess('Application started successfully');
        printInfo('You can now access the application at http://localhost:5173');
      } else {
        printError('Some files have not been updated to use direct database connection');
        printInfo('Please update all necessary files and try again');
      }
    } else {
      printError('Database connection test failed');
      printInfo('Please check your database connection settings and try again');
    }
  } catch (error) {
    printError('Error restarting the application', error);
  }
}

// Run the restart process
restartApp();
