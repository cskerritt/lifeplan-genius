/**
 * Database Utilities
 * 
 * This module provides a unified interface for database operations,
 * automatically selecting the appropriate implementation based on the environment.
 */

import { isBrowser } from './environmentUtils';
import * as browserDb from './browserDbConnection';

// Only import direct database connection in Node.js environment
// This prevents the pg module from being loaded in the browser
let directDb: any = null;
if (!isBrowser()) {
  // Dynamic import to avoid loading pg in browser
  import('./dbConnection').then(module => {
    directDb = module;
  });
}

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
      console.log(`[DB UTILS] ${message}`, data);
    } else {
      console.log(`[DB UTILS] ${message}`);
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
    console.error(`[DB UTILS ERROR] ${message}`, error);
    if (error.stack) {
      console.error(`[DB UTILS ERROR] Stack trace:`, error.stack);
    }
  } else {
    console.error(`[DB UTILS ERROR] ${message}`);
  }
};

/**
 * Execute a query using the appropriate database connection
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export const executeQuery = async (query: string, params: any[] = []) => {
  try {
    // Determine which implementation to use based on the environment
    const isRunningInBrowser = isBrowser();
    debugLog(`Executing query in ${isRunningInBrowser ? 'browser' : 'Node.js'} environment`);
    
    // Use the appropriate implementation
    if (isRunningInBrowser) {
      debugLog('Using browser-compatible database connection');
      return await browserDb.executeQuery(query, params);
    } else {
      debugLog('Using direct database connection');
      if (!directDb) {
        throw new Error('Direct database connection not available');
      }
      return await directDb.executeQuery(query, params);
    }
  } catch (error) {
    errorLog('Error executing query', error);
    throw error;
  }
};

/**
 * Test the database connection and schema
 * @returns Promise<boolean> indicating if the test was successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    // Determine which implementation to use based on the environment
    const isRunningInBrowser = isBrowser();
    debugLog(`Testing database connection in ${isRunningInBrowser ? 'browser' : 'Node.js'} environment`);
    
    // Use the appropriate implementation
    if (isRunningInBrowser) {
      debugLog('Using browser-compatible database connection');
      return await browserDb.testDatabaseConnection();
    } else {
      debugLog('Using direct database connection');
      if (!directDb) {
        throw new Error('Direct database connection not available');
      }
      return await directDb.testDatabaseConnection();
    }
  } catch (error) {
    errorLog('Database connection test failed', error);
    return false;
  }
};

/**
 * Check if we should use direct PostgreSQL connection
 * @returns boolean indicating if we should use direct PostgreSQL connection
 */
export const shouldUseDirectConnection = (): boolean => {
  // Determine which implementation to use based on the environment
  const isRunningInBrowser = isBrowser();
  
  if (isRunningInBrowser) {
    debugLog('Running in browser environment, cannot use direct PostgreSQL connection');
    return false;
  } else {
    debugLog('Running in Node.js environment, can use direct PostgreSQL connection');
    return true;
  }
};

/**
 * Get database connection information for debugging
 * @returns Object with database connection information
 */
export const getDatabaseConnectionInfo = (): Record<string, any> => {
  const isRunningInBrowser = isBrowser();
  
  return {
    environment: isRunningInBrowser ? 'browser' : 'Node.js',
    connectionType: isRunningInBrowser ? 'browser-compatible' : 'direct',
    usingDirectConnection: !isRunningInBrowser,
    timestamp: new Date().toISOString()
  };
};
