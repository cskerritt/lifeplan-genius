/**
 * Fix Users Table Script
 * 
 * This script creates the missing 'users' table with a UUID primary key
 * to resolve the foreign key constraint issue when creating life care plans.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();

// Define colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Print a header
console.log(`${colors.bgBlue}${colors.white}${colors.bright} FIX USERS TABLE ${colors.reset}`);
console.log(`${colors.cyan}This script creates the missing 'users' table with a UUID primary key${colors.reset}`);
console.log(`${colors.cyan}to resolve the foreign key constraint issue when creating life care plans.${colors.reset}`);
console.log();

// Get connection string from environment variables
const connectionString = process.env.VITE_DATABASE_URL || 
  process.env.DATABASE_URL || 
  'postgresql://postgres:postgres@localhost:5432/supabase_local_db';

// Create a new client for database operations
const client = new pg.Client({ connectionString });

// Fixed UUID for development
const FIXED_DEV_UUID = '11111111-1111-4111-a111-111111111111';

/**
 * Check if a table exists in the database
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<boolean>} - Whether the table exists
 */
async function tableExists(tableName) {
  const query = `
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = $1
    ) as table_exists
  `;
  
  const result = await client.query(query, [tableName]);
  return result.rows[0].table_exists;
}

/**
 * Create the users table with a UUID primary key
 * @returns {Promise<void>}
 */
async function createUsersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY,
      email TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `;
  
  await client.query(query);
  console.log(`${colors.green}Created 'users' table with UUID primary key${colors.reset}`);
}

/**
 * Insert a user with the fixed UUID
 * @returns {Promise<void>}
 */
async function insertUser() {
  const query = `
    INSERT INTO users (id, email, created_at, updated_at)
    VALUES ($1, 'admin@example.com', NOW(), NOW())
    ON CONFLICT (id) DO NOTHING
    RETURNING id, email;
  `;
  
  const result = await client.query(query, [FIXED_DEV_UUID]);
  
  if (result.rows.length > 0) {
    console.log(`${colors.green}Inserted user with fixed UUID:${colors.reset}`, result.rows[0]);
  } else {
    console.log(`${colors.yellow}User with fixed UUID already exists${colors.reset}`);
    
    // Verify the user exists
    const verifyQuery = `SELECT id, email FROM users WHERE id = $1`;
    const verifyResult = await client.query(verifyQuery, [FIXED_DEV_UUID]);
    
    if (verifyResult.rows.length > 0) {
      console.log(`${colors.green}Verified existing user:${colors.reset}`, verifyResult.rows[0]);
    } else {
      console.log(`${colors.red}Failed to verify existing user${colors.reset}`);
    }
  }
}

/**
 * Update the authService.ts file to use the fixed UUID
 * @returns {Promise<void>}
 */
async function updateAuthService() {
  const authServicePath = `${__dirname}/src/utils/authService.ts`;
  
  if (!fs.existsSync(authServicePath)) {
    console.log(`${colors.yellow}authService.ts not found at ${authServicePath}, skipping update${colors.reset}`);
    return;
  }
  
  console.log(`${colors.yellow}Updating authService.ts to use fixed UUID${colors.reset}`);
  
  let content = fs.readFileSync(authServicePath, 'utf8');
  
  // Look for the generateUUID function
  const generateUUIDRegex = /const generateUUID = \(\) => \{[\s\S]+?\};/;
  
  if (generateUUIDRegex.test(content)) {
    // Replace the function to always return our fixed UUID
    const updatedContent = content.replace(
      generateUUIDRegex,
      `const generateUUID = () => {
  // Always return a fixed UUID for development
  return '${FIXED_DEV_UUID}';
};`
    );
    
    fs.writeFileSync(authServicePath, updatedContent);
    console.log(`${colors.green}Updated authService.ts to use fixed UUID${colors.reset}`);
  } else {
    console.log(`${colors.yellow}Could not find generateUUID function in authService.ts${colors.reset}`);
    
    // Look for places where UUIDs might be generated
    if (content.includes('xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx')) {
      console.log(`${colors.yellow}Found UUID pattern, but couldn't automatically update it${colors.reset}`);
      console.log(`${colors.yellow}Please manually update authService.ts to use this fixed UUID: ${FIXED_DEV_UUID}${colors.reset}`);
    }
  }
}

/**
 * Main function to fix the users table
 */
async function main() {
  try {
    console.log(`${colors.yellow}Connecting to database...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}Connected to database${colors.reset}`);
    
    // Check if users table exists
    const hasUsersTable = await tableExists('users');
    
    if (hasUsersTable) {
      console.log(`${colors.green}The 'users' table already exists${colors.reset}`);
    } else {
      console.log(`${colors.yellow}The 'users' table does not exist, creating it...${colors.reset}`);
      await createUsersTable();
    }
    
    // Insert user with fixed UUID
    console.log(`${colors.yellow}Inserting user with fixed UUID...${colors.reset}`);
    await insertUser();
    
    // Update authService.ts to use the fixed UUID
    await updateAuthService();
    
    console.log(`${colors.green}${colors.bright}Users table fix completed successfully!${colors.reset}`);
    console.log(`${colors.green}You can now create life care plans without foreign key constraint errors.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  } finally {
    await client.end();
  }
}

// Run the main function
main();
