# Age Increments Migration Guide

## The Issue

The application is encountering an error when trying to use the age increments feature:

```
Error inserting care plan entry: {
  code: "PGRST204",
  details: null,
  hint: null,
  message: "Could not find the 'age_increments' column of 'care_plan_entries' in the schema cache"
}
```

This error occurs because:

1. The migration file `supabase/migrations/20250227152832_add_age_increments_columns.sql` exists to add the necessary columns to the database
2. The TypeScript types have been updated to include these new columns
3. But the migration hasn't been applied to the database yet

## The Solution

To fix this issue, you need to:

1. Apply the migration to add the required columns to the database
2. Restart the application to refresh the schema cache

### Step 1: Apply the Migration

We've created an HTML page to help you apply the migration:

```
open apply_migration.html
```

This page will guide you through the process of applying the migration using the Supabase SQL Editor.

Alternatively, you can apply the migration directly by:

1. Go to the [Supabase SQL Editor](https://app.supabase.com/project/ooewnlqozkypyceowuhy/sql)
2. Copy and paste the following SQL:

```sql
-- Add use_age_increments and age_increments columns to care_plan_entries table
ALTER TABLE care_plan_entries
ADD COLUMN IF NOT EXISTS use_age_increments BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS age_increments TEXT;

-- Update the types.ts file to include the new columns
COMMENT ON TABLE care_plan_entries IS 'Table for storing care plan entries with age increment support';
COMMENT ON COLUMN care_plan_entries.use_age_increments IS 'Flag to indicate if this entry uses age increments';
COMMENT ON COLUMN care_plan_entries.age_increments IS 'JSON string containing age increment data';
```

3. Click "Run" to execute the SQL

### Step 2: Restart the Application

After applying the migration, you need to restart the application to refresh the schema cache. We've created a script to help you with this:

```
node restart_app.js
```

This script will:
1. Stop any running development server
2. Clear any cached data
3. Restart the development server

## Verifying the Fix

After applying the migration and restarting the application, you should be able to use the age increments feature without encountering the error.

## Understanding the Age Increments Feature

The age increments feature allows you to define different frequencies for care plan entries based on age ranges. For example, you might want to specify:

- Ages 30-40: 2 visits per year
- Ages 41-50: 4 visits per year
- Ages 51-60: 1 visit per year

This is implemented through:

1. The `use_age_increments` column: A boolean flag to indicate if an entry uses age increments
2. The `age_increments` column: A JSON string containing age increment data

The `AgeIncrementManager` component in `src/components/LifeCarePlan/FormSections/AgeIncrementManager.tsx` provides a UI for managing these age increments.
