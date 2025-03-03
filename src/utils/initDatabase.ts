/**
 * Database Initialization Module
 * 
 * This module initializes the database connection and synchronizes data
 * when the application starts. This ensures that the browser has access
 * to the real data from the database.
 */

import { isBrowser } from './environmentUtils';
import { testDatabaseConnection } from './databaseUtils';
import { synchronizeData, getSynchronizationStatus } from './syncDatabaseData';

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
      console.log(`[DB INIT] ${message}`, data);
    } else {
      console.log(`[DB INIT] ${message}`);
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
    console.error(`[DB INIT ERROR] ${message}`, error);
    if (error.stack) {
      console.error(`[DB INIT ERROR] Stack trace:`, error.stack);
    }
  } else {
    console.error(`[DB INIT ERROR] ${message}`);
  }
};

/**
 * Initialize the database connection
 * @returns Promise<boolean> indicating if the initialization was successful
 */
export const initializeDatabase = async (): Promise<boolean> => {
  try {
    debugLog('Initializing database connection...');
    
    // Check if running in browser environment
    if (isBrowser()) {
      debugLog('Running in browser environment, synchronizing data...');
      
      try {
        // Synchronize data from the real database
        const syncResult = await synchronizeData();
        
        if (!syncResult.success) {
          errorLog('Data synchronization failed', syncResult);
          return false;
        }
        
        debugLog('Data synchronization successful', syncResult);
        
        // Log synchronization status
        const syncStatus = getSynchronizationStatus();
        debugLog('Synchronization status:', syncStatus);
        
        return true;
      } catch (syncError) {
        errorLog('Error during data synchronization', syncError);
        return false;
      }
    } else {
      debugLog('Running in Node.js environment');
      
      // Test the database connection
      const connectionSuccess = await testDatabaseConnection();
      
      if (!connectionSuccess) {
        errorLog('Database connection test failed');
        return false;
      }
      
      debugLog('Database connection test successful');
      return true;
    }
  } catch (error) {
    errorLog('Error initializing database', error);
    return false;
  }
};

/**
 * Get database initialization status
 * @returns Object with initialization status
 */
export const getDatabaseInitializationStatus = (): Record<string, any> => {
  return {
    initialized: true,
    environment: isBrowser() ? 'browser' : 'Node.js',
    synchronization: isBrowser() ? getSynchronizationStatus() : 'N/A',
    timestamp: new Date().toISOString()
  };
};

// Initialize the database when this module is imported
initializeDatabase().then(success => {
  if (success) {
    debugLog('Database initialized successfully');
  } else {
    errorLog('Database initialization failed');
  }
}).catch(error => {
  errorLog('Unhandled error during database initialization', error);
});
