#!/usr/bin/env node

/**
 * Cost Calculation Debugging Script
 * 
 * This script tests the cost calculation flow to identify why costs are coming back as 0 or NaN.
 * It focuses on:
 * 1. CPT code lookup
 * 2. Geographic factor retrieval and application
 * 3. Cost calculation with the retrieved data
 * 4. Fallback mechanisms when data is missing
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
 * Print a warning message
 * @param {string} message Warning message
 */
function printWarning(message) {
  console.log(colors.yellow + '⚠ ' + message + colors.reset);
}

/**
 * Print an object with indentation
 * @param {Object} obj Object to print
 * @param {number} indent Indentation level
 */
function printObject(obj, indent = 2) {
  const indentStr = ' '.repeat(indent);
  console.log(JSON.stringify(obj, null, indent).replace(/^/gm, indentStr));
}

/**
 * Test direct database connection
 */
async function testDatabaseConnection() {
  printSection('Testing Database Connection');
  
  try {
    printInfo('Executing a simple query to test database connection...');
    
    const result = await executeQuery('SELECT 1 as test');
    
    if (result && result.rows && result.rows.length > 0) {
      printSuccess('Database connection successful');
      printInfo('Query result:');
      printObject(result.rows);
      return true;
    } else {
      printError('Database connection failed: No results returned');
      return false;
    }
  } catch (error) {
    printError('Database connection failed', error);
    return false;
  }
}

/**
 * Test CPT code lookup directly using database query
 */
async function testDirectCPTCodeLookup(cptCode) {
  printSection(`Testing Direct CPT Code Lookup for ${cptCode}`);
  
  try {
    printInfo(`Looking up CPT code ${cptCode} directly in the database...`);
    
    const query = `SELECT * FROM validate_cpt_code($1)`;
    const result = await executeQuery(query, [cptCode]);
    
    printInfo('Query result metadata:');
    console.log(`  Rows: ${result.rows ? result.rows.length : 'undefined'}`);
    console.log(`  Fields: ${result.fields ? result.fields.length : 'undefined'}`);
    
    if (result.rows && result.rows.length > 0) {
      printSuccess(`Found CPT code data for ${cptCode}`);
      printInfo('CPT code data:');
      printObject(result.rows[0]);
      
      // Check for MFU and PFR data
      const data = result.rows[0];
      const hasMfuData = data.mfu_50th != null && data.mfu_75th != null;
      const hasPfrData = data.pfr_50th != null && data.pfr_75th != null;
      
      if (hasMfuData) {
        printSuccess('MFU data is available');
        printInfo(`MFU 50th: ${data.mfu_50th}`);
        printInfo(`MFU 75th: ${data.mfu_75th}`);
      } else {
        printWarning('MFU data is missing');
      }
      
      if (hasPfrData) {
        printSuccess('PFR data is available');
        printInfo(`PFR 50th: ${data.pfr_50th}`);
        printInfo(`PFR 75th: ${data.pfr_75th}`);
      } else {
        printWarning('PFR data is missing');
      }
      
      return result.rows[0];
    } else {
      printError(`No data found for CPT code ${cptCode}`);
      return null;
    }
  } catch (error) {
    printError(`Error looking up CPT code ${cptCode}`, error);
    return null;
  }
}

/**
 * Test geographic factor lookup directly using database query
 */
