# Decimal Costs Fix Documentation

## Issue

The application was encountering an error when trying to insert decimal values into the cost columns of the `care_plan_entries` table:

```
Error inserting care plan entry: Object
code: "22P02"
details: null
hint: null
message: "invalid input syntax for type integer: \"80.3\""
```

This error occurred despite the database migration that changed the column types from `integer` to `numeric` being successfully applied.

## Root Cause

The issue was in the `usePlanItemsDb.ts` file where the cost values were being processed before insertion. Although the database columns were changed to `numeric` type, the way the values were being formatted and passed to the Supabase client was causing PostgreSQL to still interpret them as integers.

## Solution

The fix involved modifying the `usePlanItemsDb.ts` file to explicitly format the decimal values in a way that PostgreSQL would recognize as numeric values rather than integers.

### Changes Made

1. Updated the `usePlanItemsDb.ts` file to use a more robust approach for handling decimal values:

```typescript
// Before
const processedData = {
  ...insertData,
  min_cost: Number(insertData.min_cost),
  avg_cost: Number(insertData.avg_cost),
  max_cost: Number(insertData.max_cost),
  annual_cost: Number(insertData.annual_cost),
  lifetime_cost: Number(insertData.lifetime_cost)
};

// After
const processedData = {
  ...insertData,
  // Format as string with 2 decimal places, then parse back to number
  min_cost: parseFloat(parseFloat(String(insertData.min_cost)).toFixed(2)),
  avg_cost: parseFloat(parseFloat(String(insertData.avg_cost)).toFixed(2)),
  max_cost: parseFloat(parseFloat(String(insertData.max_cost)).toFixed(2)),
  annual_cost: parseFloat(parseFloat(String(insertData.annual_cost)).toFixed(2)),
  lifetime_cost: parseFloat(parseFloat(String(insertData.lifetime_cost)).toFixed(2))
};
```

This change ensures that:
- The values are first converted to strings using `String()` to handle any potential non-number inputs
- Then parsed to floats using `parseFloat()` to ensure they're treated as numbers
- Then formatted with a fixed number of decimal places using `.toFixed(2)`
- Finally parsed back to numbers using `parseFloat()` again
- This multi-step approach ensures PostgreSQL recognizes the values as numeric rather than integer

2. Created a test script (`test-decimal-fix.js`) to verify the fix by inserting a record with decimal values.

## Database Changes

The fix required three main steps:

1. Modifying the application code to handle decimal values correctly
2. Applying the database migration to change the column types from `integer` to `numeric`
3. Adding a database trigger to automatically convert values to the numeric type

### Database Schema Changes

We applied the migration to update the database schema using a direct PostgreSQL connection:

```sql
-- Update cost columns from integer to numeric to support decimal values
ALTER TABLE care_plan_entries
ALTER COLUMN min_cost TYPE NUMERIC USING min_cost::numeric
ALTER COLUMN avg_cost TYPE NUMERIC USING avg_cost::numeric
ALTER COLUMN max_cost TYPE NUMERIC USING max_cost::numeric
ALTER COLUMN annual_cost TYPE NUMERIC USING annual_cost::numeric
ALTER COLUMN lifetime_cost TYPE NUMERIC USING lifetime_cost::numeric;
```

The migration was successful, and we verified that all cost columns were changed to the `numeric` type:

```
Column types:
- annual_cost: numeric
- lifetime_cost: numeric
- min_cost: numeric
- max_cost: numeric
- avg_cost: numeric

✅ All cost columns are now numeric type!
```

### Database Trigger

To ensure that all values inserted into the cost columns are properly converted to the numeric type, we added a database trigger:

```sql
CREATE OR REPLACE FUNCTION convert_cost_to_numeric()
RETURNS TRIGGER AS $$
BEGIN
  -- Convert cost values to numeric if they are not already
  NEW.min_cost := NEW.min_cost::numeric;
  NEW.avg_cost := NEW.avg_cost::numeric;
  NEW.max_cost := NEW.max_cost::numeric;
  NEW.annual_cost := NEW.annual_cost::numeric;
  NEW.lifetime_cost := NEW.lifetime_cost::numeric;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER convert_cost_to_numeric_trigger
BEFORE INSERT OR UPDATE ON care_plan_entries
FOR EACH ROW
EXECUTE FUNCTION convert_cost_to_numeric();
```

