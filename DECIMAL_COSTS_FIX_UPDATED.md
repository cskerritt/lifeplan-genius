# Decimal Costs Fix

## Issue Summary

The application was encountering database errors when trying to insert decimal values into integer columns:

```
Error inserting care plan entry: Object
code: "22P02"
details: null
hint: null
message: "invalid input syntax for type integer: \"80.3\""
```

This error occurs because the cost calculation functions in the application return decimal values (rounded to 2 decimal places), but the database schema had the cost columns defined as integers.

## Solution

A database migration has been created to update the following columns in the `care_plan_entries` table from `integer` to `numeric` type:

- `min_cost`
- `avg_cost`
- `max_cost`
- `annual_cost`
- `lifetime_cost`

This change allows these columns to store decimal values, which is more appropriate for financial data where precision is important.

## Files Created

1. **Migration File**: `supabase/migrations/20250227173300_update_cost_columns_to_numeric.sql`
   - Contains the SQL commands to alter the column types

2. **Migration Script**: `apply_cost_columns_migration.mjs`
   - Node.js script to apply the migration and restart the application

3. **Test Script**: `test_cost_columns_fix.mjs`
   - Script to test if the fix was applied correctly

4. **Test Runner**: `run_cost_columns_test.mjs`
   - Script to run the test and display the results

5. **Restart Script**: `restart_app_after_migration.mjs`
   - Script to restart the application after applying the migration

6. **Documentation**: `DECIMAL_COSTS_FIX_UPDATED.md`
   - Updated documentation about the migration

## Important Note About ES Modules

The project is configured to use ES modules (as indicated by `"type": "module"` in package.json). Therefore, all scripts have been created with the `.mjs` extension to explicitly indicate they use ES module syntax with `import` statements instead of CommonJS `require()` statements.

## How to Apply the Fix

### Using the Command Line

1. Run the migration script:
   ```
   node apply_cost_columns_migration.mjs
   ```
2. The script will:
   - Apply the migration using Supabase CLI
   - Restart the application automatically

## How to Verify the Fix

### Using the Command Line

1. Run the test script:
   ```
   node run_cost_columns_test.mjs
   ```
2. The script will:
   - Run the test and display the results
   - Show a success or failure message

## Technical Details

### Migration SQL

```sql
-- Update cost columns from integer to numeric to support decimal values
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE NUMERIC,
ALTER COLUMN avg_cost TYPE NUMERIC,
ALTER COLUMN max_cost TYPE NUMERIC,
ALTER COLUMN annual_cost TYPE NUMERIC,
ALTER COLUMN lifetime_cost TYPE NUMERIC;
```

### Application Impact

This change is backward compatible with existing code:

- The TypeScript interfaces already define these fields as `number`, which can handle both integer and decimal values
- The cost calculation functions already return decimal values (rounded to 2 decimal places)
- Existing integer values in the database will be preserved and automatically converted to numeric type

## Potential Future Improvements

1. **Add Precision and Scale**: Consider specifying precision and scale for the numeric columns (e.g., `NUMERIC(10,2)`) to enforce consistent decimal places.

2. **Add Validation**: Add database-level constraints to ensure costs are non-negative.

3. **Update Documentation**: Update API documentation to clarify that cost fields can contain decimal values.
