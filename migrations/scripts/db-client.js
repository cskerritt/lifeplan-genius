/**
 * Unified database connection module for migrations
 * 
 * This module provides functions to create both Supabase and PostgreSQL clients
 * using environment variables for credentials.
 */

import { createClient } from '@supabase/supabase-js';
import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

const { Pool } = pg;

// Check for required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'SUPABASE_ANON_KEY'
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('Error: The following required environment variables are missing:');
  missingEnvVars.forEach(varName => console.error(`- ${varName}`));
  console.error('\nPlease create or update your .env file with these variables.');
  process.exit(1);
}

/**
 * Creates a Supabase client using environment variables
 * @param {Object} options - Additional options for the Supabase client
 * @returns {Object} Supabase client
 */
function createSupabaseClient(options = {}) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  const defaultOptions = {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  };
  
  const clientOptions = { ...defaultOptions, ...options };
  
  return createClient(supabaseUrl, supabaseServiceRoleKey, clientOptions);
}

/**
 * Creates a PostgreSQL client using environment variables
 * @returns {Object} PostgreSQL client
 */
function createPgClient() {
  // Check if DATABASE_URL is provided
  if (!process.env.DATABASE_URL) {
    console.error('Error: DATABASE_URL environment variable is not set.');
    console.error('Please add it to your .env file.');
    process.exit(1);
  }
  
  return new Pool({
    connectionString: process.env.DATABASE_URL,
  });
}

/**
 * Executes a SQL query using the Supabase RPC function
 * @param {Object} supabase - Supabase client
 * @param {string} sql - SQL query to execute
 * @returns {Promise<Object>} Query result
 */
async function executeSupabaseSql(supabase, sql) {
  try {
    const { data, error } = await supabase.rpc('apply_migration', { sql });
    
    if (error) {
      throw error;
    }
    
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Executes a SQL query using the PostgreSQL client
 * @param {Object} pgClient - PostgreSQL client
 * @param {string} sql - SQL query to execute
 * @returns {Promise<Object>} Query result
 */
async function executePgSql(pgClient, sql) {
  try {
    const result = await pgClient.query(sql);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Gets column types for a table using the Supabase client
 * @param {Object} supabase - Supabase client
 * @param {string} tableName - Table name
 * @param {Array<string>} columnNames - Column names
 * @returns {Promise<Object>} Column types
 */
async function getColumnTypes(supabase, tableName, columnNames) {
  try {
    // Try using the RPC function if available
    try {
      const { data, error } = await supabase.rpc('get_column_types', {
        table_name: tableName,
        column_names: columnNames
      });
      
      if (!error) {
        return { data, error: null };
      }
    } catch (rpcError) {
      // RPC function not available, fallback to direct query
    }
    
    // Fallback to direct query
    const columnList = columnNames.map(col => `'${col}'`).join(',');
    const { data, error } = await supabase.from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', tableName)
      .filter('column_name', 'in', `(${columnList})`);
    
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Gets column types for a table using the PostgreSQL client
 * @param {Object} pgClient - PostgreSQL client
 * @param {string} tableName - Table name
 * @param {Array<string>} columnNames - Column names
 * @returns {Promise<Object>} Column types
 */
async function getPgColumnTypes(pgClient, tableName, columnNames) {
  try {
    const columnList = columnNames.map(col => `'${col}'`).join(',');
    const query = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = '${tableName}' 
      AND column_name IN (${columnList})
    `;
    
    const result = await pgClient.query(query);
    return { data: result.rows, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export {
  createSupabaseClient,
  createPgClient,
  executeSupabaseSql,
  executePgSql,
  getColumnTypes,
  getPgColumnTypes
};
