// Script to apply migrations using the password from the .env file
const { applyMigrations } = require('./apply-migrations-with-pg.js');
require('dotenv').config();

// Extract the password from the DATABASE_URL
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please check your .env file and ensure it is set correctly.');
  process.exit(1);
}

// Parse the password from the DATABASE_URL
// Format: postgresql://postgres:PASSWORD@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres
const passwordMatch = databaseUrl.match(/postgresql:\/\/postgres:([^@]+)@/);
if (!passwordMatch || !passwordMatch[1]) {
  console.error('Error: Could not extract password from DATABASE_URL.');
  console.error('Please ensure the DATABASE_URL is in the correct format.');
  process.exit(1);
}

const password = passwordMatch[1];
console.log('Extracted password from DATABASE_URL');

// Apply migrations with the extracted password
applyMigrations(password);
