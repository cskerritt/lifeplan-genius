/**
 * Golden Master Testing for Cost Calculations
 * 
 * This module implements golden master testing for the cost calculation system.
 * It stores known good calculation results and compares future calculations
 * against these golden masters to detect regressions.
 * 
 * Usage:
 * node goldenMasterTesting.mjs [--generate] [--verify]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import costCalculator from '../costCalculator.js';
import Decimal from 'decimal.js';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the golden master data file
const GOLDEN_MASTER_PATH = path.join(__dirname, 'goldenMasterData.json');

// Mock functions for external services
const mockGeoFactorsService = {
  fetchGeoFactors: async (zipCode) => {
    if (zipCode === '00000') {
      return null; // Invalid ZIP
    }
    return {
      mfr_factor: 1.2,
      pfr_factor: 1.3
    };
  }
};

const mockCptCodeService = {
  lookupCPTCode: async (cptCode) => {
    if (!cptCode || cptCode === 'invalid') {
      return null;
    }
    return {
      code: cptCode,
      code_description: 'Test CPT Code',
      mfu_50th: 100,
      mfu_75th: 150,
      mfu_90th: 200,
      pfr_50th: 120,
      pfr_75th: 170,
      pfr_90th: 220
    };
  },
  hasMfuData: (cptCode) => {
    return cptCode !== 'no-mfu';
  },
  hasPfrData: (cptCode) => {
    return cptCode !== 'no-pfr';
  }
};

// Setup mocks
const setupMocks = () => {
  // Override the services in the costCalculator
  costCalculator.fetchGeoFactors = mockGeoFactorsService.fetchGeoFactors;
  costCalculator.lookupCPTCode = mockCptCodeService.lookupCPTCode;
  costCalculator.hasMfuData = mockCptCodeService.hasMfuData;
  costCalculator.hasPfrData = mockCptCodeService.hasPfrData;
};

/**
 * Define a set of critical test cases that cover important calculation scenarios
 */
const getCriticalTestCases = () => {
  return [
    // One-time costs
    {
      name: 'One-time medical expense',
      params: {
        baseRate: 1000,
        frequency: 'one-time',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85
      }
    },
    {
      name: 'One-time equipment purchase',
      params: {
        baseRate: 5000,
        frequency: 'once',
        category: 'Equipment',
        zipCode: '90210',
        startAge: 50,
        endAge: 50
      }
    },
    
    // Recurring costs
    {
      name: 'Daily medication',
      params: {
        baseRate: 10,
        frequency: 'daily',
        category: 'Medications',
        zipCode: '60601',
        currentAge: 30,
        lifeExpectancy: 85
      }
    },
    {
      name: 'Weekly therapy',
      params: {
        baseRate: 150,
        frequency: '2x weekly',
        category: 'Therapy',
        zipCode: '10001',
        startAge: 45,
        endAge: 65
      }
    },
    {
      name: 'Monthly doctor visit',
      params: {
        baseRate: 200,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '90210',
        currentAge: 60,
        lifeExpectancy: 85,
        cptCode: '99213'
      }
    },
    {
      name: 'Quarterly follow-up',
      params: {
        baseRate: 300,
        frequency: 'quarterly',
        category: 'Medical',
        zipCode: '60601',
        startAge: 40,
        endAge: 80
      }
    },
    {
      name: 'Annual checkup',
      params: {
        baseRate: 500,
        frequency: 'annually',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 35,
        lifeExpectancy: 85,
        cptCode: '99213'
      }
    },
    
    // Edge cases
    {
      name: 'Zero base rate',
      params: {
        baseRate: 0,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85
      }
    },
    {
      name: 'Very small base rate',
      params: {
        baseRate: 0.01,
        frequency: 'daily',
        category: 'Medications',
        zipCode: '90210',
        currentAge: 30,
        lifeExpectancy: 85
      }
    },
    {
      name: 'Very large base rate',
      params: {
        baseRate: 100000,
        frequency: 'annually',
        category: 'Medical',
        zipCode: '60601',
        currentAge: 50,
        lifeExpectancy: 85
      }
    },
    {
      name: 'Invalid ZIP code',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '00000',
        currentAge: 45,
        lifeExpectancy: 85
      }
    },
    {
      name: 'No ZIP code',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        currentAge: 45,
        lifeExpectancy: 85
      }
    },
    {
      name: 'Invalid CPT code',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85,
        cptCode: 'invalid'
      }
    },
    {
      name: 'No CPT code',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85,
        cptCode: null
      }
    },
    {
      name: 'No MFU data',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85,
        cptCode: 'no-mfu'
      }
    },
    {
      name: 'No PFR data',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        currentAge: 45,
        lifeExpectancy: 85,
        cptCode: 'no-pfr'
      }
    },
    {
      name: 'Start age equals end age',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        startAge: 45,
        endAge: 45
      }
    },
    {
      name: 'Start age greater than end age',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        startAge: 60,
        endAge: 45
      }
    },
    {
      name: 'Start age greater than life expectancy',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        startAge: 90,
        lifeExpectancy: 85
      }
    },
    
    // Age increments
    {
      name: 'Age increments - standard',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        ageIncrements: [
          { startAge: 30, endAge: 50, adjustmentFactor: 1.0 },
          { startAge: 51, endAge: 70, adjustmentFactor: 1.2 },
          { startAge: 71, endAge: 85, adjustmentFactor: 1.5 }
        ]
      }
    },
    {
      name: 'Age increments - with gaps',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        ageIncrements: [
          { startAge: 30, endAge: 50, adjustmentFactor: 1.0 },
          // Gap between 50 and 60
          { startAge: 60, endAge: 85, adjustmentFactor: 1.5 }
        ]
      }
    },
    {
      name: 'Age increments - with overlaps',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        ageIncrements: [
          { startAge: 30, endAge: 60, adjustmentFactor: 1.0 },
          // Overlap between 50 and 60
          { startAge: 50, endAge: 85, adjustmentFactor: 1.5 }
        ]
      }
    },
    {
      name: 'Age increments - mixed frequencies',
      params: {
        baseRate: 100,
        frequency: 'monthly',
        category: 'Medical',
        zipCode: '10001',
        ageIncrements: [
          { startAge: 30, endAge: 50, adjustmentFactor: 1.0, frequency: 'monthly' },
          { startAge: 51, endAge: 70, adjustmentFactor: 1.2, frequency: 'quarterly' },
          { startAge: 71, endAge: 85, adjustmentFactor: 1.5, frequency: 'one-time' }
        ]
      }
    }
  ];
};