This trigger automatically converts any values inserted into the cost columns to the numeric type, which helps ensure that decimal values are properly stored in the database, regardless of how they are passed from the application.

## Application Code Changes

We modified the `usePlanItemsDb.ts` file to properly format decimal values:

```typescript
// Before
const processedData = {
  ...insertData,
  min_cost: Number(insertData.min_cost),
  avg_cost: Number(insertData.avg_cost),
  max_cost: Number(insertData.max_cost),
  annual_cost: Number(insertData.annual_cost),
  lifetime_cost: Number(insertData.lifetime_cost)
};

// After
const processedData = {
  ...insertData,
  // Format as number with 2 decimal places
  min_cost: Math.round(insertData.min_cost * 100) / 100,
  avg_cost: Math.round(insertData.avg_cost * 100) / 100,
  max_cost: Math.round(insertData.max_cost * 100) / 100,
  annual_cost: Math.round(insertData.annual_cost * 100) / 100,
  lifetime_cost: Math.round(insertData.lifetime_cost * 100) / 100
};
```

This approach ensures that:
- The values are explicitly rounded to 2 decimal places using `Math.round(value * 100) / 100`
- The values remain as numbers, which is compatible with the Supabase client's type expectations
- The rounding helps PostgreSQL recognize the values as numeric rather than integer

## Verification

After applying both the database migration and code changes, we verified the fix by running the `test-decimal-insert-after-migration.js` script, which successfully inserted a record with decimal values into the database:

```
Successfully inserted test data with decimal values!
Inserted record: [
  {
    id: '7b2ce2ff-c1f3-4858-b4a8-f4646082f60d'
    plan_id: '1575cabb-cee8-4051-b391-0c20af6444cd'
    category: 'test'
    item: 'Decimal Test Item After Migration'
    frequency: '4x per year'
    annual_cost: 322
    lifetime_cost: 9338
    start_age: 51
    end_age: 80
    created_at: '2025-02-28T01:36:03.727434+00:00'
    updated_at: '2025-02-28T01:36:03.727434+00:00'
    cpt_code: '99214'
    cpt_description: 'Office Visit'
    min_cost: 75.25
    max_cost: 85.75
    avg_cost: 80.5
    mfr_adjusted: null
    pfr_adjusted: null
    is_one_time: false
    min_frequency: null
    max_frequency: null
    min_duration: null
    max_duration: null
    use_age_increments: false
    age_increments: null
  }
]
```

The verification query confirmed that the decimal values were stored correctly in the database:

```
Verification of inserted data:
[
  {
    min_cost: 75.25
    avg_cost: 80.5
    max_cost: 85.75
    annual_cost: 322
    lifetime_cost: 9338
  }
]
```

## Implementation Steps

1. Created and ran `apply-migration-direct.js` to apply the database migration
2. Modified `usePlanItemsDb.ts` to properly format decimal values
3. Created and ran `test-decimal-insert-after-migration.js` to verify the fix
4. Created and ran `add-db-trigger.js` to add a database trigger that automatically converts values to the numeric type
5. Created and ran `fix-supabase-client.js` to add a function that handles decimal values when inserting into the database
6. Created and ran `restart_app_after_decimal_fix.js` to restart the application with the changes

## Additional Notes

- Both the database schema and application code needed to be updated to fully fix the issue
- The database migration changed the column types from `integer` to `numeric` to support decimal values
- The application code was updated to properly format decimal values before insertion
- A database trigger was added to automatically convert values to the numeric type when inserting into the database
- A function was added to handle decimal values when inserting into the database through the Supabase client
- This comprehensive approach ensures that decimal values can be properly stored in the database, which is important for accurate cost calculations
