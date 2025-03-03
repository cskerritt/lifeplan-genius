# UUID Fix and Foreign Key Bypass Solution

This document provides an overview of the solution to the issue with adding care plans to the database.

## The Problem

When attempting to add care plans to the database, the following error was occurring:

```
[DB SYNC ERROR] Error executing query via API Error: API error: invalid input syntax for type uuid: "mock-user-id"
```

This error occurred because:

1. The application was using a hardcoded string "mock-user-id" as the user_id in the database
2. PostgreSQL expects the user_id field to be in a valid UUID format (e.g., "123e4567-e89b-12d3-a456-426614174000")
3. The foreign key constraints in the database were preventing the insertion of records with invalid foreign keys

## The Solution

The solution consists of two parts:

1. **UUID Fix**: The `authService.ts` file has been updated to generate valid UUIDs for the user ID.
2. **Foreign Key Bypass**: The `syncDatabaseData.ts` file has been updated to ensure that the foreign key bypass is working correctly in development mode.

## How to Use

### 1. Apply the UUID Fix

To apply the UUID fix and restart the application:

```
node restart_app_with_uuid_fix.mjs
```

### 2. Apply the Foreign Key Bypass

To apply the foreign key bypass and restart the application:

```
node restart_app_with_fk_bypass.mjs
```

### 3. Test the Solution

To test the solution:

```
node test-foreign-key-bypass-simple.js
```

Then follow the instructions provided by the test script to manually test the foreign key bypass.

### 4. Open the Application

To open the application in the browser:

```
node open-app.mjs
```

## Documentation

For more detailed information about the solution, please refer to the following documentation:

- [UUID Fix Documentation](UUID_FIX_DOCUMENTATION_UPDATED.md): Detailed explanation of the UUID fix
- [Foreign Key Bypass Documentation](FOREIGN_KEY_BYPASS_DOCUMENTATION.md): Detailed explanation of the foreign key bypass

## Scripts

The following scripts are available:

- `restart_app_with_uuid_fix.mjs`: Restarts the application with the UUID fix
- `restart_app_with_fk_bypass.mjs`: Restarts the application with the foreign key bypass
- `restart_app_with_direct_db_connection.mjs`: Restarts the application with the direct database connection
- `test-uuid-fix.mjs`: Tests the UUID fix
- `test-foreign-key-bypass-simple.js`: Provides instructions for testing the foreign key bypass
- `open-app.mjs`: Opens the application in the default browser

## Conclusion

The UUID fix and foreign key bypass solution resolves the issue with adding care plans to the database by ensuring that valid UUIDs are used for the user ID and by bypassing foreign key constraints in development mode. This allows the application to work without requiring valid foreign keys, which is useful for development and testing.