async function testDirectGeoFactorLookup(zipCode) {
  printSection(`Testing Direct Geographic Factor Lookup for ${zipCode}`);
  
  try {
    printInfo(`Looking up geographic factors for ZIP code ${zipCode} directly in the database...`);
    
    const query = `SELECT * FROM gaf_lookup WHERE zip = $1 LIMIT 1`;
    const result = await executeQuery(query, [zipCode]);
    
    printInfo('Query result metadata:');
    console.log(`  Rows: ${result.rows ? result.rows.length : 'undefined'}`);
    console.log(`  Fields: ${result.fields ? result.fields.length : 'undefined'}`);
    
    if (result.rows && result.rows.length > 0) {
      printSuccess(`Found geographic factors for ZIP code ${zipCode}`);
      printInfo('Geographic factor data:');
      printObject(result.rows[0]);
      
      // Check for MFR and PFR factors
      const data = result.rows[0];
      const hasMfrFactor = data.mfr_code != null;
      const hasPfrFactor = data.pfr_code != null;
      
      if (hasMfrFactor) {
        printSuccess('MFR factor is available');
        printInfo(`MFR factor: ${data.mfr_code}`);
      } else {
        printWarning('MFR factor is missing');
      }
      
      if (hasPfrFactor) {
        printSuccess('PFR factor is available');
        printInfo(`PFR factor: ${data.pfr_code}`);
      } else {
        printWarning('PFR factor is missing');
      }
      
      return {
        mfr_factor: data.mfr_code,
        pfr_factor: data.pfr_code
      };
    } else {
      printError(`No geographic factors found for ZIP code ${zipCode}`);
      return null;
    }
  } catch (error) {
    printError(`Error looking up geographic factors for ZIP code ${zipCode}`, error);
    return null;
  }
}

/**
 * Test applying geographic factors to CPT code costs
 */
function testApplyGeoFactors(cptData, geoFactors) {
  printSection('Testing Geographic Factor Application');
  
  try {
    printInfo('Applying geographic factors to CPT code costs...');
    
    if (!cptData) {
      printError('Cannot apply geographic factors: CPT code data is missing');
      return null;
    }
    
    if (!geoFactors) {
      printWarning('Geographic factors are missing, using default factors (1.0)');
      geoFactors = {
        mfr_factor: 1.0,
        pfr_factor: 1.0
      };
    }
    
    printInfo('CPT code data:');
    printObject(cptData);
    
    printInfo('Geographic factors:');
    printObject(geoFactors);
    
    // Extract MFU and PFR values
    const mfu50th = cptData.mfu_50th != null ? new Decimal(cptData.mfu_50th) : null;
    const mfu75th = cptData.mfu_75th != null ? new Decimal(cptData.mfu_75th) : null;
    const pfr50th = cptData.pfr_50th != null ? new Decimal(cptData.pfr_50th) : null;
    const pfr75th = cptData.pfr_75th != null ? new Decimal(cptData.pfr_75th) : null;
    
    // Apply geographic factors
    const adjustedMfu50th = mfu50th ? mfu50th.times(geoFactors.mfr_factor) : null;
    const adjustedMfu75th = mfu75th ? mfu75th.times(geoFactors.mfr_factor) : null;
    const adjustedPfr50th = pfr50th ? pfr50th.times(geoFactors.pfr_factor) : null;
    const adjustedPfr75th = pfr75th ? pfr75th.times(geoFactors.pfr_factor) : null;
    
    // Log the adjusted values
    printInfo('Adjusted MFU values:');
    if (adjustedMfu50th) {
      console.log(`  MFU 50th: ${mfu50th} * ${geoFactors.mfr_factor} = ${adjustedMfu50th}`);
    } else {
      console.log('  MFU 50th: Not available');
    }
    
    if (adjustedMfu75th) {
      console.log(`  MFU 75th: ${mfu75th} * ${geoFactors.mfr_factor} = ${adjustedMfu75th}`);
    } else {
      console.log('  MFU 75th: Not available');
    }
    
    printInfo('Adjusted PFR values:');
    if (adjustedPfr50th) {
      console.log(`  PFR 50th: ${pfr50th} * ${geoFactors.pfr_factor} = ${adjustedPfr50th}`);
    } else {
      console.log('  PFR 50th: Not available');
    }
    
    if (adjustedPfr75th) {
      console.log(`  PFR 75th: ${pfr75th} * ${geoFactors.pfr_factor} = ${adjustedPfr75th}`);
    } else {
      console.log('  PFR 75th: Not available');
    }
    
    // Calculate combined costs
    let low, high, average;
    
    if (adjustedMfu50th && adjustedPfr50th && adjustedMfu75th && adjustedPfr75th) {
      // If we have both adjusted MFU and PFR data, use both for the calculation
      // Use 50th percentiles for low
      low = adjustedMfu50th.plus(adjustedPfr50th).dividedBy(2);
      // Use 75th percentiles for high
      high = adjustedMfu75th.plus(adjustedPfr75th).dividedBy(2);
      // Calculate average as (low + high) / 2
      average = low.plus(high).dividedBy(2);
      
      printSuccess('Calculated costs using both adjusted MFU and PFR data');
    } 
    else if (adjustedMfu50th && adjustedMfu75th) {
      // If we only have adjusted MFU data
      low = adjustedMfu50th; // 50th percentile for low
      high = adjustedMfu75th; // 75th percentile for high
      average = low.plus(high).dividedBy(2); // Average of low and high
      
      printSuccess('Calculated costs using only adjusted MFU data');
    } 
    else if (adjustedPfr50th && adjustedPfr75th) {
      // If we only have adjusted PFR data
      low = adjustedPfr50th; // 50th percentile for low
      high = adjustedPfr75th; // 75th percentile for high
      average = low.plus(high).dividedBy(2); // Average of low and high
      
      printSuccess('Calculated costs using only adjusted PFR data');
    } 
    else {
      // If we don't have any adjusted data, use sample values
      printWarning('No adjusted data available, using sample values');
      low = new Decimal(100);
      high = new Decimal(200);
      average = new Decimal(150);
    }
    
    // Create the cost range
    const costRange = {
      low: low.toDP(2).toNumber(),
      average: average.toDP(2).toNumber(),
      high: high.toDP(2).toNumber()
    };
    
    printInfo('Final cost range:');
    printObject(costRange);
    
    return costRange;
  } catch (error) {
    printError('Error applying geographic factors', error);
    return null;
  }
}

