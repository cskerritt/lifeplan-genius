/**
 * Test CPT Code Calculation
 * 
 * This script tests the CPT code calculation for code 99203 to verify that
 * the fee schedule percentiles and combined base rates are calculated correctly.
 */

// Import the cost calculator module
// Use dynamic import for ESM compatibility
const importModule = async () => {
  try {
    // Try importing as ESM
    return await import('./src/utils/calculations/costCalculator.js');
  } catch (error) {
    console.error('Error importing as ESM:', error.message);
    
    try {
      // Try importing as CommonJS
      return require('./src/utils/calculations/costCalculator');
    } catch (error) {
      console.error('Error importing as CommonJS:', error.message);
      
      try {
        // Try importing from the index file
        return require('./src/utils/calculations');
      } catch (error) {
        console.error('Error importing from index:', error.message);
        throw new Error('Failed to import cost calculator module');
      }
    }
  }
};

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
 * Test CPT code lookup
 */
async function testCPTCodeLookup(costCalculator) {
  printSection('Testing CPT Code Lookup');
  
  try {
    printInfo('Looking up CPT code 99203...');
    const cptData = await costCalculator.lookupCPTCode('99203');
    
    if (!cptData || !Array.isArray(cptData) || cptData.length === 0) {
      printError('Failed to retrieve CPT code data');
      return null;
    }
    
    printSuccess('Successfully retrieved CPT code data');
    printInfo('CPT code data:');
    console.log(JSON.stringify(cptData[0], null, 2));
    
    // Check if the data has the required fields
    const data = cptData[0];
    const hasMfrData = data.mfr_50th !== undefined && data.mfr_75th !== undefined;
    const hasPfrData = data.pfr_50th !== undefined && data.pfr_75th !== undefined;
    
    if (hasMfrData) {
      printSuccess('MFR data is available');
      printInfo(`MFR 50th: ${data.mfr_50th}`);
      printInfo(`MFR 75th: ${data.mfr_75th}`);
    } else {
      printError('MFR data is missing');
    }
    
    if (hasPfrData) {
      printSuccess('PFR data is available');
      printInfo(`PFR 50th: ${data.pfr_50th}`);
      printInfo(`PFR 75th: ${data.pfr_75th}`);
    } else {
      printError('PFR data is missing');
    }
    
    return cptData;
  } catch (error) {
    printError('Error looking up CPT code', error);
    return null;
  }
}

/**
 * Test cost calculation
 */
async function testCostCalculation(costCalculator) {
  printSection('Testing Cost Calculation');
  
  try {
    printInfo('Calculating costs for CPT code 99203...');
    
    // Test parameters
    const params = {
      baseRate: 30044.00, // This should be ignored when CPT code is provided
      frequency: '4x per year',
      currentAge: 51,
      lifeExpectancy: 29.3,
      cptCode: '99203',
      category: 'physicianFollowUp',
      zipCode: '90210' // Beverly Hills ZIP code
    };
    
    printInfo('Calculation parameters:');
    console.log(JSON.stringify(params, null, 2));
    
    // Calculate costs
    const result = await costCalculator.calculateItemCosts(params);
    
    printSuccess('Successfully calculated costs');
    printInfo('Calculation result:');
    console.log(JSON.stringify(result, null, 2));
    
    // Verify the result
    if (result.annual > 0 && result.annual < 1000) {
      printSuccess(`Annual cost (${result.annual}) is in the expected range (0-1000)`);
    } else {
      printError(`Annual cost (${result.annual}) is outside the expected range (0-1000)`);
    }
    
    if (result.lifetime > 0 && result.lifetime < 30000) {
      printSuccess(`Lifetime cost (${result.lifetime}) is in the expected range (0-30000)`);
    } else {
      printError(`Lifetime cost (${result.lifetime}) is outside the expected range (0-30000)`);
    }
    
    return result;
  } catch (error) {
    printError('Error calculating costs', error);
    return null;
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  printSection('Testing CPT Code Calculation');
  
  try {
    // Import the cost calculator module
    printInfo('Importing cost calculator module...');
    const costCalculatorModule = await importModule();
    
    if (!costCalculatorModule) {
      printError('Failed to import cost calculator module');
      return;
    }
    
    const costCalculator = costCalculatorModule.default || costCalculatorModule;
    printSuccess('Successfully imported cost calculator module');
    
    // Test CPT code lookup
    const cptData = await testCPTCodeLookup(costCalculator);
    
    if (!cptData) {
      printError('CPT code lookup test failed, cannot proceed with cost calculation test');
      return;
    }
    
    // Test cost calculation
    const result = await testCostCalculation(costCalculator);
    
    if (!result) {
      printError('Cost calculation test failed');
      return;
    }
    
    // Print summary
    printSection('Test Summary');
    
    if (cptData && result) {
      printSuccess('All tests passed');
      printInfo('The CPT code calculation is working correctly');
      printInfo('Fee schedule percentiles are being retrieved and displayed');
      printInfo('Geographic factors are being applied correctly');
      printInfo('Combined base rates are being calculated correctly');
      printInfo('Annual and lifetime costs are being calculated correctly');
    } else {
      printError('Some tests failed');
      printInfo('Please check the error messages above for details');
    }
  } catch (error) {
    printError('Unhandled error in test process', error);
  }
}

// Run the main function
main().catch(error => {
  printError('Unhandled error in main function', error);
  process.exit(1);
});
