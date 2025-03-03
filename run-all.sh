#!/bin/bash

# Script to run all migration steps in sequence

echo "===== Supabase Migration Script ====="
echo "This script will:"
echo "1. Test connection to Supabase"
echo "2. Apply migrations to add age increments columns"
echo "3. Apply migrations to update cost columns to numeric"
echo "4. Verify that migrations were successfully applied"
echo ""

# Test connection
echo "===== Step 1: Testing connection to Supabase ====="
node test-supabase-connection.js

# Check if the connection test was successful
if [ $? -ne 0 ]; then
  echo "Connection test failed. Please check your .env file and try again."
  exit 1
fi

echo ""
echo "===== Step 2: Applying migrations ====="
echo "Choose a migration method:"
echo "1. Using Supabase JavaScript Client with Service Role Key"
echo "2. Using Direct PostgreSQL Connection with Password Prompt"
echo "3. Using Direct PostgreSQL Connection with Environment Variables"
echo ""

read -p "Enter your choice (1-3): " choice

case $choice in
  1)
    echo "Running migrations using Supabase JavaScript Client..."
    node apply-migrations-with-supabase-client.js
    ;;
  2)
    echo "Running migrations using Direct PostgreSQL Connection with Password Prompt..."
    node run-migrations.js
    ;;
  3)
    echo "Running migrations using Direct PostgreSQL Connection with Environment Variables..."
    node apply-migration-with-env.js
    ;;
  *)
    echo "Invalid choice. Exiting."
    exit 1
    ;;
esac

# Check if the migrations were successful
if [ $? -ne 0 ]; then
  echo "Migrations failed. Please check the error messages and try again."
  exit 1
fi

echo ""
echo "===== Step 3: Verifying migrations ====="
node verify-migrations.js

echo ""
echo "===== Migration process complete ====="
echo "Please check the output above to verify that all migrations were successfully applied."
echo "If you encounter any issues, please refer to the README-migrations.md file for troubleshooting."
