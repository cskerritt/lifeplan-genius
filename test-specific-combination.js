/**
 * Example script to test a specific combination of parameters
 * 
 * This script demonstrates how to test a specific combination of parameters
 * for the cost calculator, which can be useful for debugging or verifying
 * specific scenarios.
 * 
 * Usage:
 * node test-specific-combination.js
 */

import { default as costCalculator } from './src/utils/calculations/costCalculator.js';
import { default as frequencyParser } from './src/utils/calculations/frequencyParser.js';

// For ES modules, we need to use a different approach for mocking
// We'll manually mock the services instead of using jest.mock
/**
 * Example script to test a specific combination of parameters
 * 
 * This script demonstrates how to test a specific combination of parameters
 * for the cost calculator, which can be useful for debugging or verifying
 * specific scenarios.
 * 
 * Usage:
 * node test-specific-combination.js
 */

const costCalculator = require('./src/utils/calculations/costCalculator').default;
const frequencyParser = require('./src/utils/calculations/frequencyParser').default;

// Mock external services
jest.mock('./src/utils/calculations/services/geoFactorsService');
jest.mock('./src/utils/calculations/services/cptCodeService');

// Setup mocks
const setupMocks = () => {
  const geoFactorsService = require('./src/utils/calculations/services/geoFactorsService');
  const cptCodeService = require('./src/utils/calculations/services/cptCodeService');
  
  // Mock geo factors service
  geoFactorsService.fetchGeoFactors = jest.fn((zipCode) => {
    return Promise.resolve({
      mfr_factor: 1.2,
      pfr_factor: 1.3
    });
  });
  
  // Mock CPT code service
  cptCodeService.lookupCPTCode = jest.fn((cptCode) => {
    return Promise.resolve({
      code: cptCode,
      code_description: 'Test CPT Code',
      mfu_50th: 100,
      mfu_75th: 150,
      mfu_90th: 200,
      pfr_50th: 120,
      pfr_75th: 170,
      pfr_90th: 220
    });
  });
  
  cptCodeService.hasMfuData = jest.fn(() => true);
  cptCodeService.hasPfrData = jest.fn(() => true);
};

// Define test cases
const testCases = [
  {
    name: 'One-time physician evaluation',
    params: {
      baseRate: 100,
      frequency: 'one-time',
      category: 'physicianEvaluation',
      zipCode: '90210',
      cptCode: '99213'
    }
  },
  {
    name: 'Monthly therapy with age range',
    params: {
      baseRate: 150,
      frequency: 'monthly',
      category: 'therapyFollowUp',
      zipCode: '90210',
      startAge: 45,
      endAge: 75,
      cptCode: '97110'
    }
  },
  {
    name: 'Weekly medication with life expectancy',
    params: {
      baseRate: 50,
      frequency: 'weekly',
      category: 'medication',
      zipCode: '90210',
      currentAge: 45,
      lifeExpectancy: 85
    }
  },
  {
    name: 'Age increments with different frequencies',
    params: {
      baseRate: 200,
      frequency: 'varies by age',
      category: 'homeCare',
      zipCode: '90210',
      ageIncrements: [
        { startAge: 45, endAge: 55, frequency: 'monthly', isOneTime: false },
        { startAge: 55, endAge: 65, frequency: 'weekly', isOneTime: false },
        { startAge: 65, endAge: 75, frequency: 'daily', isOneTime: false }
      ]
    }
  }
];

// Run the tests
const runTests = async () => {
  setupMocks();
  
  console.log('Testing specific combinations of parameters...\n');
  
  for (const testCase of testCases) {
    console.log(`Testing: ${testCase.name}`);
    console.log('Parameters:', JSON.stringify(testCase.params, null, 2));
    
    try {
      // Determine which function to call based on whether ageIncrements is present
      let result;
      if (testCase.params.ageIncrements) {
        result = await costCalculator.calculateItemCostsWithAgeIncrements(testCase.params);
      } else {
        result = await costCalculator.calculateItemCosts(testCase.params);
      }
      
      // Parse the frequency for validation
      let parsedFrequency;
      if (testCase.params.frequency && !testCase.params.ageIncrements) {
        parsedFrequency = frequencyParser.parseFrequency(testCase.params.frequency);
      }
      
      // Print the results
      console.log('\nResults:');
      console.log(`  Annual Cost: $${result.annual.toFixed(2)}`);
      console.log(`  Lifetime Cost: $${result.lifetime.toFixed(2)}`);
      console.log(`  Cost Range: $${result.low.toFixed(2)} - $${result.high.toFixed(2)}`);
      console.log(`  Average Cost: $${result.average.toFixed(2)}`);
      console.log(`  One-Time: ${result.isOneTime}`);
      
      // Validate the results
      let validationErrors = [];
      
      // Check if one-time is correctly identified
      if (parsedFrequency && parsedFrequency.isOneTime !== result.isOneTime) {
        validationErrors.push(`One-time flag mismatch: expected ${parsedFrequency.isOneTime}, got ${result.isOneTime}`);
      }
      
      // Check if annual cost is 0 for one-time items
      if (result.isOneTime && result.annual !== 0) {
        validationErrors.push(`Annual cost should be 0 for one-time items, got ${result.annual}`);
      }
      
      // Check if lifetime cost is greater than 0 for non-zero base rate
      if (result.lifetime <= 0 && testCase.params.baseRate > 0) {
        validationErrors.push(`Lifetime cost should be greater than 0 for non-zero base rate, got ${result.lifetime}`);
      }
      
      // Check if low is less than average and high is greater than average
      if (result.low > result.average || result.high < result.average) {
        validationErrors.push(`Cost range is invalid: low (${result.low}) should be <= average (${result.average}) <= high (${result.high})`);
      }
      
      if (validationErrors.length > 0) {
        console.log('\nValidation Errors:');
        validationErrors.forEach(error => console.log(`  - ${error}`));
      } else {
        console.log('\nValidation: PASSED');
      }
    } catch (error) {
      console.error(`\nError: ${error.message}`);
    }
    
    console.log('\n' + '-'.repeat(80) + '\n');
  }
};

// Run the tests
runTests()
  .then(() => {
    console.log('All tests completed.');
  })
  .catch(error => {
    console.error('Error running tests:', error);
  });
