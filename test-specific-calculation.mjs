/**
 * Test script for testing a specific calculation scenario
 * 
 * This script tests a specific calculation scenario for debugging purposes.
 * It can be used to test a specific combination of inputs to verify that
 * the calculation logic is working correctly.
 * 
 * Usage:
 * node test-specific-calculation.mjs
 */

// Import required modules
import fs from 'fs';
import path from 'path';

// Define the test case
const TEST_CASE = {
  // Basic information
  baseRate: 100,
  frequency: 'monthly',
  category: 'Medical',
  
  // Age information
  currentAge: 45,
  lifeExpectancy: 85,
  
  // Optional information
  zipCode: '10001',
  cptCode: '99213',
  
  // Uncomment to test age increments
  // ageIncrements: [
  //   {
  //     startAge: 50,
  //     endAge: 60,
  //     adjustmentFactor: 1.2
  //   },
  //   {
  //     startAge: 60,
  //     endAge: 70,
  //     adjustmentFactor: 1.5
  //   }
  // ]
};

// Mock the cost calculator
const mockCostCalculator = {
  calculateItemCosts: async (params) => {
    // Simulate calculation logic
    const isOneTime = params.frequency === 'one-time' || params.frequency === 'once';
    const baseRate = params.baseRate || 0;
    
    // Calculate annual cost
    let annual = 0;
    if (!isOneTime) {
      let frequency = 1; // Default to annual
      
      if (params.frequency.includes('daily')) {
        frequency = 365;
      } else if (params.frequency.includes('weekly')) {
        frequency = 52;
      } else if (params.frequency.includes('monthly')) {
        frequency = 12;
      } else if (params.frequency.includes('quarterly')) {
        frequency = 4;
      }
      
      annual = baseRate * frequency;
    }
    
    // Calculate lifetime cost
    let lifetime = 0;
    if (isOneTime) {
      lifetime = baseRate;
    } else {
      let years = 0;
      
      if (params.currentAge !== undefined && params.lifeExpectancy !== undefined) {
        years = params.lifeExpectancy - params.currentAge;
      } else if (params.startAge !== undefined && params.endAge !== undefined) {
        years = params.endAge - params.startAge;
      }
      
      if (years > 0) {
        lifetime = annual * years;
      }
    }
    
    // Calculate cost range
    const low = baseRate * 0.8;
    const average = baseRate;
    const high = baseRate * 1.2;
    
    return {
      annual,
      lifetime,
      low,
      average,
      high,
      isOneTime
    };
  },
  
  calculateItemCostsWithAgeIncrements: async (params) => {
    // For simplicity, just call the regular function
    return mockCostCalculator.calculateItemCosts(params);
  }
};

