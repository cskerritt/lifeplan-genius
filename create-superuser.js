/**
 * Create Superuser Script
 * 
 * This script creates a superuser in the database with a fixed UUID
 * to resolve the foreign key constraint issue when creating life care plans.
 */

import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
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
console.log(`${colors.bgBlue}${colors.white}${colors.bright} CREATE SUPERUSER FOR DEVELOPMENT ${colors.reset}`);
console.log(`${colors.cyan}This script creates a superuser in the database with a fixed UUID${colors.reset}`);
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
 * Get the structure of a table
 * @param {string} tableName - The name of the table to check
 * @returns {Promise<Array>} - The table structure
 */
async function getTableStructure(tableName) {
  const query = `
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = $1
    ORDER BY ordinal_position
  `;
  
  const result = await client.query(query, [tableName]);
  return result.rows;
}

/**
 * Check if a user with the given UUID exists
 * @param {string} uuid - The UUID to check
 * @param {string} tableName - The name of the users table
 * @returns {Promise<boolean>} - Whether the user exists
 */
async function userExists(uuid, tableName) {
  const query = `SELECT EXISTS (SELECT 1 FROM ${tableName} WHERE id = $1) as user_exists`;
  const result = await client.query(query, [uuid]);
  return result.rows[0].user_exists;
}

/**
 * Create a superuser in the database
 * @param {string} uuid - The UUID for the user
 * @param {string} tableName - The name of the users table
 * @returns {Promise<void>}
 */
async function createSuperuser(uuid, tableName) {
  // Get the table structure to determine what columns we need to fill
  const structure = await getTableStructure(tableName);
  
  console.log(`${colors.yellow}Table structure for ${tableName}:${colors.reset}`);
  structure.forEach(col => {
    console.log(`- ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? 'nullable' : 'not nullable'})`);
  });
  
  // Check if this is a Django auth_user table
  const isDjangoAuthUser = structure.some(col => col.column_name === 'username') && 
                          structure.some(col => col.column_name === 'password');
  
  if (isDjangoAuthUser) {
    console.log(`${colors.green}Detected Django auth_user table${colors.reset}`);
    
    // Create a Django superuser
    const query = `
      INSERT INTO ${tableName} (
        id, password, last_login, is_superuser, username, first_name, 
        last_name, email, is_staff, is_active, date_joined
      ) VALUES (
        $1, 
        'pbkdf2_sha256$260000$abcdefghijklmnopqrstuvwxyz$abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz=', 
        NOW(), 
        TRUE, 
        'admin', 
        'Admin', 
        'User', 
        'admin@example.com', 
        TRUE, 
        TRUE, 
        NOW()
      ) RETURNING id, username
    `;
    
    const result = await client.query(query, [uuid]);
    console.log(`${colors.green}Created Django superuser:${colors.reset}`, result.rows[0]);
  } else if (tableName === 'users') {
    // This is likely a Supabase auth.users table
    console.log(`${colors.green}Detected Supabase users table${colors.reset}`);
    
    // Create a basic user for Supabase
    const hasEmailColumn = structure.some(col => col.column_name === 'email');
    const hasRoleColumn = structure.some(col => col.column_name === 'role');
    
    let query;
    if (hasEmailColumn && hasRoleColumn) {
      query = `
        INSERT INTO ${tableName} (
          id, email, role, created_at, updated_at
        ) VALUES (
          $1, 
          'admin@example.com',
          'authenticated',
          NOW(),
          NOW()
        ) RETURNING id, email
      `;
    } else {
      // Generic insert with just id
      query = `INSERT INTO ${tableName} (id) VALUES ($1) RETURNING id`;
    }
    
    const result = await client.query(query, [uuid]);
    console.log(`${colors.green}Created Supabase user:${colors.reset}`, result.rows[0]);
  } else {
    // Generic user table
    console.log(`${colors.yellow}Unknown user table structure, attempting generic insert${colors.reset}`);
    
    // Try to insert with just the ID
    const query = `INSERT INTO ${tableName} (id) VALUES ($1) RETURNING id`;
    const result = await client.query(query, [uuid]);
    console.log(`${colors.green}Created generic user:${colors.reset}`, result.rows[0]);
  }
}

/**
 * Update the authService.ts file to use the fixed UUID
 * @returns {Promise<void>}
 */
async function updateAuthService() {
  const authServicePath = path.join(__dirname, 'src', 'utils', 'authService.ts');
  
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
 * Main function to create a superuser
 */
async function main() {
  try {
    console.log(`${colors.yellow}Connecting to database...${colors.reset}`);
    await client.connect();
    console.log(`${colors.green}Connected to database${colors.reset}`);
    
    // Check for auth_user table (Django)
    const hasAuthUserTable = await tableExists('auth_user');
    // Check for users table (Supabase)
    const hasUsersTable = await tableExists('users');
    // Check for auth.users table (Supabase schema)
    const hasAuthUsersTable = await tableExists('auth.users');
    
    let usersTable;
    
    if (hasAuthUserTable) {
      usersTable = 'auth_user';
      console.log(`${colors.green}Found Django auth_user table${colors.reset}`);
    } else if (hasUsersTable) {
      usersTable = 'users';
      console.log(`${colors.green}Found users table${colors.reset}`);
    } else if (hasAuthUsersTable) {
      usersTable = 'auth.users';
      console.log(`${colors.green}Found auth.users table${colors.reset}`);
    } else {
      console.log(`${colors.red}No users table found. Checking foreign key references...${colors.reset}`);
      
      // Query to find the referenced table
      const fkQuery = `
        SELECT
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
        FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.constraint_name = 'life_care_plans_user_id_fkey';
      `;
      
      const fkResult = await client.query(fkQuery);
      
      if (fkResult.rows.length > 0) {
        usersTable = fkResult.rows[0].foreign_table_name;
        console.log(`${colors.green}Found referenced table: ${usersTable}${colors.reset}`);
      } else {
        throw new Error('Could not determine users table');
      }
    }
    
    // Check if user with fixed UUID already exists
    const exists = await userExists(FIXED_DEV_UUID, usersTable);
    
    if (exists) {
      console.log(`${colors.green}User with UUID ${FIXED_DEV_UUID} already exists${colors.reset}`);
    } else {
      console.log(`${colors.yellow}Creating user with UUID ${FIXED_DEV_UUID}${colors.reset}`);
      await createSuperuser(FIXED_DEV_UUID, usersTable);
    }
    
    // Update authService.ts to use the fixed UUID
    await updateAuthService();
    
    console.log(`${colors.green}${colors.bright}Superuser created successfully!${colors.reset}`);
    console.log(`${colors.green}You can now create life care plans without foreign key constraint errors.${colors.reset}`);
    
  } catch (error) {
    console.error(`${colors.red}Error:${colors.reset}`, error);
  } finally {
    await client.end();
  }
}

// Run the main function
main();
