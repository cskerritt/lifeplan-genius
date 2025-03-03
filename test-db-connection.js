/**
 * Database Connection Test Script
 * 
 * This script tests the connection to the PostgreSQL database and performs
 * various checks to diagnose any issues with the database connection.
 */

import pg from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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
 * Create a database connection pool
 * @returns {pg.Pool} PostgreSQL connection pool
 */
function createDbPool() {
  // Get connection string from environment variables
  const connectionString = process.env.VITE_DATABASE_URL || 
    process.env.DATABASE_URL || 
    'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
  
  // Redact password for logging
  const redactedConnectionString = connectionString.replace(
    /(postgresql:\/\/\w+:)([^@]+)(@.+)/,
    '$1*****$3'
  );
  printInfo(`Using connection string: ${redactedConnectionString}`);
  
  // Create the pool with additional options for better debugging
  const pool = new pg.Pool({
    connectionString,
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
    connectionTimeoutMillis: 5000, // How long to wait for a connection to become available
  });
  
  // Add event listeners for connection issues
  pool.on('error', (err) => {
    printError('Unexpected error on idle PostgreSQL client', err);
  });
  
  return pool;
}

/**
 * Execute a query using the PostgreSQL connection pool
 * @param {pg.Pool} pool PostgreSQL connection pool
 * @param {string} query SQL query string
 * @param {any[]} params Query parameters
 * @returns {Promise<pg.QueryResult>} Query result
 */
async function executeQuery(pool, query, params = []) {
  let client;
  
  try {
    printInfo('Acquiring client from pool...');
    client = await pool.connect();
    printInfo('Client acquired successfully');
    
    // Log the query with parameters
    const queryStart = Date.now();
    printInfo(`Executing query: ${query}`);
    printInfo('With parameters:', params);
    
    // Execute the query
    const result = await client.query(query, params);
    
    // Log the result
    const queryDuration = Date.now() - queryStart;
    printInfo(`Query executed successfully in ${queryDuration}ms`);
    printInfo(`Rows affected: ${result.rowCount}`);
    
    return result;
  } catch (error) {
    printError('Error executing query', error);
    
    // Provide more context about the failed query
    printError('Failed query:', query);
    printError('Query parameters:', params);
    
    // Check for specific PostgreSQL error types
    if (error.code) {
      switch (error.code) {
        case '42P01':
          printError('Error: Relation (table) does not exist. Check if migrations have been applied.');
          break;
        case '28P01':
          printError('Error: Invalid authentication credentials.');
          break;
        case '3D000':
          printError('Error: Database does not exist.');
          break;
        case '08006':
          printError('Error: Connection failure. Check if PostgreSQL server is running.');
          break;
        default:
          printError(`PostgreSQL error code: ${error.code}`);
      }
    }
    
    throw error;
  } finally {
    if (client) {
      printInfo('Releasing client back to pool');
      client.release();
    }
  }
}

/**
 * Test basic database connection
 */
async function testBasicConnection() {
  printSection('Testing Basic Database Connection');
  
  try {
    // Get connection string from environment variables
    const connectionString = process.env.VITE_DATABASE_URL || 
      process.env.DATABASE_URL || 
      'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
    
    // Redact password for logging
    const redactedConnectionString = connectionString.replace(
      /(postgresql:\/\/\w+:)([^@]+)(@.+)/,
      '$1*****$3'
    );
    printInfo(`Using connection string: ${redactedConnectionString}`);
    
    // Create a new client for testing
    const client = new pg.Client({ connectionString });
    
    printInfo('Attempting to connect...');
    await client.connect();
    printSuccess('Successfully connected to PostgreSQL database');
    
    // Get PostgreSQL version
    const versionResult = await client.query('SELECT version()');
    printInfo(`PostgreSQL version: ${versionResult.rows[0].version}`);
    
    // Get current database name
    const dbNameResult = await client.query('SELECT current_database()');
    printInfo(`Current database: ${dbNameResult.rows[0].current_database}`);
    
    // Close the connection
    await client.end();
    printSuccess('Connection closed successfully');
    
    return true;
  } catch (error) {
    printError('Failed to connect to PostgreSQL database', error);
    
    // Provide more specific error messages based on error code
    if (error.code) {
      switch (error.code) {
        case 'ECONNREFUSED':
          printError('Connection refused. Make sure PostgreSQL server is running on the specified host and port.');
          break;
        case '28P01':
          printError('Authentication failed. Check your username and password.');
          break;
        case '3D000':
          printError('Database does not exist. Check your database name.');
          break;
        default:
          printError(`PostgreSQL error code: ${error.code}`);
      }
    }
    
    return false;
  }
}

/**
 * Test database schema
 * @param {pg.Pool} pool PostgreSQL connection pool
 */
