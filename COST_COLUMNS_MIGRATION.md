# Cost Columns Migration

## Issue

The application was encountering database errors when trying to insert decimal values into integer columns:

```
Error inserting care plan entry: Object
code: "22P02"
details: null
hint: null
message: "invalid input syntax for type integer: \"80.3\""
```

This error occurs because the cost calculation functions in the application return decimal values (rounded to 2 decimal places), but the database schema has the cost columns defined as integers.

## Solution

This migration updates the following columns in the `care_plan_entries` table from `integer` to `numeric` type:

- `min_cost`
- `avg_cost`
- `max_cost`
- `annual_cost`
- `lifetime_cost`

This change allows these columns to store decimal values, which is more appropriate for financial data where precision is important.

## Implementation Details

1. Created a new migration file: `supabase/migrations/20250227173300_update_cost_columns_to_numeric.sql`
2. The migration alters the column types from integer to numeric
3. Updated column comments to reflect the new data types

## How to Apply the Migration

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

## Verification

After applying the migration, you should be able to:

1. Add new care plan entries with decimal cost values
2. See that existing entries are preserved with their original values
3. Verify that the console no longer shows the "invalid input syntax for type integer" error

## Rollback (if needed)

If you need to roll back this migration, you can create a new migration file that changes the column types back to integer:

```sql
-- Rollback migration: Change cost columns back to integer
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE INTEGER USING min_cost::integer,
ALTER COLUMN avg_cost TYPE INTEGER USING avg_cost::integer,
ALTER COLUMN max_cost TYPE INTEGER USING max_cost::integer,
ALTER COLUMN annual_cost TYPE INTEGER USING annual_cost::integer,
ALTER COLUMN lifetime_cost TYPE INTEGER USING lifetime_cost::integer;
```

Note that this will truncate any decimal values in the database.
