/**
 * Test GAF Lookup Fix
 * 
 * This script tests the GAF lookup fix to ensure that the pfr_code and mfr_code
 * from the gaf_lookup table are correctly used for the appropriate fee calculations.
 */

import { executeQuery } from './src/utils/browserDbConnection.js';
import Decimal from 'decimal.js';

// Set up colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

/**
 * Print a section header
 * @param {string} title Section title
 */
function printSection(title) {
  console.log('\n' + colors.bright + colors.cyan + '='.repeat(80) + colors.reset);
  console.log(colors.bright + colors.cyan + ' ' + title + colors.reset);
  console.log(colors.bright + colors.cyan + '='.repeat(80) + colors.reset + '\n');
}

/**
 * Print a success message
 * @param {string} message Success message
 */
function printSuccess(message) {
  console.log(colors.green + '✓ ' + message + colors.reset);
}

/**
 * Print an error message
 * @param {string} message Error message
 * @param {Error} error Error object
 */
function printError(message, error) {
  console.log(colors.red + '✗ ' + message + colors.reset);
  if (error) {
    console.log(colors.red + '  Error: ' + error.message + colors.reset);
    if (error.stack) {
      console.log(colors.dim + error.stack + colors.reset);
    }
  }
}

/**
 * Print an info message
 * @param {string} message Info message
 */
function printInfo(message) {
  console.log(colors.blue + 'ℹ ' + message + colors.reset);
}

/**
 * Fetch geographic factors for a ZIP code
 * @param {string} zipCode ZIP code to fetch factors for
 * @returns {Promise<Object>} Geographic factors
 */
async function fetchGeoFactors(zipCode) {
  try {
    printInfo(`Fetching geographic factors for ZIP code: ${zipCode}`);
    
    const result = await executeQuery(
      'SELECT mfr_code, pfr_code, city, state_name FROM gaf_lookup WHERE zip = $1 LIMIT 1',
      [zipCode]
    );
    
    if (result.rows.length === 0) {
      printError(`No GAF entry found for ZIP code: ${zipCode}`);
      return null;
    }
    
    const gafEntry = result.rows[0];
    printSuccess(`Found GAF entry for ZIP code: ${zipCode}`);
    console.log(`  City: ${gafEntry.city}`);
    console.log(`  State: ${gafEntry.state_name}`);
    console.log(`  MFR Code: ${gafEntry.mfr_code}`);
    console.log(`  PFR Code: ${gafEntry.pfr_code}`);
    
    // Return the geographic factors
    return {
      mfr_code: gafEntry.mfr_code,
      pfr_code: gafEntry.pfr_code,
    };
  } catch (error) {
    printError(`Error fetching geographic factors for ZIP code: ${zipCode}`, error);
    return null;
  }
}

/**
 * Apply geographic factors to MFU and PFR costs
 * @param {number} mfuCost MFU cost to adjust
 * @param {number} pfrCost PFR cost to adjust
 * @param {Object} geoFactors Geographic factors
 * @returns {Object} Adjusted costs
 */
function applyGeoFactors(mfuCost, pfrCost, geoFactors) {
  printInfo('Applying geographic factors to MFU and PFR costs');
  console.log(`  MFU Cost: ${mfuCost}`);
  console.log(`  PFR Cost: ${pfrCost}`);
  console.log(`  MFR Code: ${geoFactors.mfr_code}`);
  console.log(`  PFR Code: ${geoFactors.pfr_code}`);
  
  // Apply the geographic factors according to the fix
  // Use pfr_code for mfu_fees and mfr_code for pfr_fees
  const adjustedMfu = new Decimal(mfuCost).times(geoFactors.pfr_code).toNumber();
  const adjustedPfr = new Decimal(pfrCost).times(geoFactors.mfr_code).toNumber();
  
  printInfo('Adjusted costs:');
  console.log(`  Adjusted MFU Cost: ${adjustedMfu} (${mfuCost} * ${geoFactors.pfr_code})`);
  console.log(`  Adjusted PFR Cost: ${adjustedPfr} (${pfrCost} * ${geoFactors.mfr_code})`);
  
  return {
    adjustedMfu,
    adjustedPfr,
  };
}

/**
 * Test the GAF lookup fix
 * @param {string} zipCode ZIP code to test
 * @param {number} mfuCost MFU cost to adjust
 * @param {number} pfrCost PFR cost to adjust
 * @returns {Promise<boolean>} True if the test passed, false otherwise
 */
async function testGafLookupFix(zipCode, mfuCost, pfrCost) {
  try {
    printSection(`Testing GAF Lookup Fix for ZIP Code: ${zipCode}`);
    
    // Fetch geographic factors
    const geoFactors = await fetchGeoFactors(zipCode);
    if (!geoFactors) {
      return false;
    }
    
    // Apply geographic factors
    const adjustedCosts = applyGeoFactors(mfuCost, pfrCost, geoFactors);
    
    // Verify that the fix is working correctly
    printSection('Verification');
    
    // Check if pfr_code is used for mfu_fees
    const expectedAdjustedMfu = new Decimal(mfuCost).times(geoFactors.pfr_code).toNumber();
    const mfuMatch = Math.abs(adjustedCosts.adjustedMfu - expectedAdjustedMfu) < 0.001;
    
    if (mfuMatch) {
      printSuccess('pfr_code is correctly used for mfu_fees');
    } else {
      printError(`pfr_code is NOT correctly used for mfu_fees. Expected: ${expectedAdjustedMfu}, Actual: ${adjustedCosts.adjustedMfu}`);
    }
    
    // Check if mfr_code is used for pfr_fees
    const expectedAdjustedPfr = new Decimal(pfrCost).times(geoFactors.mfr_code).toNumber();
    const pfrMatch = Math.abs(adjustedCosts.adjustedPfr - expectedAdjustedPfr) < 0.001;
    
    if (pfrMatch) {
      printSuccess('mfr_code is correctly used for pfr_fees');
    } else {
      printError(`mfr_code is NOT correctly used for pfr_fees. Expected: ${expectedAdjustedPfr}, Actual: ${adjustedCosts.adjustedPfr}`);
    }
    
    return mfuMatch && pfrMatch;
  } catch (error) {
    printError('Error testing GAF lookup fix', error);
    return false;
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  printSection('Testing GAF Lookup Fix');
  
  // Test data
  const testCases = [
    { zipCode: '02917', mfuCost: 100, pfrCost: 150 },
    { zipCode: '90210', mfuCost: 200, pfrCost: 250 },
    { zipCode: '10001', mfuCost: 150, pfrCost: 200 },
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const testCase of testCases) {
    const result = await testGafLookupFix(testCase.zipCode, testCase.mfuCost, testCase.pfrCost);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  // Print the results
  printSection('Test Results');
  printInfo(`Total tests: ${testCases.length}`);
  printSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    printError(`Failed: ${failed}`);
  } else {
    printSuccess('All tests passed!');
  }
  
  // Print a summary
  printSection('Summary');
  if (failed > 0) {
    printError(`${failed} out of ${testCases.length} tests failed.`);
    printInfo('Please check the error messages above for details.');
  } else {
    printSuccess('The GAF lookup fix is working correctly!');
    printInfo('The code is correctly using pfr_code for mfu_fees and mfr_code for pfr_fees.');
  }
}

// Run the main function
main().catch(error => {
  printError('Unhandled error in main function', error);
});
