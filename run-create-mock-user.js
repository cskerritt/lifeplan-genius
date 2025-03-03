#!/usr/bin/env node

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the database URL from environment variables
const databaseUrl = process.env.VITE_DATABASE_URL || 
  process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/supabase_local_db';

console.log('Using database URL:', databaseUrl);

// Path to the SQL file
const sqlFilePath = path.join(__dirname, 'create-mock-user.sql');

try {
  // Check if the SQL file exists
  if (!fs.existsSync(sqlFilePath)) {
    console.error('SQL file not found:', sqlFilePath);
    process.exit(1);
  }

  // Read the SQL file
  const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
  
  // Create a temporary file with the SQL content
  const tempFilePath = path.join(__dirname, 'temp-sql.sql');
  fs.writeFileSync(tempFilePath, sqlContent);

  // Run the SQL using psql
  console.log('Running SQL script...');
  const result = execSync(`psql "${databaseUrl}" -f "${tempFilePath}"`, { encoding: 'utf8' });
  console.log('SQL execution result:');
  console.log(result);

  // Clean up the temporary file
  fs.unlinkSync(tempFilePath);
  
  console.log('Mock user created successfully!');
} catch (error) {
  console.error('Error executing SQL:', error.message);
  if (error.stdout) console.error('stdout:', error.stdout);
  if (error.stderr) console.error('stderr:', error.stderr);
  process.exit(1);
} 