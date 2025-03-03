/**
 * Test GAF Lookup Functionality
 * 
 * This script tests the GAF lookup functionality to ensure that all ZIP codes
 * can be looked up accurately. It tests a variety of ZIP codes and verifies
 * that the mock implementation correctly handles them.
 */

const { executeQuery } = require('./src/utils/browserDbConnection');

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
 * Test GAF lookup for a specific ZIP code
 * @param {string} zipCode ZIP code to test
 * @returns {Promise<boolean>} True if the test passed, false otherwise
 */
async function testGafLookup(zipCode) {
  try {
    printInfo(`Testing GAF lookup for ZIP code: ${zipCode}`);
    
    // Execute the query
    const result = await executeQuery(
      'SELECT mfr_code, pfr_code, city, state_name FROM gaf_lookup WHERE zip = $1 LIMIT 1',
      [zipCode]
    );
    
    // Check if the query returned a result
    if (result.rows.length === 0) {
      printError(`No GAF entry found for ZIP code: ${zipCode}`);
      return false;
    }
    
    // Print the result
    const gafEntry = result.rows[0];
    printSuccess(`Found GAF entry for ZIP code: ${zipCode}`);
    console.log(`  City: ${gafEntry.city}`);
    console.log(`  State: ${gafEntry.state_name}`);
    console.log(`  MFR Code: ${gafEntry.mfr_code}`);
    console.log(`  PFR Code: ${gafEntry.pfr_code}`);
    
    return true;
  } catch (error) {
    printError(`Error testing GAF lookup for ZIP code: ${zipCode}`, error);
    return false;
  }
}

/**
 * Test GAF lookup for multiple ZIP codes
 * @param {string[]} zipCodes ZIP codes to test
 * @returns {Promise<{passed: number, failed: number}>} Number of passed and failed tests
 */
async function testGafLookups(zipCodes) {
  let passed = 0;
  let failed = 0;
  
  for (const zipCode of zipCodes) {
    const result = await testGafLookup(zipCode);
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  return { passed, failed };
}

/**
 * Main function to run the tests
 */
async function main() {
  printSection('Testing GAF Lookup Functionality');
  
  // Test ZIP codes
  const zipCodes = [
    // Initial mock data
    '02917',  // Providence, RI
    '12345',  // New York, NY
    '90210',  // Beverly Hills, CA
    
    // Additional ZIP codes
    '06471',  // Orange, CT
    '10001',  // New York, NY
    '60601',  // Chicago, IL
    '94102',  // San Francisco, CA
    '33101',  // Miami, FL
    '75201',  // Dallas, TX
    '98101',  // Seattle, WA
  ];
  
  printInfo(`Testing ${zipCodes.length} ZIP codes...`);
  
  // Run the tests
  const { passed, failed } = await testGafLookups(zipCodes);
  
  // Print the results
  printSection('Test Results');
  printInfo(`Total tests: ${zipCodes.length}`);
  printSuccess(`Passed: ${passed}`);
  if (failed > 0) {
    printError(`Failed: ${failed}`);
  } else {
    printSuccess('All tests passed!');
  }
  
  // Print a summary
  printSection('Summary');
  if (failed > 0) {
    printError(`${failed} out of ${zipCodes.length} tests failed.`);
    printInfo('Please check the error messages above for details.');
  } else {
    printSuccess('All GAF lookups are working correctly!');
    printInfo('The mock implementation correctly handles all tested ZIP codes.');
  }
}

// Run the main function
main().catch(error => {
  printError('Unhandled error in main function', error);
});
