# Migration Instructions

## Issue

The application is encountering an error when trying to insert decimal values into the database:

```
Error inserting care plan entry: Object
code: "22P02"
details: null
hint: null
message: "invalid input syntax for type integer: \"80.3\""
```

This is happening because the database columns are still of type `INTEGER` even though there is a migration file (`20250227173300_update_cost_columns_to_numeric.sql`) that should have changed them to `NUMERIC`.

## Temporary Fix

A temporary fix has been applied to the `usePlanItemsDb.ts` file to round all decimal values to integers before insertion. This will allow the application to work, but it will lose precision in cost calculations.

## Permanent Fix

To properly fix this issue, you need to apply the migration to change the column types from `INTEGER` to `NUMERIC`. Here's how to do it:

### Option 1: Using the Supabase Dashboard

1. Log in to the Supabase dashboard
2. Go to the SQL Editor
3. Run the following SQL:

```sql
-- Update cost columns from integer to numeric to support decimal values
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric,
ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric,
ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric,
ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric,
ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
```

### Option 2: Using the Supabase CLI

If you have the Supabase CLI set up and linked to your project, you can run:

```bash
supabase db push
```

This will apply all pending migrations, including the one to change the column types.

## Verification

After applying the migration, you can verify that it worked by:

1. Removing the temporary fix in `usePlanItemsDb.ts` (change back to using `Number()` instead of `Math.round(Number())`)
2. Trying to add a care plan item with decimal costs

If the item is added successfully, the migration worked. If you still get the same error, the migration was not applied correctly.

## Note

This issue occurred because the migration file exists in the codebase but was not applied to the database. This can happen if:

1. The migration was added after the database was created
2. The migration was not run using the Supabase CLI
3. There was an error when trying to apply the migration

In the future, make sure to run `supabase db push` after adding new migration files to ensure they are applied to the database. 