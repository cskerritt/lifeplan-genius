import { spawn } from 'child_process';
import { executeQuery } from './src/utils/browserDbConnection.js';
import fs from 'fs';

async function applyMigrations() {
  try {
    console.log('Reading migration SQL files...');
    const manualCostSql = fs.readFileSync('./migrations/add_manual_cost_and_notes_fields.sql', 'utf8');
    
    console.log('Applying manual cost migration...');
    console.log('SQL to execute:', manualCostSql);
    
    const manualCostResult = await executeQuery(manualCostSql);
    
    console.log('Manual cost migration applied successfully!');
    
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
    console.error('Error applying migrations:', error);
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
  console.log('=== Evaluee Duplication and Manual Cost Override Feature Deployment ===');
  
  // Apply the migrations
  console.log('\n1. Applying database migrations...');
  const migrationsSuccess = await applyMigrations();
  
  if (migrationsSuccess) {
    console.log('\n✅ Migrations applied successfully!');
    
    // Start the application
    console.log('\n2. Starting the application with new features...');
    await startApp();
  } else {
    console.error('\n❌ Migrations failed. Please check the error messages above.');
  }
}

main().catch(console.error);
