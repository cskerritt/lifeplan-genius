# Supabase Migrations System

This directory contains a unified system for applying database migrations to your Supabase PostgreSQL database. The system addresses several issues with the previous approach:

1. Eliminates hardcoded credentials
2. Provides consistent connection methods
3. Consolidates duplicate verification scripts
4. Creates a single source of truth for migrations

## Prerequisites

Before using these scripts, ensure you have:

1. Node.js installed
2. Required dependencies installed:
   ```bash
   npm install
   ```

3. A `.env` file with your Supabase credentials:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   SUPABASE_ANON_KEY=your_anon_key
   DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres
   ```

   You can create this file by copying the `.env.example` file:
   ```bash
   cp .env.example .env
   ```
   Then edit the `.env` file with your actual credentials.

## Migration Directory Structure

The migration system uses the following directory structure:

```
/migrations
  /scripts
    db-client.js       # Shared connection module
    apply-migration.js # Main migration script
    verify-migration.js # Verification script
    test-connection.js # Connection test script
    run-all.sh         # Script to run all steps
  /sql
    # SQL migration files
```

## Available Commands

The following npm scripts are available for working with migrations:

| Command | Description |
|---------|-------------|
| `npm run migrate` | Apply migrations using Supabase client |
| `npm run migrate:pg` | Apply migrations using direct PostgreSQL connection |
| `npm run migrate:verify` | Verify migrations using Supabase client |
| `npm run migrate:verify:pg` | Verify migrations using direct PostgreSQL connection |
| `npm run migrate:test` | Test Supabase connection |
| `npm run migrate:test:pg` | Test direct PostgreSQL connection |
| `npm run migrate:all` | Run all steps (test, apply, verify) in sequence |
| `npm run migrate:setup` | Set up required RPC functions in Supabase |
| `npm run migrate:history` | Check migration history using Supabase client |
| `npm run migrate:history:pg` | Check migration history using direct PostgreSQL connection |

## Initial Setup

Before using the Supabase client method for migrations, you need to set up the required RPC functions in your Supabase project:

1. Ensure your `.env` file contains the correct `DATABASE_URL` for direct PostgreSQL connection.

2. Run the setup script:
   ```bash
   npm run migrate:setup
   ```

This script creates two RPC functions in your Supabase project:
- `apply_migration`: Executes SQL migrations with error handling
- `get_column_types`: Gets data types for specified columns in a table

These functions are required for the Supabase client method to work properly.

## Adding New Migrations

To add a new migration:

1. Create a new SQL file in the `migrations/sql` directory with a timestamp prefix:
   ```
   migrations/sql/YYYYMMDDHHMMSS_description.sql
   ```

2. Write your SQL migration in this file.

3. Run the migration:
   ```bash
   npm run migrate
   ```

4. Verify the migration:
   ```bash
   npm run migrate:verify
   ```

## Connection Methods

The system supports two connection methods:

### 1. Supabase JavaScript Client

This method uses the Supabase JavaScript client with your service role key. It's the default method used by the `migrate` and `migrate:verify` commands.

Pros:
- Doesn't require your PostgreSQL database password
- Uses the same client as your application

Cons:
- Requires that your Supabase project has the necessary RPC functions set up

### 2. Direct PostgreSQL Connection

This method uses a direct PostgreSQL connection. It's used by the `migrate:pg` and `migrate:verify:pg` commands.

Pros:
- More direct access to the database
- Doesn't require RPC functions

Cons:
- Requires your PostgreSQL database password

## Migration Tracking

The system includes a migration tracking feature that records all applied migrations in a table called `applied_migrations`. This table is created by the migration `20250228010000_add_migration_tracking_table.sql`.

The tracking table stores the following information for each migration:
- Migration name
- Timestamp when it was applied
- User or service that applied it
- Whether it was successfully applied

You can view the migration history using the following commands:

```bash
# Using Supabase client
npm run migrate:history

# Using direct PostgreSQL connection
npm run migrate:history:pg
```

This feature helps you keep track of which migrations have been applied to your database and when.

## Security Considerations

- Never commit your `.env` file or any file containing your database credentials to version control
- The `.env` file is already added to `.gitignore` to prevent accidental commits
- For production environments, consider using a more secure method for storing credentials

## Troubleshooting

If you encounter errors:

1. Check that your `.env` file contains the correct credentials
2. Ensure you're using the correct PostgreSQL database password
3. Verify that your Supabase project has the necessary permissions to execute SQL statements
4. Check the Supabase dashboard for any error logs

## Frontend Environment Variables

For the frontend application, create a `.env.local` file with the following variables:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

These variables will be used by the Vite build process to inject the correct values into the application.

## Note on ES Modules

This project uses ES modules (type: "module" in package.json). All migration scripts have been updated to use ES module syntax (import/export) instead of CommonJS (require/module.exports).

If you need to create additional scripts, make sure to use ES module syntax:

```javascript
// Use this (ES modules):
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Instead of this (CommonJS):
// const { createClient } = require('@supabase/supabase-js');
// require('dotenv').config();
```