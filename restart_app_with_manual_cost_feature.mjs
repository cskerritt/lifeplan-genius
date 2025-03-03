import { spawn } from 'child_process';
import { executeQuery } from './src/utils/browserDbConnection.js';
import fs from 'fs';

async function applyMigration() {
  try {
    console.log('Reading migration SQL file...');
    const sql = fs.readFileSync('./migrations/add_manual_cost_and_notes_fields.sql', 'utf8');
    
    console.log('Applying migration...');
    console.log('SQL to execute:', sql);
    
    const result = await executeQuery(sql);
    
    console.log('Migration applied successfully!');
    
    // Verify the columns were added
    const verifyResult = await executeQuery(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'care_plan_entries' 
      AND column_name IN ('is_manual_cost', 'notes', 'rationale');
    `);
    
    console.log('Verification result:');
    console.table(verifyResult.rows);
    
    if (verifyResult.rows.length === 3) {
      console.log('All columns were added successfully!');
      return true;
    } else {
      console.warn('Some columns may not have been added correctly.');
      return false;
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
    return false;
  }
}

async function startApp() {
  console.log('Starting the application...');
  
  // Use npm run dev to start the application
  const child = spawn('npm', ['run', 'dev'], {
    stdio: 'inherit',
    shell: true
  });
  
  child.on('error', (error) => {
    console.error('Failed to start the application:', error);
  });
  
  console.log('Application started!');
}

async function main() {
  console.log('=== Manual Cost Override Feature Deployment ===');
  
  // Apply the migration
  console.log('\n1. Applying database migration...');
  const migrationSuccess = await applyMigration();
  
  if (migrationSuccess) {
    console.log('\n✅ Migration applied successfully!');
    
    // Start the application
    console.log('\n2. Starting the application with new features...');
    await startApp();
  } else {
    console.error('\n❌ Migration failed. Please check the error messages above.');
  }
}

main().catch(console.error);
