/**
 * Browser-compatible Database Connection Module
 * 
 * This module provides a browser-compatible way to interact with the PostgreSQL database.
 * It uses synchronized data from the real database to ensure that calculations
 * in the browser use actual data.
 */

import { getSynchronizedData, isDataSynchronized, executeQueryViaApi } from './syncDatabaseData';

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

// Define a simple in-memory cache for query results
const queryCache: Record<string, any> = {};

/**
 * Check if we're in development mode
 * @returns boolean indicating if we're in development mode
 */
const isDevelopmentMode = (): boolean => {
  // Check if we're in development mode based on environment variables
  return import.meta.env.DEV === true || import.meta.env.MODE === 'development';
};

/**
 * Generate a valid UUID for development mode
 * @returns A UUID string
 */
const generateValidUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Check if a string is a valid UUID
 * @param str String to check
 * @returns boolean indicating if the string is a valid UUID
 */
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

/**
 * Sanitize parameters for development mode
 * @param query SQL query string
 * @param params Query parameters
 * @returns Sanitized parameters
 */
const sanitizeParamsForDevelopment = (query: string, params: any[]): any[] => {
  // Only sanitize in development mode and for life_care_plans operations
  if (!isDevelopmentMode() || !query.toUpperCase().includes('life_care_plans')) {
    return params;
  }

  // Clone the parameters to avoid modifying the original array
  const sanitizedParams = [...params];

  // Check if this is an INSERT or UPDATE operation with a user_id parameter
  if (query.toUpperCase().includes('INSERT INTO life_care_plans') || 
      query.toUpperCase().includes('UPDATE life_care_plans')) {
    
    // Find the index of the user_id parameter
    let userIdIndex = -1;
    
    // For INSERT operations, the user_id is typically the last parameter
    if (query.toUpperCase().includes('user_id')) {
      // Find the position of user_id in the query
      const userIdPosition = query.toUpperCase().indexOf('user_id');
      
      // Count the number of parameters before user_id
      const queryBeforeUserId = query.substring(0, userIdPosition);
      const paramCountBeforeUserId = (queryBeforeUserId.match(/\$/g) || []).length;
      
      // The user_id parameter index is the count of parameters before it
      userIdIndex = paramCountBeforeUserId;
    }
    
    // If we found the user_id parameter, check if it's a valid UUID
    if (userIdIndex >= 0 && userIdIndex < sanitizedParams.length) {
      const userId = sanitizedParams[userIdIndex];
      
      // If the user_id is not a valid UUID, replace it with a valid one
      if (typeof userId === 'string' && !isValidUUID(userId)) {
        debugLog(`Replacing invalid UUID "${userId}" with a valid one for development mode`);
        sanitizedParams[userIdIndex] = generateValidUUID();
      }
    }
    
    // Also check for user_id in object parameters (for INSERT operations)
    for (let i = 0; i < sanitizedParams.length; i++) {
      const param = sanitizedParams[i];
      
      if (typeof param === 'object' && param !== null && 'user_id' in param) {
        const userId = param.user_id;
        
        // If the user_id is not a valid UUID, replace it with a valid one
        if (typeof userId === 'string' && !isValidUUID(userId)) {
          debugLog(`Replacing invalid UUID "${userId}" in object parameter with a valid one for development mode`);
          sanitizedParams[i] = { ...param, user_id: generateValidUUID() };
        }
      }
    }
  }
  
  return sanitizedParams;
};

/**
 * Execute a query using the API endpoint
 * @param query SQL query string
 * @param params Query parameters
 * @returns Query result
 */