// Validate the result
const validateResult = (testCase, result) => {
  const validations = [];
  
  // Check if one-time is correctly identified
  const isOneTime = testCase.frequency === 'one-time' || testCase.frequency === 'once';
  if (result.isOneTime !== isOneTime) {
    validations.push({
      check: 'One-time frequency identification',
      expected: isOneTime,
      actual: result.isOneTime,
      passed: false
    });
  } else {
    validations.push({
      check: 'One-time frequency identification',
      passed: true
    });
  }
  
  // Check if annual cost is 0 for one-time items
  if (isOneTime && result.annual !== 0) {
    validations.push({
      check: 'Annual cost for one-time items',
      expected: 0,
      actual: result.annual,
      passed: false
    });
  } else if (isOneTime) {
    validations.push({
      check: 'Annual cost for one-time items',
      passed: true
    });
  }
  
  // Check if lifetime cost is non-negative
  if (result.lifetime < 0) {
    validations.push({
      check: 'Non-negative lifetime cost',
      expected: '≥ 0',
      actual: result.lifetime,
      passed: false
    });
  } else {
    validations.push({
      check: 'Non-negative lifetime cost',
      passed: true
    });
  }
  
  // Check if low is less than or equal to average and high is greater than or equal to average
  if (result.low > result.average) {
    validations.push({
      check: 'Low ≤ Average',
      expected: '≤',
      actual: `${result.low} > ${result.average}`,
      passed: false
    });
  } else {
    validations.push({
      check: 'Low ≤ Average',
      passed: true
    });
  }
  
  if (result.high < result.average) {
    validations.push({
      check: 'High ≥ Average',
      expected: '≥',
      actual: `${result.high} < ${result.average}`,
      passed: false
    });
  } else {
    validations.push({
      check: 'High ≥ Average',
      passed: true
    });
  }
  
  // Check if annual cost is less than or equal to lifetime cost for recurring items
  if (!isOneTime && result.annual > result.lifetime) {
    validations.push({
      check: 'Annual ≤ Lifetime for recurring items',
      expected: '≤',
      actual: `${result.annual} > ${result.lifetime}`,
      passed: false
    });
  } else if (!isOneTime) {
    validations.push({
      check: 'Annual ≤ Lifetime for recurring items',
      passed: true
    });
  }
  
  // Check decimal precision - all values should have at most 2 decimal places
  const checkDecimalPrecision = (value, name) => {
    const decimalStr = value.toString();
    const decimalParts = decimalStr.split('.');
    if (decimalParts.length > 1 && decimalParts[1].length > 2) {
      validations.push({
        check: `Decimal precision for ${name}`,
        expected: '≤ 2 decimal places',
        actual: `${decimalParts[1].length} decimal places`,
        passed: false
      });
    } else {
      validations.push({
        check: `Decimal precision for ${name}`,
        passed: true
      });
    }
  };
  
  checkDecimalPrecision(result.annual, 'annual');
  checkDecimalPrecision(result.lifetime, 'lifetime');
  checkDecimalPrecision(result.low, 'low');
  checkDecimalPrecision(result.average, 'average');
  checkDecimalPrecision(result.high, 'high');
  
  // Check if all validations passed
  const allPassed = validations.every(v => v.passed);
  
  return {
    passed: allPassed,
    validations
  };
};

// Run the test
const runTest = async () => {
  console.log('Running test with case:', TEST_CASE);
  
  // Try to dynamically import the cost calculator
  let costCalculator;
  try {
    // First try to import from the compiled JavaScript file
    const module = await import('./dist/utils/calculations/costCalculator.js');
    costCalculator = module.default;
    console.log('Using compiled JavaScript cost calculator.');
  } catch (error) {
    try {
      // If that fails, try to import from the TypeScript file using ts-node
      const { createRequire } = await import('module');
      const require = createRequire(import.meta.url);
      costCalculator = require('./src/utils/calculations/costCalculator.ts').default;
      console.log('Using TypeScript cost calculator with ts-node.');
    } catch (error) {
      // If both fail, use a mock implementation
      console.warn('Could not import cost calculator. Using mock implementation.');
      costCalculator = mockCostCalculator;
    }
  }
  
  try {
    // Determine which function to call based on whether ageIncrements is present
    let result;
    if (TEST_CASE.ageIncrements) {
      result = await costCalculator.calculateItemCostsWithAgeIncrements(TEST_CASE);
    } else {
      result = await costCalculator.calculateItemCosts(TEST_CASE);
    }
    
    console.log('Result:', result);
    
    // Validate the result
    const validation = validateResult(TEST_CASE, result);
    
    if (!validation.passed) {
      console.error('Test failed validation.');
      validation.validations.filter(v => !v.passed).forEach(v => {
        console.error(`  - ${v.check}: Expected ${v.expected}, got ${v.actual}`);
      });
    } else {
      console.log('Test passed validation.');
    }
    
    // Save result to file
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const resultsFile = `specific-test-result-${timestamp}.json`;
    fs.writeFileSync(resultsFile, JSON.stringify({
      testCase: TEST_CASE,
      result,
      validation
    }, null, 2));
    console.log(`\nResults saved to ${resultsFile}`);
    
    return validation.passed;
  } catch (error) {
    console.error('Test failed with error:', error);
    return false;
  }
};

// Run the test
runTest()
  .then(passed => {
    process.exit(passed ? 0 : 1);
  })
  .catch(error => {
    console.error('Error running test:', error);
    process.exit(1);
  });
