// Script to check database tables
import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get the database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please check your .env file and ensure it is set correctly.');
  process.exit(1);
}

// Create a connection pool
const pool = new pg.Pool({
  connectionString: databaseUrl,
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
 * Test the database connection
 */
async function testConnection() {
  try {
    printInfo('Testing database connection...');
    
    // Try to connect to the database
    const client = await pool.connect();
    printSuccess('Successfully connected to the database');
    
    // Run a simple query
    const result = await client.query('SELECT NOW()');
    printSuccess('Current database time: ' + result.rows[0].now);
    
    // Release the client back to the pool
    client.release();
    
    return true;
  } catch (error) {
    printError('Error connecting to the database', error);
    return false;
  }
}

/**
 * List all tables in the database
 */
async function listTables() {
  try {
    printInfo('Listing all tables in the database...');
    
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    
    if (result.rows.length === 0) {
      printInfo('No tables found in the database');
    } else {
      printSuccess(`Found ${result.rows.length} tables in the database:`);
      result.rows.forEach((row, index) => {
        console.log(`  ${index + 1}. ${row.table_name}`);
      });
    }
    
    return result.rows.map(row => row.table_name);
  } catch (error) {
    printError('Error listing tables', error);
    return [];
  }
}

/**
 * Check if a specific table exists
 * @param {string} tableName Table name to check
 */
async function checkTableExists(tableName) {
  try {
    printInfo(`Checking if table '${tableName}' exists...`);
    
    const result = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      );
    `, [tableName]);
    
    const tableExists = result.rows[0].exists;
    
    if (tableExists) {
      printSuccess(`Table '${tableName}' exists in the database`);
    } else {
      printError(`Table '${tableName}' does not exist in the database`);
    }
    
    return tableExists;
  } catch (error) {
    printError(`Error checking if table '${tableName}' exists`, error);
    return false;
  }
}

/**
 * Get the schema of a table
 * @param {string} tableName Table name
 */
async function getTableSchema(tableName) {
  try {
    printInfo(`Getting schema of table '${tableName}'...`);
    
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public'
      AND table_name = $1
      ORDER BY ordinal_position;
    `, [tableName]);
    
    if (result.rows.length === 0) {
      printError(`No columns found in table '${tableName}'`);
      return [];
    }
    
    printSuccess(`Found ${result.rows.length} columns in table '${tableName}':`);
    
    // Print the schema
    console.log('  ' + colors.bright + 'Column Name'.padEnd(30) + 'Data Type'.padEnd(20) + 'Nullable' + colors.reset);
    console.log('  ' + '-'.repeat(70));
    
    for (const column of result.rows) {
      console.log('  ' + column.column_name.padEnd(30) + column.data_type.padEnd(20) + column.is_nullable);
    }
    
    return result.rows;
  } catch (error) {
    printError(`Error getting schema of table '${tableName}'`, error);
    return [];
  }
}

/**
 * Count the number of rows in a table
 * @param {string} tableName Table name
 */
async function countRows(tableName) {
  try {
    printInfo(`Counting rows in table '${tableName}'...`);
    
    const result = await pool.query(`SELECT COUNT(*) FROM ${tableName}`);
    const count = parseInt(result.rows[0].count);
    
    printSuccess(`Table '${tableName}' has ${count} rows`);
    
    return count;
  } catch (error) {
    printError(`Error counting rows in table '${tableName}'`, error);
    return 0;
  }
}

/**
 * Show sample data from a table
 * @param {string} tableName Table name
 * @param {number} limit Number of rows to show
 */
async function showSampleData(tableName, limit = 5) {
  try {
    printInfo(`Showing sample data from table '${tableName}'...`);
    
    const result = await pool.query(`SELECT * FROM ${tableName} LIMIT $1`, [limit]);
    
    if (result.rows.length === 0) {
      printInfo(`No data found in table '${tableName}'`);
      return [];
    }
    
    printSuccess(`Sample data from table '${tableName}':`);
    
    // Get column names
    const columns = Object.keys(result.rows[0]);
    
    // Print the data
    result.rows.forEach((row, index) => {
      console.log(`\n  Row ${index + 1}:`);
      for (const column of columns) {
        const value = row[column] !== null ? row[column].toString() : 'null';
        console.log(`    ${column.padEnd(20)}: ${value}`);
      }
    });
    
    return result.rows;
  } catch (error) {
    printError(`Error showing sample data from table '${tableName}'`, error);
    return [];
  }
}

/**
 * Main function
 */
async function main() {
  printSection('Database Connection Test');
  
  try {
    // Test the database connection
    const connectionSuccess = await testConnection();
    
    if (!connectionSuccess) {
      printError('Cannot proceed with database checks because connection failed');
      return;
    }
    
    // List all tables
    printSection('Database Tables');
    const tables = await listTables();
    
    // Check specific tables
    const tablesToCheck = ['gaf_lookup', 'life_care_plans', 'care_plan_entries'];
    
    for (const tableName of tablesToCheck) {
      printSection(`Table: ${tableName}`);
      
      // Check if the table exists
      const tableExists = await checkTableExists(tableName);
      
      if (!tableExists) {
        printError(`Cannot proceed with checks for table '${tableName}' because it does not exist`);
        continue;
      }
      
      // Get the schema of the table
      await getTableSchema(tableName);
      
      // Count the number of rows in the table
      await countRows(tableName);
      
      // Show sample data from the table
      await showSampleData(tableName);
    }
    
    printSection('Summary');
    
    if (tables.length > 0) {
      printSuccess('Database connection and tables check completed successfully');
      printInfo(`Found ${tables.length} tables in the database`);
      
      // Check if all required tables exist
      const allTablesExist = tablesToCheck.every(tableName => tables.includes(tableName));
      
      if (allTablesExist) {
        printSuccess('All required tables exist in the database');
      } else {
        const missingTables = tablesToCheck.filter(tableName => !tables.includes(tableName));
        printError(`Some required tables are missing: ${missingTables.join(', ')}`);
      }
    } else {
      printError('No tables found in the database');
    }
  } catch (error) {
    printError('Unhandled error in main function', error);
  } finally {
    // Close the pool
    await pool.end();
    printInfo('Database connection pool closed');
  }
}

// Run the main function
main().catch(error => {
  printError('Unhandled error', error);
  process.exit(1);
});
