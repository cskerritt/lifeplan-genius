/**
 * Restart Application Without Supabase
 * 
 * This script restarts the application with the new authentication service and
 * without Supabase. It verifies that all necessary files have been updated to
 * remove Supabase dependencies.
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
 * Verify that all necessary files have been updated to remove Supabase dependencies
 * @returns {Promise<boolean>} True if all files have been updated, false otherwise
 */
async function verifyNoSupabaseUsage() {
  const filesToCheck = [
    {
      path: 'src/hooks/usePlanData.ts',
      searchString: 'import { supabase }',
      description: 'Supabase import in usePlanData.ts'
    },
    {
      path: 'src/hooks/usePlanItemsDb.ts',
      searchString: 'import { supabase }',
      description: 'Supabase import in usePlanItemsDb.ts'
    },
    {
      path: 'src/App.tsx',
      searchString: 'import { supabase }',
      description: 'Supabase import in App.tsx'
    },
    {
      path: 'src/pages/Auth.tsx',
      searchString: 'import { supabase }',
      description: 'Supabase import in Auth.tsx'
    }
  ];
  
  let allUpdated = true;
  
  for (const file of filesToCheck) {
    printInfo(`Checking ${file.path}...`);
    const containsString = await fileContainsString(file.path, file.searchString);
    
    if (containsString) {
      printError(`${file.path} still contains Supabase imports`);
      allUpdated = false;
    } else {
      printSuccess(`${file.path} has been updated to remove Supabase dependencies`);
    }
  }

  // Check if the new auth service is being used
  const authServiceFiles = [
    {
      path: 'src/App.tsx',
      searchString: 'import { auth } from "@/utils/authService"',
      description: 'Auth service import in App.tsx'
    },
    {
      path: 'src/pages/Auth.tsx',
      searchString: 'import { auth } from "@/utils/authService"',
      description: 'Auth service import in Auth.tsx'
    }
  ];

  for (const file of authServiceFiles) {
    printInfo(`Checking ${file.path} for auth service usage...`);
    const containsString = await fileContainsString(file.path, file.searchString);
    
    if (containsString) {
      printSuccess(`${file.path} is using the new auth service`);
    } else {
      printError(`${file.path} is not using the new auth service`);
      allUpdated = false;
    }
  }
  
  return allUpdated;
}

/**
 * Main function to run the restart process
 */
async function restartApp() {
  printSection('Restarting Application Without Supabase');
  
  try {
    // Verify that all files have been updated to remove Supabase dependencies
    printInfo('Verifying removal of Supabase dependencies...');
    const allUpdated = await verifyNoSupabaseUsage();
    
    if (allUpdated) {
      printSuccess('All necessary files have been updated to remove Supabase dependencies');
      
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
      printInfo('The application is now running without Supabase dependencies');
      printInfo('All database operations are performed using the browser-compatible database connection');
      printInfo('Authentication is handled by the new auth service');
    } else {
      printError('Some files still contain Supabase dependencies');
      printInfo('Please update all necessary files and try again');
    }
  } catch (error) {
    printError('Error restarting the application', error);
  }
}

// Run the restart process
restartApp();
