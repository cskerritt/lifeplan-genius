// Script to check the database connection string
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Get the database connection string from environment variables
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('Error: DATABASE_URL environment variable is not set.');
  console.error('Please check your .env file and ensure it is set correctly.');
  process.exit(1);
}

// Log the database connection string (with password masked)
const maskedUrl = databaseUrl.replace(/:[^:@]+@/, ':***@');
console.log('Database connection string:', maskedUrl);

// Parse the connection string to extract the components
const match = databaseUrl.match(/^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/);
if (match) {
  const [, user, password, host, port, database] = match;
  console.log('Connection components:');
  console.log(`- User: ${user}`);
  console.log(`- Password: ${'*'.repeat(password.length)}`);
  console.log(`- Host: ${host}`);
  console.log(`- Port: ${port}`);
  console.log(`- Database: ${database}`);
} else {
  console.error('Error: Could not parse the database connection string.');
  console.error('Please ensure the DATABASE_URL is in the correct format.');
}

// Log the environment variables
console.log('\nEnvironment variables:');
console.log('- SUPABASE_URL:', process.env.SUPABASE_URL || 'Not set');
console.log('- SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'Set' : 'Not set');
console.log('- SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Not set');
console.log('- DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');