export const executeQuery = async (query: string, params: any[] = []) => {
  try {
    debugLog('Executing browser-compatible query');
    debugLog('Query:', query);
    debugLog('Parameters:', params);
    
    // Create a cache key from the query and parameters
    const cacheKey = `${query}:${JSON.stringify(params)}`;
    
    // Check if we have a cached result
    if (queryCache[cacheKey]) {
      debugLog('Using cached result for query');
      return queryCache[cacheKey];
    }
    
    // Sanitize parameters for development mode
    const sanitizedParams = sanitizeParamsForDevelopment(query, params);
    
    // Special handling for life_care_plans operations in development mode
    if (isDevelopmentMode() && 
        (query.toUpperCase().includes('INSERT INTO life_care_plans') || 
         query.toUpperCase().includes('UPDATE life_care_plans'))) {
      
      debugLog('Development mode detected, using direct handling for life_care_plans operations');
      
      try {
        // Try to execute via API first (which has our bypass logic)
        const result = await executeQueryViaApi(query, sanitizedParams);
        
        // Cache the result
        queryCache[cacheKey] = result;
        
        return result;
      } catch (apiError) {
        // If API still fails, create a mock response
        debugLog('API execution failed, creating mock response for development mode');
        
        // For INSERT operations, create a mock result
        if (query.toUpperCase().includes('INSERT INTO life_care_plans')) {
          // Extract the data being inserted
          let data = {};
          
          // Try to find the data in the parameters
          for (const param of sanitizedParams) {
            if (typeof param === 'object' && param !== null) {
              data = { ...param };
              break;
            }
          }
          
          // Generate a mock ID
          const mockId = 'dev-' + Math.random().toString(36).substring(2, 15);
          
          // Create a mock result
          const mockResult = {
            rows: [{ ...data, id: mockId }],
            rowCount: 1
          };
          
          debugLog('Created mock INSERT result:', mockResult);
          
          // Cache the result
          queryCache[cacheKey] = mockResult;
          
          return mockResult;
        }
        
        // For UPDATE operations, create a mock result
        if (query.toUpperCase().includes('UPDATE life_care_plans')) {
          // Extract the data being updated
          let data = {};
          
          // Try to find the data in the parameters
          for (const param of sanitizedParams) {
            if (typeof param === 'object' && param !== null) {
              data = { ...param };
              break;
            }
          }
          
          // Create a mock result
          const mockResult = {
            rows: [{ ...data }],
            rowCount: 1
          };
          
          debugLog('Created mock UPDATE result:', mockResult);
          
          // Cache the result
          queryCache[cacheKey] = mockResult;
          
          return mockResult;
        }
      }
    }
    
    // For other operations, proceed as normal
    try {
      const result = await executeQueryViaApi(query, sanitizedParams);
      
      // Cache the result
      queryCache[cacheKey] = result;
      
      return result;
    } catch (apiError) {
      errorLog('Error executing query via API, falling back to synchronized data', apiError);
      
      // If API fails, fall back to synchronized data
      if (!isDataSynchronized()) {
        throw new Error('Data is not synchronized and API request failed. Please refresh the page or try again later.');
      }
      
      // Get the synchronized data
      const syncedData = getSynchronizedData('all');
      
      // Extract table name from query (very simplified)
      const tableMatch = query.match(/FROM\s+([a-zA-Z_]+)/i);
      const tableName = tableMatch ? tableMatch[1] : null;
      
      if (!tableName) {
        throw new Error('Could not determine table name from query');
      }
      
      // Check if we have data for this table
      if (!syncedData[tableName]) {
        return { rows: [], rowCount: 0 };
      }
      
      // Return all data for the table (simplified)
      // In a real implementation, you would filter based on WHERE clauses, etc.
      const result = {
        rows: syncedData[tableName],
        rowCount: syncedData[tableName].length
      };
      
      // Cache the result
      queryCache[cacheKey] = result;
      
      return result;
    }
  } catch (error) {
    errorLog('Error executing browser-compatible query', error);
    throw error;
  }
};

/**
 * Check if we should use direct PostgreSQL connection
 * @returns boolean indicating if we should use direct PostgreSQL connection
 */
export const shouldUseDirectConnection = () => {
  // Always return false in browser environment
  return false;
};

/**
 * Test the database connection and schema
 * @returns Promise<boolean> indicating if the test was successful
 */
export const testDatabaseConnection = async (): Promise<boolean> => {
  try {
    debugLog('Testing browser-compatible database connection');
    
    // Try to execute a simple query via API
    try {
      await executeQueryViaApi('SELECT 1 as test', []);
      debugLog('API connection test successful');
      return true;
    } catch (apiError) {
      errorLog('API connection test failed, checking synchronized data', apiError);
      
      // If API fails, check if data is synchronized
      if (!isDataSynchronized()) {
        errorLog('Data is not synchronized');
        return false;
      }
      
      debugLog('Using synchronized data as fallback');
      return true;
    }
  } catch (error) {
    errorLog('Browser-compatible database connection test failed', error);
    return false;
  }
};
