// This script verifies that the one-time GAF display fix works correctly
import { calculateItemCosts } from './src/utils/calculations/costCalculator.js';

async function verifyOneTimeGafFix() {
  console.log('Verifying one-time GAF display fix...');
  
  // Test parameters
  const baseRate = 177.00; // Match the value in the screenshot
  const frequency = 'one-time';
  const zipCode = '90210'; // Beverly Hills ZIP code
  const cptCode = '99213'; // Example CPT code
  
  console.log('Test Parameters:');
  console.log(`Base Rate: ${baseRate}`);
  console.log(`Frequency: ${frequency}`);
  console.log(`ZIP Code: ${zipCode}`);
  console.log(`CPT Code: ${cptCode}`);
  console.log('-----------------------------------');
  
  // Calculate costs with geographic adjustment
  console.log('Calculating costs WITH geographic adjustment...');
  const costsWithGeo = await calculateItemCosts({
    baseRate,
    frequency,
    zipCode,
    cptCode
  });
  
  console.log('Costs with geographic adjustment:');
  console.log(JSON.stringify(costsWithGeo, null, 2));
  console.log('-----------------------------------');
  
  // Verify that the values are different
  if (costsWithGeo.low !== costsWithGeo.high) {
    console.log('✅ Low and high costs are different, indicating percentiles are being used');
  } else {
    console.log('❌ Low and high costs are the same, percentiles may not be applied correctly');
  }
  
  if (costsWithGeo.average !== baseRate) {
    console.log('✅ Adjusted average cost differs from base rate, indicating GAF was applied');
  } else {
    console.log('❌ Adjusted average cost equals base rate, GAF may not be applied');
  }
  
  console.log('-----------------------------------');
  console.log('To test the fix in the UI:');
  console.log('1. Run the app with the fix: node restart_app_with_one_time_gaf_fix.js');
  console.log('2. Create a one-time item with a CPT code in the UI');
  console.log('3. Check that the item shows different values for low, average, and high costs');
  console.log('4. Verify that the GAF adjustments are being correctly applied by comparing the values with and without a ZIP code');
}

verifyOneTimeGafFix().catch(console.error);