/**
 * Generate golden master data by running calculations for critical test cases
 */
const generateGoldenMasterData = async () => {
  setupMocks();
  
  console.log('Generating golden master data...');
  
  const testCases = getCriticalTestCases();
  const goldenMasterData = [];
  
  for (const testCase of testCases) {
    console.log(`Processing: ${testCase.name}`);
    
    try {
      // Determine which function to call based on whether ageIncrements is present
      let result;
      if (testCase.params.ageIncrements) {
        result = await costCalculator.calculateItemCostsWithAgeIncrements(testCase.params);
      } else {
        result = await costCalculator.calculateItemCosts(testCase.params);
      }
      
      // Store the test case and result
      goldenMasterData.push({
        testCase,
        result: {
          annual: result.annual,
          lifetime: result.lifetime,
          low: result.low,
          high: result.high,
          average: result.average,
          isOneTime: result.isOneTime,
          // Only include these if they exist
          ...(result.mfrCosts && { mfrCosts: result.mfrCosts }),
          ...(result.pfrCosts && { pfrCosts: result.pfrCosts }),
          ...(result.adjustedMfrCosts && { adjustedMfrCosts: result.adjustedMfrCosts }),
          ...(result.adjustedPfrCosts && { adjustedPfrCosts: result.adjustedPfrCosts })
        }
      });
    } catch (error) {
      console.error(`Error processing ${testCase.name}:`, error);
      // Store the error case
      goldenMasterData.push({
        testCase,
        error: error.message
      });
    }
  }
  
  // Write the golden master data to a file
  fs.writeFileSync(GOLDEN_MASTER_PATH, JSON.stringify(goldenMasterData, null, 2));
  
  console.log(`Golden master data generated and saved to ${GOLDEN_MASTER_PATH}`);
  return goldenMasterData;
};

/**
 * Compare two numeric values with a tolerance for floating-point differences
 */
const areNumbersEqual = (a, b, tolerance = 0.001) => {
  if (a === b) return true;
  if (a === 0) return Math.abs(b) < tolerance;
  if (b === 0) return Math.abs(a) < tolerance;
  return Math.abs((a - b) / Math.max(Math.abs(a), Math.abs(b))) < tolerance;
};

/**
 * Compare two calculation results
 */
const areResultsEqual = (expected, actual) => {
  if (expected.isOneTime !== actual.isOneTime) {
    return {
      equal: false,
      differences: ['isOneTime']
    };
  }
  
  const differences = [];
  
  // Compare numeric values with tolerance
  if (!areNumbersEqual(expected.annual, actual.annual)) {
    differences.push('annual');
  }
  
  if (!areNumbersEqual(expected.lifetime, actual.lifetime)) {
    differences.push('lifetime');
  }
  
  if (!areNumbersEqual(expected.low, actual.low)) {
    differences.push('low');
  }
  
  if (!areNumbersEqual(expected.average, actual.average)) {
    differences.push('average');
  }
  
  if (!areNumbersEqual(expected.high, actual.high)) {
    differences.push('high');
  }
  
  // Compare nested objects if they exist
  const compareNestedObject = (expectedObj, actualObj, prefix) => {
    if (expectedObj && actualObj) {
      if (!areNumbersEqual(expectedObj.low, actualObj.low)) {
        differences.push(`${prefix}.low`);
      }
      
      if (!areNumbersEqual(expectedObj.average, actualObj.average)) {
        differences.push(`${prefix}.average`);
      }
      
      if (!areNumbersEqual(expectedObj.high, actualObj.high)) {
        differences.push(`${prefix}.high`);
      }
    } else if (expectedObj && !actualObj) {
      differences.push(`${prefix} missing`);
    } else if (!expectedObj && actualObj) {
      differences.push(`${prefix} unexpected`);
    }
  };
  
  compareNestedObject(expected.mfrCosts, actual.mfrCosts, 'mfrCosts');
  compareNestedObject(expected.pfrCosts, actual.pfrCosts, 'pfrCosts');
  compareNestedObject(expected.adjustedMfrCosts, actual.adjustedMfrCosts, 'adjustedMfrCosts');
  compareNestedObject(expected.adjustedPfrCosts, actual.adjustedPfrCosts, 'adjustedPfrCosts');
  
  return {
    equal: differences.length === 0,
    differences
  };
};

