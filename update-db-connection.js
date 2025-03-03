// Script to update the database connection to point to the local PostgreSQL database
const fs = require('fs');
const path = require('path');

// Path to the .env file
const envPath = path.join(process.cwd(), '.env.local');

// Read the current .env file
let envContent = '';
try {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('Successfully read .env.local file');
} catch (error) {
  // If .env.local doesn't exist, try reading .env
  try {
    envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
    console.log('Successfully read .env file');
  } catch (err) {
    console.error('Error reading .env or .env.local file:', err);
    process.exit(1);
  }
}

// Update the DATABASE_URL to point to the local PostgreSQL database
const updatedContent = envContent.replace(
  /DATABASE_URL=.*/g,
  'DATABASE_URL=postgresql://postgres:postgres@localhost:5432/supabase_local_db'
);

// Write the updated content back to .env.local
try {
  fs.writeFileSync(envPath, updatedContent);
  console.log('Successfully updated .env.local with local database connection');
} catch (error) {
  console.error('Error writing to .env.local file:', error);
  process.exit(1);
}

console.log('\nDatabase connection updated to point to local PostgreSQL database.');
console.log('New connection string: postgresql://postgres:postgres@localhost:5432/supabase_local_db');
console.log('\nNOTE: If your local PostgreSQL username or password is different, please update the connection string manually.'); 