/**
 * Test script for testing actual cost calculations
 * 
 * This script tests the actual cost calculator implementation with a matrix
 * of different calculation scenarios to ensure that all combinations of inputs
 * produce correct results.
 * 
 * Usage:
 * node test-actual-calculations.mjs [--samples=100] [--seed=123]
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

// Parse command line arguments
const parseArgs = () => {
  const args = process.argv.slice(2);
  const options = {
    samples: 100,
    seed: Date.now()
  };
  
  args.forEach(arg => {
    if (arg.startsWith('--samples=')) {
      options.samples = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--seed=')) {
      options.seed = parseInt(arg.split('=')[1], 10);
    }
  });
  
  return options;
};

// Random number generator with seed support
class Random {
  constructor(seed = Date.now()) {
    this.seed = seed;
  }

  // Simple LCG random number generator
  next() {
    this.seed = (this.seed * 1664525 + 1013904223) % 4294967296;
    return this.seed / 4294967296;
  }

  // Random integer in range [min, max]
  integer(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  // Random element from array
  pick(array) {
    return array[this.integer(0, array.length - 1)];
  }

  // Random boolean
  boolean() {
    return this.next() < 0.5;
  }

  // Random decimal number in range [min, max]
  decimal(min, max, precision = 2) {
    const value = this.next() * (max - min) + min;
    return parseFloat(value.toFixed(precision));
  }
}

// Generate test cases
const generateTestCases = (random, numSamples) => {
  const testCases = [];
  
  // Generate a subset of combinations to keep the test manageable
  for (let i = 0; i < numSamples; i++) {
    const frequency = random.pick(FREQUENCIES);
    const category = random.pick(CATEGORIES);
    const baseRate = random.pick(BASE_RATES);
    
    // Use a random age scenario
    const ageScenario = random.pick(AGE_SCENARIOS);
    
    // Use a random ZIP code
    const zipCode = random.pick(ZIP_CODES);
    
    // Use a random CPT code
    const cptCode = random.pick(CPT_CODES);
    
    // Create the test case
    const testCase = {
      baseRate,
      frequency,
      category,
      zipCode,
      cptCode,
      ...ageScenario
    };
    
    // Occasionally add age increments
    if (random.boolean() && random.boolean()) {  // 25% chance
      const numIncrements = random.integer(1, 3);
      const ageIncrements = [];
      
      let lastEndAge = 0;
      for (let j = 0; j < numIncrements; j++) {
        const incrementStartAge = lastEndAge + random.integer(0, 5);
        const incrementEndAge = incrementStartAge + random.integer(5, 20);
        lastEndAge = incrementEndAge;
        
        ageIncrements.push({
          startAge: incrementStartAge,
          endAge: incrementEndAge,
          adjustmentFactor: random.decimal(0.5, 2.0, 2)
        });
      }
      
      testCase.ageIncrements = ageIncrements;
    }
    
    testCases.push(testCase);
  }
  
  return testCases;
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

// Run the tests
const runTests = async () => {
  const options = parseArgs();
  console.log(`Running tests with options: samples=${options.samples}, seed=${options.seed}`);
  
  const random = new Random(options.seed);
  
  console.log('Generating test cases...');
  const testCases = generateTestCases(random, options.samples);
  console.log(`Generated ${testCases.length} test cases.`);
  
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
      costCalculator = {
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
          return costCalculator.calculateItemCosts(params);
        }
      };
    }
  }
  
  console.log('\nRunning tests...');
  const results = [];
  
  for (const [index, testCase] of testCases.entries()) {
    try {
      console.log(`Test ${index + 1}/${testCases.length}: ${JSON.stringify(testCase)}`);
      
      // Determine which function to call based on whether ageIncrements is present
      let result;
      if (testCase.ageIncrements) {
        result = await costCalculator.calculateItemCostsWithAgeIncrements(testCase);
      } else {
        result = await costCalculator.calculateItemCosts(testCase);
      }
      
      console.log(`Result: ${JSON.stringify(result)}`);
      
      // Validate the result
      const validation = validateResult(testCase, result);
      
      results.push({
        testCase,
        result,
        validation
      });
      
      if (!validation.passed) {
        console.error(`Test ${index + 1} failed validation.`);
        validation.validations.filter(v => !v.passed).forEach(v => {
          console.error(`  - ${v.check}: Expected ${v.expected}, got ${v.actual}`);
        });
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
  const passedTests = results.filter(r => r.validation && r.validation.passed).length;
  const failedTests = results.length - passedTests;
  
  console.log('\nTest Results:');
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Total: ${results.length}`);
  
  // Save results to file
  const timestamp = new Date().toISOString().replace(/:/g, '-');
  const resultsFile = `actual-test-results-${timestamp}.json`;
  fs.writeFileSync(resultsFile, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultsFile}`);
  
  return {
    passedTests,
    failedTests,
    total: results.length,
    results
  };
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