/**
 * Test calculating annual and lifetime costs
 */
function testCalculateItemCosts(costRange, frequency, currentAge, lifeExpectancy) {
  printSection('Testing Item Cost Calculation');
  
  try {
    printInfo('Calculating annual and lifetime costs...');
    
    if (!costRange) {
      printError('Cannot calculate costs: Cost range is missing');
      return null;
    }
    
    printInfo('Cost range:');
    printObject(costRange);
    
    printInfo('Parameters:');
    console.log(`  Frequency: ${frequency}`);
    console.log(`  Current age: ${currentAge}`);
    console.log(`  Life expectancy: ${lifeExpectancy}`);
    
    // Parse frequency to get multiplier
    let frequencyMultiplier = 1;
    let isOneTime = false;
    
    if (frequency.toLowerCase().includes('one-time') || frequency.toLowerCase().includes('once')) {
      isOneTime = true;
      printInfo('One-time item detected');
    } else if (frequency.includes('per week')) {
      const match = frequency.match(/(\d+)/);
      if (match) {
        frequencyMultiplier = parseInt(match[1]) * 52;
        printInfo(`Weekly frequency detected: ${match[1]} times per week = ${frequencyMultiplier} times per year`);
      }
    } else if (frequency.includes('per month')) {
      const match = frequency.match(/(\d+)/);
      if (match) {
        frequencyMultiplier = parseInt(match[1]) * 12;
        printInfo(`Monthly frequency detected: ${match[1]} times per month = ${frequencyMultiplier} times per year`);
      }
    } else if (frequency.includes('per year')) {
      const match = frequency.match(/(\d+)/);
      if (match) {
        frequencyMultiplier = parseInt(match[1]);
        printInfo(`Yearly frequency detected: ${match[1]} times per year`);
      }
    }
    
    // Parse duration
    let duration = lifeExpectancy;
    const durationMatch = frequency.match(/for\s+(\d+)\s+years/);
    if (durationMatch) {
      duration = parseInt(durationMatch[1]);
      printInfo(`Duration specified in frequency: ${duration} years`);
    }
    
    // Calculate annual cost
    const annualCost = isOneTime 
      ? costRange.average 
      : new Decimal(costRange.average).times(frequencyMultiplier).toDP(2).toNumber();
    
    // Calculate lifetime cost
    const lifetimeCost = isOneTime 
      ? costRange.average 
      : new Decimal(annualCost).times(duration).toDP(2).toNumber();
    
    printInfo('Calculation results:');
    console.log(`  Annual cost: ${costRange.average} * ${frequencyMultiplier} = ${annualCost}`);
    console.log(`  Lifetime cost: ${annualCost} * ${duration} = ${lifetimeCost}`);
    
    // Create the calculated costs
    const calculatedCosts = {
      annual: annualCost,
      lifetime: lifetimeCost,
      low: costRange.low,
      high: costRange.high,
      average: costRange.average,
      isOneTime
    };
    
    printInfo('Final calculated costs:');
    printObject(calculatedCosts);
    
    return calculatedCosts;
  } catch (error) {
    printError('Error calculating item costs', error);
    return null;
  }
}

