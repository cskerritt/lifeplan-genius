#!/bin/bash
# Script to run all migration steps in sequence

# Set the script to exit immediately if any command fails
set -e

# Get the directory of this script
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Print a header
echo "====================================="
echo "Supabase Migration System - Run All"
echo "====================================="
echo ""

# Function to prompt for user input
prompt_user() {
  local prompt="$1"
  local default="$2"
  local response
  
  read -p "$prompt [$default]: " response
  echo "${response:-$default}"
}

# Test connection
echo "Step 1: Testing database connection"
echo "-----------------------------------"

# Ask which connection method to use
connection_method=$(prompt_user "Which connection method would you like to use? (supabase/pg)" "supabase")

if [ "$connection_method" = "pg" ]; then
  echo "Testing PostgreSQL connection..."
  node "$SCRIPT_DIR/test-connection.js" --pg
else
  echo "Testing Supabase connection..."
  node "$SCRIPT_DIR/test-connection.js"
fi

echo ""
echo "Connection test completed successfully!"
echo ""

# Apply migrations
echo "Step 2: Applying migrations"
echo "--------------------------"

if [ "$connection_method" = "pg" ]; then
  echo "Applying migrations using PostgreSQL connection..."
  node "$SCRIPT_DIR/apply-migration.js" --pg
else
  echo "Applying migrations using Supabase connection..."
  node "$SCRIPT_DIR/apply-migration.js"
fi

echo ""
echo "Migrations applied successfully!"
echo ""

# Verify migrations
echo "Step 3: Verifying migrations"
echo "---------------------------"

if [ "$connection_method" = "pg" ]; then
  echo "Verifying migrations using PostgreSQL connection..."
  node "$SCRIPT_DIR/verify-migration.js" --pg
else
  echo "Verifying migrations using Supabase connection..."
  node "$SCRIPT_DIR/verify-migration.js"
fi

echo ""
echo "====================================="
echo "All steps completed successfully!"
echo "====================================="
