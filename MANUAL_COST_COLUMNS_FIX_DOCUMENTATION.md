# Manual Cost Columns Fix Documentation

## Problem

The application was encountering an error when trying to insert data into the `care_plan_entries` table because it was attempting to use columns that didn't exist in the database schema. Specifically, the error was:

```
Error: API error: column "is_manual_cost" of relation "care_plan_entries" does not exist
```

This error occurred because the application code had been updated to use new columns (`is_manual_cost`, `notes`, and `rationale`), but the corresponding database migration had not been applied to add these columns to the database schema.

## Solution

We applied a database migration to add the missing columns to the `care_plan_entries` table:

1. Created a direct database migration script (`apply_direct_migration.js`) that connects to the database and executes the SQL in the `migrations/add_manual_cost_and_notes_fields.sql` file.
2. The SQL migration added the following columns to the `care_plan_entries` table:
   - `is_manual_cost` (BOOLEAN, default FALSE)
   - `notes` (TEXT)
   - `rationale` (TEXT)
3. Verified that the columns were added successfully using the `verify-manual-cost-columns.js` script.
4. Restarted the application with the updated database schema using the `restart_app_with_manual_cost_fix.js` script.

## Implementation Details

### Migration SQL

```sql
-- Add isManualCost, notes, and rationale fields to care_plan_entries table
ALTER TABLE care_plan_entries ADD COLUMN IF NOT EXISTS is_manual_cost BOOLEAN DEFAULT FALSE;
ALTER TABLE care_plan_entries ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE care_plan_entries ADD COLUMN IF NOT EXISTS rationale TEXT;
```

### Direct Database Migration Script

We created a script that connects directly to the PostgreSQL database and executes the migration SQL:

```javascript
// Direct database migration script
const fs = require('fs');
const { Pool } = require('pg');
require('dotenv').config();

async function applyMigration() {
  // Get database connection string from environment variable
  const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
  
  // Create a new PostgreSQL connection pool
  const pool = new Pool({
    connectionString,
  });
  
  try {
    // Read the migration SQL file
    const sql = fs.readFileSync('./migrations/add_manual_cost_and_notes_fields.sql', 'utf8');
    
    // Execute the SQL
    await pool.query(sql);
    
    // Verify the columns were added
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('is_manual_cost', 'notes', 'rationale');
    `);
    
    if (verifyResult.rows.length === 3) {
      console.log('All columns were added successfully!');
    } else {
      console.warn('Some columns may not have been added correctly.');
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
  } finally {
    // Close the pool
    await pool.end();
  }
}

applyMigration();
```

## Benefits

1. **Fixed Database Schema**: The database schema now matches what the application code expects, eliminating the error when inserting data.
2. **Improved User Experience**: Users can now add new items to care plans without encountering errors.
3. **Enhanced Functionality**: The application can now store additional data (manual cost flag, notes, and rationale) for care plan entries.

## Future Recommendations

1. **Automated Migrations**: Consider implementing an automated migration system that runs all pending migrations when the application starts up, to ensure the database schema is always in sync with the application code.
2. **Migration Tracking**: Keep track of which migrations have been applied to the database, to avoid applying the same migration multiple times.
3. **Database Schema Validation**: Add a validation step during application startup to verify that the database schema matches what the application expects, to catch schema mismatches early.
