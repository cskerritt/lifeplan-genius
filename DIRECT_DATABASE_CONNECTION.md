# Direct Database Connection

This document explains how the application has been configured to use a direct connection to the PostgreSQL database instead of mock data.

## Overview

The application now uses a direct connection to the PostgreSQL database for all database operations. This ensures that all calculations are performed using real data from the database, rather than mock data.

## Configuration

The following components have been configured to use the direct database connection:

1. **Supabase Client**: The Supabase client has been updated to use the direct database connection instead of the mock database connection.
2. **GAF Lookup**: The GAF lookup functionality now uses the real `gaf_lookup` table in the database.
3. **Database Connection**: The database connection is configured to use the PostgreSQL connection string from the `.env` file.

## Database Tables

The following tables are used by the application:

1. **gaf_lookup**: Contains geographic adjustment factors for different ZIP codes.
2. **life_care_plans**: Contains information about life care plans.
3. **care_plan_entries**: Contains entries for life care plans.

## Verification

The following scripts have been created to verify the database connection and configuration:

1. **check-db-connection.mjs**: Checks the database connection string.
2. **check-db-tables.mjs**: Checks if the required tables exist in the database.
3. **verify-app-db-connection.mjs**: Verifies that the application is using the direct database connection.
4. **restart_app_with_direct_db_connection.js**: Restarts the application with the direct database connection.

## How to Use

To ensure that the application is using the direct database connection:

1. Run the verification script:
   ```
   node verify-app-db-connection.mjs
   ```

2. If the verification is successful, restart the application:
   ```
   node restart_app_with_direct_db_connection.js
   ```

## Troubleshooting

If you encounter any issues with the database connection:

1. Check the database connection string in the `.env` file.
2. Ensure that the PostgreSQL database is running.
3. Verify that the required tables exist in the database.
4. Check the logs for any error messages.

## Implementation Details

### Supabase Client

The Supabase client has been updated to use the direct database connection:

```typescript
// Direct Database Supabase client configuration
// This file provides an implementation of the Supabase client
// that uses our custom auth service and direct database connection
import { auth } from '@/utils/authService';
import { executeQuery } from '@/utils/dbConnection';
import type { Database } from './types';
```

### Database Connection

The database connection is configured to use the PostgreSQL connection string from the `.env` file:

```typescript
// Create a connection pool for PostgreSQL
let pool: Pool | null = null;

// Get a PostgreSQL connection pool
export const getDbPool = () => {
  if (!pool) {
    try {
      const connectionString = import.meta.env.VITE_DATABASE_URL || 
        'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
      
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
    } catch (error) {
      errorLog('Failed to create PostgreSQL connection pool', error);
      throw error;
    }
  }
  
  return pool;
};
```

### GAF Lookup

The GAF lookup functionality uses the Supabase client to query the `gaf_lookup` table:

```typescript
const lookupGeoFactors = useCallback(async (zipCode: string) => {
  if (!zipCode) return;
  
  // Ensure ZIP code is exactly 5 digits with leading zeros
  const formattedZip = zipCode.toString().padStart(5, '0');
  console.log('🔍 Looking up ZIP:', formattedZip);
  setIsLoading(true);
  
  try {
    const { data, error } = await supabase
      .from('gaf_lookup')
      .select('mfr_code, pfr_code, city, state_name')
      .eq('zip', formattedZip)
      .maybeSingle();

    if (error) {
      console.error('Lookup error:', error);
      throw error;
    }

    console.log('Lookup result:', data);

    if (!data) {
      console.log('No data found for ZIP:', formattedZip);
      setGeoFactors(null);
      toast({
        variant: "destructive",
        title: "Location Not Found",
        description: "Please try another ZIP code or enter state/city manually"
      });
      return null;
    }

    const factors: GafFactors = {
      mfr_code: Number(data.mfr_code),
      pfr_code: Number(data.pfr_code),
      city: data.city,
      state_name: data.state_name
    };

    console.log('Found factors:', factors);
    setGeoFactors(factors);
    return factors;

  } catch (error) {
    console.error('Error in lookupGeoFactors:', error);
    setGeoFactors(null);
    toast({
      variant: "destructive",
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to lookup location data"
    });
    return null;
  } finally {
    setIsLoading(false);
  }
}, [toast]);
```

## Conclusion

The application is now configured to use a direct connection to the PostgreSQL database for all database operations. This ensures that all calculations are performed using real data from the database, rather than mock data.
