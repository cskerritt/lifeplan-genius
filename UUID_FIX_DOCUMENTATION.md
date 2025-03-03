# UUID Fix for Care Plan Creation

## Problem

When creating a new care plan, the application was encountering the following error:

```
[DB SYNC ERROR] Error executing query via API Error: API error: invalid input syntax for type uuid: "mock-user-id"
```

This error occurred because:

1. The mock authentication service (`authService.ts`) was using a hardcoded string `"mock-user-id"` for the user ID
2. The database schema expects the `user_id` field in the `life_care_plans` table to be a valid UUID format
3. When the form was submitted, the database rejected the insert operation due to the invalid UUID format

## Solution

The fix modifies the mock authentication service to generate proper UUID-formatted IDs instead of using the hardcoded string. This ensures that when a user is authenticated in the development/testing environment, they receive a valid UUID that can be stored in the database.

### Changes Made

1. Updated `src/utils/authService.ts` to include a UUID generation function:
   ```javascript
   const generateUUID = () => {
     // RFC4122 compliant UUID v4
     return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
       const r = Math.random() * 16 | 0;
       const v = c === 'x' ? r : (r & 0x3 | 0x8);
       return v.toString(16);
     });
   };
   ```

2. Modified both the `signIn` and `signUp` methods to use this function instead of the hardcoded "mock-user-id"

3. Created a restart script (`restart_app_with_uuid_fix.js`) to restart the application with the fix

## Testing the Fix

To test the fix:

1. Run the restart script:
   ```
   node restart_app_with_uuid_fix.js
   ```

2. Test the UUID generation:

   **Option 1:** Run the Node.js test script:
   ```
   node test-uuid-fix.js
   ```

   **Option 2:** Open the simplified browser-based test page:
   ```
   open test-uuid-fix-simple.html
   ```
   Then click the "Generate and Test UUIDs" button to verify the UUID generation function directly.

3. Sign in to the application (or sign up if you don't have an account)

4. Create a new care plan by filling out the evaluee form

5. The form should now submit successfully without the UUID error

> **Note**: The project uses ES modules, so all scripts have been updated to use ES module imports instead of CommonJS require statements.

## Technical Details

The UUID generation function creates a version 4 UUID according to RFC4122. This is a randomly generated UUID that follows the format:
`xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx` where:

- `x` is replaced with a random hexadecimal digit
- The first digit of the third group is always 4 (indicating version 4)
- The first digit of the fourth group is either 8, 9, A, or B (indicating variant 1)

This format is compatible with the UUID type in PostgreSQL, which is used by Supabase.
