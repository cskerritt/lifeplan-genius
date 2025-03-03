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

2. **Migration Script**: `apply_cost_columns_migration.js`
   - Node.js script to apply the migration and restart the application

3. **Web Interface**: `apply_cost_columns_migration.html`
   - Simple web interface for applying the migration

4. **Test Script**: `test_cost_columns_fix.js`
   - Script to test if the fix was applied correctly

5. **Test Interface**: `test_cost_columns_fix.html`
   - Web interface for testing the fix

6. **Documentation**: `COST_COLUMNS_MIGRATION.md`
   - Detailed documentation about the migration

## How to Apply the Fix

### Option 1: Using the Web Interface

1. Open `apply_cost_columns_migration.html` in your browser
2. Review the migration details
3. Click the "Apply Migration" button
4. Wait for the migration to complete and the application to restart

### Option 2: Using the Command Line

1. Run the migration script directly:
   ```
   node apply_cost_columns_migration.js
   ```
2. The script will:
   - Apply the migration using Supabase CLI
   - Restart the application automatically

## How to Verify the Fix

### Option 1: Using the Web Interface

1. Open `test_cost_columns_fix.html` in your browser
2. Click the "Run Test" button
3. The test will attempt to insert a care plan entry with decimal costs
4. If successful, you'll see a success message

### Option 2: Using the Command Line

1. Run the test script directly:
   ```
   node run_cost_columns_test.js
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
