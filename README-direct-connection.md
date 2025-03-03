# Direct PostgreSQL Connection to Supabase

This directory contains scripts that demonstrate how to connect directly to your Supabase PostgreSQL database using the provided connection string.

## Prerequisites

Before using these scripts, you need to:

1. Install the required dependencies:
   ```bash
   npm install pg dotenv
   ```

2. Have your Supabase database password ready

## Connection String Format

The connection string format for direct PostgreSQL connection to Supabase is:

```
postgresql://postgres:[YOUR-PASSWORD]@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres
```

Replace `[YOUR-PASSWORD]` with your actual Supabase database password.

## Available Scripts

### 1. Test Connection (direct-db-connection.js)

This script tests the connection to your Supabase PostgreSQL database and performs some basic queries to verify the connection.

To use:
1. Edit the script to replace `[YOUR-PASSWORD]` with your actual password
2. Run the script:
   ```bash
   node direct-db-connection.js
   ```

### 2. Apply Migration Directly (apply-migration-direct.js)

This script applies the migration to update cost columns from INTEGER to NUMERIC using a direct PostgreSQL connection.

To use:
1. Edit the script to replace `[YOUR-PASSWORD]` with your actual password
2. Run the script:
   ```bash
   node apply-migration-direct.js
   ```

### 3. Apply Migration with Environment Variables (apply-migration-with-env.js)

This script applies the same migration but uses environment variables to store the connection string securely.

To use:
1. Create a `.env` file based on the `.env.example` template:
   ```bash
   cp .env.example .env
   ```
2. Edit the `.env` file to replace `[YOUR-PASSWORD]` with your actual password
3. Run the script:
   ```bash
   node apply-migration-with-env.js
   ```

## Security Considerations

- Never commit your `.env` file or any file containing your database password to version control
- The `.env` file is already added to `.gitignore` to prevent accidental commits
- For production environments, consider using a more secure method for storing credentials, such as environment variables set at the system level or a secrets management service

## When to Use Direct PostgreSQL Connection

Direct PostgreSQL connections are useful for:

1. Database migrations and schema changes
2. Bulk data operations
3. Complex queries that are difficult to express using the Supabase client
4. Database administration tasks

For regular application usage, it's generally better to use the Supabase client as it provides:
- Row-level security enforcement
- Automatic handling of authentication
- Simplified API for common operations
