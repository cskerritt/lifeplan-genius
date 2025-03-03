// Script to verify that the application is using the direct database connection
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
 * Check if the application is using the direct database connection
 */
function checkDirectDatabaseConnection() {
  printSection('Checking Direct Database Connection');
  
  // Check if the dbConnection.ts file exists
  const dbConnectionPath = path.join(__dirname, 'src', 'utils', 'dbConnection.ts');
  if (!fileExists(dbConnectionPath)) {
    printError(`Database connection file not found: ${dbConnectionPath}`);
    return false;
  }
  
  printSuccess(`Database connection file found: ${dbConnectionPath}`);
  
  // Read the dbConnection.ts file
  const dbConnectionContent = readFile(dbConnectionPath);
  
  // Check if the shouldUseDirectConnection function is defined
  if (dbConnectionContent.includes('shouldUseDirectConnection')) {
    printSuccess('shouldUseDirectConnection function found in dbConnection.ts');
    
    // Check if the function always returns true
    if (dbConnectionContent.includes('return true')) {
      printSuccess('shouldUseDirectConnection function is configured to always return true');
    } else {
      printWarning('shouldUseDirectConnection function may not always return true');
      
      // Extract the function implementation
      const match = dbConnectionContent.match(/shouldUseDirectConnection\s*=\s*\(\)\s*=>\s*{([^}]*)}/);
      if (match) {
        printInfo('Function implementation:');
        console.log(match[0]);
      }
    }
  } else {
    printError('shouldUseDirectConnection function not found in dbConnection.ts');
    return false;
  }
  
  return true;
}

/**
 * Check if the application is using the mock database connection
 */
function checkMockDatabaseConnection() {
  printSection('Checking Mock Database Connection');
  
  // Check if the browserDbConnection.ts file exists
  const browserDbConnectionPath = path.join(__dirname, 'src', 'utils', 'browserDbConnection.ts');
  if (!fileExists(browserDbConnectionPath)) {
    printError(`Browser database connection file not found: ${browserDbConnectionPath}`);
    return false;
  }
  
  printSuccess(`Browser database connection file found: ${browserDbConnectionPath}`);
  
  // Read the browserDbConnection.ts file
  const browserDbConnectionContent = readFile(browserDbConnectionPath);
  
  // Check if the shouldUseDirectConnection function is defined
  if (browserDbConnectionContent.includes('shouldUseDirectConnection')) {
    printSuccess('shouldUseDirectConnection function found in browserDbConnection.ts');
    
    // Check if the function always returns true
    if (browserDbConnectionContent.includes('return true')) {
      printWarning('shouldUseDirectConnection function in browserDbConnection.ts is configured to always return true');
      printInfo('This may cause conflicts with the direct database connection');
    } else {
      printSuccess('shouldUseDirectConnection function in browserDbConnection.ts is not configured to always return true');
    }
  } else {
    printInfo('shouldUseDirectConnection function not found in browserDbConnection.ts');
  }
  
  return true;
}

/**
 * Check if the application is using the Supabase client
 */
function checkSupabaseClient() {
  printSection('Checking Supabase Client');
  
  // Check if the client.ts file exists
  const clientPath = path.join(__dirname, 'src', 'integrations', 'supabase', 'client.ts');
  if (!fileExists(clientPath)) {
    printError(`Supabase client file not found: ${clientPath}`);
    return false;
  }
  
  printSuccess(`Supabase client file found: ${clientPath}`);
  
  // Read the client.ts file
  const clientContent = readFile(clientPath);
  
  // Check if the client is using the direct database connection
  if (clientContent.includes('executeQuery')) {
    printSuccess('Supabase client is using the executeQuery function');
    
    // Check if the executeQuery function is imported from dbConnection.ts or browserDbConnection.ts
    if (clientContent.includes("from '@/utils/dbConnection'")) {
      printSuccess('executeQuery function is imported from dbConnection.ts');
    } else if (clientContent.includes("from '@/utils/browserDbConnection'")) {
      printWarning('executeQuery function is imported from browserDbConnection.ts');
      printInfo('This means the application is using the mock database connection');
    } else {
      printWarning('Could not determine the source of the executeQuery function');
    }
  } else {
    printError('Supabase client is not using the executeQuery function');
    return false;
  }
  
  return true;
}

/**
 * Check if the application is using the GAF lookup table
 */
function checkGafLookup() {
  printSection('Checking GAF Lookup');
  
  // Check if the useGafLookup.ts file exists
  const useGafLookupPath = path.join(__dirname, 'src', 'hooks', 'useGafLookup.ts');
  if (!fileExists(useGafLookupPath)) {
    printError(`useGafLookup.ts file not found: ${useGafLookupPath}`);
    return false;
  }
  
  printSuccess(`useGafLookup.ts file found: ${useGafLookupPath}`);
  
  // Read the useGafLookup.ts file
  const useGafLookupContent = readFile(useGafLookupPath);
  
  // Check if the hook is using the Supabase client
  if (useGafLookupContent.includes("from \"@/integrations/supabase/client\"") || 
      useGafLookupContent.includes("from '@/integrations/supabase/client'")) {
    printSuccess('useGafLookup hook is importing the Supabase client');
  } else {
    printError('useGafLookup hook is not importing the Supabase client');
    return false;
  }
  
  // Check if the hook is querying the gaf_lookup table
  if (useGafLookupContent.includes(".from('gaf_lookup')")) {
    printSuccess('useGafLookup hook is querying the gaf_lookup table');
  } else {
    printError('useGafLookup hook is not querying the gaf_lookup table');
    return false;
  }
  
  return true;
}

/**
 * Main function
 */
function main() {
  printSection('Verifying Application Database Connection');
  
  // Check if the application is using the direct database connection
  const directDbConnectionResult = checkDirectDatabaseConnection();
  
  // Check if the application is using the mock database connection
  const mockDbConnectionResult = checkMockDatabaseConnection();
  
  // Check if the application is using the Supabase client
  const supabaseClientResult = checkSupabaseClient();
  
  // Check if the application is using the GAF lookup table
  const gafLookupResult = checkGafLookup();
  
  // Print summary
  printSection('Summary');
  
  if (directDbConnectionResult) {
    printSuccess('Direct database connection is configured correctly');
  } else {
    printError('Direct database connection is not configured correctly');
  }
  
  if (supabaseClientResult) {
    printSuccess('Supabase client is configured correctly');
  } else {
    printError('Supabase client is not configured correctly');
  }
  
  if (gafLookupResult) {
    printSuccess('GAF lookup is configured correctly');
  } else {
    printError('GAF lookup is not configured correctly');
  }
  
  // Check which database connection the application is using
  const clientPath = path.join(__dirname, 'src', 'integrations', 'supabase', 'client.ts');
  const clientContent = readFile(clientPath);
  
  if (clientContent.includes("from '@/utils/dbConnection'")) {
    printSuccess('Application is using the direct database connection');
  } else if (clientContent.includes("from '@/utils/browserDbConnection'")) {
    printWarning('Application is using the mock database connection');
    printInfo('To use the direct database connection, update the import in src/integrations/supabase/client.ts');
  } else {
    printWarning('Could not determine which database connection the application is using');
  }
}

// Run the main function
main();
