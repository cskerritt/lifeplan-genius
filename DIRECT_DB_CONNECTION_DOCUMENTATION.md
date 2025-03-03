# Direct Database Connection Documentation

This document outlines the changes made to remove Supabase dependencies from the application and replace them with direct database connections and a custom authentication service.

## Overview

The goal was to eliminate any dependency on Supabase and ensure that all database operations and authentication are handled locally. This was achieved by:

1. Creating a custom authentication service
2. Using direct database connections or browser-compatible database connections
3. Creating a mock Supabase client that uses our custom implementations

## Changes Made

### 1. Removed Supabase Package Dependency

- Removed `@supabase/supabase-js` from package.json
- Installed dependencies with `--legacy-peer-deps` to resolve conflicts

### 2. Authentication Service

A custom authentication service was created to replace Supabase Auth:

- **File**: `src/utils/authService.ts`
- **Features**:
  - Uses localStorage to persist session information
  - Implements the same API as Supabase Auth (getSession, getUser, signIn, signUp, signOut, onAuthStateChange)
  - Allows for seamless integration with the existing application code

### 3. Database Connections

Two database connection modules were implemented:

#### a. Direct PostgreSQL Connection (`src/utils/dbConnection.ts`)

- Provides direct connection to PostgreSQL database
- Adds detailed logging for database operations
- Adds error handling with specific error messages for different PostgreSQL error codes
- Includes a `testDatabaseConnection()` function to verify the database connection and schema

#### b. Browser-Compatible Connection (`src/utils/browserDbConnection.ts`)

- Provides a browser-compatible way to interact with the database
- Simulates database operations without requiring Node.js-specific modules
- Uses the same API as the direct PostgreSQL connection module
- Includes mock data for testing and development
- Dynamically adds mock data for requested ZIP codes that don't exist in the mock data

### 4. Mock Supabase Client

A mock Supabase client was created to replace the actual Supabase client:

- **File**: `src/integrations/supabase/client.ts`
- **Features**:
  - Uses our custom authentication service for auth operations
  - Uses our browser-compatible database connection for database operations
  - Implements the same API as the Supabase client
  - Includes mock implementations for all required Supabase methods (maybeSingle, ilike, not, etc.)
  - Includes mock implementations for storage and RPC methods

### 5. Application Components

The following components were updated to use our custom implementations:

- `src/App.tsx`: Updated to use our custom authentication service
- `src/pages/Auth.tsx`: Updated to use our custom authentication service
- Various other components that use database operations

## Database Tables

The application uses the following database tables:

1. **life_care_plans**: Stores information about life care plans
   - Fields: id, first_name, last_name, date_of_birth, date_of_injury, gender, zip_code, city, state, street_address, county_apc, county_drg, life_expectancy, projected_age_at_death, created_at, updated_at

2. **care_plan_entries**: Stores entries for life care plans
   - Fields: id, plan_id, category, item, frequency, min_cost, avg_cost, max_cost, annual_cost, lifetime_cost, start_age, end_age, is_one_time, age_increments

3. **gaf_lookup**: Stores geographic adjustment factors
   - Fields: id, zip, city, state_name, mfr_code, pfr_code

## Mock Data

The browser-compatible database connection includes mock data for the following tables:

1. **life_care_plans**: Sample life care plan data
2. **care_plan_entries**: Sample care plan entries
3. **gaf_lookup**: Sample geographic adjustment factors for ZIP codes

The mock data is dynamically updated when new ZIP codes are requested, ensuring that the application can handle any ZIP code without requiring a real database connection.

## Benefits

### 1. No External Dependencies

- No dependency on Supabase or any other external service
- All operations are performed locally
- No need for an internet connection

### 2. Better Control

- Full control over authentication and database operations
- Ability to customize the implementation to suit our needs
- Better error handling and debugging

### 3. Simplified Development

- No need to set up Supabase for development
- Easier to test and debug
- Consistent behavior across environments

## Future Improvements

1. **Enhanced Authentication**: Add more authentication features like password reset, email verification, etc.
2. **Better Database Connection**: Improve the browser-compatible database connection to handle more complex queries
3. **Offline Support**: Add offline support for database operations
4. **Sync Mechanism**: Add a sync mechanism to synchronize local data with a remote database when online

## Testing

To test the changes, run:

```bash
npm run dev
```

This will start the application with the new direct database connection and custom authentication service.

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Verify that localStorage is available and working correctly
3. Check that the mock Supabase client is being used correctly
4. Ensure that all components are using the new implementations
5. Check the logs for any database connection errors