/**
 * Main function to run the tests
 */
async function main() {
  printSection('Cost Calculation Debugging');
  
  try {
    // Test database connection
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      printError('Cannot proceed with tests: Database connection failed');
      return;
    }
    
    // Test parameters
    const cptCode = '99203';
    const zipCode = '90210';
    const frequency = '4x per year';
    const currentAge = 51;
    const lifeExpectancy = 29.3;
    
    printInfo('Test parameters:');
    console.log(`  CPT code: ${cptCode}`);
    console.log(`  ZIP code: ${zipCode}`);
    console.log(`  Frequency: ${frequency}`);
    console.log(`  Current age: ${currentAge}`);
    console.log(`  Life expectancy: ${lifeExpectancy}`);
    
    // Test CPT code lookup
    const cptData = await testDirectCPTCodeLookup(cptCode);
    
    // Test geographic factor lookup
    const geoFactors = await testDirectGeoFactorLookup(zipCode);
    
    // Test applying geographic factors
    const costRange = testApplyGeoFactors(cptData, geoFactors);
    
    // Test calculating item costs
    const calculatedCosts = testCalculateItemCosts(costRange, frequency, currentAge, lifeExpectancy);
    
    // Print summary
    printSection('Test Summary');
    
    if (cptData && geoFactors && costRange && calculatedCosts) {
      printSuccess('All tests passed');
      
      printInfo('CPT code data:');
      printObject(cptData);
      
      printInfo('Geographic factors:');
      printObject(geoFactors);
      
      printInfo('Cost range:');
      printObject(costRange);
      
      printInfo('Calculated costs:');
      printObject(calculatedCosts);
      
      // Check if any values are zero or NaN
      let hasZeroOrNaN = false;
      
      if (isNaN(calculatedCosts.annual) || calculatedCosts.annual === 0) {
        printWarning('Annual cost is zero or NaN');
        hasZeroOrNaN = true;
      }
      
      if (isNaN(calculatedCosts.lifetime) || calculatedCosts.lifetime === 0) {
        printWarning('Lifetime cost is zero or NaN');
        hasZeroOrNaN = true;
      }
      
      if (isNaN(calculatedCosts.low) || calculatedCosts.low === 0) {
        printWarning('Low cost is zero or NaN');
        hasZeroOrNaN = true;
      }
      
      if (isNaN(calculatedCosts.high) || calculatedCosts.high === 0) {
        printWarning('High cost is zero or NaN');
        hasZeroOrNaN = true;
      }
      
      if (isNaN(calculatedCosts.average) || calculatedCosts.average === 0) {
        printWarning('Average cost is zero or NaN');
        hasZeroOrNaN = true;
      }
      
      if (hasZeroOrNaN) {
        printWarning('Some costs are zero or NaN, which may indicate a problem');
      } else {
        printSuccess('All costs are valid numbers');
      }
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
  console.error('Unhandled error in main function:', error);
  process.exit(1);
});
