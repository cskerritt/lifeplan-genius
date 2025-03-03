/**
 * Restart Application with Mock Supabase Client
 * 
 * This script restarts the application with a mock Supabase client that simulates
 * Supabase operations without actually connecting to Supabase. This is useful for
 * development and testing without requiring a Supabase connection.
 */

// Import required modules
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

// Promisify exec for async/await usage
const execAsync = promisify(exec);
const readFileAsync = promisify(fs.readFile);
const writeFileAsync = promisify(fs.writeFile);

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
 * Update imports in a file to use the mock Supabase client
 * @param {string} filePath Path to the file
 * @returns {Promise<boolean>} True if the file was updated, false otherwise
 */
async function updateImports(filePath) {
  try {
    let content = await readFileAsync(filePath, 'utf8');
    
    // Replace imports from the real Supabase client with the mock client
    const updatedContent = content.replace(
      /import\s+{\s*supabase\s*}\s+from\s+['"]@\/integrations\/supabase\/client['"];/g,
      'import { supabase } from "@/integrations/supabase/mockClient";'
    );
    
    // Only write the file if it was actually changed
    if (content !== updatedContent) {
      await writeFileAsync(filePath, updatedContent, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    printError(`Error updating imports in ${filePath}`, error);
    return false;
  }
}

/**
 * Verify that all necessary files have been updated to use the mock Supabase client
 * @returns {Promise<boolean>} True if all files have been updated, false otherwise
 */
async function verifyMockSupabaseUsage() {
  const filesToCheck = [
    {
      path: 'src/hooks/usePlanData.ts',
      searchString: 'import { supabase } from "@/integrations/supabase/mockClient"',
      description: 'mockClient import in usePlanData.ts'
    },
    {
      path: 'src/hooks/usePlanItemsDb.ts',
      searchString: 'import { supabase } from "@/integrations/supabase/mockClient"',
      description: 'mockClient import in usePlanItemsDb.ts'
    }
  ];
  
  let allUpdated = true;
  
  for (const file of filesToCheck) {
    printInfo(`Checking ${file.path}...`);
    const containsString = await fileContainsString(file.path, file.searchString);
    
    if (containsString) {
      printSuccess(`${file.path} has been updated to use mock Supabase client`);
    } else {
      printInfo(`${file.path} has not been updated to use mock Supabase client, updating...`);
      const updated = await updateImports(file.path);
      
      if (updated) {
        printSuccess(`${file.path} has been updated to use mock Supabase client`);
      } else {
        printError(`Failed to update ${file.path}`);
        allUpdated = false;
      }
    }
  }
  
  return allUpdated;
}

/**
 * Main function to run the restart process
 */
async function restartApp() {
  printSection('Restarting Application with Mock Supabase Client');
  
  try {
    // Verify that all hooks are using mock Supabase client
    printInfo('Verifying mock Supabase client usage in hooks...');
    const allUpdated = await verifyMockSupabaseUsage();
    
    if (allUpdated) {
      printSuccess('All necessary files have been updated to use mock Supabase client');
      
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
      printInfo('The application is now using the mock Supabase client');
      printInfo('This means that all Supabase operations are simulated in the browser');
      printInfo('No actual Supabase connection is being made');
    } else {
      printError('Some files have not been updated to use mock Supabase client');
      printInfo('Please update all necessary files and try again');
    }
  } catch (error) {
    printError('Error restarting the application', error);
  }
}

// Run the restart process
restartApp();
