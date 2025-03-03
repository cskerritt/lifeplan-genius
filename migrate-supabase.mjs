// Script to migrate Supabase database to local PostgreSQL
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const config = {
  supabaseUrl: process.env.SUPABASE_URL || 'https://ooewnlqozkypyceowuhy.supabase.co',
  supabaseDbUrl: process.env.DATABASE_URL || 'postgresql://postgres:PLLzqw4JvgUJvPZL@db.ooewnlqozkypyceowuhy.supabase.co:5432/postgres',
  localDbName: 'supabase_local_db',
  localDbUser: 'postgres',
  localDbPassword: 'postgres',
  localDbHost: 'localhost',
  localDbPort: '5432',
  dumpFilePath: path.join(process.cwd(), 'supabase_dump.sql'),
  schemaOnlyDumpPath: path.join(process.cwd(), 'schema_only.sql'),
  dataOnlyDumpPath: path.join(process.cwd(), 'data_only.sql')
};

// Helper function to execute shell commands
async function runCommand(command, description) {
  console.log(`\n🔄 ${description}...`);
  try {
    const { stdout, stderr } = await execPromise(command);
    if (stderr && !stderr.includes('warning')) {
      console.warn(`⚠️ Command produced warnings/errors: ${stderr}`);
    }
    return stdout;
  } catch (error) {
    console.error(`❌ Error executing command: ${error.message}`);
    if (error.stderr) console.error(`Error details: ${error.stderr}`);
    throw error;
  }
}

// Main migration function
async function migrateDatabase() {
  try {
    console.log('🚀 Starting Supabase to local PostgreSQL migration...');
    
    // Step 1: Check if local PostgreSQL is running
    console.log('\n📋 Step 1: Checking local PostgreSQL connection...');
    try {
      await runCommand('psql -h localhost -U postgres -c "SELECT 1;"', 'Checking PostgreSQL connection');
      console.log('✅ Successfully connected to local PostgreSQL');
    } catch (error) {
      console.error('❌ Failed to connect to local PostgreSQL. Make sure it is running and accessible.');
      console.error('   You might need to start PostgreSQL with: brew services start postgresql');
      return;
    }
    
    // Step 2: Drop the local database if it exists and create a new one
    console.log('\n📋 Step 2: Preparing local database...');
    try {
      await runCommand(`psql -h localhost -U postgres -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '${config.localDbName}';" postgres`, 'Terminating existing connections');
      await runCommand(`dropdb -h localhost -U postgres ${config.localDbName} --if-exists`, 'Dropping existing database');
      await runCommand(`createdb -h localhost -U postgres ${config.localDbName}`, 'Creating new database');
      console.log(`✅ Successfully created database '${config.localDbName}'`);
    } catch (error) {
      console.error(`❌ Failed to prepare local database: ${error.message}`);
      return;
    }
    
    // Step 3: Dump schema only from Supabase
    console.log('\n📋 Step 3: Dumping schema from Supabase...');
    try {
      await runCommand(`pg_dump --dbname="${config.supabaseDbUrl}" --schema-only --no-owner --no-acl --file=${config.schemaOnlyDumpPath}`, 'Dumping schema only');
      console.log('✅ Successfully dumped schema from Supabase');
    } catch (error) {
      console.error(`❌ Failed to dump schema: ${error.message}`);
      return;
    }
    
    // Step 4: Import schema to local database
    console.log('\n📋 Step 4: Importing schema to local database...');
    try {
      await runCommand(`psql -h localhost -U postgres -d ${config.localDbName} -f ${config.schemaOnlyDumpPath}`, 'Importing schema');
      console.log('✅ Successfully imported schema to local database');
    } catch (error) {
      console.error(`❌ Failed to import schema: ${error.message}`);
      return;
    }
    
    // Step 5: Dump data only from Supabase
    console.log('\n📋 Step 5: Dumping data from Supabase...');
    try {
      await runCommand(`pg_dump --dbname="${config.supabaseDbUrl}" --data-only --disable-triggers --no-owner --no-acl --file=${config.dataOnlyDumpPath}`, 'Dumping data only');
      console.log('✅ Successfully dumped data from Supabase');
    } catch (error) {
      console.error(`❌ Failed to dump data: ${error.message}`);
      return;
    }
    
    // Step 6: Import data to local database
    console.log('\n📋 Step 6: Importing data to local database...');
    try {
      await runCommand(`psql -h localhost -U postgres -d ${config.localDbName} -f ${config.dataOnlyDumpPath}`, 'Importing data');
      console.log('✅ Successfully imported data to local database');
    } catch (error) {
      console.error(`❌ Failed to import data: ${error.message}`);
      return;
    }
    
    // Step 7: Verify the migration
    console.log('\n📋 Step 7: Verifying migration...');
    try {
      const tableListResult = await runCommand(`psql -h localhost -U postgres -d ${config.localDbName} -c "\\dt" -t`, 'Listing tables');
      
      if (!tableListResult.trim()) {
        console.warn('⚠️ No tables found in the local database. Migration may have failed.');
      } else {
        console.log('✅ Tables found in the local database:');
        console.log(tableListResult);
      }
    } catch (error) {
      console.error(`❌ Failed to verify migration: ${error.message}`);
      return;
    }
    
    // Step 8: Update connection string in .env.local
    console.log('\n📋 Step 8: Updating connection string in .env.local...');
    try {
      const envPath = path.join(process.cwd(), '.env.local');
      let envContent = '';
      
      try {
        envContent = fs.readFileSync(envPath, 'utf8');
      } catch (error) {
        // If .env.local doesn't exist, try reading .env
        envContent = fs.readFileSync(path.join(process.cwd(), '.env'), 'utf8');
      }
      
      const localDbUrl = `postgresql://${config.localDbUser}:${config.localDbPassword}@${config.localDbHost}:${config.localDbPort}/${config.localDbName}`;
      const updatedContent = envContent.replace(
        /DATABASE_URL=.*/g,
        `DATABASE_URL=${localDbUrl}`
      );
      
      fs.writeFileSync(envPath, updatedContent);
      console.log('✅ Successfully updated connection string in .env.local');
      console.log(`   New connection string: ${localDbUrl}`);
    } catch (error) {
      console.error(`❌ Failed to update connection string: ${error.message}`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Update your application code to use the local database connection');
    console.log('2. Test your application to ensure it works with the local database');
    console.log('3. If you encounter any issues, check the PostgreSQL logs for more details');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  }
}

// Run the migration
migrateDatabase(); 