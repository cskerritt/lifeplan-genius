// This script verifies the MFU/MFR field name fix by looking up a CPT code
// and checking the cost calculation process

import { executeQuery } from './src/utils/browserDbConnection.js';

async function verifyMfuFix() {
  console.log('Verifying MFU/MFR field name fix...');
  
  try {
    // First, look up a CPT code directly to see the raw data
    console.log('Looking up CPT code 99204...');
    const query = `SELECT * FROM validate_cpt_code($1)`;
    const result = await executeQuery(query, ['99204']);
    
    if (result.rows && result.rows.length > 0) {
      console.log('CPT code data fields:', Object.keys(result.rows[0]));
      
      // Log both mfu_* and mfr_* fields to verify which ones exist
      console.log('CPT code data values:');
      console.log('- mfu_50th:', result.rows[0].mfu_50th);
      console.log('- mfu_75th:', result.rows[0].mfu_75th);
      console.log('- mfu_90th:', result.rows[0].mfu_90th);
      console.log('- mfr_50th:', result.rows[0].mfr_50th);
      console.log('- mfr_75th:', result.rows[0].mfr_75th);
      console.log('- mfr_90th:', result.rows[0].mfr_90th);
      console.log('- pfr_50th:', result.rows[0].pfr_50th);
      console.log('- pfr_75th:', result.rows[0].pfr_75th);
      console.log('- pfr_90th:', result.rows[0].pfr_90th);
      
      // Verify that mfu_* fields exist and have values
      if (result.rows[0].mfu_50th !== undefined && result.rows[0].mfu_75th !== undefined) {
        console.log('✅ MFU fields exist and have values');
      } else {
        console.log('❌ MFU fields are missing or undefined');
      }
      
      // Verify that mfr_* fields don't exist or are undefined
      if (result.rows[0].mfr_50th === undefined && result.rows[0].mfr_75th === undefined) {
        console.log('✅ MFR fields are correctly undefined (as expected)');
      } else {
        console.log('❌ MFR fields exist but should not');
      }
      
      // Verify that pfr_* fields exist and have values
      if (result.rows[0].pfr_50th !== undefined && result.rows[0].pfr_75th !== undefined) {
        console.log('✅ PFR fields exist and have values');
      } else {
        console.log('❌ PFR fields are missing or undefined');
      }
      
      console.log('\nVerification complete. The fix should ensure that the code correctly uses mfu_* fields for Medicare fee values.');
    } else {
      console.log('No CPT code data found');
    }
  } catch (error) {
    console.error('Error testing MFU/MFR fix:', error);
  }
}

verifyMfuFix();
