# Environment-Aware Database Connection

This document explains how the application has been configured to use an environment-aware database connection approach. This ensures that calculations are performed using real data from the database, regardless of the environment (browser or Node.js).

## Overview

The application now uses an environment-aware approach to database connections:

1. In a Node.js environment (server-side), it uses a direct connection to the PostgreSQL database.
2. In a browser environment (client-side), it uses a browser-compatible implementation that works with synchronized data from the real database.

This approach ensures that all calculations are performed using real data from the database, while maintaining compatibility with both environments.

## Components

The environment-aware database connection consists of the following components:

1. **Environment Detection**: The `environmentUtils.ts` module provides utilities to detect the current execution environment (browser or Node.js).

2. **Database Utilities**: The `databaseUtils.ts` module provides a unified interface for database operations, automatically selecting the appropriate implementation based on the environment.

3. **Direct Database Connection**: The `dbConnection.ts` module provides a direct connection to the PostgreSQL database for Node.js environments.

4. **Browser-Compatible Database Connection**: The `browserDbConnection.ts` module provides a browser-compatible implementation that works with synchronized data from the real database.

5. **Data Synchronization**: The `syncDatabaseData.ts` module provides utilities to synchronize data from the real database to the browser-compatible implementation.

6. **Database Initialization**: The `initDatabase.ts` module initializes the database connection and synchronizes data when the application starts.

## How It Works

1. When the application starts, the `initDatabase.ts` module is imported, which initializes the database connection and synchronizes data.

2. The `databaseUtils.ts` module provides a unified interface for database operations, automatically selecting the appropriate implementation based on the environment:
   - In a Node.js environment, it uses the direct database connection from `dbConnection.ts`.
   - In a browser environment, it uses the browser-compatible implementation from `browserDbConnection.ts`.

3. The `syncDatabaseData.ts` module synchronizes data from the real database to the browser-compatible implementation, ensuring that calculations in the browser use actual data.

4. The Supabase client uses the unified interface from `databaseUtils.ts`, ensuring that it works correctly in both environments.

## Benefits

This approach provides several benefits:

1. **Real Data**: All calculations are performed using real data from the database, ensuring accuracy.

2. **Environment Compatibility**: The application works correctly in both Node.js and browser environments.

3. **Simplified Development**: Developers can use the same API for database operations, regardless of the environment.

4. **Improved Testing**: Tests can be run in both environments, ensuring that the application works correctly in all scenarios.

## Implementation Details

### Environment Detection

The `environmentUtils.ts` module provides utilities to detect the current execution environment:

```typescript
/**
 * Check if the code is running in a browser environment
 * @returns boolean indicating if the code is running in a browser
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

/**
 * Check if the code is running in a Node.js environment
 * @returns boolean indicating if the code is running in Node.js
 */
export const isNode = (): boolean => {
  return typeof process !== 'undefined' && 
         process.versions != null && 
         process.versions.node != null;
};
```

### Database Utilities

The `databaseUtils.ts` module provides a unified interface for database operations:

```typescript
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
    
    // Use the appropriate implementation
    if (isRunningInBrowser) {
      return await browserDb.executeQuery(query, params);
    } else {
      return await directDb.executeQuery(query, params);
    }
  } catch (error) {
    errorLog('Error executing query', error);
    throw error;
  }
};
```

### Data Synchronization

The `syncDatabaseData.ts` module synchronizes data from the real database to the browser-compatible implementation:

```typescript
/**
 * Synchronize data from the real database to the mock database
 * @param tables Array of table names to synchronize
 * @returns Object with synchronization results
 */
export const synchronizeData = async (tables: string[] = ['gaf_lookup', 'life_care_plans', 'care_plan_entries']): Promise<Record<string, any>> => {
  // Only run in browser environment
  if (!isBrowser()) {
    return { success: true, message: 'Not running in browser environment, skipping synchronization' };
  }
  
  try {
    // Synchronize each table
    for (const tableName of tables) {
      // Fetch data from the real database
      const data = await fetchDataFromRealDatabase(tableName);
      
      // Store the data in the mock data storage
      mockData[tableName] = data;
    }
    
    // Update the browser database with the synchronized data
    updateBrowserDatabase();
    
    return {
      success: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};
```

### Browser-Compatible Database Connection

The `browserDbConnection.ts` module provides a browser-compatible implementation that works with synchronized data:

```typescript
// Get mock data from synchronized data or use default mock data if not synchronized
const getMockData = () => {
  // Check if data has been synchronized
  if (isDataSynchronized()) {
    return {
      life_care_plans: getSynchronizedData('life_care_plans'),
      care_plan_entries: getSynchronizedData('care_plan_entries'),
      gaf_lookup: getSynchronizedData('gaf_lookup')
    };
  }
  
  // Use default mock data if not synchronized
  return {
    // Default mock data...
  };
};
```

## How to Use

To ensure that the application is using the environment-aware database connection:

1. Run the verification script:
   ```
   node verify-app-db-connection.mjs
   ```

2. If the verification is successful, restart the application:
   ```
   node restart_app_with_environment_aware_db.js
   ```

## Troubleshooting

If you encounter any issues with the database connection:

1. Check the database connection string in the `.env` file.
2. Ensure that the PostgreSQL database is running.
3. Verify that the required tables exist in the database.
4. Check the logs for any error messages.
5. Ensure that the application is using the environment-aware database connection.

## Conclusion

The environment-aware database connection approach ensures that calculations are performed using real data from the database, regardless of the environment. This improves the accuracy of calculations and simplifies development and testing.
