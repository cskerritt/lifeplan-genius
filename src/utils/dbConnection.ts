import { Pool } from 'pg';

// Create a connection pool for PostgreSQL
let pool: Pool | null = null;

// Debug flag - set to true to enable detailed logging
const DEBUG = true;

/**
 * Enhanced logging function that only logs when DEBUG is true
 * @param message Message to log
 * @param data Optional data to log
 */
const debugLog = (message: string, data?: any) => {
  if (DEBUG) {
    if (data !== undefined) {
      console.log(`[DB DEBUG] ${message}`, data);
    } else {
      console.log(`[DB DEBUG] ${message}`);
    }
  }
};

/**
 * Error logging function
 * @param message Error message
 * @param error Optional error object
 */
const errorLog = (message: string, error?: any) => {
  if (error !== undefined) {
    console.error(`[DB ERROR] ${message}`, error);
    if (error.stack) {
      console.error(`[DB ERROR] Stack trace:`, error.stack);
    }
  } else {
    console.error(`[DB ERROR] ${message}`);
  }
};

/**
 * Get a PostgreSQL connection pool
 * This is used to connect directly to the local database
 */
export const getDbPool = () => {
  if (!pool) {
    try {
      const connectionString = import.meta.env.VITE_DATABASE_URL || 
        'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
      
      // Log connection attempt with redacted password
      const redactedConnectionString = connectionString.replace(
        /(postgresql:\/\/\w+:)([^@]+)(@.+)/,
        '$1*****$3'
      );
      debugLog(`Creating PostgreSQL connection pool with connection string: ${redactedConnectionString}`);
      
      // Create the pool with additional options for better debugging
      pool = new Pool({
        connectionString,
        max: 20, // Maximum number of clients in the pool
        idleTimeoutMillis: 30000, // How long a client is allowed to remain idle before being closed
        connectionTimeoutMillis: 5000, // How long to wait for a connection to become available
      });
      
      // Add event listeners for connection issues
      pool.on('error', (err) => {
        errorLog('Unexpected error on idle PostgreSQL client', err);
        pool = null; // Reset pool on error
      });
      
      pool.on('connect', (client) => {
        debugLog('New client connected to PostgreSQL');
      });
      
      // Test the connection immediately
      pool.query('SELECT NOW()')
        .then(result => {
          debugLog('PostgreSQL connection test successful', result.rows[0]);
        })
        .catch(err => {
          errorLog('PostgreSQL connection test failed', err);
        });
      
      debugLog('PostgreSQL connection pool created successfully');
    } catch (error) {
      errorLog('Failed to create PostgreSQL connection pool', error);
      throw error;
    }
  } else {
    debugLog('Using existing PostgreSQL connection pool');
  }
  
  return pool;
};

/**
 * Execute a query using the PostgreSQL connection pool
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export const executeQuery = async (query: string, params: any[] = []) => {
  let client;
  
  try {
    debugLog('Acquiring client from pool...');
    client = await getDbPool().connect();
    debugLog('Client acquired successfully');
    
    // Log the query with parameters
    const queryStart = Date.now();
    debugLog(`Executing query: ${query}`);
    debugLog('With parameters:', params);
    
    // Execute the query
    const result = await client.query(query, params);
    
    // Log the result
    const queryDuration = Date.now() - queryStart;
    debugLog(`Query executed successfully in ${queryDuration}ms`);
    debugLog(`Rows affected: ${result.rowCount}`);
    
    return result;
  } catch (error) {
    errorLog('Error executing query', error);
    
    // Provide more context about the failed query
    errorLog('Failed query:', query);
    errorLog('Query parameters:', params);
    
    // Check for specific PostgreSQL error types
    if (error.code) {
      switch (error.code) {
        case '42P01':
          errorLog('Error: Relation (table) does not exist. Check if migrations have been applied.');
          break;
        case '28P01':
          errorLog('Error: Invalid authentication credentials.');
          break;
        case '3D000':
          errorLog('Error: Database does not exist.');
          break;
        case '08006':
          errorLog('Error: Connection failure. Check if PostgreSQL server is running.');
          break;
        default:
          errorLog(`PostgreSQL error code: ${error.code}`);
      }
    }
    
    throw error;
  } finally {
    if (client) {
      debugLog('Releasing client back to pool');
      client.release();
    }
  }
};

/**
 * Check if we should use direct PostgreSQL connection
 * @returns boolean indicating if we should use direct PostgreSQL connection
 */
export const shouldUseDirectConnection = () => {
  // Always return true to ensure we always use direct PostgreSQL connection
  debugLog('shouldUseDirectConnection called, returning true');
  return true;
};

/**
 * Test the database connection and schema
 * @returns Promise<boolean> indicating if the test was successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    debugLog('Testing database connection...');
    
    // Test basic connection
    const connectionResult = await executeQuery('SELECT NOW() as current_time', []);
    debugLog('Connection test successful', connectionResult.rows[0]);
    
    // Check if care_plan_entries table exists
    try {
      const tableResult = await executeQuery(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'care_plan_entries'
        ) as table_exists`,
        []
      );
      
      if (tableResult.rows[0].table_exists) {
        debugLog('care_plan_entries table exists');
        
        // Check column types
        const columnResult = await executeQuery(
          `SELECT column_name, data_type 
           FROM information_schema.columns 
           WHERE table_name = 'care_plan_entries' 
           AND column_name IN ('min_cost', 'avg_cost', 'max_cost', 'annual_cost', 'lifetime_cost')`,
          []
        );
        
        debugLog('Column types:', columnResult.rows);
        
        // Check if all cost columns are numeric
        const allNumeric = columnResult.rows.every(row => 
          row.data_type === 'numeric' || row.data_type === 'decimal'
        );
        
        if (allNumeric) {
          debugLog('All cost columns are numeric type');
        } else {
          errorLog('Some cost columns are not numeric type', columnResult.rows);
        }
      } else {
        errorLog('care_plan_entries table does not exist');
      }
    } catch (tableError) {
      errorLog('Error checking table schema', tableError);
    }
    
    return true;
  } catch (error) {
    errorLog('Database connection test failed', error);
    return false;
  }
};
