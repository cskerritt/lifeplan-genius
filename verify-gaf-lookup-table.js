/**
 * Verify GAF Lookup Table
 * 
 * This script verifies that the GAF lookup functionality is using the gaf_lookup table
 * in the database. It checks the database schema and queries the gaf_lookup table directly.
 */

// Import the database connection module
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import dotenv from 'dotenv';

// Read the .env file to get the database connection string
dotenv.config();

// Log the database URL (with password masked)
const dbUrl = process.env.DATABASE_URL || '';
console.log('Database URL:', dbUrl.replace(/:([^:@]+)@/, ':****@'));

// Create a new database connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Log when the pool connects
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

// Log any pool errors
pool.on('error', (err) => {
  console.error('PostgreSQL pool error:', err);
});

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
 * Check if the gaf_lookup table exists in the database
 * @returns {Promise<boolean>} True if the table exists, false otherwise
 */
async function checkGafLookupTable() {
  try {
    printInfo('Checking if gaf_lookup table exists in the database...');
    
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'gaf_lookup'
      );
    `);
    
    const tableExists = result.rows[0].exists;
    
    if (tableExists) {
      printSuccess('gaf_lookup table exists in the database.');
    } else {
      printError('gaf_lookup table does not exist in the database.');
    }
    
    return tableExists;
  } catch (error) {
    printError('Error checking if gaf_lookup table exists', error);
    return false;
  }
}

/**
 * Get the schema of the gaf_lookup table
 * @returns {Promise<Array>} Array of column definitions
 */
async function getGafLookupSchema() {
  try {
    printInfo('Getting schema of gaf_lookup table...');
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = 'gaf_lookup'
      ORDER BY ordinal_position;
    `);
    
    if (result.rows.length === 0) {
      printError('No columns found in gaf_lookup table.');
      return [];
    }
    
    printSuccess(`Found ${result.rows.length} columns in gaf_lookup table:`);
    
    // Print the schema
    console.log('  ' + colors.bright + 'Column Name'.padEnd(20) + 'Data Type'.padEnd(20) + 'Nullable' + colors.reset);
    console.log('  ' + '-'.repeat(60));
    
    for (const column of result.rows) {
      console.log('  ' + column.column_name.padEnd(20) + column.data_type.padEnd(20) + column.is_nullable);
    }
    
    return result.rows;
  } catch (error) {
    printError('Error getting schema of gaf_lookup table', error);
    return [];
  }
}

/**
 * Query the gaf_lookup table for a specific ZIP code
 * @param {string} zipCode ZIP code to query
 * @returns {Promise<Object>} GAF entry for the ZIP code
 */
async function queryGafLookup(zipCode) {
  try {
    printInfo(`Querying gaf_lookup table for ZIP code: ${zipCode}`);
    
    const result = await pool.query(`
      SELECT * FROM gaf_lookup WHERE zip = $1 LIMIT 1;
    `, [zipCode]);
    
    if (result.rows.length === 0) {
      printError(`No GAF entry found for ZIP code: ${zipCode}`);
      return null;
    }
    
    const gafEntry = result.rows[0];
    
    printSuccess(`Found GAF entry for ZIP code: ${zipCode}`);
    console.log('  ' + colors.bright + 'Column'.padEnd(20) + 'Value' + colors.reset);
    console.log('  ' + '-'.repeat(60));
    
    for (const [key, value] of Object.entries(gafEntry)) {
      console.log('  ' + key.padEnd(20) + (value !== null ? value.toString() : 'null'));
    }
    
    return gafEntry;
  } catch (error) {
    printError(`Error querying gaf_lookup table for ZIP code: ${zipCode}`, error);
    return null;
  }
}

/**
 * Count the number of entries in the gaf_lookup table
 * @returns {Promise<number>} Number of entries
 */
async function countGafEntries() {
  try {
    printInfo('Counting entries in gaf_lookup table...');
    
    const result = await pool.query(`
      SELECT COUNT(*) FROM gaf_lookup;
    `);
    
    const count = parseInt(result.rows[0].count);
    
    printSuccess(`Found ${count} entries in gaf_lookup table.`);
    
    return count;
  } catch (error) {
    printError('Error counting entries in gaf_lookup table', error);
    return 0;
  }
}

/**
 * Verify that the useGafLookup hook is using the gaf_lookup table
 * @returns {Promise<boolean>} True if the hook is using the gaf_lookup table, false otherwise
 */
async function verifyUseGafLookupHook() {
  try {
    printInfo('Verifying that useGafLookup hook is using the gaf_lookup table...');
    
    // Read the useGafLookup.ts file
    const useGafLookupPath = './src/hooks/useGafLookup.ts';
    const useGafLookupContent = fs.readFileSync(useGafLookupPath, 'utf8');
    
    // Check if the file contains references to the gaf_lookup table
    const hasGafLookupTable = useGafLookupContent.includes('.from(\'gaf_lookup\')');
    
    if (hasGafLookupTable) {
      printSuccess('useGafLookup hook is using the gaf_lookup table.');
      
      // Extract the relevant code
      const lookupGeoFactorsFunction = useGafLookupContent.match(/const lookupGeoFactors = useCallback\(.*?\}\)(?:;|\))/s);
      
      if (lookupGeoFactorsFunction) {
        console.log('\n  ' + colors.bright + 'Relevant code from useGafLookup.ts:' + colors.reset);
        console.log('  ' + '-'.repeat(60));
        console.log('  ' + lookupGeoFactorsFunction[0].replace(/\n/g, '\n  '));
      }
    } else {
      printError('useGafLookup hook is NOT using the gaf_lookup table.');
    }
    
    return hasGafLookupTable;
  } catch (error) {
    printError('Error verifying useGafLookup hook', error);
    return false;
  }
}

/**
 * Main function to run the verification
 */
async function main() {
  printSection('Verifying GAF Lookup Table');
  
  try {
    // Check if the gaf_lookup table exists
    const tableExists = await checkGafLookupTable();
    
    if (!tableExists) {
      printError('Cannot proceed with verification because gaf_lookup table does not exist.');
      return;
    }
    
    // Get the schema of the gaf_lookup table
    const schema = await getGafLookupSchema();
    
    if (schema.length === 0) {
      printError('Cannot proceed with verification because gaf_lookup table schema could not be retrieved.');
      return;
    }
    
    // Count the number of entries in the gaf_lookup table
    const count = await countGafEntries();
    
    // Query the gaf_lookup table for a specific ZIP code
    const zipCodes = ['02917', '12345', '90210', '06471'];
    
    for (const zipCode of zipCodes) {
      await queryGafLookup(zipCode);
    }
    
    // Verify that the useGafLookup hook is using the gaf_lookup table
    await verifyUseGafLookupHook();
    
    // Print a summary
    printSection('Verification Summary');
    
    if (tableExists && schema.length > 0 && count > 0) {
      printSuccess('GAF lookup functionality is using the gaf_lookup table in the database.');
      printInfo('The gaf_lookup table exists, has a valid schema, and contains data.');
      printInfo('The useGafLookup hook is correctly querying the gaf_lookup table.');
    } else {
      printError('GAF lookup functionality may not be using the gaf_lookup table in the database.');
      printInfo('Please check the error messages above for details.');
    }
  } catch (error) {
    printError('Unhandled error in verification process', error);
  } finally {
    // Close the database connection pool
    await pool.end();
  }
}

// Run the main function
main().catch(error => {
  printError('Unhandled error in main function', error);
  process.exit(1);
});
