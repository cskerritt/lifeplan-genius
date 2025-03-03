/**
 * Access PostgreSQL Database with GUI Tools
 * 
 * This script extracts the PostgreSQL connection information from environment variables
 * and provides instructions for connecting to the database using popular GUI tools.
 */

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config();
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' });
}

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
console.log(`${colors.bgBlue}${colors.white}${colors.bright} ACCESS POSTGRESQL DATABASE WITH GUI TOOLS ${colors.reset}`);
console.log(`${colors.cyan}This script provides instructions for connecting to the PostgreSQL database using GUI tools.${colors.reset}`);
console.log();

// Extract connection information from environment variables
const getConnectionInfo = () => {
  // Check for DATABASE_URL in different environment variables
  const databaseUrl = process.env.DATABASE_URL || 
                      process.env.VITE_DATABASE_URL || 
                      'postgresql://postgres:postgres@localhost:5432/supabase_local_db';
  
  try {
    // Parse the connection string
    const regex = /^postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)$/;
    const match = databaseUrl.match(regex);
    
    if (!match) {
      throw new Error('Invalid connection string format');
    }
    
    const [, username, password, host, port, database] = match;
    
    return {
      host,
      port: parseInt(port, 10),
      database,
      username,
      password,
      connectionString: databaseUrl
    };
  } catch (error) {
    console.error(`${colors.red}Error parsing connection string:${colors.reset}`, error.message);
    
    // Provide default values if parsing fails
    return {
      host: 'localhost',
      port: 5432,
      database: 'supabase_local_db',
      username: 'postgres',
      password: 'postgres',
      connectionString: databaseUrl
    };
  }
};

// Get connection information
const connectionInfo = getConnectionInfo();

// Print connection information
console.log(`${colors.green}${colors.bright}PostgreSQL Connection Information:${colors.reset}`);
console.log(`${colors.bright}Host:${colors.reset} ${connectionInfo.host}`);
console.log(`${colors.bright}Port:${colors.reset} ${connectionInfo.port}`);
console.log(`${colors.bright}Database:${colors.reset} ${connectionInfo.database}`);
console.log(`${colors.bright}Username:${colors.reset} ${connectionInfo.username}`);
console.log(`${colors.bright}Password:${colors.reset} ${'*'.repeat(connectionInfo.password.length)}`);
console.log();

// Check if psql is installed
const checkPsql = () => {
  return new Promise((resolve) => {
    const command = process.platform === 'win32' ? 'where' : 'which';
    const args = [process.platform === 'win32' ? 'psql.exe' : 'psql'];
    
    const check = spawn(command, args);
    
    let output = '';
    check.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    check.on('close', (code) => {
      resolve(code === 0);
    });
  });
};

// Function to open psql
const openPsql = async () => {
  const isPsqlInstalled = await checkPsql();
  
  if (!isPsqlInstalled) {
    console.log(`${colors.yellow}psql command-line tool is not installed or not in your PATH.${colors.reset}`);
    return;
  }
  
  console.log(`${colors.green}Opening psql command-line tool...${colors.reset}`);
  
  const psqlProcess = spawn('psql', [connectionInfo.connectionString], {
    stdio: 'inherit',
    shell: true
  });
  
  psqlProcess.on('error', (error) => {
    console.error(`${colors.red}Error opening psql:${colors.reset}`, error.message);
  });
};

// Print instructions for popular GUI tools
console.log(`${colors.green}${colors.bright}Instructions for Connecting with GUI Tools:${colors.reset}`);
console.log();

// pgAdmin
console.log(`${colors.yellow}${colors.bright}pgAdmin:${colors.reset}`);
console.log(`1. Download and install pgAdmin from https://www.pgadmin.org/download/`);
console.log(`2. Open pgAdmin and click on "Add New Server"`);
console.log(`3. In the "General" tab, enter a name for the connection (e.g., "LifePlan Genius")`);
console.log(`4. In the "Connection" tab, enter the following information:`);
console.log(`   - Host: ${connectionInfo.host}`);
console.log(`   - Port: ${connectionInfo.port}`);
console.log(`   - Maintenance database: ${connectionInfo.database}`);
console.log(`   - Username: ${connectionInfo.username}`);
console.log(`   - Password: ${connectionInfo.password}`);
console.log(`5. Click "Save" to connect to the database`);
console.log();

