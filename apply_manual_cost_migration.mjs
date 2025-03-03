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
    console.log('Result:', result);
    
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
    } else {
      console.warn('Some columns may not have been added correctly.');
    }
    
  } catch (error) {
    console.error('Error applying migration:', error);
  }
}

applyMigration();