async function testDatabaseSchema(pool) {
  printSection('Testing Database Schema');
  
  try {
    // Check if care_plan_entries table exists
    printInfo('Checking if care_plan_entries table exists...');
    const tableResult = await executeQuery(
      pool,
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'care_plan_entries'
      ) as table_exists`,
      []
    );
    
    if (tableResult.rows[0].table_exists) {
      printSuccess('care_plan_entries table exists');
      
      // Check column types
      printInfo('Checking column types for cost columns...');
      const columnResult = await executeQuery(
        pool,
        `SELECT column_name, data_type 
         FROM information_schema.columns 
         WHERE table_name = 'care_plan_entries' 
         AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')`,
        []
      );
      
      // Display column types
      columnResult.rows.forEach(row => {
        printInfo(`Column ${row.column_name}: ${row.data_type}`);
      });
      
      // Check if all cost columns are numeric
      const allNumeric = columnResult.rows.every(row => 
        row.data_type === 'numeric' || row.data_type === 'decimal'
      );
      
      if (allNumeric) {
        printSuccess('All cost columns are numeric type');
      } else {
        printError('Some cost columns are not numeric type');
        printInfo('The following columns should be numeric:');
        columnResult.rows.forEach(row => {
          if (row.data_type !== 'numeric' && row.data_type !== 'decimal') {
            printError(`Column ${row.column_name} is ${row.data_type} instead of numeric`);
          }
        });
      }
      
      // Check for age_increments column
      printInfo('Checking for age_increments column...');
      const ageIncrementsResult = await executeQuery(
        pool,
        `SELECT EXISTS (
          SELECT FROM information_schema.columns 
          WHERE table_name = 'care_plan_entries' 
          AND column_name = 'age_increments'
        ) as column_exists`,
        []
      );
      
      if (ageIncrementsResult.rows[0].column_exists) {
        printSuccess('age_increments column exists');
      } else {
        printError('age_increments column does not exist');
      }
    } else {
      printError('care_plan_entries table does not exist');
    }
    
    return true;
  } catch (error) {
    printError('Error testing database schema', error);
    return false;
  }
}

/**
 * Test inserting and retrieving data
 * @param {pg.Pool} pool PostgreSQL connection pool
 */
async function testDataOperations(pool) {
  printSection('Testing Data Operations');
  
  try {
    // Use a valid plan_id from the life_care_plans table
    const testId = 'f5fddb23-3dcc-4b9d-929f-e4532a0a474c'; // This ID exists in the life_care_plans table
    printInfo(`Using existing plan_id: ${testId}`);
    
    // Insert a test record
    printInfo('Inserting test record...');
    const insertResult = await executeQuery(
      pool,
      `INSERT INTO care_plan_entries (
        plan_id, category, item, frequency, 
        min_cost, avg_cost, max_cost, annual_cost, lifetime_cost,
        start_age, end_age, is_one_time
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12
      ) RETURNING id`,
      [
        testId, // plan_id
        'test_category', // category
        'Test Item', // item
        '1x per year', // frequency
        123.45, // min_cost
        234.56, // avg_cost
        345.67, // max_cost
        234.56, // annual_cost
        7036.80, // lifetime_cost
        30, // start_age
        60, // end_age
        false // is_one_time
      ]
    );
    
    if (insertResult.rows.length > 0) {
      const insertedId = insertResult.rows[0].id;
      printSuccess(`Test record inserted with ID: ${insertedId}`);
      
      // Retrieve the inserted record
      printInfo('Retrieving test record...');
      const selectResult = await executeQuery(
        pool,
        `SELECT * FROM care_plan_entries WHERE id = $1`,
        [insertedId]
      );
      
      if (selectResult.rows.length > 0) {
        printSuccess('Test record retrieved successfully');
        
        // Check decimal values
        const record = selectResult.rows[0];
        printInfo('Checking decimal values...');
        
        // Check if values are stored correctly
        const costFields = ['min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost'];
        let allCorrect = true;
        
        costFields.forEach(field => {
          const value = parseFloat(record[field]);
          printInfo(`${field}: ${value}`);
          
          // Check if the value is a number
          if (isNaN(value)) {
            printError(`${field} is not a number: ${record[field]}`);
            allCorrect = false;
          }
        });
        
        if (allCorrect) {
          printSuccess('All decimal values are stored correctly');
        } else {
          printError('Some decimal values are not stored correctly');
        }
        
        // Delete the test record
        printInfo('Deleting test record...');
        const deleteResult = await executeQuery(
          pool,
          `DELETE FROM care_plan_entries WHERE id = $1 RETURNING id`,
          [insertedId]
        );
        
        if (deleteResult.rows.length > 0) {
          printSuccess('Test record deleted successfully');
        } else {
          printError('Failed to delete test record');
        }
      } else {
        printError('Failed to retrieve test record');
      }
    } else {
      printError('Failed to insert test record');
    }
    
    return true;
  } catch (error) {
    printError('Error testing data operations', error);
    return false;
  }
}

/**
 * Main function to run all tests
 */
async function runTests() {
  printSection('Database Connection Test Script');
  
  try {
    // Test basic connection
    const basicConnectionSuccess = await testBasicConnection();
    
    if (basicConnectionSuccess) {
      // Create a connection pool for further tests
      const pool = createDbPool();
      
      // Test database schema
      await testDatabaseSchema(pool);
      
      // Test data operations
      await testDataOperations(pool);
      
      // Close the pool
      await pool.end();
      printInfo('Connection pool closed');
    }
    
    printSection('Test Summary');
    printInfo('Tests completed. Check the logs above for details.');
  } catch (error) {
    printError('Unexpected error during tests', error);
  } finally {
    // Exit the process
    process.exit(0);
  }
}

// Run the tests
runTests();