// DBeaver
console.log(`${colors.yellow}${colors.bright}DBeaver:${colors.reset}`);
console.log(`1. Download and install DBeaver from https://dbeaver.io/download/`);
console.log(`2. Open DBeaver and click on "New Database Connection"`);
console.log(`3. Select "PostgreSQL" and click "Next"`);
console.log(`4. Enter the following information:`);
console.log(`   - Host: ${connectionInfo.host}`);
console.log(`   - Port: ${connectionInfo.port}`);
console.log(`   - Database: ${connectionInfo.database}`);
console.log(`   - Username: ${connectionInfo.username}`);
console.log(`   - Password: ${connectionInfo.password}`);
console.log(`5. Click "Test Connection" to verify the connection works`);
console.log(`6. Click "Finish" to create the connection`);
console.log();

// TablePlus
console.log(`${colors.yellow}${colors.bright}TablePlus:${colors.reset}`);
console.log(`1. Download and install TablePlus from https://tableplus.com/download`);
console.log(`2. Open TablePlus and click on "Create a new connection"`);
console.log(`3. Select "PostgreSQL" as the connection type`);
console.log(`4. Enter the following information:`);
console.log(`   - Name: LifePlan Genius`);
console.log(`   - Host: ${connectionInfo.host}`);
console.log(`   - Port: ${connectionInfo.port}`);
console.log(`   - Database: ${connectionInfo.database}`);
console.log(`   - User: ${connectionInfo.username}`);
console.log(`   - Password: ${connectionInfo.password}`);
console.log(`5. Click "Test" to verify the connection works`);
console.log(`6. Click "Connect" to connect to the database`);
console.log();

// Command-line option
console.log(`${colors.yellow}${colors.bright}Command-line (psql):${colors.reset}`);
console.log(`You can also connect to the database using the psql command-line tool:`);
console.log(`psql ${connectionInfo.connectionString}`);
console.log();

// Ask if the user wants to open psql
console.log(`${colors.green}Would you like to open the psql command-line tool now? (y/n)${colors.reset}`);
process.stdin.once('data', async (data) => {
  const input = data.toString().trim().toLowerCase();
  
  if (input === 'y' || input === 'yes') {
    await openPsql();
  }
  
  console.log();
  console.log(`${colors.green}${colors.bright}Important Tables to Inspect:${colors.reset}`);
  console.log(`1. users - Contains user records`);
  console.log(`2. life_care_plans - Contains life care plan records`);
  console.log(`3. care_plan_entries - Contains entries for life care plans`);
  console.log();
  console.log(`${colors.green}${colors.bright}Useful SQL Queries:${colors.reset}`);
  console.log(`1. List all users:`);
  console.log(`   SELECT * FROM users;`);
  console.log();
  console.log(`2. List all life care plans:`);
  console.log(`   SELECT * FROM life_care_plans;`);
  console.log();
  console.log(`3. Check if the superuser exists:`);
  console.log(`   SELECT * FROM users WHERE id = '11111111-1111-4111-a111-111111111111';`);
  console.log();
  console.log(`4. View foreign key constraints:`);
  console.log(`   SELECT`);
  console.log(`     tc.constraint_name,`);
  console.log(`     tc.table_name,`);
  console.log(`     kcu.column_name,`);
  console.log(`     ccu.table_name AS foreign_table_name,`);
  console.log(`     ccu.column_name AS foreign_column_name`);
  console.log(`   FROM`);
  console.log(`     information_schema.table_constraints AS tc`);
  console.log(`     JOIN information_schema.key_column_usage AS kcu`);
  console.log(`       ON tc.constraint_name = kcu.constraint_name`);
  console.log(`     JOIN information_schema.constraint_column_usage AS ccu`);
  console.log(`       ON ccu.constraint_name = tc.constraint_name`);
  console.log(`   WHERE tc.constraint_type = 'FOREIGN KEY';`);
  
  process.exit(0);
});
