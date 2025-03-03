# Superuser Fix Documentation

This document explains the superuser fix that has been implemented to resolve the foreign key constraint issue when creating life care plans.

## The Problem

When attempting to add care plans to the database, the following error was occurring:

```
[DB SYNC ERROR] Error executing query via API Error: API error: insert or update on table "life_care_plans" violates foreign key constraint "life_care_plans_user_id_fkey"
```

This error occurred because:

1. The `life_care_plans` table has a foreign key constraint on the `user_id` field, which must reference a valid user in the users table.
2. The application is using a mock authentication system that generates UUIDs for users, but these UUIDs don't exist in the database.
3. When the application tries to create a life care plan, it uses the user ID from the mock authentication system, which violates the foreign key constraint.

## The Solution

Instead of bypassing the foreign key constraint (which would compromise database integrity), we've implemented a solution that creates a valid superuser in the database with a fixed UUID. This approach maintains database integrity while allowing the application to work properly in development.

The solution consists of two parts:

1. **Create Superuser Script**: A script that creates a superuser in the database with a fixed UUID.
2. **Restart Application Script**: A script that creates the superuser and then restarts the application.

### 1. Create Superuser Script

The `create-superuser.js` script:

- Connects to the database using the connection string from environment variables
- Detects the users table (Django auth_user, Supabase users, etc.)
- Creates a superuser with a fixed UUID if it doesn't already exist
- Updates the authService.ts file to use the fixed UUID

The fixed UUID used is: `11111111-1111-4111-a111-111111111111`

### 2. Restart Application Script

The `restart_app_with_superuser.js` script:

- Stops any running processes on port 8080
- Runs the create-superuser script
- Starts the application in development mode

## How to Use

To apply the fix and restart the application:

```
node restart_app_with_superuser.js
```

This will:
1. Create a superuser in the database if it doesn't already exist
2. Update the authService.ts file to use the fixed UUID
3. Restart the application

## Technical Details

### Fixed UUID

We use a fixed UUID (`11111111-1111-4111-a111-111111111111`) for development purposes. This ensures that the user ID used by the application always matches a valid user in the database.

### Database Detection

The script automatically detects the users table by checking for:
- Django auth_user table
- Supabase users table
- Foreign key references

### AuthService Update

The script updates the `authService.ts` file to use the fixed UUID by replacing the `generateUUID` function with one that always returns the fixed UUID.

## Verification

After applying the fix, you should be able to add care plans to the database without encountering the foreign key constraint error. The application will use the fixed UUID for the user ID, which matches the superuser created in the database.

## Troubleshooting

If you're still encountering issues with the foreign key constraint:

1. Check if the superuser was created successfully by running:
   ```
   node create-superuser.js
   ```

2. Verify that the authService.ts file was updated to use the fixed UUID.

3. Check the database connection string in your environment variables.

4. If all else fails, you can try the foreign key bypass approach by running:
   ```
   node restart_app_with_fk_bypass.js
   ```

## Conclusion

The superuser fix resolves the issue with adding care plans to the database by creating a valid user record that matches the user ID used by the application. This maintains database integrity while allowing the application to work properly in development.
