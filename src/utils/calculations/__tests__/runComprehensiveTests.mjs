/**
 * Script to run comprehensive tests for cost calculations
 * 
 * This script uses the test data generator to create test cases and runs them
 * through the cost calculator to verify that there are no bugs or errors.
 * 
 * Usage:
 * node runComprehensiveTests.mjs
 */

import { generateTestCombinations, generateRepresentativeTestCombinations } from './testDataGenerator.js';
import costCalculator from '../costCalculator.js';

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
 * Run tests for a subset of combinations
 */
export const runTests = async (useAllCombinations = false) => {
  setupMocks();
  
  console.log('Running comprehensive tests for cost calculations...');
  
  // Get test combinations
  const testCases = useAllCombinations 
    ? generateTestCombinations() 
    : generateRepresentativeTestCombinations();
  
  console.log(`Testing ${testCases.length} combinations...`);
  
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];
  
  // Run tests
  for (const testCase of testCases) {
    try {
      console.log(`Testing: ${testCase.name}`);
      
      // Determine which function to call based on whether ageIncrements is present
      let result;
      if (testCase.params.ageIncrements) {
        result = await costCalculator.calculateItemCostsWithAgeIncrements(testCase.params);
      } else {
        result = await costCalculator.calculateItemCosts(testCase.params);
      }
      
      // Basic validation
      if (result.annual === undefined || result.lifetime === undefined || 
          result.low === undefined || result.high === undefined || 
          result.average === undefined || result.isOneTime === undefined) {
        throw new Error('Missing required properties in result');
      }
      
      // Check if one-time is correctly identified
      if (testCase.params.frequency && 
          (testCase.params.frequency.includes('one-time') || testCase.params.frequency === 'once') && 
          !result.isOneTime) {
        throw new Error('One-time frequency not correctly identified');
      }
      
      // Check if annual cost is 0 for one-time items
      if (result.isOneTime && result.annual !== 0) {
        throw new Error('Annual cost should be 0 for one-time items');
      }
      
      // Check if lifetime cost is greater than 0
      if (result.lifetime <= 0 && testCase.params.baseRate > 0) {
        throw new Error('Lifetime cost should be greater than 0 for non-zero base rate');
      }
      
      // Check if low is less than average and high is greater than average
      if (result.low > result.average || result.high < result.average) {
        throw new Error('Cost range is invalid: low should be <= average <= high');
      }
      
      passedTests++;
    } catch (error) {
      failedTests++;
      failures.push({
        testCase,
        error: error.message
      });
      console.error(`  Failed: ${error.message}`);
    }
  }
  
  // Print results
  console.log('\nTest Results:');
  console.log(`  Passed: ${passedTests}`);
  console.log(`  Failed: ${failedTests}`);
  console.log(`  Total: ${testCases.length}`);
  
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach((failure, index) => {
      console.log(`\n${index + 1}. ${failure.testCase.name}`);
      console.log(`   Error: ${failure.error}`);
      console.log(`   Params: ${JSON.stringify(failure.testCase.params, null, 2)}`);
    });
  }
  
  return {
    passedTests,
    failedTests,
    total: testCases.length,
    failures
  };
};

// Run the tests if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const useAllCombinations = args.includes('--all');
  
  runTests(useAllCombinations)
    .then(results => {
      process.exit(results.failedTests > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Error running tests:', error);
      process.exit(1);
    });
}
