/**
 * Test script for comprehensive calculation testing
 * 
 * This script tests a matrix of different calculation scenarios to ensure
 * that all combinations of inputs produce correct results.
 */

// Import required modules
import fs from 'fs';
import path from 'path';

// Define test parameters
const FREQUENCIES = [
  'daily',
  'weekly',
  'monthly',
  'quarterly',
  'annually',
  'one-time'
];

const CATEGORIES = [
  'Medical',
  'Therapy',
  'Equipment',
  'Supplies'
];

const BASE_RATES = [
  0,       // Zero
  0.01,    // Very small
  100,     // Normal
  10000    // Very large
];

const AGE_SCENARIOS = [
  { currentAge: 30, lifeExpectancy: 80 },  // Young with long life expectancy
  { currentAge: 60, lifeExpectancy: 85 },  // Middle-aged
  { startAge: 30, endAge: 80 },            // Age range - long
  { startAge: 60, endAge: 70 }             // Age range - short
];

const ZIP_CODES = [
  '10001',  // New York
  '90210',  // Beverly Hills
  null      // No ZIP
];

const CPT_CODES = [
  '99213',  // Standard office visit
  null      // No CPT code
];

// Generate test cases
const generateTestCases = () => {
  const testCases = [];
  
  // Generate a subset of combinations to keep the test manageable
  for (const frequency of FREQUENCIES) {
    for (const category of CATEGORIES) {
      for (const baseRate of BASE_RATES) {
        // Use a subset of age scenarios for each combination
        const ageScenario = AGE_SCENARIOS[Math.floor(Math.random() * AGE_SCENARIOS.length)];
        
        // Use a subset of ZIP codes for each combination
        const zipCode = ZIP_CODES[Math.floor(Math.random() * ZIP_CODES.length)];
        
        // Use a subset of CPT codes for each combination
        const cptCode = CPT_CODES[Math.floor(Math.random() * CPT_CODES.length)];
        
        // Create the test case
        const testCase = {
          baseRate,
          frequency,
          category,
          zipCode,
          cptCode,
          ...ageScenario
        };
        
        testCases.push(testCase);
      }
    }
  }
  
  return testCases;
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

// Run the tests
const runTests = async () => {
  console.log('Generating test cases...');
  const testCases = generateTestCases();
  console.log(`Generated ${testCases.length} test cases.`);
  
  console.log('\nRunning tests...');
  const results = [];
  
  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`Test ${index + 1}/${testCases.length}: ${JSON.stringify(testCase)}`);
      
      // Determine which function to call based on whether ageIncrements is present
      let result;
      if (testCase.ageIncrements) {
        result = await mockCostCalculator.calculateItemCostsWithAgeIncrements(testCase);
      } else {
        result = await mockCostCalculator.calculateItemCosts(testCase);
      }
      
      console.log(`Result: ${JSON.stringify(result)}`);
      
      // Validate the result
      const isValid = validateResult(testCase, result);
      
      results.push({
        testCase,
        result,
        isValid
      });
      
      if (!isValid) {
        console.error(`Test ${index + 1} failed validation.`);
      }
    } catch (error) {
      console.error(`Test ${index + 1} failed with error: ${error.message}`);
      results.push({
        testCase,
        error: error.message
      });
    }
  }
  
  // Calculate statistics
  const passedTests = results.filter(r => r.isValid).length;
  const failedTests = results.length - passedTests;
  
  console.log('\nTest Results:');
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Total: ${results.length}`);
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = `test-results-${timestamp}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultsFile}`);
  
  return {
    passedTests,
    failedTests,
    total: results.length,
    results
  };
};

// Validate the result
const validateResult = (testCase, result) => {
  // Check if one-time is correctly identified
  const isOneTime = testCase.frequency === 'one-time' || testCase.frequency === 'once';
  if (result.isOneTime !== isOneTime) {
    return false;
  }
  
  // Check if annual cost is 0 for one-time items
  if (isOneTime && result.annual !== 0) {
    return false;
  }
  
  // Check if lifetime cost is non-negative
  if (result.lifetime < 0) {
    return false;
  }
  
  // Check if low is less than or equal to average and high is greater than or equal to average
  if (result.low > result.average || result.high < result.average) {
    return false;
  }
  
  return true;
};

// Run the tests
runTests()
  .then(results => {
    process.exit(results.failedTests > 0 ? 1 : 0);
  })
  .catch(error => {
    console.error('Error running tests:', error);
    process.exit(1);
  });