/**
 * Verify calculations against golden master data
 */
const verifyAgainstGoldenMaster = async () => {
  setupMocks();
  
  console.log('Verifying calculations against golden master data...');
  
  // Check if golden master data exists
  if (!fs.existsSync(GOLDEN_MASTER_PATH)) {
    console.error('Golden master data not found. Run with --generate first.');
    return {
      success: false,
      error: 'Golden master data not found'
    };
  }
  
  // Load golden master data
  const goldenMasterData = JSON.parse(fs.readFileSync(GOLDEN_MASTER_PATH, 'utf8'));
  
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];
  
  for (const [index, entry] of goldenMasterData.entries()) {
    const { testCase, result: expectedResult, error: expectedError } = entry;
    
    console.log(`Verifying: ${testCase.name}`);
    
    try {
      // Determine which function to call based on whether ageIncrements is present
      let actualResult;
      if (testCase.params.ageIncrements) {
        actualResult = await costCalculator.calculateItemCostsWithAgeIncrements(testCase.params);
      } else {
        actualResult = await costCalculator.calculateItemCosts(testCase.params);
      }
      
      if (expectedError) {
        // We expected an error but got a result
        failedTests++;
        failures.push({
          testCase,
          expected: { error: expectedError },
          actual: { result: actualResult },
          message: 'Expected an error but got a result'
        });
        console.error(`  Failed: Expected an error but got a result`);
      } else {
        // Compare the actual result with the expected result
        const comparison = areResultsEqual(expectedResult, actualResult);
        
        if (comparison.equal) {
          passedTests++;
        } else {
          failedTests++;
          failures.push({
            testCase,
            expected: expectedResult,
            actual: actualResult,
            differences: comparison.differences
          });
          console.error(`  Failed: Differences in ${comparison.differences.join(', ')}`);
        }
      }
    } catch (error) {
      if (expectedError) {
        // We expected an error and got one
        // Note: We don't compare error messages as they might change
        passedTests++;
      } else {
        // We expected a result but got an error
        failedTests++;
        failures.push({
          testCase,
          expected: { result: expectedResult },
          actual: { error: error.message },
          message: 'Expected a result but got an error'
        });
        console.error(`  Failed: Expected a result but got an error: ${error.message}`);
      }
    }
  }
  
  // Print results
  console.log('\nVerification Results:');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Total: ${goldenMasterData.length}`);
  
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.testCase.name}`);
      
      if (failure.message) {
        console.log(`   ${failure.message}`);
      } else {
        console.log(`   Differences in: ${failure.differences.join(', ')}`);
        console.log(`   Expected: ${JSON.stringify(failure.expected, null, 2)}`);
        console.log(`   Actual: ${JSON.stringify(failure.actual, null, 2)}`);
      }
    });
  }
  
  return {
    success: failedTests === 0,
    passedTests,
    failedTests,
    total: goldenMasterData.length,
    failures
  };
};

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    generate: false,
    verify: false
  };
  
  args.forEach(arg => {
    if (arg === '--generate') {
      options.generate = true;
    } else if (arg === '--verify') {
      options.verify = true;
    }
  });
  
  // Default to verify if no options specified
  if (!options.generate && !options.verify) {
    options.verify = true;
  }
  
  return options;
};

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const options = parseArgs();
  
  if (options.generate) {
    generateGoldenMasterData()
      .then(() => {
        console.log('Golden master data generation complete.');
        
        // If verify is also specified, run verification
        if (options.verify) {
          return verifyAgainstGoldenMaster();
        }
      })
      .then(results => {
        if (results) {
          process.exit(results.success ? 0 : 1);
        } else {
          process.exit(0);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  } else if (options.verify) {
    verifyAgainstGoldenMaster()
      .then(results => {
        process.exit(results.success ? 0 : 1);
      })
      .catch(error => {
        console.error('Error:', error);
        process.exit(1);
      });
  }
}

export {
  generateGoldenMasterData,
  verifyAgainstGoldenMaster
};
